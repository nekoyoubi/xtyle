import { XojiElement, define, type StyleMode } from "./base.js";
import type { Size } from "../index.js";
import { fieldHostCss } from "../markup/index.js";
import { FragmentHost, type FragmentIntent } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/field/source.generated.js";

let fieldCounter = 0;

export class XojiField extends XojiElement {
	protected override get styleMode(): StyleMode {
		return "auto";
	}

	static formAssociated = true;

	private internals: ElementInternals | null = null;
	private fieldNumber = ++fieldCounter;
	private inputId = `xoji-field-${this.fieldNumber}`;
	private descriptionId = `xoji-field-desc-${this.fieldNumber}`;
	private errorId = `xoji-field-error-${this.fieldNumber}`;
	private lastShape = "";
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "field", {
		applyIntent: (intent, event) => this.applyIntent(intent, event),
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

	static get observedAttributes(): string[] {
		return [
			"label",
			"name",
			"placeholder",
			"value",
			"type",
			"size",
			"disabled",
			"readonly",
			"invalid",
			"required",
			"clearable",
			"description",
			"error",
		];
	}

	get value(): string {
		return this.input?.value ?? this.getAttribute("value") ?? "";
	}
	set value(value: string | null | undefined) {
		this.reflectStringLive("value", value, () => this.input);
	}

	get name(): string | null {
		return this.getAttribute("name");
	}
	set name(value: string | null | undefined) {
		this.reflectString("name", value);
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

	get readonly(): boolean {
		return this.hasAttribute("readonly");
	}
	set readonly(value: boolean) {
		this.reflectBoolean("readonly", value);
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

	get clearable(): boolean {
		return this.hasAttribute("clearable");
	}
	set clearable(value: boolean) {
		this.reflectBoolean("clearable", value);
	}

	private get input(): HTMLInputElement | null {
		return this.root.querySelector("input");
	}

	attributeChangedCallback(): void {
		if (this.root.firstChild) this.render();
	}

	private get bindings(): Record<string, unknown> {
		return {
			label: this.getAttribute("label"),
			name: this.name,
			placeholder: this.getAttribute("placeholder"),
			value: this.getAttribute("value"),
			type: this.getAttribute("type"),
			size: this.size,
			disabled: this.disabled,
			readonly: this.readonly,
			invalid: this.invalid,
			required: this.required,
			clearable: this.clearable,
			description: this.getAttribute("description"),
			error: this.getAttribute("error"),
			ariaLabel: this.getAttribute("aria-label"),
			inputId: this.inputId,
			descriptionId: this.descriptionId,
			errorId: this.errorId,
		};
	}

	/** Structural state the `update` ops can't patch incrementally — chiefly attribute *removal*,
	 * which the op buffer can't express (`disabled`/`readonly`/`required`/`name`, the fallback
	 * `aria-label` toggle, the input `type`). A change here rebuilds; a typed `value`, a class
	 * toggle, or an action-visibility flip stays a cheap patch and keeps input focus. */
	private shapeSignature(): string {
		return [
			this.disabled,
			this.readonly,
			this.required,
			this.getAttribute("name") != null,
			this.getAttribute("label") != null && this.getAttribute("label") !== "",
			this.getAttribute("placeholder") ?? "",
			this.getAttribute("type") ?? "text",
			this.getAttribute("aria-label") != null,
			(this.getAttribute("description") ?? "").length > 0,
			this.invalid && (this.getAttribute("error") ?? "").length > 0,
		].join("|");
	}

	/** Whether the `value` attribute has diverged from what the live input displays. `applyOps` has
	 * no op that assigns the input's `.value` property, so a programmatic value change (or
	 * `formResetCallback`) reaches the input only by re-rendering it through a remount. While the
	 * user types, `applyIntent` keeps the attribute in step with `input.value`, so they match and
	 * no remount fires — mirroring the original's `input.value !== value` guard so live typing is
	 * never clobbered. */
	private valueIsStale(): boolean {
		const valueAttr = this.getAttribute("value");
		const input = this.input;
		return valueAttr != null && input != null && input.value !== valueAttr;
	}

	private syncFormValue(): void {
		if (!this.internals) return;
		this.internals.setFormValue(this.value);
		const input = this.input;
		if (this.invalid) {
			this.internals.setValidity({ customError: true }, this.getAttribute("error") ?? "Invalid value", input ?? undefined);
		} else if (this.required && this.value.length === 0) {
			this.internals.setValidity({ valueMissing: true }, "Please fill out this field.", input ?? undefined);
		} else {
			this.internals.setValidity({});
		}
	}

	private warnIfUnnamed(): void {
		const hasLabel = (this.getAttribute("label") ?? "").length > 0;
		const hasAria = !!this.getAttribute("aria-label") || (this.getAttribute("placeholder") ?? "").length > 0;
		if (!hasLabel && !hasAria) {
			console.warn(
				"xoji-field: the input has no accessible name. Provide a `label`, an `aria-label`, or at least a `placeholder`.",
			);
		}
	}

	private syncActions(): void {
		const reveal = this.root.querySelector('[data-action="reveal"]');
		if (reveal) {
			const shown = this.input?.type === "text";
			reveal.setAttribute("aria-pressed", String(shown));
			reveal.setAttribute("aria-label", shown ? "Hide value" : "Show value");
		}
	}

	private applyIntent(intent: FragmentIntent, event: Event): void {
		if (intent.toggleReveal) {
			const input = this.input;
			if (input) input.type = input.type === "password" ? "text" : "password";
			this.syncActions();
			return;
		}
		if (intent.clearValue) {
			const input = this.input;
			if (input) input.value = "";
			this.setAttribute("value", "");
			if (intent.focusInput) input?.focus();
		} else if (intent.inputValue !== undefined) {
			this.setAttribute("value", intent.inputValue);
		}
		if (intent.emit) {
			this.dispatchEvent(new Event(intent.emit.type, { bubbles: true, composed: true }));
			this.syncFormValue();
		}
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(fieldHostCss);
		const signature = this.shapeSignature();
		const structuralChange = !!this.lastShape && signature !== this.lastShape;
		if (structuralChange || this.valueIsStale()) this.fragment.remount();
		this.lastShape = signature;
		this.fragment.update(this.bindings);
		this.warnIfUnnamed();
		this.syncFormValue();
	}

	formDisabledCallback(disabled: boolean): void {
		this.disabled = disabled;
	}

	formResetCallback(): void {
		this.value = this.getAttribute("value") ?? "";
	}
}

define("xoji-field", XojiField);
