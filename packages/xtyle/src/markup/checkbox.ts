/** The host-layout rule for a checkbox — the one `:host` rule, shared by the element's scaffold and the SSR declarative shadow root. */
export const checkboxHostCss = ":host { display: inline-block; }";

/** The host-layout rule for a checkbox group — shared by the element's `styles()` and the SSR declarative shadow root. */
export const checkboxGroupHostCss = `:host { display: block; }`;

export interface CheckboxGroupMarkupProps {
	label?: string | null;
	labelledby?: string | null;
	tone?: string;
	size?: string;
	disabled?: boolean;
	/** Heading state at render time; the element re-derives it from its items on hydration. */
	checked?: boolean;
	indeterminate?: boolean;
	labelId: string;
}

const GROUP_INDICATOR =
	`<span class="xtyle-checkbox__indicator" part="indicator" aria-hidden="true">` +
	`<svg viewBox="0 0 16 16" width="16" height="16">` +
	`<path class="xtyle-checkbox__check" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="m4 8 3 3 5-6" />` +
	`<path class="xtyle-checkbox__dash" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M4 8h8" />` +
	`</svg></span>`;

export function checkboxGroupHeadingClass(props: CheckboxGroupMarkupProps): string {
	const tone = props.tone ?? "accent";
	const size = props.size ?? "md";
	return [
		"xtyle-checkbox",
		"xtyle-checkbox-group__heading",
		`xtyle-checkbox--${tone}`,
		size !== "md" && `xtyle-checkbox--${size}`,
		props.indeterminate && "xtyle-checkbox--indeterminate",
	]
		.filter(Boolean)
		.join(" ");
}

/**
 * The single source of a checkbox group's shadow markup: a tri-state "select all" heading
 * checkbox the group owns, followed by a slot for its item checkboxes. The custom element
 * renders it at runtime; the `@xtyle/astro` binding emits the same string into a declarative
 * shadow root at build. Pure and DOM-free.
 */
export function checkboxGroupMarkup(props: CheckboxGroupMarkupProps): string {
	const label = props.label ?? "";
	const checkedAttr = props.checked ? " checked" : "";
	const disabledAttr = props.disabled ? " disabled" : "";
	const heading =
		`<label class="${checkboxGroupHeadingClass(props)}">` +
		`<span class="xtyle-checkbox__box" part="box">` +
		`<input part="control" class="xtyle-checkbox__control" type="checkbox"${checkedAttr}${disabledAttr} />` +
		GROUP_INDICATOR +
		`</span>` +
		`<span class="xtyle-checkbox__label" part="label" id="${props.labelId}">${label}</span>` +
		`</label>`;
	let nameAttr = "";
	if (props.labelledby) nameAttr = ` aria-labelledby="${props.labelledby}"`;
	else if (label) nameAttr = ` aria-labelledby="${props.labelId}"`;
	const ariaDisabled = props.disabled ? ` aria-disabled="true"` : "";
	return `<div role="group" class="xtyle-checkbox-group"${nameAttr}${ariaDisabled}>${heading}<div class="xtyle-checkbox-group__items" part="items"><slot></slot></div></div>`;
}
