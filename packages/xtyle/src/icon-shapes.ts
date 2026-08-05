/**
 * Named point lists for the grammar's `poly` / `polyline` primitives.
 *
 * A list is a flat run of `x,y` pairs in a 0–100 space, which the builder maps onto the 24-unit grid.
 * Commas are the one separator the icon-name grammar leaves free — `---`, `--` and `-` are all
 * structural, and `-` doubles as a sign inside a flag value — so a coordinate list is written with
 * commas and no signs, and the 0–100 space keeps every number non-negative by construction.
 */

/** The slot a mod fills to contribute point lists, declared in its own manifest rather than run as code. */
export const ICON_SHAPE_SLOT = "xtyle.icon-primitives";

/** One mod's contribution: coordinate runs (or flat number lists) keyed by name. */
export interface IconShapeFill {
	shapes: Record<string, string | number[]>;
}

const NAME = /^[a-z][a-z0-9]*$/;

const BUILT_IN: Record<string, string> = {
	arrow: "0,20 60,20 60,0 100,50 60,100 60,80 0,80",
	pennant: "0,0 100,18 0,36 0,100",
};

const registry = new Map<string, number[]>();

/** Parse a coordinate run — `"0,0 100,50 0,100"` or `"0,0,100,50,0,100"` — into a flat number list. */
function parsePoints(raw: string): number[] | null {
	const numbers = raw
		.trim()
		.split(/[\s,]+/)
		.filter((part) => part !== "")
		.map(Number);
	if (numbers.length < 6 || numbers.length % 2 !== 0) return null;
	if (numbers.some((value) => !Number.isFinite(value))) return null;
	return numbers;
}

for (const [name, points] of Object.entries(BUILT_IN)) {
	const parsed = parsePoints(points);
	if (parsed) registry.set(name, parsed);
}

/**
 * Add or replace named point lists, last-wins on the name, the way the effect library takes verbs.
 * A name registered here is usable anywhere `pts` takes one, including from a mod.
 *
 * Names are lowercase alphanumeric with no hyphen, because a hyphen is how the grammar separates
 * flags; a name carrying one could not be told from the flag that follows it.
 */
export function registerIconShapes(shapes: Record<string, string | number[]>): void {
	for (const [name, value] of Object.entries(shapes)) {
		if (!NAME.test(name)) {
			if (typeof console !== "undefined") {
				console.warn(`xtyle: "${name}" is not a usable icon-shape name. Use lowercase letters and digits, with no hyphen.`);
			}
			continue;
		}
		const points = typeof value === "string" ? parsePoints(value) : parsePoints(value.join(","));
		if (!points) {
			if (typeof console !== "undefined") {
				console.warn(`xtyle: "${name}" needs at least three x,y pairs of finite numbers. Ignoring it.`);
			}
			continue;
		}
		registry.set(name, points);
	}
}

/** Drop every contributed list, leaving the built-in set. For tests and for a host teardown. */
export function resetIconShapes(): void {
	registry.clear();
	for (const [name, points] of Object.entries(BUILT_IN)) {
		const parsed = parsePoints(points);
		if (parsed) registry.set(name, parsed);
	}
}

/** Every named point list currently registered, built-in and contributed alike. */
export function iconShapeNames(): string[] {
	return [...registry.keys()].sort();
}

/** Pull the shape blocks out of a mod manifest's `xtyle.icon-primitives` fills, if it declares any. */
export function iconShapeFillsFrom(modManifest: unknown): IconShapeFill[] {
	const fills = (modManifest as { fills?: Record<string, unknown> } | null | undefined)?.fills;
	const declared = fills?.[ICON_SHAPE_SLOT];
	if (!declared) return [];
	return (Array.isArray(declared) ? declared : [declared]).filter(isIconShapeFill);
}

function isIconShapeFill(value: unknown): value is IconShapeFill {
	const shapes = (value as Partial<IconShapeFill> | null | undefined)?.shapes;
	if (!shapes || typeof shapes !== "object") return false;
	return Object.values(shapes).every((points) => typeof points === "string" || Array.isArray(points));
}

/** Register every point list a mod manifest contributes, in declaration order. */
export function registerIconShapeFills(modManifest: unknown): number {
	let added = 0;
	for (const fill of iconShapeFillsFrom(modManifest)) {
		registerIconShapes(fill.shapes);
		added += Object.keys(fill.shapes).length;
	}
	return added;
}

/**
 * Resolve a `pts` value to a flat point list: a registered name, or a coordinate run written out.
 * Returns null for a name nobody registered and for a run that is not at least three whole pairs,
 * so a typo draws the missing-primitive placeholder rather than a silently malformed shape.
 */
export function resolveIconPoints(value: string | null | undefined): number[] | null {
	if (value === null || value === undefined) return null;
	const trimmed = value.trim();
	if (trimmed === "") return null;
	if (NAME.test(trimmed)) return registry.get(trimmed) ?? null;
	return parsePoints(trimmed);
}
