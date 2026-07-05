import { describe, expect, it } from "vitest";
import {
	THEME_FILE_FORMAT,
	THEME_FILE_VERSION,
	buildThemeFile,
	derive,
	isThemeFile,
	parseThemeFile,
	serializeThemeFile,
} from "../src/index.js";
import { xtyleDefault } from "../src/batteries.js";

const register = derive(xtyleDefault, { constraints: { "--bg-0": "#0f1115", "--accent": "#5b8cff" } });

const recipe = {
	algorithm: "xtyle-default",
	knobs: {},
	overrides: { "--bg-0": "#0f1115", "--accent": "#5b8cff" },
};

describe("theme file", () => {
	it("builds a self-describing envelope with format markers, meta, recipe, and tokens", () => {
		const file = buildThemeFile({ meta: { name: "Midnight" }, recipe, register });
		expect(file.format).toBe(THEME_FILE_FORMAT);
		expect(file.version).toBe(THEME_FILE_VERSION);
		expect(file.meta.name).toBe("Midnight");
		expect(file.recipe.algorithm).toBe("xtyle-default");
		expect(file.tokens["--accent"]).toBe(register["--accent"]);
		expect(file.$schema).toContain("theme.v1.json");
	});

	it("sorts tokens for a stable, diff-friendly serialization", () => {
		const file = buildThemeFile({ meta: { name: "Sorted" }, recipe, register });
		const keys = Object.keys(file.tokens);
		expect(keys).toEqual([...keys].sort());
	});

	it("round-trips through serialize and parse", () => {
		const file = buildThemeFile({ meta: { name: "Round" }, recipe, register });
		const parsed = parseThemeFile(serializeThemeFile(file));
		expect(parsed).not.toBeNull();
		expect(parsed?.recipe.algorithm).toBe("xtyle-default");
		expect(parsed?.tokens["--accent"]).toBe(register["--accent"]);
	});

	it("re-derives the cached tokens byte-identically from the recipe", () => {
		const pinnedRecipe = {
			algorithm: "xtyle-default",
			knobs: {},
			overrides: { "--bg-0": "#0f1115", "--accent": "#5b8cff", "--danger": "#7c3aed" },
		};
		const cached = derive(xtyleDefault, { constraints: pinnedRecipe.overrides });
		const parsed = parseThemeFile(
			serializeThemeFile(buildThemeFile({ meta: { name: "Cache" }, recipe: pinnedRecipe, register: cached })),
		);
		const rederived = derive(xtyleDefault, { constraints: parsed?.recipe.overrides });
		expect(rederived).toEqual(parsed?.tokens);
	});

	it("rejects non-envelope JSON and junk", () => {
		expect(parseThemeFile("not json")).toBeNull();
		expect(parseThemeFile(JSON.stringify({ "--accent": "#fff" }))).toBeNull();
		expect(parseThemeFile(JSON.stringify({ format: "xtyle-theme" }))).toBeNull();
		expect(isThemeFile({ format: "xtyle-theme", recipe: { algorithm: "x" } })).toBe(true);
		expect(isThemeFile({ recipe: { algorithm: "x" } })).toBe(false);
	});
});
