/**
 * The Day/Night xtyle taste — pure data, no imports (see xtyle-default's preset).
 * `hour` is the extra knob the day/night passes read; the passes themselves are
 * logic, so they live beside this in `passes.ts`, not here.
 */
export const spec = {
	id: "nxi-nite",
	knobs: [
		"scheme",
		"accentShiftStep",
		"accentSplit",
		"contrastBand",
		"vibrancy",
		"typeScale",
		"radiusScale",
		"density",
		"cues",
		"fonts",
		"anchors",
		"hour",
	],
};
