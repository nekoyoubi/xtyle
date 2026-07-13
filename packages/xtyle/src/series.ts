import type { TokenRegister } from "./types.js";
import { toOklchColor, oklch, formatCss, clampToGamut, hueDelta } from "./color.js";

/**
 * A named way to color N chart series off the derived register, so any theme charts
 * coherently out of the box. Categorical schemes hand back visually separated hues from
 * the theme's own palette; sequential schemes interpolate a scale in OKLCH. `statuses` is
 * the categorical semantic set, one distinct tone per outcome, for discrete-status charts.
 * An explicit `string[]` overrides all of this with the caller's own colors; because those
 * strings land straight into the SVG `fill`, `var(--token)` references survive verbatim and
 * resolve against `:root` at paint time, so exact or theme-token colors pin cleanly. For `statuses`
 * on a dataset where a category can be absent, prefer `seriesColorsFor` with a per-datum `tone`: the
 * positional scheme pins by index, so a filtered-out category shifts every survivor's tone.
 */
export type SeriesScheme = "accents" | "skittles" | "statuses" | "thermal" | "status";

export const SERIES_SCHEMES: readonly SeriesScheme[] = [
	"accents",
	"skittles",
	"statuses",
	"thermal",
	"status",
];

/** Every register token the built-in schemes read. A browser consumer that only has the applied
 * CSS custom properties (no derived register) reads these off the document to reconstruct the
 * minimal register `seriesPalette` needs. */
export const SERIES_TOKENS: readonly string[] = [
	"--accent",
	"--accent-2",
	"--accent-3",
	"--accent-4",
	"--success",
	"--warn",
	"--danger",
	"--info",
	"--neutral",
	"--red",
	"--orange",
	"--yellow",
	"--green",
	"--blue",
	"--purple",
	"--brown",
	"--pink",
	"--cyan",
];

/**
 * The semantic status tones behind the `statuses` scheme: the outcome→register-token map, named so a
 * discrete-status chart can pin each datum to its meaning *by name* rather than by position. The
 * positional scheme mis-colors the moment a category is absent (a filtered zero-value slice shifts
 * every survivor down a tone); a `tone` key resolved through this map is stable under filtering.
 */
export const STATUS_TONES = {
	success: "--success",
	failed: "--danger",
	warn: "--warn",
	info: "--info",
	skipped: "--neutral",
	live: "--accent",
} as const;

/** A named outcome in the `statuses` scheme, usable as a datum's `tone` for by-name coloring. */
export type StatusTone = keyof typeof STATUS_TONES;

export const STATUS_TONE_KEYS: readonly StatusTone[] = Object.keys(STATUS_TONES) as StatusTone[];

/** Resolves the register color for a named status `tone`; `undefined` for an unknown key. The by-name
 * companion to the positional `statuses` scheme. */
export function statusToneColor(tone: string, register: TokenRegister): string | undefined {
	const token = STATUS_TONES[tone as StatusTone];
	return token ? register[token] : undefined;
}

/** Categorical schemes: a set of distinct hues, taken in order (accents, statuses) or evenly
 * sampled for maximum separation (skittles). `ordered` keeps a ranked palette in its authored
 * order. `statuses` pins each outcome to its own semantic tone (success / failed / warn / info /
 * skipped / live) so a discrete-status chart reads by meaning, not an arbitrary ramp; its token order
 * is `STATUS_TONES`, the single source the by-name `seriesColorsFor` path shares. */
const CATEGORICAL: Record<"accents" | "skittles" | "statuses", { tokens: string[]; ordered: boolean }> = {
	accents: { tokens: ["--accent", "--accent-2", "--accent-3", "--accent-4", "--neutral"], ordered: true },
	skittles: {
		tokens: ["--red", "--orange", "--yellow", "--green", "--blue", "--purple", "--brown", "--pink", "--cyan"],
		ordered: false,
	},
	statuses: {
		tokens: [...Object.values(STATUS_TONES)],
		ordered: true,
	},
};

/** Sequential schemes: anchor stops interpolated in OKLCH across exactly `count` steps. */
const SEQUENTIAL: Record<"thermal" | "status", string[]> = {
	thermal: ["--blue", "--cyan", "--yellow", "--red"],
	status: ["--success", "--warn", "--danger"],
};

function resolve(tokens: string[], register: TokenRegister): string[] {
	return tokens.map((name) => register[name]).filter((value): value is string => Boolean(value));
}

/** Evenly spaced indices into a `length`-long array, endpoints included, for `count` picks. */
function evenIndices(length: number, count: number): number[] {
	if (count <= 1) return [0];
	return Array.from({ length: count }, (_, i) => Math.round((i * (length - 1)) / (count - 1)));
}

function categorical(colors: string[], count: number, ordered: boolean): string[] {
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

function sequential(colors: string[], count: number): string[] {
	if (count <= 0 || colors.length === 0) return [];
	if (colors.length === 1) return Array.from({ length: count }, () => colors[0] as string);
	if (count === 1) return [lerpOklch(colors[0] as string, colors[colors.length - 1] as string, 0.5)];
	const segments = colors.length - 1;
	return Array.from({ length: count }, (_, i) => {
		const position = (i / (count - 1)) * segments;
		const seg = Math.min(Math.floor(position), segments - 1);
		return lerpOklch(colors[seg] as string, colors[seg + 1] as string, position - seg);
	});
}

export interface SeriesPaletteOptions {
	/** Flip the palette end for end: a sequential scale runs the other way (hot to cold), a
	 * categorical set runs in reverse order. Every scheme is reversible. */
	reverse?: boolean;
}

const RAMP_ANCHORS: Record<"accent" | "thermal" | "status", string[]> = {
	accent: ["--bg-2", "--accent"],
	thermal: SEQUENTIAL.thermal,
	status: SEQUENTIAL.status,
};

export type RampScheme = keyof typeof RAMP_ANCHORS;
export const RAMP_SCHEMES: readonly RampScheme[] = ["accent", "thermal", "status"];

/** Every register token a built-in ramp reads, so a browser consumer with only the applied CSS
 * custom properties can reconstruct the minimal register `rampColor` needs. */
export const RAMP_TOKENS: readonly string[] = [
	"--bg-2",
	"--accent",
	"--blue",
	"--cyan",
	"--yellow",
	"--red",
	"--success",
	"--warn",
	"--danger",
];

function clamp01(t: number): number {
	return t < 0 ? 0 : t > 1 ? 1 : Number.isFinite(t) ? t : 0;
}

/**
 * Resolves a single color at normalized position `t` (0..1) along a ramp: a built-in `RampScheme`
 * (a faint-to-accent wash or a sequential scale) derived off the register, or an explicit list of
 * stop colors, interpolated in OKLCH. `reverse` flips the ramp. The continuous sibling of
 * `seriesPalette`, for a scalar intensity rather than N discrete series.
 */
export function rampColor(
	scheme: RampScheme | string[],
	t: number,
	register: TokenRegister,
	options: SeriesPaletteOptions = {},
): string {
	const stops = Array.isArray(scheme) ? scheme : resolve(RAMP_ANCHORS[scheme] ?? RAMP_ANCHORS.accent, register);
	if (stops.length === 0) return "currentColor";
	if (stops.length === 1) return stops[0] as string;
	const clamped = clamp01(t);
	const tt = options.reverse ? 1 - clamped : clamped;
	const segments = stops.length - 1;
	const pos = tt * segments;
	const seg = Math.min(Math.floor(pos), segments - 1);
	return lerpOklch(stops[seg] as string, stops[seg + 1] as string, pos - seg);
}

/**
 * The ordered stop list for a ramp as CSS values, for a pure-CSS `linear-gradient` sweep that needs
 * no register: register token names become `var(--token)` references (resolved against the cascade at
 * paint, so the gradient recolors with the theme and survives SSR with zero JS), explicit color
 * strings pass through verbatim. `reverse` flips the order. The SSR-safe sibling of `rampColor`:
 * where `rampColor` samples one color at a position (needing the resolved register), this hands back
 * the whole scale for the browser to interpolate.
 */
export function rampGradientStops(
	scheme: RampScheme | string[],
	options: SeriesPaletteOptions = {},
): string[] {
	const raw = Array.isArray(scheme) ? scheme : RAMP_ANCHORS[scheme] ?? RAMP_ANCHORS.accent;
	const stops = raw.map((s) => (s.startsWith("--") ? `var(${s})` : s));
	return options.reverse ? [...stops].reverse() : stops;
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
 * Resolves `count` series colors for a chart. Pass a built-in `SeriesScheme` to derive them
 * from the active theme's register, or a `string[]` to use explicit colors (cycled to `count`).
 * Categorical schemes return distinct hues; sequential schemes return an interpolated scale.
 * Set `reverse` to flip any scheme end for end.
 */
export function seriesPalette(
	scheme: SeriesScheme | string[],
	count: number,
	register: TokenRegister,
	options: SeriesPaletteOptions = {},
): string[] {
	let colors: string[];
	if (Array.isArray(scheme)) colors = categorical(scheme, count, true);
	else if (scheme in CATEGORICAL) {
		const spec = CATEGORICAL[scheme as "accents" | "skittles" | "statuses"];
		colors = categorical(resolve(spec.tokens, register), count, spec.ordered);
	} else {
		colors = sequential(resolve(SEQUENTIAL[scheme as "thermal" | "status"], register), count);
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
 * Colors a categorical heat-grid: each category (a column by default, or a row) takes a distinct hue
 * from a categorical `SeriesScheme`, and every cell blends from the neutral surface (`--bg-2`) to its
 * category's hue by intensity, so one grid reads category by hue and magnitude by fill at once. This
 * is the categorical sibling of the intensity `rampColor` path: where a ramp washes one hue by value,
 * this hands each category its own hue and washes within it. Returns the row-major cell-color matrix
 * parallel to `values` and the per-category `hues` (for a legend), both resolved off `register`.
 */
export function categoricalHeatColors(
	scheme: SeriesScheme | string[],
	values: number[][],
	register: TokenRegister,
	options: CategoricalHeatOptions = {},
): { cellColors: string[][]; hues: string[] } {
	const axis = options.axis === "row" ? "row" : "col";
	const nCols = values.reduce((max, row) => Math.max(max, row.length), 0);
	const count = axis === "col" ? nCols : values.length;
	const hues = seriesPalette(scheme, count, register, { reverse: options.reverse });
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
 * Resolves a color per data item, honoring an optional semantic `tone` key when the scheme supports
 * by-name mapping. Under `statuses`, an item carrying a known `tone` pins to that outcome's token
 * directly, so filtering an absent category out never shifts the meaning→tone mapping (the positional
 * scheme's failure mode). Items without a `tone`, an explicit `string[]`, and every other scheme fall
 * back to positional `seriesPalette`; the count-based call stays right when items carry no semantics.
 */
export function seriesColorsFor(
	scheme: SeriesScheme | string[],
	items: readonly { tone?: string }[],
	register: TokenRegister,
	options: SeriesPaletteOptions = {},
): string[] {
	const positional = seriesPalette(scheme, items.length, register, options);
	if (Array.isArray(scheme) || scheme !== "statuses") return positional;
	return items.map((item, i) => {
		const named = item.tone ? statusToneColor(item.tone, register) : undefined;
		return named ?? positional[i] ?? "currentColor";
	});
}
