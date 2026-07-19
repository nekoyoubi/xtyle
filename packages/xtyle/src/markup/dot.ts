import type { FullTone } from "../index.js";
import { DOT_SIZES, DOT_PULSES } from "../vocab.js";

export type DotSize = (typeof DOT_SIZES)[number];
export type DotPulse = (typeof DOT_PULSES)[number];

export interface DotMarkupProps {
	tone?: FullTone;
	size?: DotSize;
	pulse?: DotPulse;
	ping?: boolean;
	glow?: boolean;
	color?: string;
	label?: string;
}

/** The host-layout rule for a dot — shared by the element's scaffold and the SSR declarative shadow root. */
/**
 * The host must collapse to exactly the dot and centre it. Two things conspire against that: the
 * host inherits the surrounding `line-height`, so any stray whitespace inside it raises a text strut
 * and inflates the box to a full line (a 12px dot in a 24px host, sitting off-centre); and a bare
 * `vertical-align` is no help at all when the consumer's row is a flex container, which it usually
 * is, because flex items ignore it. `line-height: 0` kills the strut so the box *is* the dot,
 * `align-items: center` centres it if anything ever does stretch the host, and `vertical-align:
 * middle` covers the case where the dot sits in a plain inline run of text.
 */
export const dotHostCss =
	":host { display: inline-flex; align-items: center; justify-content: center; line-height: 0; vertical-align: middle; }";

/** The class list for the visual dot span. A `color` escape hatch (inline `--dot-color`) wins over
 * the tone class, so the tone is dropped when a raw color is supplied. */
export function dotClass(props: DotMarkupProps): string {
	const size = props.size ?? "md";
	return [
		"xtyle-dot",
		size !== "md" && `xtyle-dot--${size}`,
		!props.color && props.tone && `xtyle-dot--${props.tone}`,
		props.pulse && `xtyle-dot--pulse-${props.pulse}`,
		props.ping && "xtyle-dot--ping",
		props.glow && "xtyle-dot--glow",
	]
		.filter(Boolean)
		.join(" ");
}
