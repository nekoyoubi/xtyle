import { describe, expect, it } from "vitest";
import {
	channelModels,
	channelsOf,
	colorFromChannels,
	colorToChannels,
	colorFormats,
	formatColor,
	harmony,
	harmonySchemes,
	nearestNamedColor,
	nearestWebSafe,
	oklchToDisplay,
	parseColor,
} from "../src/index.js";

const SAMPLES = ["#5b8cff", "#e25b99", "#22c55e", "#000000", "#ffffff", "#808080"];

describe("parse / format round-trip", () => {
	it("every format parses back to the same color", () => {
		for (const hex of SAMPLES) {
			const color = parseColor(hex)!;
			for (const format of colorFormats) {
				const out = formatColor(color, format);
				const back = parseColor(out);
				expect(back, `${hex} via ${format} (${out})`).not.toBeNull();
				// hsl/cmyk are integer-percent lossy; assert each channel within 1/255
				expect(Math.abs((back!.r - color.r) * 255)).toBeLessThanOrEqual(1.5);
				expect(Math.abs((back!.g - color.g) * 255)).toBeLessThanOrEqual(1.5);
				expect(Math.abs((back!.b - color.b) * 255)).toBeLessThanOrEqual(1.5);
			}
		}
	});

	it("cmyk parses from a typed string", () => {
		const c = parseColor("cmyk(80% 0% 50% 10%)")!;
		expect(formatColor(c, "hex")).toBe("#2ee673");
	});
});

describe("channel models", () => {
	it("channelsOf returns the right channel count", () => {
		expect(channelsOf("rgb")).toHaveLength(3);
		expect(channelsOf("cmyk")).toHaveLength(4);
		expect(channelsOf("oklch").map((c) => c.key)).toEqual(["l", "c", "h"]);
	});

	it("color → channels → color round-trips exactly for every model", () => {
		for (const hex of SAMPLES) {
			const color = parseColor(hex)!;
			for (const model of channelModels) {
				const channels = colorToChannels(color, model);
				expect(channels, `${hex} ${model}`).toHaveLength(channelsOf(model).length);
				const back = colorFromChannels(model, channels, color.alpha);
				expect(formatColor(back, "hex"), `${hex} via ${model}`).toBe(hex);
			}
		}
	});

	it("channel values land inside the declared range", () => {
		const color = parseColor("#5b8cff")!;
		for (const model of channelModels) {
			const channels = colorToChannels(color, model);
			channelsOf(model).forEach((def, i) => {
				expect(channels[i]!, `${model}.${def.key}`).toBeGreaterThanOrEqual(def.min);
				expect(channels[i]!, `${model}.${def.key}`).toBeLessThanOrEqual(def.max);
			});
		}
	});
});

describe("harmony", () => {
	it("each scheme yields the expected count of related colors", () => {
		const base = parseColor("#5b8cff")!;
		const counts: Record<string, number> = {
			complementary: 1,
			triadic: 2,
			analogous: 2,
			"split-complementary": 2,
			tetradic: 3,
			monochromatic: 4,
			shades: 3,
			tints: 3,
		};
		for (const scheme of harmonySchemes) {
			expect(harmony(base, scheme), scheme).toHaveLength(counts[scheme]!);
		}
	});

	it("the complement is roughly opposite on the wheel", () => {
		const base = parseColor("#5b8cff")!;
		const [complement] = harmony(base, "complementary");
		expect(formatColor(complement!, "hex")).toBe("#ffce5b");
	});

	it("shades and tints stay distinct (no collapse to black or white)", () => {
		const base = parseColor("#5b8cff")!;
		for (const scheme of ["shades", "tints"] as const) {
			const hexes = harmony(base, scheme).map((c) => formatColor(c, "hex"));
			expect(new Set(hexes).size, scheme).toBe(hexes.length);
		}
	});
});

describe("web-safe snapping", () => {
	it("snaps every channel to a multiple of 0x33", () => {
		for (const hex of ["#5b8cff", "#e25b99", "#123456", "#abcdef"]) {
			const snapped = nearestWebSafe(parseColor(hex)!);
			for (const channel of [snapped.r, snapped.g, snapped.b]) {
				expect(Math.round(channel * 255) % 51, `${hex} channel ${channel}`).toBe(0);
			}
		}
	});

	it("leaves an already web-safe color unchanged", () => {
		const safe = parseColor("#33cc99")!;
		expect(formatColor(nearestWebSafe(safe), "hex")).toBe("#33cc99");
	});

	it("preserves alpha", () => {
		const snapped = nearestWebSafe(parseColor("#5b8cff80")!);
		expect(snapped.alpha).toBeCloseTo(parseColor("#5b8cff80")!.alpha, 5);
	});
});

describe("nearest named color", () => {
	it("returns a named color that parses back", () => {
		const { name, color } = nearestNamedColor(parseColor("#6495ed")!);
		expect(name).toBe("cornflowerblue");
		expect(formatColor(color, "hex")).toBe("#6495ed");
	});

	it("maps an exact named color to itself", () => {
		for (const [name, hex] of [["tomato", "#ff6347"], ["gold", "#ffd700"], ["teal", "#008080"]] as const) {
			expect(nearestNamedColor(parseColor(hex)!).name).toBe(name);
		}
	});

	it("preserves the input alpha on the snapped color", () => {
		const { color } = nearestNamedColor(parseColor("#6495ed40")!);
		expect(color.alpha).toBeCloseTo(parseColor("#6495ed40")!.alpha, 5);
	});
});

describe("oklch gamut display", () => {
	it("reports a low-chroma color as in gamut and returns it faithfully", () => {
		const { color, inGamut } = oklchToDisplay(0.7, 0.05, 250);
		expect(inGamut).toBe(true);
		const channels = colorToChannels(color, "oklch");
		expect(channels[0]).toBeCloseTo(0.7, 2);
		expect(channels[1]).toBeCloseTo(0.05, 2);
		expect(channels[2]).toBeCloseTo(250, 0);
	});

	it("flags an impossible-chroma color as out of gamut", () => {
		expect(oklchToDisplay(0.7, 0.37, 250).inGamut).toBe(false);
		expect(oklchToDisplay(0.5, 0.3, 30).inGamut).toBe(false);
	});

	it("clamps the returned color into sRGB even when out of gamut", () => {
		const { color } = oklchToDisplay(0.7, 0.37, 250);
		for (const channel of [color.r, color.g, color.b]) {
			expect(channel).toBeGreaterThanOrEqual(0);
			expect(channel).toBeLessThanOrEqual(1);
		}
	});
});
