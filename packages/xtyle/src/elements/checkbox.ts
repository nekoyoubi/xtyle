import { XtyleElement, define, type StyleMode } from "./base.js";
import type { Size, FullTone } from "../index.js";
import {
	checkboxHostCss,
	checkboxGroupHostCss,
	checkboxGroupMarkup,
	type CheckboxGroupMarkupProps,
} from "../markup/index.js";
import { FragmentHost, type FragmentIntent } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/checkbox/source.generated.js";

export class XtyleCheckbox extends XtyleElement {
	protected override get styleMode(): StyleMode {
		return "auto";
	}

	static formAssociated = true;

	private internals: ElementInternals;
	private indeterminateValue = false;
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "checkbox", {
		applyIntent: (intent, event) => this.applyIntent(intent, event),
	});

	constructor() {
		super();
		this.internals = this.attachInternals();
	}

	static get observedAttributes(): string[] {
		return ["checked", "indeterminate", "disabled", "size", "tone", "name", "value", "label", "labelledby"];
	}

	get checked(): boolean {
		return this.hasAttribute("checked");
	}
	set checked(value: boolean) {
		this.reflectBoolean("checked", value);
	}

	get indeterminate(): boolean {
		return this.indeterminateValue;
	}
	set indeterminate(value: boolean) {
		this.indeterminateValue = value;
		this.reflectBoolean("indeterminate", value);
	}

	get disabled(): boolean {
		return this.hasAttribute("disabled");
	}
	set disabled(value: boolean) {
		this.reflectBoolean("disabled", value);
	}

	get size(): Size {
		return (this.getAttribute("size") as Size) ?? "md";
	}
	set size(value: Size) {
		this.setAttribute("size", value);
	}

	get tone(): FullTone {
		return (this.getAttribute("tone") as FullTone) ?? "accent";
	}
	set tone(value: FullTone) {
		this.setAttribute("tone", value);
	}

	get value(): string {
		return this.getAttribute("value") ?? "on";
	}
	set value(value: string | null | undefined) {
		this.reflectString("value", value);
	}

	private get control(): HTMLInputElement | null {
		return this.root.querySelector("input");
	}

	override connectedCallback(): void {
		super.connectedCallback();
		this.addEventListener("click", this.onHostClick);
	}

	override disconnectedCallback(): void {
		super.disconnectedCallback();
		this.removeEventListener("click", this.onHostClick);
	}

	private onHostClick = (event: MouseEvent): void => {
		if (this.disabled) return;
		this.forwardSlottedLabelClick(event, this.control);
	};

	attributeChangedCallback(name: string): void {
		if (name === "indeterminate") this.indeterminateValue = this.hasAttribute("indeterminate");
		if (this.root.firstChild) this.render();
	}

	private get bindings(): Record<string, unknown> {
		return {
			checked: this.checked,
			indeterminate: this.indeterminate,
			disabled: this.disabled,
			size: this.size,
			tone: this.tone,
			label: this.getAttribute("label"),
			labelledby: this.getAttribute("labelledby"),
		};
	}

	/** Structural state ops can't patch incrementally: the aria naming and the `disabled` boolean attr,
	 * which can't be removed via `setAttr`. A change here rebuilds; `checked` and `indeterminate` are
	 * cheap DOM-property patches the host applies post-update, so toggling never rebuilds and never
	 * loses focus on the live input. */
	private shapeSignature(): string {
		return `${this.disabled}|${this.getAttribute("label")}|${this.getAttribute("labelledby")}`;
	}

	private syncForm(): void {
		this.internals.setFormValue(this.checked ? this.value : null);
	}

	/** Name the shadow `<input>` from the visible slotted text when present — the light-DOM
	 * label sibling can't be referenced across the shadow boundary, so its text is mirrored
	 * onto the control. An explicit `labelledby` (consumer-owned) or `label`-only case is left
	 * to the SSR markup. */
	private nameControl(control: HTMLInputElement): void {
		if (this.getAttribute("labelledby")) return;
		const slotText = this.textContent?.trim() ?? "";
		if (slotText) control.setAttribute("aria-label", slotText);
	}

	private warnIfUnnamed(): void {
		const hasLabel = this.getAttribute("label") || this.getAttribute("labelledby") || this.textContent?.trim();
		if (!hasLabel) {
			console.warn(
				"xtyle-checkbox: no accessible name. Provide label text in the default slot, or a `label` / `labelledby` attribute.",
			);
		}
	}

	private applyIntent(intent: FragmentIntent, _event: Event): void {
		if (intent.setChecked === undefined) return;
		this.indeterminate = false;
		this.checked = intent.setChecked;
		this.syncForm();
		this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(checkboxHostCss);
		this.fragment.reshapeIfChanged(this.shapeSignature());
		this.fragment.update(this.bindings);
		const control = this.control;
		if (control) {
			control.checked = this.checked;
			control.indeterminate = this.indeterminate;
			this.nameControl(control);
		}
		this.warnIfUnnamed();
		this.syncForm();
	}
}

define("xtyle-checkbox", XtyleCheckbox);

/**
 * A group of checkboxes with a tri-state "select all" heading the group owns: when every item
 * is checked the heading is checked, some checked shows indeterminate, none clears it; toggling
 * the heading applies to every (enabled) item. This roll-up is the default — set `manual` to keep
 * the heading but drive its state yourself.
 */
export class XtyleCheckboxGroup extends XtyleElement {
	private labelId = `xtyle-checkbox-group-${Math.random().toString(36).slice(2, 8)}-label`;

	static get observedAttributes(): string[] {
		return ["label", "labelledby", "tone", "size", "disabled", "manual"];
	}

	get label(): string | null {
		return this.getAttribute("label");
	}
	set label(value: string | null | undefined) {
		this.reflectString("label", value);
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

	get disabled(): boolean {
		return this.hasAttribute("disabled");
	}
	set disabled(value: boolean) {
		this.reflectBoolean("disabled", value);
	}

	/** Stop the automatic all/some/none roll-up; the heading stays but its state is yours to drive. */
	get manual(): boolean {
		return this.hasAttribute("manual");
	}
	set manual(value: boolean) {
		this.reflectBoolean("manual", value);
	}

	override connectedCallback(): void {
		super.connectedCallback();
		this.addEventListener("change", this.onItemChange);
		// Slotted items can arrive after connect (client frameworks), so derive once a microtask later.
		queueMicrotask(() => {
			if (!this.manual) this.sync();
		});
	}

	override disconnectedCallback(): void {
		super.disconnectedCallback();
		this.removeEventListener("change", this.onItemChange);
	}

	attributeChangedCallback(): void {
		if (this.root.firstChild) this.render();
	}

	private items(): XtyleCheckbox[] {
		return Array.from(this.querySelectorAll<XtyleCheckbox>("xtyle-checkbox"));
	}

	private get headingInput(): HTMLInputElement | null {
		return this.root.querySelector(".xtyle-checkbox-group__heading input");
	}

	private get headingLabel(): HTMLElement | null {
		return this.root.querySelector(".xtyle-checkbox-group__heading");
	}

	/** Recompute the heading from the items: all checked → checked, some → indeterminate, none → off. */
	sync(): void {
		const input = this.headingInput;
		const heading = this.headingLabel;
		if (!input || !heading) return;
		const items = this.items();
		const checked = items.filter((item) => item.checked).length;
		const all = items.length > 0 && checked === items.length;
		const some = checked > 0 && checked < items.length;
		input.checked = all;
		input.indeterminate = some;
		heading.classList.toggle("xtyle-checkbox--indeterminate", some);
	}

	private onItemChange = (event: Event): void => {
		// The heading is a native input in the shadow; its change isn't composed and never reaches
		// here. Only composed item changes (from `xtyle-checkbox`) do, so this only ever rolls up.
		if (this.manual) return;
		if (!(event.target as Element | null)?.closest("xtyle-checkbox")) return;
		this.sync();
	};

	private onHeadingToggle = (): void => {
		const input = this.headingInput;
		if (!input) return;
		if (!this.manual) {
			const next = input.checked;
			for (const item of this.items()) {
				if (item.disabled) continue;
				item.indeterminate = false;
				item.checked = next;
			}
			input.indeterminate = false;
			this.headingLabel?.classList.remove("xtyle-checkbox--indeterminate");
		}
		this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
	};

	private warnIfUnnamed(): void {
		if (!this.label && !this.getAttribute("labelledby") && !this.getAttribute("aria-label")) {
			console.warn(
				"xtyle-checkbox-group: no accessible name. Provide a `label`, `labelledby`, or `aria-label` so the group is announced.",
			);
		}
	}

	private get markupProps(): CheckboxGroupMarkupProps {
		return {
			label: this.label,
			labelledby: this.getAttribute("labelledby"),
			tone: this.tone,
			size: this.size,
			disabled: this.disabled,
			labelId: this.labelId,
		};
	}

	protected styles(): string {
		return checkboxGroupHostCss;
	}

	protected template(): string {
		return checkboxGroupMarkup(this.markupProps);
	}

	protected override render(): void {
		super.render();
		const input = this.headingInput;
		if (input) {
			input.disabled = this.disabled;
			// `render()` rebuilds the shadow, so the input is a fresh node each call — wire it anew.
			input.addEventListener("change", this.onHeadingToggle);
		}
		this.root
			.querySelector<HTMLSlotElement>("slot")
			?.addEventListener("slotchange", () => {
				if (!this.manual) this.sync();
			});
		if (!this.manual) this.sync();
		this.warnIfUnnamed();
	}
}

define("xtyle-checkbox-group", XtyleCheckboxGroup);
