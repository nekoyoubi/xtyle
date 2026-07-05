import type { TokenRegister } from "./types.js";

export const THEME_FILE_FORMAT = "xtyle-theme" as const;
export const THEME_FILE_VERSION = 1 as const;
export const THEME_FILE_SCHEMA_URL = "https://xtyle.dev/schema/theme.v1.json";

/**
 * Provenance for a materialized theme. Identifying fields only — no store id or
 * timestamps, so a shared file carries what it is and nothing about where it was kept.
 */
export interface ThemeFileMeta {
	name: string;
	description?: string;
	tags?: string[];
	generator?: string;
}

/**
 * The re-derivable half of a theme file: the algorithm and the layered inputs that
 * print its tokens. Knobs and overrides stay loosely typed here — their precise
 * shape belongs to whatever authored the recipe (the bench's recipe, a CLI call) —
 * so the engine owns the envelope without owning any one front-end's input model.
 */
export interface ThemeRecipe {
	algorithm: string;
	knobs?: object;
	overrides?: TokenRegister;
}

/**
 * The canonical, self-describing xtyle theme artifact. `recipe` is the source of
 * truth (re-derive it to reproduce `tokens`); `tokens` is the materialized register,
 * a cache so a consumer can apply the theme without ever running the engine.
 */
export interface XtyleThemeFile {
	$schema?: string;
	format: typeof THEME_FILE_FORMAT;
	version: number;
	meta: ThemeFileMeta;
	recipe: ThemeRecipe;
	tokens: TokenRegister;
}

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function sortTokens(register: TokenRegister): TokenRegister {
	const flat: TokenRegister = {};
	for (const name of Object.keys(register).sort()) {
		flat[name] = register[name] as string;
	}
	return flat;
}

export function buildThemeFile(input: {
	meta: ThemeFileMeta;
	recipe: ThemeRecipe;
	register: TokenRegister;
}): XtyleThemeFile {
	return {
		$schema: THEME_FILE_SCHEMA_URL,
		format: THEME_FILE_FORMAT,
		version: THEME_FILE_VERSION,
		meta: input.meta,
		recipe: input.recipe,
		tokens: sortTokens(input.register),
	};
}

export function serializeThemeFile(file: XtyleThemeFile): string {
	return `${JSON.stringify(file, null, 2)}\n`;
}

/** A strict check for the canonical envelope — format marker plus a usable recipe. */
export function isThemeFile(value: unknown): value is XtyleThemeFile {
	return (
		isObject(value) &&
		value.format === THEME_FILE_FORMAT &&
		isObject(value.recipe) &&
		typeof (value.recipe as Record<string, unknown>).algorithm === "string"
	);
}

/**
 * Parse a canonical theme file from text or a value. Strict by design: it accepts
 * only the `xtyle-theme` envelope. Looser coercion (bare recipes, raw token maps,
 * legacy docs) is a front-end concern, since only the front end knows its own input model.
 */
export function parseThemeFile(input: string | unknown): XtyleThemeFile | null {
	let value: unknown = input;
	if (typeof input === "string") {
		try {
			value = JSON.parse(input);
		} catch {
			return null;
		}
	}
	return isThemeFile(value) ? value : null;
}
