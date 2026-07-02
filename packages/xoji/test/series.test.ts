import { describe, expect, it } from "vitest";
import { derive, seriesPalette, SERIES_SCHEMES, toOklchColor } from "../src/index.js";
import { xojiDefault } from "../src/batteries.js";

const register = derive(xojiDefault, {
	constraints: { "--bg-0": "#0b0d12", "--fg-0": "#e6e9ef", "--accent": "#6ea8fe" },
});

const isColor = (v: string) => /^(#|rgb|oklch|hsl)/i.test(v);

describe("seriesPalette", () => {
	it("exposes the four built-in schemes", () => {
		expect([...SERIES_SCHEMES]).toEqual(["accents", "skittles", "thermal", "status"]);
	});

	it("returns exactly `count` resolved colors for every scheme", () => {
		for (const scheme of SERIES_SCHEMES) {
			const colors = seriesPalette(scheme, 5, register);
			expect(colors).toHaveLength(5);
			expect(colors.every(isColor)).toBe(true);
		}
	});

	it("takes accents in their authored order (primary first)", () => {
		const colors = seriesPalette("accents", 3, register);
		expect(colors[0]).toBe(register["--accent"]);
		expect(colors[1]).toBe(register["--accent-2"]);
		expect(colors[2]).toBe(register["--accent-3"]);
	});

	it("evenly samples skittles for separation rather than adjacent hues", () => {
		// three of eight ring hues should span the wheel, not sit side by side
		const three = seriesPalette("skittles", 3, register);
		const hues = three.map((c) => toOklchColor(c).h);
		const gap = (a: number, b: number) => {
			const d = Math.abs(a - b) % 360;
			return d > 180 ? 360 - d : d;
		};
		expect(gap(hues[0] as number, hues[1] as number)).toBeGreaterThan(45);
		expect(gap(hues[1] as number, hues[2] as number)).toBeGreaterThan(45);
	});

	it("cycles a categorical scheme when more series than base colors are asked for", () => {
		const colors = seriesPalette("accents", 6, register);
		expect(colors).toHaveLength(6);
		expect(colors[4]).toBe(colors[0]);
		expect(colors[5]).toBe(colors[1]);
	});

	it("interpolates a sequential scheme from cold to hot", () => {
		const colors = seriesPalette("thermal", 5, register);
		const firstHue = toOklchColor(colors[0] as string).h;
		const lastHue = toOklchColor(colors[colors.length - 1] as string).h;
		// blue (~260) cold end vs red (~25) hot end
		expect(firstHue).toBeGreaterThan(200);
		expect(lastHue).toBeLessThan(60);
	});

	it("uses explicit colors verbatim, cycling to count", () => {
		const colors = seriesPalette(["#ff0000", "#00ff00"], 4, register);
		expect(colors).toEqual(["#ff0000", "#00ff00", "#ff0000", "#00ff00"]);
	});

	it("returns an empty palette for a non-positive count", () => {
		expect(seriesPalette("skittles", 0, register)).toEqual([]);
	});

	it("reverses any scheme end for end", () => {
		const forward = seriesPalette("thermal", 5, register);
		const reversed = seriesPalette("thermal", 5, register, { reverse: true });
		expect(reversed).toEqual([...forward].reverse());
		// hot end now leads
		expect(toOklchColor(reversed[0] as string).h).toBeLessThan(60);
	});

	it("reverses explicit colors and categorical order", () => {
		expect(seriesPalette(["#ff0000", "#00ff00", "#0000ff"], 3, register, { reverse: true })).toEqual([
			"#0000ff",
			"#00ff00",
			"#ff0000",
		]);
		const accents = seriesPalette("accents", 3, register);
		expect(seriesPalette("accents", 3, register, { reverse: true })).toEqual([...accents].reverse());
	});
});
