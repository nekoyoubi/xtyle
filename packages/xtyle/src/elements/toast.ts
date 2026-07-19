import { XtyleElement, define, type StyleMode } from "./base.js";
import {
	toastHostCss,
	toastRegionHostCss,
	toastRegionMarkup,
	type ToastRegionMarkupProps,
	type ToastSeverity,
	type ToastTone,
	type ToastVariant,
} from "../markup/index.js";
import { FragmentHost, type FragmentIntent } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/toast/source.generated.js";
import { resolveOptionalTone, resolveOptionalVocab, TOAST_SEVERITIES, resolveVocab, TOAST_VARIANTS } from "../vocab.js";

/**
 * Toasts a region pushed hand their removal back to it — the region owns the leave transition, the
 * auto-dismiss timer, and the stack cap. A standalone toast has no owner and removes itself.
 */
const regionRelease = new WeakMap<XtyleToast, (item: XtyleToast) => void>();

/** Options accepted by {@link XtyleToastRegion.toast}. */
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
 * announcement is owned by the enclosing {@link XtyleToastRegion}, so a standalone
 * toast also carries its own `role`/`aria-live` for declarative use.
 */
export class XtyleToast extends XtyleElement {
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
		return resolveOptionalTone<ToastTone>(this.getAttribute("tone"));
	}
	set tone(value: ToastTone | null | undefined) {
		this.reflectString("tone", value);
	}

	get severity(): ToastSeverity | null {
		return resolveOptionalVocab(this.getAttribute("severity"), TOAST_SEVERITIES, "toast severity");
	}
	set severity(value: ToastSeverity | null | undefined) {
		this.reflectString("severity", value);
	}

	get variant(): ToastVariant {
		return resolveVocab(this.getAttribute("variant"), TOAST_VARIANTS, "soft", "toast variant");
	}
	set variant(value: ToastVariant) {
		this.setAttribute("variant", value);
	}

	/** On by default — an undismissable toast is a trap, so it takes an explicit `closable="false"`
	 * to drop the close button. A bare `closable` attribute (or any other value) reads as on. */
	get closable(): boolean {
		const raw = this.getAttribute("closable");
		if (raw === null) return true;
		const value = raw.trim().toLowerCase();
		return value !== "false" && value !== "none";
	}
	set closable(value: boolean) {
		this.setAttribute("closable", String(value));
	}

	attributeChangedCallback(): void {
		if (this.root.firstChild) this.render();
	}

	private get bindings(): Record<string, unknown> {
		return {
			tone: this.tone,
			severity: this.severity,
			variant: this.variant,
			closable: this.closable,
			closeLabel: this.getAttribute("close-label") ?? "Dismiss",
			actionLabel: this.getAttribute("action-label") ?? null,
		};
	}

	/** Structural state ops can't patch incrementally: whether the close and action buttons exist.
	 * A change here rebuilds; a `tone` / `variant` swap is a cheap patch. */
	private shapeSignature(): string {
		return `${this.closable}|${this.getAttribute("action-label")}|${this.getAttribute("close-label")}`;
	}

	private dismiss(): void {
		const event = new CustomEvent("dismiss", { bubbles: true, composed: true, cancelable: true });
		if (!this.dispatchEvent(event)) return;
		const release = regionRelease.get(this);
		if (release) release(this);
		else this.remove();
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
export class XtyleToastRegion extends XtyleElement {
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
	 * Push a toast into the region. Returns the created `<xtyle-toast>` so callers can dismiss it
	 * early. The card is rendered by the same fill the declarative element uses, so an app's
	 * `component.toast` override reshapes a pushed toast exactly as it reshapes a placed one.
	 * Auto-dismiss pauses while the pointer or focus rests on the toast.
	 */
	toast(opts: ToastOptions): HTMLElement {
		const item = document.createElement("xtyle-toast") as XtyleToast;
		if (opts.tone) item.setAttribute("tone", opts.tone);
		if (opts.severity) item.setAttribute("severity", opts.severity);
		item.setAttribute("variant", opts.variant ?? "soft");
		if (opts.actionLabel) item.setAttribute("action-label", opts.actionLabel);
		if (opts.closeLabel) item.setAttribute("close-label", opts.closeLabel);
		if (opts.closable === false) item.setAttribute("closable", "false");
		item.textContent = opts.message;
		item.classList.add("xtyle-toast--enter");
		regionRelease.set(item, (el) => this.release(el));

		this.regionEl?.appendChild(item);
		this.enforceMax();

		requestAnimationFrame(() => item.classList.remove("xtyle-toast--enter"));

		item.addEventListener("action", () => {
			opts.onAction?.();
			this.dismiss(item);
		});

		const duration = opts.duration ?? 5000;
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
		return this.root.querySelector(".xtyle-toast-region");
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

	/** Announce the dismissal, then remove unless a listener cancelled it. */
	private dismiss(item: HTMLElement): void {
		this.clear(item);
		const event = new CustomEvent("dismiss", { bubbles: true, composed: true, cancelable: true });
		if (!item.dispatchEvent(event)) return;
		this.release(item);
	}

	/** The removal half of a dismissal: play the leave transition and drop the card. Reached
	 * directly when the toast itself already announced the dismissal and got consent (its close
	 * button), so the region never doubles the `dismiss` event. */
	private release(item: HTMLElement): void {
		this.clear(item);
		item.classList.add("xtyle-toast--leave");
		const remove = () => item.remove();
		item.addEventListener("transitionend", remove, { once: true });
		window.setTimeout(remove, 600);
	}

	private enforceMax(): void {
		const region = this.regionEl;
		if (!region) return;
		const items = region.querySelectorAll("xtyle-toast");
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

define("xtyle-toast", XtyleToast);
define("xtyle-toast-region", XtyleToastRegion);
