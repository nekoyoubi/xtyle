import type { Algorithm } from "../types.js";
import { loadAlgorithm } from "./index.js";
import { ALGORITHM_BUNDLES } from "./algorithms-bundle.generated.js";

/**
 * A blessed algorithm's xript mod as importable data: its manifest plus the bundled `mod.js` source.
 * The filesystem-free twin of the mod files {@link ./registry} reads off disk, so a browser (or any
 * bundler-free consumer) can resolve the canonical hosted mod without `node:fs`.
 */
export interface AlgorithmBundle {
	manifest: unknown;
	source: string;
}

const cache = new Map<string, Promise<Algorithm>>();
const resolved = new Map<string, Algorithm>();

/** The ids resolvable from the embedded bundle (no filesystem). */
export function bundledAlgorithms(): string[] {
	return Object.keys(ALGORITHM_BUNDLES);
}

/**
 * Resolve a blessed algorithm from its embedded bundle through the zero-authority sandbox, no `node:fs`.
 * The canonical hosted path for a filesystem-free environment (the browser); the disk-reading
 * {@link ./registry}.`resolveAlgorithm` is the Node twin, and both run the same mod through the same
 * `loadAlgorithm`, so the gauntlet's byte-identical guarantee covers this path too. Cached per id.
 */
export function resolveBundledAlgorithm(id: string): Promise<Algorithm> {
	const cached = cache.get(id);
	if (cached) return cached;

	const bundle = ALGORITHM_BUNDLES[id];
	if (!bundle) {
		return Promise.reject(
			new Error(`xtyle: no bundled mod for algorithm "${id}" (have: ${Object.keys(ALGORITHM_BUNDLES).join(", ")})`),
		);
	}

	const loaded = loadAlgorithm(bundle.manifest, bundle.source).then((algorithm) => {
		resolved.set(id, algorithm);
		return algorithm;
	});
	cache.set(id, loaded);
	return loaded;
}

/**
 * Synchronous accessor for an already-resolved bundled mod, else `null` — the browser first-paint seam.
 * Warm the cache with {@link resolveBundledAlgorithm}, then read the canonical mod here without awaiting;
 * mirrors {@link ./registry}.`snapshotAlgorithm` for the filesystem-free path.
 */
export function snapshotBundledAlgorithm(id: string): Algorithm | null {
	return resolved.get(id) ?? null;
}
