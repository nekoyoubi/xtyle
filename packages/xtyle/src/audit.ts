import { contrast } from "./color.js";
import type { TokenName, TokenRegister } from "./types.js";
import { ACCENT_VARIANTS } from "./vocab.js";

/**
 * The register-level contrast audit: the consumer-facing complement to the algorithm-level
 * `gauntlet`. Where the gauntlet fuzzes an *algorithm's* invariants across random seeds, this
 * grades a single *materialized* register (a baked floor or a fresh `derive()` result) against
 * xtyle's own canonical text/fill pairs, so a theme editor, an a11y linter, or a CI gate reads a
 * ready per-pair result instead of re-encoding the token contract by hand. The pair list is
 * xtyle's token-contract knowledge (which token is text on which fill), and lives here, versioned
 * with the tokens, not in every consumer.
 */

export type ContrastTier = "AAA" | "AA" | "fail";

export interface ContrastAuditEntry {
	/** A human label for the pair, e.g. `"--fg-0 on --bg-0"`. */
	pair: string;
	/** The text token. */
	fg: TokenName;
	/** The surface / fill token the text sits on. */
	bg: TokenName;
	/** The text token's resolved color. */
	fgValue: string;
	/** The surface token's resolved color. */
	bgValue: string;
	/** The WCAG contrast ratio, rounded to two decimals. */
	ratio: number;
	/** The highest tier the ratio clears for the requested text size. */
	tier: ContrastTier;
}

export interface ContrastAuditOptions {
	/** Grade against the WCAG large-text floors (AA 3.0 / AAA 4.5) instead of normal-text (AA 4.5 / AAA 7). */
	largeText?: boolean;
	/** The floor a pair must clear to count toward `passes` / `tallies.pass` (default `"AA"`). */
	level?: "AA" | "AAA";
	/** Audit this consumer-supplied pair set instead of xtyle's canonical pairs. A consumer whose token
	 * contract differs (its status inks read on `--bg-0`, not each tone's soft tint) passes its own pairs
	 * so the audit grades what it actually renders, not xtyle's default surfaces. Reach for
	 * {@link canonicalContrastPairs} to start from xtyle's list and extend it. Omit to audit the canonical set. */
	pairs?: readonly PairSpec[];
}

export interface ContrastAuditTallies {
	total: number;
	AAA: number;
	AA: number;
	fail: number;
	/** How many pairs cleared the requested `level`. */
	pass: number;
}

export interface ContrastAudit {
	entries: ContrastAuditEntry[];
	tallies: ContrastAuditTallies;
	/** True when every audited pair clears the requested `level`. */
	passes: boolean;
	level: "AA" | "AAA";
	/** The lowest ratio across all audited pairs, the theme's weakest link (`0` when nothing was audited). */
	worst: number;
}

/** A text/fill token pair to grade for contrast: `fg` is the text token, `bg` the surface it sits on. */
export interface PairSpec {
	fg: TokenName;
	bg: TokenName;
	/** A human label for the pair in the audit result; defaults to `"<fg> on <bg>"`. */
	label?: string;
}

/** Tones whose solid fill carries on-fill text via `--{tone}-fg`. */
const FILL_TONES = ["accent", "neutral", "success", "warn", "danger", "info", ...ACCENT_VARIANTS] as const;
/** The neutral / brand text inks the contract holds readable on the page base *and* on the raised
 * panel surfaces, mirroring xtyle-default's "panel text clears AA on `--bg-1` and `--bg-2`" invariant. */
const SURFACE_INKS = ["--fg-1", "--fg-2", "--fg-3", "--link", "--accent-text", "--neutral-text"] as const;
/** The surfaces those inks are contracted to read on: the page base and the two panel steps. */
const READING_SURFACES = ["--bg-0", "--bg-1", "--bg-2"] as const;
/** Tones whose readable `--{tone}-text` variant sits on the tone's own soft `--{tone}-bg` tint. */
const TINT_TEXT_TONES = ["success", "warn", "danger", "info", "accent"] as const;

/** xtyle's canonical text/fill pairs, each token audited against its *intended* surface rather than a
 * naive fg×bg cross that cries wolf. This mirrors the token contract xtyle-default's own invariants
 * enforce: the primary ink on the page base; the neutral / brand inks readable on the base *and* on
 * both panel surfaces (so "does secondary text read on a card?" is a real check, not a false green);
 * the placeholder on the field surface; each tone's on-fill text (`-fg` on the solid fill); the accent
 * ramp's readable inks on the base; every tinted tone's readable ink on its own soft tint (accent
 * included, since the soft chip / ribbon / drag surfaces ink themselves that way); and the body inks
 * on the accent tint, which is what a selected row, option, or menu item (`--fg-0`) and a calendar's
 * in-range band (`--fg-1`) read as. */
/**
 * xtyle's canonical text/fill pairs as data. Exported so a consumer can read the token contract
 * directly — extend it with `opts.pairs`, or (for a QuickJS/xript sandbox that can't `import` from
 * `@xtyle/core`) inline this small list and pair it with the equally-pure `contrast()` to run the
 * same grade the frontend runs. That's the sandbox-reachable path: the audit is a pure function of a
 * register plus this pair list, so the two surfaces agree by sharing the data, not the import.
 */
export function canonicalContrastPairs(): PairSpec[] {
	const pairs: PairSpec[] = [{ fg: "--fg-0", bg: "--bg-0" }];
	for (const ink of SURFACE_INKS) for (const surface of READING_SURFACES) pairs.push({ fg: ink, bg: surface });
	pairs.push({ fg: "--placeholder", bg: "--field-bg" });
	for (const tone of FILL_TONES) pairs.push({ fg: `--${tone}-fg`, bg: `--${tone}` });
	for (const tone of ACCENT_VARIANTS) pairs.push({ fg: `--${tone}-text`, bg: "--bg-0" });
	for (const tone of TINT_TEXT_TONES) pairs.push({ fg: `--${tone}-text`, bg: `--${tone}-bg` });
	for (const ink of ["--fg-0", "--fg-1"] as const) pairs.push({ fg: ink, bg: "--accent-bg" });
	return pairs;
}

/**
 * The contrast floor a QR symbol's module/background pair must clear to stay reliably scannable.
 * QR readers tolerate less than a human reading body text, but camera capture, print bleed, and
 * screen glare all erode the margin — so xtyle holds themed codes to the WCAG AAA ratio (7:1) as a
 * conservative scannable floor. Bitonal (pure black-on-white) sits at the 21:1 ceiling and always
 * clears it; that is the guaranteed fallback the `auto` mode drops to when a theme's own `--fg-0` /
 * `--bg-0` come in under this line.
 */
export const QR_MIN_CONTRAST = 7;

export interface QrScannability {
	/** The WCAG contrast ratio between the two tokens, rounded to two decimals. */
	ratio: number;
	/** The resolved module (dark) color. */
	moduleValue: string;
	/** The resolved background (light) color. */
	bgValue: string;
	/** Whether `ratio` clears {@link QR_MIN_CONTRAST}. */
	scannable: boolean;
	/** The floor `ratio` was graded against. */
	floor: number;
}

export interface QrScannabilityOptions {
	/** The module color token (default `--fg-0`). */
	moduleToken?: TokenName;
	/** The background color token (default `--bg-0`). */
	bgToken?: TokenName;
	/** Override the floor (default {@link QR_MIN_CONTRAST}). */
	floor?: number;
}

/**
 * Grade the contrast of the module/background token pair a QR symbol would ink itself with, the
 * component-level complement to {@link auditRegister}. A theme editor, a CI gate, or the QR element's
 * own `auto` mode reads `scannable` to decide whether a themed code is safe to render as-is or should
 * fall back to bitonal. Missing tokens resolve to a `0` ratio (not scannable).
 */
export function qrScannability(register: TokenRegister, opts: QrScannabilityOptions = {}): QrScannability {
	const floor = opts.floor ?? QR_MIN_CONTRAST;
	const moduleValue = register[opts.moduleToken ?? "--fg-0"] ?? "";
	const bgValue = register[opts.bgToken ?? "--bg-0"] ?? "";
	const ratio = moduleValue && bgValue ? Math.round(contrast(moduleValue, bgValue) * 100) / 100 : 0;
	return { ratio, moduleValue, bgValue, scannable: ratio >= floor, floor };
}

function tierFor(ratio: number, largeText: boolean): ContrastTier {
	const aa = largeText ? 3 : 4.5;
	const aaa = largeText ? 4.5 : 7;
	if (ratio >= aaa) return "AAA";
	if (ratio >= aa) return "AA";
	return "fail";
}

export function auditRegister(register: TokenRegister, opts: ContrastAuditOptions = {}): ContrastAudit {
	const largeText = opts.largeText ?? false;
	const level = opts.level ?? "AA";
	const clears = (tier: ContrastTier): boolean => (level === "AAA" ? tier === "AAA" : tier !== "fail");

	const entries: ContrastAuditEntry[] = [];
	for (const { fg, bg, label } of opts.pairs ?? canonicalContrastPairs()) {
		const fgValue = register[fg];
		const bgValue = register[bg];
		if (fgValue == null || bgValue == null) continue;
		const ratio = Math.round(contrast(fgValue, bgValue) * 100) / 100;
		entries.push({ pair: label ?? `${fg} on ${bg}`, fg, bg, fgValue, bgValue, ratio, tier: tierFor(ratio, largeText) });
	}

	const tallies: ContrastAuditTallies = { total: entries.length, AAA: 0, AA: 0, fail: 0, pass: 0 };
	let worst = Infinity;
	for (const entry of entries) {
		tallies[entry.tier]++;
		if (clears(entry.tier)) tallies.pass++;
		if (entry.ratio < worst) worst = entry.ratio;
	}

	return {
		entries,
		tallies,
		passes: tallies.pass === tallies.total,
		level,
		worst: entries.length ? worst : 0,
	};
}
