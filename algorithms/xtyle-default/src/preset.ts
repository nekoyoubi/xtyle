/**
 * The neutral default xtyle taste — pure data, no imports, so both the mod
 * (sibling `mod.ts`) and the engine's batteries bundle read one source.
 * Every value here is a `defineXtyleAlgorithm` spec field; absent fields take
 * the shared xtyle defaults.
 */
export const spec = {
	id: "xtyle-default",
	anchors: { accent: "#3ad6f8" },
	anchorsByScheme: { light: { bg: "#e6e9ef", fg: "#1b1d22", accent: "#0096b1" } },
};
