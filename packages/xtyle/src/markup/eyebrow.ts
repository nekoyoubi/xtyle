import type { FullTone } from "../vocab.js";

export type EyebrowTag = "p" | "span" | "div";
export type EyebrowTone = "muted" | "subtle" | FullTone;
export type EyebrowTracking = "normal" | "wide";

export interface EyebrowMarkupProps {
	as?: EyebrowTag;
	tone?: EyebrowTone;
	tracking?: EyebrowTracking;
}

/** The host-layout rules for an eyebrow — the `:host` rules, shared by the element's `styles()` and the SSR declarative shadow root. */
export const eyebrowHostCss = `:host { display: block; } :host([as="span"]) { display: inline; }`;

export function eyebrowClass(props: EyebrowMarkupProps): string {
	const tone = props.tone ?? "accent";
	const tracking = props.tracking ?? "normal";
	return [
		"xtyle-eyebrow",
		tone !== "accent" && `xtyle-eyebrow--${tone}`,
		tracking === "wide" && "xtyle-eyebrow--wide",
	]
		.filter(Boolean)
		.join(" ");
}

/**
 * The single source of an eyebrow's shadow markup. The custom element renders it into
 * its shadow root at runtime; the `@xtyle/astro` binding emits the same string into a
 * declarative shadow root at build. Both paths render one identical control from one
 * source — no per-binding reimplementation. Pure and DOM-free, so it is safe to
 * import in any environment (SSR included).
 */
export function eyebrowMarkup(props: EyebrowMarkupProps): string {
	const as = props.as ?? "p";
	const tag = as === "span" ? "span" : as === "div" ? "div" : "p";
	return `<${tag} part="eyebrow" class="${eyebrowClass(props)}"><slot></slot></${tag}>`;
}
