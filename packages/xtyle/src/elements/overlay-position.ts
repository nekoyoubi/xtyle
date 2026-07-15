/**
 * Shared viewport-aware placement geometry for overlay surfaces (Tooltip, Menu,
 * Swatch details). Pure math — no DOM, no `window` — so it is unit-testable and
 * environment-neutral; callers pass in the anchor rect, the content size, and the
 * viewport size (from `getBoundingClientRect` / `innerWidth` at the call site).
 *
 * The contract: honor the preferred side when the content fits there, flip to the
 * opposite side when it does not, flip the cross-axis alignment (`start` ↔ `end`)
 * when the preferred one would overflow, and clamp the cross-axis as the last resort
 * so the overlay never spills past a viewport edge. This is the portable fallback for
 * browsers without CSS anchor positioning (`position-try`), which is not yet cross-engine.
 */

export type OverlayPlacement = "top" | "bottom" | "left" | "right";

/**
 * Cross-axis alignment of the overlay against the anchor: `start` aligns the
 * leading edges (dropdown-menu behavior), `center` centers on the anchor
 * (tooltip behavior), `end` aligns the trailing edges.
 */
export type OverlayAlign = "start" | "center" | "end";

export interface OverlayRect {
	top: number;
	left: number;
	width: number;
	height: number;
}

export interface OverlaySize {
	width: number;
	height: number;
}

export interface PlaceOverlayInput {
	/** Anchor (trigger) rect in viewport coordinates. */
	anchor: OverlayRect;
	/** The overlay content's intrinsic size. */
	content: OverlaySize;
	/** Viewport size in CSS pixels. */
	viewport: OverlaySize;
	/** Preferred side; flips to the opposite when it does not fit. Defaults to `bottom`. */
	preferred?: OverlayPlacement;
	/** Cross-axis alignment against the anchor. Defaults to `center`. */
	align?: OverlayAlign;
	/** Space between the anchor and the overlay, in px. Defaults to `4`. */
	gap?: number;
	/** Minimum inset kept from every viewport edge, in px. Defaults to `8`. */
	margin?: number;
}

export interface PlaceOverlayResult {
	/** The side actually used — equal to `preferred` unless it had to flip. */
	placement: OverlayPlacement;
	top: number;
	left: number;
	/** True when the opposite of `preferred` was chosen. */
	flipped: boolean;
	/** The cross-axis alignment actually used — equal to `align` unless it had to flip. */
	align: OverlayAlign;
	/** True when the opposite of `align` was chosen (`start` ↔ `end`). */
	alignFlipped: boolean;
}

const OPPOSITE: Record<OverlayPlacement, OverlayPlacement> = {
	top: "bottom",
	bottom: "top",
	left: "right",
	right: "left",
};

function isVertical(placement: OverlayPlacement): boolean {
	return placement === "top" || placement === "bottom";
}

function crossAxisStart(
	align: OverlayAlign,
	anchorStart: number,
	anchorExtent: number,
	contentExtent: number,
): number {
	switch (align) {
		case "start":
			return anchorStart;
		case "end":
			return anchorStart + anchorExtent - contentExtent;
		case "center":
			return anchorStart + anchorExtent / 2 - contentExtent / 2;
	}
}

function clamp(value: number, min: number, max: number): number {
	if (max < min) return min;
	return Math.min(Math.max(value, min), max);
}

const OPPOSITE_ALIGN: Record<OverlayAlign, OverlayAlign> = {
	start: "end",
	end: "start",
	center: "center",
};

/**
 * Pick the cross-axis alignment and its unclamped start coordinate: keep the requested
 * alignment when the content fits inside the viewport margins, otherwise flip `start` ↔ `end`
 * when the opposite one fits. A cursor-anchored menu near the right edge right-aligns at the
 * cursor (native OS behavior) instead of sliding sideways off its anchor point; a `center`
 * overlay (the tooltip) has no opposite, so it goes straight to the clamp.
 */
function resolveCrossAxis(
	align: OverlayAlign,
	anchorStart: number,
	anchorExtent: number,
	contentExtent: number,
	viewportExtent: number,
	margin: number,
): { align: OverlayAlign; start: number; alignFlipped: boolean } {
	const start = crossAxisStart(align, anchorStart, anchorExtent, contentExtent);
	const fits = (value: number): boolean =>
		value >= margin && value + contentExtent <= viewportExtent - margin;
	if (align === "center" || fits(start)) return { align, start, alignFlipped: false };
	const opposite = OPPOSITE_ALIGN[align];
	const alternate = crossAxisStart(opposite, anchorStart, anchorExtent, contentExtent);
	if (fits(alternate)) return { align: opposite, start: alternate, alignFlipped: true };
	return { align, start, alignFlipped: false };
}

function spaceOnSide(
	placement: OverlayPlacement,
	anchor: OverlayRect,
	viewport: OverlaySize,
): number {
	switch (placement) {
		case "top":
			return anchor.top;
		case "bottom":
			return viewport.height - (anchor.top + anchor.height);
		case "left":
			return anchor.left;
		case "right":
			return viewport.width - (anchor.left + anchor.width);
	}
}

function extentNeeded(placement: OverlayPlacement, content: OverlaySize, gap: number): number {
	return (isVertical(placement) ? content.height : content.width) + gap;
}

function choosePlacement(input: Required<PlaceOverlayInput>): {
	placement: OverlayPlacement;
	flipped: boolean;
} {
	const { preferred, anchor, content, viewport, gap, margin } = input;
	const opposite = OPPOSITE[preferred];
	const need = extentNeeded(preferred, content, gap) + margin;
	if (spaceOnSide(preferred, anchor, viewport) >= need) {
		return { placement: preferred, flipped: false };
	}
	if (spaceOnSide(opposite, anchor, viewport) >= need) {
		return { placement: opposite, flipped: true };
	}
	const preferredSpace = spaceOnSide(preferred, anchor, viewport);
	const oppositeSpace = spaceOnSide(opposite, anchor, viewport);
	return oppositeSpace > preferredSpace
		? { placement: opposite, flipped: true }
		: { placement: preferred, flipped: false };
}

/**
 * Resolve the on-screen coordinates for an overlay anchored to a trigger (or, with a
 * zero-size rect, to a cursor point): flip to the opposite side when the preferred side
 * lacks room, flip `start` ↔ `end` when the preferred cross-axis alignment would overflow,
 * and clamp to the viewport margin as the final fallback.
 */
export function placeOverlay(input: PlaceOverlayInput): PlaceOverlayResult {
	const resolved: Required<PlaceOverlayInput> = {
		preferred: input.preferred ?? "bottom",
		align: input.align ?? "center",
		gap: input.gap ?? 4,
		margin: input.margin ?? 8,
		anchor: input.anchor,
		content: input.content,
		viewport: input.viewport,
	};
	const { anchor, content, viewport, align, gap, margin } = resolved;
	const { placement, flipped } = choosePlacement(resolved);

	let top: number;
	let left: number;
	let cross: { align: OverlayAlign; start: number; alignFlipped: boolean };

	if (isVertical(placement)) {
		top =
			placement === "bottom"
				? anchor.top + anchor.height + gap
				: anchor.top - content.height - gap;
		cross = resolveCrossAxis(align, anchor.left, anchor.width, content.width, viewport.width, margin);
		left = clamp(cross.start, margin, viewport.width - content.width - margin);
	} else {
		left =
			placement === "right"
				? anchor.left + anchor.width + gap
				: anchor.left - content.width - gap;
		cross = resolveCrossAxis(align, anchor.top, anchor.height, content.height, viewport.height, margin);
		top = clamp(cross.start, margin, viewport.height - content.height - margin);
	}

	return {
		placement,
		top: Math.round(top),
		left: Math.round(left),
		flipped,
		align: cross.align,
		alignFlipped: cross.alignFlipped,
	};
}

export interface ArrowOffsetInput {
	/** The side the overlay landed on (from `placeOverlay`). */
	placement: OverlayPlacement;
	/** The clamped left from `placeOverlay`. */
	placedLeft: number;
	/** The clamped top from `placeOverlay`. */
	placedTop: number;
	/** Anchor rect (or zero-size cursor point) in viewport coordinates. */
	anchor: OverlayRect;
	/** The overlay content's intrinsic size. */
	content: OverlaySize;
	/** Keep the arrow's center at least this far from the content's corner, in px. Defaults to `12`. */
	arrowInset?: number;
}

/**
 * Where an arrow sits along the placed overlay's near edge, measured from that edge's leading corner
 * (left for a `top`/`bottom` placement, top for `left`/`right`). The arrow tracks the anchor's center
 * whatever the alignment did — so a `start`-aligned panel points at the middle of its trigger, and a
 * panel the viewport clamp shoved sideways keeps pointing at the anchor rather than sliding off with
 * the box. Bounded by `arrowInset` so it can never round the panel's own corner.
 *
 * The generalization of `tooltipTetherShift`, which solves the same problem for the center-aligned,
 * CSS-absolute tooltip: that one counter-shifts a centered arrow, this one just names the position
 * outright, which is what a `position: fixed` overlay (Popover) needs.
 */
export function anchorArrowOffset(input: ArrowOffsetInput): number {
	const { placement, placedLeft, placedTop, anchor, content } = input;
	const arrowInset = input.arrowInset ?? 12;
	const vertical = isVertical(placement);
	const anchorCenter = vertical ? anchor.left + anchor.width / 2 : anchor.top + anchor.height / 2;
	const start = vertical ? placedLeft : placedTop;
	const extent = vertical ? content.width : content.height;
	const max = Math.max(arrowInset, extent - arrowInset);
	return clamp(anchorCenter - start, arrowInset, max);
}

export interface TetherShiftInput {
	/** The side the overlay landed on (from `placeOverlay`). */
	placement: OverlayPlacement;
	/** The clamped left from `placeOverlay`. */
	placedLeft: number;
	/** The clamped top from `placeOverlay`. */
	placedTop: number;
	/** Anchor (trigger) rect in viewport coordinates. */
	anchor: OverlayRect;
	/** The overlay content's intrinsic size. */
	content: OverlaySize;
	/** Keep the arrow at least this far from the content's near edge, in px. Defaults to `10`. */
	arrowInset?: number;
}

export interface TetherShift {
	/** Cross-axis px to add to the centered content's transform after viewport clamping. */
	content: number;
	/** Cross-axis px to translate the arrow so it keeps pointing at the anchor center, bounded to the content. */
	arrow: number;
}

/**
 * For a center-aligned, arrow-bearing overlay (the tooltip), resolve how far the
 * clamped content drifted off the anchor center and how far the arrow must
 * counter-shift to keep pointing at it — bounded so the arrow never leaves the
 * content's own edge. Pure: the cross axis is horizontal for `top`/`bottom` and
 * vertical for `left`/`right`.
 */
export function tooltipTetherShift(input: TetherShiftInput): TetherShift {
	const { placement, placedLeft, placedTop, anchor, content } = input;
	const arrowInset = input.arrowInset ?? 10;
	const vertical = isVertical(placement);
	const naturalStart = vertical
		? anchor.left + anchor.width / 2 - content.width / 2
		: anchor.top + anchor.height / 2 - content.height / 2;
	const contentShift = (vertical ? placedLeft : placedTop) - naturalStart;
	const bound = Math.max(0, (vertical ? content.width : content.height) / 2 - arrowInset);
	// + 0 normalizes -0 to 0 for stable equality/serialization
	const arrow = clamp(-contentShift, -bound, bound) + 0;
	return { content: contentShift + 0, arrow };
}
