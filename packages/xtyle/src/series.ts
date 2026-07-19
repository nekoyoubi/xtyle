import type { TokenRegister } from "./types.js";
import { toOklchColor, oklch, formatCss, clampToGamut, hueDelta } from "./color.js";

/**
 * A named palette: an ordered set of **stops** off the derived register, so any theme charts
 * coherently out of the box. Discrete-vs-continuous is not a property of a palette, it is a property
 * of how you ask for it — every palette answers both questions. Ask for N colors (`seriesPalette`)
 * and the stops are sampled; ask for a scale (`rampColor`, `rampGradientStops`) and they are
 * interpolated in OKLCH. An explicit `string[]` overrides all of this with the caller's own stops;
 * because those strings land straight into the SVG `fill`, `var(--token)` references survive verbatim
 * and resolve against `:root` at paint time, so exact or theme-token colors pin cleanly.
 *
 * - `accents` — the accent family, taken in order.
 * - `skittles` — the nine named hues, spread for maximum separation.
 * - `statuses` — the semantic outcome set (success / failed / warn / info / skipped / live).
 * - `thermal` — cold to hot: blue → cyan → yellow → red.
 * - `severity` — good to bad: success → warn → danger.
 * - `intensity` — surface to accent: a faint-to-accent wash.
 *
 * For `statuses` on a dataset where a category can be absent, prefer `seriesColorsFor` with a
 * per-datum `tone`: positional sampling pins by index, so a filtered-out category shifts every
 * survivor's tone.
 */
export type Palette = "accents" | "skittles" | "statuses" | "thermal" | "severity" | "intensity";

/**
 * How N discrete colors come off a palette's stops.
 *
 * - `ordered` — take the stops in their authored order, cycling past the end.
 * - `spread` — take evenly-spaced stops, endpoints included, for maximum separation.
 * - `interpolate` — walk the stops in OKLCH across exactly N steps.
 */
export type PaletteSampling = "ordered" | "spread" | "interpolate";

export interface PaletteSpec {
	/** The palette's stops in order: register token names (`--accent`) or literal color strings. Stop
	 * locations are equidistant; a ramp interpolates between neighbors in OKLCH. */
	stops: string[];
	/** How a request for N discrete colors is answered off `stops`. */
	sampling: PaletteSampling;
}

/**
 * The semantic status tones behind the `statuses` palette: the outcome→register-token map, named so a
 * discrete-status chart can pin each datum to its meaning *by name* rather than by position. Positional
 * sampling mis-colors the moment a category is absent (a filtered zero-value slice shifts every survivor
 * down a tone); a `tone` key resolved through this map is stable under filtering.
 */
export const STATUS_TONES = {
	success: "--success",
	failed: "--danger",
	warn: "--warn",
	info: "--info",
	skipped: "--neutral",
	live: "--accent",
} as const;

/** A named outcome in the `statuses` palette, usable as a datum's `tone` for by-name coloring. */
export type StatusTone = keyof typeof STATUS_TONES;

export const STATUS_TONE_KEYS: readonly StatusTone[] = Object.keys(STATUS_TONES) as StatusTone[];

/** Every built-in palette, as its stop list plus the policy for sampling N discrete colors off it. The
 * single table both the discrete and the continuous paths resolve through. */
export const PALETTE_SPECS: Record<Palette, PaletteSpec> = {
	accents: { stops: ["--accent", "--accent-2", "--accent-3", "--accent-4", "--neutral"], sampling: "ordered" },
	skittles: {
		stops: ["--red", "--orange", "--yellow", "--green", "--blue", "--purple", "--brown", "--pink", "--cyan"],
		sampling: "spread",
	},
	statuses: { stops: [...Object.values(STATUS_TONES)], sampling: "ordered" },
	thermal: { stops: ["--blue", "--cyan", "--yellow", "--red"], sampling: "interpolate" },
	severity: { stops: ["--success", "--warn", "--danger"], sampling: "interpolate" },
	intensity: { stops: ["--bg-2", "--accent"], sampling: "interpolate" },
};

/** The built-in palette names, in presentation order. The one list every picker, manifest `options`
 * array, and name validator reads, so a palette added here needs no edit anywhere else. */
export const PALETTES: readonly Palette[] = ["accents", "skittles", "statuses", "thermal", "severity", "intensity"];

/** The palette every unknown name falls back to for a discrete ask. */
const DEFAULT_PALETTE: Palette = "accents";

/** The palette every unknown name falls back to for a continuous ask. */
const DEFAULT_RAMP: Palette = "intensity";

/**
 * Retired palette names, each mapped to its current one. These are *renames*, not merges: `status` was
 * the good-to-bad gradient (now `severity`) and `accent` was the surface-to-accent wash (now
 * `intensity`). Neither is an alias of the similarly-named `statuses` or `accents` palette, which are
 * different sets of stops entirely.
 */
const PALETTE_ALIASES: Record<string, Palette> = {
	status: "severity",
	accent: "intensity",
};

const warnedAliases = new Set<string>();

function warnAlias(from: string, to: Palette): void {
	if (warnedAliases.has(from)) return;
	warnedAliases.add(from);
	globalThis.console?.warn?.(`xtyle: the "${from}" palette was renamed to "${to}"; update the value.`);
}

/**
 * Resolves a palette name to its canonical form, honoring the deprecated aliases (`status` → `severity`,
 * `accent` → `intensity`) with a one-time console warning. Returns `null` for a name that is neither.
 * The single validator every consumer shares.
 */
export function resolvePalette(name: string): Palette | null {
	if (name in PALETTE_SPECS) return name as Palette;
	const alias = PALETTE_ALIASES[name];
	if (!alias) return null;
	warnAlias(name, alias);
	return alias;
}

/** Whether `name` is a usable palette name, current or deprecated. */
export function isPalette(name: string): boolean {
	return resolvePalette(name) !== null;
}

const warnedPalettes = new Set<string>();

/**
 * The typo-catching wrapper, for the accessors where an unrecognized name means the author misspelled
 * a palette rather than legitimately meaning "none". A bad key here never reaches a class name and
 * never throws — it renders the fallback's colors — so the failure is quieter than the class-name
 * one and just as undiscoverable: `colors="therml"` draws `accents` and nobody finds out.
 *
 * {@link resolvePalette} itself stays silent on purpose. A `null` from it is a normal outcome for an
 * unset Progress ramp and for the icon flag parser probing whether a token happens to name a palette,
 * so warning there would fire on correct code.
 */
export function resolvePaletteName(value: string | null | undefined, fallback: Palette, label: string): Palette {
	if (value === null || value === undefined || value === "") return fallback;
	const resolved = resolvePalette(value);
	if (resolved) return resolved;
	if (!warnedPalettes.has(value)) {
		warnedPalettes.add(value);
		globalThis.console?.warn?.(
			`xtyle: "${value}" is not a valid ${label}. Valid palettes are ${PALETTES.join(", ")}. Falling back to "${fallback}".`,
		);
	}
	return fallback;
}

/** The stop list for a palette or an explicit color array, as authored (token names unresolved). */
export function paletteStops(palette: Palette | string | string[], fallback: Palette = DEFAULT_PALETTE): string[] {
	if (Array.isArray(palette)) return [...palette];
	const resolved = resolvePalette(palette) ?? fallback;
	return [...(PALETTE_SPECS[resolved] as PaletteSpec).stops];
}

/**
 * Every register token a built-in palette reads. A browser consumer that only has the applied CSS custom
 * properties (no derived register) reads these off the document to reconstruct the minimal register the
 * palette functions need.
 */
export const PALETTE_TOKENS: readonly string[] = [
	...new Set(Object.values(PALETTE_SPECS).flatMap((spec) => spec.stops.filter((stop) => stop.startsWith("--")))),
];

/** @deprecated Use {@link Palette}. */
export type SeriesScheme = Palette;
/** @deprecated Use {@link Palette}. */
export type RampScheme = Palette;
/** @deprecated Use {@link PALETTES}. */
export const SERIES_SCHEMES: readonly Palette[] = PALETTES;
/** @deprecated Use {@link PALETTES}. */
export const RAMP_SCHEMES: readonly Palette[] = PALETTES;
/** @deprecated Use {@link PALETTE_TOKENS}. */
export const SERIES_TOKENS: readonly string[] = PALETTE_TOKENS;
/** @deprecated Use {@link PALETTE_TOKENS}. */
export const RAMP_TOKENS: readonly string[] = PALETTE_TOKENS;

/** Resolves the register color for a named status `tone`; `undefined` for an unknown key. The by-name
 * companion to the positional `statuses` palette. */
export function statusToneColor(tone: string, register: TokenRegister): string | undefined {
	const token = STATUS_TONES[tone as StatusTone];
	return token ? register[token] : undefined;
}

function resolve(tokens: string[], register: TokenRegister): string[] {
	return tokens.map((name) => register[name] ?? (name.startsWith("--") ? undefined : name)).filter((value): value is string => Boolean(value));
}

/** Evenly spaced indices into a `length`-long array, endpoints included, for `count` picks. */
function evenIndices(length: number, count: number): number[] {
	if (count <= 1) return [0];
	return Array.from({ length: count }, (_, i) => Math.round((i * (length - 1)) / (count - 1)));
}

function picked(colors: string[], count: number, ordered: boolean): string[] {
	if (count <= 0 || colors.length === 0) return [];
	if (count > colors.length) {
		return Array.from({ length: count }, (_, i) => colors[i % colors.length] as string);
	}
	const indices = ordered
		? Array.from({ length: count }, (_, i) => i)
		: evenIndices(colors.length, count);
	return indices.map((i) => colors[i] as string);
}

function lerpOklch(from: string, to: string, t: number): string {
	const a = toOklchColor(from);
	const b = toOklchColor(to);
	const h = a.h + hueDelta(a.h, b.h) * t;
	const mixed = oklch(a.l + (b.l - a.l) * t, a.c + (b.c - a.c) * t, ((h % 360) + 360) % 360);
	return formatCss(clampToGamut(mixed));
}

function clamp01(t: number): number {
	return t < 0 ? 0 : t > 1 ? 1 : Number.isFinite(t) ? t : 0;
}

/** The color at normalized position `t` along a resolved stop list, interpolated in OKLCH between the
 * two stops it falls between. The one primitive behind every continuous read *and* every interpolated
 * discrete sample. */
function sampleStops(stops: string[], t: number): string {
	if (stops.length === 0) return "currentColor";
	if (stops.length === 1) return stops[0] as string;
	const segments = stops.length - 1;
	const pos = clamp01(t) * segments;
	const seg = Math.min(Math.floor(pos), segments - 1);
	return lerpOklch(stops[seg] as string, stops[seg + 1] as string, pos - seg);
}

/** N colors walked across the stops. A lone color takes the true midpoint of the walk, the same color
 * `rampColor(0.5)` reads, so a one-series chart and a ramp read at its halfway mark agree. */
function interpolated(stops: string[], count: number): string[] {
	if (count <= 0 || stops.length === 0) return [];
	if (stops.length === 1) return Array.from({ length: count }, () => stops[0] as string);
	if (count === 1) return [sampleStops(stops, 0.5)];
	return Array.from({ length: count }, (_, i) => sampleStops(stops, i / (count - 1)));
}

export interface SeriesPaletteOptions {
	/** Flip the palette end for end: a ramp runs the other way (hot to cold), a discrete set runs in
	 * reverse order. Every palette is reversible. */
	reverse?: boolean;
}

/** The default drop-shadow blur (in px) a full-strength glow cell reaches. */
export const GLOW_MAX_BLUR = 7;

/**
 * The drop-shadow `filter` value for a heatmap cell's secondary glow channel at normalized
 * intensity `t` (0..1), rendered in `color` with a full-strength blur of `maxBlur` px. Returns
 * `null` at or below zero so a cell with no glow renders no filter at all. The visual sibling of
 * `rampColor`: where the ramp drives a cell's fill by one metric, the glow drives a halo around it
 * by a second, so one grid can carry two signals. `maxBlur` tunes the halo's reach so it reads on a
 * dense grid without bleeding into neighbors on a sparse one.
 */
export function glowFilter(t: number, color: string, maxBlur: number = GLOW_MAX_BLUR): string | null {
	const clamped = clamp01(t);
	if (clamped <= 0) return null;
	const blur = (clamped * maxBlur).toFixed(1);
	return `drop-shadow(0 0 ${blur}px ${color})`;
}

/**
 * Resolves a single color at normalized position `t` (0..1) along a palette read as a continuous ramp:
 * a built-in {@link Palette} derived off the register, or an explicit list of stop colors, interpolated
 * in OKLCH. `reverse` flips the ramp. The continuous sibling of `seriesPalette` — same stops, different
 * question: a scalar intensity rather than N discrete series.
 */
export function rampColor(
	palette: Palette | string[],
	t: number,
	register: TokenRegister,
	options: SeriesPaletteOptions = {},
): string {
	const stops = resolve(paletteStops(palette, DEFAULT_RAMP), register);
	if (stops.length <= 1) return stops[0] ?? "currentColor";
	const clamped = clamp01(t);
	return sampleStops(stops, options.reverse ? 1 - clamped : clamped);
}

/**
 * The ordered stop list for a palette as CSS values, for a pure-CSS `linear-gradient` sweep that needs
 * no register: register token names become `var(--token)` references (resolved against the cascade at
 * paint, so the gradient recolors with the theme and survives SSR with zero JS), explicit color
 * strings pass through verbatim. `reverse` flips the order. The SSR-safe sibling of `rampColor`:
 * where `rampColor` samples one color at a position (needing the resolved register), this hands back
 * the whole scale for the browser to interpolate.
 */
export function rampGradientStops(
	palette: Palette | string[],
	options: SeriesPaletteOptions = {},
): string[] {
	const stops = paletteStops(palette, DEFAULT_RAMP).map((s) => (s.startsWith("--") ? `var(${s})` : s));
	return options.reverse ? stops.reverse() : stops;
}

/**
 * Resolves `count` series colors for a chart. Pass a built-in {@link Palette} to derive them from the
 * active theme's register, or a `string[]` to use explicit colors. How the stops become N colors is the
 * palette's own `sampling` policy: `accents` and `statuses` take their stops in order, `skittles` spreads
 * for separation, and `thermal` / `severity` / `intensity` walk the stops in OKLCH across exactly `count`
 * steps. Set `reverse` to flip any palette end for end.
 */
export function seriesPalette(
	palette: Palette | string[],
	count: number,
	register: TokenRegister,
	options: SeriesPaletteOptions = {},
): string[] {
	let colors: string[];
	if (Array.isArray(palette)) {
		colors = picked(palette, count, true);
	} else {
		const spec = PALETTE_SPECS[resolvePalette(palette) ?? DEFAULT_PALETTE] as PaletteSpec;
		const stops = resolve(spec.stops, register);
		colors = spec.sampling === "interpolate" ? interpolated(stops, count) : picked(stops, count, spec.sampling === "ordered");
	}
	return options.reverse ? colors.reverse() : colors;
}

/** The intensity ceiling a full-strength cell maps to: an explicit positive `max`, else the matrix's
 * own largest finite value (never below 1, so an all-zero matrix stays well-defined). Shared by every
 * heat-grid path so the element, the SSR bake, and the categorical helper all normalize the same way. */
export function matrixCeiling(matrix: number[][], explicit?: number): number {
	if (explicit && explicit > 0) return explicit;
	return Math.max(1, ...matrix.flatMap((row) => row.map((v) => (Number.isFinite(v) ? v : 0))));
}

/** Zips a categorical grid's per-category hues with their axis labels into the legend the key renders. */
export function categoricalLegend(hues: string[], labels: readonly string[]): { color: string; label: string }[] {
	return hues.map((color, i) => ({ color, label: labels[i] ?? "" }));
}

export interface CategoricalHeatOptions {
	/** Which axis carries the categories: `col` (default) colors each column a distinct hue, `row` each row. */
	axis?: "col" | "row";
	/** Flip the categorical palette end for end, so the category order runs the other way. */
	reverse?: boolean;
	/** The intensity ceiling a full-fill cell maps to; defaults to the data's own maximum. */
	max?: number;
}

/**
 * Colors a categorical heat-grid: each category (a column by default, or a row) takes a distinct color
 * from a {@link Palette}, and every cell blends from the neutral surface (`--bg-2`) to its category's
 * hue by intensity, so one grid reads category by hue and magnitude by fill at once. This is the
 * categorical sibling of the `rampColor` path: where a ramp washes one palette by value, this hands each
 * category its own hue and washes within it. Returns the row-major cell-color matrix parallel to
 * `values` and the per-category `hues` (for a legend), both resolved off `register`.
 */
export function categoricalHeatColors(
	palette: Palette | string[],
	values: number[][],
	register: TokenRegister,
	options: CategoricalHeatOptions = {},
): { cellColors: string[][]; hues: string[] } {
	const axis = options.axis === "row" ? "row" : "col";
	const nCols = values.reduce((max, row) => Math.max(max, row.length), 0);
	const count = axis === "col" ? nCols : values.length;
	const hues = seriesPalette(palette, count, register, { reverse: options.reverse });
	const base = register["--bg-2"];
	const ceiling = matrixCeiling(values, options.max);
	const cellColors = values.map((row, r) =>
		row.map((v, c) => {
			const hue = hues[axis === "col" ? c : r];
			if (!hue) return "currentColor";
			const t = (Number.isFinite(v) ? v : 0) / ceiling;
			return base ? rampColor([base, hue], t, register) : hue;
		}),
	);
	return { cellColors, hues };
}

/**
 * Resolves a color per data item, honoring an optional semantic `tone` key when the palette supports
 * by-name mapping. Under `statuses`, an item carrying a known `tone` pins to that outcome's token
 * directly, so filtering an absent category out never shifts the meaning→tone mapping (positional
 * sampling's failure mode). Items without a `tone`, an explicit `string[]`, and every other palette fall
 * back to positional `seriesPalette`; the count-based call stays right when items carry no semantics.
 */
export function seriesColorsFor(
	palette: Palette | string[],
	items: readonly { tone?: string }[],
	register: TokenRegister,
	options: SeriesPaletteOptions = {},
): string[] {
	const positional = seriesPalette(palette, items.length, register, options);
	if (Array.isArray(palette) || resolvePalette(palette) !== "statuses") return positional;
	return items.map((item, i) => {
		const named = item.tone ? statusToneColor(item.tone, register) : undefined;
		return named ?? positional[i] ?? "currentColor";
	});
}
