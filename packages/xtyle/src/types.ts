export type TokenName = string;

export type TokenRegister = Record<TokenName, string>;

/** The three colors most commonly provided up front — purely a convenience grouping for the CLI's
 * flags and the gauntlet's seed reporting. Not a derive input: every value reaches `derive` through
 * the one token channel (`--bg-0` / `--fg-0` / `--accent`), with nothing privileged about the trio. */
export interface Seeds {
	bg?: string;
	fg?: string;
	accent?: string;
}

export type Scheme = "dark" | "light";

export type Density = "compact" | "normal" | "comfortable";

export interface FontStacks {
	sans?: string;
	mono?: string;
	display?: string;
}

/**
 * How `--accent-2/3/4` relate to `--accent` — the one input that reshapes the accent family itself
 * rather than tuning it.
 *
 * - `fan` — 2/3 flank the accent by ∓`accentSplit`, 4 is its complement. Constant lightness/chroma.
 * - `step` — each accent is one `accentShiftStep` rotation past the last, an even walk of the wheel.
 * - `shade` — one hue in four depths: 2/3/4 hold the accent's hue and step its lightness.
 * - `duo` — two brand anchors. `--accent` and `--accent-2` are both *inputs*; 3 and 4 are their
 *   shades, placed against the pair's mean lightness so the two ramps read as one system.
 */
export type AccentStrategy = "fan" | "step" | "shade" | "duo";

export interface Knobs {
	scheme?: Scheme;
	accentShiftStep?: number;
	accentSplit?: number;
	/** Which accent family to build — see {@link AccentStrategy}. Unset takes the algorithm's own taste. */
	accentStrategy?: AccentStrategy;
	/**
	 * Signed per-step lightness delta the surface stack walks from `--bg-0`: positive ascends the
	 * ramp (each surface lighter than the last), negative descends it (each darker). Governs the whole
	 * stack — `--body-bg`, `--bg-1/2/3`, and `--bg-sunken` — off one number, so flipping the ramp's
	 * direction no longer means hand-pinning every surface. Unset resolves to the algorithm's
	 * scheme-derived default (dark ascends, light descends), so out-of-box output is unchanged.
	 */
	surfaceRamp?: number;
	contrastBand?: "aa" | "aaa" | number;
	vibrancy?: number;
	typeScale?: number;
	radiusScale?: number;
	density?: Density | number;
	cues?: "color" | "redundant";
	fonts?: FontStacks;
	hour?: number;
	[knob: string]: unknown;
}

/**
 * Author-pinned token values. Honored verbatim in the output, and — where the
 * algorithm supports it — fed back in as derivation inputs so dependent tokens
 * re-solve around the pin (e.g. pinning `--bg-0` re-derives `--fg-0` to keep
 * contrast). Pinning a token the algorithm itself derives is an explicit opt-out
 * of that token's own invariant.
 */
export type Constraints = TokenRegister;

/**
 * The friendly seed shape: bg / fg / accent (plus arbitrary `overrides`) named as
 * anchors instead of raw token keys. The `derive` entry translates these into
 * `constraints` (`bg` → `--bg-0`, `fg` → `--fg-0`, `accent` → `--accent`) before
 * derivation, so `{ anchors: { accent } }` seeds the same channel a pinned
 * `{ constraints: { "--accent": … } }` does. An explicit `constraints` entry for the
 * same token wins over the anchor.
 */
export interface AnchorSeed {
	bg?: string;
	fg?: string;
	accent?: string;
	overrides?: Record<string, string>;
}

export interface DeriveOptions {
	knobs?: Knobs;
	constraints?: Constraints;
	anchors?: AnchorSeed;
}

/**
 * The shape of a token's value, used to apply the right validity and structural
 * check per token. Color tokens parse as OKLCH; the rest never do — `--font-sans`,
 * `--duration-fast`, `--text-lg`, `--elevation-2` are font / duration / length /
 * shadow strings and would throw or NaN if parsed as a color.
 */
export type TokenCategory =
	| "color"
	| "length"
	| "number"
	| "font"
	| "shadow"
	| "duration"
	| "easing"
	| "keyword";

export type TokenCategories = Record<TokenName, TokenCategory>;

export interface InvariantContext {
	register: TokenRegister;
	knobs: Knobs;
	scheme: Scheme;
	categories: TokenCategories;
	constraints: Constraints;
}

export interface InvariantResult {
	name: string;
	ok: boolean;
	detail?: string;
}

export type Invariant = (ctx: InvariantContext) => InvariantResult;

export interface TokenLineageNode {
	name: TokenName;
	value?: string;
	refs?: TokenName[];
}

/**
 * The inputs a pass reads about the current derivation, resolved once from the
 * provided token values and knobs. Distinct from {@link DeriveOptions} (the raw,
 * partially-specified request): a `PassContext` is the resolved view — `scheme`
 * decided, the pinned constraints isolated so a pass can leave them verbatim.
 * `passIndex` is the pass's zero-based position in the pipeline.
 */
export interface PassContext {
	knobs: Knobs;
	scheme: Scheme;
	pinned: Constraints;
	passIndex: number;
}

/**
 * One named stage in an algorithm's derivation pipeline. `run` receives the
 * register produced so far and returns the register after this stage. The first
 * pass receives an empty register and produces the base; each later pass transforms
 * the register it is handed. Passes are pure register→register transforms — the
 * aesthetic decisions a pass encodes are algorithm policy, never engine mechanism.
 */
export interface Pass {
	name: string;
	run: (register: TokenRegister, ctx: PassContext) => TokenRegister;
}

/** A single pass's output, captured for tracing. */
export interface TraceSnapshot {
	name: string;
	register: TokenRegister;
}

/** The result of a traced derivation: the final register plus every intermediate snapshot. */
export interface DeriveTrace {
	register: TokenRegister;
	trace: TraceSnapshot[];
}

/** How a knob's control is rendered — the algorithm's *domain*, not the site's cosmetics. */
export type KnobKind = "select" | "range" | "text";

/** One option a `select` knob accepts. `label` is an optional display hint; a consumer may override it. */
export interface KnobOption {
	value: string;
	label?: string;
}

/**
 * The valid-input *domain* an algorithm declares for one knob — kind, range, and options.
 * This is the algorithm's contract (what values it accepts and how they're shaped), distinct
 * from a consumer's cosmetic concerns (a localized label, a unit suffix, digit precision), which
 * stay with the consumer. A consumer renders a knob's control from this declaration, so a novel
 * algorithm's knob self-renders instead of vanishing for want of a hardcoded UI entry. Composite
 * groups a consumer expands itself (anchor pickers, font stacks) carry no `KnobSpec` — those are
 * orchestration, not a single scalar control.
 */
export interface KnobSpec {
	/** The knob name — a `Knobs` key, matched against {@link Algorithm.knobs}. */
	name: string;
	kind: KnobKind;
	/** A short human label hint. A consumer may override for localization; falls back to a humanized `name`. */
	label?: string;
	/** Logical grouping for a consumer that sections its controls. Defaults to `name`. */
	group?: string;
	/** The value the knob takes when first switched on from its default. */
	default?: string | number;
	/** `range` domain. */
	min?: number;
	max?: number;
	step?: number;
	/** `select` domain — the accepted values. */
	options?: KnobOption[];
	/** A unit suffix intrinsic to the value (e.g. `°` for a hue step). */
	unit?: string;
}

export interface Algorithm {
	id: string;
	produces: TokenName[];
	knobs: string[];
	/**
	 * The rendered domain of each scalar knob this algorithm reads — kind, range, options — so a
	 * consumer's editing surface renders from the algorithm's own declaration rather than a hardcoded
	 * table. A subset of {@link knobs}: composite groups a consumer expands itself (`anchors`, `fonts`)
	 * carry no spec. Resolved from the shared registry for blessed knobs; a novel knob supplies its own.
	 */
	knobSpecs: KnobSpec[];
	categories: TokenCategories;
	derive(opts: DeriveOptions): TokenRegister;
	/**
	 * The honest derivation graph for a given input: the same nodes `derive` resolves,
	 * with each token's `refs` naming what it derives from. `resolveGraph(lineage(opts))`
	 * reproduces `derive(opts)`. Built for inspectors and the CLI to read lineage as data.
	 */
	lineage(opts?: DeriveOptions): TokenLineageNode[];
	invariants: Invariant[];
	/**
	 * The ordered, named stages `derive` threads the register through. Absent means the
	 * algorithm is implicitly a single-pass pipeline whose one pass is `derive`. On a
	 * baked algorithm each pass's `run` is callable; on a host facade the passes are
	 * name-only stubs (closures cannot cross the sandbox — use `deriveTraced` for layers).
	 */
	passes?: Pass[];
	/**
	 * Like `derive`, but retains every intermediate register snapshot. The last
	 * snapshot's register equals `derive(opts)`. Absent on a bare 1-pass algorithm,
	 * in which case the engine's top-level `deriveTraced` synthesizes a single snapshot.
	 */
	deriveTraced?(opts: DeriveOptions): DeriveTrace;
}

export type EmitFormat = "css" | "json" | "prism" | "monaco" | "terminal";

export type Emitter = (register: TokenRegister) => string;

export interface CoverageResult {
	covered: boolean;
	missing: TokenName[];
}
