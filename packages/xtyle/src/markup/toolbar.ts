import type { Size } from "../vocab.js";

export interface ToolbarMarkupProps {
	heading?: string | null;
	href?: string | null;
	size?: Size;
	landmark?: boolean;
	sticky?: boolean;
	bare?: boolean;
}

/** The host-layout rules for a toolbar — the `:host` rules shared by the element's `styles()` and the SSR declarative shadow root. */
export const toolbarHostCss = `:host { display: block; } :host([sticky]) { position: sticky; top: 0; z-index: var(--layer-sticky); }`;

export function toolbarClass(props: ToolbarMarkupProps): string {
	const size = props.size ?? "md";
	return [
		"xtyle-toolbar",
		size !== "md" && `xtyle-toolbar--${size}`,
		props.sticky && "xtyle-toolbar--sticky",
		props.bare && "xtyle-toolbar--bare",
	]
		.filter(Boolean)
		.join(" ");
}

function toolbarTitleMarkup(props: ToolbarMarkupProps): string {
	const heading = props.heading ?? null;
	if (heading === null) return "";
	const href = props.href ?? null;
	if (href !== null) {
		return `<a class="xtyle-toolbar__title" part="title" href="${href}">${heading}</a>`;
	}
	return `<span class="xtyle-toolbar__title" part="title">${heading}</span>`;
}

/**
 * The single source of a toolbar's shadow markup. The custom element renders it into
 * its shadow root at runtime; the `@xtyle/astro` binding emits the same string into a
 * declarative shadow root at build. Both paths render one identical control from one
 * source — no per-binding reimplementation. Pure and DOM-free, so it is safe to
 * import in any environment (SSR included).
 */
export function toolbarMarkup(props: ToolbarMarkupProps): string {
	const tag = props.landmark ? "header" : "div";
	const inner = `<div class="xtyle-toolbar__group xtyle-toolbar__group--start" part="group"><slot name="start"></slot></div>${toolbarTitleMarkup(props)}<slot></slot><div class="xtyle-toolbar__group xtyle-toolbar__group--center" part="group"><slot name="center"></slot></div><div class="xtyle-toolbar__group xtyle-toolbar__group--end" part="group"><slot name="end"></slot></div>`;
	return `<${tag} part="toolbar" class="${toolbarClass(props)}">${inner}</${tag}>`;
}
