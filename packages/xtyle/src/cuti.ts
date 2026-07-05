import { formatHex8 } from "culori";
import {
	clampToGamut,
	contrast,
	formatCss,
	hueDelta,
	oklch,
	pickReadable,
	rotateHue,
	schemeOf,
	toOklchColor,
	withAlpha,
	withLightness,
	type OklchColor,
} from "./color.js";

/**
 * The `cuti` namespace — color primitives the engine exposes to every algorithm
 * mod as a host binding (gated by the `color-math` capability). One host-side
 * implementation over the same `color.ts` math the engine itself uses, so a token
 * derived by a mod is identical to one the engine derives — no per-runtime drift.
 *
 * Covers the conventional `cuti` color facade (`lighten` / `mix` / `contrast` / …)
 * and adds the OKLCH projection (`toOklch` / `fromOklch`) plus the derivation helpers
 * (`hueDelta` / `pickReadable` / `clampGamut` / `scheme`) xtyle's algorithms lean on.
 *
 * Colors cross the boundary as strings (`#rrggbb`, `#rrggbbaa`, or `oklch(L C H[/A])`);
 * OKLCH coordinates cross as plain `{ l, c, h, alpha }`. String outputs are canonical
 * hex (`toArgb` keeps alpha as `#rrggbbaa`; `toHex` strips it to `#rrggbb`).
 */
export interface Cuti {
	lighten(color: string, amount: number): string;
	darken(color: string, amount: number): string;
	saturate(color: string, amount: number): string;
	desaturate(color: string, amount: number): string;
	shiftHue(color: string, degrees: number): string;
	complement(color: string): string;
	mix(a: string, b: string, t: number): string;
	alpha(color: string, a: number): string;
	fade(color: string, amount: number): string;
	fadeIn(color: string, amount: number): string;
	fadeOut(color: string, amount: number): string;
	scaleLuminance(color: string, factor: number): string;
	contrast(a: string, b: string): number;
	isDark(color: string): boolean;
	isLight(color: string): boolean;
	scheme(color: string): "dark" | "light";
	hueDelta(from: number, to: number): number;
	pickReadable(fill: string, options: string[], floor?: number): string;
	toOklch(color: string): OklchColor;
	fromOklch(l: number, c: number, h: number, alpha?: number): string;
	clampGamut(l: number, c: number, h: number, alpha?: number): OklchColor;
	toHex(color: string): string;
	toArgb(color: string): string;
}

function mixOklch(a: OklchColor, b: OklchColor, t: number): OklchColor {
	const f = Math.min(1, Math.max(0, t));
	return {
		l: a.l + (b.l - a.l) * f,
		c: a.c + (b.c - a.c) * f,
		h: (((a.h + hueDelta(a.h, b.h) * f) % 360) + 360) % 360,
		alpha: a.alpha + (b.alpha - a.alpha) * f,
	};
}

export function createCuti(): Cuti {
	return {
		lighten: (color, amount) => {
			const o = toOklchColor(color);
			return formatCss(withLightness(o, o.l + amount));
		},
		darken: (color, amount) => {
			const o = toOklchColor(color);
			return formatCss(withLightness(o, o.l - amount));
		},
		saturate: (color, amount) => {
			const o = toOklchColor(color);
			return formatCss({ ...o, c: Math.max(0, o.c + amount) });
		},
		desaturate: (color, amount) => {
			const o = toOklchColor(color);
			return formatCss({ ...o, c: Math.max(0, o.c - amount) });
		},
		shiftHue: (color, degrees) => formatCss(rotateHue(toOklchColor(color), degrees)),
		complement: (color) => formatCss(rotateHue(toOklchColor(color), 180)),
		mix: (a, b, t) => formatCss(mixOklch(toOklchColor(a), toOklchColor(b), t)),
		alpha: (color, a) => formatCss(withAlpha(toOklchColor(color), a)),
		fade: (color, amount) => {
			const o = toOklchColor(color);
			return formatCss(withAlpha(o, o.alpha - amount));
		},
		fadeIn: (color, amount) => {
			const o = toOklchColor(color);
			return formatCss(withAlpha(o, o.alpha + amount));
		},
		fadeOut: (color, amount) => {
			const o = toOklchColor(color);
			return formatCss(withAlpha(o, o.alpha - amount));
		},
		scaleLuminance: (color, factor) => {
			const o = toOklchColor(color);
			return formatCss(withLightness(o, o.l * factor));
		},
		contrast: (a, b) => contrast(a, b),
		isDark: (color) => schemeOf(color) === "dark",
		isLight: (color) => schemeOf(color) === "light",
		scheme: (color) => schemeOf(color),
		hueDelta: (from, to) => hueDelta(from, to),
		pickReadable: (fill, options, floor) => pickReadable(fill, options, floor),
		toOklch: (color) => toOklchColor(color),
		fromOklch: (l, c, h, alpha) => formatCss(oklch(l, c, h, alpha ?? 1)),
		clampGamut: (l, c, h, alpha) => clampToGamut(oklch(l, c, h, alpha ?? 1)),
		toHex: (color) => formatCss(withAlpha(toOklchColor(color), 1)),
		toArgb: (color) => {
			const o = clampToGamut(toOklchColor(color));
			return (
				formatHex8({ mode: "oklch", l: o.l, c: o.c, h: o.h, alpha: o.alpha }) ?? "#000000ff"
			);
		},
	};
}
