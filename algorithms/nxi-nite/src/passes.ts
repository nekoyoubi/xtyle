import {
	contrast,
	formatCss,
	oklch,
	toOklchColor,
	withLightness,
	type OklchColor,
} from "@xtyle/core/authoring";
import type { DeriveOptions, Knobs, Pass, PassContext, TokenName, TokenRegister } from "@xtyle/core";
import {
	borderForContrast,
	BORDER_SEPARATION,
	DIVIDER_SEPARATION,
	SURFACE_SEPARATION,
	enforceContrastFloor,
	settlePass,
	TOKEN_CATEGORIES,
	type PresetDefaults,
} from "@xtyle/core/authoring";

const DEFAULT_HOUR = 12;
const FLOOR = 4.5 + 0.2;

const WARM_HUE = 65;
const COOL_HUE = 250;

const DIM_AMPLITUDE = 0.12;
const WARMTH_AMPLITUDE = 18;

/**
 * The consumer-fed hour of day, clamped to [0, 24] with noon as the default. Pure and
 * deterministic — never reads a wall clock — so a derivation at a given hour is
 * reproducible and the gauntlet can sweep hours as just another input.
 */
export function hourOf(knobs: Knobs): number {
	const raw = typeof knobs.hour === "number" ? knobs.hour : DEFAULT_HOUR;
	return Math.min(24, Math.max(0, raw));
}

/**
 * The continuous day↔night phase for an hour, in [-1, +1]. Midnight (0 ≡ 24) is full
 * night (+1); noon (12) is full day (-1); a cosine sweeps smoothly between, so the
 * value wraps seamlessly at the 0/24 pole (hour 0 and hour 24 are identical).
 */
export function nightness(hour: number): number {
	return Math.cos((hour / 24) * 2 * Math.PI);
}

function phaseOf(ctx: PassContext): number {
	return nightness(hourOf(ctx.knobs ?? {}));
}

/**
 * The bg ladder the monotonicity invariant checks, in its exact order. The dim pass moves
 * every rung by one shared factor or not at all — if any rung is pinned, the whole ladder
 * is left untouched so a pinned surface can never desync from its dimmed neighbours.
 */
const DIM_LADDER: TokenName[] = ["--bg-sunken", "--body-bg", "--bg-0", "--bg-1", "--bg-2", "--bg-3"];

/** Ambient surfaces dim moves but the monotonicity invariant does not rank. */
const DIM_EXTRA: TokenName[] = ["--surface-overlay", "--field-bg"];

/**
 * The ambient surfaces and ink ramp the day/night effect moves. Deliberately narrow:
 * the accent ramp, palette ramps, status fills, code scopes, and state overlays are
 * left untouched, so warmth reads as a shift in the room's light, not a rebrand — and
 * every structural invariant tied to those tokens' exact hue/value stays intact.
 */
const SURFACE_TOKENS: TokenName[] = [...DIM_LADDER, ...DIM_EXTRA];

// Warmth tints surfaces only. The fg ink ramp is left at its base hue — text legibility is
// the contrast-restore pass's charge, and re-hueing razor-thin inks is where it dies.
const WARMTH_TOKENS = SURFACE_TOKENS;

function isColor(name: TokenName): boolean {
	return TOKEN_CATEGORIES[name] === "color";
}

function asColor(value: string): OklchColor | null {
	if (!value || value === "none") return null;
	try {
		const o = toOklchColor(value);
		if (Number.isNaN(o.l) || Number.isNaN(o.c) || Number.isNaN(o.h)) return null;
		return o;
	} catch {
		return null;
	}
}

function hasAlpha(value: string): boolean {
	if (value.startsWith("#")) return value.length === 9 || value.length === 5;
	return /rgba?\([^)]*,\s*[0-9.]+\s*\)/.test(value);
}

function shiftHue(hue: number, target: number, degrees: number): number {
	let d = (((target - hue) % 360) + 360) % 360;
	if (d > 180) d -= 360;
	const move = Math.sign(d) * Math.min(Math.abs(d), degrees);
	return (((hue + move) % 360) + 360) % 360;
}

/** WCAG relative luminance, recovered from the contrast-against-black identity (L = 0.05·C − 0.05). */
function relLuminance(value: string): number {
	return contrast(value, "#000000") * 0.05 - 0.05;
}

/**
 * The best contrast actually reachable against a background — its physical ceiling against
 * the readable poles, less a hair. Restore never demands more than this, so it can't chase
 * a floor a near-pole pinned surface makes impossible and overshoot into the wrong pole.
 * Mirrors the gauntlet invariants' own `achievableFloor`.
 */
function achievableFloor(declaredFloor: number, bgValue: string): number {
	const ceiling = Math.max(contrast("#000000", bgValue), contrast("#ffffff", bgValue));
	return Math.min(declaredFloor, ceiling - 0.05);
}

/**
 * Re-solves a color's OKLCH lightness so its WCAG relative luminance matches `targetL`,
 * keeping the (warmed) hue and chroma. Because WCAG contrast is a pure function of relative
 * luminance, a surface re-hued this way yields *identical* contrast against every ink — so
 * warmth is contrast-neutral by construction and never erodes a floor.
 */
function matchLuminance(color: OklchColor, targetL: number): OklchColor {
	const lum = (l: number): number => relLuminance(formatCss(withLightness(color, l)));
	let lo = 0;
	let hi = 1;
	for (let i = 0; i < 24; i++) {
		const mid = (lo + hi) / 2;
		if (lum(mid) < targetL) lo = mid;
		else hi = mid;
	}
	return withLightness(color, (lo + hi) / 2);
}

/**
 * Warmth pass — tints the ambient surfaces toward warm amber at night and cool blue at day,
 * scaled by the phase, with a gentle chroma lift so even a near-neutral surface carries the
 * temperature. Each tinted surface's OKLCH lightness is then re-solved to hold its original
 * WCAG relative luminance, so warmth is contrast-neutral by construction — every ink that
 * reads on a surface still reads on it after warming. Brand, palette, status, and code-scope
 * tokens are excluded so the shift is room light, not a rebrand; pinned and alpha tokens are
 * left verbatim.
 */
function warmthRun(register: TokenRegister, ctx: PassContext): TokenRegister {
	const n = phaseOf(ctx);
	if (n === 0) return { ...register };
	const target = n >= 0 ? WARM_HUE : COOL_HUE;
	const degrees = Math.abs(n) * WARMTH_AMPLITUDE;
	const tintChroma = Math.abs(n) * 0.012;
	const out: TokenRegister = { ...register };
	for (const name of WARMTH_TOKENS) {
		const value = register[name];
		if (value === undefined) continue;
		if (ctx.pinned[name] !== undefined) continue;
		if (!isColor(name) || hasAlpha(value)) continue;
		const color = asColor(value);
		if (!color) continue;
		// A surface at the gamut's luminance pole (pure white or black) has no luminance headroom
		// to tint into: any chroma added there drops the luminance off the pole, and `matchLuminance`
		// cannot recover it. Warming such a surface would nudge it off the pole and can invert the
		// surface ladder against a pinned pole-valued neighbour. Warmth is only contrast-neutral
		// where there is luminance to hold, so leave a pole-valued surface verbatim.
		if (value === "#ffffff" || value === "#000000") continue;
		const targetLum = relLuminance(value);
		const sourceHue = color.c < 0.01 ? target : color.h;
		const newHue = shiftHue(sourceHue, target, degrees);
		const newChroma = Math.max(color.c, color.c < 0.01 ? tintChroma : 0);
		const tinted = oklch(color.l, newChroma, newHue, color.alpha);
		out[name] = formatCss(matchLuminance(tinted, targetLum));
	}
	return out;
}

/**
 * Dim pass — settles the ambient surfaces deeper into the scheme's own background pole as
 * the hour moves toward night, as a proportional move (`l → l + (pole − l)·t`) applied with
 * one shared factor across the surface set so the move stays strictly monotonic. Day leaves
 * surface lightness at the base derivation's value; if any rung of the bg ladder is pinned the
 * whole ladder is left untouched, so a pinned surface never desyncs from its dimmed neighbours.
 *
 * Darkening a surface toward the pole adds text headroom only when the ink sits on the
 * *opposite* pole — the usual case. But an adversarial theme can put dark ink on a light
 * "dark-scheme" surface (or the reverse), where moving the surface toward the pole drives it
 * *toward* the ink and erodes contrast — and an ink already at the pole can't be repaired
 * afterward. So the shared factor is capped at the most it can move without dropping any
 * floored ink below the floor it already cleared, measured on the emitted (rounded) surface so
 * the cap is exact. Normal themes never hit the cap and dim fully; only the degenerate inputs
 * self-limit.
 */
function dimRun(register: TokenRegister, ctx: PassContext): TokenRegister {
	const n = phaseOf(ctx);
	const desired = Math.max(0, n) * DIM_AMPLITUDE;
	if (desired === 0) return { ...register };
	const ladderPinned = DIM_LADDER.some((name) => ctx.pinned[name] !== undefined);
	const pole = ctx.scheme === "dark" ? 0 : 1;
	const targets = ladderPinned ? DIM_EXTRA : SURFACE_TOKENS;

	const dimmed = (value: string, t: number): string | null => {
		const color = asColor(value);
		if (!color) return null;
		return formatCss(withLightness(color, color.l + (pole - color.l) * t));
	};

	const inks = RESTORE_PAIRS.filter((p) => ctx.pinned[p.fg] === undefined)
		.map((p) => ({ value: register[p.fg], floor: p.floor }))
		.filter((x): x is { value: string; floor: number } => x.value !== undefined && !hasAlpha(x.value));
	const textSurfaces = targets.filter(
		(s) => s === "--bg-0" || s === "--bg-1" || s === "--bg-2",
	);
	// The solid fills the dim must not crowd by darkening `--bg-0` into them; only relevant while
	// `--bg-0` itself dims (an unpinned ladder).
	const bg0Value = register["--bg-0"];
	const bg0Dims = !ladderPinned && bg0Value !== undefined && !hasAlpha(bg0Value);
	const fills = bg0Dims
		? FILL_TOKENS.filter((name) => ctx.pinned[name] === undefined)
				.map((name) => register[name])
				.filter((v): v is string => v !== undefined && !hasAlpha(v))
		: [];
	const inkSafe = (t: number): boolean =>
		textSurfaces.every((surface) => {
			const sv = register[surface];
			if (sv === undefined || hasAlpha(sv)) return true;
			const sdim = dimmed(sv, t);
			if (sdim === null) return true;
			return inks.every(
				({ value, floor }) => contrast(value, sdim) >= Math.min(floor, contrast(value, sv)) - 0.005,
			);
		});
	const fillSafe = (t: number): boolean => {
		if (!bg0Dims || bg0Value === undefined) return true;
		const sdim = dimmed(bg0Value, t);
		if (sdim === null) return true;
		return fills.every(
			(f) => contrast(f, sdim) >= Math.min(SURFACE_SEPARATION, contrast(f, bg0Value)) - 0.005,
		);
	};
	const safe = (t: number): boolean => inkSafe(t) && fillSafe(t);

	let t = desired;
	if (!safe(t)) {
		let lo = 0;
		let hi = desired;
		for (let i = 0; i < 24; i++) {
			const mid = (lo + hi) / 2;
			if (safe(mid)) lo = mid;
			else hi = mid;
		}
		t = lo;
	}
	if (t === 0) return { ...register };

	const out: TokenRegister = { ...register };
	for (const name of targets) {
		if (ctx.pinned[name] !== undefined) continue;
		if (!isColor(name)) continue;
		const value = register[name];
		if (value === undefined || hasAlpha(value)) continue;
		const moved = dimmed(value, t);
		if (moved !== null) out[name] = moved;
	}
	return out;
}

/** The fg/bg pairs whose contrast the invariant suite enforces, re-cleared after dim+warmth move them. */
const RESTORE_PAIRS: Array<{ fg: TokenName; bg: TokenName; floor: number }> = [
	{ fg: "--fg-0", bg: "--bg-0", floor: FLOOR },
	{ fg: "--fg-1", bg: "--bg-0", floor: FLOOR },
	{ fg: "--fg-2", bg: "--bg-0", floor: FLOOR },
	{ fg: "--fg-3", bg: "--bg-0", floor: FLOOR },
	{ fg: "--placeholder", bg: "--bg-0", floor: FLOOR },
	{ fg: "--fg-disabled", bg: "--bg-0", floor: FLOOR },
	{ fg: "--accent-text", bg: "--bg-0", floor: FLOOR },
	{ fg: "--neutral-text", bg: "--bg-0", floor: FLOOR },
	{ fg: "--link", bg: "--bg-0", floor: FLOOR },
	{ fg: "--link-hover", bg: "--bg-0", floor: FLOOR },
	// The vivid on-surface tone inks clear AA by a tight margin (that's the point), so the
	// night shift can tip them under where the muted `-text` inks survive on headroom. Restore
	// them against `--bg-2`, the most-elevated same-side panel and therefore the hardest case —
	// clearing it clears the nearer panels too.
	{ fg: "--success-vivid", bg: "--bg-2", floor: FLOOR },
	{ fg: "--warn-vivid", bg: "--bg-2", floor: FLOOR },
	{ fg: "--danger-vivid", bg: "--bg-2", floor: FLOOR },
	{ fg: "--info-vivid", bg: "--bg-2", floor: FLOOR },
	{ fg: "--neutral-vivid", bg: "--bg-2", floor: FLOOR },
];

/** The border/surface pairs whose separation the dim pass can erode by moving the surface
 * (`--field-bg`, `--bg-0`) without its border — re-floored against the composed register, the
 * same way the base derivation floors them at derive time. */
const BORDER_RESTORE: Array<{ border: TokenName; surface: TokenName; floor: number }> = [
	{ border: "--line", surface: "--bg-0", floor: BORDER_SEPARATION },
	{ border: "--line-2", surface: "--bg-0", floor: DIVIDER_SEPARATION },
	{ border: "--field-border", surface: "--field-bg", floor: BORDER_SEPARATION },
];

/** The solid page fills the dim pass must not darken `--bg-0` into — darkening the surface toward a
 * same-lightness fill collapses its separation. Matches the "solid fills separate from --bg-0"
 * invariant's guarded set; the dim cap holds `--bg-0` off these the way it already holds it off the
 * floored text inks, so the fills (and everything derived from them) stay put. */
const FILL_TOKENS: TokenName[] = ["--accent", "--neutral", "--success", "--warn", "--danger", "--info"];

/**
 * Raises an ink to clear its floor against `bgValue` *only if that move doesn't cost it
 * contrast against its primary surface* `bg0`. enforceContrastFloor can flip a dark ink to
 * the opposite pole to satisfy one surface; that flip would wreck the ink on the surface it
 * was derived to read on. The base derivation's panel-text rule bounds an ink by its
 * source's reach for exactly this reason — so the repair is accepted only when it keeps the
 * ink at least as readable on `bg0` as it already was.
 */
function clearBounded(
	fgValue: string,
	bgValue: string,
	bg0Value: string,
	scheme: PassContext["scheme"],
	floor: number,
): string {
	const reachable = achievableFloor(floor, bgValue);
	if (contrast(fgValue, bgValue) >= reachable - 0.01) return fgValue;
	const fg = asColor(fgValue);
	const bg = asColor(bgValue);
	if (!fg || !bg) return fgValue;
	const repaired = formatCss(enforceContrastFloor(fg, bg, scheme, reachable));
	if (contrast(repaired, bg0Value) < contrast(fgValue, bg0Value) - 0.01) return fgValue;
	return repaired;
}

/**
 * Contrast-restore pass — the demonstration that N > 2 is load-bearing. Warmth re-hued the
 * surfaces and dim re-seated their lightness; either can move an ink off its floor, and only
 * a dedicated final pass that sees the *composed* register can repair it. It re-clears each
 * ink the invariant suite floors against `--bg-0` — the inks' primary surface and the one
 * pass-induced motion (the night dim) acts on — bounded so a repair never trades away the
 * ink's readability on that surface. Pinned foregrounds are skipped: pinning a token is an
 * explicit opt-out of its invariant, same as in the base derivation.
 */
function contrastRestoreRun(register: TokenRegister, ctx: PassContext): TokenRegister {
	const out: TokenRegister = { ...register };
	const bg0Value = out["--bg-0"];
	if (bg0Value === undefined) return out;

	for (const { fg, bg, floor } of RESTORE_PAIRS) {
		if (ctx.pinned[fg] !== undefined) continue;
		const fgValue = out[fg];
		const bgValue = out[bg];
		if (fgValue === undefined || bgValue === undefined || hasAlpha(fgValue)) continue;
		out[fg] = clearBounded(fgValue, bgValue, bg0Value, ctx.scheme, floor);
	}

	for (const { border, surface, floor } of BORDER_RESTORE) {
		if (ctx.pinned[border] !== undefined) continue;
		const borderValue = out[border];
		const surfaceValue = out[surface];
		if (borderValue === undefined || surfaceValue === undefined || hasAlpha(borderValue)) continue;
		const seed = asColor(borderValue);
		const surf = asColor(surfaceValue);
		if (!seed || !surf) continue;
		out[border] = formatCss(borderForContrast(seed, surf, floor));
	}

	return out;
}

export function warmthPass(): Pass {
	return { name: "warmth", run: warmthRun };
}

export function dimPass(): Pass {
	return { name: "dim", run: dimRun };
}

export function contrastRestorePass(): Pass {
	return { name: "contrast-restore", run: contrastRestoreRun };
}

/**
 * The Day/Night pipeline: settle the full xtyle-default register, warm + dim the ambient
 * surfaces and inks toward the fed hour, then restore the contrast floor. settlePass
 * reuses the shared xtyle derivation verbatim, so the only aesthetic policy nxi-nite adds
 * lives in this module — and because both the baked algorithm and the hosted mod import
 * this same module, the two derive byte-identically.
 */
export function nxiNitePasses(preset: PresetDefaults, opts: DeriveOptions): Pass[] {
	return [settlePass(preset, opts), warmthPass(), dimPass(), contrastRestorePass()];
}
