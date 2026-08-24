import { initXript, type HardLimits, type HostNamespace, type XriptFactory, type XriptRuntime } from "@xriptjs/runtime";
import hostManifest from "../../manifest.json" with { type: "json" };
import { authoringPrelude } from "./authoring-prelude.generated.js";
import { createCuti } from "../cuti.js";
import { sandboxInitOptions } from "../sandbox.js";
import { resolveKnobSpecs } from "../algorithms/factory.js";
import { resolveGraph, type TokenNode } from "../graph.js";
import type {
	Algorithm,
	DeriveOptions,
	DeriveTrace,
	Invariant,
	InvariantContext,
	InvariantResult,
	KnobSpec,
	Pass,
	Scheme,
	TokenCategories,
	TokenLineageNode,
	TokenName,
	TokenRegister,
	TraceSnapshot,
} from "../types.js";

interface ModManifestShape {
	entry?: { script?: string } | string;
}

/**
 * What an algorithm says about itself: the tokens it produces, the knobs it reads and their domains,
 * how many invariants it evaluates, and the names of its passes. The value the `manifest` export
 * returns, and — byte for byte — the value the {@link STATIC_MANIFEST_SLOT} fill carries in the
 * packaged mod manifest.
 */
export interface AlgorithmManifest {
	produces: TokenName[];
	/** Per-token arrival versions. Absent tokens read as the {@link SINCE_FLOOR}. */
	producedSince?: Readonly<Record<string, string>>;
	categories: TokenCategories;
	knobs: string[];
	/** Present on mods built against the widened authoring surface; older/third-party mods omit it. */
	knobSpecs?: KnobSpec[];
	invariantCount: number;
	passNames?: string[];
	/** The contrast this algorithm promises `--ring` reads at. Absent leaves a grader on the standard. */
	focusRingFloor?: number;
	/** The schemes this algorithm states an anchor pair for. */
	schemes?: Scheme[];
}

/**
 * The host slot a packaged mod fills with its {@link AlgorithmManifest}. A discovery surface — an
 * index listing an algorithm's knobs, a control rail rendering them — reads this instead of booting a
 * sandbox per algorithm, which is the difference between listing a hundred packs and running them.
 *
 * It is a **data fill**: a slot whose `accepts` names a JSON media type rather than a markup format,
 * so nothing renders and no fragment runtime is involved. That is xript's own answer for static
 * mod-describing metadata, and it is why this is not a vendor key hung off the manifest root — a
 * top-level `x-` block is rejected by `xript validate` (the mod-manifest schema is closed, in every
 * published version), invisible to `--cross`, and reachable only by us. A slot with a `payload` schema
 * is validated by the toolchain and is the same surface a third-party pack fills.
 *
 * The block is an *augmentation*, never a replacement: the `manifest` export stays the source of
 * truth, because an in-browser authored source loads under a synthesized manifest with no packaged
 * fill to carry. A mod that ships one is checked against its own code at load time
 * ({@link loadAlgorithm}), so a block that has drifted fails loudly rather than teaching a consumer to
 * render controls for knobs the algorithm no longer reads.
 */
export const STATIC_MANIFEST_SLOT = "xtyle.pack-meta";

/**
 * The {@link AlgorithmManifest} a packaged mod manifest declares, without executing the mod. `null`
 * when the mod ships no block — the manifest is then only readable by running it.
 */
export function staticAlgorithmManifest(modManifest: unknown): AlgorithmManifest | null {
	const fills = (modManifest as { fills?: Record<string, unknown> } | null | undefined)?.fills;
	const declared = fills?.[STATIC_MANIFEST_SLOT];
	const block = Array.isArray(declared) ? declared[0] : declared;
	return isAlgorithmManifest(block) ? block : null;
}

function isAlgorithmManifest(value: unknown): value is AlgorithmManifest {
	if (!value || typeof value !== "object") return false;
	const candidate = value as Partial<AlgorithmManifest>;
	return (
		Array.isArray(candidate.produces) &&
		Array.isArray(candidate.knobs) &&
		typeof candidate.categories === "object" &&
		candidate.categories !== null &&
		typeof candidate.invariantCount === "number"
	);
}

const CHECKED_FIELDS = [
	"produces",
	"categories",
	"knobs",
	"knobSpecs",
	"invariantCount",
	"passNames",
	"focusRingFloor",
	"schemes",
] as const;

/** Structural equality, insensitive to object key order and treating an absent key as `undefined`. */
function sameValue(a: unknown, b: unknown): boolean {
	if (a === b) return true;
	if (Array.isArray(a) || Array.isArray(b)) {
		if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
		return a.every((item, i) => sameValue(item, b[i]));
	}
	if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
	const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
	for (const key of keys) {
		if (!sameValue((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) return false;
	}
	return true;
}

/**
 * The static block is a *claim*; the running code is the fact. A block that silently drifts from the
 * mod is worse than no block at all — a consumer renders controls for knobs the algorithm no longer
 * reads, and a discovery index publishes a token set it no longer produces. The one load that already
 * happens is where the claim gets checked, so a drifted pack cannot be resolved at all.
 */
function crossCheckStaticManifest(claimed: AlgorithmManifest, actual: AlgorithmManifest, id: string): void {
	const drifted = CHECKED_FIELDS.filter((field) => !sameValue(claimed[field], actual[field]));
	if (drifted.length === 0) return;
	throw new Error(
		`xtyle: algorithm "${id}" declares a "${STATIC_MANIFEST_SLOT}" fill that does not match what its code reports ` +
			`(${drifted.join(", ")}). Rebuild the mod so the declared block matches its manifest() export.`,
	);
}

/**
 * The stub `run` for a host facade's `passes`. Pass closures cannot cross the sandbox
 * boundary, so a hosted algorithm exposes pass names for labeling but not runnable
 * stages — `deriveTraced` returns the snapshots a caller actually needs for layers.
 */
function hostPassRunUnsupported(): never {
	throw new Error(
		"xtyle: host passes are name-only; pass closures do not cross the sandbox — use deriveTraced for layer snapshots",
	);
}

/**
 * The sandbox safety rails. `timeout_ms` is a wall-clock rail against a runaway mod (an
 * infinite loop), not a performance budget. The runtime's effective rail is the smaller
 * of the host manifest's declared `limits.timeout_ms` and the runtime hard cap, so both
 * are raised together below. The interpreted (hosted) derivation is far slower than the
 * native baked path — the hardest anchor sets (extreme, AAA contrast) can take ~1s+ — so
 * the rail must clear that, and correctness work (byte-identity tests) raises it
 * generously so it never depends on how long an interpreted derivation happens to take.
 */
const HOST_LIMITS: HardLimits = (hostManifest as { limits?: HardLimits }).limits ?? {};
const DEFAULT_TIMEOUT_MS = HOST_LIMITS.timeout_ms ?? 5000;

export interface LoadAlgorithmOptions {
	/** Wall-clock execution rail (ms). Defaults to the host manifest's declared limit;
	 *  raise it for work that must not be gated on how long a derivation takes. */
	timeoutMs?: number;
}

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
 *
 * This lives beside `loadAlgorithm` rather than with either resolver because *both* resolvers need
 * it — the Node one that reads `algorithms/` off disk and the filesystem-free one that resolves from
 * the embedded bundle. A rail only the Node twin could raise is how the bundle path ended up racing
 * the 5s production rail in a byte-identity test, which fails as an `interrupted` interrupt and reads
 * like a derivation divergence rather than a busy machine.
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
export function railFor(timeoutMs: number | undefined): number | undefined {
	return timeoutMs === undefined ? undefined : Math.min(timeoutMs, HARNESS_TIMEOUT_MS);
}

export interface LoadAuthoredOptions extends LoadAlgorithmOptions {
	/** The facade id for the authored algorithm. Defaults to `"authored"`. */
	name?: string;
}

/** The synthesized manifest an authored Tier-2 source loads under — the four exports the
 *  authoring helpers register, gated by the same `color-math` capability the blessed mods use. */
function authoredManifest(name: string): unknown {
	return {
		xript: "0.8",
		name,
		version: "0.0.0",
		capabilities: ["color-math"],
		entry: {
			script: "src/mod.js",
			format: "script",
			exports: {
				graph: { returns: { array: "TokenNode" } },
				traced: { returns: { array: "TraceSnapshot" } },
				manifest: { returns: "AlgorithmManifest" },
				invariants: { returns: { array: "InvariantResult" } },
			},
		},
	};
}

/**
 * Load an algorithm from author-written source — the in-browser authoring path. The source is
 * import-free: it calls `defineAlgorithm` / `defineXtyleAlgorithm` (Tier-2 or Tier-1) directly,
 * and the pre-bundled {@link authoringPrelude} prepended here supplies those helpers on the
 * sandbox global scope, so no bundler runs in the browser. The result is a real sandboxed
 * `Algorithm` — the same isolation a third-party pack gets — so this, not the baked path, is
 * where self-authored *code* (a `derive` body) must run.
 */
export function loadAuthoredAlgorithm(
	source: string,
	options: LoadAuthoredOptions = {},
): Promise<Algorithm> {
	const { name = "authored", ...rest } = options;
	return loadAlgorithm(authoredManifest(name), `${authoringPrelude}\n${source}`, rest);
}

let factoryPromise: Promise<XriptFactory> | undefined;

function factory(): Promise<XriptFactory> {
	if (!factoryPromise) factoryPromise = initXript(sandboxInitOptions());
	return factoryPromise;
}

/** The path, relative to the mod's directory, of the script a mod manifest names as its entry. */
export function entryScriptKey(modManifest: unknown): string {
	const entry = (modManifest as ModManifestShape | null | undefined)?.entry;
	if (typeof entry === "string") return entry;
	return entry?.script ?? "src/mod.js";
}

/**
 * Loads a xtyle algorithm packaged as a script-format xript mod and returns a
 * facade structurally identical to {@link Algorithm}. `initXript` is amortized
 * across every call; each algorithm gets its own runtime (the export map is flat,
 * so two mods would collide on `graph`). `loadMod` and `invokeExport` are
 * synchronous for an already-loaded script mod, so every facade method below runs
 * synchronously over a single cached runtime.
 */
export async function loadAlgorithm(
	modManifest: unknown,
	source: string,
	options: LoadAlgorithmOptions = {},
): Promise<Algorithm> {
	const xript = await factory();
	const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
	// INFO: the runtime's effective timeout is min(manifest limit, hard cap), so both must move together
	const runtimeManifest =
		options.timeoutMs === undefined
			? hostManifest
			: { ...hostManifest, limits: { ...HOST_LIMITS, timeout_ms: timeoutMs } };
	const rt: XriptRuntime = xript.createRuntime(runtimeManifest, {
		hostBindings: { log: () => undefined, cuti: createCuti() as unknown as HostNamespace },
		capabilities: ["color-math"],
		strictBindings: true,
		console,
		hardLimits: { timeout_ms: timeoutMs, memory_mb: HOST_LIMITS.memory_mb ?? 16, max_stack_depth: HOST_LIMITS.max_stack_depth ?? 128 },
	});
	rt.loadMod(modManifest, {
		fragmentSources: { [entryScriptKey(modManifest)]: source },
	});

	const manifest = rt.invokeExport("manifest", []) as AlgorithmManifest;

	if (typeof manifest.invariantCount !== "number" || !Number.isInteger(manifest.invariantCount) || manifest.invariantCount < 0) {
		throw new Error(
			`xtyle: algorithm mod's manifest() must report a non-negative integer invariantCount, got ${JSON.stringify(manifest.invariantCount)}`,
		);
	}

	const id = (modManifest as { name?: string }).name ?? manifest.produces[0] ?? "unknown";
	const claimed = staticAlgorithmManifest(modManifest);
	if (claimed) crossCheckStaticManifest(claimed, manifest, id);

	const graphCache = new Map<string, TokenNode[]>();
	const graph = (opts: DeriveOptions): TokenNode[] => {
		const key = JSON.stringify(opts ?? {});
		const cached = graphCache.get(key);
		if (cached) return cached;
		const nodes = rt.invokeExport("graph", [opts]) as TokenNode[];
		graphCache.set(key, nodes);
		return nodes;
	};

	const invariantCache = new WeakMap<InvariantContext, InvariantResult[]>();
	const runInvariants = (ctx: InvariantContext): InvariantResult[] => {
		let results = invariantCache.get(ctx);
		if (!results) {
			results = rt.invokeExport("invariants", [ctx]) as InvariantResult[];
			invariantCache.set(ctx, results);
		}
		return results;
	};
	const invariants: Invariant[] = Array.from(
		{ length: manifest.invariantCount },
		(_, index): Invariant =>
			(ctx: InvariantContext): InvariantResult => runInvariants(ctx)[index] as InvariantResult,
	);

	const tracedCache = new Map<string, TraceSnapshot[]>();
	const traced = (opts: DeriveOptions): TraceSnapshot[] => {
		const key = JSON.stringify(opts ?? {});
		const cached = tracedCache.get(key);
		if (cached) return cached;
		let snapshots: TraceSnapshot[];
		try {
			snapshots = rt.invokeExport("traced", [opts]) as TraceSnapshot[];
		} catch {
			snapshots = [{ name: "derive", register: resolveGraph(graph(opts)) }];
		}
		tracedCache.set(key, snapshots);
		return snapshots;
	};

	const passNames = manifest.passNames ?? ["settle"];
	const passes: Pass[] = passNames.map((name) => ({ name, run: hostPassRunUnsupported }));

	return {
		id,
		...(manifest.focusRingFloor !== undefined || manifest.schemes !== undefined
			? {
					declares: {
						...(manifest.focusRingFloor !== undefined ? { focusRingFloor: manifest.focusRingFloor } : {}),
						...(manifest.schemes !== undefined ? { schemes: manifest.schemes } : {}),
					},
				}
			: {}),
		produces: manifest.produces,
		producedSince: manifest.producedSince,
		knobs: manifest.knobs,
		knobSpecs: resolveKnobSpecs(manifest.knobs, manifest.knobSpecs ?? []),
		categories: manifest.categories,
		derive: (opts: DeriveOptions = {}): TokenRegister => resolveGraph(graph(opts)),
		lineage: (opts: DeriveOptions = {}): TokenLineageNode[] =>
			graph(opts).map(({ name, value, refs }) =>
				refs && refs.length ? { name, value, refs } : { name, value },
			),
		invariants,
		passes,
		deriveTraced: (opts: DeriveOptions = {}): DeriveTrace => {
			const trace = traced(opts);
			const last = trace[trace.length - 1];
			return { register: last ? last.register : resolveGraph(graph(opts)), trace };
		},
	};
}
