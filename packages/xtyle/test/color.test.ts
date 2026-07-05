import { describe, expect, it } from "vitest";
import { argbToRgbHex, contrast } from "../src/index.js";

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
		// #ff112233 read as CSS #RRGGBBAA is a reddish rgb(255,17,34), not the intended #112233
		expect(ratio("#ff112233")).not.toBe(16.15);
	});

	it("is correct once the ARGB hex is converted with argbToRgbHex", () => {
		expect(ratio(argbToRgbHex("#ff112233"))).toBe(16.15);
	});
});
