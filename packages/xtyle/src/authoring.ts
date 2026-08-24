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
	PRODUCED_SINCE,
	PACK_SINCE,
	registerToNodes,
	resolveKnobSpecs,
	ringForContrast,
	runPipeline,
	settlePass,
	SHARED_KNOBS,
	statedSchemes,
	SURFACE_SEPARATION,
	TOKEN_CATEGORIES,
	type PresetAnchors,
	type PresetDefaults,
} from "./algorithms/factory.js";
import type { AccentStrategy, Scheme } from "./types.js";
import { SURFACE_ROLES } from "./vocab.js";
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
	ringForContrast,
	BORDER_SEPARATION,
	DIVIDER_SEPARATION,
	SURFACE_SEPARATION,
	enforceContrastFloor,
	settlePass,
	runPipeline,
	registerToNodes,
	buildPassContext,
	TOKEN_CATEGORIES,
	PRODUCED_TOKENS,
	DEFAULT_ANCHORS,
	SHARED_KNOBS,
	SURFACE_ROLES,
	contrast,
	formatCss,
	oklch,
	toOklchColor,
	withLightness,
	type OklchColor,
	type PresetDefaults,
	type PresetAnchors,
};
export type {
	DeriveOptions,
	KnobSpec,
	Pass,
	PassContext,
	TokenCategories,
	TokenName,
	TokenRegister,
} from "./types.js";
import type {
	AlgorithmDeclarations,
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

const WCAG_FOCUS_RING = 3;

function toLineage(nodes: TokenNode[]): Lineage[] {
	return nodes.map(({ name, value, refs }) =>
		refs && refs.length ? { name, value, refs } : { name, value },
	);
}

function registerExports(
	graph: (input: DeriveOptions) => TokenNode[],
	traced: (input: DeriveOptions) => TraceSnapshot[],
	manifest: {
		since?: string;
		produces: TokenName[];
		producedSince?: Readonly<Record<string, string>>;
		categories: TokenCategories;
		knobs: string[];
		knobSpecs: KnobSpec[];
		passNames: string[];
		focusRingFloor?: number;
		schemes?: Scheme[];
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
	/**
	 * The anchors this algorithm starts from. Partial on purpose: whatever is named here merges over
	 * the standard pair, so an algorithm that only has an opinion about the accent says only that.
	 */
	anchors?: Partial<PresetAnchors>;
	/**
	 * An anchor pair for a scheme other than the one {@link anchors} lands in, so an algorithm can
	 * answer for both halves of a theme rather than only the half its default pair describes.
	 *
	 * Optional. Absent, asking for the other scheme flips the default pair's lightness and lands on a
	 * mid-gray page.
	 */
	anchorsByScheme?: Partial<Record<Scheme, Partial<PresetAnchors>>>;
	knobs?: string[];
	/** Domain specs for any knob not in the shared registry — a novel knob this algorithm introduces. */
	knobSpecs?: KnobSpec[];
	/**
	 * Tokens this algorithm emits *beyond* the standard register, and the value kind each carries.
	 * The open register in its ordinary form: an extra pass that produces something new declares it
	 * here, which is how discovery lists the token and a consumer's coverage check finds it.
	 *
	 * Additive by construction: the standard set is always produced, because the components consume
	 * it. An algorithm that replaces the register rather than extending it is a `defineAlgorithm`
	 * (tier 2), which declares `produces` outright.
	 */
	adds?: { tokens: TokenName[]; categories: TokenCategories };
	contrast?: { floor?: number; textOnFill?: number; focusRing?: number };
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
		// INFO: merge over the full default so a spec naming only some anchors still yields complete
		// bg/fg; derivation reads both, so a partial defaultAnchors would crash with no anchor overrides
		defaultAnchors: spec.anchors ? { ...DEFAULT_ANCHORS, ...spec.anchors } : DEFAULT_ANCHORS,
		contrastFloor: contrast.floor ?? 4.7,
		declaredTextOnFillFloor: contrast.textOnFill ?? 4.5,
		declaredFocusRingFloor: contrast.focusRing ?? WCAG_FOCUS_RING,
		defaultVibrancy: spec.vibrancy ?? 0.5,
		accentChromaMul: chroma.accent ?? 1,
		statusChromaMul: chroma.status ?? 1,
		paletteChromaMul: chroma.palette ?? 1,
		neutralChroma: chroma.neutral ?? 0.01,
		elevationStrengthMul: elevation.strength ?? 1,
		elevationAlphaBoost: elevation.alphaBoost ?? 0,
		accentTintChromaMul: chroma.accentTint ?? 0.3,
	};
	if (spec.anchorsByScheme) {
		const byScheme: Partial<Record<Scheme, PresetAnchors>> = {};
		for (const [scheme, stated] of Object.entries(spec.anchorsByScheme)) {
			if (stated) byScheme[scheme as Scheme] = { ...preset.defaultAnchors, ...stated };
		}
		preset.anchorsByScheme = byScheme;
	}
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
			since: PACK_SINCE,
			produces: spec.adds ? [...new Set([...PRODUCED_TOKENS, ...spec.adds.tokens])] : PRODUCED_TOKENS,
			producedSince: PRODUCED_SINCE,
			categories: spec.adds ? { ...TOKEN_CATEGORIES, ...spec.adds.categories } : TOKEN_CATEGORIES,
			knobs: preset.knobs,
			knobSpecs: resolveKnobSpecs(preset.knobs, preset.knobSpecs),
			passNames: buildPasses(preset, {}).map((pass) => pass.name),
			focusRingFloor: preset.declaredFocusRingFloor,
			schemes: statedSchemes(preset),
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
	/** What this algorithm promises about its own output, for `auditRegister` to grade against. */
	declares?: AlgorithmDeclarations;
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
			...(spec.declares?.focusRingFloor !== undefined
				? { focusRingFloor: spec.declares.focusRingFloor }
				: {}),
		},
		spec.invariants ?? [],
	);
}
