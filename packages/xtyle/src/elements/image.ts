import { XtyleElement, define, type StyleMode } from "./base.js";
import { imageHostCss } from "../markup/index.js";
import type { ImageFit, ImageRadius, ImageLoading, ImageTrigger } from "../markup/image.js";
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

	protected override get styleMode(): StyleMode {
		return "auto";
	}

	static get observedAttributes(): string[] {
		return ["src", "alt", "ratio", "fit", "radius", "loading", "lightbox", "caption", "trigger"];
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
