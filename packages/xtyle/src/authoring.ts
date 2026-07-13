import {
	borderForContrast,
	BORDER_SEPARATION,
	buildGraph,
	buildPassContext,
	DEFAULT_ANCHORS,
	DIVIDER_SEPARATION,
	enforceContrastFloor,
	makeInvariants,
	makeXtyleAlgorithm,
	makeXtylePipelineAlgorithm,
	PRODUCED_TOKENS,
	registerToNodes,
	resolveKnobSpecs,
	runPipeline,
	settlePass,
	SHARED_KNOBS,
	SURFACE_SEPARATION,
	TOKEN_CATEGORIES,
	type PresetAnchors,
	type PresetDefaults,
} from "./algorithms/factory.js";
import type { AccentStrategy } from "./types.js";
import {
	contrast,
	formatCss,
	oklch,
	toOklchColor,
	withLightness,
	type OklchColor,
} from "./color.js";
import { resolveGraph, type TokenNode } from "./graph.js";
import type { Cuti } from "./cuti.js";

export {
	makeXtyleAlgorithm,
	makeXtylePipelineAlgorithm,
	borderForContrast,
	BORDER_SEPARATION,
	DIVIDER_SEPARATION,
	SURFACE_SEPARATION,
	enforceContrastFloor,
	settlePass,
	runPipeline,
	registerToNodes,
	buildPassContext,
	TOKEN_CATEGORIES,
	DEFAULT_ANCHORS,
	SHARED_KNOBS,
	contrast,
	formatCss,
	oklch,
	toOklchColor,
	withLightness,
	type OklchColor,
	type PresetDefaults,
	type PresetAnchors,
};
import type {
	DeriveOptions,
	Invariant,
	InvariantContext,
	InvariantResult,
	KnobSpec,
	Pass,
	PassContext,
	TokenCategories,
	TokenName,
	TraceSnapshot,
} from "./types.js";

/**
 * The mod-side authoring surface. An algorithm mod imports these from
 * `@xtyle/core/authoring`, calls one, and the helper registers the `graph` /
 * `manifest` / `invariants` exports the host invokes — so a mod never touches
 * the raw `xript.exports.register` plumbing or the host's invariant-count
 * bookkeeping. esbuild inlines whatever the helper pulls in, so the built mod
 * stays a self-contained script.
 */

declare const xript: {
	exports: { register(name: string, fn: (...args: unknown[]) => unknown): void };
};

/** The color binding the host injects into the sandbox (gated by `color-math`). */
declare const cuti: Cuti;

type Lineage = { name: TokenName; value?: string; refs?: TokenName[] };

function toLineage(nodes: TokenNode[]): Lineage[] {
	return nodes.map(({ name, value, refs }) =>
		refs && refs.length ? { name, value, refs } : { name, value },
	);
}

function registerExports(
	graph: (input: DeriveOptions) => TokenNode[],
	traced: (input: DeriveOptions) => TraceSnapshot[],
	manifest: {
		produces: TokenName[];
		categories: TokenCategories;
		knobs: string[];
		knobSpecs: KnobSpec[];
		passNames: string[];
	},
	invariants: Invariant[],
): void {
	xript.exports.register("graph", (...args: unknown[]) =>
		toLineage(graph((args[0] as DeriveOptions) ?? {})),
	);
	xript.exports.register("traced", (...args: unknown[]): TraceSnapshot[] =>
		traced((args[0] as DeriveOptions) ?? {}),
	);
	xript.exports.register("manifest", () => ({ ...manifest, invariantCount: invariants.length }));
	xript.exports.register("invariants", (...args: unknown[]): InvariantResult[] =>
		invariants.map((invariant) => invariant(args[0] as InvariantContext)),
	);
}

function tracePreset(
	preset: PresetDefaults,
	buildPasses: (preset: PresetDefaults, input: DeriveOptions) => Pass[],
	input: DeriveOptions,
): TraceSnapshot[] {
	return runPipeline(buildPasses(preset, input), (passIndex) =>
		buildPassContext(preset, input, passIndex),
	).trace;
}

/* ── tier 1: a xtyle-family preset ──────────────────────────────────────────
 * Declare taste; the shared xtyle derivation does the rest. `xtyle-default` is
 * the default vector, so its whole definition is `{ id: "xtyle-default" }`.
 */

export interface XtyleAlgorithmSpec {
	id: string;
	anchors?: PresetAnchors;
	knobs?: string[];
	/** Domain specs for any knob not in the shared registry — a novel knob this algorithm introduces. */
	knobSpecs?: KnobSpec[];
	contrast?: { floor?: number; textOnFill?: number };
	vibrancy?: number;
	chroma?: {
		accent?: number;
		status?: number;
		palette?: number;
		neutral?: number;
		accentTint?: number;
	};
	elevation?: { strength?: number; alphaBoost?: number };
	/** The accent-family posture this algorithm ships with — `fan` (default), `step`, `shade`, or `duo`
	 * (see {@link AccentStrategy}). It is the *default* for the `accentStrategy` knob, not a lock: a
	 * theme can override it, so this names the taste rather than fixing it. */
	accentStrategy?: AccentStrategy;
	extreme?: boolean;
	/**
	 * The ordered passes for one derivation. Absent means the algorithm is single-pass
	 * (the shared xtyle `settle` derivation). A multi-pass family algorithm typically
	 * begins with `settle` and layers register→register transforms after it.
	 */
	passes?: (preset: PresetDefaults, input: DeriveOptions) => Pass[];
}

export function toPreset(spec: XtyleAlgorithmSpec): PresetDefaults {
	const chroma = spec.chroma ?? {};
	const elevation = spec.elevation ?? {};
	const contrast = spec.contrast ?? {};
	const preset: PresetDefaults = {
		id: spec.id,
		knobs: spec.knobs ?? SHARED_KNOBS,
		knobSpecs: spec.knobSpecs,
		// Merge over the full default so a spec that names only some anchors (e.g. just `bg` and
		// `accent`) still yields a complete `bg`/`fg` default — derivation reads both, so a partial
		// `defaultAnchors` would crash when invoked with no anchor overrides.
		defaultAnchors: spec.anchors ? { ...DEFAULT_ANCHORS, ...spec.anchors } : DEFAULT_ANCHORS,
		contrastFloor: contrast.floor ?? 4.7,
		declaredTextOnFillFloor: contrast.textOnFill ?? 4.5,
		defaultVibrancy: spec.vibrancy ?? 0.5,
		accentChromaMul: chroma.accent ?? 1,
		statusChromaMul: chroma.status ?? 1,
		paletteChromaMul: chroma.palette ?? 1,
		neutralChroma: chroma.neutral ?? 0.01,
		elevationStrengthMul: elevation.strength ?? 1,
		elevationAlphaBoost: elevation.alphaBoost ?? 0,
		accentTintChromaMul: chroma.accentTint ?? 0.3,
	};
	if (spec.accentStrategy) preset.accentStrategy = spec.accentStrategy;
	if (spec.extreme) preset.extreme = true;
	return preset;
}

export function defineXtyleAlgorithm(spec: XtyleAlgorithmSpec): void {
	const preset = toPreset(spec);
	const buildPasses =
		spec.passes ?? ((p: PresetDefaults, input: DeriveOptions) => [settlePass(p, input)]);
	const singlePass = buildPasses(preset, {}).length === 1;
	const finalNodes = (input: DeriveOptions): TokenNode[] =>
		singlePass
			? buildGraph(preset, input)
			: registerToNodes(
					runPipeline(buildPasses(preset, input), (passIndex) =>
						buildPassContext(preset, input, passIndex),
					).register,
				);
	registerExports(
		finalNodes,
		(input) => tracePreset(preset, buildPasses, input),
		{
			produces: PRODUCED_TOKENS,
			categories: TOKEN_CATEGORIES,
			knobs: preset.knobs,
			knobSpecs: resolveKnobSpecs(preset.knobs, preset.knobSpecs),
			passNames: buildPasses(preset, {}).map((pass) => pass.name),
		},
		makeInvariants(preset),
	);
}

/* ── tier 2: a from-scratch algorithm ──────────────────────────────────────
 * Own the derivation. `derive` returns the token graph; reach for `cuti` color
 * primitives through the context. This is the surface a third-party author uses.
 */

export interface DeriveContext {
	cuti: Cuti;
}

export interface AlgorithmSpec {
	id: string;
	produces: TokenName[];
	categories: TokenCategories;
	knobs: string[];
	/** Domain specs for any knob not in the shared registry — a novel knob this algorithm introduces. */
	knobSpecs?: KnobSpec[];
	/** A single derivation, sugar for a one-pass pipeline. Mutually exclusive with `passes`. */
	derive?(input: DeriveOptions, ctx: DeriveContext): TokenNode[];
	/** The ordered pipeline. The author lists every pass; the first receives an empty register. */
	passes?: Pass[];
	invariants?: Invariant[];
}

function tier2Context(input: DeriveOptions, passIndex: number): PassContext {
	const knobs = input.knobs ?? {};
	return {
		knobs,
		scheme: knobs.scheme ?? "dark",
		pinned: input.constraints ?? {},
		passIndex,
	};
}

export function defineAlgorithm(spec: AlgorithmSpec): void {
	const passes = spec.passes;
	const finalNodes = (input: DeriveOptions): TokenNode[] => {
		if (passes) {
			const { register } = runPipeline(passes, (passIndex) => tier2Context(input, passIndex));
			return registerToNodes(register);
		}
		return (spec.derive as NonNullable<AlgorithmSpec["derive"]>)(input, { cuti });
	};
	const trace = (input: DeriveOptions): TraceSnapshot[] => {
		if (passes) {
			return runPipeline(passes, (passIndex) => tier2Context(input, passIndex)).trace;
		}
		const nodes = (spec.derive as NonNullable<AlgorithmSpec["derive"]>)(input, { cuti });
		return [{ name: "derive", register: resolveGraph(nodes) }];
	};
	registerExports(
		finalNodes,
		trace,
		{
			produces: spec.produces,
			categories: spec.categories,
			knobs: spec.knobs,
			knobSpecs: resolveKnobSpecs(spec.knobs, spec.knobSpecs),
			passNames: passes ? passes.map((pass) => pass.name) : ["derive"],
		},
		spec.invariants ?? [],
	);
}
