/** The host-layout rules for a radio — shared by the element's scaffold and the SSR declarative shadow root. */
export const radioHostCss = `:host { display: inline-flex; } :host([card]) { display: block; } :host([hidden]) { display: none; }`;

export interface RadioGroupMarkupProps {
	orientation?: "vertical" | "horizontal";
	label?: string | null;
	labelledby?: string | null;
	disabled?: boolean;
	labelId: string;
}

/** The host-layout rule for a radio group — shared by the element's `styles()` and the SSR declarative shadow root. */
export const radioGroupHostCss = `:host { display: block; }`;

export function radioGroupClass(props: RadioGroupMarkupProps): string {
	return ["xtyle-radio-group", props.orientation === "horizontal" && "xtyle-radio-group--horizontal"]
		.filter(Boolean)
		.join(" ");
}

/**
 * The single source of a radio group's shadow markup. The custom element renders it
 * into its shadow root at runtime; the `@xtyle/astro` binding emits the same string
 * into a declarative shadow root at build. Pure and DOM-free.
 */
export function radioGroupMarkup(props: RadioGroupMarkupProps): string {
	const orientation = props.orientation ?? "vertical";
	const label = props.label ?? null;
	const labelledby = props.labelledby ?? null;
	const ariaDisabled = props.disabled ? ` aria-disabled="true"` : "";
	const legend = label
		? `<span part="group" class="xtyle-radio-group__label" id="${props.labelId}">${label}</span>`
		: "";
	let nameAttr = "";
	if (labelledby) nameAttr = ` aria-labelledby="${labelledby}"`;
	else if (label) nameAttr = ` aria-labelledby="${props.labelId}"`;
	const orientationAttr = ` aria-orientation="${orientation}"`;
	return `<div role="radiogroup" class="${radioGroupClass(props)}"${nameAttr}${orientationAttr}${ariaDisabled}>${legend}<slot></slot></div>`;
}
