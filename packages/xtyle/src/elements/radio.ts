import { XtyleElement, define, type StyleMode } from "./base.js";
import type { Size, FullTone } from "../index.js";
import {
	radioHostCss,
	radioGroupMarkup,
	radioGroupHostCss,
	type RadioGroupMarkupProps,
} from "../markup/index.js";
import { FragmentHost, type FragmentIntent } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/radio/source.generated.js";

export class XtyleRadio extends XtyleElement {
	protected override get styleMode(): StyleMode {
		return "auto";
	}

	static formAssociated = true;

	private internals: ElementInternals | null = null;
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "radio", {
		applyIntent: (intent, event) => this.applyIntent(intent, event),
	});

	constructor() {
		super();
		if (typeof this.attachInternals === "function") {
			this.internals = this.attachInternals();
		}
	}

	static get observedAttributes(): string[] {
		return ["tone", "size", "name", "value", "checked", "disabled", "invalid", "label", "labelledby"];
	}

	get tone(): FullTone {
		return (this.getAttribute("tone") as FullTone) ?? "accent";
	}
	set tone(value: FullTone) {
		this.setAttribute("tone", value);
	}

	get size(): Size {
		return (this.getAttribute("size") as Size) ?? "md";
	}
	set size(value: Size) {
		this.setAttribute("size", value);
	}

	get name(): string | null {
		return this.getAttribute("name");
	}
	set name(value: string | null | undefined) {
		this.reflectString("name", value);
	}

	get value(): string {
		return this.getAttribute("value") ?? "on";
	}
	set value(value: string | null | undefined) {
		this.reflectString("value", value);
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

	get invalid(): boolean {
		return this.hasAttribute("invalid");
	}
	set invalid(value: boolean) {
		this.reflectBoolean("invalid", value);
	}

	/** The inner native `<input type="radio">` the group drives for roving focus. */
	get control(): HTMLInputElement | null {
		return this.root.querySelector("input");
	}

	set tabIndex(value: number) {
		const control = this.control;
		if (control) control.tabIndex = value;
	}

	override focus(): void {
		this.control?.focus();
	}

	override connectedCallback(): void {
		super.connectedCallback();
		this.addEventListener("click", this.onHostClick);
	}

	disconnectedCallback(): void {
		this.removeEventListener("click", this.onHostClick);
	}

	private onHostClick = (event: MouseEvent): void => {
		if (this.disabled) return;
		this.forwardSlottedLabelClick(event, this.control);
	};

	attributeChangedCallback(): void {
		if (this.root.firstChild) this.render();
		this.syncForm();
	}

	private get bindings(): Record<string, unknown> {
		return {
			tone: this.tone,
			size: this.size,
			name: this.name,
			value: this.value,
			checked: this.checked,
			disabled: this.disabled,
			invalid: this.invalid,
			label: this.getAttribute("label"),
			labelledby: this.getAttribute("labelledby"),
		};
	}

	/** Structural state ops can't patch incrementally: the `disabled` / `invalid` boolean attrs, the
	 * accessible name attrs, and whether a `name` is present. A change here rebuilds; a `checked` flip
	 * is a cheap host-side property patch that keeps the input (and its focus) in place. */
	private shapeSignature(): string {
		return [
			this.disabled,
			this.invalid,
			this.name != null,
			this.getAttribute("label") ?? "",
			this.getAttribute("labelledby") ?? "",
		].join("|");
	}

	private syncForm(): void {
		this.internals?.setFormValue(this.checked ? this.value : null);
	}

	private warnIfUnnamed(): void {
		const hasLabel =
			this.getAttribute("label") || this.getAttribute("labelledby") || this.textContent?.trim();
		if (!hasLabel && !this.getAttribute("aria-label")) {
			console.warn(
				"xtyle-radio: no accessible name. Provide label text in the default slot, or a `label` / `labelledby` attribute.",
			);
		}
	}

	private applyIntent(intent: FragmentIntent, event: Event): void {
		if (intent.preventDefault) event.preventDefault();
		if (!intent.selectRadio || this.disabled) return;
		this.checked = true;
		this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
		this.syncForm();
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(radioHostCss);
		this.fragment.reshapeIfChanged(this.shapeSignature());
		this.fragment.update(this.bindings);
		const control = this.control;
		if (control) {
			control.checked = this.checked;
			this.nameControl(control);
		}
		this.warnIfUnnamed();
		this.syncForm();
	}

	/** Name the shadow `<input>` from the visible slotted text when present — the light-DOM
	 * label sibling can't be referenced across the shadow boundary. An explicit `labelledby`
	 * (consumer-owned) or `label`-only case is left to the SSR markup. */
	private nameControl(control: HTMLInputElement): void {
		if (this.getAttribute("labelledby")) return;
		const slotText = this.textContent?.trim() ?? "";
		if (slotText) control.setAttribute("aria-label", slotText);
	}
}

export class XtyleRadioGroup extends XtyleElement {
	static get observedAttributes(): string[] {
		return ["orientation", "label", "labelledby", "disabled"];
	}

	get orientation(): "vertical" | "horizontal" {
		return (this.getAttribute("orientation") as "vertical" | "horizontal") ?? "vertical";
	}
	set orientation(value: "vertical" | "horizontal") {
		this.setAttribute("orientation", value);
	}

	get disabled(): boolean {
		return this.hasAttribute("disabled");
	}
	set disabled(value: boolean) {
		this.reflectBoolean("disabled", value);
	}

	override connectedCallback(): void {
		super.connectedCallback();
		this.addEventListener("keydown", this.onKeydown);
		this.addEventListener("change", this.onChange);
		queueMicrotask(() => this.updateRovingTabindex());
	}

	disconnectedCallback(): void {
		this.removeEventListener("keydown", this.onKeydown);
		this.removeEventListener("change", this.onChange);
	}

	attributeChangedCallback(): void {
		if (this.root.firstChild) this.render();
		this.updateRovingTabindex();
	}

	private radios(): XtyleRadio[] {
		const all = Array.from(this.querySelectorAll<XtyleRadio>("xtyle-radio"));
		return all.filter((r) => !r.disabled);
	}

	private onChange = (event: Event): void => {
		// Each radio lives in its own shadow root, so the native `name`-based mutual
		// exclusion never engages across the group — enforce single-selection here when a
		// radio reports it became checked (click and keyboard both route through `change`).
		const target = (event.target as Element | null)?.closest("xtyle-radio") as XtyleRadio | null;
		if (target?.checked) {
			for (const radio of Array.from(this.querySelectorAll<XtyleRadio>("xtyle-radio"))) {
				if (radio !== target && radio.checked) radio.checked = false;
			}
		}
		this.updateRovingTabindex();
	};

	private updateRovingTabindex = (): void => {
		const radios = this.radios();
		if (radios.length === 0) return;
		const checked = radios.find((r) => r.checked);
		const focusable = checked ?? radios[0];
		for (const r of radios) r.tabIndex = r === focusable ? 0 : -1;
	};

	private onKeydown = (event: KeyboardEvent): void => {
		const keys = ["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft"];
		if (!keys.includes(event.key)) return;
		const radios = this.radios();
		if (radios.length === 0) return;
		const current = (event.target as Element | null)?.closest("xtyle-radio") as XtyleRadio | null;
		const index = current ? radios.indexOf(current) : -1;
		const forward = event.key === "ArrowDown" || event.key === "ArrowRight";
		const next = radios[(index + (forward ? 1 : radios.length - 1) + radios.length) % radios.length];
		if (!next) return;
		event.preventDefault();
		for (const r of radios) r.checked = r === next;
		next.focus();
		next.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
	};

	private warnIfUnnamed(): void {
		if (!this.getAttribute("label") && !this.getAttribute("labelledby") && !this.getAttribute("aria-label")) {
			console.warn(
				"xtyle-radio-group: no accessible name. Provide a `label`, `labelledby`, or `aria-label` so the group is announced.",
			);
		}
	}

	protected override render(): void {
		super.render();
		this.warnIfUnnamed();
	}

	private labelId = `xtyle-radio-group-${Math.random().toString(36).slice(2, 8)}-label`;

	private get markupProps(): RadioGroupMarkupProps {
		return {
			orientation: this.orientation,
			label: this.getAttribute("label"),
			labelledby: this.getAttribute("labelledby"),
			disabled: this.disabled,
			labelId: this.labelId,
		};
	}

	protected styles(): string {
		return radioGroupHostCss;
	}

	protected template(): string {
		return radioGroupMarkup(this.markupProps);
	}
}

define("xtyle-radio", XtyleRadio);
define("xtyle-radio-group", XtyleRadioGroup);
