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
 * validates it against the slot's payload schema.
 */

/** The slot a mod fills to contribute glyphs to the roster. */
export const ICON_SLOT = "xtyle.icons";

/** One mod's contribution to the roster: inner SVG bodies on a 24×24 grid, keyed by glyph name. */
export interface IconFill {
	glyphs: Record<string, string>;
}

const contributed = new Map<string, string>();

/**
 * Add glyphs to the roster, replacing any name already present.
 *
 * Last write wins, which makes registration order the precedence rule — the same contract fills
 * already have, where a mod loaded after another paints over it. A mod may therefore reskin a
 * built-in (`check`, `chevron-down`) as readily as it adds a new name.
 */
export function registerIcons(glyphs: Record<string, string>): void {
	for (const [name, body] of Object.entries(glyphs)) {
		if (typeof body === "string" && body.length > 0) contributed.set(name, body);
	}
}

/** Drop every contributed glyph, leaving the built-in set. For tests and for a host teardown. */
export function resetIcons(): void {
	contributed.clear();
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
	return Object.values(glyphs).every((body) => typeof body === "string");
}

/** Register every glyph a mod manifest contributes, in declaration order. */
export function registerIconFills(modManifest: unknown): number {
	let added = 0;
	for (const fill of iconFillsFrom(modManifest)) {
		registerIcons(fill.glyphs);
		added += Object.keys(fill.glyphs).length;
	}
	return added;
}
