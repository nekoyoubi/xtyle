/**
 * The Day/Night xtyle taste — pure data, no imports (see xtyle-default's preset).
 * `hour` is the extra knob the day/night passes read; the passes themselves are
 * logic, so they live beside this in `passes.ts`, not here.
 */

/** The hour the day/night passes assume when the knob is unset — noon, the middle of the arc. */
export const DEFAULT_HOUR = 12;

export const spec = {
	id: "nxi-nite",
	knobs: [
		"scheme",
		"accentStrategy",
		"accentShiftStep",
		"accentSplit",
		"contrastBand",
		"vibrancy",
		"typeScale",
		"radiusScale",
		"surfaceRamp",
		"density",
		"cues",
		"fonts",
		"anchors",
		"hour",
	],
	/**
	 * `hour` is nxi-nite's alone — no other algorithm has an opinion about the time of day — so its
	 * domain is declared here rather than in the engine's shared registry. This is the novel-knob path
	 * the `knobSpecs` contract exists for: a consumer renders the control straight from this
	 * declaration, with nothing about `hour` hardcoded anywhere downstream.
	 */
	knobSpecs: [{ name: "hour", kind: "range" as const, label: "Hour", min: 0, max: 24, step: 1, default: DEFAULT_HOUR }],
};
