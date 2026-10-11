import { describe, expect, it } from "vitest";
import { toPreset } from "../src/authoring.js";
import {
	makeXtyleAlgorithm,
	makeXtylePipelineAlgorithm,
	PRESET_DEFAULTS,
	resolvePreset,
	settlePass,
} from "../src/index.js";
import type { PresetInput } from "../src/index.js";

const brandPreset: PresetInput = {
	id: "probe-brand",
	defaultAnchors: { bg: "#0d0a0a", fg: "#f4eeea", accent: "#e2071c" },
	contrastFloor: 4.7,
	declaredTextOnFillFloor: 4.5,
	defaultVibrancy: 0.92,
	accentChromaMul: 1.4,
	statusChromaMul: 1.5,
	paletteChromaMul: 1.55,
	neutralChroma: 0.012,
	elevationStrengthMul: 1.5,
	elevationAlphaBoost: 0.14,
	accentTintChromaMul: 0.6,
};

describe("a preset states its taste and inherits the rest", () => {
	it("builds an algorithm from a literal that omits the declared floors", () => {
		const algorithm = makeXtyleAlgorithm(brandPreset);
		const register = algorithm.derive({});

		expect(algorithm.id).toBe("probe-brand");
		expect(register["--bg-0"]).toBeTruthy();
		expect(register["--ring"]).toBeTruthy();
	});

	it("declares the default focus-ring floor when the preset names none", () => {
		expect(makeXtyleAlgorithm(brandPreset).declares?.focusRingFloor).toBe(
			PRESET_DEFAULTS.declaredFocusRingFloor,
		);
	});

	it("keeps a stated floor over the default", () => {
		const stated = makeXtyleAlgorithm({ ...brandPreset, declaredFocusRingFloor: 4.5 });
		expect(stated.declares?.focusRingFloor).toBe(4.5);
	});

	it("takes the default for a field stated as undefined, so nothing derives from NaN", () => {
		const resolved = resolvePreset({ ...brandPreset, declaredFocusRingFloor: undefined });
		expect(resolved.declaredFocusRingFloor).toBe(PRESET_DEFAULTS.declaredFocusRingFloor);
		expect(Number.isFinite(resolved.declaredFocusRingFloor)).toBe(true);
	});

	it("fills every field a derivation reads from an id alone", () => {
		const resolved = resolvePreset({ id: "probe-bare" });
		const unset = Object.entries(PRESET_DEFAULTS).filter(
			([key]) => resolved[key as keyof typeof PRESET_DEFAULTS] === undefined,
		);

		expect(unset, `unfilled: ${unset.map(([key]) => key).join(", ")}`).toEqual([]);
		expect(resolved.knobs).toEqual(PRESET_DEFAULTS.knobs);
		expect(resolved.defaultAnchors).toEqual(PRESET_DEFAULTS.defaultAnchors);
	});

	it("resolves the same floors as the spec tier, so the two surfaces cannot drift", () => {
		const raw = resolvePreset({ id: "probe-tier" });
		const spec = toPreset({ id: "probe-tier" });

		expect(raw.contrastFloor).toBe(spec.contrastFloor);
		expect(raw.declaredTextOnFillFloor).toBe(spec.declaredTextOnFillFloor);
		expect(raw.declaredFocusRingFloor).toBe(spec.declaredFocusRingFloor);
		expect(raw.defaultVibrancy).toBe(spec.defaultVibrancy);
		expect(raw.accentTintChromaMul).toBe(spec.accentTintChromaMul);
	});

	it("resolves the pipeline entry point the same way", () => {
		const algorithm = makeXtylePipelineAlgorithm(brandPreset, (preset, opts) => [
			settlePass(preset, opts),
		]);

		expect(algorithm.declares?.focusRingFloor).toBe(PRESET_DEFAULTS.declaredFocusRingFloor);
		expect(algorithm.derive({})["--ring"]).toBeTruthy();
	});
});
