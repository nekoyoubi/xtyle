import type { Algorithm } from "../types.js";
import {
	PACK_MANIFEST_FIELD,
	PACK_MANIFEST_FILE,
	parsePackManifest,
	parsePackRef,
	type PackEntry,
	type PackManifest,
	type PackRef,
} from "../pack.js";
import { parseThemeFile, type XtyleThemeFile } from "../theme-file.js";
import {
	entryScriptKey,
	loadAlgorithm,
	railFor,
	staticAlgorithmManifest,
	type AlgorithmManifest,
	type ResolveAlgorithmOptions,
} from "./index.js";

/**
 * The CDN a published pack's files are read through. jsDelivr rather than a tarball, because a
 * browser cannot untar: a pack has to be readable one file at a time, and both npm packages and
 * GitHub repos are served that way under a stable path shape.
 */
export const PACK_CDN = "https://cdn.jsdelivr.net";

export interface RemotePackOptions {
	/** The fetch to reach the pack with. Defaults to the global one. */
	fetch?: typeof globalThis.fetch;
	/** Override the CDN. Only the `npm` and `github` reference shapes read it; a URL reference is already a location. */
	cdn?: string;
}

/** A pack read over the network: what it declares, and the URL its entries resolve against. */
export interface RemotePack {
	pack: PackManifest;
	ref: PackRef;
	/** The pack's root, always slash-terminated, so an entry resolves against it with plain URL rules. */
	base: string;
	problems: string[];
}

export interface FetchPackEntryOptions extends RemotePackOptions {
	/** Which declared entry to take, when the pack declares more than one. Overrides a `#name` on the reference. */
	name?: string;
}

export interface FetchPackAlgorithmOptions extends FetchPackEntryOptions, ResolveAlgorithmOptions {}

/** One algorithm a remote pack declares, resolved through the sandbox. */
export interface RemoteAlgorithm {
	algorithm: Algorithm;
	/** The name the pack declared it under, which the mod's own name is allowed to disagree with. */
	declared: string;
	pack: string;
}

function trailingSlash(url: string): string {
	return url.endsWith("/") ? url : `${url}/`;
}

function packRoot(url: string, raw: string): string {
	let parsed: URL;
	try {
		parsed = new URL(trailingSlash(url));
	} catch {
		throw new Error(`xtyle: "${raw}" is not an address a pack can be read from`);
	}
	if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
		throw new Error(`xtyle: "${raw}" is a ${parsed.protocol.replace(":", "")} address; a pack is read over http or https`);
	}
	if (/\.(tgz|tar\.gz|zip)\/?$/i.test(parsed.pathname)) {
		throw new Error(
			`xtyle: "${raw}" points at an archive, which nothing here can unpack — serve the pack's files and reference the directory they sit in`,
		);
	}
	parsed.search = "";
	parsed.hash = "";
	return trailingSlash(parsed.href);
}

/**
 * Where a pack's files are read from, by reference shape:
 *
 * - `npm` → `<cdn>/npm/<pkg>[@<version>]/`
 * - `github` → `<cdn>/gh/<owner>/<repo>[@<ref>]/`
 * - `url` → the URL itself, read as the directory the pack is served from
 *
 * A `path` reference names a disk location and a `@handle` names an author rather than a pack, so
 * neither has a URL to answer with and both throw pointing at the surface that does resolve them.
 *
 * The answer is always normalized and always slash-terminated, because it is the base every entry
 * resolves against and the prefix containment is checked on. A base carrying `./`, a query, or a
 * fragment would resolve entries to addresses that no longer start with it, and refuse a pack that
 * had done nothing wrong.
 */
export function packBaseUrl(ref: PackRef, cdn: string = PACK_CDN): string {
	const pin = ref.version ? `@${ref.version}` : "";
	const root = trailingSlash(cdn);
	switch (ref.kind) {
		case "npm":
			return packRoot(`${root}npm/${ref.target}${pin}`, ref.raw);
		case "github":
			return packRoot(`${root}gh/${ref.target}${pin}`, ref.raw);
		case "url":
			return packRoot(ref.target, ref.raw);
		case "path":
			throw new Error(
				`xtyle: "${ref.raw}" is a path, which needs a filesystem — resolve it with \`@xtyle/core/host\`, or serve the pack over HTTP and reference that URL`,
			);
		default:
			throw new Error(`xtyle: ${ref.target} is an author rather than a pack — \`searchPacks("${ref.target}")\` finds what they publish`);
	}
}

function fetcher(options: RemotePackOptions): typeof globalThis.fetch {
	const request = options.fetch ?? globalThis.fetch;
	if (!request) throw new Error("xtyle: no fetch available to reach the pack");
	return request;
}

function withinPack(base: string, path: string): string {
	const resolved = new URL(path, base).href;
	if (!resolved.startsWith(base)) {
		throw new Error(`xtyle: "${path}" resolves to ${resolved}, which is outside the pack at ${base}`);
	}
	return resolved;
}

async function readJson(url: string, request: typeof globalThis.fetch): Promise<unknown | null> {
	const response = await request(url);
	if (response.status === 404) return null;
	if (!response.ok) throw new Error(`xtyle: ${url} answered ${response.status} ${response.statusText}`);
	try {
		return (await response.json()) as unknown;
	} catch {
		throw new Error(`xtyle: ${url} did not answer with JSON`);
	}
}

async function readText(url: string, request: typeof globalThis.fetch): Promise<string> {
	const response = await request(url);
	if (!response.ok) throw new Error(`xtyle: ${url} answered ${response.status} ${response.statusText}`);
	return response.text();
}

interface FetchCache {
	manifests: Map<string, Promise<RemotePack>>;
	loaded: Map<string, Promise<Algorithm>>;
}

/**
 * Caches hang off the fetch that filled them, so a caller supplying its own is never handed an answer
 * another caller's fetch produced. In a browser every call shares the one global fetch, so this is a
 * single cache set; a test or a host that injects a fetch gets its own.
 */
const caches = new WeakMap<typeof globalThis.fetch, FetchCache>();

function cacheFor(request: typeof globalThis.fetch): FetchCache {
	const existing = caches.get(request);
	if (existing) return existing;
	const fresh: FetchCache = { manifests: new Map(), loaded: new Map() };
	caches.set(request, fresh);
	return fresh;
}

/**
 * Read what a published pack declares, without loading any of it. The network twin of
 * `@xtyle/core/host`'s disk discovery: same manifest grammar, same precedence — a standalone
 * `xtyle.json` wins over the `package.json` block, because a pack that wrote one meant it.
 *
 * A malformed entry costs that entry and lands in `problems` rather than failing the read, so one
 * bad line in a stranger's manifest does not make the rest of their pack unreachable.
 */
export async function fetchPack(ref: string | PackRef, options: RemotePackOptions = {}): Promise<RemotePack> {
	const parsed = typeof ref === "string" ? parsePackRef(ref) : ref;
	const base = packBaseUrl(parsed, options.cdn);
	const request = fetcher(options);

	const { manifests } = cacheFor(request);
	const cached = manifests.get(base);
	if (cached) return { ...(await cached), ref: parsed };

	const reading = (async (): Promise<RemotePack> => {
		const [standalone, pkg] = await Promise.all([
			readJson(`${base}${PACK_MANIFEST_FILE}`, request),
			readJson(`${base}package.json`, request),
		]);

		const named = pkg && typeof pkg === "object" ? (pkg as { name?: string; version?: string }) : {};
		const { pack, problems } = parsePackManifest(standalone ?? pkg, {
			...(named.name ? { name: named.name } : {}),
			...(named.version ? { version: named.version } : {}),
			standalone: standalone !== null,
		});

		if (!pack) {
			throw new Error(
				`xtyle: nothing at ${base} declares an xtyle pack — a pack carries an "${PACK_MANIFEST_FIELD}" block in its package.json, or an ${PACK_MANIFEST_FILE} beside it`,
			);
		}
		return { pack, ref: parsed, base, problems };
	})();

	manifests.set(base, reading);
	reading.catch(() => manifests.delete(base));
	return reading;
}

function selectEntry(remote: RemotePack, kind: "algorithm" | "theme", wanted: string | undefined): PackEntry {
	const declared = kind === "algorithm" ? remote.pack.algorithms : remote.pack.themes;
	const names = declared.map((entry) => entry.name).join(", ");
	if (!declared.length) throw new Error(`xtyle: pack "${remote.pack.name}" declares no ${kind}s`);
	if (wanted) {
		const found = declared.find((entry) => entry.name === wanted);
		if (!found) throw new Error(`xtyle: pack "${remote.pack.name}" declares no ${kind} "${wanted}" (it has: ${names})`);
		return found;
	}
	if (declared.length > 1) {
		throw new Error(`xtyle: pack "${remote.pack.name}" declares ${declared.length} ${kind}s — name one with #<name> (it has: ${names})`);
	}
	return declared[0] as PackEntry;
}

function modDir(remote: RemotePack, entry: PackEntry): string {
	return withinPack(remote.base, trailingSlash(entry.entry));
}

async function loadRemoteAlgorithm(remote: RemotePack, entry: PackEntry, options: FetchPackAlgorithmOptions): Promise<Algorithm> {
	const request = fetcher(options);
	const dir = modDir(remote, entry);
	const timeoutMs = railFor(options.timeoutMs);
	const key = timeoutMs === undefined ? dir : `${dir}@${timeoutMs}`;

	const { loaded } = cacheFor(request);
	const cached = loaded.get(key);
	if (cached) return cached;

	const pending = (async () => {
		const manifest = await readJson(`${dir}mod-manifest.json`, request);
		if (!manifest) {
			throw new Error(
				`xtyle: pack "${remote.pack.name}" declares algorithm "${entry.name}" at ${entry.entry}, where there is no mod-manifest.json`,
			);
		}
		const declaredName = (manifest as { name?: string }).name;
		if (declaredName && declaredName !== entry.name) {
			console.warn(
				`xtyle: pack "${remote.pack.name}" declares algorithm "${entry.name}", whose mod calls itself "${declaredName}"; the mod name is the id`,
			);
		}
		const source = await readText(withinPack(dir, entryScriptKey(manifest)), request);
		return loadAlgorithm(manifest, source, { ...(timeoutMs === undefined ? {} : { timeoutMs }) });
	})();

	loaded.set(key, pending);
	pending.catch(() => loaded.delete(key));
	return pending;
}

/**
 * Fetch one algorithm a published pack declares and load it through the zero-authority sandbox.
 *
 * This is the whole point of the capability model rather than a hole in it: a stranger's algorithm
 * arrives as data, runs with `color-math` and a no-op log and nothing else, and answers on a
 * wall-clock rail. It cannot reach the page it derives for.
 *
 * With no `name` and no `#selector` a pack declaring exactly one algorithm resolves it; a pack
 * declaring several refuses rather than guessing, because the caller is about to run one of them.
 */
export async function fetchPackAlgorithm(ref: string | PackRef, options: FetchPackAlgorithmOptions = {}): Promise<Algorithm> {
	const remote = await fetchPack(ref, options);
	return loadRemoteAlgorithm(remote, selectEntry(remote, "algorithm", options.name ?? remote.ref.select), options);
}

/**
 * Every algorithm a published pack declares, loaded in turn. One that fails to load costs itself and
 * a warning rather than the pack, which is how the disk resolver treats an installed pack too.
 *
 * Loaded one at a time on purpose: each algorithm gets its own QuickJS runtime, and a pack of six
 * resolved in parallel is six runtimes built at once on whatever thread called.
 */
export async function fetchPackAlgorithms(ref: string | PackRef, options: FetchPackAlgorithmOptions = {}): Promise<RemoteAlgorithm[]> {
	const remote = await fetchPack(ref, options);
	const resolved: RemoteAlgorithm[] = [];
	for (const entry of remote.pack.algorithms) {
		try {
			resolved.push({ algorithm: await loadRemoteAlgorithm(remote, entry, options), declared: entry.name, pack: remote.pack.name });
		} catch (error) {
			console.warn(`xtyle: pack "${remote.pack.name}" declares algorithm "${entry.name}", which did not load: ${String(error)}`);
		}
	}
	return resolved;
}

/**
 * What a published algorithm declares about itself — produced tokens, knobs and their domains,
 * invariant count, pass names — read off its packaged mod manifest with no sandbox boot. `null` for a
 * mod shipping no static block, which can then only be read by running it.
 *
 * The discovery seam, and the reason it exists: rendering a listing of what a pack offers is the
 * cheapest question anyone asks of it, and it must not be the one that costs a runtime per algorithm.
 */
export async function fetchPackAlgorithmManifest(
	ref: string | PackRef,
	options: FetchPackEntryOptions = {},
): Promise<AlgorithmManifest | null> {
	const remote = await fetchPack(ref, options);
	const entry = selectEntry(remote, "algorithm", options.name ?? remote.ref.select);
	const manifest = await readJson(`${modDir(remote, entry)}mod-manifest.json`, fetcher(options));
	if (!manifest) {
		throw new Error(
			`xtyle: pack "${remote.pack.name}" declares algorithm "${entry.name}" at ${entry.entry}, where there is no mod-manifest.json`,
		);
	}
	return staticAlgorithmManifest(manifest);
}

/**
 * A theme a published pack declares, read as the recipe it is. Inert data — an algorithm id plus the
 * inputs that print its tokens — so nothing is loaded and nothing runs.
 */
export async function fetchPackTheme(
	ref: string | PackRef,
	options: FetchPackEntryOptions = {},
): Promise<{ theme: XtyleThemeFile; pack: string; url: string }> {
	const remote = await fetchPack(ref, options);
	const entry = selectEntry(remote, "theme", options.name ?? remote.ref.select);
	const url = withinPack(remote.base, entry.entry);
	const theme = parseThemeFile(await readText(url, fetcher(options)));
	if (!theme) {
		throw new Error(`xtyle: pack "${remote.pack.name}" declares theme "${entry.name}" at ${entry.entry}, which is not an xtyle theme file`);
	}
	return { theme, pack: remote.pack.name, url };
}
