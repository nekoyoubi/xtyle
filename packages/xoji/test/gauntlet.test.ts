import { describe, expect, it } from "vitest";
import { contrast, derive, gauntlet, toOklchColor } from "../src/index.js";
import { GAUNTLET_DEPTH_RUNS, resolveDepth } from "../src/gauntlet.js";
import { algorithms, nxiNite, xojiDefault, xojiHc, xojiLoud, xojiQuiet } from "../src/batteries.js";

const SET = [xojiDefault, xojiHc, xojiQuiet, xojiLoud, nxiNite];
// Routine `npm test` (no env) is the fast feedback gate — a quick spread of the property battery.
// `XOJI_GAUNTLET_DEPTH=standard` or `=full` opt into the heavier counts before a push.
const RUNS = GAUNTLET_DEPTH_RUNS[resolveDepth(process.env.XOJI_GAUNTLET_DEPTH ?? "quick")];

describe.each(SET.map((a) => [a.id, a] as const))("gauntlet(%s)", (_id, algorithm) => {
	const report = gauntlet(algorithm, { runs: RUNS, seed: 12345 });

	it("covers every extreme plus the configured depth of random anchor sets", () => {
		expect(report.runs).toBe(RUNS);
		expect(report.runs).toBeGreaterThanOrEqual(8);
	});

	it("holds every declared invariant across all runs", () => {
		if (!report.ok) {
			console.error(algorithm.id, report.failures.slice(0, 5));
		}
		expect(report.ok).toBe(true);
		expect(report.passed).toBe(report.runs);
	});

	it("is deterministic for a fixed seed", () => {
		// Determinism is a property of the seed→output mapping, not of run volume — a small fixed
		// sample catches a Math.random leak just as well as re-running the whole battery, and keeps
		// routine runs from paying the gauntlet cost twice.
		const probe = Math.min(RUNS, 16);
		const a = gauntlet(algorithm, { runs: probe, seed: 12345 });
		const b = gauntlet(algorithm, { runs: probe, seed: 12345 });
		expect(b.ok).toBe(a.ok);
		expect(b.passed).toBe(a.passed);
		expect(b.failures).toEqual(a.failures);
	});
});

describe("algorithm set", () => {
	it("registers all five by id", () => {
		expect(Object.keys(algorithms).sort()).toEqual([
			"nxi-nite",
			"xoji-default",
			"xoji-hc",
			"xoji-loud",
			"xoji-quiet",
		]);
	});

	it("never parses a non-color token as OKLCH (category-aware)", () => {
		for (const algorithm of SET) {
			const colorless = algorithm.produces.filter(
				(t) => algorithm.categories[t] !== "color",
			);
			expect(colorless).toContain("--font-sans");
			expect(colorless).toContain("--duration-fast");
			expect(colorless).toContain("--text-lg");
			expect(colorless).toContain("--elevation-2");
		}
	});

	it("xoji-hc holds AAA contrast on fg-0 / bg-0 (stricter than the rest)", () => {
		const r = derive(xojiHc, { constraints: { "--bg-0": "#0f1115", "--accent": "#5b8cff" } });
		expect(contrast(r["--fg-0"]!, r["--bg-0"]!)).toBeGreaterThanOrEqual(7 - 0.01);
	});

	it("xoji-hc picks the best-reachable true pole when bg-0 is pinned mid-gray", () => {
		for (const bg of ["#a0a0a0", "#808080", "#959595", "#717171"]) {
			const r = derive(xojiHc, { constraints: { "--bg-0": bg } });
			const got = contrast(r["--fg-0"]!, bg);
			const ceiling = Math.max(contrast("#000000", bg), contrast("#ffffff", bg));
			expect(got, `${bg} fg-0 should reach the physical ceiling`).toBeGreaterThanOrEqual(
				ceiling - 0.02,
			);
		}
	});

	it("xoji-hc clamps fg-0/link/accent-text to the achievable AAA floor on pinned bg-0", () => {
		for (const bg of ["#a0a0a0", "#959595", "#a8a8a8", "#b0b0b0"]) {
			const r = derive(xojiHc, { constraints: { "--bg-0": bg } });
			const ceiling = Math.max(contrast("#000000", bg), contrast("#ffffff", bg));
			const required = Math.min(7, ceiling - 0.05);
			for (const token of ["--fg-0", "--link", "--accent-text", "--neutral-text"]) {
				expect(
					contrast(r[token]!, bg),
					`${token} on pinned ${bg}`,
				).toBeGreaterThanOrEqual(required - 0.01);
			}
		}
	});

	it("xoji-quiet and xoji-loud differ in accent chroma", () => {
		// Seed only the background so the accent is *derived* (a pinned accent is honored
		// verbatim and identical across algorithms); the vibrancy posture shows in the derived hue.
		const anchors = { bg: "#0f1115" };
		const quiet = toOklchColor(derive(xojiQuiet, { anchors })["--accent"]!);
		const loud = toOklchColor(derive(xojiLoud, { anchors })["--accent"]!);
		expect(loud.c).toBeGreaterThan(quiet.c + 0.02);
	});

	it("xoji-loud carries punchier elevation than xoji-quiet", () => {
		const strength = (s: string): number => {
			const px = (s.match(/([0-9.]+)px/g) ?? []).reduce(
				(n, p) => n + Number.parseFloat(p),
				0,
			);
			const a = (s.match(/rgba?\([^)]*,\s*([0-9.]+)\)/g) ?? []).reduce((n, m) => {
				const x = /,\s*([0-9.]+)\)/.exec(m);
				return n + (x ? Number.parseFloat(x[1]!) * 20 : 0);
			}, 0);
			return px + a;
		};
		const quiet = derive(xojiQuiet, {})["--elevation-4"]!;
		const loud = derive(xojiLoud, {})["--elevation-4"]!;
		expect(strength(loud)).toBeGreaterThan(strength(quiet));
	});
});
