import { XtyleElement, define, type StyleMode } from "./base.js";
import { imageHostCss } from "../markup/index.js";
import { hoverMediaHtml, isHoverVideo } from "../markup/image.js";
import type { ImageFit, ImageRadius, ImageLoading, ImageTrigger, ImageHoverAudio } from "../markup/image.js";
import { FragmentHost, type FragmentIntent } from "./fragment-host.js";
import { openLightbox } from "./lightbox.js";
import { manifest, fragmentSources } from "./fragments/image/source.generated.js";
import { resolveVocab, IMAGE_FITS, IMAGE_RADII } from "../vocab.js";

/** A click or key that lands on a control inside the frame belongs to the control, not the frame. */
function onFrameControl(target: EventTarget | null): boolean {
	return target instanceof Element && target.closest("button, a, input, select, textarea") !== null;
}

export class XtyleImage extends XtyleElement {
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "image", {
		applyIntent: (intent, event) => this.applyIntent(intent, event),
		afterApply: () => this.wire(),
	});

	private wiredImg: HTMLImageElement | null = null;
	private wiredFrame: HTMLElement | null = null;
	private lightboxTrigger: AbortController | null = null;
	private hoverController: AbortController | null = null;
	private hoverFrame: HTMLElement | null = null;
	private hoverInjected = false;
	private readonly reduceMotion =
		typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : null;

	protected override get styleMode(): StyleMode {
		return "auto";
	}

	static get observedAttributes(): string[] {
		return [
			"src",
			"alt",
			"ratio",
			"fit",
			"radius",
			"loading",
			"lightbox",
			"caption",
			"trigger",
			"hover-src",
			"hover-poster",
			"hover-audio",
		];
	}

	get src(): string | null {
		return this.getAttribute("src");
	}
	set src(value: string | null) {
		if (value) this.setAttribute("src", value);
		else this.removeAttribute("src");
	}

	get alt(): string {
		return this.getAttribute("alt") ?? "";
	}
	set alt(value: string) {
		this.setAttribute("alt", value);
	}

	get ratio(): string | null {
		return this.getAttribute("ratio");
	}
	set ratio(value: string | null) {
		if (value) this.setAttribute("ratio", value);
		else this.removeAttribute("ratio");
	}

	get fit(): ImageFit {
		return resolveVocab(this.getAttribute("fit"), IMAGE_FITS, "cover", "image fit");
	}
	set fit(value: ImageFit) {
		this.setAttribute("fit", value);
	}

	get radius(): ImageRadius {
		return resolveVocab(this.getAttribute("radius"), IMAGE_RADII, "md", "image radius");
	}
	set radius(value: ImageRadius) {
		this.setAttribute("radius", value);
	}

	get loading(): ImageLoading {
		return this.getAttribute("loading") === "eager" ? "eager" : "lazy";
	}
	set loading(value: ImageLoading) {
		this.setAttribute("loading", value);
	}

	get lightbox(): boolean {
		return this.hasAttribute("lightbox");
	}
	set lightbox(value: boolean) {
		this.toggleAttribute("lightbox", value);
	}

	get trigger(): ImageTrigger {
		return this.getAttribute("trigger") === "button" ? "button" : "frame";
	}
	set trigger(value: ImageTrigger) {
		this.setAttribute("trigger", value);
	}

	get caption(): string | null {
		return this.getAttribute("caption");
	}
	set caption(value: string | null) {
		if (value) this.setAttribute("caption", value);
		else this.removeAttribute("caption");
	}

	get hoverSrc(): string | null {
		return this.getAttribute("hover-src");
	}
	set hoverSrc(value: string | null) {
		if (value) this.setAttribute("hover-src", value);
		else this.removeAttribute("hover-src");
	}

	get hoverPoster(): string | null {
		return this.getAttribute("hover-poster");
	}
	set hoverPoster(value: string | null) {
		if (value) this.setAttribute("hover-poster", value);
		else this.removeAttribute("hover-poster");
	}

	/** `null` when the attribute is absent (silent, no toggle); `"on"` / `"off"` when audio is allowed. */
	get hoverAudio(): ImageHoverAudio | null {
		if (!this.hasAttribute("hover-audio")) return null;
		return this.getAttribute("hover-audio") === "on" ? "on" : "off";
	}
	set hoverAudio(value: ImageHoverAudio | null) {
		if (value === null) this.removeAttribute("hover-audio");
		else this.setAttribute("hover-audio", value);
	}

	attributeChangedCallback(): void {
		if (this.root.firstChild) this.render();
	}

	/** The frame is not the click target when a zoom button is: a click meant for the surrounding
	 * prose (or a drag-select over the image) shouldn't fire the modal. */
	private get zoomEnabled(): boolean {
		return this.lightbox && this.trigger === "button";
	}

	/** The mute toggle only earns its place over a hover *video* whose author allowed sound — and
	 * never under reduced motion, where the preview doesn't play at all. Resolved from attributes and
	 * the consumer's own slotted content, so it holds on the very first render, before the element
	 * has injected a `hover-src` preview. */
	private get audioEnabled(): boolean {
		if (this.hoverAudio === null || this.reduceMotion?.matches) return false;
		if (this.querySelector('video[slot="hover"], [slot="hover"] video')) return true;
		return isHoverVideo(this.hoverSrc);
	}

	private get zoomLabel(): string {
		return this.alt ? `View image: ${this.alt}` : "View image";
	}

	private get audioMuted(): boolean {
		const video = this.hoverVideo();
		return video ? video.muted : this.hoverAudio !== "on";
	}

	private get bindings(): Record<string, unknown> {
		const muted = this.audioMuted;
		return {
			src: this.src,
			alt: this.alt,
			ratio: this.ratio,
			fit: this.fit,
			radius: this.radius,
			loading: this.loading,
			caption: this.caption,
			zoom: this.zoomEnabled,
			zoomLabel: this.zoomLabel,
			audio: this.audioEnabled,
			audioMuted: muted,
			audioLabel: muted ? "Unmute preview" : "Mute preview",
		};
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(imageHostCss);
		// The `figcaption` is only present when there's a caption, and the patch hook doesn't rebuild
		// it; a change in caption presence remounts (which re-places any slotted hover preview intact).
		this.fragment.reshapeIfChanged(this.caption ? "captioned" : "uncaptioned");
		if (this.chromeStale()) this.fragment.remount();
		this.fragment.update(this.bindings);
	}

	/**
	 * Whether the frame's live controls disagree with what the bindings now ask for. Two paths land
	 * here: an attribute flipped (`lightbox`, `trigger`, `hover-audio`), and hydration — the zero-JS
	 * render carries no zoom button (one that can't open a lightbox is dead chrome), so the element
	 * upgrades over a scaffold that lacks it and the fill's `mount` never runs. Either way the fill
	 * has to redraw, so ask it to.
	 */
	private chromeStale(): boolean {
		const frame = this.root.querySelector<HTMLElement>(".xtyle-image__frame");
		if (!frame) return false;
		return (
			this.zoomEnabled !== (frame.querySelector(".xtyle-image__zoom") !== null) ||
			this.audioEnabled !== (frame.querySelector(".xtyle-image__audio") !== null)
		);
	}

	private applyIntent(intent: FragmentIntent, event: Event): void {
		if (intent.stopPropagation) event.stopPropagation();
		if (intent.activate === "zoom") this.openLightbox();
		else if (intent.activate === "audio") this.toggleHoverAudio();
	}

	private wire(): void {
		const frame = this.root.querySelector<HTMLElement>(".xtyle-image__frame");
		if (!frame) return;

		const img = this.root.querySelector<HTMLImageElement>(".xtyle-image__img");
		if (img && this.wiredImg !== img) {
			this.wiredImg = img;
			if (img.complete && img.naturalWidth > 0) {
				this.markLoaded(frame);
			} else {
				frame.setAttribute("data-loading", "");
				img.addEventListener("load", () => this.markLoaded(frame), { once: true });
				img.addEventListener("error", () => this.markError(frame), { once: true });
			}
		}

		this.wireHover(frame);

		if (this.lightbox && this.trigger !== "button") this.wireFrameTrigger(frame, this.zoomLabel);
		else this.clearFrameTrigger(frame);
	}

	private wireHover(frame: HTMLElement): void {
		const overlay = frame.querySelector<HTMLElement>(".xtyle-image__hover");
		if (!overlay) return;

		// In shadow mode the `hover-src` media must be a projected `[slot=hover]` child of the host;
		// the light/SSR path already inlined it into the overlay, so only inject when there's nothing.
		if (this.hoverSrc && !this.hoverInjected && !this.querySelector('[slot="hover"]')) {
			const inLightDom = (this.root as unknown) === this;
			if (!inLightDom && !overlay.querySelector(".xtyle-image__hover-media")) {
				const tpl = document.createElement("template");
				tpl.innerHTML = hoverMediaHtml(this.hoverSrc, this.hoverPoster ?? this.src ?? undefined);
				const node = tpl.content.firstElementChild as HTMLElement | null;
				if (node) {
					node.setAttribute("slot", "hover");
					this.appendChild(node);
				}
			}
			this.hoverInjected = true;
		}

		if (!this.hoverContentPresent(overlay) || this.reduceMotion?.matches) {
			this.clearHover(frame);
			return;
		}

		if (this.hoverFrame === frame) return;
		this.hoverFrame = frame;
		this.hoverController?.abort();
		this.hoverController = new AbortController();
		const { signal } = this.hoverController;
		const show = (): void => this.revealHover(frame);
		const hide = (): void => this.hideHover(frame);
		frame.addEventListener("pointerenter", show, { signal });
		frame.addEventListener("pointerleave", hide, { signal });
		frame.addEventListener("focusin", show, { signal });
		frame.addEventListener(
			"focusout",
			(event) => {
				if (!frame.contains(event.relatedTarget as Node | null)) hide();
			},
			{ signal },
		);

		// Keyboard reach: a hover-only frame becomes focusable so the preview is not mouse-only. When
		// it is already a lightbox trigger it is focusable, so leave that role/tabindex alone.
		if (!this.lightbox) {
			frame.tabIndex = 0;
			if (!frame.hasAttribute("aria-label")) {
				frame.setAttribute("aria-label", this.alt ? `${this.alt} (preview on focus)` : "Preview on focus");
			}
		}
	}

	private hoverContentPresent(overlay: HTMLElement): boolean {
		if (Array.from(overlay.children).some((el) => el.tagName !== "SLOT")) return true;
		const slot = overlay.querySelector<HTMLSlotElement>("slot[name='hover']");
		if (slot && typeof slot.assignedElements === "function" && slot.assignedElements().length) return true;
		return this.querySelector('[slot="hover"]') !== null;
	}

	private hoverVideo(): HTMLVideoElement | null {
		return (
			this.querySelector<HTMLVideoElement>('video[slot="hover"], [slot="hover"] video') ??
			this.root.querySelector<HTMLVideoElement>(".xtyle-image__hover video")
		);
	}

	private revealHover(frame: HTMLElement): void {
		frame.setAttribute("data-hover-active", "");
		const video = this.hoverVideo();
		if (video) {
			if (this.hoverAudio === "on") video.muted = false;
			void video.play().catch(() => {});
		}
	}

	private hideHover(frame: HTMLElement): void {
		frame.removeAttribute("data-hover-active");
		const video = this.hoverVideo();
		if (video) {
			video.pause();
			video.currentTime = 0;
			if (this.hoverAudio !== null) video.muted = true;
		}
	}

	private clearHover(frame: HTMLElement): void {
		this.hoverController?.abort();
		this.hoverController = null;
		this.hoverFrame = null;
		frame.removeAttribute("data-hover-active");
	}

	/** Flip the preview's sound and mirror it onto the fill's toggle. The glyph is the fill's — both
	 * are rendered, and `aria-pressed` selects which one shows — so this writes state, not markup. */
	private toggleHoverAudio(): void {
		const video = this.hoverVideo();
		if (!video) return;
		video.muted = !video.muted;
		const button = this.root.querySelector<HTMLElement>(".xtyle-image__audio");
		if (!button) return;
		button.setAttribute("aria-pressed", video.muted ? "false" : "true");
		button.setAttribute("aria-label", video.muted ? "Unmute preview" : "Mute preview");
	}

	private wireFrameTrigger(frame: HTMLElement, label: string): void {
		frame.setAttribute("role", "button");
		frame.setAttribute("tabindex", "0");
		frame.setAttribute("aria-label", label);
		if (this.wiredFrame === frame) return;
		this.wiredFrame = frame;
		this.lightboxTrigger?.abort();
		this.lightboxTrigger = new AbortController();
		const { signal } = this.lightboxTrigger;
		frame.addEventListener(
			"click",
			(event) => {
				if (onFrameControl(event.target)) return;
				this.openLightbox();
			},
			{ signal },
		);
		frame.addEventListener(
			"keydown",
			(event) => {
				if (event.key !== "Enter" && event.key !== " ") return;
				if (onFrameControl(event.target)) return;
				event.preventDefault();
				this.openLightbox();
			},
			{ signal },
		);
	}

	private clearFrameTrigger(frame: HTMLElement): void {
		this.lightboxTrigger?.abort();
		this.lightboxTrigger = null;
		this.wiredFrame = null;
		frame.removeAttribute("role");
		frame.removeAttribute("tabindex");
		frame.removeAttribute("aria-label");
	}

	private markLoaded(frame: HTMLElement): void {
		frame.removeAttribute("data-loading");
		frame.setAttribute("data-loaded", "");
	}

	/** The failure mark is the fill's, rendered up front and revealed by this state. */
	private markError(frame: HTMLElement): void {
		frame.removeAttribute("data-loading");
		frame.setAttribute("data-error", "");
	}

	private openLightbox(): void {
		openLightbox(this.src ?? "", { alt: this.alt, caption: this.caption ?? undefined });
	}
}

define("xtyle-image", XtyleImage);
