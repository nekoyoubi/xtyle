import { initXript, type HardLimits, type HostNamespace, type XriptFactory, type XriptRuntime } from "@xriptjs/runtime";
import hostManifest from "../../manifest.json" with { type: "json" };
import { authoringPrelude } from "./authoring-prelude.generated.js";
import { createCuti } from "../cuti.js";
import { resolveGraph, type TokenNode } from "../graph.js";
import type {
	Algorithm,
	DeriveOptions,
	DeriveTrace,
	Invariant,
	InvariantContext,
	InvariantResult,
	Pass,
	TokenCategories,
	TokenLineageNode,
	TokenName,
	TokenRegister,
	TraceSnapshot,
} from "../types.js";

interface ModManifestShape {
	entry?: { script?: string } | string;
}

interface ModAlgorithmManifest {
	produces: TokenName[];
	categories: TokenCategories;
	knobs: string[];
	invariantCount: number;
	passNames?: string[];
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

export interface LoadAuthoredOptions extends LoadAlgorithmOptions {
	/** The facade id for the authored algorithm. Defaults to `"authored"`. */
	name?: string;
}

/** The synthesized manifest an authored Tier-2 source loads under — the four exports the
 *  authoring helpers register, gated by the same `color-math` capability the blessed mods use. */
function authoredManifest(name: string): unknown {
	return {
		xript: "0.7",
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
	if (!factoryPromise) factoryPromise = initXript();
	return factoryPromise;
}

function entryScriptKey(modManifest: ModManifestShape): string {
	const entry = modManifest.entry;
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
	// the runtime's effective rail is min(manifest limit, hard cap), so raise both in lockstep.
	const runtimeManifest =
		options.timeoutMs === undefined
			? hostManifest
			: { ...hostManifest, limits: { ...HOST_LIMITS, timeout_ms: timeoutMs } };
	const rt: XriptRuntime = xript.createRuntime(runtimeManifest, {
		hostBindings: { log: () => undefined, cuti: createCuti() as unknown as HostNamespace },
		capabilities: ["color-math"],
		console,
		hardLimits: { timeout_ms: timeoutMs, memory_mb: HOST_LIMITS.memory_mb ?? 16, max_stack_depth: HOST_LIMITS.max_stack_depth ?? 128 },
	});
	rt.loadMod(modManifest, {
		fragmentSources: { [entryScriptKey(modManifest as ModManifestShape)]: source },
	});

	const manifest = rt.invokeExport("manifest", []) as ModAlgorithmManifest;

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
		id: (modManifest as { name?: string }).name ?? manifest.produces[0] ?? "unknown",
		produces: manifest.produces,
		knobs: manifest.knobs,
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
