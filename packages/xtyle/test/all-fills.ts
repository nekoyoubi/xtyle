import { loadFill, type FillManifest } from "../src/elements/fragment-host.js";

const sources = import.meta.glob<{ manifest: FillManifest; fragmentSources: Record<string, string> }>(
	"../src/elements/fragments/*/source.generated.ts",
	{ eager: true },
);

/**
 * Loads every built-in fill before a test mounts elements in bulk, so no fill lands after the
 * environment is torn down.
 */
export function loadAllFills(): Promise<unknown> {
	return Promise.all(Object.values(sources).map((m) => loadFill(m.manifest, m.fragmentSources)));
}
