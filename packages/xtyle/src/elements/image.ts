import { XtyleElement, define, type StyleMode } from "./base.js";
import { imageHostCss } from "../markup/index.js";
import { hoverMediaHtml } from "../markup/image.js";
import type { ImageFit, ImageRadius, ImageLoading, ImageTrigger, ImageHoverAudio } from "../markup/image.js";
import { renderIcon } from "../icons.js";
import { FragmentHost } from "./fragment-host.js";
import { openLightbox } from "./lightbox.js";
import { manifest, fragmentSources } from "./fragments/image/source.generated.js";

export class XtyleImage extends XtyleElement {
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "image", {
		applyIntent: () => {},
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
		return (this.getAttribute("fit") as ImageFit) ?? "cover";
	}
	set fit(value: ImageFit) {
		this.setAttribute("fit", value);
	}

	get radius(): ImageRadius {
		return (this.getAttribute("radius") as ImageRadius) ?? "md";
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

	private get bindings(): Record<string, unknown> {
		return {
			src: this.src,
			alt: this.alt,
			ratio: this.ratio,
			fit: this.fit,
			radius: this.radius,
			loading: this.loading,
			caption: this.caption,
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
		this.fragment.update(this.bindings);
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

		if (!this.lightbox) {
			this.clearFrameTrigger(frame);
			this.removeZoomButton(frame);
			return;
		}
		const label = this.alt ? `View image: ${this.alt}` : "View image";
		if (this.trigger === "button") {
			// The frame is not the click target; a dedicated zoom button is, so a click meant for
			// the surrounding prose (or a drag-select over the image) doesn't fire the modal.
			this.clearFrameTrigger(frame);
			this.ensureZoomButton(frame, label);
		} else {
			this.removeZoomButton(frame);
			this.wireFrameTrigger(frame, label);
		}
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
			this.clearHover(frame, overlay);
			return;
		}

		this.ensureAudioButton(frame);

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
		if (overlay.querySelector(":scope > *:not(slot)")) return true;
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

	private clearHover(frame: HTMLElement, overlay: HTMLElement): void {
		this.hoverController?.abort();
		this.hoverController = null;
		this.hoverFrame = null;
		frame.removeAttribute("data-hover-active");
		overlay.querySelector(".xtyle-image__audio")?.remove();
	}

	private ensureAudioButton(frame: HTMLElement): void {
		const overlay = frame.querySelector<HTMLElement>(".xtyle-image__hover");
		if (!overlay) return;
		const existing = overlay.querySelector<HTMLButtonElement>(".xtyle-image__audio");
		if (this.hoverAudio === null || !this.hoverVideo()) {
			existing?.remove();
			return;
		}
		let button = existing;
		if (!button) {
			button = document.createElement("button");
			button.type = "button";
			button.className = "xtyle-image__audio";
			overlay.appendChild(button);
			button.addEventListener("click", (event) => {
				event.stopPropagation();
				const target = this.hoverVideo();
				if (!target) return;
				target.muted = !target.muted;
				this.paintAudioButton(button as HTMLButtonElement, target.muted);
			});
		}
		const video = this.hoverVideo();
		this.paintAudioButton(button, video ? video.muted : this.hoverAudio !== "on");
	}

	private paintAudioButton(button: HTMLButtonElement, muted: boolean): void {
		button.innerHTML = renderIcon(muted ? "volume-off" : "volume");
		button.setAttribute("aria-label", muted ? "Unmute preview" : "Mute preview");
		button.setAttribute("aria-pressed", muted ? "false" : "true");
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
		frame.addEventListener("click", () => this.openLightbox(), { signal });
		frame.addEventListener(
			"keydown",
			(event) => {
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					this.openLightbox();
				}
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

	private ensureZoomButton(frame: HTMLElement, label: string): void {
		let button = frame.querySelector<HTMLButtonElement>(".xtyle-image__zoom");
		if (!button) {
			button = document.createElement("button");
			button.type = "button";
			button.className = "xtyle-image__zoom";
			button.innerHTML = renderIcon("maximize");
			button.addEventListener("click", () => this.openLightbox());
			frame.appendChild(button);
		}
		button.setAttribute("aria-label", label);
	}

	private removeZoomButton(frame: HTMLElement): void {
		frame.querySelector(".xtyle-image__zoom")?.remove();
	}

	private markLoaded(frame: HTMLElement): void {
		frame.removeAttribute("data-loading");
		frame.setAttribute("data-loaded", "");
	}

	private markError(frame: HTMLElement): void {
		frame.removeAttribute("data-loading");
		frame.setAttribute("data-error", "");
		if (!frame.querySelector(".xtyle-image__error")) {
			const mark = document.createElement("span");
			mark.className = "xtyle-image__error";
			mark.setAttribute("aria-hidden", "true");
			mark.innerHTML = renderIcon("warning", { size: "lg" });
			frame.appendChild(mark);
		}
	}

	private openLightbox(): void {
		openLightbox(this.src ?? "", { alt: this.alt, caption: this.caption ?? undefined });
	}
}

define("xtyle-image", XtyleImage);
