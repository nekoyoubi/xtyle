import { describe, expect, it } from "vitest";
import {
	derive,
	seriesPalette,
	seriesColorsFor,
	statusToneColor,
	rampColor,
	rampGradientStops,
	resolvePalette,
	paletteStops,
	STATUS_TONES,
	STATUS_TONE_KEYS,
	PALETTES,
	PALETTE_SPECS,
	PALETTE_TOKENS,
	toOklchColor,
} from "../src/index.js";
import { xtyleDefault } from "../src/batteries.js";

const register = derive(xtyleDefault, {
	constraints: { "--bg-0": "#0b0d12", "--fg-0": "#e6e9ef", "--accent": "#6ea8fe" },
});

const isColor = (v: string) => /^(#|rgb|oklch|hsl)/i.test(v);

describe("the palette vocabulary", () => {
	it("names six palettes and nothing else", () => {
		expect([...PALETTES]).toEqual(["accents", "skittles", "statuses", "thermal", "severity", "intensity"]);
		expect(Object.keys(PALETTE_SPECS).sort()).toEqual([...PALETTES].sort());
	});

	it("carries the stops the user ratified", () => {
		expect(PALETTE_SPECS.accents.stops).toEqual(["--accent", "--accent-2", "--accent-3", "--accent-4", "--neutral"]);
		expect(PALETTE_SPECS.statuses.stops).toEqual([...Object.values(STATUS_TONES)]);
		expect(PALETTE_SPECS.thermal.stops).toEqual(["--blue", "--cyan", "--yellow", "--red"]);
		expect(PALETTE_SPECS.severity.stops).toEqual(["--success", "--warn", "--danger"]);
		expect(PALETTE_SPECS.intensity.stops).toEqual(["--bg-2", "--accent"]);
		expect(PALETTE_SPECS.skittles.stops).toHaveLength(9);
	});

	it("answers both questions for every palette: N discrete colors, and a ramp", () => {
		for (const palette of PALETTES) {
			const discrete = seriesPalette(palette, 5, register);
			expect(discrete).toHaveLength(5);
			expect(discrete.every(isColor)).toBe(true);

			const ramp = [0, 0.5, 1].map((t) => rampColor(palette, t, register));
			expect(ramp.every(isColor)).toBe(true);
			expect(rampGradientStops(palette).length).toBeGreaterThan(1);
		}
	});

	it("collects every stop token any palette reads, `--bg-2` included", () => {
		for (const spec of Object.values(PALETTE_SPECS)) {
			for (const stop of spec.stops) expect(PALETTE_TOKENS).toContain(stop);
		}
		expect(PALETTE_TOKENS).toContain("--bg-2");
		expect(new Set(PALETTE_TOKENS).size).toBe(PALETTE_TOKENS.length);
	});
});

describe("deprecated palette names", () => {
	it("renames `status` to `severity` and `accent` to `intensity`", () => {
		expect(resolvePalette("status")).toBe("severity");
		expect(resolvePalette("accent")).toBe("intensity");
	});

	it("never aliases a rename onto its look-alike (the repaint-every-chart mistake)", () => {
		expect(resolvePalette("status")).not.toBe("statuses");
		expect(resolvePalette("accent")).not.toBe("accents");
		expect(paletteStops("status")).toEqual(PALETTE_SPECS.severity.stops);
		expect(paletteStops("accent")).toEqual(PALETTE_SPECS.intensity.stops);
		expect(seriesPalette("status" as never, 4, register)).not.toEqual(seriesPalette("statuses", 4, register));
		expect(rampColor("accent" as never, 0.4, register)).not.toBe(rampColor("accents", 0.4, register));
	});

	it("resolves current names untouched and rejects nonsense", () => {
		for (const palette of PALETTES) expect(resolvePalette(palette)).toBe(palette);
		expect(resolvePalette("nonsense")).toBeNull();
	});
});

/**
 * The rename must be a rename and nothing more: every palette that kept its name hands back the exact
 * colors it did before the vocabulary was unified, and the two renamed ones hand back exactly what their
 * old names did. These literals were captured off the pre-unification implementation.
 *
 * The one deliberate exception is a single interpolated color, which the old engine lerped between the
 * first and last stop and so walked *through* colors the palette does not contain: `thermal` (blue, cyan,
 * yellow, red) handed back purple. A lone color is now the true midpoint of the walk, agreeing with both
 * `rampColor(0.5)` and the middle of a three-color sample.
 */
describe("byte-identical to the pre-unification engine", () => {
	const GOLDEN_DISCRETE: Record<string, Record<number, string[]>> = {
		accents: {
			1: ["#6ea8fe"],
			3: ["#6ea8fe", "#00bbd7", "#b990ef"],
			5: ["#6ea8fe", "#00bbd7", "#b990ef", "#d79b29", "#7d8086"],
			9: ["#6ea8fe", "#00bbd7", "#b990ef", "#d79b29", "#7d8086", "#6ea8fe", "#00bbd7", "#b990ef", "#d79b29"],
		},
		skittles: {
			1: ["#ff6963"],
			3: ["#ff6963", "#46a5ff", "#00b7be"],
			5: ["#ff6963", "#bd9e00", "#46a5ff", "#cb9272", "#00b7be"],
			9: ["#ff6963", "#f17d00", "#bd9e00", "#44bd50", "#46a5ff", "#b382ff", "#cb9272", "#e971af", "#00b7be"],
		},
		statuses: {
			1: ["#4c9b51"],
			3: ["#4c9b51", "#ca625c", "#9e8400"],
			5: ["#4c9b51", "#ca625c", "#9e8400", "#3f8ad2", "#7d8086"],
			9: ["#4c9b51", "#ca625c", "#9e8400", "#3f8ad2", "#7d8086", "#6ea8fe", "#4c9b51", "#ca625c", "#9e8400"],
		},
		thermal: {
			1: ["#62b76f"],
			3: ["#46a5ff", "#62b76f", "#ff6963"],
			5: ["#46a5ff", "#00b4ce", "#62b76f", "#d39200", "#ff6963"],
			9: ["#46a5ff", "#00afe9", "#00b4ce", "#03b9ad", "#62b76f", "#aaa624", "#d39200", "#f17c25", "#ff6963"],
		},
		severity: {
			1: ["#9e8400"],
			3: ["#4c9b51", "#9e8400", "#ca625c"],
			5: ["#4c9b51", "#7c9127", "#9e8400", "#be7024", "#ca625c"],
			9: ["#4c9b51", "#67973c", "#7c9127", "#8f8b12", "#9e8400", "#b07a02", "#be7024", "#c76840", "#ca625c"],
		},
	};

	const GOLDEN_RAMP: Record<string, string[]> = {
		intensity: ["#1f2127", "#353f57", "#4a5f8b", "#5e82c3", "#6ea8fe"],
		thermal: ["#46a5ff", "#00b4ce", "#62b76f", "#d39200", "#ff6963"],
		severity: ["#4c9b51", "#7c9127", "#9e8400", "#be7024", "#ca625c"],
	};

	const GOLDEN_STOPS: Record<string, string[]> = {
		intensity: ["var(--bg-2)", "var(--accent)"],
		thermal: ["var(--blue)", "var(--cyan)", "var(--yellow)", "var(--red)"],
		severity: ["var(--success)", "var(--warn)", "var(--danger)"],
	};

	it("samples N discrete colors as it always did, but for a lone interpolated color", () => {
		for (const [palette, byCount] of Object.entries(GOLDEN_DISCRETE)) {
			for (const [count, expected] of Object.entries(byCount)) {
				expect(seriesPalette(palette as never, Number(count), register)).toEqual(expected);
			}
		}
	});

	it("ramps exactly as it always did", () => {
		for (const [palette, expected] of Object.entries(GOLDEN_RAMP)) {
			expect([0, 0.25, 0.5, 0.75, 1].map((t) => rampColor(palette as never, t, register))).toEqual(expected);
			expect(rampGradientStops(palette as never)).toEqual(GOLDEN_STOPS[palette]);
		}
	});

	it("routes the deprecated names onto the same colors their old selves produced", () => {
		expect(seriesPalette("status" as never, 5, register)).toEqual(GOLDEN_DISCRETE.severity?.[5]);
		expect([0, 0.25, 0.5, 0.75, 1].map((t) => rampColor("accent" as never, t, register))).toEqual(
			GOLDEN_RAMP.intensity,
		);
		expect(rampGradientStops("status" as never)).toEqual(GOLDEN_STOPS.severity);
	});
});

describe("seriesPalette", () => {
	it("returns exactly `count` resolved colors for every palette", () => {
		for (const palette of PALETTES) {
			const colors = seriesPalette(palette, 5, register);
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

	it("cycles an ordered palette when more series than stops are asked for", () => {
		// accents holds five colors (primary, three variants, neutral), so a request past that wraps
		const colors = seriesPalette("accents", 7, register);
		expect(colors).toHaveLength(7);
		expect(colors[4]).toBe(register["--neutral"]);
		expect(colors[5]).toBe(colors[0]);
		expect(colors[6]).toBe(colors[1]);
	});

	it("interpolates a ramp-shaped palette from cold to hot", () => {
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

	it("reverses any palette end for end", () => {
		const forward = seriesPalette("thermal", 5, register);
		const reversed = seriesPalette("thermal", 5, register, { reverse: true });
		expect(reversed).toEqual([...forward].reverse());
		// hot end now leads
		expect(toOklchColor(reversed[0] as string).h).toBeLessThan(60);
	});

	it("reverses explicit colors and sampled order", () => {
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

	it("shares its token order with the positional statuses palette", () => {
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
		// contrast: positional sampling mis-colors the same three-item set
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

	it("ignores tone for every non-statuses palette (stays positional)", () => {
		const items = [{ tone: "failed" as const }, { tone: "success" as const }];
		expect(seriesColorsFor("accents", items, register)).toEqual(seriesPalette("accents", 2, register));
		expect(seriesColorsFor("skittles", items, register)).toEqual(seriesPalette("skittles", 2, register));
		expect(seriesColorsFor(["#f00", "#0f0"], items, register)).toEqual(["#f00", "#0f0"]);
	});
});
