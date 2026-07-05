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
 * Resolves an algorithm by id to its host facade: loads the algorithm's xript mod
 * from `algorithms/<id>/`, runs it through the zero-authority sandbox, and returns
 * an `Algorithm`. Cached per id. This is the canonical resolution path — the whole
 * CLI (`derive` / `coverage` / `gauntlet`) and the site's SSR derive through it, so
 * the gauntlet proves the sandboxed mod that ships, not a baked copy. The baked
 * `getAlgorithm` registry from `@xtyle/core/algorithms` remains as the byte-identical
 * test oracle and as the synchronous first-paint fallback in the browser, where the
 * async mod load may not have completed yet.
 */
export function resolveAlgorithm(id: string): Promise<Algorithm> {
	const cached = cache.get(id);
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

	const loaded = loadAlgorithm(modManifest, source).then((algorithm) => {
		resolved.set(id, algorithm);
		return algorithm;
	});
	cache.set(id, loaded);
	return loaded;
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

