import { afterEach, describe, expect, it } from "vitest";
import {
	PALETTES,
	PALETTE_SLOT,
	isPalette,
	paletteFillsFrom,
	paletteNames,
	paletteSpec,
	paletteStops,
	paletteRegisterTokens,
	rampColor,
	registerPaletteFills,
	registerPalettes,
	resetPalettes,
	resolvePalette,
	seriesPalette,
} from "../src/series.js";

const PICO: string[] = ["#ff004d", "#29adff", "#00e436", "#ffec27"];

afterEach(() => {
	resetPalettes();
});

describe("the palette register is open", () => {
	it("does not know a name nobody registered", () => {
		expect(isPalette("pico8")).toBe(false);
		expect(resolvePalette("pico8")).toBeNull();
		expect(paletteSpec("pico8")).toBeUndefined();
	});

	it("takes a registration and answers to the name everywhere a palette name is read", () => {
		registerPalettes({ pico8: { stops: PICO, sampling: "ordered" } });
		expect(isPalette("pico8")).toBe(true);
		expect(resolvePalette("pico8")).toBe("pico8");
		expect(paletteNames()).toContain("pico8");
		expect(paletteStops("pico8")).toEqual(PICO);
	});

	it("keeps literal stops fixed, so an indexed palette does not move with the theme", () => {
		registerPalettes({ pico8: { stops: PICO, sampling: "ordered" } });
		const lit = seriesPalette("pico8", 4, {});
		const themed = seriesPalette("pico8", 4, { "--accent": "#123456" });
		expect(lit).toEqual(PICO);
		expect(themed, "no register token means no register dependency").toEqual(lit);
	});

	it("still resolves token stops against the register, so a contributed ramp can track the theme", () => {
		registerPalettes({ brand: { stops: ["--accent", "--accent-2"], sampling: "interpolate" } });
		expect(paletteRegisterTokens("brand")).toContain("--accent-2");
		const mid = rampColor("brand", 0.5, { "--accent": "#000000", "--accent-2": "#ffffff" });
		expect(mid).not.toBe("currentColor");
	});

	it("is last-wins on the name, so a mod replaces a built-in without restating the rest", () => {
		registerPalettes({ thermal: { stops: ["#000000", "#ffffff"], sampling: "interpolate" } });
		expect(paletteStops("thermal")).toEqual(["#000000", "#ffffff"]);
		expect(paletteStops("severity"), "the rest of the set is untouched").toContain("--success");
	});

	it("drops back to the blessed set on reset, so one registration cannot leak into the next test", () => {
		registerPalettes({ pico8: { stops: PICO, sampling: "ordered" } });
		resetPalettes();
		expect(isPalette("pico8")).toBe(false);
		expect(paletteNames().sort()).toEqual([...PALETTES].sort());
	});

	it("cycles an ordered palette past its end rather than running out of colors", () => {
		registerPalettes({ pico8: { stops: PICO, sampling: "ordered" } });
		const six = seriesPalette("pico8", 6, {});
		expect(six).toHaveLength(6);
		expect(six[4]).toBe(PICO[0]);
		expect(six[5]).toBe(PICO[1]);
	});
});

describe("a palette arrives declared, not only called", () => {
	const modManifest = {
		fills: {
			[PALETTE_SLOT]: [{ palettes: { pico8: { stops: PICO, sampling: "ordered" } } }],
		},
	};

	it("reads the palettes a mod manifest declares", () => {
		expect(paletteFillsFrom(modManifest)).toHaveLength(1);
		expect(registerPaletteFills(modManifest)).toBe(1);
		expect(isPalette("pico8")).toBe(true);
	});

	it("ignores a manifest declaring no palettes at all", () => {
		expect(paletteFillsFrom({ fills: {} })).toEqual([]);
		expect(registerPaletteFills(null)).toBe(0);
	});

	it("rejects a fill whose palettes carry no stop list", () => {
		const bad = { fills: { [PALETTE_SLOT]: [{ palettes: { broken: { sampling: "ordered" } } }] } };
		expect(paletteFillsFrom(bad)).toEqual([]);
		expect(isPalette("broken")).toBe(false);
	});
});
