import { resolveKnobSpecs } from "./algorithms/factory.js";
import type { Algorithm, KnobSpec } from "./types.js";

// `batteries.ts` (the baked algorithms) is bundled separately because it imports preset
// sources outside this package's rootDir; a runtime dynamic import via a computed specifier
// loads the bundled output without pulling it into the tsc program.
async function bakedOracle(id: string): Promise<Algorithm> {
	const specifier = "./batteries.js";
	const mod = (await import(specifier)) as { getAlgorithm(id: string): Algorithm };
	return mod.getAlgorithm(id);
}

/**
 * An algorithm through the fastest path that can produce it: the natively-compiled baked twin when one
 * exists, else the shipped mod through the sandbox. Only the blessed set has a baked twin, and the
 * baked and hosted paths are proven byte-identical, so this is a speed choice and never a behavior one
 * — an installed third-party pack derives here exactly as it does anywhere else, just slower.
 */
export async function bakedAlgorithm(id: string): Promise<Algorithm> {
	try {
		return await bakedOracle(id);
	} catch {
		const { resolveAlgorithm } = await import("./host/registry.js");
		return resolveAlgorithm(id);
	}
}

export interface AlgorithmDomain {
	id: string;
	knobs: string[];
	knobSpecs: KnobSpec[];
}

/**
 * The knob domain of a set of algorithms. Backs `xtyle knobs`, `xtyle_list_algorithms`, and any other
 * discovery surface: these are read before a caller has picked knob values, so *executing* an algorithm
 * to report a static domain would make the cheapest call the most expensive one.
 *
 * The mod's own static manifest block answers it without running anything, for a third-party pack as
 * readily as a blessed one. A mod that ships no block falls back to execution — the baked twin if it
 * has one, else the sandbox — so an algorithm that never declared a block still lists, just slowly.
 * Every path resolves `knobSpecs` through the same `resolveKnobSpecs`, so the domain is identical
 * whichever one answered.
 */
export async function algorithmDomains(ids: readonly string[]): Promise<AlgorithmDomain[]> {
	const { algorithmManifest } = await import("./host/registry.js");
	return Promise.all(
		ids.map(async (id) => {
			const declared = algorithmManifest(id);
			if (declared) {
				return { id, knobs: declared.knobs, knobSpecs: resolveKnobSpecs(declared.knobs, declared.knobSpecs ?? []) };
			}
			const algorithm = await bakedAlgorithm(id);
			return { id, knobs: algorithm.knobs, knobSpecs: algorithm.knobSpecs };
		}),
	);
}
