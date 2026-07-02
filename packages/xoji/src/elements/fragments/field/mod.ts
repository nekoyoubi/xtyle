interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
	setText(selector: string, text: string): void;
	toggle(selector: string, condition: boolean): void;
	addClass(selector: string, className: string): void;
	removeClass(selector: string, className: string): void;
}

interface FieldBindings {
	label?: string | null;
	name?: string | null;
	placeholder?: string | null;
	value?: string | null;
	type?: string | null;
	size?: string;
	disabled?: boolean;
	readonly?: boolean;
	invalid?: boolean;
	required?: boolean;
	clearable?: boolean;
	description?: string | null;
	error?: string | null;
	ariaLabel?: string | null;
	mono?: boolean;
	inputId?: string;
	descriptionId?: string;
	errorId?: string;
}

interface EventPayload {
	dataset?: Record<string, string>;
	value?: string;
	disabled?: boolean;
}

interface Intent {
	inputValue?: string;
	clearValue?: boolean;
	focusInput?: boolean;
	toggleReveal?: boolean;
	emit?: { type: string };
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: FieldBindings, ops: OpsBuilder) => void) => void };
};
declare const xript: { exports: { register(name: string, fn: (...args: unknown[]) => unknown): void } };

function escapeHtml(value: string): string {
	return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(value: string): string {
	return escapeHtml(value).replace(/"/g, "&quot;");
}

function fieldClass(b: FieldBindings): string {
	const size = b.size ?? "md";
	return [
		"xoji-field",
		b.invalid && "xoji-field--invalid",
		b.disabled && "xoji-field--disabled",
		b.readonly && "xoji-field--readonly",
		b.mono && "xoji-field--mono",
		size !== "md" && `xoji-field--${size}`,
	]
		.filter(Boolean)
		.join(" ");
}

function describedBy(b: FieldBindings): string {
	const description = b.description ?? "";
	const error = b.error ?? "";
	return [
		description.length > 0 ? b.descriptionId : null,
		b.invalid && error.length > 0 ? b.errorId : null,
	]
		.filter(Boolean)
		.join(" ");
}

function isInteractive(b: FieldBindings): boolean {
	return !(b.disabled === true) && !(b.readonly === true);
}

function showClear(b: FieldBindings): boolean {
	return b.clearable === true && isInteractive(b) && (b.value ?? "").length > 0;
}

function showReveal(b: FieldBindings): boolean {
	return (b.type ?? "text") === "password" && isInteractive(b);
}

function inner(b: FieldBindings): string {
	const label = b.label ?? "";
	const placeholder = b.placeholder ?? "";
	const type = b.type ?? "text";
	const value = b.value;
	const name = b.name;
	const disabled = b.disabled === true;
	const readonly = b.readonly === true;
	const invalid = b.invalid === true;
	const required = b.required === true;
	const description = b.description ?? "";
	const error = b.error ?? "";
	const inputId = b.inputId ?? "xoji-field";
	const descriptionId = b.descriptionId ?? `${inputId}-desc`;
	const errorId = b.errorId ?? `${inputId}-error`;

	const clearShown = showClear(b);
	const revealShown = showReveal(b);
	const describes = describedBy(b);
	const fallbackAriaLabel = label.length === 0 && !b.ariaLabel;

	const inputAttrs = [
		`class="xoji-control xoji-field__input"`,
		`part="input"`,
		`id="${escapeAttr(inputId)}"`,
		`placeholder="${escapeAttr(placeholder)}"`,
		`type="${escapeAttr(type)}"`,
		disabled ? "disabled" : null,
		readonly ? "readonly" : null,
		name != null ? `name="${escapeAttr(name)}"` : null,
		value != null ? `value="${escapeAttr(value)}"` : null,
		`aria-invalid="${invalid}"`,
		fallbackAriaLabel ? `aria-label="${escapeAttr(placeholder)}"` : null,
		required ? "required" : null,
		required ? `aria-required="true"` : null,
		describes.length > 0 ? `aria-describedby="${escapeAttr(describes)}"` : null,
	]
		.filter(Boolean)
		.join(" ");

	const star = required
		? `<span class="xoji-field__required" part="required" aria-hidden="true">*</span>`
		: "";
	const labelHidden = label.length === 0 ? " hidden" : "";

	const revealHidden = revealShown ? "" : " hidden";
	const typeIsText = type === "text";
	const revealPressed = String(typeIsText);
	const revealLabel = typeIsText ? "Hide value" : "Show value";

	const clearHidden = clearShown ? "" : " hidden";
	const descriptionHidden = description.length === 0 ? " hidden" : "";
	const errorHidden = !invalid || error.length === 0 ? " hidden" : "";

	return (
		`<label class="xoji-field__label" part="label" for="${escapeAttr(inputId)}"${labelHidden}>${escapeHtml(label)}${star}</label>` +
		`<div class="xoji-field__control" part="control">` +
		`<span class="xoji-field__adornment" part="adornment"><slot name="prefix"></slot></span>` +
		`<input ${inputAttrs} />` +
		`<button type="button" class="xoji-field__action" part="action-reveal" data-action="reveal"${revealHidden} aria-pressed="${revealPressed}" aria-label="${escapeAttr(revealLabel)}">` +
		`<slot name="reveal-icon"><span aria-hidden="true">&#128065;</span></slot>` +
		`</button>` +
		`<button type="button" class="xoji-field__action" part="action-clear" data-action="clear"${clearHidden} aria-label="Clear">` +
		`<slot name="clear-icon"><span aria-hidden="true">&times;</span></slot>` +
		`</button>` +
		`<span class="xoji-field__adornment" part="adornment"><slot name="suffix"></slot></span>` +
		`</div>` +
		`<span class="xoji-field__description" part="description" id="${escapeAttr(descriptionId)}"${descriptionHidden}>${escapeHtml(description)}</span>` +
		`<span class="xoji-field__error" part="error" id="${escapeAttr(errorId)}"${errorHidden}>${escapeHtml(error)}</span>`
	);
}

hooks.fragment.mount("field", (bindings, ops) => {
	ops.setAttr("[data-root]", "class", fieldClass(bindings));
	ops.replaceChildren("[data-field]", inner(bindings));
});

hooks.fragment.update("field", (bindings, ops) => {
	ops.setAttr("[data-root]", "class", fieldClass(bindings));

	const labelText = bindings.label ?? "";
	const star = bindings.required
		? `<span class="xoji-field__required" part="required" aria-hidden="true">*</span>`
		: "";
	ops.replaceChildren(".xoji-field__label", `${escapeHtml(labelText)}${star}`);
	ops.toggle(".xoji-field__label", labelText.length === 0 ? false : true);

	ops.setAttr(".xoji-field__input", "aria-invalid", String(bindings.invalid === true));

	const descText = bindings.description ?? "";
	ops.setText(".xoji-field__description", descText);
	ops.toggle(".xoji-field__description", descText.length > 0);

	const errorText = bindings.error ?? "";
	ops.setText(".xoji-field__error", errorText);
	ops.toggle(".xoji-field__error", bindings.invalid === true && errorText.length > 0);

	ops.toggle('[data-action="clear"]', showClear(bindings));
	ops.toggle('[data-action="reveal"]', showReveal(bindings));
});

xript.exports.register("onInput", (payload: unknown): Intent => {
	const e = payload as EventPayload;
	return { inputValue: e.value ?? "", emit: { type: "input" } };
});

xript.exports.register("onChange", (): Intent => {
	return { emit: { type: "change" } };
});

xript.exports.register("clear", (payload: unknown): Intent => {
	const e = payload as EventPayload;
	if (e.disabled) return {};
	return { clearValue: true, focusInput: true, emit: { type: "input" } };
});

xript.exports.register("reveal", (): Intent => {
	return { toggleReveal: true };
});
