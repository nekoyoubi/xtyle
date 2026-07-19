import type { FullTone } from "../index.js";
import { RIBBON_CORNERS, RIBBON_SIZES, RIBBON_VARIANTS } from "../vocab.js";

export type RibbonCorner = (typeof RIBBON_CORNERS)[number];
export type RibbonSize = (typeof RIBBON_SIZES)[number];
export type RibbonVariant = (typeof RIBBON_VARIANTS)[number];

export interface RibbonMarkupProps {
	tone?: FullTone;
	corner?: RibbonCorner;
	size?: RibbonSize;
	variant?: RibbonVariant;
	color?: string;
	textColor?: string;
	label?: string;
}

/**
 * The host-layout rule for a ribbon: it fills its positioned container as a clipping overlay, so the
 * diagonal band's overhang is trimmed to the container's edges. The container must be
 * `position: relative` (and usually `overflow: hidden`) for the ribbon to pin and clip correctly.
 */
export const ribbonHostCss =
	":host { position: absolute; inset: 0; overflow: hidden; border-radius: inherit; pointer-events: none; z-index: 1; }";

/** The class list for the ribbon's clip layer. A `color` escape hatch (inline `--rb-bg`) wins over the
 * tone class, so the tone class is dropped when a raw color is supplied. */
export function ribbonClass(props: RibbonMarkupProps): string {
	const corner = props.corner ?? "top-right";
	const size = props.size ?? "md";
	const variant = props.variant ?? "solid";
	return [
		"xtyle-ribbon",
		`xtyle-ribbon--${corner}`,
		size !== "md" && `xtyle-ribbon--${size}`,
		variant !== "solid" && `xtyle-ribbon--${variant}`,
		!props.color && props.tone && `xtyle-ribbon--${props.tone}`,
	]
		.filter(Boolean)
		.join(" ");
}
