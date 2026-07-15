import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, parse } from "node:path";
import { fileURLToPath } from "node:url";
import type { Algorithm } from "../types.js";
import { entryScriptKey, loadAlgorithm, staticAlgorithmManifest, type AlgorithmManifest } from "./index.js";

/** One algorithm mod on disk: what it is, and where its manifest and entry script live. */
export interface AlgorithmMod {
	/** The algorithm id — the mod manifest's `name`, which is what a theme file records. */
	id: string;
	/** The directory the mod lives in. Names it, never identifies it. */
	dir: string;
	manifest: unknown;
	sourcePath: string;
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

/**
 * Every algorithm mod in a directory, discovered rather than listed — a mod is a subdirectory with a
 * `mod-manifest.json` and the entry script that manifest names.
 *
 * A hand-kept allow-list here would be a fourth copy of a list the build scripts already derive by
 * scanning, and the browser bundle *is* scan-derived — so a curated Node list means a sixth algorithm
 * that resolves in the browser and does not exist to the CLI.
 *
 * A mod is keyed by the `name` its manifest declares, not by the directory it happens to sit in: that
 * name is what `Algorithm.id` carries, what a theme file's `algorithm` field records, and what every
 * cache is keyed on. The directory is a filesystem detail; the manifest name is the identity, and a
 * mod whose two disagree is resolved (and warned about) under its name.
 */
export function discoverAlgorithmMods(root: string): Map<string, AlgorithmMod> {
	const found = new Map<string, AlgorithmMod>();
	for (const dirent of readdirSync(root, { withFileTypes: true })) {
		if (!dirent.isDirectory()) continue;
		const manifestPath = join(root, dirent.name, "mod-manifest.json");
		if (!existsSync(manifestPath)) continue;

		const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as { name?: string };
		const id = manifest.name;
		if (!id) {
			throw new Error(`xtyle: ${dirent.name}/mod-manifest.json declares no name, so the mod has no id`);
		}

		const sourcePath = join(root, dirent.name, entryScriptKey(manifest));
		if (!existsSync(sourcePath)) continue;

		const clash = found.get(id);
		if (clash) {
			throw new Error(
				`xtyle: two mods claim the algorithm id "${id}" (${clash.dir} and ${dirent.name}); ` +
					"an id is the manifest name, and it must be unique",
			);
		}
		if (id !== dirent.name) {
			console.warn(
				`xtyle: algorithm "${id}" lives in ${dirent.name}/; the manifest name is the id, and the directory is ignored`,
			);
		}
		found.set(id, { id, dir: dirent.name, manifest, sourcePath });
	}
	return found;
}

let entries: Map<string, AlgorithmMod> | undefined;

function mods(): Map<string, AlgorithmMod> {
	if (!entries) entries = discoverAlgorithmMods(algorithmsDir());
	return entries;
}

/** The ids of the mods the host can resolve, the default first, then the rest alphabetically. */
export function availableAlgorithms(): string[] {
	const ids = [...mods().keys()].sort();
	const dflt = defaultAlgorithm();
	return ids.includes(dflt) ? [dflt, ...ids.filter((id) => id !== dflt)] : ids;
}

/**
 * What an algorithm declares about itself — produced tokens, knobs and their domains, invariant count,
 * pass names — read straight off the packaged mod manifest, with no sandbox boot. `null` for a mod that
 * ships no static block, which can then only be read by running it (see `resolveAlgorithm`).
 *
 * This is the discovery seam: listing what a pack accepts is the cheapest question a consumer asks, and
 * it should not be the one that costs a QuickJS runtime per algorithm.
 */
export function algorithmManifest(id: string): AlgorithmManifest | null {
	const entry = mods().get(id);
	return entry ? staticAlgorithmManifest(entry.manifest) : null;
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
 * from `algorithms/`, runs it through the zero-authority sandbox, and returns an
 * `Algorithm`. Cached per id (and per rail; see {@link HARNESS_TIMEOUT_MS}). This
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

	const entry = mods().get(id);
	if (!entry) {
		return Promise.reject(
			new Error(`xtyle: no hosted mod for algorithm "${id}" (have: ${availableAlgorithms().join(", ")})`),
		);
	}

	const source = readFileSync(entry.sourcePath, "utf8");

	const loaded = loadAlgorithm(entry.manifest, source, { timeoutMs }).then((algorithm) => {
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
