import type { Algorithm, KnobSpec } from "./types.js";

// `batteries.ts` (the baked algorithms) is bundled separately because it imports preset
// sources outside this package's rootDir; a runtime dynamic import via a computed specifier
// loads the bundled output without pulling it into the tsc program.
export async function bakedAlgorithm(id: string): Promise<Algorithm> {
	const specifier = "./batteries.js";
	const mod = (await import(specifier)) as { getAlgorithm(id: string): Algorithm };
	return mod.getAlgorithm(id);
}

export interface AlgorithmDomain {
	id: string;
	knobs: string[];
	knobSpecs: KnobSpec[];
}

/**
 * The knob domain of a set of algorithms, off the baked build rather than the sandboxed mod. Backs
 * `xtyle knobs`, `xtyle_list_algorithms`, and any other discovery surface: these are read before a
 * caller has picked knob values, so booting QuickJS per algorithm to report a static domain would
 * make the cheapest call the slowest one. Both facades resolve `knobSpecs` through the same
 * `resolveKnobSpecs`, so the domain is identical either way.
 */
export async function algorithmDomains(ids: readonly string[]): Promise<AlgorithmDomain[]> {
	// The baked build is the fast path, not a requirement: an algorithm that resolves but has no baked
	// twin — the first third-party one to be resolvable will be exactly that — degrades to the sandbox
	// rather than taking discovery down with it. Slower for that algorithm, correct for all of them.
	const { resolveAlgorithm } = await import("./host/registry.js");
	return Promise.all(
		ids.map(async (id) => {
			const algorithm = await bakedAlgorithm(id).catch(() => resolveAlgorithm(id));
			return { id, knobs: algorithm.knobs, knobSpecs: algorithm.knobSpecs };
		}),
	);
}
