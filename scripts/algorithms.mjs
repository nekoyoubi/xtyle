import { existsSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { runInNewContext } from "node:vm";

/** The host slot a packaged mod fills with its static algorithm manifest. Mirrors `host/index.ts`. */
export const STATIC_MANIFEST_SLOT = "xtyle.pack-meta";

/** The path, relative to the mod's directory, of the script a mod manifest names as its entry. */
export function entryScript(manifest) {
	const entry = manifest?.entry;
	if (typeof entry === "string") return entry;
	return entry?.script ?? "src/mod.js";
}

/**
 * Every algorithm mod under `algorithms/`, discovered by scanning rather than by a hand-kept list —
 * the one place the build, the freshness guard, and the browser bundle agree on what exists.
 *
 * An algorithm's id is the `name` its mod manifest declares, never the directory it sits in: that name
 * is what lands in a theme file's `algorithm` field and in every cache key. For a first-party mod the
 * two must agree, and this throws when they do not — the mismatch is only ever a typo here, and it is
 * permanent once a theme has been written against it.
 */
export function discoverAlgorithms(root) {
	const modsDir = join(root, "algorithms");
	const found = [];
	const byId = new Map();

	for (const dirent of readdirSync(modsDir, { withFileTypes: true })) {
		if (!dirent.isDirectory()) continue;
		const path = join(modsDir, dirent.name);
		const manifestPath = join(path, "mod-manifest.json");
		const sourcePath = join(path, "src", "mod.ts");
		if (!existsSync(manifestPath) || !existsSync(sourcePath)) continue;

		const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
		const id = manifest.name;
		if (!id) {
			throw new Error(`algorithms/${dirent.name}/mod-manifest.json declares no name, so the mod has no id`);
		}
		if (id !== dirent.name) {
			throw new Error(
				`algorithms/${dirent.name} declares the name "${id}": a first-party algorithm's directory must match ` +
					"its manifest name, because the name is the id every theme file records forever",
			);
		}
		if (byId.has(id)) {
			throw new Error(`two mods claim the algorithm id "${id}"`);
		}

		const entry = { id, dir: dirent.name, path, manifestPath, manifest, sourcePath, scriptPath: join(path, entryScript(manifest)) };
		byId.set(id, entry);
		found.push(entry);
	}

	return found.sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Every pack under `packs/`, read from the `xtyle` block each one declares. Unlike `algorithms/`,
 * nothing here is discovered by scanning subdirectories: a pack is authoritative about its own
 * contents, so reading it any other way would exercise a path no consumer takes.
 */
export function discoverPacks(root) {
	const packsDir = join(root, "packs");
	if (!existsSync(packsDir)) return [];
	const found = [];
	for (const dirent of readdirSync(packsDir, { withFileTypes: true })) {
		if (!dirent.isDirectory()) continue;
		const dir = join(packsDir, dirent.name);
		const manifestPath = join(dir, "package.json");
		if (!existsSync(manifestPath)) continue;
		const pkg = JSON.parse(readFileSync(manifestPath, "utf8"));
		if (!pkg.xtyle) continue;
		found.push({ name: pkg.name ?? dirent.name, dir, pkg });
	}
	return found.sort((a, b) => a.name.localeCompare(b.name));
}

/** The algorithm mods a pack declares, each with the manifest and built script the pack ships. */
export function packAlgorithmMods(pack) {
	return (pack.pkg.xtyle.algorithms ?? []).map((entry) => {
		const modDir = join(pack.dir, entry.entry);
		const manifestPath = join(modDir, "mod-manifest.json");
		const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
		return {
			id: entry.name,
			pack: pack.name,
			manifest,
			manifestPath,
			sourcePath: join(modDir, "src", "mod.ts"),
			scriptPath: join(modDir, entryScript(manifest)),
		};
	});
}

/**
 * Bundle one mod's TypeScript entry into the self-contained script its manifest names, and stamp what
 * the built code says about itself back into that manifest. The blessed set and a pack are built by
 * exactly the same call, because a pack that were built differently would prove nothing about the
 * on-ramp a stranger takes. Returns whether the static block changed.
 */
export async function buildMod(mod, build) {
	await build({
		entryPoints: [mod.sourcePath],
		outfile: mod.scriptPath,
		bundle: true,
		format: "iife",
		platform: "neutral",
		target: "es2020",
		legalComments: "none",
		logLevel: "warning",
	});
	return writeStaticManifest(mod, readAlgorithmManifest(readFileSync(mod.scriptPath, "utf8"), mod.id));
}

/**
 * What a built mod says about itself, read by running its registration in a bare context and calling
 * the `manifest` export it registers. The same artifact the sandbox executes, so the answer is the
 * algorithm's own, not a second derivation of it from the engine's source.
 */
export function readAlgorithmManifest(source, id) {
	const registered = new Map();
	const context = {
		xript: { exports: { register: (name, fn) => registered.set(name, fn) } },
		console: { log() {}, warn() {}, error() {} },
	};
	runInNewContext(source, context, { timeout: 10_000, filename: `${id}/mod.js` });

	const manifest = registered.get("manifest");
	if (typeof manifest !== "function") {
		throw new Error(`algorithms/${id}: the built mod registers no "manifest" export`);
	}
	return manifest();
}

/**
 * Stamp an algorithm's static manifest into its packaged mod manifest as the `xtyle.pack-meta` data
 * fill, so a discovery surface can list what the algorithm accepts without executing it. Rewrites only
 * on a real change, and returns whether it did — the freshness guard reads that to catch a block that
 * has drifted from its code.
 */
export function writeStaticManifest(entry, block) {
	const current = entry.manifest.fills?.[STATIC_MANIFEST_SLOT]?.[0];
	if (current && JSON.stringify(current) === JSON.stringify(block)) return false;

	const next = {
		...entry.manifest,
		fills: { ...entry.manifest.fills, [STATIC_MANIFEST_SLOT]: [block] },
	};
	writeFileSync(entry.manifestPath, `${JSON.stringify(next, null, "\t")}\n`);
	entry.manifest = next;
	return true;
}
