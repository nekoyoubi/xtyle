import { existsSync, readFileSync } from "node:fs";
import { dirname, join, parse } from "node:path";
import { fileURLToPath } from "node:url";
import type { Algorithm } from "../types.js";
import { loadAlgorithm } from "./index.js";

const MOD_DIRS: Record<string, string> = {
	"xtyle-default": "xtyle-default",
	"xtyle-hc": "xtyle-hc",
	"xtyle-quiet": "xtyle-quiet",
	"xtyle-loud": "xtyle-loud",
	"nxi-nite": "nxi-nite",
};

/** The ids of the bundled mods the host can resolve. */
export function availableAlgorithms(): string[] {
	return Object.keys(MOD_DIRS);
}

/**
 * Walks up from this module toward the filesystem root looking for the sibling
 * `algorithms/` directory that holds the mods. A fixed relative offset breaks the
 * moment a consumer bundles this file to a different depth (the site's SSR build
 * does exactly that), so the directory is discovered by marker instead.
 */
function findAlgorithmsRoot(): string {
	let dir = dirname(fileURLToPath(import.meta.url));
	const { root } = parse(dir);
	while (true) {
		const candidate = join(dir, "algorithms");
		if (existsSync(join(candidate, "xtyle-default", "mod-manifest.json"))) {
			return candidate;
		}
		if (dir === root) break;
		dir = dirname(dir);
	}
	throw new Error("xtyle: could not locate the algorithms/ directory");
}

let algorithmsRoot: string | undefined;

function algorithmsDir(): string {
	if (!algorithmsRoot) algorithmsRoot = findAlgorithmsRoot();
	return algorithmsRoot;
}

const cache = new Map<string, Promise<Algorithm>>();
const resolved = new Map<string, Algorithm>();

/**
 * The rail a *correctness harness* loads a mod under, as opposed to the production rail the host
 * manifest declares.
 *
 * `limits.timeout_ms` (5s) is an anti-runaway rail: it exists so a mod with an infinite loop cannot
 * hang the browser generator, and it must stay tight for that. But it is not a performance budget,
 * and a single interpreted derivation against a hostile seed already runs ~3s — so a battery that
 * sweeps hundreds of adversarial seeds through the sandbox trips the rail on the slowest of them and
 * reports an interrupt that says nothing about the algorithm. The harness raises the rail for itself
 * rather than every consumer paying for it: a gauntlet run is developer-supervised and bounded by the
 * suite, so the runaway case it guards against is already covered by the person watching it.
 */
export const HARNESS_TIMEOUT_MS = 60_000;

export interface ResolveAlgorithmOptions {
	/**
	 * Raise the sandbox's wall-clock rail, up to {@link HARNESS_TIMEOUT_MS}. Only a correctness harness
	 * should reach for this; a request above the ceiling is clamped to it rather than honored.
	 *
	 * This is a patience dial, not a confinement boundary: it governs how long the host waits before
	 * killing a mod that is spinning, and touches nothing else. The memory and stack limits hold, and
	 * the capability set a mod runs under (`color-math`, and a no-op `log`) is fixed and never
	 * parameterized — so a longer rail grants a mod no authority it did not already have.
	 */
	timeoutMs?: number;
}

/**
 * The rail a load actually runs under. Clamped to {@link HARNESS_TIMEOUT_MS} so the ceiling is a real
 * bound rather than a suggestion a doc comment makes: the anti-runaway guarantee survives whatever a
 * caller asks for, and the mod cache cannot be grown without limit by varying the rail (it is part of
 * the cache key, so an unbounded rail means an unbounded number of QuickJS runtimes).
 */
function railFor(timeoutMs: number | undefined): number | undefined {
	return timeoutMs === undefined ? undefined : Math.min(timeoutMs, HARNESS_TIMEOUT_MS);
}

/**
 * Resolves an algorithm by id to its host facade: loads the algorithm's xript mod
 * from `algorithms/<id>/`, runs it through the zero-authority sandbox, and returns
 * an `Algorithm`. Cached per id (and per rail; see {@link HARNESS_TIMEOUT_MS}). This
 * is the canonical resolution path — the whole CLI (`derive` / `coverage` / `gauntlet`)
 * and the site's SSR derive through it, so the gauntlet proves the sandboxed mod that
 * ships, not a baked copy. The baked `getAlgorithm` registry from `@xtyle/core/algorithms`
 * remains as the byte-identical test oracle and as the synchronous first-paint fallback
 * in the browser, where the async mod load may not have completed yet.
 */
export function resolveAlgorithm(id: string, options: ResolveAlgorithmOptions = {}): Promise<Algorithm> {
	const timeoutMs = railFor(options.timeoutMs);
	// The rail is part of the identity of the loaded mod: a cache keyed on id alone would hand a
	// harness the 5s-railed instance that a production caller warmed first, and the raise would silently
	// do nothing. Keyed on the *clamped* rail, so the space is {default, harness} and no larger.
	const key = timeoutMs === undefined ? id : `${id}@${timeoutMs}`;
	const cached = cache.get(key);
	if (cached) return cached;

	const dir = MOD_DIRS[id];
	if (!dir) {
		return Promise.reject(
			new Error(`xtyle: no hosted mod for algorithm "${id}" (have: ${Object.keys(MOD_DIRS).join(", ")})`),
		);
	}

	const modDir = join(algorithmsDir(), dir);
	const modManifest = JSON.parse(readFileSync(join(modDir, "mod-manifest.json"), "utf8"));
	const source = readFileSync(join(modDir, "src/mod.js"), "utf8");

	const loaded = loadAlgorithm(modManifest, source, { timeoutMs }).then((algorithm) => {
		// `resolved` is the synchronous first-paint oracle, which wants the mod under whatever rail it
		// was loaded with — the derivation is identical either way, so the default keeps its slot.
		if (timeoutMs === undefined) resolved.set(id, algorithm);
		return algorithm;
	});
	cache.set(key, loaded);
	return loaded;
}

/** The algorithm an id-less caller derives with. One literal, rather than a `"xtyle-default"` in every consumer. */
export function defaultAlgorithm(): string {
	return "xtyle-default";
}

/**
 * Synchronous accessor for an already-resolved mod: returns the cached `Algorithm`
 * once `resolveAlgorithm(id)` has settled, else `null`. The hosted resolution is
 * async (the sandbox load), but a synchronous caller — a framework reactive
 * computation, a first-paint path — can warm the cache with `resolveAlgorithm`,
 * then read the canonical mod here without awaiting, falling back only for the
 * window before the load lands.
 */
export function snapshotAlgorithm(id: string): Algorithm | null {
	return resolved.get(id) ?? null;
}

