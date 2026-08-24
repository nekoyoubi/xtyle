import { XtyleElement, define, type StyleMode } from "./base.js";
import type { Size } from "../index.js";
import { selectHostCss } from "../markup/index.js";
import { FragmentHost } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/select/source.generated.js";
import { resolveVocab, SIZES } from "../vocab.js";


let selectCounter = 0;

export class XtyleSelect extends XtyleElement {
	static formAssociated = true;

	private internals: ElementInternals | null = null;

	protected override formInternals(): ElementInternals | null {
		return this.internals;
	}

	protected override get fillOwnsFormName(): boolean {
		return true;
	}
	private selectNumber = ++selectCounter;
	private fieldId = `xtyle-select-${this.selectNumber}`;
	private errorId = `xtyle-select-error-${this.selectNumber}`;
	private changeWired = false;
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "select", {
		applyIntent: () => {},
		afterApply: () => {
			const field = this.field;
			const value = this.getAttribute("value");
			if (field && value !== null && field.value !== value) field.value = value;
			this.syncFormValue();
			this.verifyFormName();
		},
	});

	constructor() {
		super();
		if ("attachInternals" in this) {
			try {
				this.internals = this.attachInternals();
			} catch {
				this.internals = null;
			}
		}
	}

	protected override get styleMode(): StyleMode {
		return "auto";
	}

	static get observedAttributes(): string[] {
		return ["label", "value", "size", "disabled", "invalid", "required", "required-message", "error", "name", "focusable"];
	}

	override connectedCallback(): void {
		super.connectedCallback();
		this.observeChildren();
	}

	get value(): string {
		return this.field?.value ?? this.getAttribute("value") ?? "";
	}
	set value(value: string | null | undefined) {
		this.reflectStringLive("value", value, () => this.field);
	}

	get size(): Size {
		return resolveVocab(this.getAttribute("size"), SIZES, "md", "select size");
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

	get invalid(): boolean {
		return this.hasAttribute("invalid");
	}
	set invalid(value: boolean) {
		this.reflectBoolean("invalid", value);
	}

	get required(): boolean {
		return this.hasAttribute("required");
	}
	set required(value: boolean) {
		this.reflectBoolean("required", value);
	}

	private get field(): HTMLSelectElement | null {
		return this.root.querySelector("select");
	}

	private optionsHtml(): string {
		return Array.from(this.children)
			.filter((child) => {
				const tag = child.tagName.toLowerCase();
				return tag === "option" || tag === "optgroup";
			})
			.map((child) => child.outerHTML)
			.join("");
	}

	private get bindings(): Record<string, unknown> {
		return {
			label: this.getAttribute("label") ?? "",
			value: this.getAttribute("value"),
			size: this.size,
			disabled: this.disabled,
			focusable: this.focusable,			invalid: this.invalid,
			required: this.required,
			error: this.validityMessage("error", ""),
			name: this.getAttribute("name"),
			fieldId: this.fieldId,
			errorId: this.errorId,
			optionsHtml: this.optionsHtml(),
		};
	}

	/** Structural state ops can't patch incrementally: the `disabled`/`required` boolean attrs and `name`
	 * presence on the native `<select>`, plus the projected option set. A change here rebuilds; flipping
	 * `invalid`/`error`/`value` is a cheap patch that keeps the live `<select>` and its focus. */
	private shapeSignature(): string {
		return `${this.disabled}|${this.required}|${this.getAttribute("name") ?? ""}|${this.optionsHtml()}`;
	}

	private syncField(): void {
		const field = this.field;
		if (!field) return;
		field.disabled = this.disabled;
		field.required = this.required;
		if (this.required) field.setAttribute("aria-required", "true");
		else field.removeAttribute("aria-required");
		const value = this.getAttribute("value");
		if (value !== null && field.value !== value) field.value = value;
		const error = this.validityMessage("error", "");
		if (this.invalid && error.length > 0) field.setAttribute("aria-describedby", this.errorId);
		else field.removeAttribute("aria-describedby");
		this.warnIfUnnamed(field);
		this.syncFormValue();
	}

	private syncFormValue(): void {
		if (!this.internals) return;
		if (this.reportsFormValue()) {
			try {
				this.internals.setFormValue(this.value);
			} catch {}
		}
		this.syncValidity();
	}

	private syncValidity(): void {
		if (!this.internals) return;
		const field = this.field ?? undefined;
		try {
			if (this.invalid) {
				this.internals.setValidity({ customError: true }, this.validityMessage("error", "Invalid value"), field);
			} else if (this.required && this.value.length === 0) {
				this.internals.setValidity({ valueMissing: true }, this.validityMessage("required-message", "Please select a value."), field);
			} else {
				this.internals.setValidity({});
			}
		} catch {}
	}

	formResetCallback(): void {
		const initial = this.getAttribute("value") ?? "";
		if (this.field) this.field.value = initial;
		this.syncFormValue();
	}

	formDisabledCallback(disabled: boolean): void {
		if (this.field) this.field.disabled = disabled;
	}

	private warnIfUnnamed(field: HTMLSelectElement): void {
		const labelText = this.getAttribute("label") ?? "";
		if (labelText.length > 0) {
			field.removeAttribute("aria-label");
			return;
		}
		const aria = this.getAttribute("aria-label") ?? this.getAttribute("aria-labelledby");
		if (aria) {
			field.setAttribute(this.hasAttribute("aria-label") ? "aria-label" : "aria-labelledby", aria);
			return;
		}
		console.warn(
			"xtyle-select: a select with no `label` has no accessible name. Provide a `label` or `aria-label` so it is announced.",
		);
	}

	private wireChange(): void {
		if (this.changeWired) return;
		this.changeWired = true;
		this.root.addEventListener("change", (event) => {
			if (!(event.target instanceof HTMLSelectElement)) return;
			this.setAttribute("value", event.target.value);
			this.syncFormValue();
			this.emitOwn("change", event, { value: this.value });
		});
	}

	attributeChangedCallback(): void {
		if (this.root.firstChild) this.render();
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(selectHostCss);
		this.fragment.reshapeIfChanged(this.shapeSignature());
		this.fragment.update(this.bindings);
		this.syncField();
		this.wireChange();
	}

	protected template(): string {
		return "";
	}
}

define("xtyle-select", XtyleSelect);
