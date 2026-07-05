import { describe, expect, it } from "vitest";
import {
	derive,
	seriesPalette,
	seriesColorsFor,
	statusToneColor,
	STATUS_TONES,
	STATUS_TONE_KEYS,
	SERIES_SCHEMES,
	toOklchColor,
} from "../src/index.js";
import { xojiDefault } from "../src/batteries.js";

const register = derive(xojiDefault, {
	constraints: { "--bg-0": "#0b0d12", "--fg-0": "#e6e9ef", "--accent": "#6ea8fe" },
});

const isColor = (v: string) => /^(#|rgb|oklch|hsl)/i.test(v);

describe("seriesPalette", () => {
	it("exposes the five built-in schemes", () => {
		expect([...SERIES_SCHEMES]).toEqual(["accents", "skittles", "statuses", "thermal", "status"]);
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

	it("pins statuses to distinct semantic tones in outcome order", () => {
		const five = seriesPalette("statuses", 5, register);
		expect(five[0]).toBe(register["--success"]);
		expect(five[1]).toBe(register["--danger"]);
		expect(five[2]).toBe(register["--warn"]);
		expect(five[3]).toBe(register["--info"]);
		expect(five[4]).toBe(register["--neutral"]);
		// the sixth outcome is the accent (live/pending)
		expect(seriesPalette("statuses", 6, register)[5]).toBe(register["--accent"]);
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
		// accents holds five colors (primary, three variants, neutral), so a request past that wraps
		const colors = seriesPalette("accents", 7, register);
		expect(colors).toHaveLength(7);
		expect(colors[4]).toBe(register["--neutral"]);
		expect(colors[5]).toBe(colors[0]);
		expect(colors[6]).toBe(colors[1]);
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

describe("statusToneColor", () => {
	it("names the six semantic outcomes", () => {
		expect(STATUS_TONE_KEYS).toEqual(["success", "failed", "warn", "info", "skipped", "live"]);
	});

	it("resolves each tone to its register token", () => {
		expect(statusToneColor("success", register)).toBe(register["--success"]);
		expect(statusToneColor("failed", register)).toBe(register["--danger"]);
		expect(statusToneColor("warn", register)).toBe(register["--warn"]);
		expect(statusToneColor("info", register)).toBe(register["--info"]);
		expect(statusToneColor("skipped", register)).toBe(register["--neutral"]);
		expect(statusToneColor("live", register)).toBe(register["--accent"]);
	});

	it("returns undefined for an unknown key", () => {
		expect(statusToneColor("nonsense", register)).toBeUndefined();
	});

	it("shares its token order with the positional statuses scheme", () => {
		const positional = seriesPalette("statuses", STATUS_TONE_KEYS.length, register);
		const byName = STATUS_TONE_KEYS.map((tone) => statusToneColor(tone, register));
		expect(byName).toEqual(positional);
		expect([...Object.values(STATUS_TONES)]).toEqual(["--success", "--danger", "--warn", "--info", "--neutral", "--accent"]);
	});
});

describe("seriesColorsFor", () => {
	it("pins each statuses datum to its tone regardless of position", () => {
		const items = [
			{ tone: "success" as const },
			{ tone: "failed" as const },
			{ tone: "skipped" as const },
		];
		expect(seriesColorsFor("statuses", items, register)).toEqual([
			register["--success"],
			register["--danger"],
			register["--neutral"],
		]);
	});

	it("stays correct when a category is absent (the positional bug this fixes)", () => {
		// A clean run: no failed, no warn. Positional coloring would slide success→danger etc.;
		// by-name coloring keeps every survivor on its own tone.
		const clean = [{ tone: "success" as const }, { tone: "skipped" as const }, { tone: "info" as const }];
		expect(seriesColorsFor("statuses", clean, register)).toEqual([
			register["--success"],
			register["--neutral"],
			register["--info"],
		]);
		// contrast: the positional scheme mis-colors the same three-item set
		const positional = seriesPalette("statuses", 3, register);
		expect(positional).toEqual([register["--success"], register["--danger"], register["--warn"]]);
	});

	it("falls back to positional for a datum with no tone", () => {
		const items = [{ tone: "failed" as const }, {}, { tone: "live" as const }];
		const positional = seriesPalette("statuses", 3, register);
		expect(seriesColorsFor("statuses", items, register)).toEqual([
			register["--danger"],
			positional[1],
			register["--accent"],
		]);
	});

	it("ignores tone for every non-statuses scheme (stays positional)", () => {
		const items = [{ tone: "failed" as const }, { tone: "success" as const }];
		expect(seriesColorsFor("accents", items, register)).toEqual(seriesPalette("accents", 2, register));
		expect(seriesColorsFor("skittles", items, register)).toEqual(seriesPalette("skittles", 2, register));
		expect(seriesColorsFor(["#f00", "#0f0"], items, register)).toEqual(["#f00", "#0f0"]);
	});
});
