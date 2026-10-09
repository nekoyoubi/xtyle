import type { Algorithm } from "../types.js";
import { bundledAlgorithmManifest, bundledAlgorithms, resolveBundledAlgorithm } from "./bundle.js";
import type { AlgorithmManifest, ResolveAlgorithmOptions } from "./index.js";
import { algorithmManifest, availableAlgorithms, defaultAlgorithm, resolveInstalledAlgorithm } from "./registry.js";

export function catalogAlgorithms(): string[] {
	const ids = [...new Set([...availableAlgorithms(), ...bundledAlgorithms()])].sort();
	const dflt = defaultAlgorithm();
	return ids.includes(dflt) ? [dflt, ...ids.filter((id) => id !== dflt)] : ids;
}

export function catalogManifest(id: string): AlgorithmManifest | null {
	return availableAlgorithms().includes(id) ? algorithmManifest(id) : bundledAlgorithmManifest(id);
}

export function resolveCatalogAlgorithm(id: string, options: ResolveAlgorithmOptions = {}): Promise<Algorithm> {
	if (availableAlgorithms().includes(id)) return resolveInstalledAlgorithm(id, options);
	if (bundledAlgorithms().includes(id)) return resolveBundledAlgorithm(id, options);
	return Promise.reject(
		new Error(
			`xtyle: no algorithm "${id}" (available: ${catalogAlgorithms().join(", ")}). ` +
				"`xtyle search` finds published packs, and `xtyle add <pack>` installs one.",
		),
	);
}
