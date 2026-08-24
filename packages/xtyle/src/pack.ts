/** The keyword a pack publishes under, so discovery is a query over npm rather than a hosted registry. */
export const PACK_KEYWORD = "xtyle-pack";

/** The standalone manifest filename, for a pack that would rather not carry the block in `package.json`. */
export const PACK_MANIFEST_FILE = "xtyle.json";

/** The `package.json` field carrying the same block. */
export const PACK_MANIFEST_FIELD = "xtyle";

export type PackEntryKind = "algorithm" | "theme";

/**
 * One declared thing inside a pack. `name` is the identity a `#selector` matches and an algorithm
 * resolves under; `entry` is where it lives, and is the only part that moves when an author
 * reorganizes folders.
 */
export interface PackEntry {
	name: string;
	kind: PackEntryKind;
	entry: string;
	description?: string;
}

/**
 * What a pack declares about itself. Authoritative: nothing scans a pack's directories looking for
 * things it might have meant, so a file the manifest does not name is not part of the pack.
 */
export interface PackManifest {
	name: string;
	version?: string;
	description?: string;
	algorithms: PackEntry[];
	themes: PackEntry[];
}

/**
 * A parsed manifest and everything that was dropped reading it. Problems are reported rather than
 * thrown because discovery reads every installed pack in one pass: one malformed entry should cost
 * that entry, not the scan.
 */
export interface PackManifestResult {
	pack: PackManifest | null;
	problems: string[];
}

export type PackRefKind = "npm" | "github" | "path" | "url" | "author";

/**
 * A pack reference, dispatched on shape. `target` is the coordinate to resolve with the version and
 * selector stripped off, so a caller never re-parses the string it was handed.
 */
export interface PackRef {
	raw: string;
	kind: PackRefKind;
	target: string;
	version?: string;
	select?: string;
}

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function readEntries(value: unknown, kind: PackEntryKind, problems: string[]): PackEntry[] {
	if (value === undefined) return [];
	if (!Array.isArray(value)) {
		problems.push(`"${kind}s" is ${typeof value}, not an array of entries`);
		return [];
	}
	const entries: PackEntry[] = [];
	const claimed = new Set<string>();
	for (const [index, raw] of value.entries()) {
		const at = `${kind}s[${index}]`;
		if (!isObject(raw)) {
			problems.push(`${at} is ${raw === null ? "null" : typeof raw}, not an entry object`);
			continue;
		}
		const name = typeof raw.name === "string" ? raw.name.trim() : "";
		const entry = typeof raw.entry === "string" ? raw.entry.trim() : "";
		if (!name) {
			problems.push(`${at} declares no name, so nothing can select it`);
			continue;
		}
		if (!entry) {
			problems.push(`${at} ("${name}") declares no entry, so nothing can load it`);
			continue;
		}
		if (claimed.has(name)) {
			problems.push(`${at} repeats the name "${name}", which already names another ${kind}`);
			continue;
		}
		claimed.add(name);
		entries.push({
			name,
			kind,
			entry,
			...(typeof raw.description === "string" ? { description: raw.description } : {}),
		});
	}
	return entries;
}

/**
 * Read a pack manifest out of a `package.json` (its `xtyle` field) or, with `standalone`, out of an
 * `xtyle.json` that *is* the block. `pack` is `null` when the source carries no block at all, which
 * is the ordinary answer for the overwhelming majority of packages a scan walks past.
 *
 * `standalone` is a caller's statement about which file it opened, not a shape the parser guesses
 * at: a `package.json` with an unrelated top-level `themes` key is not a pack, and there is no
 * reading of its contents that could tell you so.
 *
 * An entry's kind comes from the list it sits in rather than from a `kind` field, so a pack cannot
 * declare an algorithm inside `themes` and be believed twice.
 */
export function parsePackManifest(
	source: unknown,
	fallback: { name?: string; version?: string; standalone?: boolean } = {},
): PackManifestResult {
	const problems: string[] = [];
	if (!isObject(source)) return { pack: null, problems };

	const field = source[PACK_MANIFEST_FIELD];
	const block = fallback.standalone ? source : isObject(field) ? field : null;
	if (!block) return { pack: null, problems };

	const name = typeof block.name === "string" && block.name.trim() ? block.name.trim() : (fallback.name ?? "");
	if (!name) problems.push("the pack declares no name, and none could be read from its package");

	const version = typeof block.version === "string" ? block.version : fallback.version;
	const algorithms = readEntries(block.algorithms, "algorithm", problems);
	const themes = readEntries(block.themes, "theme", problems);

	if (!algorithms.length && !themes.length) problems.push("the pack declares no algorithms and no themes, so there is nothing to register");

	return {
		pack: {
			name,
			...(version ? { version } : {}),
			...(typeof block.description === "string" ? { description: block.description } : {}),
			algorithms,
			themes,
		},
		problems,
	};
}

/** Every declared entry in one list, algorithms first, for a caller that does not care which kind it has. */
export function packEntries(pack: PackManifest): PackEntry[] {
	return [...pack.algorithms, ...pack.themes];
}

/** The entry a `#selector` names, across both kinds. `null` when the pack declares no such name. */
export function selectPackEntry(pack: PackManifest, name: string): PackEntry | null {
	return packEntries(pack).find((entry) => entry.name === name) ?? null;
}

const WINDOWS_ABSOLUTE = /^[a-zA-Z]:[\\/]/;

/**
 * Parse a pack reference, dispatching on shape:
 *
 * - `@scope/pkg` or `pkg` → an npm package, with `pkg@1.2.3` pinning a version
 * - `owner/repo` → a GitHub repo, with `owner/repo@ref` pinning a committish
 * - `./path`, `/path`, `C:\path` → a directory or tarball on disk
 * - `https://…`, `file://…` → a remote or local tarball
 * - `@handle` (no slash) → an author, resolved to their packs through the index
 *
 * A trailing `#name` selects a single declared entry by its **manifest name** rather than by a file
 * path, so the selector survives the author reorganizing folders and reads identically across every
 * shape above. That is why a GitHub committish goes in the version position (`owner/repo@main`)
 * rather than npm's own `owner/repo#main`: `#` means one thing here, everywhere.
 */
export function parsePackRef(raw: string): PackRef {
	const trimmed = raw.trim();
	if (!trimmed) throw new Error("xtyle: empty pack reference");
	if (/["'`|&;<>\r\n]/.test(trimmed)) throw new Error(`xtyle: "${raw}" is not a pack reference — no package name, path or URL carries those characters`);

	const hash = trimmed.indexOf("#");
	const select = hash >= 0 ? trimmed.slice(hash + 1).trim() : undefined;
	if (hash >= 0 && !select) throw new Error(`xtyle: "${raw}" ends in # but names no entry to select`);
	const body = hash >= 0 ? trimmed.slice(0, hash) : trimmed;
	const tail = select ? { select } : {};

	if (/^[a-z][a-z0-9+.-]*:\/\//i.test(body) || body.startsWith("file:")) {
		return { raw: trimmed, kind: "url", target: body, ...tail };
	}
	if (body.startsWith(".") || body.startsWith("/") || body.startsWith("\\") || WINDOWS_ABSOLUTE.test(body)) {
		return { raw: trimmed, kind: "path", target: body, ...tail };
	}

	const scoped = body.startsWith("@");
	const at = body.indexOf("@", scoped ? 1 : 0);
	const target = at > 0 ? body.slice(0, at) : body;
	const version = at > 0 ? body.slice(at + 1) : undefined;
	if (at > 0 && !version) throw new Error(`xtyle: "${raw}" ends in @ but names no version`);
	const versioned = version ? { version } : {};

	if (scoped && !target.includes("/")) {
		if (version) throw new Error(`xtyle: "${raw}" reads as the author ${target}, which has no version to pin`);
		return { raw: trimmed, kind: "author", target, ...tail };
	}
	if (!scoped && target.includes("/")) {
		return { raw: trimmed, kind: "github", target, ...versioned, ...tail };
	}
	return { raw: trimmed, kind: "npm", target, ...versioned, ...tail };
}

/**
 * The reference as the package manager takes it. GitHub committishes translate back to npm's own
 * `owner/repo#ref` here, which is the one place that spelling belongs.
 */
export function packInstallSpec(ref: PackRef): string {
	switch (ref.kind) {
		case "npm":
			return ref.version ? `${ref.target}@${ref.version}` : ref.target;
		case "github":
			return ref.version ? `${ref.target}#${ref.version}` : ref.target;
		case "author":
			throw new Error(`xtyle: ${ref.target} is an author, not a package — search it to find their packs`);
		default:
			return ref.target;
	}
}
