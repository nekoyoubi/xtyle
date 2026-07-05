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

// The canonical resolution path on the importable/browser surface: loads the algorithm's shipped
// xript mod from the embedded bundle and runs it through the zero-authority sandbox, so a plain
// `import { resolveAlgorithm } from "@xoji/core/algorithms"` derives through the *same* mod the CLI
// and site do, not a baked copy. `getAlgorithm` above stays the synchronous baked oracle
// (byte-identical to the mod) and the first-paint fallback for the window before `resolveAlgorithm`
// settles; `snapshotAlgorithm` reads the resolved mod synchronously once it has. Imported from the
// external `@xoji/core/host/bundle` and re-exported so `hostedAlgorithm` can call them directly while
// this surfaces the one shipped resolver, not a second copy.
import { resolveBundledAlgorithm, snapshotBundledAlgorithm } from "@xoji/core/host/bundle";

export {
	resolveBundledAlgorithm as resolveAlgorithm,
	snapshotBundledAlgorithm as snapshotAlgorithm,
};

/**
 * The synchronous accessor a caller reaches for instead of `getAlgorithm` to make the canonical
 * sandboxed mod the thing that derives. Returns the resolved hosted mod once its cache is warm; on
 * the cold first call it kicks off the hosted resolve and returns the byte-identical baked oracle to
 * bridge the async load, so a synchronous path (a framework reactive computation, a first paint) is
 * canonical from the next call on with no await. Baked and hosted derive identically, so the handover
 * is invisible. An unknown id throws, same as `getAlgorithm`.
 */
const warnedResolveFailures = new Set<string>();

export function hostedAlgorithm(id: string): Algorithm {
	const snapshot = snapshotBundledAlgorithm(id);
	if (snapshot) return snapshot;
	// Resolve the baked oracle first: it throws on an unknown id, gating the resolve so a bad id
	// never spins up a doomed sandbox load.
	const baked = getAlgorithm(id);
	void resolveBundledAlgorithm(id).catch((error) => {
		if (warnedResolveFailures.has(id)) return;
		warnedResolveFailures.add(id);
		// Warn once per id: without this a failed hosted resolve degrades to baked-forever silently,
		// the exact invisible fallback this accessor exists to remove.
		console.warn(`xoji: hosted mod "${id}" failed to resolve; deriving through the baked oracle.`, error);
	});
	return baked;
}
