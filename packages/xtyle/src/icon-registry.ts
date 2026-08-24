import { ICONS, ICON_NAMES, type IconName } from "./icons.js";

/**
 * The live icon roster: the built-in glyphs plus whatever mods have contributed.
 *
 * `icons.ts` holds the built-in table and is deliberately import-free, because the build inlines it
 * whole into every sandboxed fragment bundle. That makes it a *snapshot* — a glyph a mod adds at
 * runtime can never appear in it. This module is the mutable half that lives outside the sandbox: a
 * trusted caller resolves a name here and hands the resulting body to the fragment as binding data,
 * so the roster is extensible without granting a fill any authority.
 *
 * Contributions arrive through the `xtyle.icons` slot, a data fill in the same shape as
 * `xtyle.pack-meta`: a mod declares `{ glyphs: { "<name>": "<svg body>" } }` and the toolchain
 * validates it against the slot's payload schema. A glyph may also be
 * `{ body, viewBox?, strokeWidth? }` when it was drawn somewhere other than the roster's grid.
 */

/** The slot a mod fills to contribute glyphs to the roster. */
export const ICON_SLOT = "xtyle.icons";

/** The grid every glyph in the roster is drawn on, and the box the element gives it. */
export const ICON_GRID = 24;

/**
 * A glyph drawn somewhere other than the roster's own grid.
 *
 * The element's `viewBox` is fixed, so artwork authored at 32×32 or on a 16×16 pixel grid used to have
 * to be re-pathed by hand before it could be registered. Declaring the box it *was* drawn in is enough:
 * the registry fits it to the grid the way `preserveAspectRatio="xMidYMid meet"` would, so the arithmetic
 * is derived from the grid rather than baked into the artwork by its author.
 */
export interface IconGlyph {
	/** The inner SVG body, exactly as authored. */
	body: string;
	/** The box the body was drawn in — `"0 0 32 32"`, or any `minX minY width height`. Defaults to the roster grid. */
	viewBox?: string;
	/** A stroke weight for the whole set, so "this set is drawn at 1.6" is said once rather than per path. */
	strokeWidth?: number;
}

/** Defaults applied to every glyph in one `registerIcons` call that does not state its own. */
export interface IconGlyphDefaults {
	viewBox?: string;
	strokeWidth?: number;
}

/** One mod's contribution to the roster: glyphs keyed by name, each a body or a glyph with its own box. */
export interface IconFill {
	glyphs: Record<string, string | IconGlyph>;
	/** Set-wide defaults, for a pack drawn entirely on one grid or at one weight. */
	defaults?: IconGlyphDefaults;
}

const contributed = new Map<string, string>();

function parseViewBox(viewBox: string): [number, number, number, number] | null {
	const parts = viewBox.trim().split(/[\s,]+/).map(Number);
	if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return null;
	const [, , width, height] = parts as [number, number, number, number];
	return width > 0 && height > 0 ? (parts as [number, number, number, number]) : null;
}

const round = (n: number): string => String(Math.round(n * 1e4) / 1e4);

/**
 * Fit an authored body onto the roster grid, wrapping it only when it is not already there.
 *
 * A bare string stays byte-for-byte what it was, so nothing about the existing roster moves.
 */
function normalizeGlyph(entry: string | IconGlyph, defaults?: IconGlyphDefaults): string | null {
	if (typeof entry === "string") return entry.length > 0 ? entry : null;
	if (!entry || typeof entry.body !== "string" || entry.body.length === 0) return null;

	const viewBox = entry.viewBox ?? defaults?.viewBox;
	const strokeWidth = entry.strokeWidth ?? defaults?.strokeWidth;
	const attrs: string[] = [];

	if (viewBox) {
		const box = parseViewBox(viewBox);
		if (box) {
			const [minX, minY, width, height] = box;
			const scale = ICON_GRID / Math.max(width, height);
			if (scale !== 1 || minX !== 0 || minY !== 0) {
				const tx = (ICON_GRID - width * scale) / 2 - minX * scale;
				const ty = (ICON_GRID - height * scale) / 2 - minY * scale;
				attrs.push(`transform="translate(${round(tx)} ${round(ty)}) scale(${round(scale)})"`);
			}
		}
	}
	if (typeof strokeWidth === "number" && Number.isFinite(strokeWidth)) {
		attrs.push(`stroke-width="${round(strokeWidth)}"`);
	}

	return attrs.length > 0 ? `<g ${attrs.join(" ")}>${entry.body}</g>` : entry.body;
}

/**
 * Add glyphs to the roster, replacing any name already present.
 *
 * Last write wins, which makes registration order the precedence rule — the same contract fills
 * already have, where a mod loaded after another paints over it. A mod may therefore reskin a
 * built-in (`check`, `chevron-down`) as readily as it adds a new name.
 */
export function registerIcons(glyphs: Record<string, string | IconGlyph>, defaults?: IconGlyphDefaults): void {
	for (const [name, entry] of Object.entries(glyphs)) {
		const body = normalizeGlyph(entry, defaults);
		if (body !== null) contributed.set(name, body);
	}
	announceIconRegistry();
}

/** Drop every contributed glyph, leaving the built-in set. For tests and for a host teardown. */
export function resetIcons(): void {
	contributed.clear();
	announceIconRegistry();
}

const watchers = new Set<() => void>();

/**
 * Be told when anything an icon name resolves through changes, so a mark already painted can paint again.
 *
 * Registration is app configuration and element upgrade is a script-order accident, so requiring the
 * first to happen before the second is a race an app cannot reliably win. The failure is quiet and
 * points the wrong way: a glyph registered after its element rendered paints the unknown-name
 * placeholder, which is exactly what a *misspelled* name paints, so the symptom accuses the glyph table
 * while the fault is load order. It also makes the roster's own precedence rule untrue — last-write-wins
 * invites a mod to reskin a built-in, and a reskin that lands after paint reskins nothing.
 *
 * Covers the glyph roster, the point-list registry, and the primitive library alike, since a composed
 * mark resolves through all three.
 */
export function onIconRegistryChanged(watcher: () => void): () => void {
	watchers.add(watcher);
	return () => watchers.delete(watcher);
}

/** Tell every watcher the roster moved. Called by each registry that an icon name resolves through. */
export function announceIconRegistry(): void {
	for (const watcher of watchers) watcher();
}

/** The body for `name`, or `undefined` when nothing in the roster claims it. */
export function iconBody(name: string): string | undefined {
	const override = contributed.get(name);
	if (override !== undefined) return override;
	return Object.prototype.hasOwnProperty.call(ICONS, name) ? ICONS[name as IconName] : undefined;
}

/** Whether the roster can draw `name`, built-in or contributed. */
export function hasRosterIcon(name: string): boolean {
	return iconBody(name) !== undefined;
}

/** Every name the roster can draw: the built-ins in declaration order, then contributed additions. */
export function rosterIconNames(): string[] {
	const names: string[] = [...ICON_NAMES];
	for (const name of contributed.keys()) {
		if (!names.includes(name)) names.push(name);
	}
	return names;
}

/** The names a mod contributed, excluding built-ins it merely replaced. */
export function contributedIconNames(): string[] {
	return [...contributed.keys()].filter((name) => !Object.prototype.hasOwnProperty.call(ICONS, name));
}

/** Pull the glyph block out of a mod manifest's `xtyle.icons` fills, if it declares any. */
export function iconFillsFrom(modManifest: unknown): IconFill[] {
	const fills = (modManifest as { fills?: Record<string, unknown> } | null | undefined)?.fills;
	const declared = fills?.[ICON_SLOT];
	if (!declared) return [];
	const blocks = Array.isArray(declared) ? declared : [declared];
	return blocks.filter(isIconFill);
}

function isIconFill(value: unknown): value is IconFill {
	if (!value || typeof value !== "object") return false;
	const glyphs = (value as Partial<IconFill>).glyphs;
	if (!glyphs || typeof glyphs !== "object") return false;
	return Object.values(glyphs).every(
		(entry) =>
			typeof entry === "string" ||
			(!!entry && typeof entry === "object" && typeof (entry as IconGlyph).body === "string"),
	);
}

/** Register every glyph a mod manifest contributes, in declaration order. */
export function registerIconFills(modManifest: unknown): number {
	let added = 0;
	for (const fill of iconFillsFrom(modManifest)) {
		registerIcons(fill.glyphs, fill.defaults);
		added += Object.keys(fill.glyphs).length;
	}
	return added;
}
