import {
	clampChroma,
	converter,
	formatHex,
	formatRgb,
	parse,
	wcagContrast,
	type Oklch,
} from "culori";

const toOklch = converter("oklch");

export interface OklchColor {
	l: number;
	c: number;
	h: number;
	alpha: number;
}

const DEFAULT_OKLCH: OklchColor = { l: 0, c: 0, h: 0, alpha: 1 };

/**
 * Parses any CSS color string (or passes an `OklchColor` through) into an `OklchColor`. Hex follows CSS:
 * `#RGB` / `#RRGGBB`, and an 8-digit `#RRGGBBAA` is alpha-*last*. Alpha-first ARGB (`#AARRGGBB`) is not a
 * CSS format and parses wrong; convert it with `argbToRgbHex` first. Throws on an unparseable input.
 */
export function toOklchColor(input: string | OklchColor): OklchColor {
	if (typeof input !== "string") return input;
	const parsed = parse(input);
	if (!parsed) throw new Error(`xtyle: unparseable color "${input}"`);
	const o = toOklch(parsed) as Oklch | undefined;
	if (!o) throw new Error(`xtyle: cannot convert color "${input}" to oklch`);
	return {
		l: clamp01(o.l ?? 0),
		c: Math.max(0, o.c ?? 0),
		h: o.h ?? 0,
		alpha: o.alpha ?? 1,
	};
}

export function oklch(l: number, c: number, h: number, alpha = 1): OklchColor {
	return { l: clamp01(l), c: Math.max(0, c), h: ((h % 360) + 360) % 360, alpha };
}

export function withLightness(color: OklchColor, l: number): OklchColor {
	return { ...color, l: clamp01(l) };
}

export function withAlpha(color: OklchColor, alpha: number): OklchColor {
	return { ...color, alpha: clamp01(alpha) };
}

export function rotateHue(color: OklchColor, deg: number): OklchColor {
	return { ...color, h: (((color.h + deg) % 360) + 360) % 360 };
}

/**
 * The signed shortest-path hue difference `to - from`, normalized to `(-180, 180]`.
 * Positive turns counter-clockwise on the OKLCH hue wheel; negative clockwise.
 */
export function hueDelta(from: number, to: number): number {
	let d = (((to - from) % 360) + 360) % 360;
	if (d > 180) d -= 360;
	return d;
}

export function lightness(input: string | OklchColor): number {
	return toOklchColor(input).l;
}

const HEX_BODY = /^[0-9a-fA-F]+$/;

/**
 * Converts an alpha-first ARGB hex (`#AARRGGBB`, the Material Color Utilities / Android
 * `Color.toArgb()` / Jetpack Compose serialization) to a CSS `#RRGGBB` by dropping the leading alpha
 * byte. Passes a `#RRGGBB` through and expands a `#RGB` shorthand, so any hex out of an ARGB pipeline
 * can be routed through it before `contrast` or `toOklchColor`, which read CSS hex only: an 8-digit
 * input is taken as CSS alpha-*last* `#RRGGBBAA`, so an un-converted ARGB color parses silently wrong
 * (its alpha byte becomes red). Throws on a non-hex string.
 */
export function argbToRgbHex(hex: string): string {
	const body = hex.startsWith("#") ? hex.slice(1) : hex;
	if (!HEX_BODY.test(body)) throw new Error(`xtyle: not a hex color "${hex}"`);
	if (body.length === 3) {
		const [r, g, b] = body;
		return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
	}
	if (body.length === 6) return `#${body.toLowerCase()}`;
	if (body.length === 8) return `#${body.slice(2).toLowerCase()}`;
	throw new Error(`xtyle: expected a 3-, 6-, or 8-digit hex color, got "${hex}"`);
}

/**
 * The WCAG 2.x contrast ratio (1..21) between two colors, each a CSS color string or an `OklchColor`.
 * Alpha is ignored (WCAG contrast is defined on opaque colors). Hex is read as CSS: `#RGB` / `#RRGGBB`,
 * and an 8-digit `#RRGGBBAA` is alpha-*last*. Alpha-first ARGB (`#AARRGGBB`, common out of Material
 * Color Utilities / Android) is NOT a CSS format and parses silently wrong here; convert it with
 * `argbToRgbHex` first.
 */
export function contrast(a: string | OklchColor, b: string | OklchColor): number {
	const value = wcagContrast(formatCss(a), formatCss(b));
	return value ?? 1;
}

/**
 * The opaque color a translucent one actually paints when it sits over a backdrop.
 *
 * WCAG contrast is defined between two opaque colors, and `contrast()` reads a translucent input as
 * though it were solid — which overstates it, sometimes by a lot. A focus ring at `alpha: 0.7` over a
 * dark page is not the ring's own color; it is the blend. Grade the blend.
 */
export function flatten(over: string | OklchColor, under: string | OklchColor): OklchColor {
	const top = toOklchColor(over);
	if (top.alpha >= 1) return { ...top, alpha: 1 };
	const base = toOklchColor(under);
	const a = clamp01(top.alpha);
	const mixHue = (from: number, to: number, t: number): number => from + hueDelta(from, to) * t;
	return {
		l: base.l + (top.l - base.l) * a,
		c: base.c + (top.c - base.c) * a,
		h: mixHue(base.h, top.h, a),
		alpha: 1,
	};
}

/**
 * Perceptual OKLab distance between two colors — the separation luminance contrast cannot see.
 *
 * Two fills at the same lightness and chroma but different hues have a WCAG contrast ratio of ~1
 * against each other and are still obviously different colors; two at the same hue are the same color
 * however far apart their contrast against the *page* is. Contrast answers "can text sit on this";
 * this answers "would anyone tell these two apart".
 */
export function oklabDistance(a: string | OklchColor, b: string | OklchColor): number {
	const x = toOklchColor(a);
	const y = toOklchColor(b);
	const rad = Math.PI / 180;
	const ax = x.c * Math.cos(x.h * rad);
	const ay = x.c * Math.sin(x.h * rad);
	const bx = y.c * Math.cos(y.h * rad);
	const by = y.c * Math.sin(y.h * rad);
	return Math.hypot(x.l - y.l, ax - bx, ay - by);
}

/** The three orthogonal axes an {@link oklabDistance} is made of. */
export interface SeparationAxes {
	/** How much of the distance is a step in lightness. */
	lightness: number;
	/** How much of it is a step in saturation at a shared hue. */
	chroma: number;
	/** How much of it is a rotation around the hue wheel. */
	hue: number;
	/** That rotation in degrees, which `hue` alone cannot express — it scales with chroma. */
	hueAngle: number;
}

/**
 * Splits an {@link oklabDistance} into the lightness, chroma and hue steps it is composed of.
 *
 * The three combine in quadrature back to exactly the distance, so this reveals nothing new about
 * *how far* two colors are — it answers *in which direction*, which a single number cannot. That
 * matters because a fixed distance means different things on different axes: a hue rotation's
 * contribution scales with the chroma it happens at, so 8° between two saturated reds outscores a
 * plainly visible step between two grays while reading as no difference at all.
 */
export function separationAxes(a: string | OklchColor, b: string | OklchColor): SeparationAxes {
	const x = toOklchColor(a);
	const y = toOklchColor(b);
	const hueAngle = Math.abs(hueDelta(x.h, y.h));
	const paired = Math.sqrt(Math.max(0, x.c * y.c));
	return {
		lightness: Math.abs(x.l - y.l),
		chroma: Math.abs(x.c - y.c),
		hue: 2 * paired * Math.sin((hueAngle * Math.PI) / 360),
		hueAngle,
	};
}

export function clampToGamut(color: OklchColor): OklchColor {
	const mapped = clampChroma(
		{ mode: "oklch", l: color.l, c: color.c, h: color.h, alpha: color.alpha },
		"oklch",
		"rgb",
	) as Oklch;
	return {
		l: mapped.l ?? color.l,
		c: Math.max(0, mapped.c ?? 0),
		h: mapped.h ?? color.h,
		alpha: mapped.alpha ?? color.alpha,
	};
}

export function formatCss(input: string | OklchColor): string {
	const source = typeof input === "string" ? toOklchColor(input) : input;
	const color = clampToGamut(source);
	const culoriColor: Oklch = {
		mode: "oklch",
		l: color.l,
		c: color.c,
		h: color.h,
		alpha: color.alpha,
	};
	if (color.alpha < 1) {
		return formatRgb(culoriColor) ?? formatHex(culoriColor) ?? "#000000";
	}
	return formatHex(culoriColor) ?? "#000000";
}

/**
 * Normalises any colour to hex for consumers that only speak hex (Monaco themes,
 * xterm.js `ITheme`, terminal-emulator configs). `formatCss` renders alpha colours
 * as `rgba(...)`, so this folds both of its output shapes into `#rrggbb` / `#rrggbbaa`.
 */
export function cssToHex(input: string | OklchColor): string {
	const css = formatCss(input);
	if (css.startsWith("#")) return css;
	const parts = css
		.match(/rgba?\(([^)]+)\)/)?.[1]
		?.split(",")
		.map((s) => s.trim());
	if (!parts) return css;
	const byte = (n: number): string => Math.round(n).toString(16).padStart(2, "0");
	const [r, g, b] = parts.slice(0, 3).map((n) => byte(Number.parseFloat(n)));
	const a = parts[3] === undefined ? "" : byte(Number.parseFloat(parts[3]) * 255);
	return `#${r}${g}${b}${a}`;
}

export function schemeOf(bg: string | OklchColor): "dark" | "light" {
	return lightness(bg) < 0.5 ? "dark" : "light";
}

export function pickReadable(
	fill: string | OklchColor,
	options: Array<string | OklchColor>,
	floor = 4.5,
): string {
	let best = options[0] ?? DEFAULT_OKLCH;
	let bestContrast = -1;
	for (const option of options) {
		const ratio = contrast(fill, option);
		if (ratio >= floor) return formatCss(option);
		if (ratio > bestContrast) {
			bestContrast = ratio;
			best = option;
		}
	}
	return formatCss(best);
}

export function clamp01(value: number): number {
	if (Number.isNaN(value)) return 0;
	return Math.min(1, Math.max(0, value));
}
