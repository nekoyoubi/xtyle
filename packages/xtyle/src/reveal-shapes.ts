/** The slot a mod fills to contribute silhouettes, declared in its own manifest rather than run as code. */
export const REVEAL_SHAPE_SLOT = "xtyle.reveal-shapes";

/** One mod's contribution: silhouette definitions keyed by name. */
export interface RevealShapeFill {
	shapes: Record<string, RevealShapeDef>;
}

export interface RevealShapeDef {
	/** Any `clip-path` value. Percentages scale with the box; absolute units do not. */
	clip: string;
	/**
	 * How far the edge grips move in from the bounding box, so they land on the silhouette rather
	 * than in the dead space a cut leaves behind. Any length or percentage.
	 */
	gripInset?: string;
}

const BUILT_IN: Record<string, RevealShapeDef> = {
	parallelogram: { clip: "polygon(6% 0, 100% 0, 94% 100%, 0 100%)", gripInset: "7%" },
	chevron: { clip: "polygon(0 0, 88% 0, 100% 50%, 88% 100%, 0 100%)", gripInset: "13%" },
	ticket: {
		clip: "polygon(0 0, 100% 0, 100% 38%, 96% 50%, 100% 62%, 100% 100%, 0 100%, 0 62%, 4% 50%, 0 38%)",
		gripInset: "5%",
	},
	heart: {
		clip: "polygon(50% 100%, 15% 68%, 3% 52%, 0 33%, 5% 16%, 18% 7%, 33% 8%, 44% 17%, 50% 27%, 56% 17%, 67% 8%, 82% 7%, 95% 16%, 100% 33%, 97% 52%, 85% 68%)",
		gripInset: "17%",
	},
};

const registry = new Map<string, RevealShapeDef>(Object.entries(BUILT_IN));

/**
 * Add or replace named silhouettes, last-wins on the name, the way the effect library takes verbs.
 * A name registered here is usable anywhere `shape` takes one, including from a mod.
 */
export function registerRevealShapes(shapes: Record<string, RevealShapeDef>): void {
	for (const [name, def] of Object.entries(shapes)) registry.set(name, def);
}

/** Drop every contributed silhouette, leaving the built-in set. For tests and for a host teardown. */
export function resetRevealShapes(): void {
	registry.clear();
	for (const [name, def] of Object.entries(BUILT_IN)) registry.set(name, def);
}

/** Every silhouette currently registered, built-in and contributed alike. */
export function revealShapeNames(): string[] {
	return [...registry.keys()].sort();
}

/** Pull the silhouette blocks out of a mod manifest's `xtyle.reveal-shapes` fills, if it declares any. */
export function revealShapeFillsFrom(modManifest: unknown): RevealShapeFill[] {
	const fills = (modManifest as { fills?: Record<string, unknown> } | null | undefined)?.fills;
	const declared = fills?.[REVEAL_SHAPE_SLOT];
	if (!declared) return [];
	return (Array.isArray(declared) ? declared : [declared]).filter(isRevealShapeFill);
}

function isRevealShapeFill(value: unknown): value is RevealShapeFill {
	const shapes = (value as Partial<RevealShapeFill> | null | undefined)?.shapes;
	if (!shapes || typeof shapes !== "object") return false;
	return Object.values(shapes).every((def) => typeof (def as RevealShapeDef | null)?.clip === "string");
}

/** Register every silhouette a mod manifest contributes, in declaration order. */
export function registerRevealShapeFills(modManifest: unknown): number {
	let added = 0;
	for (const fill of revealShapeFillsFrom(modManifest)) {
		registerRevealShapes(fill.shapes);
		added += Object.keys(fill.shapes).length;
	}
	return added;
}

/**
 * Resolve a `shape` value to a definition. A registered name resolves to its definition; anything
 * carrying a `(` is taken as a raw `clip-path` value and used as-is, so a caller can hand over a
 * silhouette the registry has never heard of. `rect` and an unknown bare word resolve to null,
 * meaning no cut.
 */
export function resolveRevealShape(value: string | null | undefined): RevealShapeDef | null {
	if (value === null || value === undefined) return null;
	const trimmed = value.trim();
	if (trimmed === "" || trimmed === "rect") return null;
	if (trimmed.includes("(")) return { clip: trimmed };
	return registry.get(trimmed) ?? null;
}
