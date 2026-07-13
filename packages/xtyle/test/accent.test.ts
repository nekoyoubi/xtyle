import { describe, expect, it } from "vitest";
import {
	DEFAULT_ANCHORS,
	SHARED_KNOBS,
	derive,
	gauntlet,
	hueDelta,
	makeXtyleAlgorithm,
	resolveGraph,
	toOklchColor,
	type OklchColor,
	type TokenRegister,
} from "../src/index.js";
import { toPreset } from "../src/authoring.js";
import { xtyleDefault } from "../src/batteries.js";

const DEFAULT_STEP = 90;

function accentHues(register: Record<string, string>): number[] {
	return ["--accent", "--accent-2", "--accent-3", "--accent-4"].map(
		(name) => toOklchColor(register[name] as string).h,
	);
}

function splitDeltas(hues: number[]): { under: number; over: number; complement: number } {
	const a1 = hues[0] as number;
	return {
		under: hueDelta(a1, hues[1] as number),
		over: hueDelta(a1, hues[2] as number),
		complement: Math.abs(hueDelta(a1, hues[3] as number)),
	};
}

describe("xtyle-default accent ramp", () => {
	it("flanks the accent at ∓half the step and complements at 180 off a chromatic accent", () => {
		const r = derive(xtyleDefault, { constraints: { "--accent": "#ff0000" } });
		const { under, over, complement } = splitDeltas(accentHues(r));
		expect(under).toBeCloseTo(-DEFAULT_STEP / 2, 0);
		expect(over).toBeCloseTo(DEFAULT_STEP / 2, 0);
		expect(complement).toBeCloseTo(180, 0);
	});

	it("narrows the wings with the accentSplit knob, holding the 180 complement", () => {
		const r = derive(xtyleDefault, {
			constraints: { "--accent": "#ff0000" },
			knobs: { accentSplit: 30 },
		});
		const { under, over, complement } = splitDeltas(accentHues(r));
		expect(under).toBeCloseTo(-30, 0);
		expect(over).toBeCloseTo(30, 0);
		expect(complement).toBeCloseTo(180, 0);
	});

	it("fans a near-gray accent into distinct tints, so a categorical chart stays legible", () => {
		const r = derive(xtyleDefault, { constraints: { "--accent": "#888888" } });
		const fan = ["--accent", "--accent-2", "--accent-3", "--accent-4"].map((n) => r[n] as string);
		// hue rotation on a zero-chroma accent would collapse the fan to four identical grays
		expect(new Set(fan).size).toBe(4);
		// the primary accent stays as authored (near-gray); only the fan floors its chroma for distinctness
		expect(toOklchColor(fan[0] as string).c).toBeLessThan(0.02);
		for (const v of fan.slice(1)) expect(toOklchColor(v as string).c).toBeGreaterThan(0.03);
	});

	it("mirrors a pinned --accent-2 into the opposing wing, holding the 180 complement", () => {
		const r = derive(xtyleDefault, {
			constraints: { "--accent": "#ff0000", "--accent-2": "#00ff00" },
		});
		expect(r["--accent"]).toBe("#ff0000");
		expect(r["--accent-2"]).toBe("#00ff00");

		const { under, over, complement } = splitDeltas(accentHues(r));
		// accent-3 is now the mirror of the pinned accent-2 across the accent, not the fixed +split,
		// so the two wings stay symmetric around the author's choice.
		expect(over).toBeCloseTo(-under, 0);
		expect(Math.abs(over - DEFAULT_STEP / 2)).toBeGreaterThan(10);
		expect(complement).toBeCloseTo(180, 0);
	});

	it("mirrors a pinned --accent-3 into the opposing wing, holding the 180 complement", () => {
		const r = derive(xtyleDefault, {
			constraints: { "--accent": "#ff0000", "--accent-3": "#00ff00" },
		});
		expect(r["--accent"]).toBe("#ff0000");
		expect(r["--accent-3"]).toBe("#00ff00");

		const { under, over, complement } = splitDeltas(accentHues(r));
		// The fan is symmetric either way: pinning accent-3 pulls accent-2 into its mirror.
		expect(under).toBeCloseTo(-over, 0);
		expect(Math.abs(under - -DEFAULT_STEP / 2)).toBeGreaterThan(10);
		expect(complement).toBeCloseTo(180, 0);
	});

	it("derives the accent anchor from bg/fg when no accent is specified", () => {
		const r = derive(xtyleDefault, { constraints: { "--bg-0": "#0b0d12", "--fg-0": "#e6e9ef" } });
		const a1 = toOklchColor(r["--accent"] as string);
		expect(a1.c).toBeGreaterThan(0.05);
		expect(r["--accent"]).not.toBe(toOklchColor("#5b8cff"));

		// The desaturated bg-derived accent sits near a gamut edge, so emitAccent's clamp can
		// nudge a flank's hue by ~1° — looser than the in-gamut #ff0000 cases, well inside the
		// gauntlet's own 8° tolerance.
		const { under, over, complement } = splitDeltas(accentHues(r));
		expect(Math.abs(under - -DEFAULT_STEP / 2)).toBeLessThan(1.5);
		expect(Math.abs(over - DEFAULT_STEP / 2)).toBeLessThan(1.5);
		expect(Math.abs(complement - 180)).toBeLessThan(1.5);
	});

	it("keeps the derived anchor deterministic across calls", () => {
		const a = derive(xtyleDefault, { constraints: { "--bg-0": "#0b0d12", "--fg-0": "#e6e9ef" } });
		const b = derive(xtyleDefault, { constraints: { "--bg-0": "#0b0d12", "--fg-0": "#e6e9ef" } });
		expect(a["--accent"]).toBe(b["--accent"]);
	});

	it("falls back to a sensible hue when the background is achromatic", () => {
		const r = derive(xtyleDefault, { constraints: { "--bg-0": "#101010", "--fg-0": "#f0f0f0" } });
		const a1 = toOklchColor(r["--accent"] as string);
		expect(a1.c).toBeGreaterThan(0.05);
		expect(Number.isFinite(a1.h)).toBe(true);
	});
});

describe("makeXtyleAlgorithm preset accent (flavor authors)", () => {
	const flavorBase = {
		id: "test-flavor",
		knobs: SHARED_KNOBS,
		contrastFloor: 4.7,
		declaredTextOnFillFloor: 4.5,
		defaultVibrancy: 0.5,
		accentChromaMul: 1,
		statusChromaMul: 1,
		paletteChromaMul: 1,
		neutralChroma: 0.01,
		elevationStrengthMul: 1,
		elevationAlphaBoost: 0,
		accentTintChromaMul: 0.3,
	};

	const baked = makeXtyleAlgorithm({
		...flavorBase,
		defaultAnchors: { ...DEFAULT_ANCHORS, accent: "#c026d3" },
	});
	const bare = makeXtyleAlgorithm({ ...flavorBase, defaultAnchors: { ...DEFAULT_ANCHORS } });

	it("honors a baked defaultAnchors.accent exactly as a call-site accent would resolve", () => {
		const fromPreset = derive(baked)["--accent"];
		expect(fromPreset).toBe(derive(bare, { constraints: { "--accent": "#c026d3" } })["--accent"]);
	});

	it("does not bg-derive when the preset bakes an accent", () => {
		expect(derive(baked)["--accent"]).not.toBe(derive(bare)["--accent"]);
	});

	it("lets a call-site accent override the baked preset accent", () => {
		expect(derive(baked, { constraints: { "--accent": "#22c55e" } })["--accent"]).toBe(
			derive(bare, { constraints: { "--accent": "#22c55e" } })["--accent"],
		);
	});

	it("still bg-derives the blessed-four way when no accent is baked or passed", () => {
		const a = toOklchColor(derive(bare)["--accent"] as string);
		expect(a.c).toBeGreaterThan(0.05);
	});
});

describe("accent fan posture", () => {
	const splitComplement = makeXtyleAlgorithm(toPreset({ id: "sc" }));
	const wheel = makeXtyleAlgorithm(toPreset({ id: "wheel", accentStrategy: "step" }));

	it("defaults to fan, byte-identical to no strategy declared", () => {
		const declared = derive(makeXtyleAlgorithm(toPreset({ id: "d", accentStrategy: "fan" })), {});
		expect(declared).toEqual(derive(splitComplement, {}));
	});

	it("the knob overrides the algorithm's taste, and matches the algorithm that ships it", () => {
		// The whole point of the promotion: a theme reshapes the accent family without a new algorithm.
		expect(derive(splitComplement, { knobs: { accentStrategy: "step" } })).toEqual(derive(wheel, {}));
		// and the taste is only a default — an explicit `fan` pulls the step algorithm back to flanks.
		expect(derive(wheel, { knobs: { accentStrategy: "fan" } })).toEqual(derive(splitComplement, {}));
	});

	it("wheel fans evenly, landing -3 near the complement instead of on a near flank", () => {
		const w = accentHues(derive(wheel, {}));
		const sc = accentHues(derive(splitComplement, {}));
		// split-complement: -3 is a near flank of the accent (∓ the split angle)
		expect(Math.abs(hueDelta(sc[0] as number, sc[2] as number))).toBeLessThan(90);
		// wheel: two even steps carry -3 near the accent's complement — a distinct fan shape
		expect(Math.abs(hueDelta(w[0] as number, w[2] as number))).toBeGreaterThan(150);
	});

	it("wheel chains 3 and 4 off a pinned wing, with honest lineage under the pin", () => {
		const opts = { constraints: { "--accent-2": "#22cc55" } };
		const register = derive(wheel, opts);
		// pinning -2 carries the chain: -3 and -4 both shift off it, unlike the default fan.
		expect(register["--accent-3"]).not.toBe(derive(wheel, {})["--accent-3"]);
		// the lineage names what each token reads, and resolving it reproduces the derive exactly.
		const lineage = wheel.lineage(opts);
		const resolved = resolveGraph(lineage);
		for (const t of ["--accent-2", "--accent-3", "--accent-4"]) {
			expect(resolved[t]).toBe(register[t]);
		}
		expect(lineage.find((n) => n.name === "--accent-3")?.refs).toContain("--accent-2");
	});

	const shadeLadder = makeXtyleAlgorithm(toPreset({ id: "sl", accentStrategy: "shade" }));

	it("shade-ladder holds one hue and steps lightness into a tint and two deeper shades", () => {
		const r = derive(shadeLadder, { anchors: { accent: "#6ea8fe" } });
		const [a1, a2, a3, a4] = accentHues(r).map((_, i) =>
			toOklchColor(r[["--accent", "--accent-2", "--accent-3", "--accent-4"][i] as string] as string),
		);
		// every rung sits on the accent's own hue: a shade of one brand color, not a hue harmony
		for (const c of [a2, a3, a4]) expect(Math.abs(hueDelta(a1.h, c.h))).toBeLessThan(4);
		// and the lightnesses spread: a tint above the accent, two shades below it
		expect(a2.l).toBeGreaterThan(a1.l);
		expect(a3.l).toBeLessThan(a1.l);
		expect(a4.l).toBeLessThan(a3.l);
	});

	it("shade-ladder keeps a near-gray accent's fan distinguishable where a hue fan collapses", () => {
		const gray = { anchors: { accent: "#6b7280" } };
		const rungLs = (algo: typeof shadeLadder): number[] =>
			["--accent-2", "--accent-3", "--accent-4"].map(
				(k) => toOklchColor(derive(algo, gray)[k] as string).l,
			);
		const ladder = rungLs(shadeLadder);
		// the ladder spreads its near-gray rungs across lightness, so they stay mutually legible
		expect(Math.max(...ladder) - Math.min(...ladder)).toBeGreaterThan(0.25);
		// the hue fan can't separate what has no chroma: its near-gray rungs huddle at one lightness
		const hueFan = rungLs(splitComplement);
		expect(Math.max(...hueFan) - Math.min(...hueFan)).toBeLessThan(0.1);
	});

	it("shade-ladder rungs read off --accent, hold a pin in isolation, and resolve their lineage", () => {
		const opts = { constraints: { "--accent-3": "#114488" } };
		const register = derive(shadeLadder, opts);
		// each rung derives independently off --accent, so pinning one leaves the others put
		expect(register["--accent-2"]).toBe(derive(shadeLadder, {})["--accent-2"]);
		expect(register["--accent-4"]).toBe(derive(shadeLadder, {})["--accent-4"]);
		expect(register["--accent-3"]).not.toBe(derive(shadeLadder, {})["--accent-3"]);
		const lineage = shadeLadder.lineage(opts);
		const resolved = resolveGraph(lineage);
		for (const t of ["--accent-2", "--accent-3", "--accent-4"]) expect(resolved[t]).toBe(register[t]);
		expect(lineage.find((n) => n.name === "--accent-2")?.refs).toContain("--accent");
	});

	it("shade-ladder passes the full gauntlet: the fan invariant is posture-aware", () => {
		expect(gauntlet(shadeLadder, { runs: 40 }).failures).toEqual([]);
	});

	const duo = makeXtyleAlgorithm(toPreset({ id: "duo", accentStrategy: "duo" }));
	const ACCENTS = ["--accent", "--accent-2", "--accent-3", "--accent-4"] as const;
	const accentColors = (r: TokenRegister): OklchColor[] =>
		ACCENTS.map((t) => toOklchColor(r[t] as string));

	it("duo carries two brand hues: 3 shades the first, 4 shades the second", () => {
		const opts = { anchors: { accent: "#6ea8fe" }, constraints: { "--accent-2": "#f0883e" } };
		const [a1, a2, a3, a4] = accentColors(derive(duo, opts)) as [
			OklchColor,
			OklchColor,
			OklchColor,
			OklchColor,
		];
		// the second anchor is honored verbatim — it is an input here, not a derived flank
		expect(Math.abs(hueDelta(a2.h, toOklchColor("#f0883e").h))).toBeLessThan(1);
		// each shade holds its own brand's hue
		expect(Math.abs(hueDelta(a3.h, a1.h))).toBeLessThan(4);
		expect(Math.abs(hueDelta(a4.h, a2.h))).toBeLessThan(4);
		// and the two brands really are two different hues, not one ladder
		expect(Math.abs(hueDelta(a1.h, a2.h))).toBeGreaterThan(30);
	});

	it("duo's shades land on one lightness, placed off the pair's mean rather than each anchor", () => {
		// The anchors sit at very different lightnesses; a per-anchor ladder would inherit that split.
		const opts = { anchors: { accent: "#20304a" }, constraints: { "--accent-2": "#ffd9a0" } };
		const [a1, a2, a3, a4] = accentColors(derive(duo, opts)) as [
			OklchColor,
			OklchColor,
			OklchColor,
			OklchColor,
		];
		// the shades are a matched pair: one common lightness, so they read as one secondary tier
		expect(Math.abs(a3.l - a4.l)).toBeLessThan(0.01);
		// and that lightness is a step off the *mean* of the anchors, not off either one of them
		const midL = (a1.l + a2.l) / 2;
		expect(Math.abs(Math.abs(a3.l - midL) - 0.16)).toBeLessThan(0.02);
	});

	it("duo with no second brand set falls out of the accent by the fan distance", () => {
		// A duo theme that never picked a second color is still a valid theme — 2 derives like a flank.
		const r = derive(duo, { anchors: { accent: "#6ea8fe" }, knobs: { accentSplit: 45 } });
		const [a1, a2] = accentColors(r) as [OklchColor, OklchColor];
		expect(Math.abs(hueDelta(a1.h, a2.h) - 45)).toBeLessThan(2);
	});

	it("duo reads both anchors into each shade, and its lineage resolves to the derive", () => {
		const opts = { constraints: { "--accent-2": "#f0883e" } };
		const register = derive(duo, opts);
		const lineage = duo.lineage(opts);
		expect(resolveGraph(lineage)).toEqual(register);
		// the mean lightness depends on both brands, so both shades honestly name both
		for (const t of ["--accent-3", "--accent-4"]) {
			const refs = lineage.find((n) => n.name === t)?.refs ?? [];
			expect(refs, `${t} refs`).toContain("--accent");
			expect(refs, `${t} refs`).toContain("--accent-2");
		}
		// and a pinned second brand is an input: a ref-less value node, not a derived one
		expect(lineage.find((n) => n.name === "--accent-2")?.refs ?? []).toEqual([]);
	});

	it("duo passes the full gauntlet", () => {
		expect(gauntlet(duo, { runs: 40 }).failures).toEqual([]);
	});
});
