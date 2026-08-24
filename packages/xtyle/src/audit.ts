import { contrast, flatten, formatCss, oklabDistance, separationAxes, toOklchColor } from "./color.js";
import type { SeparationAxes } from "./color.js";
import type { TokenName, TokenRegister } from "./types.js";
import { ACCENT_VARIANTS, SURFACE_ROLES } from "./vocab.js";

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
	/**
	 * The OKLab distance two solid fills must clear to count as distinguishable (default `0.02`, the
	 * same floor the blessed algorithms' own mutual-distinguishability invariant holds). Raise it to
	 * grade against a stricter house rule; it changes only what `clears` reports, never a colour.
	 */
	separationFloor?: number;
	/** The ratio `fillSurface[].clears` grades against; defaults to WCAG 1.4.11's 3:1. */
	fillSurfaceFloor?: number;
	/** The ratio `focusRing[].clears` grades against; defaults to WCAG 2.2's 3:1. */
	focusRingFloor?: number;
	/** Report separation for this fill set instead of the canonical solid fills. */
	separationRoles?: readonly TokenName[];
	/** The distance `rampSeparation[].clears` grades against; defaults to a collapse-catching 0.01. */
	rampSeparationFloor?: number;
}

export interface ContrastAuditTallies {
	total: number;
	AAA: number;
	AA: number;
	fail: number;
	/** How many pairs cleared the requested `level`. */
	pass: number;
}

/** Which side of the light/dark line each reading surface sits on. */
export interface SurfacePolarity {
	/** True when the surfaces straddle the line, so no single ink can read on all of them. */
	spansPoles: boolean;
	/** Surfaces a dark ink reads on. */
	light: TokenName[];
	/** Surfaces a light ink reads on. */
	dark: TokenName[];
}

/** Two solid fills and how far apart they read. */
export interface RoleSeparationEntry {
	pair: string;
	a: TokenName;
	b: TokenName;
	aValue: string;
	bValue: string;
	/** Perceptual OKLab distance, rounded to four decimals. */
	distance: number;
	/** Whether the pair clears the requested separation floor. */
	clears: boolean;
	/**
	 * Which axes the `distance` is made of, each rounded to four decimals.
	 *
	 * The floor grades a single number, and the same number means different things depending on where
	 * it comes from: a pair separated by a hue rotation at high chroma can outscore one separated by a
	 * visible lightness step and still read as one color, because the hue term scales with the chroma
	 * it happens at. A reader with only the total has no way to doubt a pair that clears.
	 */
	axes: SeparationAxes;
	/** The axis carrying most of the distance — what a reader would say the two colors differ *by*. */
	dominant: "lightness" | "chroma" | "hue";
}

export interface ContrastAudit {
	entries: ContrastAuditEntry[];
	tallies: ContrastAuditTallies;
	/** True when every audited pair clears the requested `level`. */
	passes: boolean;
	level: "AA" | "AAA";
	/** The lowest ratio across all audited pairs, the theme's weakest link (`0` when nothing was audited). */
	worst: number;
	/**
	 * How far each solid fill reads from every other one.
	 *
	 * Contrast grades a fill against the *page*; nothing in it grades a fill against its *siblings*, and
	 * the roles are only worth having if they can be told apart. A brand accent that lands on a status
	 * role's hue makes the two render as one colour — a destructive button that looks exactly like the
	 * primary one — while every contrast pair still passes, so the theme is safe and says the wrong thing.
	 * That is a report and not a verdict: the floor is a parameter, and a theme is free to fail it
	 * deliberately.
	 */
	roleSeparation: RoleSeparationEntry[];
	/** The closest pair of solid fills (`0` when fewer than two resolved). */
	worstSeparation: number;
	/** The floor `roleSeparation[].clears` was graded against. */
	separationFloor: number;
	/**
	 * How far each solid fill reads from the surfaces it is drawn on.
	 *
	 * Every graded pair above is text against a background. A filled control is also a *shape*, and a
	 * fill that matches the surface behind it leaves the control with no edge — the label still reads,
	 * because that pair is graded and passes, so the theme looks safe while a button has stopped
	 * looking like one. WCAG grades a control's boundary at 3:1, which is where the floor comes from.
	 * A report and not a verdict, on the same terms as `roleSeparation`: `passes` ignores it.
	 */
	fillSurface: FillSurfaceEntry[];
	/** The weakest fill-against-surface ratio (`0` when nothing resolved). */
	worstFillSurface: number;
	/** The floor `fillSurface[].clears` was graded against. */
	fillSurfaceFloor: number;
	/**
	 * How far the focus ring reads from each thing it can be drawn over.
	 *
	 * Every other dimension grades a colour a *reader* has to see. This one grades the only token a
	 * keyboard user depends on to know where they are, and nothing else here touches it — a theme can
	 * pin `--ring` to its own page background, pass every pair above, and ship with no visible focus at
	 * all. WCAG 2.2 grades a focus indicator against what it sits on at 3:1, which is the floor.
	 *
	 * The ring is composited over what it sits on before grading, because a ring carries alpha by
	 * default and contrast between a translucent colour and a backdrop is the blend, not the colour.
	 *
	 * Graded against the surfaces and not the fills: every ring in the set is a `box-shadow` at zero
	 * offset, so it is drawn on whatever sits *behind* the control. A ring that matches a fill it abuts
	 * is a narrower complaint, and one `fillSurface` already reaches whenever that fill matches its
	 * surface — grading it here would put six of nine pairs under the floor on a default that is fine,
	 * which is how a report teaches people to ignore it.
	 *
	 * A report and not a verdict, on the same terms as `roleSeparation` and `fillSurface`.
	 */
	focusRing: FocusRingEntry[];
	/** The weakest ring-against-backdrop ratio (`0` when nothing resolved). */
	worstFocusRing: number;
	/** The floor `focusRing[].clears` was graded against. */
	focusRingFloor: number;
	/**
	 * WCAG 2.2 SC 1.4.11's 3:1, reported next to the floor actually used.
	 *
	 * An algorithm declares its own focus floor, and a posture is allowed to declare one *below* the
	 * standard as a stated trade. Reporting only `focusRingFloor` would make that indistinguishable
	 * from conformance — every entry `clears`, and nothing says against what. Carrying the standard
	 * separately is what keeps a declared floor a position rather than a way to launder a failure.
	 */
	focusRingStandard: number;
	/**
	 * How far each step of an ordered ramp reads from the step before it.
	 *
	 * The pairs above grade a token against a *surface*; nothing grades a ramp against *itself*, and a
	 * ramp is only worth having if its steps can be told apart. Every step is derived by walking the
	 * anchor toward a contrast floor, so an anchor that already sits at that floor leaves no headroom
	 * and the whole ramp lands on one colour — four text levels rendering identically while every
	 * contrast pair still passes, because each step is individually as legible as the anchor. The
	 * hierarchy the tokens promise is what quietly stops existing.
	 *
	 * `reversed` is the other failure and wants the opposite reading: a step that moved *against* the
	 * ramp's established direction is far from its neighbour and still wrong, because it reads as more
	 * prominent than the level above it.
	 *
	 * A report and not a verdict, on the same terms as `roleSeparation` and `fillSurface`.
	 */
	rampSeparation: RampSeparationEntry[];
	/** The closest adjacent step across every graded ramp (`0` when nothing resolved). */
	worstRampSeparation: number;
	/** The floor `rampSeparation[].clears` was graded against. */
	rampSeparationFloor: number;
	/**
	 * Whether the reading surfaces sit on both sides of the light/dark line.
	 *
	 * Each ink is one token contracted to read on the page base *and* both panel steps, so when those
	 * surfaces span both poles no single value satisfies them: the ink that reads on a near-black page
	 * cannot read on a near-white panel. The theme is over-constrained rather than mis-derived, and the
	 * failures it produces arrive as a scatter of unrelated-looking pairs. This names the one cause
	 * behind them, which a list of ratios cannot.
	 *
	 * It reports and does not judge: a theme is free to do this deliberately, and `passes` is unmoved.
	 */
	surfacePolarity: SurfacePolarity;
}

/** One solid fill graded against one surface it can be drawn on. */
export interface FillSurfaceEntry {
	pair: string;
	fill: TokenName;
	surface: TokenName;
	fillValue: string;
	surfaceValue: string;
	ratio: number;
	clears: boolean;
}

/** The focus ring against one thing it can be drawn over, and how far it reads from it. */
export interface FocusRingEntry {
	/** A readable `--ring on --bg-0`. */
	pair: string;
	/** The surface the ring is drawn on. */
	against: TokenName;
	/** The ring composited over `against`, which is what the eye actually gets. */
	ringValue: string;
	againstValue: string;
	ratio: number;
	/** Whether the ring clears the requested focus floor. */
	clears: boolean;
}

/** Two adjacent steps of one ramp and how far apart they read. */
export interface RampSeparationEntry {
	/** The ramp these steps belong to (`--fg`). */
	ramp: string;
	from: TokenName;
	to: TokenName;
	fromValue: string;
	toValue: string;
	/** Perceptual OKLab distance, rounded to four decimals. */
	distance: number;
	/** Whether the step clears the requested ramp floor. */
	clears: boolean;
	/** Whether the step moved against the direction the ramp had already established. */
	reversed: boolean;
}

/** A text/fill token pair to grade for contrast: `fg` is the text token, `bg` the surface it sits on. */
export interface PairSpec {
	fg: TokenName;
	bg: TokenName;
	/** A human label for the pair in the audit result; defaults to `"<fg> on <bg>"`. */
	label?: string;
}

/**
 * The fills a consumer reads as "this control means X": the brand, the neutral, and the four status
 * roles. `--accent` belongs in the set because it is the one a consumer supplies by hand, which makes
 * it the one that can land on a status role's hue.
 */
const SOLID_FILL_ROLES: readonly TokenName[] = ["--accent", "--neutral", "--success", "--warn", "--danger", "--info"];

/**
 * The chromatic named hues, as a set to hand `separationRoles`. A palette promises twelve colors a
 * consumer can tell apart by name, and unlike the status roles nothing enforces that — the hues are
 * derived through one chroma scaling and one lightness ladder, so a pair defined close (`brown` is a
 * muted `orange`, five degrees apart) can compress until the names stop meaning different things.
 * Auditing them is how a palette owner sees that before shipping it.
 *
 * `gray` / `white` / `black` are left out: they are defined as achromatic and are *meant* to sit near
 * each other, so holding them to a hue floor would report a collision that is the design.
 */
export const PALETTE_HUE_ROLES: readonly TokenName[] = [
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

/** Matches the blessed algorithms' own "status roles mutually distinguishable" invariant. */
const DEFAULT_SEPARATION_FLOOR = 0.02;

/** WCAG 2.2 SC 1.4.11 grades a focus indicator against what it sits on at 3:1, the same as a control's boundary. */
const DEFAULT_FOCUS_RING_FLOOR = 3;
const FOCUS_RING = "--ring" as TokenName;

/** WCAG 1.4.11 grades the boundary of a control that carries meaning at 3:1. */
const DEFAULT_FILL_SURFACE_FLOOR = 3;

/**
 * The ordered ramps, whose steps promise decreasing prominence in the order given.
 *
 * The accent family is deliberately absent. `--accent-2/3/4` are ordered under some accent strategies
 * and are siblings around a hue under others (`fan`), so grading them as a ramp would report a
 * collision that is the strategy working. Whether they form a ramp is the algorithm's opinion, and
 * this is the engine.
 */
const RAMPS: ReadonlyArray<{ name: string; steps: readonly TokenName[] }> = [
	{ name: "--fg", steps: ["--fg-0", "--fg-1", "--fg-2", "--fg-3"] },
	{ name: "--bg", steps: ["--bg-0", "--bg-1", "--bg-2"] },
];

/**
 * Deliberately below {@link DEFAULT_SEPARATION_FLOOR}: adjacent ramp steps are *meant* to be near
 * neighbours, so holding them to the roles' floor would report every well-built ramp as too tight.
 * What this catches is a step that collapsed to nothing, not one that is merely close.
 */
const DEFAULT_RAMP_SEPARATION_FLOOR = 0.01;

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

	const separationFloor = opts.separationFloor ?? DEFAULT_SEPARATION_FLOOR;
	const roles = (opts.separationRoles ?? SOLID_FILL_ROLES).filter((token) => register[token] != null);
	const roleSeparation: RoleSeparationEntry[] = [];
	let worstSeparation = Infinity;
	for (let i = 0; i < roles.length; i++) {
		for (let j = i + 1; j < roles.length; j++) {
			const a = roles[i] as TokenName;
			const b = roles[j] as TokenName;
			const aValue = register[a] as string;
			const bValue = register[b] as string;
			const distance = Math.round(oklabDistance(aValue, bValue) * 1e4) / 1e4;
			const raw = separationAxes(aValue, bValue);
			const axes: SeparationAxes = {
				lightness: Math.round(raw.lightness * 1e4) / 1e4,
				chroma: Math.round(raw.chroma * 1e4) / 1e4,
				hue: Math.round(raw.hue * 1e4) / 1e4,
				hueAngle: Math.round(raw.hueAngle * 10) / 10,
			};
			const dominant =
				raw.hue >= raw.lightness && raw.hue >= raw.chroma ? "hue" : raw.lightness >= raw.chroma ? "lightness" : "chroma";
			roleSeparation.push({
				pair: `${a} vs ${b}`,
				a,
				b,
				aValue,
				bValue,
				distance,
				clears: distance >= separationFloor,
				axes,
				dominant,
			});
			if (distance < worstSeparation) worstSeparation = distance;
		}
	}

	const fillSurfaceFloor = opts.fillSurfaceFloor ?? DEFAULT_FILL_SURFACE_FLOOR;
	const fillSurface: FillSurfaceEntry[] = [];
	let worstFillSurface = Infinity;
	for (const fill of SOLID_FILL_ROLES) {
		const fillValue = register[fill];
		if (fillValue == null) continue;
		for (const surface of SURFACE_ROLES) {
			const surfaceValue = register[surface];
			if (surfaceValue == null) continue;
			const ratio = Math.round(contrast(fillValue, surfaceValue) * 100) / 100;
			fillSurface.push({
				pair: `${fill} on ${surface}`,
				fill,
				surface,
				fillValue,
				surfaceValue,
				ratio,
				clears: ratio >= fillSurfaceFloor,
			});
			if (ratio < worstFillSurface) worstFillSurface = ratio;
		}
	}

	const focusRingFloor = opts.focusRingFloor ?? DEFAULT_FOCUS_RING_FLOOR;
	const focusRing: FocusRingEntry[] = [];
	let worstFocusRing = Infinity;
	const ringRaw = register[FOCUS_RING];
	if (ringRaw != null) {
		for (const against of SURFACE_ROLES) {
			const againstValue = register[against];
			if (againstValue == null) continue;
			const composited = formatCss(flatten(ringRaw, againstValue));
			const ratio = Math.round(contrast(composited, againstValue) * 100) / 100;
			focusRing.push({
				pair: `${FOCUS_RING} on ${against}`,
				against,
				ringValue: composited,
				againstValue,
				ratio,
				clears: ratio >= focusRingFloor,
			});
			if (ratio < worstFocusRing) worstFocusRing = ratio;
		}
	}

	const rampSeparationFloor = opts.rampSeparationFloor ?? DEFAULT_RAMP_SEPARATION_FLOOR;
	const rampSeparation: RampSeparationEntry[] = [];
	let worstRampSeparation = Infinity;
	for (const ramp of RAMPS) {
		const steps = ramp.steps.filter((token) => register[token] != null);
		let direction = 0;
		for (let i = 1; i < steps.length; i++) {
			const from = steps[i - 1] as TokenName;
			const to = steps[i] as TokenName;
			const fromValue = register[from] as string;
			const toValue = register[to] as string;
			const distance = Math.round(oklabDistance(fromValue, toValue) * 1e4) / 1e4;
			const delta = toOklchColor(toValue).l - toOklchColor(fromValue).l;
			const reversed = direction !== 0 && delta !== 0 && Math.sign(delta) !== direction;
			if (direction === 0 && delta !== 0) direction = Math.sign(delta);
			rampSeparation.push({
				ramp: ramp.name,
				from,
				to,
				fromValue,
				toValue,
				distance,
				clears: distance >= rampSeparationFloor,
				reversed,
			});
			if (distance < worstRampSeparation) worstRampSeparation = distance;
		}
	}

	const light: TokenName[] = [];
	const dark: TokenName[] = [];
	for (const surface of READING_SURFACES) {
		const value = register[surface];
		if (value == null) continue;
		(contrast(value, "#000000") >= contrast(value, "#ffffff") ? light : dark).push(surface);
	}
	const surfacePolarity: SurfacePolarity = { spansPoles: light.length > 0 && dark.length > 0, light, dark };

	return {
		entries,
		tallies,
		passes: tallies.pass === tallies.total,
		level,
		worst: entries.length ? worst : 0,
		roleSeparation,
		worstSeparation: roleSeparation.length ? worstSeparation : 0,
		separationFloor,
		fillSurface,
		worstFillSurface: fillSurface.length ? worstFillSurface : 0,
		fillSurfaceFloor,
		focusRing,
		worstFocusRing: focusRing.length ? worstFocusRing : 0,
		focusRingFloor,
		focusRingStandard: DEFAULT_FOCUS_RING_FLOOR,
		rampSeparation,
		worstRampSeparation: rampSeparation.length ? worstRampSeparation : 0,
		rampSeparationFloor,
		surfacePolarity,
	};
}
