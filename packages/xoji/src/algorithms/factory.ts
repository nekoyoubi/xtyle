import {
	clampToGamut,
	contrast,
	formatCss,
	hueDelta,
	oklch,
	pickReadable,
	schemeOf,
	toOklchColor,
	withAlpha,
	withLightness,
	type OklchColor,
} from "../color.js";
import { resolveGraph, type TokenNode } from "../graph.js";
import { FULL_TONES } from "../vocab.js";
import type {
	Algorithm,
	DeriveOptions,
	DeriveTrace,
	Density,
	Invariant,
	InvariantContext,
	InvariantResult,
	Knobs,
	Pass,
	PassContext,
	Scheme,
	TokenCategories,
	TokenCategory,
	TokenName,
	TokenRegister,
	TraceSnapshot,
} from "../types.js";

const AA = 4.5;
const AAA = 7;
const ENFORCE = AA + 0.2;
export const SURFACE_SEPARATION = 1.5;
export const BORDER_SEPARATION = 1.5;
export const DIVIDER_SEPARATION = 1.8;
const DEFAULT_SHIFT_STEP = 90;
const DEFAULT_ACCENT_SPLIT = 45;
// Chroma of the faint accent-hue wash on a surface synthesized from an accent (the "keep the tone"
// derivation); kept low enough that any hue stays a neutral-reading surface rather than a muddy fill.
const DERIVED_SURFACE_TINT_C = 0.02;
// How accent-2/3/4 fan off the primary accent. "split-complement": 2 and 3 flank the
// accent at ∓the accentSplit knob, 4 is its 180° complement; if a theme pins either wing, the
// other mirrors its hue across the accent instead of the fixed knob, so the pair stays symmetric
// around the author's choice. "wheel": an even fan, each accent one accentShiftStep past the last.
const ACCENT_FAN: "split-complement" | "wheel" = "split-complement";
const ACHROMATIC_CHROMA = 0.02;
const DERIVED_ACCENT_HUE_ROTATION = 150;
const DERIVED_ACCENT_FALLBACK_HUE = 250;
const DERIVED_ACCENT_L = 0.62;
const DERIVED_ACCENT_C = 0.16;
const ACCENT_RAMP_L_MIN = 0.1;
const ACCENT_RAMP_L_MAX = 0.95;
const HUE_STABLE_CHROMA = 0.1;
const HUE_TOLERANCE = 8;
const LIGHTNESS_TOLERANCE = 0.05;

const DEFAULT_TYPE_SCALE = 1.2;
const DEFAULT_RADIUS_SCALE = 1;
const BASE_TEXT_REM = 1;

const DEFAULT_FONTS = {
	sans: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
	mono: 'ui-monospace, "SF Mono", "Cascadia Code", Consolas, monospace',
	display:
		'"Avenir Next", "Futura", "Century Gothic", "Trebuchet MS", system-ui, -apple-system, "Segoe UI", sans-serif',
} as const;

const TEXT_LIGHT: OklchColor = { l: 0.98, c: 0, h: 0, alpha: 1 };
const TEXT_DARK: OklchColor = { l: 0.15, c: 0, h: 0, alpha: 1 };
const TRUE_WHITE: OklchColor = { l: 1, c: 0, h: 0, alpha: 1 };
const TRUE_BLACK: OklchColor = { l: 0, c: 0, h: 0, alpha: 1 };
const TEXT_POLES: OklchColor[] = [TRUE_WHITE, TRUE_BLACK];

function bestTruePole(bg: string | OklchColor): OklchColor {
	return contrast(TRUE_BLACK, bg) >= contrast(TRUE_WHITE, bg) ? TRUE_BLACK : TRUE_WHITE;
}

/**
 * Each status role borrows its hue from a named palette color rather than a free-standing
 * constant, so the statuses are never detached from the catalog: re-hueing (or pinning) the
 * named color moves its status with it. A direct pin on the status token itself still wins.
 */
const STATUS_TO_HUE = {
	success: "green",
	warn: "yellow",
	danger: "red",
	info: "blue",
} as const;

/** The accent chroma at which the named hues derive at their catalog saturation (factor ~1);
 * a more saturated accent pushes them up, a muted one down. */
const NEUTRAL_ACCENT_CHROMA = 0.13;

const PALETTE_HUES: Record<string, { h: number; c: number } | "gray" | "white" | "black"> = {
	red: { h: 25, c: 0.2 },
	orange: { h: 55, c: 0.18 },
	yellow: { h: 95, c: 0.17 },
	green: { h: 145, c: 0.18 },
	blue: { h: 250, c: 0.18 },
	purple: { h: 300, c: 0.18 },
	brown: { h: 50, c: 0.08 },
	pink: { h: 350, c: 0.16 },
	cyan: { h: 200, c: 0.14 },
	gray: "gray",
	white: "white",
	black: "black",
};

const PALETTE_STOPS = ["subtle", "muted", "base", "strong", "contrast"] as const;

// Syntax-highlighting scope colors. The vivid roles each take an evenly-spread hue
// offset from the accent, so any accent yields a mutually-distinguishable code
// palette that re-themes with the chrome. The structural roles (comment / operator
// / punctuation / variable) stay quiet by design — they read by muted chroma and
// lightness, not by a signature hue.
// Vivid roles in lightness-rank order (index 0 = nearest the editor bg, 7 = nearest
// the readable pole). Hue is decorrelated from rank by a bit-reversal permutation:
// adjacent lightness ranks land far apart on the hue wheel and far-apart ranks share
// a hue — so whichever axis a tight bg compresses, the other keeps neighbours apart.
const CODE_VIVID_ROLES = [
	"keyword",
	"number",
	"function",
	"type",
	"string",
	"tag",
	"attr",
	"regexp",
] as const;
const CODE_HUE_RANK = [0, 4, 2, 6, 1, 5, 3, 7];
const CODE_STRUCTURAL_ROLES = ["comment", "operator", "punctuation", "variable"] as const;
const CODE_SCOPES = [...CODE_VIVID_ROLES, ...CODE_STRUCTURAL_ROLES];
const CODE_SURFACES = ["--code-bg", "--code-fg", "--code-line-highlight", "--code-selection"] as const;

const SURFACES = ["--body-bg", "--bg-0", "--bg-1", "--bg-2", "--bg-3"] as const;

const PANEL_REF_INDEX = SURFACES.indexOf("--bg-2");
const PANEL_SURFACES = ["--bg-1", "--bg-2"] as const;

const TEXT_STEPS = ["xs", "sm", "body", "lg", "xl", "2xl", "3xl", "4xl", "5xl"] as const;
const LEADING_STEPS = ["tight", "normal", "loose"] as const;
const WEIGHT_STEPS = ["normal", "medium", "semibold", "bold"] as const;
const RADIUS_STEPS = ["none", "sm", "md", "lg", "full"] as const;
const BORDER_STEPS = ["thin", "normal", "thick"] as const;
const DURATION_STEPS = ["fast", "base", "slow"] as const;
const EASE_STEPS = ["standard", "emphasized"] as const;
const SPACE_STEPS = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;
const ELEVATION_STEPS = [0, 1, 2, 3, 4, 5] as const;

const WEIGHT_VALUES: Record<string, number> = {
	normal: 400,
	medium: 500,
	semibold: 600,
	bold: 700,
};

const LEADING_VALUES: Record<string, number> = {
	tight: 1.2,
	normal: 1.5,
	loose: 1.8,
};

const DENSITY_MULTIPLIER: Record<Density, number> = {
	compact: 0.8,
	normal: 1,
	comfortable: 1.25,
};

const SPACE_BASE_REM = 0.25;

/**
 * The posture an algorithm bakes in. The factory threads these through the same
 * derivation math so the four shipped algorithms differ in taste (vibrancy,
 * contrast strictness, elevation punch, accent / palette saturation) while sharing
 * a single tested core. `contrastFloor` is the WCAG ratio the algorithm clamps
 * derived text to; `declaredTextOnFillFloor` is the floor its gauntlet asserts.
 */
export type PresetAnchors = { bg: string; fg: string; accent?: string };

export interface PresetDefaults {
	id: string;
	knobs: string[];
	defaultAnchors: PresetAnchors;
	contrastFloor: number;
	declaredTextOnFillFloor: number;
	defaultVibrancy: number;
	accentChromaMul: number;
	statusChromaMul: number;
	paletteChromaMul: number;
	neutralChroma: number;
	elevationStrengthMul: number;
	elevationAlphaBoost: number;
	accentTintChromaMul: number;
	extreme?: boolean;
}

function buildProduces(): { produces: string[]; categories: TokenCategories } {
	const produces: string[] = [];
	const categories: TokenCategories = {};
	const add = (name: string, category: TokenCategory): void => {
		produces.push(name);
		categories[name] = category;
	};

	add("--bg-sunken", "color");
	for (const s of SURFACES) add(s, "color");
	add("--scrim", "color");
	add("--surface-overlay", "color");
	add("--surface-overlay-border", "color");

	for (let i = 0; i <= 3; i++) add(`--fg-${i}`, "color");
	add("--fg-disabled", "color");
	add("--placeholder", "color");

	add("--line", "color");
	add("--line-2", "color");
	add("--ring", "color");
	add("--ring-bg", "color");

	add("--accent", "color");
	add("--accent-hover", "color");
	add("--accent-active", "color");
	add("--accent-bg", "color");
	add("--accent-fg", "color");
	add("--accent-text", "color");
	add("--accent-vivid", "color");
	for (const n of ["2", "3", "4"]) {
		add(`--accent-${n}`, "color");
		add(`--accent-${n}-bg`, "color");
		add(`--accent-${n}-fg`, "color");
		add(`--accent-${n}-text`, "color");
		add(`--accent-${n}-vivid`, "color");
	}
	add("--accent-shift-step", "number");

	add("--neutral", "color");
	add("--neutral-bg", "color");
	add("--neutral-fg", "color");
	add("--neutral-text", "color");
	add("--neutral-vivid", "color");

	add("--field-bg", "color");
	add("--field-border", "color");

	for (const role of Object.keys(STATUS_TO_HUE)) {
		add(`--${role}`, "color");
		add(`--${role}-bg`, "color");
		add(`--${role}-fg`, "color");
		add(`--${role}-text`, "color");
		add(`--${role}-vivid`, "color");
	}

	for (const s of ["hover", "press", "selected", "disabled", "drag"]) {
		add(`--state-${s}`, "color");
	}

	add("--link", "color");
	add("--link-hover", "color");

	add("--selection", "color");
	add("--highlight", "color");
	add("--selection-cue", "keyword");
	add("--shadow", "shadow");

	for (const hue of Object.keys(PALETTE_HUES)) {
		add(`--color-${hue}`, "color");
		for (const stop of PALETTE_STOPS) add(`--color-${hue}-${stop}`, "color");
		add(`--${hue}`, "color");
		add(`--${hue}-bg`, "color");
		add(`--${hue}-fg`, "color");
		add(`--${hue}-text`, "color");
		add(`--${hue}-vivid`, "color");
	}

	for (const t of CODE_SURFACES) add(t, "color");
	for (const role of CODE_SCOPES) add(`--code-${role}`, "color");

	add("--font-sans", "font");
	add("--font-mono", "font");
	add("--font-display", "font");
	for (const step of TEXT_STEPS) add(`--text-${step}`, "length");
	for (const step of LEADING_STEPS) add(`--leading-${step}`, "number");
	for (const step of WEIGHT_STEPS) add(`--weight-${step}`, "number");

	for (const step of RADIUS_STEPS) add(`--radius-${step}`, "length");
	for (const step of BORDER_STEPS) add(`--border-${step}`, "length");

	for (const step of DURATION_STEPS) add(`--duration-${step}`, "duration");
	for (const step of EASE_STEPS) add(`--ease-${step}`, "easing");

	for (const step of ELEVATION_STEPS) add(`--elevation-${step}`, "shadow");

	for (const step of SPACE_STEPS) add(`--space-${step}`, "length");

	return { produces, categories };
}

const { produces: PRODUCES, categories: CATEGORIES } = buildProduces();

/**
 * Legal value sets for `keyword` (intent) tokens. A keyword token names a
 * rendering *intent* a component branches on, so its values are a closed
 * vocabulary, not free text; the format invariant rejects any algorithm that
 * emits a value outside its token's domain.
 */
export const KEYWORD_DOMAINS: Record<string, readonly string[]> = {
	"--selection-cue": ["tint", "marker"],
};

function stepLightness(base: number, scheme: Scheme, step: number, index: number): number {
	const direction = scheme === "dark" ? 1 : -1;
	return base + direction * step * index;
}

function contrastBandFloor(knobs: Knobs): number | undefined {
	const band = knobs.contrastBand;
	if (typeof band === "number") return band;
	if (band === "aaa") return AAA;
	if (band === "aa") return AA;
	return undefined;
}

function vibrancyOf(knobs: Knobs, preset: PresetDefaults): number {
	const v = typeof knobs.vibrancy === "number" ? knobs.vibrancy : preset.defaultVibrancy;
	return Math.min(1, Math.max(0, v));
}

function typeScaleOf(knobs: Knobs): number {
	const v = typeof knobs.typeScale === "number" ? knobs.typeScale : DEFAULT_TYPE_SCALE;
	return Math.min(2, Math.max(1.05, v));
}

function radiusScaleOf(knobs: Knobs): number {
	const v = typeof knobs.radiusScale === "number" ? knobs.radiusScale : DEFAULT_RADIUS_SCALE;
	return Math.max(0, v);
}

function densityOf(knobs: Knobs): number {
	const d = knobs.density;
	if (typeof d === "number") return Math.max(0.4, d);
	if (d === "compact" || d === "comfortable") return DENSITY_MULTIPLIER[d];
	return DENSITY_MULTIPLIER.normal;
}

function fontsOf(knobs: Knobs): { sans: string; mono: string; display: string } {
	return {
		sans: knobs.fonts?.sans ?? DEFAULT_FONTS.sans,
		mono: knobs.fonts?.mono ?? DEFAULT_FONTS.mono,
		display: knobs.fonts?.display ?? DEFAULT_FONTS.display,
	};
}

function emittedContrast(fg: OklchColor, bgCss: string): number {
	return contrast(formatCss(fg), bgCss);
}

export function enforceContrastFloor(
	fg: OklchColor,
	bg: OklchColor,
	scheme: Scheme,
	floor = ENFORCE,
): OklchColor {
	const bgCss = formatCss(bg);
	if (emittedContrast(fg, bgCss) >= floor) return fg;
	const preferred = scheme === "dark" ? TRUE_WHITE.l : TRUE_BLACK.l;
	const other = scheme === "dark" ? TRUE_BLACK.l : TRUE_WHITE.l;
	const swept =
		sweepToward(fg, bgCss, preferred, floor) ?? sweepToward(fg, bgCss, other, floor);
	const pole = bestTruePole(bgCss);
	if (!swept) return pole;
	return emittedContrast(pole, bgCss) > emittedContrast(swept, bgCss) ? pole : swept;
}

function sweepToward(
	fg: OklchColor,
	bgCss: string,
	targetL: number,
	floor: number,
): OklchColor | null {
	for (let i = 0; i <= 100; i++) {
		const t = i / 100;
		const candidate: OklchColor = {
			l: fg.l + (targetL - fg.l) * t,
			c: fg.c * (1 - t),
			h: fg.h,
			alpha: fg.alpha,
		};
		if (emittedContrast(candidate, bgCss) >= floor) return candidate;
	}
	return null;
}

function bestPoleContrast(bg: OklchColor): number {
	return Math.max(contrast(TEXT_LIGHT, bg), contrast(TEXT_DARK, bg));
}

function ensureTextHeadroom(bg: OklchColor, scheme: Scheme, floor = ENFORCE): OklchColor {
	if (bestPoleContrast(bg) >= floor) return bg;
	const target = scheme === "dark" ? 0 : 1;
	let candidate = bg;
	for (let i = 1; i <= 100; i++) {
		const t = i / 100;
		candidate = withLightness(bg, bg.l + (target - bg.l) * t);
		if (bestPoleContrast(candidate) >= floor) return candidate;
	}
	return withLightness(bg, target);
}

function fillWithTextHeadroom(l: number, c: number, h: number, floor = ENFORCE): OklchColor {
	const seed = oklch(l, c, h);
	if (bestPoleContrast(seed) >= floor) return seed;
	let fallback = seed;
	for (let i = 1; i <= 100; i++) {
		const down = oklch(l - (l * i) / 100, c, h);
		if (bestPoleContrast(down) >= floor) return down;
		const up = oklch(l + ((1 - l) * i) / 100, c, h);
		if (bestPoleContrast(up) >= floor) return up;
		fallback = bestPoleContrast(down) >= bestPoleContrast(up) ? down : up;
	}
	return fallback;
}

function lightnessForContrast(
	pole: OklchColor,
	bg: OklchColor,
	bgCss: string,
	target: number,
): number {
	let bestL = pole.l;
	for (let i = 0; i <= 200; i++) {
		const t = i / 200;
		const candidateL = pole.l + (bg.l - pole.l) * t;
		if (emittedContrast(withLightness(pole, candidateL), bgCss) >= target) bestL = candidateL;
		else break;
	}
	return bestL;
}

/**
 * Push a palette ramp's `strong` stop along lightness — toward whichever pole it already
 * leans, so the ramp stays monotonic — until it clears `target` contrast against the
 * `subtle` tint it is read on (the soft badge / avatar fallback pairing). Hue and chroma
 * are preserved (gamut-clamped); only lightness moves, so `strong` stays usable as the
 * outline ink too.
 */
function liftStopForContrast(fg: OklchColor, bgCss: string, target: number, towardLight: boolean): OklchColor {
	if (contrast(formatCss(fg), bgCss) >= target) return fg;
	const poleL = towardLight ? 1 : 0;
	let best = fg;
	for (let i = 1; i <= 100; i++) {
		const candidate = clampToGamut(oklch(fg.l + (poleL - fg.l) * (i / 100), fg.c, fg.h));
		best = candidate;
		if (contrast(formatCss(candidate), bgCss) >= target) return candidate;
	}
	return best;
}

/**
 * Keep a solid fill that paints directly on the page (a primary control's surface) from
 * collapsing onto `--bg-0`. When the fill's lightness coincides with the page's — a near-gray
 * accent, or any accent whose lightness lands on the background's — luminance contrast drops
 * toward 1:1 and the control vanishes even though its own text still reads. Push lightness away
 * from the surface (toward the far pole) until it clears `separation` against the surface, while
 * never dropping below the text-headroom (best-pole contrast) the fill arrived with — so a
 * mid-lightness page can't park the fill in the dead zone where neither text pole reaches its
 * on-fill floor. Hue and chroma are held.
 */
function separateFillFromSurface(
	fill: OklchColor,
	surface: OklchColor,
	separation: number,
	textFloor: number,
): OklchColor {
	const surfaceCss = formatCss(surface);
	if (contrast(formatCss(fill), surfaceCss) >= separation) return fill;
	const headroom = Math.min(textFloor, bestPoleContrast(fill));
	const poleL = surface.l < 0.5 ? 1 : 0;
	let best = fill;
	for (let i = 1; i <= 100; i++) {
		const candidate = clampToGamut(oklch(fill.l + (poleL - fill.l) * (i / 100), fill.c, fill.h));
		best = candidate;
		if (
			contrast(formatCss(candidate), surfaceCss) >= separation &&
			bestPoleContrast(candidate) >= headroom - 0.01
		) {
			return candidate;
		}
	}
	return best;
}

/**
 * Floor a divider/border against the surface it delineates. A fixed lightness shift off the
 * surface reads as a hairline in a mid-range theme, but collapses below perceptibility when the bg
 * anchor nears a pole — a border on near-black goes invisible, so a bordered card on a near-black
 * page loses its only separation channel. Push the border toward the readable pole until it clears
 * `minContrast`.
 */
export function borderForContrast(
	seed: OklchColor,
	surface: OklchColor,
	minContrast: number,
): OklchColor {
	const surfaceCss = formatCss(surface);
	if (emittedContrast(seed, surfaceCss) >= minContrast) return seed;
	const targetL = surface.l < 0.5 ? 1 : 0;
	let candidate = seed;
	for (let i = 1; i <= 100; i++) {
		candidate = withLightness(seed, seed.l + (targetL - seed.l) * (i / 100));
		if (emittedContrast(candidate, surfaceCss) >= minContrast) break;
	}
	return candidate;
}

function readableOnTint(tint: OklchColor, hue: number, floor: number, inkChroma?: number): string {
	const tintCss = formatCss(tint);
	const towardDark = contrast("#000000", tintCss) >= contrast("#ffffff", tintCss);
	const targetL = towardDark ? 0 : 1;
	const seedChroma = inkChroma ?? (towardDark ? 0.06 : 0.04);
	const seed = oklch(tint.l + (towardDark ? -0.4 : 0.4), seedChroma, hue);
	for (let i = 0; i <= 100; i++) {
		const t = i / 100;
		const css = formatCss({
			l: seed.l + (targetL - seed.l) * t,
			c: seed.c * (1 - t),
			h: hue,
			alpha: 1,
		});
		if (contrast(css, tintCss) >= floor) return css;
	}
	return towardDark ? "#000000" : "#ffffff";
}

/**
 * A hued ink for a status `-text` token. Its non-negotiable job is to clear
 * `tintFloor` against its own `-bg` tint; on top of that it tries to also clear
 * `panelFloor` against the neutral panels it may sit on. When no tint-readable
 * color can also serve the panels (a chromatic background pushing tint and panel
 * to incompatible lightnesses), tint-readability wins and the panel is sacrificed.
 */
function readableHuedOnTintAndPanel(
	tint: OklchColor,
	hue: number,
	tintFloor: number,
	panels: OklchColor[],
	panelFloor: number,
	seedChroma: number,
): string {
	const tintCss = formatCss(tint);
	const panelCss = panels.map((p) => formatCss(p));
	const sweep = (towardDark: boolean): string[] => {
		const targetL = towardDark ? 0 : 1;
		const seed = towardDark
			? oklch(tint.l - 0.4, seedChroma, hue)
			: oklch(tint.l + 0.4, seedChroma * 0.667, hue);
		const out: string[] = [];
		for (let i = 0; i <= 100; i++) {
			const t = i / 100;
			out.push(
				formatCss({
					l: seed.l + (targetL - seed.l) * t,
					c: seed.c * (1 - t),
					h: hue,
					alpha: 1,
				}),
			);
		}
		return out;
	};
	const minPanel = (css: string): number =>
		panelCss.length === 0 ? Infinity : Math.min(...panelCss.map((p) => contrast(css, p)));
	let best: string | null = null;
	let bestMin = -1;
	for (const towardDark of [true, false]) {
		for (const css of sweep(towardDark)) {
			if (contrast(css, tintCss) < tintFloor) continue;
			const m = minPanel(css);
			if (m >= panelFloor) return css;
			if (m > bestMin) {
				bestMin = m;
				best = css;
			}
		}
	}
	return best ?? readableOnTint(tint, hue, tintFloor);
}

/**
 * A vivid on-surface tone color: the ink at `hue` carrying `targetChroma` (the tone's own
 * theme-scaled chroma, so it reads as punchy as the solid rather than gamut-max neon, and
 * stays perceptually even across hues) at the lightness that best clears `floor` against
 * every surface in `panels`. Distinct from `-text`, which is muted because it must also read
 * on the soft tint and so overshoots panel contrast at the cost of chroma. Sweeps lightness
 * toward the panels' contrasting pole and keeps the candidate holding the most of the target
 * chroma while clearing the floor — so light mode (dark ink on light panels) stays as punchy
 * as the gamut allows there, not collapsed.
 */
function vividOnPanel(hue: number, panels: OklchColor[], floor: number, targetChroma: number): string {
	const panelCss = panels.map((p) => formatCss(p));
	const minPanel = (css: string): number =>
		panelCss.length === 0 ? Infinity : Math.min(...panelCss.map((p) => contrast(css, p)));
	const avgL = panels.reduce((sum, p) => sum + p.l, 0) / Math.max(1, panels.length);
	const towardLight = avgL < 0.5;
	let best: string | null = null;
	let bestChroma = -1;
	for (let i = 0; i <= 80; i++) {
		const t = i / 80;
		const l = towardLight ? 0.5 + t * 0.45 : 0.5 - t * 0.42;
		// In-gamut chroma at this lightness, capped at the target so it never blows out to neon.
		const chroma = clampToGamut(oklch(l, targetChroma, hue)).c;
		const css = formatCss(oklch(l, chroma, hue));
		if (minPanel(css) >= floor && chroma > bestChroma) {
			bestChroma = chroma;
			best = css;
		}
	}
	// No AA-clearing ink at this chroma exists (a mid-gray surface where even the poles
	// barely read); fall back to the most-contrasting achromatic pole.
	return best ?? (towardLight ? "#ffffff" : "#000000");
}

/**
 * The accent anchor used when no accent is specified (no `--accent` pin and no
 * `anchors.accent`). Deterministic and gamut-safe: rotate the background hue by a
 * fixed angle toward a vivid accent, falling back to a fixed blue when the
 * background (or, secondarily, the foreground) is too achromatic to carry a hue.
 * Lightness and chroma are fixed at vivid-accent values, then gamut-clamped.
 */
function deriveAccentAnchor(bg: OklchColor, fg: OklchColor): OklchColor {
	const sourceHue =
		bg.c >= ACHROMATIC_CHROMA
			? bg.h
			: fg.c >= ACHROMATIC_CHROMA
				? fg.h
				: undefined;
	const hue =
		sourceHue === undefined
			? DERIVED_ACCENT_FALLBACK_HUE
			: (((sourceHue + DERIVED_ACCENT_HUE_ROTATION) % 360) + 360) % 360;
	return clampToGamut(oklch(DERIVED_ACCENT_L, DERIVED_ACCENT_C, hue));
}

function shadowString(
	scheme: Scheme,
	level: number,
	vibrancy: number,
	preset: PresetDefaults,
): string {
	if (level <= 0) return "none";
	const baseAlpha =
		(scheme === "dark" ? 0.5 : 0.16) + vibrancy * 0.1 + preset.elevationAlphaBoost;
	const y = Math.max(1, Math.round(level * 2 * preset.elevationStrengthMul));
	const blur = Math.max(1, Math.round(level * 4 * preset.elevationStrengthMul));
	const spread = Math.max(0, level - 3);
	const alpha = Math.min(0.92, baseAlpha + level * 0.04);
	const ambientY = Math.max(1, Math.round(level / 2));
	const ambientBlur = Math.max(1, Math.round(level * 2 * preset.elevationStrengthMul));
	const ambientAlpha = Math.min(0.7, alpha * 0.6);
	return [
		`0 ${y}px ${blur}px ${spread}px rgba(0, 0, 0, ${alpha.toFixed(2)})`,
		`0 ${ambientY}px ${ambientBlur}px 0 rgba(0, 0, 0, ${ambientAlpha.toFixed(2)})`,
	].join(", ");
}

function paletteRamp(
	register: TokenRegister,
	hue: string,
	spec: { h: number; c: number } | "gray" | "white" | "black",
	scheme: Scheme,
	vibrancy: number,
	floor: number,
	preset: PresetDefaults,
	accent: OklchColor,
	panels: OklchColor[],
	pinnedBase?: OklchColor,
): void {
	const set = (suffix: string, color: OklchColor): void => {
		register[suffix ? `--color-${hue}-${suffix}` : `--color-${hue}`] = formatCss(color);
	};

	// The component-facing five-token tone family — solid / soft-tint / on-solid ink / on-tint
	// ink / vivid panel ink — re-expressed from the ramp so `tone="pink"` resolves the same shape
	// as `tone="accent"`.
	const family = (solid: string, bg: string, fg: string, text: string, vivid: string): void => {
		register[`--${hue}`] = solid;
		register[`--${hue}-bg`] = bg;
		register[`--${hue}-fg`] = fg;
		register[`--${hue}-text`] = text;
		register[`--${hue}-vivid`] = vivid;
	};

	const grayscale = (lights: [number, number, number, number], chroma: number): void => {
		const stops = lights.map((l) => oklch(l, chroma, 0));
		const baseStop = stops[2] as OklchColor;
		const subtleStop = stops[0] as OklchColor;
		const strongStop = liftStopForContrast(stops[3] as OklchColor, formatCss(subtleStop), AA + 0.2, (stops[3] as OklchColor).l >= subtleStop.l);
		// Achromatic inks must stay neutral — a hued ink would read as tinted gray (e.g. blue text on a gray chip).
		const contrast = readableOnTint(baseStop, 0, AA + 0.3, 0);
		set("", baseStop);
		set("subtle", subtleStop);
		set("muted", stops[1] as OklchColor);
		set("base", baseStop);
		set("strong", strongStop);
		register[`--color-${hue}-contrast`] = contrast;
		// Achromatic poles can't read `strong` on `subtle` (same end of the scale), so the soft ink
		// is computed toward the opposite pole instead. Vivid is the readable achromatic ink that
		// clears every panel — chroma 0, so it lands on the contrasting pole.
		family(
			formatCss(baseStop),
			formatCss(subtleStop),
			contrast,
			readableOnTint(subtleStop, 0, AA + 0.2, 0),
			vividOnPanel(0, panels, floor, 0),
		);
	};

	if (spec === "white") {
		grayscale([0.82, 0.9, 0.97, 1], 0);
		return;
	}
	if (spec === "black") {
		grayscale([0.05, 0.12, 0.2, 0.32], 0);
		return;
	}
	if (spec === "gray") {
		grayscale([0.4, 0.55, 0.68, 0.82], 0.005);
		return;
	}

	// The named hues track the accent's posture: chroma scales with the accent's own chroma
	// about a neutral reference (factor ~1), floored so a near-gray accent still leaves a color
	// recognizable, and the lightness ladder biases gently toward the accent's lightness.
	const accentChromaFactor = Math.max(0.5, Math.min(1.6, accent.c / NEUTRAL_ACCENT_CHROMA));
	const chroma = spec.c * accentChromaFactor * (0.6 + vibrancy * 0.7) * preset.paletteChromaMul;
	const baseL = scheme === "dark" ? 0.7 : 0.55;
	const lBias = Math.max(-0.06, Math.min(0.06, (accent.l - baseL) * 0.25));
	const ladderL = (scheme === "dark" ? [0.45, 0.58, baseL, 0.82] : [0.78, 0.66, baseL, 0.42]).map(
		(l) => Math.max(0.05, Math.min(0.97, l + lBias)),
	);
	const ladderC = [chroma * 0.7, chroma * 0.9, chroma, chroma * 0.85];
	const stops = ladderL.map((l, i) =>
		clampToGamut(oklch(l as number, ladderC[i] as number, spec.h)),
	);
	const base = stops[2] as OklchColor;
	// When the tone solid is pinned, the four-token family is built around the pinned color
	// (its exact value as the solid, its readable ink as the on-solid fg) while the `--color-*`
	// swatch ramp keeps its derived lightness ladder — so a pinned `--green` carries venom into
	// `--green-bg/--green-fg/--green-text`, and the swatch scale stays monotonic.
	const solidBase = pinnedBase ?? base;
	const subtleStop = stops[0] as OklchColor;
	const strongStop = liftStopForContrast(stops[3] as OklchColor, formatCss(subtleStop), AA + 0.2, (stops[3] as OklchColor).l >= subtleStop.l);
	const contrast = readableOnTint(solidBase, spec.h, Math.max(floor, AA + 0.3));
	set("", base);
	set("subtle", subtleStop);
	set("muted", stops[1] as OklchColor);
	set("base", base);
	set("strong", strongStop);
	register[`--color-${hue}-contrast`] = contrast;
	// The tone `-bg` is a soft wash near the surface — lightness just off `--bg-0`, a fraction of the
	// tone's chroma — like `--accent-bg`/`--{role}-bg`, not the swatch ramp's `subtle` chip (a
	// recognizable color that reads garish as a full background). `-text` is then derived to clear AA
	// on that wash. The `--color-*` swatch ramp keeps its own `subtle`/`strong` stops for swatches.
	const bg0p = panels[0] as OklchColor;
	const washL = scheme === "dark" ? Math.max(0.2, bg0p.l + 0.08) : Math.min(0.92, bg0p.l - 0.04);
	const bgTint = ensureTextHeadroom(oklch(washL, chroma * 0.35, spec.h), scheme, AA + 0.3);
	const bgText = readableHuedOnTintAndPanel(bgTint, spec.h, AA + 0.3, panels.slice(1), AA + 0.05, chroma);
	// vivid carries the tone's own theme-scaled chroma to the panels' contrasting pole.
	family(
		formatCss(solidBase),
		formatCss(bgTint),
		contrast,
		bgText,
		vividOnPanel(spec.h, panels, floor, chroma),
	);
}

/**
 * The honest derivation lineage for a single `derive` invocation: every produced
 * token expressed as a {@link TokenNode} whose `refs` name the tokens it derives
 * from and whose `resolve` recomputes its value. `resolveGraph(buildGraph(preset,
 * opts))` reconstructs the register, so the graph — not a side-channel — is the
 * source of the output. Pinned constraints enter as `value` nodes that downstream
 * tokens reference, preserving the pin re-entry semantics: a dependent re-solves
 * around the pin yet still declares it as a ref.
 *
 * Color tokens whose values depend on contrast-coupled OKLCH math compute through
 * shared intermediates captured in this builder's scope; their `refs` remain
 * honest (they name the anchor / knob / token inputs the math consumed) even
 * though the `resolve` closure returns a precomputed string rather than reparsing
 * its refs. Structural and scale tokens (space / text / radius / fonts / …) are
 * pure functions of their knob inputs.
 */
/** A foreground's own lightness implies the room it wants: light ink wants a dark room, dark ink a light one. */
function schemeFromFg(fg: OklchColor): Scheme {
	return fg.l >= 0.5 ? "dark" : "light";
}

/**
 * A surface synthesized for `scheme` when no background is given: placed at the algorithm's own
 * signature surface depth (so a derived theme keeps the algorithm's contrast character) and washed
 * faintly toward `hue`, with text headroom guaranteed so an ink can always clear it.
 */
function deriveSurface(
	scheme: Scheme,
	hue: number,
	chroma: number,
	depth: number,
	floor: number,
): OklchColor {
	const l = scheme === "dark" ? depth : 1 - depth;
	return ensureTextHeadroom(oklch(l, chroma, hue), scheme, floor);
}

interface CompletedAnchors {
	bg: OklchColor;
	fg: OklchColor;
	accent: OklchColor;
	scheme: Scheme;
	/** True when the accent was chosen (provided as a token value or baked as the algorithm's default)
	 * rather than synthesized — a chosen accent is honored verbatim, only a synthesized one is shaped. */
	accentExplicit: boolean;
}

/**
 * The algorithm's base response to *whatever the caller specified* — including nothing. The only
 * explicit inputs are the token values the caller provides; every token left unspecified is derived
 * from the ones that are, never backfilled from a fixed constant. So an accent alone grows a whole
 * room around it (a surface washed toward its hue, an ink for contrast), a foreground alone picks
 * its own scheme and a surface at the opposite pole, and the bare call falls to the algorithm's
 * signature default. A `scheme` knob overrides the inferred pole, flipping a given background's
 * lightness across 0.5 to honor it while keeping its hue and chroma.
 */
function completeAnchors(preset: PresetDefaults, opts: DeriveOptions): CompletedAnchors {
	const pin = opts.constraints ?? {};
	// Every seed enters through the one token channel. A provided value of any token seeds the whole
	// derivation — scheme included — with nothing privileged: `--bg-0`/`--fg-0`/`--accent` are simply
	// the three you reach for most, not a separate tier.
	const givenBg = parsePin(pin["--bg-0"]);
	const givenFg = parsePin(pin["--fg-0"]);
	const givenAccent = parsePin(pin["--accent"]);

	const defBg = toOklchColor(preset.defaultAnchors.bg);
	const defFg = toOklchColor(preset.defaultAnchors.fg);
	const defScheme = schemeOf(defBg);
	const surfaceDepth = defScheme === "dark" ? defBg.l : 1 - defBg.l;
	const floor = Math.max(ENFORCE, preset.contrastFloor);

	const inferredScheme: Scheme = givenBg
		? schemeOf(givenBg)
		: givenFg
			? schemeFromFg(givenFg)
			: defScheme;
	const scheme: Scheme = opts.knobs?.scheme ?? inferredScheme;

	let bg: OklchColor;
	if (givenBg) {
		bg = scheme === schemeOf(givenBg) ? givenBg : withLightness(givenBg, 1 - givenBg.l);
	} else if (givenAccent || givenFg) {
		const hue = givenAccent?.h ?? (givenFg as OklchColor).h;
		const tint = givenAccent ? DERIVED_SURFACE_TINT_C : 0.005;
		bg = deriveSurface(scheme, hue, tint, surfaceDepth, floor);
	} else {
		bg = scheme === defScheme ? defBg : withLightness(defBg, 1 - defBg.l);
	}

	const fg = givenFg ?? defFg;
	const accentExplicit = givenAccent !== null || preset.defaultAnchors.accent !== undefined;
	const accent =
		givenAccent ??
		(preset.defaultAnchors.accent
			? toOklchColor(preset.defaultAnchors.accent)
			: deriveAccentAnchor(bg, fg));

	return { bg, fg, accent, scheme, accentExplicit };
}

/** A pinned color value parsed to OKLCH, or null if absent / unparseable. */
function parsePin(value: string | undefined): OklchColor | null {
	if (!value) return null;
	try {
		const o = toOklchColor(value);
		if (Number.isNaN(o.l) || Number.isNaN(o.c)) return null;
		return o;
	} catch {
		return null;
	}
}

/** As {@link parsePin}, but only when the pin carries a usable hue — the gate for re-hueing a derived family around it. */
function parseChromaticPin(value: string | undefined): OklchColor | null {
	const o = parsePin(value);
	if (!o || Number.isNaN(o.h) || o.c < ACHROMATIC_CHROMA) return null;
	return o;
}

/** The catalog hue angle for a named palette color (achromatic entries report 0). */
function paletteHueAngle(name: string): number {
	const spec = PALETTE_HUES[name];
	return typeof spec === "object" ? spec.h : 0;
}

/** The hue a status role inherits from its named palette color, following a pin on that color. */
function resolveStatusHue(role: string, pinned: TokenRegister): number {
	const name = STATUS_TO_HUE[role as keyof typeof STATUS_TO_HUE] ?? "red";
	const pin = parseChromaticPin(
		pinned[`--${name}`] ?? pinned[`--color-${name}-base`] ?? pinned[`--color-${name}`],
	);
	return pin ? pin.h : paletteHueAngle(name);
}

export function buildGraph(preset: PresetDefaults, opts: DeriveOptions): TokenNode[] {
	const completed = completeAnchors(preset, opts);
	const bg = completed.bg;
	const fgAnchor = completed.fg;
	const pinned: TokenRegister = opts.constraints ?? {};
	const accent = pinned["--accent"] ? toOklchColor(pinned["--accent"]) : completed.accent;

	const scheme: Scheme = completed.scheme;
	const knobs: Knobs = opts.knobs ?? {};
	const shiftStep =
		typeof knobs.accentShiftStep === "number" ? knobs.accentShiftStep : DEFAULT_SHIFT_STEP;
	const accentSplit =
		typeof knobs.accentSplit === "number" ? knobs.accentSplit : DEFAULT_ACCENT_SPLIT;
	const band = contrastBandFloor(knobs);
	const floor = Math.max(ENFORCE, preset.contrastFloor, (band ?? 0) + 0.2);
	const extreme = preset.extreme === true;
	let vibrancy = vibrancyOf(knobs, preset);
	if (extreme) vibrancy = 1;
	const typeScale = typeScaleOf(knobs);
	const radiusScale = radiusScaleOf(knobs);
	const density = densityOf(knobs);
	const fonts = fontsOf(knobs);

	const surfaceStep = 0.045;

	const nodes: TokenNode[] = [];
	const lit = (name: TokenName, value: string, refs?: TokenName[]): void => {
		nodes.push(refs && refs.length ? { name, value, refs } : { name, value });
	};

	const pinKeys = new Set<TokenName>(Object.keys(pinned));
	const refIfPinned = (...names: TokenName[]): TokenName[] =>
		names.filter((n) => pinKeys.has(n));

	lit("--scheme", scheme);

	const bg0 = pinned["--bg-0"]
		? toOklchColor(pinned["--bg-0"])
		: extreme
			? oklch(scheme === "dark" ? 0 : 1, 0, 0)
			: ensureTextHeadroom(
					withLightness(bg, stepLightness(bg.l, scheme, surfaceStep, 1)),
					scheme,
					floor,
				);
	const pageFloor = (fill: OklchColor): OklchColor =>
		separateFillFromSurface(fill, bg0, SURFACE_SEPARATION, floor);
	const direction = scheme === "dark" ? 1 : -1;
	const surfaceColors: OklchColor[] = SURFACES.map((_, index) =>
		withLightness(bg0, bg0.l + direction * surfaceStep * (index - 1)),
	);
	SURFACES.forEach((name, index) => {
		lit(name, formatCss(surfaceColors[index] as OklchColor), refIfPinned("--bg-0"));
	});

	lit(
		"--bg-sunken",
		formatCss(withLightness(bg0, bg0.l - direction * surfaceStep * 2)),
		refIfPinned("--bg-0"),
	);

	lit("--scrim", formatCss(oklch(scheme === "dark" ? 0 : 0.1, 0, 0, 0.6)));

	const overlayBase = withLightness(bg0, scheme === "dark" ? bg0.l + 0.07 : bg0.l + 0.03);
	lit("--surface-overlay", formatCss(overlayBase), refIfPinned("--bg-0"));
	lit(
		"--surface-overlay-border",
		formatCss(
			withAlpha(withLightness(bg0, scheme === "dark" ? bg0.l + 0.25 : bg0.l - 0.2), 0.6),
		),
		refIfPinned("--bg-0"),
	);

	const fg0 = pinned["--fg-0"]
		? toOklchColor(pinned["--fg-0"])
		: extreme
			? bestTruePole(formatCss(bg0))
			: enforceContrastFloor(
					withLightness(
						fgAnchor,
						scheme === "dark" ? Math.max(fgAnchor.l, 0.9) : Math.min(fgAnchor.l, 0.2),
					),
					bg0,
					scheme,
					floor,
				);
	lit("--fg-0", formatCss(fg0), refIfPinned("--bg-0", "--fg-0"));

	const fgBg0Css = formatCss(bg0);
	const fg0Contrast = emittedContrast(fg0, fgBg0Css);
	const panelRef = surfaceColors[PANEL_REF_INDEX] as OklchColor;
	const panelRefCss = formatCss(panelRef);
	const panelSurfaces = PANEL_SURFACES.map(
		(s) => surfaceColors[SURFACES.indexOf(s)] as OklchColor,
	);
	const rampFloor = extreme
		? Math.min(fg0Contrast, Math.max(floor, fg0Contrast * 0.66))
		: Math.min(floor, fg0Contrast);
	const conservativeFloorL = (target: number): number => {
		const againstBg0 = lightnessForContrast(fg0, bg0, fgBg0Css, target);
		const againstPanel = lightnessForContrast(fg0, panelRef, panelRefCss, target);
		return Math.abs(againstBg0 - fg0.l) <= Math.abs(againstPanel - fg0.l)
			? againstBg0
			: againstPanel;
	};
	const textLight = scheme === "dark";
	const enforceOnPanels = (color: OklchColor): OklchColor => {
		const onBg0 = enforceContrastFloor(color, bg0, scheme, floor);
		const sameSidePanels = panelSurfaces.filter((p) => p.l < 0.5 === textLight);
		if (sameSidePanels.length === 0) return onBg0;
		const panelCss = sameSidePanels.map((p) => formatCss(p));
		const minPanel = (c: OklchColor): number =>
			Math.min(...panelCss.map((p) => emittedContrast(c, p)));
		if (minPanel(onBg0) >= floor - 0.01) return onBg0;
		const targetL = textLight ? 1 : 0;
		let best = onBg0;
		let bestMin = minPanel(onBg0);
		for (let i = 1; i <= 100; i++) {
			const t = i / 100;
			const candidate = withLightness(onBg0, onBg0.l + (targetL - onBg0.l) * t);
			if (emittedContrast(candidate, fgBg0Css) < floor - 0.01) break;
			const m = minPanel(candidate);
			if (m > bestMin) {
				bestMin = m;
				best = candidate;
			}
			if (m >= floor) break;
		}
		return best;
	};
	// Hue-preserving contrast enforcement for brand-toned text tokens (link, accent-text):
	// step lightness toward the readable pole keeping chroma + hue until it clears the floor
	// against bg-0 and the same-side panels. Unlike `enforceOnPanels` — which leans on
	// `sweepToward`'s desaturate-to-gray / true-pole fallback (right for neutral text) — this
	// keeps a vivid accent vivid instead of collapsing it to black on light themes; it only
	// falls back to that floor-guaranteeing path when hue can't survive the required contrast.
	const enforceChromaticOnPanels = (color: OklchColor): OklchColor => {
		const bg0Css = formatCss(bg0);
		const sameSidePanels = panelSurfaces.filter((p) => p.l < 0.5 === textLight);
		const refsCss = [bg0Css, ...sameSidePanels.map((p) => formatCss(p))];
		const minRef = (c: OklchColor): number =>
			Math.min(...refsCss.map((r) => emittedContrast(c, r)));
		if (minRef(color) >= floor - 0.01) return color;
		const targetL = textLight ? 1 : 0;
		for (let i = 1; i <= 100; i++) {
			const candidate = withLightness(color, color.l + (targetL - color.l) * (i / 100));
			if (minRef(candidate) >= floor) return candidate;
		}
		return enforceOnPanels(color);
	};
	const floorL = conservativeFloorL(rampFloor);
	for (let i = 1; i <= 3; i++) {
		const reduced = withLightness(fg0, fg0.l + (floorL - fg0.l) * (i / 3));
		lit(`--fg-${i}`, formatCss(reduced), ["--fg-0", ...refIfPinned("--bg-0")]);
	}
	lit(
		"--fg-disabled",
		formatCss(withLightness(fg0, conservativeFloorL(3))),
		["--fg-0", ...refIfPinned("--bg-0")],
	);
	const placeholderFloor = extreme ? rampFloor : Math.min(floor, fg0Contrast);
	const placeholderL = conservativeFloorL(placeholderFloor);
	lit(
		"--placeholder",
		formatCss(withLightness(fg0, placeholderL)),
		["--fg-0", ...refIfPinned("--bg-0")],
	);

	// A chosen accent (provided or baked) is honored verbatim — the algorithm's taste lands in the
	// expansion around it, not in overriding the color. Only a synthesized accent is shaped: scaled
	// to the algorithm's chroma and floored for separation, since it is a guess that should read well.
	const accentFill =
		pinned["--accent"] || completed.accentExplicit
			? accent
			: pageFloor(
					fillWithTextHeadroom(
						accent.l,
						accent.c * (0.6 + vibrancy * 0.8) * preset.accentChromaMul,
						accent.h,
						floor,
					),
				);
	const accentValue = pinned["--accent"] ?? formatCss(accentFill);
	lit("--accent", accentValue, refIfPinned("--accent"));
	lit("--accent-fg", pickReadable(accentFill, TEXT_POLES, floor), ["--accent"]);

	const accentTextColor = enforceChromaticOnPanels(accentFill);
	const accentTextCss = formatCss(accentTextColor);
	// The soft tint must read against the very ink the soft variant paints on it, so derive the
	// tint to clear AA against `--accent-text` (nudging its lightness away from the ink), rather
	// than leaving the pairing to chance.
	const accentTint = liftStopForContrast(
		oklch(
			scheme === "dark" ? Math.max(0.2, bg0.l + 0.08) : Math.min(0.92, bg0.l - 0.04),
			accentFill.c * preset.accentTintChromaMul,
			accentFill.h,
		),
		accentTextCss,
		AA + 0.2,
		accentTextColor.l < 0.5,
	);
	lit("--accent-bg", formatCss(accentTint), ["--accent", ...refIfPinned("--bg-0")]);
	lit("--accent-text", accentTextCss, ["--accent", ...refIfPinned("--bg-0")]);
	lit(
		"--accent-vivid",
		vividOnPanel(accentFill.h, [bg0, ...panelSurfaces], floor, accentFill.c),
		["--accent", ...refIfPinned("--bg-0")],
	);

	const pinnedNeutral = parsePin(pinned["--neutral"]);
	const neutralFill =
		pinnedNeutral ??
		pageFloor(
			fillWithTextHeadroom(scheme === "dark" ? 0.6 : 0.5, preset.neutralChroma, accentFill.h, floor),
		);
	const neutralTintHue = Number.isFinite(neutralFill.h) ? neutralFill.h : accentFill.h;
	lit("--neutral", formatCss(neutralFill), ["--accent", ...refIfPinned("--neutral")]);
	const neutralTextColor = enforceOnPanels(neutralFill);
	const neutralTextCss = formatCss(neutralTextColor);
	const neutralTint = liftStopForContrast(
		oklch(
			scheme === "dark" ? Math.max(0.2, bg0.l + 0.06) : Math.min(0.92, bg0.l - 0.04),
			0.005,
			neutralTintHue,
		),
		neutralTextCss,
		AA + 0.2,
		neutralTextColor.l < 0.5,
	);
	lit("--neutral-bg", formatCss(neutralTint), ["--accent", ...refIfPinned("--bg-0")]);
	lit("--neutral-fg", pickReadable(neutralFill, TEXT_POLES, floor), ["--neutral"]);
	lit("--neutral-text", neutralTextCss, ["--neutral", ...refIfPinned("--bg-0")]);
	lit("--neutral-vivid", neutralTextCss, ["--neutral-text", ...refIfPinned("--bg-0")]);

	const lineSeed = extreme
		? oklch(scheme === "dark" ? 0.7 : 0.3, 0, 0)
		: withLightness(bg0, scheme === "dark" ? bg0.l + 0.12 : bg0.l - 0.12);
	lit("--line", formatCss(borderForContrast(lineSeed, bg0, BORDER_SEPARATION)), refIfPinned("--bg-0"));
	const line2Seed = extreme
		? oklch(scheme === "dark" ? 0.85 : 0.15, 0, 0)
		: withLightness(bg0, scheme === "dark" ? bg0.l + 0.2 : bg0.l - 0.2);
	lit("--line-2", formatCss(borderForContrast(line2Seed, bg0, DIVIDER_SEPARATION)), refIfPinned("--bg-0"));
	lit("--ring", formatCss(withAlpha(accentFill, 0.7)), ["--accent"]);
	lit("--ring-bg", formatCss(withAlpha(accentFill, 0.18)), ["--accent"]);

	const fieldBg = withLightness(bg0, scheme === "dark" ? bg0.l - 0.03 : bg0.l + 0.02);
	lit("--field-bg", formatCss(fieldBg), refIfPinned("--bg-0"));
	const fieldBorderSeed = extreme
		? oklch(scheme === "dark" ? 0.8 : 0.2, 0, 0)
		: withLightness(bg0, scheme === "dark" ? bg0.l + 0.16 : bg0.l - 0.16);
	lit(
		"--field-border",
		formatCss(borderForContrast(fieldBorderSeed, fieldBg, BORDER_SEPARATION)),
		refIfPinned("--bg-0"),
	);

	lit(
		"--accent-hover",
		formatCss(withLightness(accentFill, accentFill.l + (scheme === "dark" ? 0.06 : -0.06))),
		["--accent"],
	);
	lit(
		"--accent-active",
		formatCss(withLightness(accentFill, accentFill.l + (scheme === "dark" ? -0.06 : 0.06))),
		["--accent"],
	);
	const accentDisplay = toOklchColor(accentValue);
	interface AccentDelta {
		dL: number;
		dC: number;
		dH: number;
	}
	const accentDelta = (from: OklchColor, to: OklchColor): AccentDelta => ({
		dL: to.l - from.l,
		dC: to.c - from.c,
		dH: hueDelta(from.h, to.h),
	});
	const applyAccentDelta = (from: OklchColor, delta: AccentDelta): OklchColor => {
		const rawL = from.l + delta.dL;
		const l =
			delta.dL === 0
				? Math.min(1, Math.max(0, rawL))
				: Math.min(ACCENT_RAMP_L_MAX, Math.max(ACCENT_RAMP_L_MIN, rawL));
		return {
			l,
			c: Math.max(0, from.c + delta.dC),
			h: (((from.h + delta.dH) % 360) + 360) % 360,
			alpha: 1,
		};
	};
	const emitAccent = (color: OklchColor): string => {
		const maxC = clampToGamut({ l: color.l, c: color.c, h: color.h, alpha: 1 }).c;
		return formatCss({ ...color, c: Math.min(color.c, maxC) });
	};
	const a1 = accentDisplay;
	const rotate = (deg: number): AccentDelta => ({ dL: 0, dC: 0, dH: deg });
	const fanned = (n: string, derived: OklchColor): OklchColor =>
		pinned[`--accent-${n}`] ? toOklchColor(pinned[`--accent-${n}`] as string) : derived;
	let a2: OklchColor;
	let a3: OklchColor;
	let a4: OklchColor;
	if (ACCENT_FAN === "split-complement") {
		// The two flanks are symmetric either way: pin either wing and the other mirrors its hue
		// across the accent, so the fan stays balanced around the author's choice. With neither
		// pinned it's the default ∓split; with both pinned each holds its own value. Lightness and
		// chroma stay the accent's throughout, per the constant-L/C fan.
		const mirrorOf = (c: OklchColor): OklchColor => applyAccentDelta(a1, rotate(-hueDelta(a1.h, c.h)));
		const a2Pin = pinned["--accent-2"];
		const a3Pin = pinned["--accent-3"];
		let a2Derived = applyAccentDelta(a1, rotate(-accentSplit));
		let a3Derived = applyAccentDelta(a1, rotate(accentSplit));
		if (a2Pin && !a3Pin) a3Derived = mirrorOf(toOklchColor(a2Pin as string));
		else if (a3Pin && !a2Pin) a2Derived = mirrorOf(toOklchColor(a3Pin as string));
		a2 = fanned("2", a2Derived);
		a3 = fanned("3", a3Derived);
		a4 = fanned("4", applyAccentDelta(a1, rotate(180)));
	} else {
		a2 = fanned("2", applyAccentDelta(a1, rotate(shiftStep)));
		a3 = fanned("3", applyAccentDelta(a2, accentDelta(a1, a2)));
		a4 = fanned("4", applyAccentDelta(a3, accentDelta(a2, a3)));
	}
	lit("--accent-2", emitAccent(a2), ["--accent", "--accent-shift-step"]);
	lit("--accent-3", emitAccent(a3), ["--accent-2", "--accent"]);
	lit("--accent-4", emitAccent(a4), ["--accent-3", "--accent-2"]);
	lit("--accent-shift-step", String(shiftStep));

	// Give each accent-ramp variant the same four-token family the primary accent has, so an
	// `accent-3` button / rail reads the same way an `accent` one does — derived, not hand-tuned.
	const emitAccentFamily = (n: string, raw: OklchColor): void => {
		const color = toOklchColor(emitAccent(raw));
		lit(`--accent-${n}-fg`, pickReadable(color, TEXT_POLES, floor), [`--accent-${n}`]);
		const tint = oklch(
			scheme === "dark" ? Math.max(0.2, bg0.l + 0.08) : Math.min(0.92, bg0.l - 0.04),
			color.c * preset.accentTintChromaMul,
			color.h,
		);
		lit(`--accent-${n}-bg`, formatCss(tint), [`--accent-${n}`, ...refIfPinned("--bg-0")]);
		lit(
			`--accent-${n}-text`,
			readableHuedOnTintAndPanel(tint, color.h, AA + 0.3, panelSurfaces, AA + 0.05, color.c),
			[`--accent-${n}-bg`, ...refIfPinned("--bg-0")],
		);
		lit(
			`--accent-${n}-vivid`,
			vividOnPanel(color.h, [bg0, ...panelSurfaces], floor, color.c),
			[`--accent-${n}`, ...refIfPinned("--bg-0")],
		);
	};
	emitAccentFamily("2", a2);
	emitAccentFamily("3", a3);
	emitAccentFamily("4", a4);
	lit("--selection-cue", extreme || knobs.cues === "redundant" ? "marker" : "tint");

	const statusChroma = Math.max(0.12, accent.c) * (0.6 + vibrancy * 0.7) * preset.statusChromaMul;
	for (const role of Object.keys(STATUS_TO_HUE)) {
		// The role's hue comes from its named palette color (danger←red, success←green,
		// warn←orange, info←blue), following a pin on that color — so a re-hued red moves danger.
		// A direct pin on the status fill still wins: it drives its own tint and inks at the
		// pin's hue, so a pinned `--danger` carries through `--danger-bg/--danger-fg/--danger-text`.
		const namedHue = resolveStatusHue(role, pinned);
		const pinnedFill = parseChromaticPin(pinned[`--${role}`]);
		const roleHue = pinnedFill ? pinnedFill.h : namedHue;
		const fillL = scheme === "dark" ? 0.62 : 0.52;
		const fill = pinnedFill ?? pageFloor(fillWithTextHeadroom(fillL, statusChroma, roleHue, floor));
		const tintL = scheme === "dark" ? Math.min(0.3, bg0.l + 0.08) : Math.min(0.92, bg0.l - 0.04);
		const tint = ensureTextHeadroom(oklch(tintL, statusChroma * 0.35, roleHue), scheme, AA + 0.3);
		const fillRefs = refIfPinned("--accent", `--${role}`);
		lit(`--${role}`, formatCss(fill), fillRefs);
		lit(`--${role}-bg`, formatCss(tint), [`--${role}`, ...refIfPinned("--bg-0")]);
		lit(`--${role}-fg`, pickReadable(fill, TEXT_POLES, floor), [`--${role}`]);
		lit(
			`--${role}-text`,
			readableHuedOnTintAndPanel(tint, roleHue, AA + 0.3, panelSurfaces, AA + 0.05, statusChroma),
			[`--${role}-bg`, ...refIfPinned("--bg-0")],
		);
		lit(
			`--${role}-vivid`,
			vividOnPanel(roleHue, [bg0, ...panelSurfaces], floor, statusChroma),
			[`--${role}`, ...refIfPinned("--bg-0")],
		);
	}

	const overlayL = scheme === "dark" ? 1 : 0;
	// A flat-alpha tint reads weakest where the surface sits closest to the overlay's
	// opposite pole — 6% white over near-black (or black over near-white) barely registers
	// (measured ~1.10:1 vs ~1.19:1 on a mid-range dark bg). Boost the alpha as the bg anchor
	// approaches that extreme so hover/press/selected keep a perceptible step; mid-range
	// themes are untouched (boost = 1).
	const extremeDist = scheme === "dark" ? bg0.l : 1 - bg0.l;
	const overlayBoost = 1 + Math.max(0, (0.15 - extremeDist) / 0.15) * 0.8;
	const overlay = (a: number): string =>
		formatCss(oklch(overlayL, 0, 0, Math.min(0.4, a * overlayBoost)));
	lit("--state-hover", overlay(0.06));
	lit("--state-press", overlay(0.12));
	lit("--state-selected", overlay(0.16));
	lit("--state-disabled", overlay(0.08));
	lit("--state-drag", overlay(0.1));

	lit("--selection", formatCss(withAlpha(accentFill, 0.3)), ["--accent"]);
	lit(
		"--highlight",
		formatCss(
			withAlpha(oklch(scheme === "dark" ? 0.85 : 0.9, 0.16, paletteHueAngle("yellow")), 0.35),
		),
	);

	lit("--link", formatCss(enforceChromaticOnPanels(accent)), ["--accent", ...refIfPinned("--bg-0")]);
	lit(
		"--link-hover",
		formatCss(
			enforceChromaticOnPanels(
				withLightness(accent, accent.l + (scheme === "dark" ? 0.08 : -0.08)),
			),
		),
		["--link", ...refIfPinned("--bg-0")],
	);

	for (const [hue, spec] of Object.entries(PALETTE_HUES)) {
		// Pinning the tone solid (or its swatch base) re-hues the whole derived family around it,
		// so the soft tint and inks track the pin instead of the generic catalog hue.
		const pinnedBase =
			typeof spec === "object"
				? parseChromaticPin(
						pinned[`--${hue}`] ?? pinned[`--color-${hue}-base`] ?? pinned[`--color-${hue}`],
					)
				: null;
		const effectiveSpec =
			pinnedBase && typeof spec === "object" ? { h: pinnedBase.h, c: pinnedBase.c } : spec;
		const ramp: TokenRegister = {};
		paletteRamp(
			ramp,
			hue,
			effectiveSpec,
			scheme,
			vibrancy,
			floor,
			preset,
			accent,
			[bg0, ...panelSurfaces],
			pinnedBase ?? undefined,
		);
		lit(`--color-${hue}`, ramp[`--color-${hue}`] as string);
		for (const stop of PALETTE_STOPS) {
			lit(`--color-${hue}-${stop}`, ramp[`--color-${hue}-${stop}`] as string, [
				`--color-${hue}`,
			]);
		}
		lit(`--${hue}`, ramp[`--${hue}`] as string, [`--color-${hue}-base`]);
		lit(`--${hue}-bg`, ramp[`--${hue}-bg`] as string, [`--color-${hue}-subtle`]);
		lit(`--${hue}-fg`, ramp[`--${hue}-fg`] as string, [`--color-${hue}-base`]);
		lit(`--${hue}-text`, ramp[`--${hue}-text`] as string, [`--color-${hue}-subtle`]);
		lit(`--${hue}-vivid`, ramp[`--${hue}-vivid`] as string, [
			`--color-${hue}-base`,
			...refIfPinned("--bg-0"),
		]);
	}

	const codeBg = ensureTextHeadroom(
		withLightness(bg0, scheme === "dark" ? bg0.l - 0.02 : bg0.l + 0.012),
		scheme,
		floor,
	);
	const codeBgCss = formatCss(codeBg);
	lit("--code-bg", codeBgCss, refIfPinned("--bg-0"));

	const codeFg = enforceContrastFloor(fg0, codeBg, scheme, floor);
	const codeFgCss = formatCss(codeFg);
	lit("--code-fg", codeFgCss, ["--fg-0", ...refIfPinned("--bg-0")]);
	lit("--code-line-highlight", formatCss(withAlpha(accentFill, 0.1)), ["--accent"]);
	lit("--code-selection", formatCss(withAlpha(accentFill, 0.3)), ["--accent"]);

	// The readable ink direction follows the editor surface itself, not the page
	// scheme — a vivid mid-lightness `--code-bg` (e.g. a saturated brand panel) can
	// invert which pole reads, and sweeping the wrong way collapses the palette.
	const codeTowardLight = contrast("#ffffff", codeBgCss) >= contrast("#000000", codeBgCss);
	const codePole = codeTowardLight ? 1 : 0;
	const codeFloor = AA;
	const readableHuedOnCode = (l: number, c: number, h: number, fl: number): OklchColor => {
		const seed = oklch(l, c, h);
		let best = seed;
		let bestContrast = emittedContrast(seed, codeBgCss);
		if (bestContrast >= fl) return seed;
		for (let i = 1; i <= 100; i++) {
			const cand = withLightness(seed, seed.l + (codePole - seed.l) * (i / 100));
			const ct = emittedContrast(cand, codeBgCss);
			if (ct >= fl) return cand;
			if (ct > bestContrast) {
				bestContrast = ct;
				best = cand;
			}
		}
		return best;
	};
	const codeChroma = Math.max(
		0.08,
		Math.max(0.1, accent.c) * (0.7 + vibrancy * 0.7) * preset.paletteChromaMul,
	);
	// A near-gray accent has no hue to anchor the spread to, so seed the code wheel
	// from the fallback hue rather than letting `NaN` collapse every scope to one ink.
	const codeBaseHue = Number.isFinite(accent.h) ? accent.h : DERIVED_ACCENT_FALLBACK_HUE;
	const codeBaseL = codeTowardLight ? 0.76 : 0.46;
	// Place the vivid scopes inside the lightness band where `--code-bg` already
	// clears AA toward its readable pole, rather than letting each scope sweep there
	// independently — independent sweeps converge in lightness and collapse the
	// palette on a tight bg. Spreading distinct lightnesses across the achievable
	// band keeps neighbours separable by construction, by as much as the bg affords.
	const codePoleL = codeTowardLight ? 1 : 0;
	const aaEdgeL = lightnessForContrast(oklch(codePoleL, 0, 0), codeBg, codeBgCss, codeFloor);
	// Keep the band clear of the pole: near the pole gamut-clamping kills chroma, so
	// the brightest scopes would desaturate into the neutral plain-text ink.
	const bandLo = aaEdgeL + (codePoleL - aaEdgeL) * 0.06;
	const bandHi = codePoleL - (codePoleL - aaEdgeL) * 0.32;
	CODE_VIVID_ROLES.forEach((role, rank) => {
		const hue = (((codeBaseHue + (CODE_HUE_RANK[rank] as number) * 45) % 360) + 360) % 360;
		const bandL = bandLo + (bandHi - bandLo) * (rank / 7);
		const fill = readableHuedOnCode(bandL, codeChroma, hue, codeFloor);
		lit(`--code-${role}`, formatCss(fill), ["--accent", "--code-bg"]);
	});

	// Large-text floor (3:1) so comments recede without vanishing.
	const commentFloor = Math.max(3, codeFloor * 0.62);
	const commentL = codeTowardLight ? 0.6 : 0.56;
	lit(
		"--code-comment",
		formatCss(readableHuedOnCode(commentL, Math.min(0.03, codeChroma * 0.3), codeBaseHue, commentFloor)),
		["--accent", "--code-bg"],
	);
	lit(
		"--code-operator",
		formatCss(readableHuedOnCode(codeBaseL, codeChroma * 0.5, codeBaseHue, codeFloor)),
		["--accent", "--code-bg"],
	);
	lit(
		"--code-punctuation",
		formatCss(
			enforceContrastFloor(
				withLightness(codeFg, codeFg.l + (codePole - codeFg.l) * 0.18),
				codeBg,
				scheme,
				codeFloor,
			),
		),
		["--code-fg", "--code-bg"],
	);
	lit("--code-variable", codeFgCss, ["--code-fg"]);

	lit("--font-sans", fonts.sans);
	lit("--font-mono", fonts.mono);
	lit("--font-display", fonts.display);

	const bodyIndex = TEXT_STEPS.indexOf("body");
	TEXT_STEPS.forEach((step, index) => {
		const rem = BASE_TEXT_REM * typeScale ** (index - bodyIndex);
		lit(`--text-${step}`, `${rem.toFixed(4).replace(/\.?0+$/, "")}rem`);
	});
	for (const step of LEADING_STEPS) {
		lit(`--leading-${step}`, String(LEADING_VALUES[step]));
	}
	for (const step of WEIGHT_STEPS) {
		lit(`--weight-${step}`, String(WEIGHT_VALUES[step]));
	}

	const radiusPx: Record<string, number> = {
		none: 0,
		sm: 2 * radiusScale,
		md: 4 * radiusScale,
		lg: 8 * radiusScale,
		full: 9999,
	};
	for (const step of RADIUS_STEPS) {
		lit(`--radius-${step}`, `${radiusPx[step]}px`);
	}
	const borderPx: Record<string, number> = { thin: 1, normal: 1.5, thick: 2 };
	for (const step of BORDER_STEPS) {
		lit(`--border-${step}`, `${borderPx[step]}px`);
	}

	const durationMs: Record<string, number> = { fast: 120, base: 200, slow: 320 };
	for (const step of DURATION_STEPS) {
		lit(`--duration-${step}`, `${durationMs[step]}ms`);
	}
	lit("--ease-standard", "cubic-bezier(0.2, 0, 0, 1)");
	lit("--ease-emphasized", "cubic-bezier(0.3, 0, 0, 1)");

	const elevationStrings: Record<number, string> = {};
	for (const level of ELEVATION_STEPS) {
		const value = shadowString(scheme, level, vibrancy, preset);
		elevationStrings[level] = value;
		lit(`--elevation-${level}`, value);
	}
	lit("--shadow", elevationStrings[3] as string, ["--elevation-3"]);

	for (const step of SPACE_STEPS) {
		const rem = SPACE_BASE_REM * step * density;
		lit(`--space-${step}`, `${rem.toFixed(4).replace(/\.?0+$/, "")}rem`);
	}

	const producedNames = new Set<TokenName>(nodes.map((n) => n.name));
	for (const [name, value] of Object.entries(pinned)) {
		if (producedNames.has(name)) {
			for (const node of nodes) {
				if (node.name === name) {
					node.value = value;
					node.resolve = undefined;
					node.refs = undefined;
				}
			}
		} else {
			nodes.push({ name, value });
		}
	}

	return nodes;
}

/**
 * The resolved base inputs a derivation reads, factored so both `buildGraph` and the
 * pipeline's per-pass {@link PassContext} agree on anchors / scheme / pins for an
 * identical request. Mirrors the head of {@link buildGraph}.
 */
export function resolveBaseInputs(
	preset: PresetDefaults,
	opts: DeriveOptions,
): { knobs: Knobs; scheme: Scheme; pinned: TokenRegister } {
	const completed = completeAnchors(preset, opts);
	return {
		knobs: opts.knobs ?? {},
		scheme: completed.scheme,
		pinned: opts.constraints ?? {},
	};
}

export function buildPassContext(
	preset: PresetDefaults,
	opts: DeriveOptions,
	passIndex: number,
): PassContext {
	const base = resolveBaseInputs(preset, opts);
	return { ...base, passIndex };
}

/**
 * The shared pipeline runner every construction path uses, so baked and hosted forms
 * run the identical pass code. The first pass receives an empty register and produces
 * the base; each later pass transforms the register it is handed. Returns the final
 * register and a snapshot after every pass (snapshot count === pass count).
 */
export function runPipeline(
	passes: Pass[],
	makeCtx: (passIndex: number) => PassContext,
): { register: TokenRegister; trace: TraceSnapshot[] } {
	let register: TokenRegister = {};
	const trace: TraceSnapshot[] = [];
	passes.forEach((pass, index) => {
		register = pass.run(register, makeCtx(index));
		trace.push({ name: pass.name, register });
	});
	return { register, trace };
}

/**
 * The base pass for the xoji family: the whole current graph derivation expressed as
 * pass one. It ignores the incoming register and rebuilds from `opts` so the pin
 * re-entry and tail constraint sweep in {@link buildGraph} stay intact — making the
 * four shipped algorithms strictly single-pass and byte-identical to today.
 */
export function settlePass(preset: PresetDefaults, opts: DeriveOptions): Pass {
	return {
		name: "settle",
		run: () => resolveGraph(buildGraph(preset, opts)),
	};
}

/**
 * Re-emits a resolved register as value-only {@link TokenNode}s in key order. For a
 * multi-pass algorithm this is the honest graph-as-data: each token carries its final
 * composed value (refs collapse to literals, the truthful statement that the value is
 * the pipeline's result). `resolveGraph(registerToNodes(r))` reproduces `r`.
 */
export function registerToNodes(register: TokenRegister): TokenNode[] {
	return Object.entries(register).map(([name, value]) => ({ name, value }));
}

function alpha(value: string | undefined): number {
	if (!value) return 1;
	const rgba = /rgba?\([^)]*?,\s*([0-9.]+)\s*\)/.exec(value);
	if (rgba && rgba[1] !== undefined) return Number.parseFloat(rgba[1]);
	if (value.startsWith("#") && value.length === 9) {
		return Number.parseInt(value.slice(7, 9), 16) / 255;
	}
	if (value.startsWith("#") && value.length === 5) {
		return Number.parseInt(value.slice(4, 5).repeat(2), 16) / 255;
	}
	return 1;
}

function parseRem(value: string | undefined): number {
	if (!value) return Number.NaN;
	const m = /^(-?[0-9.]+)(rem|px)$/.exec(value.trim());
	return m ? Number.parseFloat(m[1] as string) : Number.NaN;
}

function parseMs(value: string | undefined): number {
	if (!value) return Number.NaN;
	const m = /^(-?[0-9.]+)ms$/.exec(value.trim());
	return m ? Number.parseFloat(m[1] as string) : Number.NaN;
}

function shadowStrength(value: string | undefined): number {
	if (!value || value === "none") return 0;
	let total = 0;
	const offsets = value.match(/([0-9.]+)px/g) ?? [];
	for (const off of offsets) total += Number.parseFloat(off);
	const alphas = value.match(/rgba?\([^)]*,\s*([0-9.]+)\)/g) ?? [];
	for (const a of alphas) {
		const m = /,\s*([0-9.]+)\)/.exec(a);
		if (m) total += Number.parseFloat(m[1] as string) * 20;
	}
	return total;
}

const STATE_TOKENS = [
	"--state-hover",
	"--state-press",
	"--state-selected",
	"--state-disabled",
	"--state-drag",
];

const CEILING_EPSILON = 0.05;

function achievableFloor(declaredFloor: number, bgCss: string | undefined): number {
	if (!bgCss) return declaredFloor;
	const ceiling = Math.max(contrast("#000000", bgCss), contrast("#ffffff", bgCss));
	return Math.min(declaredFloor, ceiling - CEILING_EPSILON);
}

/** Perceptual OKLab distance between two colors — sees hue separation that luminance contrast can't. */
function oklabDist(a: string, b: string): number {
	const x = toOklchColor(a);
	const y = toOklchColor(b);
	const rad = Math.PI / 180;
	const ax = x.c * Math.cos(x.h * rad);
	const ay = x.c * Math.sin(x.h * rad);
	const bx = y.c * Math.cos(y.h * rad);
	const by = y.c * Math.sin(y.h * rad);
	return Math.hypot(x.l - y.l, ax - bx, ay - by);
}

export function makeInvariants(preset: PresetDefaults): Invariant[] {
	const onFillFloor = preset.declaredTextOnFillFloor;
	return [
		(ctx: InvariantContext): InvariantResult => {
			for (const name of PRODUCES) {
				const value = ctx.register[name];
				const category = ctx.categories[name];
				if (typeof value !== "string" || value.length === 0) {
					return {
						name: "every token non-empty and format-valid for its category",
						ok: false,
						detail: `${name} is ${value === undefined ? "missing" : "empty"}`,
					};
				}
				if (/nan/i.test(value)) {
					return {
						name: "every token non-empty and format-valid for its category",
						ok: false,
						detail: `${name} contains NaN: ${value}`,
					};
				}
				switch (category) {
					case "color": {
						try {
							const o = toOklchColor(value);
							if (
								Number.isNaN(o.l) ||
								Number.isNaN(o.c) ||
								Number.isNaN(o.h) ||
								Number.isNaN(alpha(value))
							) {
								return {
									name: "every token non-empty and format-valid for its category",
									ok: false,
									detail: `${name} parses to NaN: ${value}`,
								};
							}
						} catch (error) {
							return {
								name: "every token non-empty and format-valid for its category",
								ok: false,
								detail: `${name} unparseable color: ${value} (${String(error)})`,
							};
						}
						break;
					}
					case "length": {
						if (Number.isNaN(parseRem(value))) {
							return {
								name: "every token non-empty and format-valid for its category",
								ok: false,
								detail: `${name} not a css length: ${value}`,
							};
						}
						break;
					}
					case "duration": {
						if (Number.isNaN(parseMs(value))) {
							return {
								name: "every token non-empty and format-valid for its category",
								ok: false,
								detail: `${name} not a duration: ${value}`,
							};
						}
						break;
					}
					case "number": {
						if (Number.isNaN(Number.parseFloat(value))) {
							return {
								name: "every token non-empty and format-valid for its category",
								ok: false,
								detail: `${name} not a number: ${value}`,
							};
						}
						break;
					}
					case "easing": {
						if (!value.startsWith("cubic-bezier(")) {
							return {
								name: "every token non-empty and format-valid for its category",
								ok: false,
								detail: `${name} not an easing: ${value}`,
							};
						}
						break;
					}
					case "shadow": {
						if (value !== "none" && !value.includes("rgba")) {
							return {
								name: "every token non-empty and format-valid for its category",
								ok: false,
								detail: `${name} not a shadow: ${value}`,
							};
						}
						break;
					}
					case "font":
						break;
					case "keyword": {
						const domain = KEYWORD_DOMAINS[name];
						if (domain && !domain.includes(value)) {
							return {
								name: "every token non-empty and format-valid for its category",
								ok: false,
								detail: `${name} not in {${domain.join(" | ")}}: ${value}`,
							};
						}
						break;
					}
				}
			}
			return { name: "every token non-empty and format-valid for its category", ok: true };
		},
		(ctx: InvariantContext): InvariantResult => {
			const name = `fg-0 on bg-0 clears ${onFillFloor >= AAA - 0.01 ? "AAA" : "AA"}`;
			if (ctx.constraints["--fg-0"]) {
				return { name, ok: true, detail: "skipped (pinned text)" };
			}
			const fg0 = ctx.register["--fg-0"];
			const bg0 = ctx.register["--bg-0"];
			const ratio = fg0 && bg0 ? contrast(fg0, bg0) : 0;
			const required = achievableFloor(onFillFloor, ctx.constraints["--bg-0"] ? bg0 : undefined);
			return {
				name,
				ok: ratio >= required - 0.01,
				detail: `contrast ${ratio.toFixed(2)} (floor ${required.toFixed(2)}${
					ctx.constraints["--bg-0"] ? ` best-achievable, declared ${onFillFloor}` : ""
				})`,
			};
		},
		(ctx: InvariantContext): InvariantResult => {
			const name = `fg ramp clears ${preset.contrastFloor >= AAA - 0.01 ? "AAA" : "AA"}`;
			if (ctx.constraints["--fg-0"]) {
				return { name, ok: true, detail: "skipped (pinned text)" };
			}
			const bg0 = ctx.register["--bg-0"];
			if (!bg0) return { name, ok: false, detail: "missing --bg-0" };
			const required = achievableFloor(
				preset.contrastFloor,
				ctx.constraints["--bg-0"] ? bg0 : undefined,
			);
			for (let i = 1; i <= 3; i++) {
				const key = `--fg-${i}`;
				if (ctx.constraints[key]) continue;
				const fg = ctx.register[key];
				const ratio = fg ? contrast(fg, bg0) : 0;
				if (ratio < required - 0.01) {
					return {
						name,
						ok: false,
						detail: `${key} contrast ${ratio.toFixed(2)} (floor ${required.toFixed(2)}${
							ctx.constraints["--bg-0"] ? ` best-achievable, declared ${preset.contrastFloor}` : ""
						})`,
					};
				}
			}
			return { name, ok: true };
		},
		(ctx: InvariantContext): InvariantResult => {
			const pairs: Array<[string, string]> = [
				["--accent-fg", "--accent"],
				["--neutral-fg", "--neutral"],
				["--success-fg", "--success"],
				["--warn-fg", "--warn"],
				["--danger-fg", "--danger"],
				["--info-fg", "--info"],
				["--accent-text", "--bg-0"],
				["--neutral-text", "--bg-0"],
			];
			const surfaceFill = new Set(SURFACES as readonly string[]);
			for (const [fgName, fillName] of pairs) {
				const fill = ctx.register[fillName];
				const pinned = Boolean(ctx.constraints[fillName]);
				if (pinned && !surfaceFill.has(fillName)) continue;
				const fg = ctx.register[fgName];
				if (!fg || !fill) continue;
				const required = pinned ? achievableFloor(onFillFloor, fill) : onFillFloor;
				if (contrast(fg, fill) < required - 0.01) {
					return {
						name: `on-fill text clears ${onFillFloor >= AAA - 0.01 ? "AAA" : "AA"}`,
						ok: false,
						detail: `${fgName} on ${fillName} = ${contrast(fg, fill).toFixed(2)} (floor ${required.toFixed(2)}${pinned ? " best-achievable" : ""})`,
					};
				}
			}
			return {
				name: `on-fill text clears ${onFillFloor >= AAA - 0.01 ? "AAA" : "AA"}`,
				ok: true,
			};
		},
		(ctx: InvariantContext): InvariantResult => {
			const pairs: Array<[string, string]> = [
				["--success-text", "--success-bg"],
				["--warn-text", "--warn-bg"],
				["--danger-text", "--danger-bg"],
				["--info-text", "--info-bg"],
			];
			for (const [fgName, fillName] of pairs) {
				const fg = ctx.register[fgName];
				const fill = ctx.register[fillName];
				if (!fg || !fill) continue;
				if (contrast(fg, fill) < AA - 0.01) {
					return {
						name: "text-on-tint clears AA",
						ok: false,
						detail: `${fgName} on ${fillName} = ${contrast(fg, fill).toFixed(2)}`,
					};
				}
			}
			return { name: "text-on-tint clears AA", ok: true };
		},
		(ctx: InvariantContext): InvariantResult => {
			const name = "achromatic tone inks stay neutral";
			const achromatic = ["gray", "white", "black"];
			for (const hue of achromatic) {
				for (const token of [`--${hue}-fg`, `--${hue}-text`, `--color-${hue}-contrast`]) {
					const value = ctx.register[token];
					if (!value) continue;
					const c = toOklchColor(value).c;
					if (c >= ACHROMATIC_CHROMA) {
						return { name, ok: false, detail: `${token} = ${value} (chroma ${c.toFixed(3)} ≥ ${ACHROMATIC_CHROMA})` };
					}
				}
			}
			return { name, ok: true };
		},
		(ctx: InvariantContext): InvariantResult => {
			const name = "panel text clears AA on --bg-1 and --bg-2";
			const neutralText = [
				"--fg-1",
				"--fg-2",
				"--fg-3",
				"--placeholder",
				"--link",
				"--accent-text",
				"--neutral-text",
				"--neutral-vivid",
			];
			if (ctx.constraints["--bg-0"]) return { name, ok: true, detail: "skipped (pinned bg-0)" };
			const bg0 = ctx.register["--bg-0"];
			if (!bg0) return { name, ok: true };
			const textLight = ctx.scheme === "dark";
			const themePole = textLight ? "#ffffff" : "#000000";
			const band = contrastBandFloor(ctx.knobs);
			const inkFloor = Math.max(ENFORCE, preset.contrastFloor, (band ?? 0) + 0.2);
			const statusRoles = Object.keys(STATUS_TO_HUE);
			for (const panel of PANEL_SURFACES) {
				const bg = ctx.register[panel];
				if (!bg) continue;
				const bgL = toOklchColor(bg).l;
				if (bgL < 0.5 !== textLight) continue;
				const poleCeiling = contrast(themePole, bg);
				const required = Math.min(AA, poleCeiling - CEILING_EPSILON);
				const fg0Reach = (() => {
					const v = ctx.register["--fg-0"];
					return v ? contrast(v, bg) : Infinity;
				})();
				const inkReach = (source: string): number => {
					const v = ctx.register[source];
					if (!v) return Infinity;
					const ink = toOklchColor(v);
					const targetL = textLight ? 1 : 0;
					let reach = contrast(v, bg);
					for (let i = 1; i <= 100; i++) {
						const t = i / 100;
						const candidate = withLightness(ink, ink.l + (targetL - ink.l) * t);
						if (contrast(formatCss(candidate), bg0) < inkFloor - 0.01) break;
						reach = Math.max(reach, contrast(formatCss(candidate), bg));
					}
					return reach;
				};
				const accentInkReach = inkReach("--accent");
				const neutralInkReach = inkReach("--neutral");
				const check = (token: string, ceilingReach = Infinity): InvariantResult | null => {
					const fg = ctx.register[token];
					if (!fg) return null;
					const floorFor = Math.min(required, ceilingReach);
					const ratio = contrast(fg, bg);
					if (ratio < floorFor - 0.05) {
						return {
							name,
							ok: false,
							detail: `${token} on ${panel} = ${ratio.toFixed(2)} (floor ${floorFor.toFixed(2)})`,
						};
					}
					return null;
				};
				const fg0Bounded = new Set(["--fg-1", "--fg-2", "--fg-3", "--placeholder"]);
				const accentBounded = new Set(["--link", "--accent-text"]);
				const reachFor = (token: string): number => {
					if (fg0Bounded.has(token)) return fg0Reach;
					if (accentBounded.has(token)) return accentInkReach;
					if (token === "--neutral-text" || token === "--neutral-vivid") return neutralInkReach;
					return Infinity;
				};
				for (const token of neutralText) {
					const fail = check(token, reachFor(token));
					if (fail) return fail;
				}
				for (const role of statusRoles) {
					const tintBg = ctx.register[`--${role}-bg`];
					if (tintBg) {
						const whiteJoint =
							contrast("#ffffff", tintBg) >= AA && contrast("#ffffff", bg) >= AA;
						const blackJoint =
							contrast("#000000", tintBg) >= AA && contrast("#000000", bg) >= AA;
						if (!whiteJoint && !blackJoint) continue;
					}
					const fail = check(`--${role}-text`);
					if (fail) return fail;
					const failVivid = check(`--${role}-vivid`);
					if (failVivid) return failVivid;
				}
			}
			return { name, ok: true };
		},
		(ctx: InvariantContext): InvariantResult => {
			const name = "solid fills separate from --bg-0";
			const bg0 = ctx.register["--bg-0"];
			if (!bg0) return { name, ok: true };
			const fills = ["--accent", "--neutral", ...Object.keys(STATUS_TO_HUE).map((r) => `--${r}`)];
			for (const token of fills) {
				if (ctx.constraints[token]) continue;
				const fill = ctx.register[token];
				if (!fill) continue;
				const ratio = contrast(fill, bg0);
				if (ratio < SURFACE_SEPARATION - 0.05) {
					return { name, ok: false, detail: `${token} = ${ratio.toFixed(2)} on --bg-0 (floor ${SURFACE_SEPARATION})` };
				}
			}
			return { name, ok: true };
		},
		(ctx: InvariantContext): InvariantResult => {
			const name = "borders separate from their surface";
			const borders: Array<[string, string, number]> = [
				["--line", "--bg-0", BORDER_SEPARATION],
				["--line-2", "--bg-0", DIVIDER_SEPARATION],
				["--field-border", "--field-bg", BORDER_SEPARATION],
			];
			for (const [token, surface, separation] of borders) {
				if (ctx.constraints[token]) continue;
				const border = ctx.register[token];
				const bg = ctx.register[surface];
				if (!border || !bg) continue;
				const ratio = contrast(border, bg);
				if (ratio < separation - 0.05) {
					return { name, ok: false, detail: `${token} = ${ratio.toFixed(2)} on ${surface} (floor ${separation})` };
				}
			}
			return { name, ok: true };
		},
		(ctx: InvariantContext): InvariantResult => {
			const ladder = ["--bg-sunken", ...SURFACES];
			const ls = ladder.map((name) => {
				const value = ctx.register[name];
				return value ? toOklchColor(value).l : 0;
			});
			const ascending = ctx.scheme === "dark";
			for (let i = 1; i < ls.length; i++) {
				const prev = ls[i - 1] as number;
				const cur = ls[i] as number;
				const ok = ascending ? cur >= prev - 1e-6 : cur <= prev + 1e-6;
				if (!ok) {
					return {
						name: "surface lightness monotonic",
						ok: false,
						detail: `${ladder[i - 1]}=${prev.toFixed(3)} ${ladder[i]}=${cur.toFixed(3)} (${ctx.scheme})`,
					};
				}
			}
			return { name: "surface lightness monotonic", ok: true };
		},
		(ctx: InvariantContext): InvariantResult => {
			for (const name of STATE_TOKENS) {
				const value = ctx.register[name];
				if (!value) continue;
				const a = alpha(value);
				if (a >= 1) {
					return {
						name: "state overlays translucent",
						ok: false,
						detail: `${name} alpha ${a}`,
					};
				}
			}
			return { name: "state overlays translucent", ok: true };
		},
		(ctx: InvariantContext): InvariantResult => {
			const linkName = `links clear ${onFillFloor >= AAA - 0.01 ? "AAA" : "AA"} on bg-0`;
			const bg0 = ctx.register["--bg-0"];
			const required = achievableFloor(onFillFloor, ctx.constraints["--bg-0"] ? bg0 : undefined);
			for (const name of ["--link", "--link-hover"]) {
				const link = ctx.register[name];
				if (!link || !bg0) continue;
				const ratio = contrast(link, bg0);
				if (ratio < required - 0.01) {
					return {
						name: linkName,
						ok: false,
						detail: `${name} on --bg-0 = ${ratio.toFixed(2)} (floor ${required.toFixed(2)}${ctx.constraints["--bg-0"] ? " best-achievable" : ""})`,
					};
				}
			}
			return { name: linkName, ok: true };
		},
		(ctx: InvariantContext): InvariantResult => {
			const name = "unpinned accent ramp holds its fan at constant L/C";
			const accentValue = ctx.register["--accent"];
			if (!accentValue) {
				return { name, ok: true };
			}
			const accent = toOklchColor(accentValue);
			if (accent.c < HUE_STABLE_CHROMA) {
				return { name, ok: true };
			}
			const step =
				typeof ctx.knobs.accentShiftStep === "number"
					? ctx.knobs.accentShiftStep
					: DEFAULT_SHIFT_STEP;
			const split =
				typeof ctx.knobs.accentSplit === "number"
					? ctx.knobs.accentSplit
					: DEFAULT_ACCENT_SPLIT;
			const accent2Value = ctx.register["--accent-2"];
			const accent3Value = ctx.register["--accent-3"];
			const pinnedAccent2 =
				ctx.constraints["--accent-2"] && accent2Value ? toOklchColor(accent2Value) : null;
			const pinnedAccent3 =
				ctx.constraints["--accent-3"] && accent3Value ? toOklchColor(accent3Value) : null;
			const fanOffset = (n: number): number =>
				ACCENT_FAN === "split-complement"
					? n === 2
						? pinnedAccent3
							? -hueDelta(accent.h, pinnedAccent3.h)
							: -split
						: n === 3
							? pinnedAccent2
								? -hueDelta(accent.h, pinnedAccent2.h)
								: split
							: 180
					: step * (n - 1);
			for (let n = 2; n <= 4; n++) {
				if (ctx.constraints[`--accent-${n}`]) continue;
				const value = ctx.register[`--accent-${n}`];
				if (!value) continue;
				const rotated = toOklchColor(value);
				const wantH = (((accent.h + fanOffset(n)) % 360) + 360) % 360;
				if (rotated.c >= HUE_STABLE_CHROMA) {
					let dh = Math.abs(rotated.h - wantH) % 360;
					if (dh > 180) dh = 360 - dh;
					if (dh > HUE_TOLERANCE) {
						return {
							name,
							ok: false,
							detail: `--accent-${n} h=${rotated.h.toFixed(1)} want ${wantH.toFixed(1)}`,
						};
					}
				}
				if (Math.abs(rotated.l - accent.l) > LIGHTNESS_TOLERANCE) {
					return {
						name,
						ok: false,
						detail: `--accent-${n} l=${rotated.l.toFixed(3)} want ${accent.l.toFixed(3)}`,
					};
				}
				const maxChroma = clampToGamut({ l: accent.l, c: accent.c, h: wantH, alpha: 1 }).c;
				const expectedChroma = Math.min(accent.c, maxChroma);
				if (Math.abs(rotated.c - expectedChroma) > 0.02) {
					return {
						name,
						ok: false,
						detail: `--accent-${n} chroma ${rotated.c.toFixed(3)} want max-at-hue ${expectedChroma.toFixed(3)}`,
					};
				}
			}
			return { name, ok: true };
		},
		(ctx: InvariantContext): InvariantResult => {
			for (const name of ["--ring", "--ring-bg", "--scrim", "--selection", "--highlight"]) {
				const value = ctx.register[name];
				if (!value) continue;
				if (alpha(value) >= 1) {
					return {
						name: "ring/scrim/selection/highlight carry alpha < 1",
						ok: false,
						detail: `${name} alpha ${alpha(value)}`,
					};
				}
			}
			return { name: "ring/scrim/selection/highlight carry alpha < 1", ok: true };
		},
		(ctx: InvariantContext): InvariantResult => {
			let prev = -Infinity;
			for (const step of TEXT_STEPS) {
				const rem = parseRem(ctx.register[`--text-${step}`]);
				if (Number.isNaN(rem)) {
					return {
						name: "type scale strictly increasing",
						ok: false,
						detail: `--text-${step} not a length`,
					};
				}
				if (rem <= prev) {
					return {
						name: "type scale strictly increasing",
						ok: false,
						detail: `--text-${step}=${rem} not > ${prev}`,
					};
				}
				prev = rem;
			}
			return { name: "type scale strictly increasing", ok: true };
		},
		(ctx: InvariantContext): InvariantResult => {
			let prev = -Infinity;
			for (const step of WEIGHT_STEPS) {
				const w = Number.parseFloat(ctx.register[`--weight-${step}`] ?? "");
				if (Number.isNaN(w) || w <= prev) {
					return {
						name: "weights strictly increasing",
						ok: false,
						detail: `--weight-${step}=${w} not > ${prev}`,
					};
				}
				prev = w;
			}
			return { name: "weights strictly increasing", ok: true };
		},
		(ctx: InvariantContext): InvariantResult => {
			let prev = -Infinity;
			for (const step of LEADING_STEPS) {
				const v = Number.parseFloat(ctx.register[`--leading-${step}`] ?? "");
				if (Number.isNaN(v) || v <= prev) {
					return {
						name: "leading strictly increasing",
						ok: false,
						detail: `--leading-${step}=${v} not > ${prev}`,
					};
				}
				prev = v;
			}
			return { name: "leading strictly increasing", ok: true };
		},
		(ctx: InvariantContext): InvariantResult => {
			let prev = -Infinity;
			for (const step of RADIUS_STEPS) {
				const v = parseRem(ctx.register[`--radius-${step}`]);
				if (Number.isNaN(v) || v < prev - 1e-9) {
					return {
						name: "radius ladder non-decreasing",
						ok: false,
						detail: `--radius-${step}=${v} < ${prev}`,
					};
				}
				prev = v;
			}
			return { name: "radius ladder non-decreasing", ok: true };
		},
		(ctx: InvariantContext): InvariantResult => {
			let prev = -Infinity;
			for (const step of BORDER_STEPS) {
				const v = parseRem(ctx.register[`--border-${step}`]);
				if (Number.isNaN(v) || v <= prev) {
					return {
						name: "borders strictly increasing",
						ok: false,
						detail: `--border-${step}=${v} not > ${prev}`,
					};
				}
				prev = v;
			}
			return { name: "borders strictly increasing", ok: true };
		},
		(ctx: InvariantContext): InvariantResult => {
			let prev = -Infinity;
			for (const step of DURATION_STEPS) {
				const v = parseMs(ctx.register[`--duration-${step}`]);
				if (Number.isNaN(v) || v <= prev) {
					return {
						name: "durations strictly increasing",
						ok: false,
						detail: `--duration-${step}=${v} not > ${prev}`,
					};
				}
				prev = v;
			}
			return { name: "durations strictly increasing", ok: true };
		},
		(ctx: InvariantContext): InvariantResult => {
			let prev = -Infinity;
			for (const level of ELEVATION_STEPS) {
				const v = shadowStrength(ctx.register[`--elevation-${level}`]);
				if (v < prev - 1e-9) {
					return {
						name: "elevation strength non-decreasing",
						ok: false,
						detail: `--elevation-${level}=${v} < ${prev}`,
					};
				}
				prev = v;
			}
			return { name: "elevation strength non-decreasing", ok: true };
		},
		(ctx: InvariantContext): InvariantResult => {
			let prev = -Infinity;
			for (const step of SPACE_STEPS) {
				const v = parseRem(ctx.register[`--space-${step}`]);
				if (Number.isNaN(v) || v < prev - 1e-9) {
					return {
						name: "space ramp non-decreasing",
						ok: false,
						detail: `--space-${step}=${v} < ${prev}`,
					};
				}
				prev = v;
			}
			return { name: "space ramp non-decreasing", ok: true };
		},
		(ctx: InvariantContext): InvariantResult => {
			for (const [hue, spec] of Object.entries(PALETTE_HUES)) {
				const stops = PALETTE_STOPS.filter((s) => s !== "contrast").map((stop) =>
					ctx.register[`--color-${hue}-${stop}`],
				);
				const ls = stops.map((v) => (v ? toOklchColor(v).l : Number.NaN));
				if (ls.some((l) => Number.isNaN(l))) {
					return {
						name: "palette ramps monotonic in OKLCH lightness",
						ok: false,
						detail: `--color-${hue} ramp has a non-color stop`,
					};
				}
				const ascending = (ls[ls.length - 1] as number) >= (ls[0] as number);
				for (let i = 1; i < ls.length; i++) {
					const prev = ls[i - 1] as number;
					const cur = ls[i] as number;
					const ok = ascending ? cur > prev + 1e-9 : cur < prev - 1e-9;
					if (!ok) {
						return {
							name: "palette ramps monotonic in OKLCH lightness",
							ok: false,
							detail: `--color-${hue} ramp l[${i}]=${cur} not strictly ${ascending ? ">" : "<"} ${prev}`,
						};
					}
				}
				const base = ctx.register[`--color-${hue}-base`];
				const contrastStop = ctx.register[`--color-${hue}-contrast`];
				if (base && contrastStop && contrast(base, contrastStop) < AA - 0.01) {
					return {
						name: "palette ramps monotonic in OKLCH lightness",
						ok: false,
						detail: `--color-${hue}-contrast on -base = ${contrast(base, contrastStop).toFixed(2)}`,
					};
				}
				// The pure achromatic poles (white/black) keep `subtle` and `strong` at the same
				// end of the lightness scale by design — they are never paired as a soft
				// badge/avatar tint+ink, so they are exempt from the readable-on-subtle rule.
				if (spec !== "white" && spec !== "black") {
					const subtle = ctx.register[`--color-${hue}-subtle`];
					const strong = ctx.register[`--color-${hue}-strong`];
					if (subtle && strong && contrast(subtle, strong) < AA - 0.01) {
						return {
							name: "palette ramps monotonic in OKLCH lightness",
							ok: false,
							detail: `--color-${hue}-strong on -subtle = ${contrast(subtle, strong).toFixed(2)}`,
						};
					}
				}
				if (typeof spec === "object" && base) {
					const o = toOklchColor(base);
					if (o.c >= HUE_STABLE_CHROMA) {
						let dh = Math.abs(o.h - spec.h) % 360;
						if (dh > 180) dh = 360 - dh;
						if (dh > 20) {
							return {
								name: "palette ramps monotonic in OKLCH lightness",
								ok: false,
								detail: `--color-${hue}-base h=${o.h.toFixed(1)} strayed from ${spec.h}`,
							};
						}
					}
				}
			}
			return { name: "palette ramps monotonic in OKLCH lightness", ok: true };
		},
		(ctx: InvariantContext): InvariantResult => {
			// Every tone's four-token family must be self-consistent: the on-solid ink reads on the
			// solid fill, and the soft ink reads on the soft tint. This is the "any tone, anywhere"
			// guarantee — a pink or accent-3 button can't ship unreadable, same as the semantic six.
			const name = "every tone family clears AA (fg on solid, text on bg)";
			for (const tone of FULL_TONES) {
				const solid = ctx.register[`--${tone}`];
				const fg = ctx.register[`--${tone}-fg`];
				const bg = ctx.register[`--${tone}-bg`];
				const text = ctx.register[`--${tone}-text`];
				if (!solid || !fg || !bg || !text) {
					return { name, ok: false, detail: `--${tone} family is incomplete` };
				}
				if (contrast(solid, fg) < AA - 0.01) {
					return { name, ok: false, detail: `--${tone}-fg on --${tone} = ${contrast(solid, fg).toFixed(2)}` };
				}
				if (contrast(bg, text) < AA - 0.01) {
					return { name, ok: false, detail: `--${tone}-text on --${tone}-bg = ${contrast(bg, text).toFixed(2)}` };
				}
			}
			return { name, ok: true };
		},
		(ctx: InvariantContext): InvariantResult => {
			const name = "code palette readable on --code-bg";
			const codeBg = ctx.register["--code-bg"];
			if (!codeBg) return { name, ok: false, detail: "--code-bg missing" };
			const readFloor = achievableFloor(AA, codeBg);
			const commentFloor = achievableFloor(3, codeBg);
			for (const role of [...CODE_VIVID_ROLES, "operator"]) {
				const v = ctx.register[`--code-${role}`];
				const ratio = v ? contrast(v, codeBg) : 0;
				if (ratio < readFloor - 0.05) {
					return { name, ok: false, detail: `--code-${role} on --code-bg = ${ratio.toFixed(2)} (floor ${readFloor.toFixed(2)})` };
				}
			}
			const commentRatio = contrast(ctx.register["--code-comment"] ?? "#000", codeBg);
			if (commentRatio < commentFloor - 0.05) {
				return { name, ok: false, detail: `--code-comment on --code-bg = ${commentRatio.toFixed(2)} (floor ${commentFloor.toFixed(2)})` };
			}
			return { name, ok: true };
		},
		(ctx: InvariantContext): InvariantResult => {
			// OKLab distance, not WCAG contrast — luminance-only contrast is blind to two equally-light hues.
			// `variable` is excluded: it's the plain-text baseline (`--code-fg`), not a colored scope.
			const name = "code scopes mutually distinguishable";
			const MIN_DE = 0.006;
			const distinct = [...CODE_VIVID_ROLES, "comment"].map((r) => `--code-${r}`);
			for (let i = 0; i < distinct.length; i++) {
				for (let j = i + 1; j < distinct.length; j++) {
					const ni = distinct[i] as string;
					const nj = distinct[j] as string;
					const a = ctx.register[ni];
					const b = ctx.register[nj];
					if (!a || !b) continue;
					const d = oklabDist(a, b);
					if (d < MIN_DE) {
						return { name, ok: false, detail: `${ni} vs ${nj} ΔE=${d.toFixed(4)} (min ${MIN_DE})` };
					}
				}
			}
			return { name, ok: true };
		},
		(ctx: InvariantContext): InvariantResult => {
			// Mistaking success for danger is a usability failure WCAG contrast can't see — two
			// equally-light status hues read as one. Floored well under the muted reality
			// (xoji-quiet's closest pair sits ~0.044), so it guards a real collapse, not taste.
			const name = "status roles mutually distinguishable";
			const MIN_DE = 0.02;
			const roles = Object.keys(STATUS_TO_HUE).map((r) => `--${r}`);
			for (let i = 0; i < roles.length; i++) {
				for (let j = i + 1; j < roles.length; j++) {
					const ni = roles[i] as string;
					const nj = roles[j] as string;
					const a = ctx.register[ni];
					const b = ctx.register[nj];
					if (!a || !b) continue;
					const d = oklabDist(a, b);
					if (d < MIN_DE) {
						return { name, ok: false, detail: `${ni} vs ${nj} ΔE=${d.toFixed(4)} (min ${MIN_DE})` };
					}
				}
			}
			return { name, ok: true };
		},
	];
}

export const PRODUCED_TOKENS = PRODUCES;
export const TOKEN_CATEGORIES = CATEGORIES;

/**
 * Builds an `Algorithm` from a preset and a pipeline factory. `buildPasses(preset, opts)`
 * returns the ordered passes for one derivation; `derive` runs them and returns the final
 * register, `deriveTraced` keeps every snapshot, and `passes` exposes a stable single-derive
 * pass list for introspection. For a single-pass family algorithm `lineage` is the honest
 * graph from {@link buildGraph}; for a multi-pass one it re-emits the final register as
 * value-only nodes so `resolveGraph(lineage(opts)) === derive(opts)` holds either way.
 */
export function makeXojiPipelineAlgorithm(
	preset: PresetDefaults,
	buildPasses: (preset: PresetDefaults, opts: DeriveOptions) => Pass[],
): Algorithm {
	const run = (opts: DeriveOptions): { register: TokenRegister; trace: TraceSnapshot[] } => {
		const passes = buildPasses(preset, opts);
		return runPipeline(passes, (passIndex) => buildPassContext(preset, opts, passIndex));
	};
	const singlePass = buildPasses(preset, {}).length === 1;
	return {
		id: preset.id,
		produces: PRODUCES,
		knobs: preset.knobs,
		categories: CATEGORIES,
		derive: (opts: DeriveOptions = {}) => run(opts).register,
		lineage: (opts: DeriveOptions = {}) =>
			singlePass
				? buildGraph(preset, opts).map(({ name, value, refs }) =>
						refs && refs.length ? { name, value, refs } : { name, value },
					)
				: registerToNodes(run(opts).register),
		invariants: makeInvariants(preset),
		passes: buildPasses(preset, {}).map((pass) => ({ name: pass.name, run: pass.run })),
		deriveTraced: (opts: DeriveOptions = {}): DeriveTrace => run(opts),
	};
}

export function makeXojiAlgorithm(preset: PresetDefaults): Algorithm {
	return makeXojiPipelineAlgorithm(preset, (p, opts) => [settlePass(p, opts)]);
}

export const SHARED_KNOBS = [
	"scheme",
	"accentShiftStep",
	"accentSplit",
	"contrastBand",
	"vibrancy",
	"typeScale",
	"radiusScale",
	"density",
	"cues",
	"fonts",
	"anchors",
];

export const DEFAULT_ANCHORS: PresetAnchors = {
	bg: "#0f1115",
	fg: "#e8eaed",
};
