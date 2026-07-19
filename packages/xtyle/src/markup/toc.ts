import { escapeSelectorValue } from "../elements/fragments/selector-escape.js";

export interface TocItem {
	id: string;
	label: string;
	/** Outline depth, 1-based. Matches the `depth` a heading source reports, so `getHeadings()` can be passed straight through. */
	level?: number;
}

/** The host-layout rule for a toc — the one `:host` rule, shared by the element's scaffold and the SSR declarative shadow root. */
export const tocHostCss = ":host { display: block; }";

/**
 * The three custom properties that carry the active-link look. The static sheet sets them on
 * `.is-active`; the zero-JS fallback below sets the same three, so the narrow-screen media query
 * restyles both paths without knowing the fallback exists.
 */
export const tocCurrentDeclarations = "--xtyle-toc-ink: var(--accent-text); --xtyle-toc-rail: var(--accent); --xtyle-toc-weight: var(--weight-medium); --xtyle-toc-chip: var(--accent-bg);";

/** The marker the element sets once the scrollspy is live, so the CSS fallback stands down rather than fighting it. */
export const TOC_SPY_ATTR = "data-spy";

/**
 * Without script there is no scrollspy, so a static page gets no current-section feedback at all.
 * CSS can compare the document fragment against an element id (`:target`) but cannot compare it
 * against an *attribute value*, so the link for a section is only reachable by naming its id — which
 * means one rule per item, generated where the items are known.
 *
 * This renders nothing and no mod would restyle it, so it is plumbing and stays out of the fill.
 * The `:root:has(…)` prefix is a condition, not a footprint: every rule's subject is an xtyle link.
 * Under a shadow root `:root` matches the shadow root rather than the document and nothing applies,
 * which is correct — an element with a shadow root was created by script, so the spy is running.
 */
export function tocTargetFallbackCss(items: TocItem[]): string {
	const rules = items
		.filter((item) => typeof item?.id === "string" && !item.id.includes("<"))
		.map((item) => {
			const id = escapeSelectorValue(item.id);
			return `:root:has([id="${id}"]:target) xtyle-toc:not([data-spy]) [data-toc-link="${id}"] { ${tocCurrentDeclarations} }`;
		});
	return rules.join("\n");
}
