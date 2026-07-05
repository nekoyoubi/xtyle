import { define } from "./base.js";
import { renderIcon } from "../icons.js";

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
export class XojiCarousel extends HTMLElement {
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

	get controls(): boolean {
		return this.getAttribute("controls") !== "false";
	}

	get dots(): boolean {
		return this.getAttribute("dots") !== "false";
	}

	connectedCallback(): void {
		if (!this.querySelector(":scope > .xoji-carousel__viewport")) this.enhance();
	}

	disconnectedCallback(): void {
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

	private enhance(): void {
		const slides = Array.from(this.children).filter((n): n is HTMLElement => n instanceof HTMLElement);
		if (slides.length === 0) return;
		this.slides = slides;

		const viewport = document.createElement("div");
		viewport.className = "xoji-carousel__viewport";
		const track = document.createElement("div");
		track.className = "xoji-carousel__track";
		track.tabIndex = 0;
		track.setAttribute("role", "group");
		track.setAttribute("aria-roledescription", "carousel");
		track.setAttribute("aria-label", this.label || "Carousel");
		for (const slide of slides) track.appendChild(slide);
		viewport.appendChild(track);
		this.track = track;

		for (const [i, slide] of slides.entries()) {
			slide.classList.add("xoji-carousel__slide");
			slide.setAttribute("role", "group");
			slide.setAttribute("aria-roledescription", "slide");
			slide.setAttribute("aria-label", `${i + 1} of ${slides.length}`);
		}

		this.setAttribute("role", "region");
		this.setAttribute("aria-roledescription", "carousel");
		this.setAttribute("aria-label", this.label || "Carousel");

		this.append(viewport);
		if (this.controls || this.dots) this.append(this.buildControls());

		this.controller = new AbortController();
		this.wire(this.controller.signal);
		this.observeSlides();
		this.setAttribute("data-enhanced", "");
		this.update();
		this.syncAutoplay();
	}

	private buildControls(): HTMLElement {
		const bar = document.createElement("div");
		bar.className = "xoji-carousel__controls";

		if (this.controls) {
			this.prevBtn = this.controlButton("prev", "Previous slide", "chevron-left");
			bar.appendChild(this.prevBtn);
		}

		if (this.dots) {
			const dots = document.createElement("div");
			dots.className = "xoji-carousel__dots";
			dots.setAttribute("role", "tablist");
			dots.setAttribute("aria-label", "Choose slide");
			this.dotEls = this.slides.map((_, i) => {
				const dot = document.createElement("button");
				dot.type = "button";
				dot.className = "xoji-carousel__dot";
				dot.setAttribute("role", "tab");
				dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
				dots.appendChild(dot);
				return dot;
			});
			bar.appendChild(dots);
		}

		if (this.controls) {
			this.nextBtn = this.controlButton("next", "Next slide", "chevron-right");
			bar.appendChild(this.nextBtn);
		}
		return bar;
	}

	private controlButton(kind: string, label: string, icon: string): HTMLButtonElement {
		const button = document.createElement("button");
		button.type = "button";
		button.className = `xoji-carousel__nav xoji-carousel__nav--${kind}`;
		button.setAttribute("aria-label", label);
		button.innerHTML = renderIcon(icon);
		return button;
	}

	private wire(signal: AbortSignal): void {
		this.prevBtn?.addEventListener("click", () => this.go(this.index - 1), { signal });
		this.nextBtn?.addEventListener("click", () => this.go(this.index + 1), { signal });
		for (const [i, dot] of this.dotEls.entries()) {
			dot.addEventListener("click", () => this.go(i), { signal });
		}

		this.addEventListener(
			"keydown",
			(event) => {
				if (event.key === "ArrowLeft") {
					event.preventDefault();
					this.go(this.index - 1);
				} else if (event.key === "ArrowRight") {
					event.preventDefault();
					this.go(this.index + 1);
				} else if (event.key === "Home") {
					event.preventDefault();
					this.go(0);
				} else if (event.key === "End") {
					event.preventDefault();
					this.go(this.slides.length - 1);
				}
			},
			{ signal },
		);

		this.addEventListener("pointerenter", () => this.stopAutoplay(), { signal });
		this.addEventListener("focusin", () => this.stopAutoplay(), { signal });
		this.addEventListener("pointerleave", () => this.resumeAutoplay(), { signal });
		this.addEventListener("focusout", () => this.resumeAutoplay(), { signal });
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
		const i = this.loop ? (target + n) % n : Math.max(0, Math.min(n - 1, target));
		const slide = this.slides[i];
		if (!slide || !this.track) return;
		this.programmatic = true;
		this.track.scrollTo({ left: slide.offsetLeft, behavior: this.reducedMotion ? "auto" : "smooth" });
		this.index = i;
		this.update();
		window.clearTimeout(this.settleTimer);
		this.settleTimer = window.setTimeout(() => {
			this.programmatic = false;
		}, SETTLE_MS);
	}

	private update(): void {
		for (const [i, dot] of this.dotEls.entries()) {
			const active = i === this.index;
			dot.setAttribute("aria-selected", active ? "true" : "false");
			dot.classList.toggle("is-active", active);
		}
		if (!this.loop) {
			if (this.prevBtn) this.prevBtn.disabled = this.index === 0;
			if (this.nextBtn) this.nextBtn.disabled = this.index === this.slides.length - 1;
		}
	}

	private syncAutoplay(): void {
		if (this.autoplay && !this.reducedMotion) this.startAutoplay();
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
		if (this.autoplay && !this.reducedMotion && !this.autoplayTimer) this.startAutoplay();
	}

	private teardown(): void {
		this.controller?.abort();
		this.controller = null;
		this.observer?.disconnect();
		this.observer = null;
		this.stopAutoplay();
		window.clearTimeout(this.settleTimer);
		this.settleTimer = 0;
	}
}

define("xoji-carousel", XojiCarousel);
