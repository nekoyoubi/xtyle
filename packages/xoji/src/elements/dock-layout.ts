/**
 * The headless docking seam: pure geometry for a drag-and-drop dockable-panel
 * workspace. Given the pointer and a set of candidate drop targets (zones and
 * panels), {@link resolveDrop} computes where a dragged panel would land and the
 * rectangle to highlight as a drop preview. The consumer owns the panel rendering
 * and the layout state; this module owns only the hit-testing and drop resolution,
 * the same way {@link ./overlay-position} owns overlay placement. No DOM, no state.
 */

/** Where a panel lands on a target: one of the four edges (a split) or the center (a tab). */
export type DockRegion = "left" | "right" | "top" | "bottom" | "center";

export interface DockRect {
	top: number;
	left: number;
	width: number;
	height: number;
}

export interface DockTarget {
	/** Stable id the consumer maps back to its zone or panel. */
	id: string;
	/** The target's rect, in the same coordinate space as the pointer. */
	rect: DockRect;
	/**
	 * The regions this target accepts. Defaults to all five. A root container that
	 * only docks to its outer edges passes the four edges; a leaf panel that also
	 * accepts a tab drop passes `center` too.
	 */
	regions?: readonly DockRegion[];
}

export interface ResolveDropInput {
	/** Pointer position, in the same coordinate space as the target rects. */
	pointer: { x: number; y: number };
	/** Candidate drop targets, innermost last: when rects nest, the last containing target wins. */
	targets: readonly DockTarget[];
	/** Fraction of each axis treated as an edge band. Defaults to `0.25`; clamped to `(0, 0.5]`. */
	edgeRatio?: number;
}

export interface DropResolution {
	/** The `id` of the resolved target. */
	targetId: string;
	/** Where on the target the panel would land: an edge (a split) or the center (a tab). */
	region: DockRegion;
	/** The preview rectangle to highlight: the half a split would occupy, or the full rect for a center tab. */
	highlight: DockRect;
}

const ALL_REGIONS: readonly DockRegion[] = ["left", "right", "top", "bottom", "center"];
const EDGES: readonly DockRegion[] = ["left", "right", "top", "bottom"];

function contains(rect: DockRect, x: number, y: number): boolean {
	return x >= rect.left && x <= rect.left + rect.width && y >= rect.top && y <= rect.top + rect.height;
}

function highlightFor(rect: DockRect, region: DockRegion): DockRect {
	const halfW = rect.width / 2;
	const halfH = rect.height / 2;
	switch (region) {
		case "left":
			return { top: rect.top, left: rect.left, width: halfW, height: rect.height };
		case "right":
			return { top: rect.top, left: rect.left + halfW, width: halfW, height: rect.height };
		case "top":
			return { top: rect.top, left: rect.left, width: rect.width, height: halfH };
		case "bottom":
			return { top: rect.top + halfH, left: rect.left, width: rect.width, height: halfH };
		default:
			return { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
	}
}

/**
 * Resolve where a dragged panel would dock given the pointer and a set of candidate
 * targets. Pure geometry: the consumer renders the returned `highlight` as a drop
 * preview during the drag and applies `{ targetId, region }` on release. Returns
 * `null` when the pointer is over no target, which the consumer treats as a float.
 *
 * Within a target, the outer `edgeRatio` band on each axis is a split region (the
 * panel docks to that side); the inner area is the center (the panel joins as a tab).
 * Corners resolve to the nearer edge. A target's `regions` narrow the accepted set: a
 * resolved region outside it falls back to the nearest allowed edge, then the center.
 */
export function resolveDrop(input: ResolveDropInput): DropResolution | null {
	const edgeRatio = Math.min(0.5, Math.max(0.0001, input.edgeRatio ?? 0.25));
	const { x, y } = input.pointer;

	let hit: DockTarget | undefined;
	for (const target of input.targets) {
		if (contains(target.rect, x, y)) hit = target;
	}
	if (!hit) return null;

	const allowed = hit.regions ?? ALL_REGIONS;
	const { rect } = hit;
	const fromLeft = (x - rect.left) / rect.width;
	const fromRight = 1 - fromLeft;
	const fromTop = (y - rect.top) / rect.height;
	const fromBottom = 1 - fromTop;
	const inCenter = fromLeft >= edgeRatio && fromRight >= edgeRatio && fromTop >= edgeRatio && fromBottom >= edgeRatio;

	const nearestEdges = (
		[
			["left", fromLeft],
			["right", fromRight],
			["top", fromTop],
			["bottom", fromBottom],
		] as Array<[DockRegion, number]>
	)
		.sort((a, b) => a[1] - b[1])
		.map(([edge]) => edge);

	let region: DockRegion = inCenter ? "center" : (nearestEdges[0] ?? "center");
	if (!allowed.includes(region)) {
		const allowedEdge = nearestEdges.find((edge) => allowed.includes(edge));
		if (allowedEdge) region = allowedEdge;
		else if (allowed.includes("center")) region = "center";
		else region = allowed[0] ?? "center";
	}

	return { targetId: hit.id, region, highlight: highlightFor(rect, region) };
}

export { ALL_REGIONS as DOCK_REGIONS, EDGES as DOCK_EDGES };
