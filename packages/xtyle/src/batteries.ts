import { makeXtyleAlgorithm, makeXtylePipelineAlgorithm, toPreset } from "@xtyle/core/authoring";
import type { Algorithm } from "./types.js";

export { derive, deriveTraced, emit, emitCss, emitJson } from "@xtyle/core";
import { spec as xtyleDefaultSpec } from "../../../algorithms/xtyle-default/src/preset.js";
import { spec as xtyleHcSpec } from "../../../algorithms/xtyle-hc/src/preset.js";
import { spec as xtyleQuietSpec } from "../../../algorithms/xtyle-quiet/src/preset.js";
import { spec as xtyleLoudSpec } from "../../../algorithms/xtyle-loud/src/preset.js";
import { spec as nxiNiteSpec } from "../../../algorithms/nxi-nite/src/preset.js";
import { nxiNitePasses } from "../../../algorithms/nxi-nite/src/passes.js";

export const xtyleDefault: Algorithm = makeXtyleAlgorithm(toPreset(xtyleDefaultSpec));
export const xtyleHc: Algorithm = makeXtyleAlgorithm(toPreset(xtyleHcSpec));
export const xtyleQuiet: Algorithm = makeXtyleAlgorithm(toPreset(xtyleQuietSpec));
export const xtyleLoud: Algorithm = makeXtyleAlgorithm(toPreset(xtyleLoudSpec));
export const nxiNite: Algorithm = makeXtylePipelineAlgorithm(toPreset(nxiNiteSpec), nxiNitePasses);

/**
 * The baked oracle: the blessed algorithms compiled natively, keyed by id. Not the set of algorithms
 * that *exist* — that is whatever is installed, and the host discovers it by scanning. This is the
 * subset that ships a native twin of its mod, kept byte-identical to it, so a caller can derive
 * synchronously and the suite has something to prove the sandboxed mod against.
 */
export const bakedAlgorithms: Record<string, Algorithm> = {
	[xtyleDefault.id]: xtyleDefault,
	[xtyleHc.id]: xtyleHc,
	[xtyleQuiet.id]: xtyleQuiet,
	[xtyleLoud.id]: xtyleLoud,
	[nxiNite.id]: nxiNite,
};

/** The baked twin of an algorithm. Throws for any algorithm that has none — most do not; see {@link bakedAlgorithms}. */
export function getAlgorithm(id: string): Algorithm {
	const algorithm = bakedAlgorithms[id];
	if (!algorithm) {
		throw new Error(
			`xtyle: no baked algorithm "${id}" (baked: ${Object.keys(bakedAlgorithms).join(", ")})`,
		);
	}
	return algorithm;
}

import { resolveBundledAlgorithm, snapshotBundledAlgorithm } from "@xtyle/core/host/bundle";

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
	const baked = getAlgorithm(id);
	void resolveBundledAlgorithm(id).catch((error) => {
		if (warnedResolveFailures.has(id)) return;
		warnedResolveFailures.add(id);
		console.warn(`xtyle: hosted mod "${id}" failed to resolve; deriving through the baked oracle.`, error);
	});
	return baked;
}
