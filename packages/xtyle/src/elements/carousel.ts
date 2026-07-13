import { XtyleDecoratorElement, define } from "./base.js";
import { renderIcon } from "../icons.js";
import type { CarouselTransition, CarouselDirection } from "../vocab.js";

const DEFAULT_INTERVAL = 5000;
const SETTLE_MS = 600;

/**
 * A scroll-snap carousel of slotted slides. It is a standalone light-DOM element
 * (like `table`): the slides are the consumer's own children, decorated in place
 * rather than projected through a shadow slot, so framework content stays live.
 * The native scroll-snap track works with no JavaScript; the prev/next controls,
 * the pagination dots, the keyboard nav, and autoplay are enhancements wired only
 * when the runtime is present.
 */
export class XtyleCarousel extends XtyleDecoratorElement {
	static get observedAttributes(): string[] {
		return ["label", "autoplay", "interval", "loop"];
	}

	private controller: AbortController | null = null;
	private observer: IntersectionObserver | null = null;
	private autoplayTimer = 0;
	private settleTimer = 0;
	// Suppresses the observer's index writes while a programmatic scroll is in flight, so a
	// fast click-through doesn't flutter the active dot as the smooth scroll passes intermediate slides.
	private programmatic = false;
	private mq = typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : null;
	private index = 0;
	private slides: HTMLElement[] = [];
	private track: HTMLElement | null = null;
	private dotEls: HTMLButtonElement[] = [];
	private prevBtn: HTMLButtonElement | null = null;
	private nextBtn: HTMLButtonElement | null = null;
	// The user's explicit pause intent (via the play/pause toggle), distinct from the transient
	// hover/focus pause, so resuming on pointer-leave never overrides a deliberate pause.
	private paused = false;
	private playToggle: HTMLButtonElement | null = null;
	// A polite live region announcing the current slide, so a screen reader hears the change even
	// though scrolling (or a stacked cross-fade) never moves focus.
	private liveEl: HTMLElement | null = null;
	private announcedIndex = 0;
	// Seam clones for the smooth infinite loop: inert copies of the first/last slide sitting just past
	// each end, so advancing off an end scrolls into a look-alike and then silently snaps to the real
	// slide. `pendingSeam` holds the real scroll offset to snap to once the seam scroll settles.
	private leadingClone: HTMLElement | null = null;
	private trailingClone: HTMLElement | null = null;
	private hasClones = false;
	private pendingSeam: number | null = null;

	get label(): string {
		return this.getAttribute("label") ?? "";
	}
	set label(value: string) {
		this.setAttribute("label", value);
	}

	get autoplay(): boolean {
		return this.hasAttribute("autoplay");
	}
	set autoplay(value: boolean) {
		this.toggleAttribute("autoplay", value);
	}

	get interval(): number {
		const raw = Number(this.getAttribute("interval"));
		return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_INTERVAL;
	}
	set interval(value: number) {
		this.setAttribute("interval", String(value));
	}

	get loop(): boolean {
		return this.hasAttribute("loop");
	}
	set loop(value: boolean) {
		this.toggleAttribute("loop", value);
	}

	/** Where the prev/next arrows sit: `bar` (default, below the track), `overlay` (on the slides,
	 * left/right edges), or `none`. */
	get controlsMode(): "bar" | "overlay" | "none" {
		const value = this.getAttribute("controls");
		if (value === "false") return "none";
		if (value === "overlay") return "overlay";
		return "bar";
	}

	get controls(): boolean {
		return this.controlsMode !== "none";
	}

	get dots(): boolean {
		return this.getAttribute("dots") !== "false";
	}

	/** Whether hovering or focusing the carousel pauses autoplay (default true). Set `false` for a
	 * decorative carousel that should keep cycling under the pointer, e.g. an Image hover-preview. */
	get pauseOnHover(): boolean {
		return this.getAttribute("pause-on-hover") !== "false";
	}

	get transition(): CarouselTransition {
		const raw = this.getAttribute("transition");
		return raw === "fade" || raw === "scale" || raw === "flip" ? raw : "slide";
	}

	/** A stacked transition (`fade` / `scale` / `flip`) overlays the slides and cross-fades the active
	 * one, rather than scrolling a track; it has no scroll, no seam clones, and no scroll observer. */
	private get stacked(): boolean {
		return this.transition !== "slide";
	}

	get direction(): CarouselDirection {
		const raw = this.getAttribute("direction");
		return raw === "left" || raw === "up" || raw === "down" ? raw : "right";
	}

	/** `up` / `down` scroll a vertical track; `right` / `left` a horizontal one. The reverse sense
	 * (`left` / `up`) is pure CSS (a `*-reverse` flex track), so the scroll math stays offset-based. */
	private get vertical(): boolean {
		return this.direction === "up" || this.direction === "down";
	}

	/** The active scroll offset of a slide along the track's axis. */
	private offsetOf(el: HTMLElement): number {
		return this.vertical ? el.offsetTop : el.offsetLeft;
	}

	/** Scroll the track to an axis offset. */
	private scrollTrackTo(offset: number, behavior: ScrollBehavior): void {
		this.track?.scrollTo(this.vertical ? { top: offset, behavior } : { left: offset, behavior });
	}

	/** The prev/next chevron glyphs, pointed along the track's axis and sense: `next` points the way the
	 * content advances (so a vertical or reversed carousel's arrows never contradict its motion). */
	private get chevrons(): { prev: string; next: string } {
		const opposite = { right: "left", left: "right", up: "down", down: "up" } as const;
		return { next: `chevron-${this.direction}`, prev: `chevron-${opposite[this.direction]}` };
	}

	/** The track's current scroll position along its axis. */
	private get trackScroll(): number {
		if (!this.track) return 0;
		return this.vertical ? this.track.scrollTop : this.track.scrollLeft;
	}
	private set trackScroll(value: number) {
		if (!this.track) return;
		if (this.vertical) this.track.scrollTop = value;
		else this.track.scrollLeft = value;
	}

	connectedCallback(): void {
		super.connectedCallback();
		if (!this.querySelector(":scope > .xtyle-carousel__viewport")) this.enhance();
	}

	override disconnectedCallback(): void {
		super.disconnectedCallback();
		this.teardown();
	}

	attributeChangedCallback(name: string): void {
		if (name === "label") {
			this.setAttribute("aria-label", this.label || "Carousel");
			this.track?.setAttribute("aria-label", this.label || "Carousel");
		} else if (this.hasAttribute("data-enhanced")) {
			this.syncAutoplay();
		}
	}

	private get reducedMotion(): boolean {
		return this.mq?.matches ?? false;
	}

	private get firstSlide(): HTMLElement | undefined {
		return this.slides[0];
	}

	private get lastSlide(): HTMLElement | undefined {
		return this.slides[this.slides.length - 1];
	}

	private get lastIndex(): number {
		return this.slides.length - 1;
	}

	/** Scroll to a real slide by index and mark it active. */
	private snapToIndex(index: number, behavior: ScrollBehavior): void {
		const slide = this.slides[index];
		if (!slide || !this.track) return;
		this.scrollTrackTo(this.offsetOf(slide), behavior);
		this.index = index;
		this.update();
	}

	private enhance(): void {
		const slides = Array.from(this.children).filter((n): n is HTMLElement => n instanceof HTMLElement);
		if (slides.length === 0) return;
		this.slides = slides;

		const viewport = document.createElement("div");
		viewport.className = "xtyle-carousel__viewport";
		const track = document.createElement("div");
		track.className = "xtyle-carousel__track";
		track.tabIndex = 0;
		track.setAttribute("role", "group");
		track.setAttribute("aria-roledescription", "carousel");
		track.setAttribute("aria-label", this.label || "Carousel");
		for (const slide of slides) track.appendChild(slide);
		viewport.appendChild(track);
		this.track = track;

		for (const [i, slide] of slides.entries()) {
			slide.classList.add("xtyle-carousel__slide");
			slide.setAttribute("role", "group");
			slide.setAttribute("aria-roledescription", "slide");
			slide.setAttribute("aria-label", `${i + 1} of ${slides.length}`);
		}

		if (!this.stacked) this.buildClones();

		this.setAttribute("role", "region");
		this.setAttribute("aria-roledescription", "carousel");
		this.setAttribute("aria-label", this.label || "Carousel");

		this.append(viewport);
		// The bar also appears for a bare autoplay carousel, so the pause toggle always has a home.
		if (this.controls || this.dots || (this.autoplay && !this.reducedMotion)) {
			this.append(this.buildControls());
		}

		this.liveEl = document.createElement("div");
		this.liveEl.className = "xtyle-carousel__live";
		this.liveEl.setAttribute("role", "status");
		this.liveEl.setAttribute("aria-live", "polite");
		this.append(this.liveEl);

		this.controller = new AbortController();
		this.wire(this.controller.signal);
		if (!this.stacked) this.observeSlides();
		this.setAttribute("data-enhanced", "");
		if (this.controlsMode === "overlay") this.setAttribute("data-controls", "overlay");
		this.update();
		this.restStartOffset();
		this.syncAutoplay();
	}

	/** Prepend a clone of the last slide and append a clone of the first, so scrolling off either end
	 * lands on a look-alike that we then silently snap back from. Only for a `loop` of 2+ real slides. */
	private buildClones(): void {
		const first = this.firstSlide;
		const last = this.lastSlide;
		if (!this.loop || this.slides.length < 2 || !this.track || !first || !last) return;
		this.leadingClone = this.makeClone(last);
		this.trailingClone = this.makeClone(first);
		this.track.insertBefore(this.leadingClone, first);
		this.track.appendChild(this.trailingClone);
		this.hasClones = true;
	}

	/** An inert, id-stripped, screen-reader-hidden copy of a slide, used as a seam look-alike. */
	private makeClone(slide: HTMLElement): HTMLElement {
		const clone = slide.cloneNode(true) as HTMLElement;
		clone.removeAttribute("id");
		for (const withId of clone.querySelectorAll("[id]")) withId.removeAttribute("id");
		clone.setAttribute("data-clone", "");
		clone.setAttribute("aria-hidden", "true");
		clone.removeAttribute("aria-label");
		clone.inert = true;
		return clone;
	}

	/** Park the track on the first real slide (just past the leading clone) so the loop has room to
	 * scroll backward into the clone on the very first `prev`. */
	private restStartOffset(): void {
		if (!this.hasClones || !this.track) return;
		const park = (): void => {
			if (this.track && this.firstSlide) this.trackScroll = this.offsetOf(this.firstSlide);
		};
		park();
		requestAnimationFrame(park);
	}

	private buildControls(): HTMLElement {
		const bar = document.createElement("div");
		bar.className = "xtyle-carousel__controls";

		// A live carousel that moves on its own needs a discoverable, persistent way to stop it
		// (WCAG 2.2.2), beyond the transient hover/focus pause. Only shown when autoplay can run.
		if (this.autoplay && !this.reducedMotion) {
			this.playToggle = this.controlButton("play", "Pause automatic slideshow", "pause");
			this.syncPlayToggle();
			bar.appendChild(this.playToggle);
		}

		if (this.controls) {
			this.prevBtn = this.controlButton("prev", "Previous slide", this.chevrons.prev);
			bar.appendChild(this.prevBtn);
		}

		if (this.dots) {
			const dots = document.createElement("div");
			dots.className = "xtyle-carousel__dots";
			dots.setAttribute("role", "tablist");
			dots.setAttribute("aria-label", "Choose slide");
			this.dotEls = this.slides.map((_, i) => {
				const dot = document.createElement("button");
				dot.type = "button";
				dot.className = "xtyle-carousel__dot";
				dot.setAttribute("role", "tab");
				dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
				dots.appendChild(dot);
				return dot;
			});
			bar.appendChild(dots);
		}

		if (this.controls) {
			this.nextBtn = this.controlButton("next", "Next slide", this.chevrons.next);
			bar.appendChild(this.nextBtn);
		}
		return bar;
	}

	private controlButton(kind: string, label: string, icon: string): HTMLButtonElement {
		const button = document.createElement("button");
		button.type = "button";
		button.className = `xtyle-carousel__nav xtyle-carousel__nav--${kind}`;
		button.setAttribute("aria-label", label);
		button.innerHTML = renderIcon(icon);
		return button;
	}

	private wire(signal: AbortSignal): void {
		this.prevBtn?.addEventListener("click", () => this.go(this.index - 1), { signal });
		this.nextBtn?.addEventListener("click", () => this.go(this.index + 1), { signal });
		this.playToggle?.addEventListener("click", () => this.togglePlay(), { signal });
		for (const [i, dot] of this.dotEls.entries()) {
			dot.addEventListener("click", () => this.go(i), { signal });
		}

		this.addEventListener(
			"keydown",
			(event) => {
				// The arrow pair follows the track's axis: Up/Down for a vertical carousel, Left/Right for
				// a horizontal one. `prev`/`next` stay logical (index-1 / index+1) as the buttons do.
				const prevKey = this.vertical ? "ArrowUp" : "ArrowLeft";
				const nextKey = this.vertical ? "ArrowDown" : "ArrowRight";
				if (event.key === prevKey) {
					event.preventDefault();
					this.go(this.index - 1);
				} else if (event.key === nextKey) {
					event.preventDefault();
					this.go(this.index + 1);
				} else if (event.key === "Home") {
					event.preventDefault();
					this.go(0);
				} else if (event.key === "End") {
					event.preventDefault();
					this.go(this.lastIndex);
				}
			},
			{ signal },
		);

		// The transient hover/focus pause. A decorative carousel that only shows while its container is
		// hovered (an Image hover-preview) wants to keep cycling under the pointer, so `pause-on-hover`
		// opts out; the explicit play/pause toggle and `prefers-reduced-motion` still stop it.
		if (this.pauseOnHover) {
			this.addEventListener("pointerenter", () => this.stopAutoplay(), { signal });
			this.addEventListener("focusin", () => this.stopAutoplay(), { signal });
			this.addEventListener("pointerleave", () => this.resumeAutoplay(), { signal });
			this.addEventListener("focusout", () => this.resumeAutoplay(), { signal });
		}

		// `scrollend` is the precise settle signal (a smooth scroll, or the user's own swipe, coming to
		// rest); the `armSettle` timer is only a fallback for engines that don't fire it.
		this.track?.addEventListener("scrollend", () => this.onSettle(), { signal });
	}

	private observeSlides(): void {
		if (typeof IntersectionObserver === "undefined" || !this.track) return;
		this.observer = new IntersectionObserver(
			(entries) => {
				if (this.programmatic) return;
				let best: { i: number; ratio: number } | null = null;
				for (const entry of entries) {
					const i = this.slides.indexOf(entry.target as HTMLElement);
					if (i < 0) continue;
					if (entry.isIntersecting && (!best || entry.intersectionRatio > best.ratio)) {
						best = { i, ratio: entry.intersectionRatio };
					}
				}
				if (best && best.i !== this.index) {
					this.index = best.i;
					this.update();
				}
			},
			{ root: this.track, threshold: [0.5, 0.75, 1] },
		);
		for (const slide of this.slides) this.observer.observe(slide);
	}

	private go(target: number): void {
		const n = this.slides.length;
		if (n === 0) return;

		// Stacked transitions have no track to scroll: the active slide is just re-marked and the CSS
		// cross-fades. Looping is inherently seamless here, so no seam clones are involved.
		if (this.stacked) {
			this.index = this.loop ? (target + n) % n : Math.max(0, Math.min(n - 1, target));
			this.update();
			return;
		}

		if (!this.track) return;
		// Resolve any in-flight seam snap first, so a rapid second click scrolls from the real slide
		// rather than the far-side clone it briefly rests on.
		if (this.pendingSeam != null) this.finishSeam();

		if (this.hasClones && !this.reducedMotion) {
			if (target >= n) return this.seamTo(this.trailingClone, 0);
			if (target < 0) return this.seamTo(this.leadingClone, this.lastIndex);
		}

		const i = this.loop ? (target + n) % n : Math.max(0, Math.min(n - 1, target));
		this.programmatic = true;
		this.snapToIndex(i, this.reducedMotion ? "instant" : "smooth");
		this.armSettle();
	}

	private seamTo(clone: HTMLElement | null, realIndex: number): void {
		const real = this.slides[realIndex];
		if (!clone || !real || !this.track) return;
		this.programmatic = true;
		this.pendingSeam = this.offsetOf(real);
		this.index = realIndex;
		this.update();
		this.scrollTrackTo(this.offsetOf(clone), "smooth");
		this.armSettle();
	}

	/** Jump (no animation) from a seam clone to the real slide it mirrors. `instant` is required over
	 * `auto` here: the track's CSS `scroll-behavior: smooth` would turn an `auto` scroll into a visible
	 * rewind, which is the exact jank the seam exists to avoid. */
	private finishSeam(): void {
		if (this.pendingSeam == null || !this.track) return;
		const offset = this.pendingSeam;
		this.pendingSeam = null;
		this.scrollTrackTo(offset, "instant");
	}

	/** Fallback settle timer for engines without `scrollend`; a touch longer than one smooth slide so
	 * it never cuts the animation short. */
	private armSettle(): void {
		window.clearTimeout(this.settleTimer);
		this.settleTimer = window.setTimeout(() => this.onSettle(), SETTLE_MS + 150);
	}

	private onSettle(): void {
		if (this.pendingSeam != null) {
			this.finishSeam();
			window.clearTimeout(this.settleTimer);
			this.settleTimer = window.setTimeout(() => (this.programmatic = false), 80);
			return;
		}
		this.programmatic = false;
		if (this.hasClones) this.correctClonePosition();
	}

	/** A manual swipe can leave the track resting on a seam clone; snap it to the real mirror slide. */
	private correctClonePosition(): void {
		if (!this.track) return;
		const offset = this.trackScroll;
		const near = (clone: HTMLElement | null): boolean => clone != null && Math.abs(offset - this.offsetOf(clone)) < 4;
		if (near(this.trailingClone)) this.snapToIndex(0, "instant");
		else if (near(this.leadingClone)) this.snapToIndex(this.lastIndex, "instant");
	}

	private update(): void {
		for (const [i, dot] of this.dotEls.entries()) {
			const active = i === this.index;
			dot.setAttribute("aria-selected", active ? "true" : "false");
			dot.classList.toggle("is-active", active);
		}
		// In a stacked transition the slides overlay, so only the active one is shown and reachable; the
		// rest are hidden from assistive tech and made inert so a hidden slide's content can't be tabbed to.
		if (this.stacked) {
			for (const [i, slide] of this.slides.entries()) {
				const active = i === this.index;
				slide.classList.toggle("is-active", active);
				slide.inert = !active;
				if (active) slide.removeAttribute("aria-hidden");
				else slide.setAttribute("aria-hidden", "true");
			}
		}
		if (!this.loop) {
			if (this.prevBtn) this.prevBtn.disabled = this.index === 0;
			if (this.nextBtn) this.nextBtn.disabled = this.index === this.lastIndex;
		}
		// Announce only real changes; leaving the initial slide unspoken so nothing fires on load.
		if (this.liveEl && this.index !== this.announcedIndex) {
			this.liveEl.textContent = `Slide ${this.index + 1} of ${this.slides.length}`;
			this.announcedIndex = this.index;
		}
	}

	/** Toggle the user's persistent play/pause intent, and reflect it on the control. Delegates the
	 * start/stop to `syncAutoplay` so the one autoplay-eligibility guard stays the single source. */
	private togglePlay(): void {
		this.paused = !this.paused;
		this.syncAutoplay();
		this.syncPlayToggle();
	}

	private syncPlayToggle(): void {
		if (!this.playToggle) return;
		const playing = !this.paused;
		this.playToggle.innerHTML = renderIcon(playing ? "pause" : "play");
		this.playToggle.setAttribute(
			"aria-label",
			playing ? "Pause automatic slideshow" : "Play automatic slideshow",
		);
	}

	private syncAutoplay(): void {
		if (this.autoplay && !this.reducedMotion && !this.paused) this.startAutoplay();
		else this.stopAutoplay();
	}

	private startAutoplay(): void {
		this.stopAutoplay();
		this.autoplayTimer = window.setInterval(() => this.go(this.index + 1), this.interval);
	}

	private stopAutoplay(): void {
		if (this.autoplayTimer) {
			window.clearInterval(this.autoplayTimer);
			this.autoplayTimer = 0;
		}
	}

	private resumeAutoplay(): void {
		if (this.autoplay && !this.reducedMotion && !this.paused && !this.autoplayTimer) this.startAutoplay();
	}

	private teardown(): void {
		this.controller?.abort();
		this.controller = null;
		this.observer?.disconnect();
		this.observer = null;
		this.stopAutoplay();
		window.clearTimeout(this.settleTimer);
		this.settleTimer = 0;
		this.pendingSeam = null;
		this.programmatic = false;
	}
}

define("xtyle-carousel", XtyleCarousel);
