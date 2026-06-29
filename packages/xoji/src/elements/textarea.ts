import { XojiElement, define, type StyleMode } from "./base.js";
import type { Size } from "../index.js";
import { textareaHostCss, type TextareaResize } from "../markup/index.js";
import { FragmentHost, type FragmentIntent } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/textarea/source.generated.js";

export type { TextareaResize };

let textareaCounter = 0;

export class XojiTextarea extends XojiElement {
	protected override get styleMode(): StyleMode {
		return "auto";
	}

	static formAssociated = true;

	private internals = this.attachInternals();
	private textareaNumber = ++textareaCounter;
	private fieldId = `xoji-textarea-${this.textareaNumber}`;
	private errorId = `xoji-textarea-error-${this.textareaNumber}`;
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "textarea", {
		applyIntent: (intent, event) => this.applyIntent(intent, event),
		afterApply: () => {
			this.projectContent();
			this.syncField();
		},
	});

	static get observedAttributes(): string[] {
		return ["label", "value", "rows", "resize", "placeholder", "size", "disabled", "invalid", "required", "error", "name"];
	}

	get value(): string {
		return this.field?.value ?? this.getAttribute("value") ?? "";
	}
	set value(value: string | null | undefined) {
		this.reflectStringLive("value", value, () => this.field);
	}

	get rows(): number {
		const raw = this.getAttribute("rows");
		const n = raw === null ? NaN : Number(raw);
		return Number.isFinite(n) && n > 0 ? n : 3;
	}
	set rows(value: number) {
		this.setAttribute("rows", String(value));
	}

	get resize(): TextareaResize {
		return (this.getAttribute("resize") as TextareaResize) ?? "vertical";
	}
	set resize(value: TextareaResize) {
		this.setAttribute("resize", value);
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

	private get field(): HTMLTextAreaElement | null {
		return this.root.querySelector("textarea");
	}

	attributeChangedCallback(): void {
		if (this.root.firstChild) this.render();
	}

	formResetCallback(): void {
		const initial = this.getAttribute("value") ?? "";
		if (this.field) this.field.value = initial;
		this.internals.setFormValue(initial);
	}

	formDisabledCallback(disabled: boolean): void {
		if (this.field) this.field.disabled = disabled;
	}

	private get bindings(): Record<string, unknown> {
		return {
			fieldId: this.fieldId,
			errorId: this.errorId,
			label: this.getAttribute("label"),
			error: this.getAttribute("error"),
			size: this.size,
			resize: this.resize,
			invalid: this.invalid,
		};
	}

	/** Drive the native field's live form properties — the boolean attrs (`disabled`,
	 * `required`) and value-bearing props a fragment op can't toggle off, plus the form value
	 * the element owns. The fragment hook owns the field's presentational state (classes,
	 * label/error text, `aria-invalid`); these stay on the host so focus and form association survive. */
	private syncField(): void {
		const field = this.field;
		if (!field) return;

		field.disabled = this.disabled;
		field.required = this.required;
		field.rows = this.rows;

		const placeholder = this.getAttribute("placeholder");
		if (placeholder !== null) field.placeholder = placeholder;
		else field.removeAttribute("placeholder");

		const value = this.getAttribute("value");
		if (value !== null && field.value !== value) field.value = value;
		this.internals.setFormValue(field.value);

		if (this.required) field.setAttribute("aria-required", "true");
		else field.removeAttribute("aria-required");

		const name = this.getAttribute("name");
		if (name !== null) field.name = name;

		const errorText = this.getAttribute("error") ?? "";
		if (this.invalid && errorText.length > 0) field.setAttribute("aria-describedby", this.errorId);
		else field.removeAttribute("aria-describedby");

		const labelText = this.getAttribute("label") ?? "";
		if (labelText.length === 0) this.warnIfUnnamed(field);
		else field.removeAttribute("aria-label");
	}

	private warnIfUnnamed(field: HTMLTextAreaElement): void {
		const aria = this.getAttribute("aria-label") ?? this.getAttribute("aria-labelledby");
		if (aria) {
			field.setAttribute(this.hasAttribute("aria-label") ? "aria-label" : "aria-labelledby", aria);
			return;
		}
		console.warn(
			"xoji-textarea: a textarea with no `label` has no accessible name. Provide a `label` or `aria-label` so it is announced.",
		);
	}

	private applyIntent(intent: FragmentIntent, _event: Event): void {
		if (typeof intent.value === "string") {
			this.internals.setFormValue(intent.value);
			if (intent.commitValue) this.setAttribute("value", intent.value);
		}
		if (intent.emit) this.dispatchEvent(new Event(intent.emit.type, { bubbles: true, composed: true }));
	}

	private projectContent(): void {
		if (this.getAttribute("value") !== null) return;
		const text = this.textContent?.trim() ?? "";
		if (text.length > 0 && this.field) this.field.value = text;
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(textareaHostCss);
		this.fragment.update(this.bindings);
		this.projectContent();
		this.syncField();
	}
}

define("xoji-textarea", XojiTextarea);
