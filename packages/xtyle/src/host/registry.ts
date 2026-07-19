import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, parse } from "node:path";
import { fileURLToPath } from "node:url";
import type { Algorithm } from "../types.js";
import {
	entryScriptKey,
	HARNESS_TIMEOUT_MS,
	loadAlgorithm,
	railFor,
	staticAlgorithmManifest,
	type AlgorithmManifest,
	type ResolveAlgorithmOptions,
} from "./index.js";

// The rail vocabulary is shared with the filesystem-free resolver, so it is defined beside
// `loadAlgorithm` and re-exported here for the callers that have always imported it from this module.
export { HARNESS_TIMEOUT_MS, type ResolveAlgorithmOptions };

/**
 * The pointer every error here hands the caller, because the two resolvers share a name and only one
 * of them needs a filesystem.
 */
const FILESYSTEM_FREE_PATH = '`import { resolveAlgorithm } from "@xtyle/core/algorithms"`';

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
 *
 * `null` when there is no such directory, which is the normal case for anyone who installed
 * `@xtyle/core` from npm: `algorithms/` sits at the repo root, a sibling of `packages/`, and npm
 * cannot pack files above a package directory — so a published tarball never carries it. Discovery
 * then reports an empty set rather than failing; it is asking to *resolve* an algorithm from a
 * directory that does not exist that is the error, and {@link resolveInstalledAlgorithm} says so.
 */
function findAlgorithmsRoot(): string | null {
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
	return null;
}

let algorithmsRoot: string | null | undefined;

function algorithmsDir(): string | null {
	if (algorithmsRoot === undefined) algorithmsRoot = findAlgorithmsRoot();
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
	if (!entries) {
		const root = algorithmsDir();
		entries = root ? discoverAlgorithmMods(root) : new Map();
	}
	return entries;
}

/**
 * The ids of the mods **on disk**, the default first, then the rest alphabetically. Empty when there is
 * no `algorithms/` directory, which is what a published install looks like — this reports what is
 * installed, so it must not pad itself with the embedded blessed set. For the ids resolvable without a
 * filesystem, ask `bundledAlgorithms()` on `@xtyle/core/host/bundle`.
 */
export function availableAlgorithms(): string[] {
	const ids = [...mods().keys()].sort();
	const dflt = defaultAlgorithm();
	return ids.includes(dflt) ? [dflt, ...ids.filter((id) => id !== dflt)] : ids;
}

/**
 * What an algorithm declares about itself — produced tokens, knobs and their domains, invariant count,
 * pass names — read straight off the packaged mod manifest, with no sandbox boot. `null` for a mod that
 * ships no static block, which can then only be read by running it (see `resolveInstalledAlgorithm`).
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
 * Resolves an algorithm by id to its host facade: loads the algorithm's xript mod
 * from `algorithms/`, runs it through the zero-authority sandbox, and returns an
 * `Algorithm`. Cached per id (and per rail; see {@link HARNESS_TIMEOUT_MS}).
 *
 * **Node-only, and it needs an `algorithms/` directory on disk.** There is a second function with this
 * exact name, exported from `@xtyle/core/algorithms`, which resolves the same shipped mods from an
 * embedded bundle with no filesystem. They are not interchangeable, and the wrong one is silent in a checkout
 * (the walk-up finds the repo's own `algorithms/` either way) and fatal once published, which is the
 * single easiest mistake to make against this module. Pick by what the caller needs:
 *
 * - **This one** when the point is *discovery* — resolving whatever packs are installed on disk,
 *   including third-party ones this package has never heard of. The CLI, the MCP server and the
 *   gauntlet all want exactly this.
 * - **`@xtyle/core/algorithms`** when the caller only ever asks for a blessed id, and especially when
 *   the code runs at build time, in a browser, or inside a published package.
 *
 * Both run the same mod through the same `loadAlgorithm`, so the choice costs no fidelity — the
 * gauntlet proves the sandboxed mod that ships, not a baked copy. The baked `getAlgorithm` registry
 * from `@xtyle/core/algorithms` is neither of these: it is the byte-identical test oracle and the
 * synchronous first-paint fallback, and it is not a substitute for either resolver.
 */
export function resolveInstalledAlgorithm(id: string, options: ResolveAlgorithmOptions = {}): Promise<Algorithm> {
	const timeoutMs = railFor(options.timeoutMs);
	// The rail is part of the identity of the loaded mod: a cache keyed on id alone would hand a
	// harness the 5s-railed instance that a production caller warmed first, and the raise would silently
	// do nothing. Keyed on the *clamped* rail, so the space is {default, harness} and no larger.
	const key = timeoutMs === undefined ? id : `${id}@${timeoutMs}`;
	const cached = cache.get(key);
	if (cached) return cached;

	const entry = mods().get(id);
	if (!entry) {
		// Two different failures wearing one message helps nobody: an id missing from a directory that
		// exists is a typo or an uninstalled pack, while no directory at all almost always means this
		// resolver was imported where its filesystem-free twin was wanted.
		const root = algorithmsDir();
		return Promise.reject(
			new Error(
				root
					? `xtyle: no algorithm "${id}" in ${root} (installed: ${availableAlgorithms().join(", ") || "none"})`
					: `xtyle: no algorithm "${id}" — \`@xtyle/core/host\` resolves mods from an \`algorithms/\` ` +
						"directory and there is none here, which is what a published install looks like. For the " +
						`blessed set with no filesystem, use ${FILESYSTEM_FREE_PATH}.`,
			),
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

/**
 * @deprecated Renamed to {@link resolveInstalledAlgorithm}, because `@xtyle/core/algorithms` exports a
 * `resolveAlgorithm` too and the two are not interchangeable — this one needs an `algorithms/`
 * directory on disk, that one resolves the blessed set from an embedded bundle. Use
 * `resolveInstalledAlgorithm` for disk discovery, or `@xtyle/core/algorithms` when you only ever ask
 * for a blessed id. Kept so nothing published breaks.
 */
export const resolveAlgorithm = resolveInstalledAlgorithm;

/** The algorithm an id-less caller derives with. One literal, rather than a `"xtyle-default"` in every consumer. */
export function defaultAlgorithm(): string {
	return "xtyle-default";
}

/**
 * Synchronous accessor for an already-resolved mod: returns the cached `Algorithm`
 * once `resolveInstalledAlgorithm(id)` has settled, else `null`. The hosted resolution is
 * async (the sandbox load), but a synchronous caller — a framework reactive
 * computation, a first-paint path — can warm the cache with `resolveInstalledAlgorithm`,
 * then read the canonical mod here without awaiting, falling back only for the
 * window before the load lands.
 */
export function snapshotAlgorithm(id: string): Algorithm | null {
	return resolved.get(id) ?? null;
}
