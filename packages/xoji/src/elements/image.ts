import { XojiElement, define, type StyleMode } from "./base.js";
import { imageHostCss, escapeAttr } from "../markup/index.js";
import type { ImageFit, ImageRadius, ImageLoading } from "../markup/image.js";
import { renderIcon } from "../icons.js";
import { FragmentHost } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/image/source.generated.js";

export class XojiImage extends XojiElement {
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "image", {
		applyIntent: () => {},
		afterApply: () => this.wire(),
	});

	private wiredImg: HTMLImageElement | null = null;
	private wiredFrame: HTMLElement | null = null;
	private lightboxTrigger: AbortController | null = null;
	private lightboxEl: HTMLDialogElement | null = null;

	protected override get styleMode(): StyleMode {
		return "auto";
	}

	static get observedAttributes(): string[] {
		return ["src", "alt", "ratio", "fit", "radius", "loading", "lightbox", "caption"];
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
		const frame = this.root.querySelector<HTMLElement>(".xoji-image__frame");
		if (!frame) return;

		const img = this.root.querySelector<HTMLImageElement>(".xoji-image__img");
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

		if (this.lightbox) {
			frame.setAttribute("role", "button");
			frame.setAttribute("tabindex", "0");
			frame.setAttribute("aria-label", this.alt ? `View image: ${this.alt}` : "View image");
			if (this.wiredFrame !== frame) {
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
		} else {
			this.lightboxTrigger?.abort();
			this.lightboxTrigger = null;
			this.wiredFrame = null;
			frame.removeAttribute("role");
			frame.removeAttribute("tabindex");
			frame.removeAttribute("aria-label");
		}
	}

	private markLoaded(frame: HTMLElement): void {
		frame.removeAttribute("data-loading");
		frame.setAttribute("data-loaded", "");
	}

	private markError(frame: HTMLElement): void {
		frame.removeAttribute("data-loading");
		frame.setAttribute("data-error", "");
		if (!frame.querySelector(".xoji-image__error")) {
			const mark = document.createElement("span");
			mark.className = "xoji-image__error";
			mark.setAttribute("aria-hidden", "true");
			mark.innerHTML = renderIcon("warning", { size: "lg" });
			frame.appendChild(mark);
		}
	}

	private openLightbox(): void {
		this.ensureLightbox().showModal();
	}

	private ensureLightbox(): HTMLDialogElement {
		if (this.lightboxEl && this.lightboxEl.isConnected) {
			const full = this.lightboxEl.querySelector<HTMLImageElement>(".xoji-image__full");
			if (full) {
				full.setAttribute("src", this.src ?? "");
				full.setAttribute("alt", this.alt);
			}
			return this.lightboxEl;
		}
		const src = escapeAttr(this.src ?? "");
		const alt = escapeAttr(this.alt);
		const dialog = document.createElement("dialog");
		dialog.className = "xoji-image__lightbox";
		dialog.setAttribute("part", "lightbox");
		dialog.innerHTML =
			`<button type="button" class="xoji-image__close" part="close" aria-label="Close">${renderIcon("close")}</button>` +
			`<img class="xoji-image__full" part="full" src="${src}" alt="${alt}" />`;
		dialog.querySelector(".xoji-image__close")?.addEventListener("click", () => dialog.close());
		dialog.addEventListener("click", (event) => {
			if (event.target === dialog) dialog.close();
		});
		this.root.appendChild(dialog);
		this.lightboxEl = dialog;
		return dialog;
	}
}

define("xoji-image", XojiImage);
