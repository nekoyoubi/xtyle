import { XtyleElement, define, type StyleMode } from "./base.js";
import type { Size } from "../index.js";
import { fieldHostCss } from "../markup/index.js";
import { FragmentHost, type FragmentIntent } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/field/source.generated.js";
import { normalizeFieldOptions, type FieldOption } from "./field-options.js";
import { NATIVE_INPUT_ATTRS, forwardNativeInputAttrs } from "./native-input-attrs.js";

let fieldCounter = 0;

export type { FieldOption };
export { normalizeFieldOptions };

export class XtyleField extends XtyleElement {
	protected override get styleMode(): StyleMode {
		return "auto";
	}

	static formAssociated = true;

	private internals: ElementInternals | null = null;
	private fieldNumber = ++fieldCounter;
	private inputId = `xtyle-field-${this.fieldNumber}`;
	private descriptionId = `xtyle-field-desc-${this.fieldNumber}`;
	private errorId = `xtyle-field-error-${this.fieldNumber}`;
	private listId = `xtyle-field-list-${this.fieldNumber}`;
	private optionsProp: FieldOption[] | null = null;
	private lastShape = "";
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "field", {
		applyIntent: (intent, event) => this.applyIntent(intent, event),
		afterApply: () => {
			this.syncDatalist();
			this.forwardNativeAttrs();
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
			"options",
			"mono",
			...NATIVE_INPUT_ATTRS,
		];
	}

	/** Type-ahead suggestions. Set the JS property with `string[]` or `{ value, label }[]`, or pass the
	 * `options` attribute as a JSON array (the declarative / SSR-hydration path). Field renders them into
	 * a `<datalist>` it owns *inside the input's own tree* (shadow or light), since a native datalist in
	 * the page's light DOM can never associate with an input that lives in a shadow root. */
	get options(): FieldOption[] {
		return this.optionsProp ?? normalizeFieldOptions(this.getAttribute("options"));
	}
	set options(value: ReadonlyArray<string | FieldOption> | string | null | undefined) {
		this.optionsProp = value == null ? null : normalizeFieldOptions(value);
		if (this.root.firstChild) this.syncDatalist();
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
			mono: this.mono,
			description: this.getAttribute("description"),
			error: this.getAttribute("error"),
			ariaLabel: this.getAttribute("aria-label"),
			inputId: this.inputId,
			descriptionId: this.descriptionId,
			errorId: this.errorId,
		};
	}

	get mono(): boolean {
		return this.hasAttribute("mono");
	}
	set mono(value: boolean) {
		this.reflectBoolean("mono", value);
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
				"xtyle-field: the input has no accessible name. Provide a `label`, an `aria-label`, or at least a `placeholder`.",
			);
		}
	}

	/** Build (or tear down) the `<datalist>` next to the input and wire the input's `list` to it. The
	 * datalist sits in the input's own root so the association resolves; a remount wipes it with the rest
	 * of the scaffold, so this re-runs every render. Options are written through the DOM (not markup) so
	 * a value never needs escaping. */
	private syncDatalist(): void {
		const input = this.input;
		if (!input) return;
		const options = this.options;
		const root = input.getRootNode() as ParentNode;
		let list = root.querySelector<HTMLDataListElement>(`#${CSS.escape(this.listId)}`);
		if (options.length === 0) {
			list?.remove();
			input.removeAttribute("list");
			return;
		}
		if (!list) {
			list = document.createElement("datalist");
			list.id = this.listId;
			input.after(list);
		}
		list.replaceChildren(
			...options.map((option) => {
				const el = document.createElement("option");
				el.value = option.value;
				if (option.label && option.label !== option.value) el.label = option.label;
				return el;
			}),
		);
		input.setAttribute("list", this.listId);
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
		this.syncDatalist();
		this.forwardNativeAttrs();
		this.warnIfUnnamed();
		this.syncFormValue();
	}

	private forwardNativeAttrs(): void {
		const input = this.input;
		if (input) forwardNativeInputAttrs(this, input);
	}

	formDisabledCallback(disabled: boolean): void {
		this.disabled = disabled;
	}

	formResetCallback(): void {
		this.value = this.getAttribute("value") ?? "";
	}
}

define("xtyle-field", XtyleField);
