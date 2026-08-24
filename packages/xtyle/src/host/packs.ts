import { existsSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, join, parse, resolve } from "node:path";
import process from "node:process";
import { PACK_MANIFEST_FILE, parsePackManifest, type PackEntry, type PackManifest } from "../pack.js";
import { parseThemeFile, type XtyleThemeFile } from "../theme-file.js";

/** A pack found on disk: what it declares, and the directory its entries are relative to. */
export interface InstalledPack {
	pack: PackManifest;
	dir: string;
	problems: string[];
}

const DEPENDENCY_FIELDS = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"] as const;

function readJson(path: string): unknown {
	try {
		return JSON.parse(readFileSync(path, "utf8"));
	} catch {
		return null;
	}
}

function nearestPackageJson(from: string): string | null {
	let dir = resolve(from);
	const { root } = parse(dir);
	while (true) {
		const candidate = join(dir, "package.json");
		if (existsSync(candidate)) return candidate;
		if (dir === root) return null;
		dir = dirname(dir);
	}
}

function resolvePackageDir(name: string, from: string): string | null {
	let dir = resolve(from);
	const { root } = parse(dir);
	while (true) {
		const candidate = join(dir, "node_modules", name);
		if (existsSync(join(candidate, "package.json"))) return candidate;
		if (dir === root) return null;
		dir = dirname(dir);
	}
}

/**
 * The pack a directory declares, read from its `package.json`'s `xtyle` field or a standalone
 * `xtyle.json` beside it. `null` when the directory declares no pack, which is what every ordinary
 * package looks like.
 *
 * The standalone file wins when both exist: a pack that wrote one meant it, and silently preferring
 * the field would leave the file with no way to say so.
 */
export function readInstalledPack(dir: string): InstalledPack | null {
	const pkg = readJson(join(dir, "package.json"));
	const named = pkg && typeof pkg === "object" ? (pkg as { name?: string; version?: string }) : {};
	const fallback = { name: named.name, version: named.version };

	const standalonePath = join(dir, PACK_MANIFEST_FILE);
	const standalone = existsSync(standalonePath);
	const source = standalone ? readJson(standalonePath) : pkg;
	const { pack, problems } = parsePackManifest(source, { ...fallback, standalone });
	return pack ? { pack, dir, problems } : null;
}

/**
 * Every pack reachable from a project: the project itself when it declares one, then each of its
 * declared dependencies that does.
 *
 * Keyed on the project's *declared* dependencies rather than on a walk of `node_modules`, for two
 * reasons that point the same way: a scan of a real project's tree is thousands of `package.json`
 * reads on every invocation, and a pack that arrived transitively is not one this project asked
 * for. What you add is what you get.
 */
export function discoverInstalledPacks(from: string = process.cwd()): InstalledPack[] {
	const manifestPath = nearestPackageJson(from);
	if (!manifestPath) return [];
	const projectDir = dirname(manifestPath);

	const found: InstalledPack[] = [];
	const seen = new Set<string>();

	const own = readInstalledPack(projectDir);
	if (own) {
		found.push(own);
		seen.add(own.pack.name);
	}

	const pkg = readJson(manifestPath);
	if (!pkg || typeof pkg !== "object") return found;

	const names = new Set<string>();
	for (const field of DEPENDENCY_FIELDS) {
		const block = (pkg as Record<string, unknown>)[field];
		if (block && typeof block === "object") for (const name of Object.keys(block)) names.add(name);
	}

	for (const name of [...names].sort()) {
		if (seen.has(name)) continue;
		const dir = resolvePackageDir(name, projectDir);
		if (!dir) continue;
		const installed = readInstalledPack(dir);
		if (!installed) continue;
		seen.add(installed.pack.name);
		found.push(installed);
	}
	return found;
}

/** Where a pack's entry actually lives, resolved against the pack's own directory. */
export function packEntryPath(installed: InstalledPack, entry: PackEntry): string {
	return isAbsolute(entry.entry) ? entry.entry : resolve(installed.dir, entry.entry);
}

/**
 * A theme declared by an installed pack, read off disk. `name` is the manifest name, not a path, so
 * a theme survives its author moving the file.
 *
 * A bare name takes the first pack declaring it; `<pack>/<name>` disambiguates when two packs ship a
 * theme under the same name, which nothing prevents and nothing should.
 */
export function resolvePackTheme(name: string, from?: string): { theme: XtyleThemeFile; pack: string; path: string } | null {
	const slash = name.lastIndexOf("/");
	const packName = slash > 0 ? name.slice(0, slash) : null;
	const themeName = slash > 0 ? name.slice(slash + 1) : name;

	for (const installed of discoverInstalledPacks(from)) {
		if (packName && installed.pack.name !== packName) continue;
		const entry = installed.pack.themes.find((candidate) => candidate.name === themeName);
		if (!entry) continue;
		const path = packEntryPath(installed, entry);
		const theme = parseThemeFile(existsSync(path) ? readFileSync(path, "utf8") : "");
		if (!theme) {
			throw new Error(`xtyle: pack "${installed.pack.name}" declares theme "${entry.name}" at ${entry.entry}, which is not an xtyle theme file`);
		}
		return { theme, pack: installed.pack.name, path };
	}
	return null;
}
