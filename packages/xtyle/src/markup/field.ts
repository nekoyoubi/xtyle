import type { Size } from "../vocab.js";
import { escapeHtml as escape, escapeAttr } from "./escape.js";

export interface FieldMarkupProps {
	label?: string;
	name?: string;
	placeholder?: string;
	value?: string;
	type?: string;
	size?: Size;
	disabled?: boolean;
	readonly?: boolean;
	invalid?: boolean;
	required?: boolean;
	clearable?: boolean;
	description?: string;
	error?: string;
	/** Explicit `aria-label` on the host; used to decide whether the input needs a fallback name. */
	ariaLabel?: string;
	/** Stable id for the `<input>`, paired with the label's `for`. */
	inputId: string;
	/** Stable id for the description region, paired with the input's `aria-describedby`. */
	descriptionId: string;
	/** Stable id for the error region, paired with the input's `aria-describedby`. */
	errorId: string;
}

/** The host-layout rule for a field — the one `:host` rule, shared by the element's `styles()` and the SSR declarative shadow root. */
export const fieldHostCss = ":host { display: block; }";

export function fieldClass(props: FieldMarkupProps): string {
	const size = props.size ?? "md";
	return [
		"xtyle-field",
		props.invalid && "xtyle-field--invalid",
		props.disabled && "xtyle-field--disabled",
		props.readonly && "xtyle-field--readonly",
		size !== "md" && `xtyle-field--${size}`,
	]
		.filter(Boolean)
		.join(" ");
}

/**
 * The single source of a field's shadow markup. The custom element renders it into
 * its shadow root at runtime; the `@xtyle/astro` binding emits the same string into a
 * declarative shadow root at build. Both paths render one identical control from one
 * source — no per-binding reimplementation. Pure and DOM-free, so it is safe to
 * import in any environment (SSR included).
 */
export function fieldMarkup(props: FieldMarkupProps): string {
	const label = props.label ?? "";
	const placeholder = props.placeholder ?? "";
	const type = props.type ?? "text";
	const value = props.value;
	const name = props.name;
	const disabled = props.disabled === true;
	const readonly = props.readonly === true;
	const invalid = props.invalid === true;
	const required = props.required === true;
	const description = props.description ?? "";
	const error = props.error ?? "";

	const isInteractive = !disabled && !readonly;
	const showClear = props.clearable === true && isInteractive && (value ?? "").length > 0;
	const showReveal = type === "password" && isInteractive;

	const describedBy = [
		description.length > 0 ? props.descriptionId : null,
		invalid && error.length > 0 ? props.errorId : null,
	]
		.filter(Boolean)
		.join(" ");

	const fallbackAriaLabel = label.length === 0 && !props.ariaLabel;

	const inputAttrs = [
		`class="xtyle-control xtyle-field__input"`,
		`part="input"`,
		`id="${escapeAttr(props.inputId)}"`,
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
		describedBy.length > 0 ? `aria-describedby="${escapeAttr(describedBy)}"` : null,
	]
		.filter(Boolean)
		.join(" ");

	const star = required
		? `<span class="xtyle-field__required" part="required" aria-hidden="true">*</span>`
		: "";
	const labelHidden = label.length === 0 ? " hidden" : "";

	const revealHidden = showReveal ? "" : " hidden";
	const revealShown = type === "text";
	const revealPressed = String(revealShown);
	const revealLabel = revealShown ? "Hide value" : "Show value";

	const clearHidden = showClear ? "" : " hidden";

	const descriptionHidden = description.length === 0 ? " hidden" : "";
	const errorHidden = !invalid || error.length === 0 ? " hidden" : "";

	return `
				<div class="${fieldClass(props)}" part="field">
					<label class="xtyle-field__label" part="label" for="${escapeAttr(props.inputId)}"${labelHidden}>${escape(label)}${star}</label>
					<div class="xtyle-field__control" part="control">
						<span class="xtyle-field__adornment" part="adornment"><slot name="prefix"></slot></span>
						<input ${inputAttrs} />
						<button type="button" class="xtyle-field__action" part="action-reveal" data-action="reveal"${revealHidden} aria-pressed="${revealPressed}" aria-label="${escapeAttr(revealLabel)}">
							<slot name="reveal-icon"><span aria-hidden="true">&#128065;</span></slot>
						</button>
						<button type="button" class="xtyle-field__action" part="action-clear" data-action="clear"${clearHidden} aria-label="Clear">
							<slot name="clear-icon"><span aria-hidden="true">&times;</span></slot>
						</button>
						<span class="xtyle-field__adornment" part="adornment"><slot name="suffix"></slot></span>
					</div>
					<span class="xtyle-field__description" part="description" id="${escapeAttr(props.descriptionId)}"${descriptionHidden}>${escape(description)}</span>
					<span class="xtyle-field__error" part="error" id="${escapeAttr(props.errorId)}"${errorHidden}>${escape(error)}</span>
				</div>
			`;
}
