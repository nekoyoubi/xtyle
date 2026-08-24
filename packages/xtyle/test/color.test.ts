import { describe, expect, it } from "vitest";
import { argbToRgbHex, contrast, flatten, formatCss, oklabDistance, separationAxes } from "../src/index.js";

describe("argbToRgbHex", () => {
	it("drops the leading alpha byte from an 8-digit ARGB hex", () => {
		expect(argbToRgbHex("#ff112233")).toBe("#112233");
		expect(argbToRgbHex("#80aabbcc")).toBe("#aabbcc");
	});

	it("passes a 6-digit hex through, normalized to lowercase", () => {
		expect(argbToRgbHex("#112233")).toBe("#112233");
		expect(argbToRgbHex("#AABBCC")).toBe("#aabbcc");
	});

	it("expands a 3-digit shorthand", () => {
		expect(argbToRgbHex("#1a2")).toBe("#11aa22");
	});

	it("accepts a bare (unprefixed) hex body", () => {
		expect(argbToRgbHex("ff112233")).toBe("#112233");
	});

	it("throws on a non-hex or wrong-length string", () => {
		expect(() => argbToRgbHex("#12g233")).toThrow();
		expect(() => argbToRgbHex("#12345")).toThrow();
		expect(() => argbToRgbHex("rgb(1,2,3)")).toThrow();
	});
});

describe("contrast — CSS hex contract", () => {
	const white = "#ffffff";
	const ratio = (fg: string) => Math.round(contrast(fg, white) * 100) / 100;

	it("reads 6-digit hex correctly", () => {
		expect(ratio("#112233")).toBe(16.15);
	});

	it("ignores alpha on a CSS alpha-last #RRGGBBAA", () => {
		expect(ratio("#112233ff")).toBe(16.15);
	});

	it("misparses an alpha-first ARGB hex (the documented footgun)", () => {
		// INFO: #ff112233 read as CSS #RRGGBBAA is a reddish rgb(255,17,34), not the intended #112233
		expect(ratio("#ff112233")).not.toBe(16.15);
	});

	it("is correct once the ARGB hex is converted with argbToRgbHex", () => {
		expect(ratio(argbToRgbHex("#ff112233"))).toBe(16.15);
	});
});

describe("separationAxes", () => {
	const q = (a: string, b: string) => {
		const x = separationAxes(a, b);
		return Math.hypot(x.lightness, x.chroma, x.hue);
	};

	it("recombines in quadrature to exactly the oklabDistance", () => {
		const pairs: Array<[string, string]> = [
			["#d1495b", "#d65652"],
			["#ea6e00", "#e27500"],
			["#3b82f6", "#22c55e"],
			["#8a8a8a", "#909090"],
			["#000000", "#ffffff"],
		];
		for (const [a, b] of pairs) {
			expect(q(a, b)).toBeCloseTo(oklabDistance(a, b), 10);
		}
	});

	it("puts a pure lightness step entirely on the lightness axis", () => {
		const axes = separationAxes("#8a8a8a", "#909090");
		expect(axes.chroma).toBeCloseTo(0, 6);
		expect(axes.hue).toBeCloseTo(0, 6);
		expect(axes.hueAngle).toBeCloseTo(0, 6);
	});

	it("reports the hue angle a chroma-scaled distance hides", () => {
		const crimson = separationAxes("#d1495b", "#d65652");
		expect(crimson.hueAngle).toBeLessThan(10);
		expect(crimson.hue).toBeGreaterThan(crimson.lightness);
	});

	it("scores a small rotation at high chroma above a visible gray step", () => {
		expect(oklabDistance("#d1495b", "#d65652")).toBeGreaterThan(oklabDistance("#8a8a8a", "#909090"));
	});
});

describe("flatten", () => {
	it("returns an opaque colour untouched", () => {
		expect(formatCss(flatten("#3ad6f8", "#000000"))).toBe(formatCss("#3ad6f8"));
	});

	it("lands between the two colours, weighted by alpha", () => {
		const half = flatten("rgba(255, 255, 255, 0.5)", "#000000");
		expect(half.alpha).toBe(1);
		expect(half.l).toBeGreaterThan(0.4);
		expect(half.l).toBeLessThan(0.75);
	});

	it("reads a translucent colour as weaker than the same colour opaque", () => {
		const backdrop = "#0e1116";
		const faint = contrast(formatCss(flatten("rgba(255, 255, 255, 0.15)", backdrop)), backdrop);
		const solid = contrast("#ffffff", backdrop);
		expect(faint).toBeLessThan(solid);
	});
});
