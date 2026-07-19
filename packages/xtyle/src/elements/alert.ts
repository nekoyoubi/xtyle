import { XtyleElement, define, type StyleMode } from "./base.js";
import { alertHostCss, type AlertSeverity, type AlertTone, type AlertVariant } from "../markup/index.js";
import { FragmentHost, type FragmentIntent } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/alert/source.generated.js";
import { resolveOptionalTone, resolveOptionalVocab, ALERT_SEVERITIES, resolveVocab, ALERT_VARIANTS } from "../vocab.js";

export class XtyleAlert extends XtyleElement {
	protected override get styleMode(): StyleMode {
		return "auto";
	}

	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "alert", {
		applyIntent: (intent, event) => this.applyIntent(intent, event),
	});

	static get observedAttributes(): string[] {
		return ["tone", "severity", "variant", "dismissible", "dismiss-label"];
	}

	get tone(): AlertTone | null {
		return resolveOptionalTone<AlertTone>(this.getAttribute("tone"));
	}
	set tone(value: AlertTone | null | undefined) {
		this.reflectString("tone", value);
	}

	get severity(): AlertSeverity | null {
		return resolveOptionalVocab(this.getAttribute("severity"), ALERT_SEVERITIES, "alert severity");
	}
	set severity(value: AlertSeverity | null | undefined) {
		this.reflectString("severity", value);
	}

	get variant(): AlertVariant {
		return resolveVocab(this.getAttribute("variant"), ALERT_VARIANTS, "soft", "alert variant");
	}
	set variant(value: AlertVariant) {
		this.setAttribute("variant", value);
	}

	get dismissible(): boolean {
		return this.hasAttribute("dismissible");
	}
	set dismissible(value: boolean) {
		this.reflectBoolean("dismissible", value);
	}

	attributeChangedCallback(): void {
		if (this.root.firstChild) this.render();
	}

	private get bindings(): Record<string, unknown> {
		return {
			tone: this.tone,
			severity: this.severity,
			variant: this.variant,
			dismissible: this.dismissible,
			dismissLabel: this.getAttribute("dismiss-label") ?? "Dismiss",
			hasTitle: this.fragment.hasSlotted("title"),
			hasActions: this.fragment.hasSlotted("actions"),
		};
	}

	/** Structural state ops can't patch incrementally: whether the dismiss button exists.
	 * A change here rebuilds; a `tone` / `variant` swap is a cheap patch. */
	private shapeSignature(): string {
		return String(this.dismissible);
	}

	private dismiss(): void {
		const event = new CustomEvent("dismiss", { bubbles: true, composed: true, cancelable: true });
		const proceed = this.dispatchEvent(event);
		if (proceed) this.remove();
	}

	private applyIntent(intent: FragmentIntent, event: Event): void {
		if (!intent.dismiss || !this.dismissible) return;
		if (intent.preventDefault) event.preventDefault();
		event.stopPropagation();
		this.dismiss();
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(alertHostCss);
		this.fragment.reshapeIfChanged(this.shapeSignature());
		this.fragment.update(this.bindings);
	}
}

define("xtyle-alert", XtyleAlert);
