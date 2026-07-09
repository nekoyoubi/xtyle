import { XtyleDecoratorElement, define } from "./base.js";
// Side-effect import: guarantees `<xtyle-dialog>` is defined so the lightbox can compose it.
import "./dialog.js";

export interface LightboxOptions {
	/** Accessible name for the opened image. */
	alt?: string;
	/** An optional caption shown beneath the image. */
	caption?: string;
}

/** The `<xtyle-dialog>` the lightbox composes, narrowed to the two lifecycle methods it drives. */
type DialogElement = HTMLElement & { showModal(): void; close(): void };

let dialog: DialogElement | null = null;

/**
 * The shared lightbox is an `<xtyle-dialog>` restyled by the `.xtyle-lightbox` host class, not a
 * hand-rolled `<dialog>`: it inherits the dialog's overridable chrome, its `::part()` hooks, native
 * focus trap, Escape, scrim, and backdrop-click-to-close, and its body-portal (so a lightbox opened
 * from inside a transformed/frosted panel still centers on the viewport). The image slots into the
 * body, the caption into the footer; the dialog supplies the close button.
 */
function buildDialog(): DialogElement {
	const el = document.createElement("xtyle-dialog") as DialogElement;
	el.className = "xtyle-lightbox";
	el.setAttribute("label", "Image viewer");
	el.innerHTML =
		`<img class="xtyle-image__full" src="" alt="" />` +
		`<figcaption slot="footer" class="xtyle-image__lightbox-caption" hidden></figcaption>`;
	document.body.appendChild(el);
	dialog = el;
	return el;
}

function ensureDialog(): DialogElement {
	if (!dialog || !dialog.isConnected) dialog = buildDialog();
	return dialog;
}

/**
 * Opens the shared lightbox on any image `src`, imperatively. One singleton dialog serves the whole
 * document, so a click handler over arbitrary DOM — a `marked`-rendered `{@html}` image, a CMS body,
 * a gallery of mixed sources — can drive the same lightbox the `<xtyle-image lightbox>` component
 * uses. The per-`<Image>` lightbox is the special case; this is the general controller.
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
		caption.textContent = opts.caption ?? "";
		caption.hidden = !opts.caption;
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
export class XtyleLightbox extends XtyleDecoratorElement {
	private controller: AbortController | null = null;
	private observer: MutationObserver | null = null;

	private get scopeRoot(): Document | Element {
		const selector = this.getAttribute("scope");
		return (selector ? document.querySelector(selector) : null) ?? document;
	}

	connectedCallback(): void {
		super.connectedCallback();
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

	override disconnectedCallback(): void {
		super.disconnectedCallback();
		this.controller?.abort();
		this.controller = null;
		this.observer?.disconnect();
		this.observer = null;
	}

	/** Promote non-interactive triggers to keyboard-operable; native `<a>`/`<button>` are skipped. */
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

	private openFromTrigger(trigger: Element, event: Event): void {
		const resolved = resolveTrigger(trigger);
		if (!resolved) return;
		event.preventDefault();
		openLightbox(resolved.src, { alt: resolved.alt, caption: resolved.caption });
	}

	private onClick = (event: MouseEvent): void => {
		const trigger = (event.target as Element)?.closest?.(TRIGGER_SELECTOR);
		if (trigger) this.openFromTrigger(trigger, event);
	};

	private onKeydown = (event: KeyboardEvent): void => {
		if (event.key !== "Enter" && event.key !== " ") return;
		const trigger = (event.target as Element)?.closest?.(TRIGGER_SELECTOR);
		if (trigger && !trigger.matches("a, button")) this.openFromTrigger(trigger, event);
	};
}

define("xtyle-lightbox", XtyleLightbox);
