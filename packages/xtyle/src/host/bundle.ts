import type { Algorithm } from "../types.js";
import {
	loadAlgorithm,
	railFor,
	staticAlgorithmManifest,
	type AlgorithmManifest,
	type ResolveAlgorithmOptions,
} from "./index.js";
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
 * What a bundled algorithm declares about itself — produced tokens, knobs and their domains, invariant
 * count, pass names — read off the embedded mod manifest with no sandbox boot. `null` for a bundle
 * whose mod ships no static block. The filesystem-free twin of {@link ./registry}.`algorithmManifest`.
 */
export function bundledAlgorithmManifest(id: string): AlgorithmManifest | null {
	const bundle = ALGORITHM_BUNDLES[id];
	return bundle ? staticAlgorithmManifest(bundle.manifest) : null;
}

/**
 * Resolve a blessed algorithm from its embedded bundle through the zero-authority sandbox, no `node:fs`.
 * The canonical hosted path for a filesystem-free environment (the browser); the disk-reading
 * {@link ./registry}.`resolveInstalledAlgorithm` is the Node twin, and both run the same mod through the same
 * `loadAlgorithm`, so the gauntlet's byte-identical guarantee covers this path too. Cached per id
 * (and per rail; see `HARNESS_TIMEOUT_MS`).
 */
export function resolveBundledAlgorithm(id: string, options: ResolveAlgorithmOptions = {}): Promise<Algorithm> {
	const timeoutMs = railFor(options.timeoutMs);
	// Keyed on the clamped rail for the same reason the Node twin is: a cache keyed on id alone hands
	// a harness whichever instance a production caller warmed first, so the raise silently does nothing.
	const key = timeoutMs === undefined ? id : `${id}@${timeoutMs}`;
	const cached = cache.get(key);
	if (cached) return cached;

	const bundle = ALGORITHM_BUNDLES[id];
	if (!bundle) {
		return Promise.reject(
			new Error(`xtyle: no bundled mod for algorithm "${id}" (have: ${Object.keys(ALGORITHM_BUNDLES).join(", ")})`),
		);
	}

	const loaded = loadAlgorithm(bundle.manifest, bundle.source, { timeoutMs }).then((algorithm) => {
		// `resolved` is the synchronous first-paint oracle, which wants the default-railed instance;
		// the derivation is identical either way, so a harness load never displaces it.
		if (timeoutMs === undefined) resolved.set(id, algorithm);
		return algorithm;
	});
	cache.set(key, loaded);
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
