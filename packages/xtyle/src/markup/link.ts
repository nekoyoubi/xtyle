import { LINK_VARIANTS } from "../vocab.js";
export type LinkVariant = (typeof LINK_VARIANTS)[number];

export interface LinkMarkupProps {
	variant?: LinkVariant;
	href?: string | null;
	target?: string | null;
	rel?: string | null;
	showExternalIcon?: boolean;
}

const EXTERNAL_ICON = `<svg class="xtyle-link__external-icon" part="external-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3h7v7"/><path d="M10 14 21 3"/><path d="M19 14v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6"/></svg>`;

/** The host-layout rule for a link — the one `:host` rule, shared by the element's `styles()` and the SSR declarative shadow root. */
export const linkHostCss = ":host { display: inline; }";

export function linkClass(props: LinkMarkupProps): string {
	const variant = props.variant ?? "default";
	return ["xtyle-link", variant !== "default" && `xtyle-link--${variant}`].filter(Boolean).join(" ");
}

/**
 * The single source of a link's shadow markup. The custom element renders it into
 * its shadow root at runtime; the `@xtyle/astro` binding emits the same string into a
 * declarative shadow root at build. Both paths render one identical control from one
 * source — no per-binding reimplementation. Pure and DOM-free, so it is safe to
 * import in any environment (SSR included).
 */
export function linkMarkup(props: LinkMarkupProps): string {
	const href = props.href ?? null;
	const target = props.target ?? null;
	const external = target === "_blank";
	const icon = props.showExternalIcon ? EXTERNAL_ICON : "";
	const newTabHint = external
		? `<span class="xtyle-link__sr-only" part="sr-hint"> (opens in a new tab)</span>`
		: "";

	if (href === null) {
		return `<span part="link" class="${linkClass(props)}"><slot></slot>${newTabHint}${icon}</span>`;
	}

	const targetAttr = target ? ` target="${target}"` : "";
	const explicitRel = props.rel ?? null;
	const rel = explicitRel ?? (target === "_blank" ? "noopener noreferrer" : null);
	const relAttr = rel ? ` rel="${rel}"` : "";

	return `<a part="link" class="${linkClass(props)}" href="${href}"${targetAttr}${relAttr}><slot></slot>${newTabHint}${icon}</a>`;
}
