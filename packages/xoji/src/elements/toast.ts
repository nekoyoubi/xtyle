import { XojiElement, define, escapeHtml, escapeAttr, type StyleMode } from "./base.js";
import {
	ASSERTIVE_SEVERITIES,
	CLOSE_ICON,
	toastHostCss,
	toastIconMarkup,
	toastRegionHostCss,
	toastRegionMarkup,
	toastSeverity,
	type ToastRegionMarkupProps,
	type ToastSeverity,
	type ToastTone,
	type ToastVariant,
} from "../markup/index.js";
import { FragmentHost, type FragmentIntent } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/toast/source.generated.js";

/** Options accepted by {@link XojiToastRegion.toast}. */
export interface ToastOptions {
	/** The message body. Required — it carries the accessible announcement. */
	message: string;
	/** Color — any semantic role, accent variant, or named hue. Defaults to the severity color. */
	tone?: ToastTone;
	/** Meaning — drives the glyph + politeness, independent of color. Omit for a color-only toast. */
	severity?: ToastSeverity;
	/** Visual treatment. Defaults to `soft`. */
	variant?: ToastVariant;
	/** Auto-dismiss delay in milliseconds. `0` disables auto-dismiss. Defaults to `5000`. */
	duration?: number;
	/** Optional action button label. */
	actionLabel?: string;
	/** Invoked when the action button is pressed; the toast dismisses afterward. */
	onAction?: () => void;
	/** Whether to render a close button. Defaults to `true`. */
	closable?: boolean;
	/** Accessible label for the close button. Defaults to `Dismiss`. */
	closeLabel?: string;
}

/**
 * A single toast notification. Renders a status-toned card; the live-region
 * announcement is owned by the enclosing {@link XojiToastRegion}, so a standalone
 * toast also carries its own `role`/`aria-live` for declarative use.
 */
export class XojiToast extends XojiElement {
	protected override get styleMode(): StyleMode {
		return "auto";
	}

	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "toast", {
		applyIntent: (intent, event) => this.applyIntent(intent, event),
	});

	static get observedAttributes(): string[] {
		return ["tone", "severity", "variant", "closable", "close-label", "action-label"];
	}

	get tone(): ToastTone | null {
		return this.getAttribute("tone") as ToastTone | null;
	}
	set tone(value: ToastTone | null | undefined) {
		this.reflectString("tone", value);
	}

	get severity(): ToastSeverity | null {
		return this.getAttribute("severity") as ToastSeverity | null;
	}
	set severity(value: ToastSeverity | null | undefined) {
		this.reflectString("severity", value);
	}

	get variant(): ToastVariant {
		return (this.getAttribute("variant") as ToastVariant) ?? "soft";
	}
	set variant(value: ToastVariant) {
		this.setAttribute("variant", value);
	}

	get closable(): boolean {
		return this.hasAttribute("closable");
	}
	set closable(value: boolean) {
		this.reflectBoolean("closable", value);
	}

	attributeChangedCallback(): void {
		if (this.root.firstChild) this.render();
	}

	private get bindings(): Record<string, unknown> {
		return {
			tone: this.tone,
			severity: this.severity,
			variant: this.variant,
			closable: this.closable || !this.hasAttribute("closable"),
			closeLabel: this.getAttribute("close-label") ?? "Dismiss",
			actionLabel: this.getAttribute("action-label") ?? null,
		};
	}

	/** Structural state ops can't patch incrementally: whether the close and action buttons exist.
	 * A change here rebuilds; a `tone` / `variant` swap is a cheap patch. */
	private shapeSignature(): string {
		const closable = this.closable || !this.hasAttribute("closable");
		return `${closable}|${this.getAttribute("action-label")}|${this.getAttribute("close-label")}`;
	}

	private dismiss(): void {
		const event = new CustomEvent("dismiss", { bubbles: true, composed: true, cancelable: true });
		const proceed = this.dispatchEvent(event);
		if (proceed) this.remove();
	}

	private applyIntent(intent: FragmentIntent, event: Event): void {
		if (intent.dismiss) {
			event.stopPropagation();
			this.dismiss();
			return;
		}
		if (intent.emit) {
			this.dispatchEvent(new CustomEvent(intent.emit.type, { bubbles: true, composed: true }));
		}
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(toastHostCss);
		this.fragment.reshapeIfChanged(this.shapeSignature());
		this.fragment.update(this.bindings);
	}
}

/**
 * The live-region container that holds and announces transient toasts. It never
 * steals focus: it is an `aria-live` region whose politeness follows the most
 * urgent toast pushed (assertive for `danger`/`warn`, polite otherwise). Push a
 * toast imperatively with {@link toast}.
 */
export class XojiToastRegion extends XojiElement {
	static get observedAttributes(): string[] {
		return ["placement", "max", "label"];
	}

	private timers = new WeakMap<HTMLElement, number>();

	get placement(): string {
		return this.getAttribute("placement") ?? "bottom-right";
	}
	set placement(value: string) {
		this.setAttribute("placement", value);
	}

	get max(): number {
		const raw = Number.parseInt(this.getAttribute("max") ?? "", 10);
		return Number.isFinite(raw) && raw > 0 ? raw : 5;
	}

	attributeChangedCallback(): void {
		if (this.root.firstChild) this.render();
	}

	/**
	 * Push a toast into the region. Returns the created element so callers can
	 * dismiss it early. Auto-dismiss pauses while the pointer is over the toast.
	 */
	toast(opts: ToastOptions): HTMLElement {
		const variant: ToastVariant = opts.variant ?? "soft";
		const severity = toastSeverity(opts.tone, opts.severity);
		const color = opts.tone ?? severity ?? "info";
		const assertive = ASSERTIVE_SEVERITIES.has(severity);
		const duration = opts.duration ?? 5000;
		const closable = opts.closable ?? true;

		const item = document.createElement("div");
		item.className = `xoji-toast xoji-toast--${variant} xoji-toast--${color || "info"}${severity ? "" : " xoji-toast--noicon"} xoji-toast--enter`;
		item.setAttribute("part", "toast");
		item.setAttribute("role", assertive ? "alert" : "status");
		item.setAttribute("aria-atomic", "true");

		const action = opts.actionLabel
			? `<button class="xoji-toast__action" part="action" type="button">${escapeHtml(opts.actionLabel)}</button>`
			: "";
		const close = closable
			? `<button class="xoji-toast__close" part="close" type="button" aria-label="${escapeAttr(opts.closeLabel ?? "Dismiss")}">${CLOSE_ICON}</button>`
			: "";
		item.innerHTML = `${toastIconMarkup(severity)}<div class="xoji-toast__body" part="body"><span class="xoji-toast__message" part="message">${escapeHtml(opts.message)}</span>${action}</div>${close}`;

		const region = this.regionEl;
		region?.appendChild(item);
		this.enforceMax();

		requestAnimationFrame(() => item.classList.remove("xoji-toast--enter"));

		const dismiss = () => this.dismiss(item);
		item.querySelector(".xoji-toast__close")?.addEventListener("click", dismiss);
		item.querySelector(".xoji-toast__action")?.addEventListener("click", () => {
			opts.onAction?.();
			dismiss();
		});

		if (duration > 0) {
			this.arm(item, duration);
			item.addEventListener("pointerenter", () => this.clear(item));
			item.addEventListener("pointerleave", () => this.arm(item, duration));
			item.addEventListener("focusin", () => this.clear(item));
			item.addEventListener("focusout", () => this.arm(item, duration));
		}
		return item;
	}

	private get regionEl(): HTMLElement | null {
		return this.root.querySelector(".xoji-toast-region");
	}

	private arm(item: HTMLElement, duration: number): void {
		this.clear(item);
		this.timers.set(
			item,
			window.setTimeout(() => this.dismiss(item), duration),
		);
	}

	private clear(item: HTMLElement): void {
		const timer = this.timers.get(item);
		if (timer !== undefined) {
			window.clearTimeout(timer);
			this.timers.delete(item);
		}
	}

	private dismiss(item: HTMLElement): void {
		this.clear(item);
		const event = new CustomEvent("dismiss", { bubbles: true, composed: true, cancelable: true });
		const proceed = item.dispatchEvent(event);
		if (!proceed) return;
		item.classList.add("xoji-toast--leave");
		const remove = () => item.remove();
		item.addEventListener("transitionend", remove, { once: true });
		window.setTimeout(remove, 600);
	}

	private enforceMax(): void {
		const region = this.regionEl;
		if (!region) return;
		const items = region.querySelectorAll(".xoji-toast");
		const overflow = items.length - this.max;
		for (let i = 0; i < overflow; i += 1) {
			this.dismiss(items[i] as HTMLElement);
		}
	}

	protected styles(): string {
		return toastRegionHostCss;
	}

	private get markupProps(): ToastRegionMarkupProps {
		return {
			placement: this.placement,
			label: this.getAttribute("label") ?? undefined,
		};
	}

	protected template(): string {
		return toastRegionMarkup(this.markupProps);
	}
}

define("xoji-toast", XojiToast);
define("xoji-toast-region", XojiToastRegion);
