import type { Size } from "../vocab.js";
import { escapeHtml as escape, escapeAttr } from "./escape.js";

export interface SelectMarkupProps {
	label?: string;
	value?: string;
	size?: Size;
	disabled?: boolean;
	invalid?: boolean;
	required?: boolean;
	error?: string;
	name?: string;
	/** Stable id for the `<select>` element, paired with the label's `for`. */
	fieldId: string;
	/** Stable id for the error region, paired with the field's `aria-describedby`. */
	errorId: string;
	/** Pre-rendered `<option>`/`<optgroup>` markup projected into the shadow `<select>`. */
	optionsHtml?: string;
}

/** The host-layout rule for a select — the one `:host` rule, shared by the element's `styles()` and the SSR declarative shadow root. */
export const selectHostCss = ":host { display: block; }";

export function selectClass(props: SelectMarkupProps): string {
	const size = props.size ?? "md";
	return [
		"xtyle-select",
		size === "sm" && "xtyle-select--sm",
		size === "lg" && "xtyle-select--lg",
		props.invalid && "xtyle-select--invalid",
	]
		.filter(Boolean)
		.join(" ");
}

/**
 * The single source of a select's shadow markup. The custom element renders it into
 * its shadow root at runtime; the `@xtyle/astro` binding emits the same string into a
 * declarative shadow root at build. Both paths render one identical control from one
 * source — no per-binding reimplementation. Pure and DOM-free, so it is safe to
 * import in any environment (SSR included).
 */
export function selectMarkup(props: SelectMarkupProps): string {
	const label = props.label ?? "";
	const error = props.error ?? "";
	const invalid = props.invalid === true;
	const required = props.required === true;
	const disabled = props.disabled === true;
	const value = props.value;
	const name = props.name;

	const labelHidden = label.length === 0 ? " hidden" : "";

	const selectAttrs = [
		`class="xtyle-control xtyle-select__field"`,
		`part="select"`,
		`id="${escapeAttr(props.fieldId)}"`,
		name != null ? `name="${escapeAttr(name)}"` : null,
		disabled ? "disabled" : null,
		required ? "required" : null,
		`aria-invalid="${invalid}"`,
		required ? `aria-required="true"` : null,
		invalid && error.length > 0 ? `aria-describedby="${escapeAttr(props.errorId)}"` : null,
		value != null ? `value="${escapeAttr(value)}"` : null,
	]
		.filter(Boolean)
		.join(" ");

	const errorHidden = error.length === 0 ? " hidden" : "";

	return `
				<div class="${selectClass(props)}" part="root">
					<label class="xtyle-select__label" part="label" for="${escapeAttr(props.fieldId)}"${labelHidden}>${escape(label)}</label>
					<div class="xtyle-select__control" part="control">
						<select ${selectAttrs}>${props.optionsHtml ?? ""}</select>
						<span class="xtyle-select__chevron" part="chevron" aria-hidden="true">
							<svg viewBox="0 0 24 24" width="1em" height="1em" focusable="false">
								<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="m6 9 6 6 6-6" />
							</svg>
						</span>
					</div>
					<span class="xtyle-select__error" part="error" id="${escapeAttr(props.errorId)}"${errorHidden}>${escape(error)}</span>
				</div>
			`;
}
