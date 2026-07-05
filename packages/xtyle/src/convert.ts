import { colorsNamed, converter, formatHex, formatHex8, parse } from "culori";
import { clamp01 } from "./color.js";

function round(value: number, places: number): number {
	const factor = 10 ** places;
	return Math.round(value * factor) / factor;
}

/** A color on the sRGB pivot — channels in `0..1`. Every model is a derived view of this. */
export interface RgbColor {
	r: number;
	g: number;
	b: number;
	alpha: number;
}

/** HSV channels: `h` in `0..360`, `s`/`v`/`alpha` in `0..1`. */
export interface HsvColor {
	h: number;
	s: number;
	v: number;
	alpha: number;
}

/** The text formats the color picker can read out and parse. */
export type ColorFormat = "hex" | "rgb" | "hsl" | "oklch" | "lab" | "lch" | "oklab" | "cmyk";

export const colorFormats: ColorFormat[] = ["hex", "rgb", "hsl", "oklch", "lab", "lch", "oklab", "cmyk"];

const toRgb = converter("rgb");
const toHsv = converter("hsv");
const toHsl = converter("hsl");
const toOklch = converter("oklch");
const toLab = converter("lab");
const toLch = converter("lch");
const toOklab = converter("oklab");

/** CMYK isn't a CSS color space; this is the naive, profile-free device conversion. */
function rgbToCmyk(color: RgbColor): { c: number; m: number; y: number; k: number } {
	const k = 1 - Math.max(color.r, color.g, color.b);
	if (k >= 1) return { c: 0, m: 0, y: 0, k: 1 };
	const d = 1 - k;
	return { c: (1 - color.r - k) / d, m: (1 - color.g - k) / d, y: (1 - color.b - k) / d, k };
}

function cmykToRgb(c: number, m: number, y: number, k: number, alpha: number): RgbColor {
	const d = 1 - k;
	return { r: clamp01((1 - c) * d), g: clamp01((1 - m) * d), b: clamp01((1 - y) * d), alpha: clamp01(alpha) };
}

const CMYK_RE =
	/^cmyk\(\s*([\d.]+)%?[\s,]+([\d.]+)%?[\s,]+([\d.]+)%?[\s,]+([\d.]+)%?\s*(?:\/\s*([\d.]+%?))?\s*\)$/i;

/** Parse a `cmyk(C% M% Y% K%)` string (channels read as 0–100) onto the sRGB pivot. */
function parseCmyk(input: string): RgbColor | null {
	const match = CMYK_RE.exec(input);
	if (!match) return null;
	const c = clamp01(Number(match[1]) / 100);
	const m = clamp01(Number(match[2]) / 100);
	const y = clamp01(Number(match[3]) / 100);
	const k = clamp01(Number(match[4]) / 100);
	const rawAlpha = match[5];
	const a = rawAlpha ? Number.parseFloat(rawAlpha) / (rawAlpha.includes("%") ? 100 : 1) : 1;
	return cmykToRgb(c, m, y, k, a);
}

/** Parse any CSS Color 4 string (named, hex, `rgb()`/`hsl()`/`oklch()`/…) or `cmyk()` onto the sRGB pivot. */
export function parseColor(input: string): RgbColor | null {
	const trimmed = input.trim();
	const cmyk = parseCmyk(trimmed);
	if (cmyk) return cmyk;
	const parsed = parse(trimmed);
	if (!parsed) return null;
	const rgb = toRgb(parsed);
	if (!rgb) return null;
	return {
		r: clamp01(rgb.r ?? 0),
		g: clamp01(rgb.g ?? 0),
		b: clamp01(rgb.b ?? 0),
		alpha: rgb.alpha ?? 1,
	};
}

function culoriRgb(color: RgbColor) {
	return { mode: "rgb" as const, r: color.r, g: color.g, b: color.b, alpha: color.alpha };
}

/** Format an sRGB color as a clean, rounded CSS string in the requested model. */
export function formatColor(color: RgbColor, format: ColorFormat): string {
	const rgb = culoriRgb(color);
	const alpha = color.alpha < 1 ? ` / ${round(color.alpha, 2)}` : "";
	switch (format) {
		case "rgb": {
			const r = Math.round(color.r * 255);
			const g = Math.round(color.g * 255);
			const b = Math.round(color.b * 255);
			return `rgb(${r} ${g} ${b}${alpha})`;
		}
		case "hsl": {
			const hsl = toHsl(rgb);
			return `hsl(${round(hsl.h ?? 0, 0)} ${round((hsl.s ?? 0) * 100, 0)}% ${round((hsl.l ?? 0) * 100, 0)}%${alpha})`;
		}
		case "oklch": {
			const oklch = toOklch(rgb);
			return `oklch(${round(oklch.l ?? 0, 3)} ${round(oklch.c ?? 0, 4)} ${round(oklch.h ?? 0, 1)}${alpha})`;
		}
		case "lab": {
			const lab = toLab(rgb);
			return `lab(${round(lab.l ?? 0, 2)} ${round(lab.a ?? 0, 2)} ${round(lab.b ?? 0, 2)}${alpha})`;
		}
		case "lch": {
			const lch = toLch(rgb);
			return `lch(${round(lch.l ?? 0, 2)} ${round(lch.c ?? 0, 2)} ${round(lch.h ?? 0, 1)}${alpha})`;
		}
		case "oklab": {
			const oklab = toOklab(rgb);
			return `oklab(${round(oklab.l ?? 0, 3)} ${round(oklab.a ?? 0, 4)} ${round(oklab.b ?? 0, 4)}${alpha})`;
		}
		case "cmyk": {
			const { c, m, y, k } = rgbToCmyk(color);
			return `cmyk(${round(c * 100, 0)}% ${round(m * 100, 0)}% ${round(y * 100, 0)}% ${round(k * 100, 0)}%${alpha})`;
		}
		default:
			return color.alpha < 1 ? (formatHex8(rgb) ?? "#000000") : (formatHex(rgb) ?? "#000000");
	}
}

export function rgbToHsv(color: RgbColor): HsvColor {
	const hsv = toHsv(culoriRgb(color));
	return { h: hsv.h ?? 0, s: hsv.s ?? 0, v: hsv.v ?? 0, alpha: color.alpha };
}

export function hsvToRgb(hsv: HsvColor): RgbColor {
	const rgb = toRgb({ mode: "hsv", h: hsv.h, s: hsv.s, v: hsv.v, alpha: hsv.alpha });
	return {
		r: clamp01(rgb.r ?? 0),
		g: clamp01(rgb.g ?? 0),
		b: clamp01(rgb.b ?? 0),
		alpha: hsv.alpha,
	};
}

/** The color-wheel relationships the picker can generate from a base color. */
export type HarmonyScheme =
	| "complementary"
	| "triadic"
	| "analogous"
	| "split-complementary"
	| "tetradic"
	| "monochromatic"
	| "shades"
	| "tints";

export const harmonySchemes: HarmonyScheme[] = [
	"complementary",
	"triadic",
	"analogous",
	"split-complementary",
	"tetradic",
	"monochromatic",
	"shades",
	"tints",
];

const HUE_OFFSETS: Partial<Record<HarmonyScheme, number[]>> = {
	complementary: [180],
	triadic: [120, 240],
	analogous: [-30, 30],
	"split-complementary": [150, 210],
	tetradic: [90, 180, 270],
};

/** Per-scheme lightness transforms — proportional so shades/tints stay distinct near the ends. */
const LIGHT_RAMPS: Partial<Record<HarmonyScheme, ((l: number) => number)[]>> = {
	monochromatic: [(l) => l - 0.3, (l) => l - 0.15, (l) => l + 0.15, (l) => l + 0.3],
	shades: [(l) => l * 0.75, (l) => l * 0.5, (l) => l * 0.25],
	tints: [(l) => l + (1 - l) * 0.25, (l) => l + (1 - l) * 0.5, (l) => l + (1 - l) * 0.75],
};

function hslOf(color: RgbColor): { h: number; s: number; l: number } {
	const hsl = toHsl(culoriRgb(color));
	return { h: hsl.h ?? 0, s: hsl.s ?? 0, l: hsl.l ?? 0 };
}

function fromHsl(h: number, s: number, l: number, alpha: number): RgbColor {
	const rgb = toRgb({ mode: "hsl", h, s: clamp01(s), l: clamp01(l), alpha });
	return { r: clamp01(rgb.r ?? 0), g: clamp01(rgb.g ?? 0), b: clamp01(rgb.b ?? 0), alpha };
}

/** Generate the related colors for a scheme, excluding the base color itself. */
export function harmony(color: RgbColor, scheme: HarmonyScheme): RgbColor[] {
	const { h, s, l } = hslOf(color);
	const hueOffsets = HUE_OFFSETS[scheme];
	if (hueOffsets) {
		return hueOffsets.map((offset) => fromHsl((h + offset + 360) % 360, s, l, color.alpha));
	}
	const ramps = LIGHT_RAMPS[scheme] ?? [];
	return ramps.map((ramp) => fromHsl(h, s, ramp(l), color.alpha));
}

/** Snap each sRGB channel to the nearest web-safe step (multiples of `0x33`). */
export function nearestWebSafe(color: RgbColor): RgbColor {
	const snap = (channel: number) => (Math.round((clamp01(channel) * 255) / 51) * 51) / 255;
	return { r: snap(color.r), g: snap(color.g), b: snap(color.b), alpha: color.alpha };
}

interface NamedSwatch {
	name: string;
	color: RgbColor;
	l: number;
	a: number;
	b: number;
}

const NAMED_SWATCHES: NamedSwatch[] = Object.entries(colorsNamed).map(([name, value]) => {
	const color: RgbColor = {
		r: ((value >> 16) & 0xff) / 255,
		g: ((value >> 8) & 0xff) / 255,
		b: (value & 0xff) / 255,
		alpha: 1,
	};
	const oklab = toOklab(culoriRgb(color));
	return { name, color, l: oklab.l ?? 0, a: oklab.a ?? 0, b: oklab.b ?? 0 };
});

/** The CSS named color perceptually closest to a color (OKLab distance), keeping the input's alpha. */
export function nearestNamedColor(color: RgbColor): { name: string; color: RgbColor } {
	const target = toOklab(culoriRgb(color));
	const tl = target.l ?? 0;
	const ta = target.a ?? 0;
	const tb = target.b ?? 0;
	let best: NamedSwatch | undefined;
	let bestDistance = Infinity;
	for (const swatch of NAMED_SWATCHES) {
		const dl = swatch.l - tl;
		const da = swatch.a - ta;
		const db = swatch.b - tb;
		const distance = dl * dl + da * da + db * db;
		if (distance < bestDistance) {
			bestDistance = distance;
			best = swatch;
		}
	}
	const match = best ?? { name: "black", color: { r: 0, g: 0, b: 0, alpha: 1 } };
	return { name: match.name, color: { ...match.color, alpha: color.alpha } };
}

const GAMUT_EPSILON = 1e-4;

/** Convert an OKLCH coordinate to a displayable sRGB color and report whether it was in the sRGB gamut. */
export function oklchToDisplay(l: number, c: number, h: number): { color: RgbColor; inGamut: boolean } {
	const rgb = toRgb({ mode: "oklch", l, c, h, alpha: 1 });
	if (!rgb) return { color: { r: 0, g: 0, b: 0, alpha: 1 }, inGamut: false };
	const within = (value: number | undefined) => (value ?? 0) >= -GAMUT_EPSILON && (value ?? 0) <= 1 + GAMUT_EPSILON;
	const inGamut = within(rgb.r) && within(rgb.g) && within(rgb.b);
	return {
		color: { r: clamp01(rgb.r ?? 0), g: clamp01(rgb.g ?? 0), b: clamp01(rgb.b ?? 0), alpha: 1 },
		inGamut,
	};
}

/** A single editable channel of a color model — its label, range, and step in display units. */
export interface ChannelDef {
	key: string;
	label: string;
	min: number;
	max: number;
	step: number;
	unit?: string;
}

/** The color models whose individual channels can be edited directly (one slider per channel). */
export type ChannelModel = "rgb" | "hsl" | "hsv" | "oklch" | "lab" | "lch" | "oklab" | "cmyk";

export const channelModels: ChannelModel[] = ["rgb", "hsl", "hsv", "oklch", "lab", "lch", "oklab", "cmyk"];

const CHANNEL_DEFS: Record<ChannelModel, ChannelDef[]> = {
	rgb: [
		{ key: "r", label: "R", min: 0, max: 255, step: 1 },
		{ key: "g", label: "G", min: 0, max: 255, step: 1 },
		{ key: "b", label: "B", min: 0, max: 255, step: 1 },
	],
	hsl: [
		{ key: "h", label: "H", min: 0, max: 360, step: 1, unit: "°" },
		{ key: "s", label: "S", min: 0, max: 100, step: 1, unit: "%" },
		{ key: "l", label: "L", min: 0, max: 100, step: 1, unit: "%" },
	],
	hsv: [
		{ key: "h", label: "H", min: 0, max: 360, step: 1, unit: "°" },
		{ key: "s", label: "S", min: 0, max: 100, step: 1, unit: "%" },
		{ key: "v", label: "V", min: 0, max: 100, step: 1, unit: "%" },
	],
	oklch: [
		{ key: "l", label: "L", min: 0, max: 1, step: 0.001 },
		{ key: "c", label: "C", min: 0, max: 0.4, step: 0.001 },
		{ key: "h", label: "H", min: 0, max: 360, step: 1, unit: "°" },
	],
	lab: [
		{ key: "l", label: "L", min: 0, max: 100, step: 0.1 },
		{ key: "a", label: "a", min: -128, max: 127, step: 0.1 },
		{ key: "b", label: "b", min: -128, max: 127, step: 0.1 },
	],
	lch: [
		{ key: "l", label: "L", min: 0, max: 100, step: 0.1 },
		{ key: "c", label: "C", min: 0, max: 150, step: 0.1 },
		{ key: "h", label: "H", min: 0, max: 360, step: 1, unit: "°" },
	],
	oklab: [
		{ key: "l", label: "L", min: 0, max: 1, step: 0.001 },
		{ key: "a", label: "a", min: -0.4, max: 0.4, step: 0.001 },
		{ key: "b", label: "b", min: -0.4, max: 0.4, step: 0.001 },
	],
	cmyk: [
		{ key: "c", label: "C", min: 0, max: 100, step: 1, unit: "%" },
		{ key: "m", label: "M", min: 0, max: 100, step: 1, unit: "%" },
		{ key: "y", label: "Y", min: 0, max: 100, step: 1, unit: "%" },
		{ key: "k", label: "K", min: 0, max: 100, step: 1, unit: "%" },
	],
};

/** The channel definitions for a model, in display order. */
export function channelsOf(model: ChannelModel): ChannelDef[] {
	return CHANNEL_DEFS[model];
}

function rgbFromCulori(input: Parameters<typeof toRgb>[0]): RgbColor {
	const rgb = toRgb(input);
	if (!rgb) return { r: 0, g: 0, b: 0, alpha: 1 };
	return { r: clamp01(rgb.r ?? 0), g: clamp01(rgb.g ?? 0), b: clamp01(rgb.b ?? 0), alpha: rgb.alpha ?? 1 };
}

/** Read a color's channel values for a model, in the same display units as `channelsOf`. */
export function colorToChannels(color: RgbColor, model: ChannelModel): number[] {
	const rgb = culoriRgb(color);
	switch (model) {
		case "rgb":
			return [color.r * 255, color.g * 255, color.b * 255];
		case "hsl": {
			const v = toHsl(rgb);
			return [v.h ?? 0, (v.s ?? 0) * 100, (v.l ?? 0) * 100];
		}
		case "hsv": {
			const v = toHsv(rgb);
			return [v.h ?? 0, (v.s ?? 0) * 100, (v.v ?? 0) * 100];
		}
		case "oklch": {
			const v = toOklch(rgb);
			return [v.l ?? 0, v.c ?? 0, v.h ?? 0];
		}
		case "lab": {
			const v = toLab(rgb);
			return [v.l ?? 0, v.a ?? 0, v.b ?? 0];
		}
		case "lch": {
			const v = toLch(rgb);
			return [v.l ?? 0, v.c ?? 0, v.h ?? 0];
		}
		case "oklab": {
			const v = toOklab(rgb);
			return [v.l ?? 0, v.a ?? 0, v.b ?? 0];
		}
		case "cmyk": {
			const v = rgbToCmyk(color);
			return [v.c * 100, v.m * 100, v.y * 100, v.k * 100];
		}
	}
}

/** Build a color from a model's channel values (display units), preserving the given alpha. */
export function colorFromChannels(model: ChannelModel, values: number[], alpha: number): RgbColor {
	const [a = 0, b = 0, c = 0, d = 0] = values;
	switch (model) {
		case "rgb":
			return rgbFromCulori({ mode: "rgb", r: a / 255, g: b / 255, b: c / 255, alpha });
		case "hsl":
			return rgbFromCulori({ mode: "hsl", h: a, s: b / 100, l: c / 100, alpha });
		case "hsv":
			return rgbFromCulori({ mode: "hsv", h: a, s: b / 100, v: c / 100, alpha });
		case "oklch":
			return rgbFromCulori({ mode: "oklch", l: a, c: b, h: c, alpha });
		case "lab":
			return rgbFromCulori({ mode: "lab", l: a, a: b, b: c, alpha });
		case "lch":
			return rgbFromCulori({ mode: "lch", l: a, c: b, h: c, alpha });
		case "oklab":
			return rgbFromCulori({ mode: "oklab", l: a, a: b, b: c, alpha });
		case "cmyk":
			return cmykToRgb(a / 100, b / 100, c / 100, d / 100, alpha);
	}
}
