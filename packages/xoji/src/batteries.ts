import { makeXojiAlgorithm, makeXojiPipelineAlgorithm, toPreset } from "@xoji/core/authoring";
import type { Algorithm } from "./types.js";

// The pure-derive path, re-exported so an embedder reaches the whole thing through one import:
// `import { derive, getAlgorithm, emitCss } from "@xoji/core/algorithms"`. The neutral `@xoji/core`
// index can't host `getAlgorithm` itself (this module imports the blessed mod presets from the
// sibling `algorithms/` workspace, outside the core's tsc rootDir, so it is bundled separately);
// re-exporting the engine here meets the embedder on the batteries surface instead. `@xoji/core`
// stays external in the bundle, so this is a reference, not a second copy of the engine.
export { derive, deriveTraced, emit, emitCss, emitJson } from "@xoji/core";
import { spec as xojiDefaultSpec } from "../../../algorithms/xoji-default/src/preset.js";
import { spec as xojiHcSpec } from "../../../algorithms/xoji-hc/src/preset.js";
import { spec as xojiQuietSpec } from "../../../algorithms/xoji-quiet/src/preset.js";
import { spec as xojiLoudSpec } from "../../../algorithms/xoji-loud/src/preset.js";
import { spec as nxiNiteSpec } from "../../../algorithms/nxi-nite/src/preset.js";
import { nxiNitePasses } from "../../../algorithms/nxi-nite/src/passes.js";

export const xojiDefault: Algorithm = makeXojiAlgorithm(toPreset(xojiDefaultSpec));
export const xojiHc: Algorithm = makeXojiAlgorithm(toPreset(xojiHcSpec));
export const xojiQuiet: Algorithm = makeXojiAlgorithm(toPreset(xojiQuietSpec));
export const xojiLoud: Algorithm = makeXojiAlgorithm(toPreset(xojiLoudSpec));
export const nxiNite: Algorithm = makeXojiPipelineAlgorithm(toPreset(nxiNiteSpec), nxiNitePasses);

export const algorithms: Record<string, Algorithm> = {
	[xojiDefault.id]: xojiDefault,
	[xojiHc.id]: xojiHc,
	[xojiQuiet.id]: xojiQuiet,
	[xojiLoud.id]: xojiLoud,
	[nxiNite.id]: nxiNite,
};

export function getAlgorithm(id: string): Algorithm {
	const algorithm = algorithms[id];
	if (!algorithm) {
		throw new Error(
			`xoji: unknown algorithm "${id}" (known: ${Object.keys(algorithms).join(", ")})`,
		);
	}
	return algorithm;
}
