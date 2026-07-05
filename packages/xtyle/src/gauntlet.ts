import { contrast, formatCss, oklch } from "./color.js";
import type {
	Algorithm,
	InvariantContext,
	InvariantResult,
	Knobs,
	Scheme,
	Seeds,
	TokenRegister,
} from "./types.js";

/** The three common seed colors expressed as the token constraints they actually are. */
function seedsToConstraints(seeds: Seeds): TokenRegister {
	const out: TokenRegister = {};
	if (seeds.bg !== undefined) out["--bg-0"] = seeds.bg;
	if (seeds.fg !== undefined) out["--fg-0"] = seeds.fg;
	if (seeds.accent !== undefined) out["--accent"] = seeds.accent;
	return out;
}

export interface GauntletOptions {
	runs?: number;
	seed?: number;
	knobs?: Knobs;
}

export interface GauntletFailure {
	run: number;
	seeds: Seeds;
	knobs: Knobs;
	invariant: string;
	detail?: string;
}

export interface GauntletReport {
	algorithm: string;
	runs: number;
	passed: number;
	failures: GauntletFailure[];
	ok: boolean;
}

export type GauntletDepth = "quick" | "standard" | "full";

/** Run counts per depth tier: `quick` for a spot-check during iteration, `full` for the
 * production battery. The CLI takes `--depth`; the test suite reads `XTYLE_GAUNTLET_DEPTH`. */
export const GAUNTLET_DEPTH_RUNS: Record<GauntletDepth, number> = {
	quick: 40,
	standard: 150,
	full: 250,
};

export function resolveDepth(value: string | undefined): GauntletDepth {
	return value === "quick" || value === "full" ? value : "standard";
}

function mulberry32(seed: number): () => number {
	let a = seed >>> 0;
	return () => {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const EXTREMES: Seeds[] = [
	{ bg: "#000000", fg: "#ffffff", accent: "#ff0000" },
	{ bg: "#ffffff", fg: "#000000", accent: "#0000ff" },
	{ bg: "#000000", fg: "#000000", accent: "#00ff00" },
	{ bg: "#ffffff", fg: "#ffffff", accent: "#ffff00" },
	{ bg: "#808080", fg: "#808080", accent: "#808080" },
	{ bg: "#010101", fg: "#020202", accent: "#ff00ff" },
	{ bg: "#fefefe", fg: "#fdfdfd", accent: "#00ffff" },
	{ bg: "#123456", fg: "#abcdef", accent: "#fedcba" },
];

function randomSeeds(rand: () => number): Seeds {
	const color = (): string => formatCss(oklch(rand(), rand() * 0.4, rand() * 360));
	return { bg: color(), fg: color(), accent: color() };
}

const SCHEME_DRAWS: Array<Scheme | undefined> = [undefined, "dark", "light"];
const SHIFT_STEP_DRAWS = [30, 45, 90, 120];
const ACCENT_SPLIT_DRAWS = [20, 30, 45, 60];
const CONSTRAINT_TARGETS = ["--accent", "--bg-0"];
const CONTRAST_DRAWS: Array<"aa" | "aaa" | number | undefined> = [undefined, "aa", "aaa", 5];
const VIBRANCY_DRAWS: Array<number | undefined> = [undefined, 0, 0.5, 1];
const TYPE_SCALE_DRAWS: Array<number | undefined> = [undefined, 1.125, 1.25, 1.414];
const RADIUS_SCALE_DRAWS: Array<number | undefined> = [undefined, 0, 1, 2];
const DENSITY_DRAWS: Array<"compact" | "normal" | "comfortable" | undefined> = [
	undefined,
	"compact",
	"normal",
	"comfortable",
];
// Hour-of-day coverage for the nxi-nite day/night algorithm. Neutral on the others (a
// no-op knob a settle-only pipeline ignores) — a coverage range, not an opinion. Without
// it the gauntlet never varies hour and "AA at every hour" goes untested.
const HOUR_DRAWS: Array<number | undefined> = [undefined, 0, 6, 12, 18, 23, 24];

const POLE_WHITE = oklch(0.98, 0, 0);
const POLE_BLACK = oklch(0.15, 0, 0);

function headroomColor(rand: () => number): string {
	for (let i = 0; i < 24; i++) {
		const c = oklch(rand(), rand() * 0.4, rand() * 360);
		if (Math.max(contrast(c, POLE_WHITE), contrast(c, POLE_BLACK)) >= 4.75) {
			return formatCss(c);
		}
	}
	return formatCss(oklch(rand() < 0.5 ? 0.12 : 0.96, rand() * 0.12, rand() * 360));
}

function midLightnessColor(rand: () => number): string {
	const l = 0.4 + rand() * 0.35;
	const c = rand() < 0.5 ? 0 : rand() * 0.12;
	return formatCss(oklch(l, c, rand() * 360));
}

function pick<T>(rand: () => number, items: T[]): T {
	return items[Math.floor(rand() * items.length) % items.length] as T;
}

function randomKnobs(rand: () => number, base: Knobs, run: number): Knobs {
	const knobs: Knobs = { ...base };
	if (base.scheme === undefined) {
		const scheme = pick(rand, SCHEME_DRAWS);
		if (scheme) knobs.scheme = scheme;
	}
	if (base.accentShiftStep === undefined) {
		knobs.accentShiftStep = pick(rand, SHIFT_STEP_DRAWS);
	}
	// Walked deterministically by run index — fuzzing the split this way covers its values without
	// consuming the shared RNG, so adding it leaves every other draw's sequence byte-identical.
	if (base.accentSplit === undefined) {
		knobs.accentSplit = ACCENT_SPLIT_DRAWS[run % ACCENT_SPLIT_DRAWS.length] as number;
	}
	if (base.contrastBand === undefined) {
		const band = pick(rand, CONTRAST_DRAWS);
		if (band !== undefined) knobs.contrastBand = band;
	}
	if (base.vibrancy === undefined) {
		const v = pick(rand, VIBRANCY_DRAWS);
		if (v !== undefined) knobs.vibrancy = v;
	}
	if (base.typeScale === undefined) {
		const v = pick(rand, TYPE_SCALE_DRAWS);
		if (v !== undefined) knobs.typeScale = v;
	}
	if (base.radiusScale === undefined) {
		const v = pick(rand, RADIUS_SCALE_DRAWS);
		if (v !== undefined) knobs.radiusScale = v;
	}
	if (base.density === undefined) {
		const v = pick(rand, DENSITY_DRAWS);
		if (v !== undefined) knobs.density = v;
	}
	if (base.hour === undefined) {
		const v = pick(rand, HOUR_DRAWS);
		if (v !== undefined) knobs.hour = v;
	}
	return knobs;
}

export function gauntlet(
	algorithm: Algorithm,
	opts: GauntletOptions = {},
): GauntletReport {
	const runs = opts.runs ?? 100;
	const rand = mulberry32(opts.seed ?? 0x9e3779b9);
	const failures: GauntletFailure[] = [];
	let passed = 0;

	const baseKnobs: Knobs = { ...opts.knobs };

	for (let run = 0; run < runs; run++) {
		const seeds =
			run < EXTREMES.length
				? (EXTREMES[run] as Seeds)
				: randomSeeds(rand);
		const knobs = randomKnobs(rand, baseKnobs, run);
		// The seeds and any extra pins all enter through the one token channel; an extra draw can
		// override a seed (e.g. re-pinning `--bg-0`), which is exactly the layering the engine allows.
		const constraints: TokenRegister = seedsToConstraints(seeds);
		if (run % 5 === 0) {
			constraints[pick(rand, CONSTRAINT_TARGETS)] = headroomColor(rand);
		} else if (run % 5 === 2) {
			constraints["--bg-0"] = midLightnessColor(rand);
		}
		const register = algorithm.derive({ knobs, constraints });
		const scheme: Scheme =
			(knobs.scheme ?? (register["--scheme"] as Scheme)) ?? "dark";
		const ctx: InvariantContext = {
			register,
			knobs,
			scheme,
			categories: algorithm.categories,
			constraints,
		};

		let runOk = true;
		if (constraints) {
			for (const [name, value] of Object.entries(constraints)) {
				if (register[name] !== value) {
					runOk = false;
					failures.push({
						run,
						seeds,
						knobs,
						invariant: "pinned token honored verbatim",
						detail: `${name}=${register[name]} expected ${value}`,
					});
				}
			}
		}
		for (const invariant of algorithm.invariants) {
			const result: InvariantResult = invariant(ctx);
			if (!result.ok) {
				runOk = false;
				failures.push({
					run,
					seeds,
					knobs,
					invariant: result.name,
					detail: result.detail,
				});
			}
		}
		if (runOk) passed++;
	}

	return {
		algorithm: algorithm.id,
		runs,
		passed,
		failures,
		ok: failures.length === 0,
	};
}
