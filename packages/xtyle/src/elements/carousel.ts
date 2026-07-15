import { XtyleElement, define, type StyleMode } from "./base.js";
import type { CarouselTransition, CarouselDirection } from "../vocab.js";
import { FragmentHost, type FragmentIntent } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/carousel/source.generated.js";

const DEFAULT_INTERVAL = 5000;
const SETTLE_MS = 600;

let carouselSeq = 0;

/**
 * A scroll-snap carousel of slotted slides. The chrome it invents — the viewport, the track, the
 * control bar, the prev/next arrows, the dots rail, and the play toggle — is drawn by the
 * `component.carousel` fragment, so an app can reskin or restructure any of it. The element keeps
 * the behavior: the scroll math, the intersection observer, the keyboard, autoplay, and the seam
 * clones that make `loop` continuous. The slides stay the consumer's own nodes, relocated into the
 * fill's track, so framework content stays live.
 */
export class XtyleCarousel extends XtyleElement {
	/**
	 * Light DOM, never a shadow root: the shared component sheet styles the carousel through
	 * `xtyle-carousel …` descendant selectors (the direction axis, the overlay controls, the
	 * stacked transitions), and a descendant combinator cannot cross a shadow boundary.
	 */
	protected override get styleMode(): StyleMode {
		return "scoped";
	}

	private uid = `xtyle-carousel-${carouselSeq++}`;
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "carousel", {
		applyIntent: (intent, event) => this.applyIntent(intent, event),
		afterApply: () => this.afterApply(),
	});

	static get observedAttributes(): string[] {
		return ["label", "autoplay", "interval", "loop", "controls", "dots", "transition", "direction"];
	}

	private controller: AbortController | null = null;
	private observer: IntersectionObserver | null = null;
	private autoplayTimer = 0;
	private settleTimer = 0;
	private retryHandle = 0;
	private retried = false;
	// Suppresses the observer's index writes while a programmatic scroll is in flight, so a
	// fast click-through doesn't flutter the active dot as the smooth scroll passes intermediate slides.
	private programmatic = false;
	private mq = typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : null;
	private index = 0;
	private slides: HTMLElement[] = [];
	private track: HTMLElement | null = null;
	// The user's explicit pause intent (via the play/pause toggle), distinct from the transient
	// hover/focus pause, so resuming on pointer-leave never overrides a deliberate pause.
	private paused = false;
	// A polite live region announcing the current slide, so a screen reader hears the change even
	// though scrolling (or a stacked cross-fade) never moves focus. It renders nothing, so it is the
	// element's plumbing rather than the fill's chrome.
	private liveEl: HTMLElement | null = null;
	private announcedIndex = 0;
	// Seam clones for the smooth infinite loop: inert copies of the first/last slide sitting just past
	// each end, so advancing off an end scrolls into a look-alike and then silently snaps to the real
	// slide. `pendingSeam` holds the real scroll offset to snap to once the seam scroll settles.
	private leadingClone: HTMLElement | null = null;
	private trailingClone: HTMLElement | null = null;
	private hasClones = false;
	private pendingSeam: number | null = null;
	private shape = "";
	private remounting = true;

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

	/** The track's current scroll position along its axis. */
	private get trackScroll(): number {
		if (!this.track) return 0;
		return this.vertical ? this.track.scrollTop : this.track.scrollLeft;
	}

	override connectedCallback(): void {
		super.connectedCallback();
		this.activate();
	}

	override disconnectedCallback(): void {
		super.disconnectedCallback();
		if (this.retryHandle && typeof cancelAnimationFrame === "function") cancelAnimationFrame(this.retryHandle);
		this.retryHandle = 0;
		this.teardown();
	}

	attributeChangedCallback(name: string): void {
		if (name === "label") this.setAttribute("aria-label", this.label || "Carousel");
		if (!this.scaffolded) return;
		this.render();
		if (name === "autoplay" || name === "interval") this.syncAutoplay();
	}

	private get reducedMotion(): boolean {
		return this.mq?.matches ?? false;
	}

	private get showPlay(): boolean {
		return this.autoplay && !this.reducedMotion;
	}

	private get lastIndex(): number {
		return this.slides.length - 1;
	}

	/**
	 * The nearest element carrying `marker` that belongs to *this* carousel's own fill. A carousel can
	 * hold another carousel in a slide, and in light DOM both trees are one — so a plain query would
	 * happily return the inner track, or (since the host reflects `data-controls` for the overlay mode)
	 * the inner carousel element itself. The fill's chrome is always plain markup under this element and
	 * under no other component, which is what this walk asks for.
	 */
	private own<T extends HTMLElement>(marker: string): T | null {
		for (const candidate of this.querySelectorAll<T>(`[${marker}]`)) {
			if (candidate.tagName.includes("-")) continue;
			let parent = candidate.parentElement;
			let foreign = false;
			while (parent && parent !== this) {
				if (parent.tagName.includes("-")) {
					foreign = true;
					break;
				}
				parent = parent.parentElement;
			}
			if (!foreign) return candidate;
		}
		return null;
	}

	private get scaffolded(): boolean {
		return this.own("data-root") !== null;
	}

	private get bindings(): Record<string, unknown> {
		return {
			uid: this.uid,
			slideCount: this.slides.length,
			index: this.index,
			controls: this.controlsMode,
			dots: this.dots,
			showPlay: this.showPlay,
			playing: !this.paused,
			loop: this.loop,
			label: this.label,
			direction: this.direction,
		};
	}

	/** What the fill's structure depends on: a change here rebuilds the control bar (and, through the
	 * mount's slot relocation, the track's children), rather than patching the nodes in place. */
	private shapeSignature(): string {
		return [
			this.slides.length,
			this.controlsMode,
			this.dots,
			this.showPlay,
			this.loop,
			this.stacked,
			this.direction,
		].join("|");
	}

	protected template(): string {
		return "";
	}

	/**
	 * A framework binding can connect the element before it has appended the slides (Svelte creates
	 * the custom element, then fills it), and the scaffold paint captures whatever children are there
	 * at that moment — so scaffolding an empty carousel would strand every slide that arrives after.
	 * Wait a frame for the children to land before painting anything.
	 */
	private scheduleRetry(): void {
		if (this.retried || typeof requestAnimationFrame !== "function") return;
		this.retried = true;
		this.retryHandle = requestAnimationFrame(() => {
			this.retryHandle = 0;
			if (this.isConnected) this.render();
		});
	}

	private hasSlideChildren(): boolean {
		return Array.from(this.children).some((child) => child instanceof HTMLElement);
	}

	protected override render(): void {
		if (!this.scaffolded && !this.hasSlideChildren()) {
			this.scheduleRetry();
			return;
		}
		this.adoptComponentSheet();
		this.fragment.ensureScaffold("");
		this.claimScaffold();
		this.slides = this.fragment.slottedNodes().filter((node): node is HTMLElement => node instanceof HTMLElement);
		if (this.slides.length === 0) return;
		this.index = Math.min(this.index, this.lastIndex);
		const shape = this.shapeSignature();
		if (shape !== this.shape) {
			this.fragment.remount();
			this.remounting = true;
			this.shape = shape;
		}
		this.reflectHostState();
		this.fragment.update(this.bindings);
		this.announce();
	}

	/** Stamp this instance's id onto the two scaffold nodes the fill's ops address, so an outer
	 * carousel's ops can never land on an inner one's track or control bar. Every control the fill
	 * draws carries the same id, keyed from `bindings.uid`. */
	private claimScaffold(): void {
		this.own("data-track")?.setAttribute("data-uid", this.uid);
		this.own("data-controls")?.setAttribute("data-uid", this.uid);
	}

	private reflectHostState(): void {
		this.setAttribute("role", "region");
		this.setAttribute("aria-roledescription", "carousel");
		this.setAttribute("aria-label", this.label || "Carousel");
		if (this.controlsMode === "overlay") this.setAttribute("data-controls", "overlay");
		else this.removeAttribute("data-controls");
	}

	/**
	 * The seam between the fill and the behavior. A `mount` rebuilds the control bar and re-places the
	 * consumer's slides into the fill's track, which drops the seam clones with them — so they are
	 * rebuilt here, after every mount, or `loop` silently stops wrapping.
	 */
	private afterApply(): void {
		const mounted = this.remounting;
		this.remounting = false;
		const track = this.own<HTMLElement>("data-track");
		if (track !== this.track) {
			this.teardown();
			this.track = track;
		}
		if (!this.track) return;
		this.decorateSlides();
		if (mounted) {
			this.syncClones();
			this.parkScroll();
		}
		this.ensureLive();
		this.activate();
		this.setAttribute("data-enhanced", "");
	}

	private decorateSlides(): void {
		for (const [i, slide] of this.slides.entries()) {
			slide.classList.add("xtyle-carousel__slide");
			slide.setAttribute("role", "group");
			slide.setAttribute("aria-roledescription", "slide");
			slide.setAttribute("aria-label", `${i + 1} of ${this.slides.length}`);
			// In a stacked transition the slides overlay, so only the active one is shown and reachable; the
			// rest are hidden from assistive tech and made inert so a hidden slide's content can't be tabbed to.
			if (!this.stacked) continue;
			const active = i === this.index;
			slide.classList.toggle("is-active", active);
			slide.inert = !active;
			if (active) slide.removeAttribute("aria-hidden");
			else slide.setAttribute("aria-hidden", "true");
		}
	}

	/** Build the seam clones when the loop wants them and they are absent (a fresh mount, or a `loop`
	 * that just turned on), and clear them when it doesn't. */
	private syncClones(): void {
		const wanted = this.loop && !this.stacked && this.slides.length >= 2 && this.track !== null;
		if (wanted && this.leadingClone?.isConnected && this.trailingClone?.isConnected) return;
		this.dropClones();
		if (wanted) this.buildClones();
	}

	private dropClones(): void {
		this.leadingClone?.remove();
		this.trailingClone?.remove();
		this.leadingClone = null;
		this.trailingClone = null;
		this.hasClones = false;
	}

	/** Prepend a clone of the last slide and append a clone of the first, so scrolling off either end
	 * lands on a look-alike that we then silently snap back from. */
	private buildClones(): void {
		const first = this.slides[0];
		const last = this.slides[this.lastIndex];
		if (!this.track || !first || !last) return;
		this.leadingClone = this.makeClone(last);
		this.trailingClone = this.makeClone(first);
		this.track.insertBefore(this.leadingClone, this.track.firstChild);
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

	/** Park the track on the active slide. With clones that also means resting just past the leading
	 * one, so the loop has room to scroll backward into it on the very first `prev`. The second pass
	 * runs after layout, when the freshly-placed slides finally have offsets. */
	private parkScroll(): void {
		if (this.stacked || !this.track) return;
		const park = (): void => {
			const slide = this.slides[this.index];
			if (this.track && slide) this.scrollTrackTo(this.offsetOf(slide), "instant");
		};
		park();
		if (typeof requestAnimationFrame === "function") requestAnimationFrame(park);
	}

	private ensureLive(): void {
		if (this.liveEl?.isConnected) return;
		const live = document.createElement("div");
		live.className = "xtyle-carousel__live";
		live.setAttribute("role", "status");
		live.setAttribute("aria-live", "polite");
		this.append(live);
		this.liveEl = live;
	}

	/** Announce only real changes, leaving the initial slide unspoken so nothing fires on load. */
	private announce(): void {
		if (!this.liveEl || this.index === this.announcedIndex) return;
		this.liveEl.textContent = `Slide ${this.index + 1} of ${this.slides.length}`;
		this.announcedIndex = this.index;
	}

	private activate(): void {
		if (!this.track || this.controller) return;
		this.controller = new AbortController();
		this.wire(this.controller.signal);
		if (!this.stacked) this.observeSlides();
		this.syncAutoplay();
	}

	/**
	 * Whether an event came from this carousel's own chrome rather than from a carousel nested inside
	 * one of its slides. Both the fill's delegated handlers and the keyboard listener sit on the host,
	 * so an inner carousel's button click or arrow key bubbles straight through this one — and would
	 * page both.
	 */
	private ownsEvent(event: Event): boolean {
		for (const node of event.composedPath()) {
			if (node === this) return true;
			if (node instanceof HTMLElement && node !== event.target && node.tagName.includes("-")) return false;
		}
		return false;
	}

	private applyIntent(intent: FragmentIntent, event: Event): void {
		if (!this.ownsEvent(event)) return;
		if (intent.nudge) this.go(this.index + (intent.nudge > 0 ? 1 : -1));
		if (intent.select !== undefined) {
			const target = Number(intent.select);
			if (Number.isFinite(target)) this.go(target);
		}
		if (intent.togglePlay) this.togglePlay();
	}

	private wire(signal: AbortSignal): void {
		this.addEventListener(
			"keydown",
			(event) => {
				if (!this.ownsEvent(event)) return;
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
					this.render();
				}
			},
			{ root: this.track, threshold: [0.5, 0.75, 1] },
		);
		for (const slide of this.slides) this.observer.observe(slide);
	}

	/** Scroll to a real slide by index and mark it active. */
	private snapToIndex(index: number, behavior: ScrollBehavior): void {
		const slide = this.slides[index];
		if (!slide || !this.track) return;
		this.scrollTrackTo(this.offsetOf(slide), behavior);
		this.index = index;
		this.render();
	}

	private go(target: number): void {
		const n = this.slides.length;
		if (n === 0) return;

		// Stacked transitions have no track to scroll: the active slide is just re-marked and the CSS
		// cross-fades. Looping is inherently seamless here, so no seam clones are involved.
		if (this.stacked) {
			this.index = this.loop ? (target + n) % n : Math.max(0, Math.min(n - 1, target));
			this.render();
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
		this.render();
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

	/** Toggle the user's persistent play/pause intent. Delegates the start/stop to `syncAutoplay` so
	 * the one autoplay-eligibility guard stays the single source, and re-renders so the fill repaints
	 * the toggle. */
	private togglePlay(): void {
		this.paused = !this.paused;
		this.syncAutoplay();
		this.render();
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
