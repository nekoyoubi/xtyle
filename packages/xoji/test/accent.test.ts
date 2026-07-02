import { describe, expect, it } from "vitest";
import {
	DEFAULT_ANCHORS,
	SHARED_KNOBS,
	derive,
	hueDelta,
	makeXojiAlgorithm,
	toOklchColor,
} from "../src/index.js";
import { xojiDefault } from "../src/batteries.js";

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

describe("xoji-default accent ramp", () => {
	it("flanks the accent at ∓half the step and complements at 180 off a chromatic accent", () => {
		const r = derive(xojiDefault, { constraints: { "--accent": "#ff0000" } });
		const { under, over, complement } = splitDeltas(accentHues(r));
		expect(under).toBeCloseTo(-DEFAULT_STEP / 2, 0);
		expect(over).toBeCloseTo(DEFAULT_STEP / 2, 0);
		expect(complement).toBeCloseTo(180, 0);
	});

	it("narrows the wings with the accentSplit knob, holding the 180 complement", () => {
		const r = derive(xojiDefault, {
			constraints: { "--accent": "#ff0000" },
			knobs: { accentSplit: 30 },
		});
		const { under, over, complement } = splitDeltas(accentHues(r));
		expect(under).toBeCloseTo(-30, 0);
		expect(over).toBeCloseTo(30, 0);
		expect(complement).toBeCloseTo(180, 0);
	});

	it("mirrors a pinned --accent-2 into the opposing wing, holding the 180 complement", () => {
		const r = derive(xojiDefault, {
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
		const r = derive(xojiDefault, {
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
		const r = derive(xojiDefault, { constraints: { "--bg-0": "#0b0d12", "--fg-0": "#e6e9ef" } });
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
		const a = derive(xojiDefault, { constraints: { "--bg-0": "#0b0d12", "--fg-0": "#e6e9ef" } });
		const b = derive(xojiDefault, { constraints: { "--bg-0": "#0b0d12", "--fg-0": "#e6e9ef" } });
		expect(a["--accent"]).toBe(b["--accent"]);
	});

	it("falls back to a sensible hue when the background is achromatic", () => {
		const r = derive(xojiDefault, { constraints: { "--bg-0": "#101010", "--fg-0": "#f0f0f0" } });
		const a1 = toOklchColor(r["--accent"] as string);
		expect(a1.c).toBeGreaterThan(0.05);
		expect(Number.isFinite(a1.h)).toBe(true);
	});
});

describe("makeXojiAlgorithm preset accent (flavor authors)", () => {
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

	const baked = makeXojiAlgorithm({
		...flavorBase,
		defaultAnchors: { ...DEFAULT_ANCHORS, accent: "#c026d3" },
	});
	const bare = makeXojiAlgorithm({ ...flavorBase, defaultAnchors: { ...DEFAULT_ANCHORS } });

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
