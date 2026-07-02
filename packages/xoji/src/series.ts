import type { TokenRegister } from "./types.js";
import { toOklchColor, oklch, formatCss, clampToGamut, hueDelta } from "./color.js";

/**
 * A named way to color N chart series off the derived register, so any theme charts
 * coherently out of the box. Categorical schemes hand back visually separated hues from
 * the theme's own palette; sequential schemes interpolate a scale in OKLCH. An explicit
 * `string[]` overrides all of this with the caller's own colors.
 */
export type SeriesScheme = "accents" | "skittles" | "thermal" | "status";

export const SERIES_SCHEMES: readonly SeriesScheme[] = ["accents", "skittles", "thermal", "status"];

/** Every register token the built-in schemes read. A browser consumer that only has the applied
 * CSS custom properties (no derived register) reads these off the document to reconstruct the
 * minimal register `seriesPalette` needs. */
export const SERIES_TOKENS: readonly string[] = [
	"--accent",
	"--accent-2",
	"--accent-3",
	"--accent-4",
	"--red",
	"--orange",
	"--yellow",
	"--green",
	"--cyan",
	"--blue",
	"--purple",
	"--pink",
	"--success",
	"--warn",
	"--danger",
];

/** Categorical schemes: a set of distinct hues, taken in order (accents) or evenly sampled for
 * maximum separation (skittles). `ordered` keeps a ranked palette in its authored order. */
const CATEGORICAL: Record<"accents" | "skittles", { tokens: string[]; ordered: boolean }> = {
	accents: { tokens: ["--accent", "--accent-2", "--accent-3", "--accent-4"], ordered: true },
	skittles: {
		tokens: ["--red", "--orange", "--yellow", "--green", "--cyan", "--blue", "--purple", "--pink"],
		ordered: false,
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
		const spec = CATEGORICAL[scheme as "accents" | "skittles"];
		colors = categorical(resolve(spec.tokens, register), count, spec.ordered);
	} else {
		colors = sequential(resolve(SEQUENTIAL[scheme as "thermal" | "status"], register), count);
	}
	return options.reverse ? colors.reverse() : colors;
}
