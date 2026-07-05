import type { Algorithm } from "@xtyle/core";
import { resolveBundledAlgorithm, bundledAlgorithms } from "@xtyle/core/host/bundle";

let loadPromise: Promise<Map<string, Algorithm>> | undefined;

/**
 * Loads every bench algorithm as a hosted xript mod in the browser through the portable core resolver
 * (`@xtyle/core/host/bundle`), which embeds each blessed mod so no bundler-specific import is needed. The
 * QuickJS WASM runtime is fetched once; each algorithm gets its own runtime. Resolves to a map keyed by
 * algorithm id. Memoized so island remounts reuse the single in-browser runtime set.
 */
export function loadHostedAlgorithms(): Promise<Map<string, Algorithm>> {
	if (!loadPromise) {
		loadPromise = (async () => {
			const entries = await Promise.all(
				bundledAlgorithms().map(async (id) => [id, await resolveBundledAlgorithm(id)] as const),
			);
			return new Map(entries);
		})();
	}
	return loadPromise;
}
