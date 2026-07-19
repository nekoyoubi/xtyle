import { XtyleElement, define, type StyleMode } from "./base.js";
import type { Size, FullTone } from "../index.js";
import { switchHostCss } from "../markup/index.js";
import { FragmentHost, type FragmentIntent } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/switch/source.generated.js";
import { resolveTone, resolveVocab, SWITCH_SIZES } from "../vocab.js";

export class XtyleSwitch extends XtyleElement {
	static formAssociated = true;

	protected override get styleMode(): StyleMode {
		return "auto";
	}

	private internals: ElementInternals | null = null;
	private elementId = `xtyle-switch-${Math.random().toString(36).slice(2, 8)}`;
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "switch", {
		applyIntent: (intent, event) => this.applyIntent(intent, event),
	});

	static get observedAttributes(): string[] {
		return ["checked", "disabled", "size", "tone", "shape", "orientation", "reverse", "label-side", "label", "labelledby", "on-label", "off-label", "name", "value"];
	}

	constructor() {
		super();
		if (typeof this.attachInternals === "function") {
			this.internals = this.attachInternals();
		}
	}

	get checked(): boolean {
		return this.hasAttribute("checked");
	}
	set checked(value: boolean) {
		this.reflectBoolean("checked", value);
	}

	get disabled(): boolean {
		return this.hasAttribute("disabled");
	}
	set disabled(value: boolean) {
		this.reflectBoolean("disabled", value);
	}

	get size(): Size {
		return resolveVocab(this.getAttribute("size"), SWITCH_SIZES, "md", "switch size");
	}
	set size(value: Size) {
		this.setAttribute("size", value);
	}

	get tone(): FullTone {
		return resolveTone(this.getAttribute("tone"), "accent");
	}
	set tone(value: FullTone) {
		this.setAttribute("tone", value);
	}

	get shape(): "pill" | "square" {
		return this.getAttribute("shape") === "square" ? "square" : "pill";
	}
	set shape(value: "pill" | "square") {
		this.setAttribute("shape", value);
	}

	get orientation(): "horizontal" | "vertical" {
		return this.getAttribute("orientation") === "vertical" ? "vertical" : "horizontal";
	}
	set orientation(value: "horizontal" | "vertical") {
		this.setAttribute("orientation", value);
	}

	get reverse(): boolean {
		return this.hasAttribute("reverse");
	}
	set reverse(value: boolean) {
		this.reflectBoolean("reverse", value);
	}

	get labelSide(): "start" | "end" {
		return this.getAttribute("label-side") === "end" ? "end" : "start";
	}
	set labelSide(value: "start" | "end") {
		this.setAttribute("label-side", value);
	}

	get value(): string {
		return this.getAttribute("value") ?? "on";
	}
	set value(value: string | null | undefined) {
		this.reflectString("value", value);
	}

	attributeChangedCallback(): void {
		if (this.root.firstChild) this.render();
	}

	private get bindings(): Record<string, unknown> {
		return {
			checked: this.checked,
			disabled: this.disabled,
			size: this.size,
			tone: this.tone,
			shape: this.shape,
			orientation: this.orientation,
			reverse: this.reverse,
			labelSide: this.labelSide,
			label: this.getAttribute("label"),
			labelledby: this.getAttribute("labelledby"),
			onLabel: this.getAttribute("on-label"),
			offLabel: this.getAttribute("off-label"),
			elementId: this.elementId,
		};
	}

	/** Structural state ops can't patch incrementally: the `disabled` boolean attr and whether
	 * the label / state spans exist. A change here rebuilds; a `checked` toggle is a cheap patch. */
	private shapeSignature(): string {
		const hasState = this.getAttribute("on-label") != null || this.getAttribute("off-label") != null;
		return `${this.disabled}|${this.getAttribute("label") != null}|${hasState}`;
	}

	private syncForm(): void {
		if (!this.internals) return;
		this.internals.setFormValue(this.checked ? this.value : null);
	}

	private warnIfUnnamed(): void {
		const hasName =
			this.getAttribute("labelledby") ||
			this.getAttribute("label") ||
			this.getAttribute("on-label") ||
			this.getAttribute("off-label");
		if (!hasName) {
			console.warn(
				"xtyle-switch: no accessible name. Provide a `label`, `labelledby`, or `on-label`/`off-label` so the toggle is announced.",
			);
		}
	}

	private applyIntent(intent: FragmentIntent, event: Event): void {
		if (intent.preventDefault) event.preventDefault();
		if (!intent.toggleChecked) return;
		this.checked = !this.checked;
		this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
		this.syncForm();
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(switchHostCss);
		this.fragment.reshapeIfChanged(this.shapeSignature());
		this.fragment.update(this.bindings);
		this.warnIfUnnamed();
		this.syncForm();
	}
}

define("xtyle-switch", XtyleSwitch);
