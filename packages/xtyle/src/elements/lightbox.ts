import { define } from "./base.js";
import { escapeHtml } from "../markup/index.js";
import { imageLightboxCss } from "../css/components/image.js";
import { renderIcon } from "../icons.js";

export interface LightboxOptions {
	/** Accessible name for the opened image. */
	alt?: string;
	/** An optional caption shown beneath the image. */
	caption?: string;
}

let dialog: HTMLDialogElement | null = null;

function buildDialog(): HTMLDialogElement {
	const el = document.createElement("dialog");
	el.className = "xtyle-image__lightbox";
	// No `part` hooks: the dialog mounts on document.body (see the portal below), outside any shadow
	// tree, so `::part()` can't reach it. It's themed by its `.xtyle-image__*` classes in every mode.
	el.innerHTML =
		`<style>${imageLightboxCss}</style>` +
		`<button type="button" class="xtyle-image__close" aria-label="Close">${renderIcon("close")}</button>` +
		`<figure class="xtyle-image__lightbox-figure">` +
		`<img class="xtyle-image__full" src="" alt="" />` +
		`<figcaption class="xtyle-image__lightbox-caption" hidden></figcaption>` +
		`</figure>`;
	el.querySelector(".xtyle-image__close")?.addEventListener("click", () => el.close());
	el.addEventListener("click", (event) => {
		if (event.target === el) el.close();
	});
	// Portal to document.body, not any element's own root: an ancestor with transform, filter,
	// backdrop-filter, will-change, or contain establishes a containing block that a modal
	// <dialog> anchors to instead of the viewport, so a lightbox inside a frosted or transformed
	// surface mispositions. Mounting on the body escapes any such ancestor.
	document.body.appendChild(el);
	return el;
}

function ensureDialog(): HTMLDialogElement {
	if (!dialog || !dialog.isConnected) dialog = buildDialog();
	return dialog;
}

/**
 * Opens the shared lightbox on any image `src`, imperatively. One singleton `<dialog>` serves the
 * whole document, so a click handler over arbitrary DOM — a `marked`-rendered `{@html}` image, a CMS
 * body, a gallery of mixed sources — can drive the same lightbox the `<xtyle-image lightbox>`
 * component uses. The per-`<Image>` lightbox is the special case; this is the general controller.
 */
export function openLightbox(src: string, opts: LightboxOptions = {}): void {
	const el = ensureDialog();
	const img = el.querySelector<HTMLImageElement>(".xtyle-image__full");
	if (img) {
		img.setAttribute("src", src);
		img.setAttribute("alt", opts.alt ?? "");
	}
	const caption = el.querySelector<HTMLElement>(".xtyle-image__lightbox-caption");
	if (caption) {
		if (opts.caption) {
			caption.innerHTML = escapeHtml(opts.caption);
			caption.hidden = false;
		} else {
			caption.textContent = "";
			caption.hidden = true;
		}
	}
	el.showModal();
}

/** Tears down the shared lightbox singleton (test/teardown aid). */
export function closeLightbox(): void {
	dialog?.remove();
	dialog = null;
}

const TRIGGER_SELECTOR = "[data-xtyle-lightbox]";

/** Resolve the `{ src, alt, caption }` a delegated trigger opens: explicit `data-lightbox-*` overrides
 * first (a full-res source distinct from the thumbnail), then the trigger's own `<img>` (or a nested
 * one). Returns `null` when no source can be found, so a bare marker without an image is a no-op. */
function resolveTrigger(trigger: Element): { src: string; alt: string; caption?: string } | null {
	const img = trigger.matches("img") ? (trigger as HTMLImageElement) : trigger.querySelector<HTMLImageElement>("img");
	const src = trigger.getAttribute("data-lightbox-src") ?? img?.currentSrc ?? img?.getAttribute("src") ?? "";
	if (!src) return null;
	return {
		src,
		alt: trigger.getAttribute("data-lightbox-alt") ?? img?.getAttribute("alt") ?? "",
		caption: trigger.getAttribute("data-lightbox-caption") ?? undefined,
	};
}

/**
 * `<xtyle-lightbox>` — a mount-once, delegated lightbox controller. It picks up clicks on any
 * `[data-xtyle-lightbox]` element in its scope (the whole document, or a `scope` selector's subtree),
 * so a single instance opens images it never rendered itself, including raw `{@html}` / markdown
 * `<img>` a component surface can't own. Matched triggers that aren't natively interactive are
 * promoted to keyboard-operable (`role="button"`, `tabindex`, an `aria-label`), and Enter/Space open
 * the same lightbox — so the delegated path is keyboard-reachable, not mouse-only.
 */
export class XtyleLightbox extends HTMLElement {
	private controller: AbortController | null = null;
	private observer: MutationObserver | null = null;

	private get scopeRoot(): Document | Element {
		const selector = this.getAttribute("scope");
		return (selector ? document.querySelector(selector) : null) ?? document;
	}

	connectedCallback(): void {
		this.style.display = "none";
		this.controller = new AbortController();
		const { signal } = this.controller;
		const root = this.scopeRoot;
		root.addEventListener("click", this.onClick as EventListener, { signal });
		root.addEventListener("keydown", this.onKeydown as EventListener, { signal });
		this.promoteAll(root);
		if (typeof MutationObserver !== "undefined") {
			this.observer = new MutationObserver(() => this.promoteAll(root));
			this.observer.observe(root instanceof Document ? root.documentElement : root, {
				childList: true,
				subtree: true,
			});
		}
	}

	disconnectedCallback(): void {
		this.controller?.abort();
		this.controller = null;
		this.observer?.disconnect();
		this.observer = null;
	}

	/** Make every non-interactive trigger keyboard-operable; native `<a>`/`<button>` already are. */
	private promoteAll(root: Document | Element): void {
		for (const trigger of Array.from(root.querySelectorAll(TRIGGER_SELECTOR))) {
			if (trigger.matches("a, button")) continue;
			if (!trigger.hasAttribute("tabindex")) trigger.setAttribute("tabindex", "0");
			if (!trigger.hasAttribute("role")) trigger.setAttribute("role", "button");
			if (!trigger.hasAttribute("aria-label")) {
				const img = trigger.matches("img") ? trigger : trigger.querySelector("img");
				const alt = img?.getAttribute("alt");
				trigger.setAttribute("aria-label", alt ? `View image: ${alt}` : "View image");
			}
		}
	}

	private onClick = (event: MouseEvent): void => {
		const trigger = (event.target as Element)?.closest?.(TRIGGER_SELECTOR);
		if (!trigger) return;
		const resolved = resolveTrigger(trigger);
		if (!resolved) return;
		event.preventDefault();
		openLightbox(resolved.src, { alt: resolved.alt, caption: resolved.caption });
	};

	private onKeydown = (event: KeyboardEvent): void => {
		if (event.key !== "Enter" && event.key !== " ") return;
		const trigger = (event.target as Element)?.closest?.(TRIGGER_SELECTOR);
		if (!trigger || trigger.matches("a, button")) return;
		const resolved = resolveTrigger(trigger);
		if (!resolved) return;
		event.preventDefault();
		openLightbox(resolved.src, { alt: resolved.alt, caption: resolved.caption });
	};
}

define("xtyle-lightbox", XtyleLightbox);
