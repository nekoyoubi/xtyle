import { contrast, formatCss, oklch } from "./color.js";
import type {
	AccentStrategy,
	Algorithm,
	InvariantContext,
	InvariantResult,
	Knobs,
	Scheme,
	Seeds,
	TokenRegister,
} from "./types.js";

/**
 * Derive a run's inverted counterpart and the context its invariants are judged in. A theme's other
 * half is a derive like any other, so it answers to the same invariants — but nothing exercised it
 * until now, which left every `invert: true` consumer riding on a path the battery had never run.
 * Both the flipped knobs and the flipped constraints go into the context: judging an inverted
 * register against the constraints it was *not* derived from reports failures that are not there.
 */
function invertRun(
	algorithm: Algorithm,
	invertedOptions: GauntletOptions["invertedOptions"],
	knobs: Knobs,
	constraints: TokenRegister,
): { ctx: InvariantContext; constraints: TokenRegister } | null {
	if (!invertedOptions) return null;
	try {
		const flipped = invertedOptions(algorithm, { knobs, constraints });
		const register = algorithm.derive(flipped);
		const scheme: Scheme = (flipped.knobs?.scheme ?? (register["--scheme"] as Scheme)) ?? "dark";
		const flippedConstraints = flipped.constraints ?? {};
		return {
			constraints: flippedConstraints,
			ctx: {
				register,
				knobs: flipped.knobs ?? {},
				scheme,
				categories: algorithm.categories,
				constraints: flippedConstraints,
			},
		};
	} catch {
		return null;
	}
}

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
	/**
	 * How to build the inverted counterpart of a run, so the battery holds an algorithm's invariants
	 * against the *other* scheme as well as the one it seeded. `index.ts` injects the real
	 * `invertedOptions` here rather than the gauntlet importing it, which would close an import cycle;
	 * omitted, the inverted half is simply not exercised.
	 */
	invertedOptions?: (algorithm: Algorithm, opts: { knobs?: Knobs; constraints?: TokenRegister }) => {
		knobs?: Knobs;
		constraints?: TokenRegister;
	};
}

export interface GauntletFailure {
	run: number;
	seeds: Seeds;
	knobs: Knobs;
	/**
	 * Every token the run pinned, not only the three it seeded from. A run adds pins of its own — a
	 * headroom target, a mid-lightness background, a second brand for `duo` — and a failure that
	 * reports the seeds without them cannot be reproduced from its own record.
	 */
	constraints: TokenRegister;
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
	{ bg: "#1a1a1a", accent: "#2b2b2b" },
	{ bg: "#f7f9fc", accent: "#0b5fff" },
	{ bg: "#fffbe6", accent: "#ffe100" },
	{ bg: "#3d3a2f", accent: "#6b6350" },
	{ bg: "#ffffff", accent: "#39ff14" },
];

function randomSeeds(rand: () => number): Seeds {
	const color = (): string => formatCss(oklch(rand(), rand() * 0.4, rand() * 360));
	return { bg: color(), fg: color(), accent: color() };
}

const SCHEME_DRAWS: Array<Scheme | undefined> = [undefined, "dark", "light"];
const SHIFT_STEP_DRAWS = [30, 45, 90, 120];
const ACCENT_SPLIT_DRAWS = [20, 30, 45, 60];
const ACCENT_STRATEGY_DRAWS: Array<AccentStrategy | undefined> = [
	undefined,
	"fan",
	"step",
	"shade",
	"duo",
];
/**
 * The tokens a run may pin. The two anchors, plus the scoped surfaces — each of those ships a
 * companion set (syntax colours, the ANSI palette, a field border) whose contract is to stay readable
 * *on that surface*, so a pin has to re-thread them rather than only replace the published value.
 * Pinning them was untested until it turned out not to, and a light code block pinned onto a dark page
 * kept syntax colours computed for the dark scheme.
 *
 * Deliberately not every derived token: most pins are a consumer overriding policy outright (an opaque
 * `--state-hover`, an unreadable `--code-keyword`), and the invariants correctly report those. Only
 * tokens the algorithm still owes something *downstream of* belong here.
 */
const CONSTRAINT_TARGETS = ["--accent", "--bg-0", "--code-bg", "--terminal-bg", "--field-bg"];
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
	// INFO: indexed by run, not rand(), so the other draws' RNG sequence stays byte-identical
	if (base.accentSplit === undefined) {
		knobs.accentSplit = ACCENT_SPLIT_DRAWS[run % ACCENT_SPLIT_DRAWS.length] as number;
	}
	// INFO: length is coprime with the split's, so runs cross every strategy against every split
	if (base.accentStrategy === undefined) {
		const strategy = ACCENT_STRATEGY_DRAWS[run % ACCENT_STRATEGY_DRAWS.length];
		if (strategy !== undefined) knobs.accentStrategy = strategy;
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
		const constraints: TokenRegister = seedsToConstraints(seeds);
		if (run % 5 === 0) {
			constraints[pick(rand, CONSTRAINT_TARGETS)] = headroomColor(rand);
		} else if (run % 5 === 2) {
			constraints["--bg-0"] = midLightnessColor(rand);
		}
		// INFO: duo degenerates to nearly a fan without a real second brand, so pin `--accent-2` on most duo runs
		if (knobs.accentStrategy === "duo" && run % 3 !== 0) {
			constraints["--accent-2"] = run % 3 === 1 ? headroomColor(rand) : midLightnessColor(rand);
		}
		// INFO: a pinned flank is where the fan's geometry stops being symmetric — the other flank mirrors
		// the pin, and the fourth member has to move out of its way. Unpinned runs never reach that shape.
		if (knobs.accentStrategy === "fan" && run % 4 === 1) {
			constraints[run % 8 === 1 ? "--accent-2" : "--accent-3"] = headroomColor(rand);
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
						constraints,
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
					constraints,
					invariant: result.name,
					detail: result.detail,
				});
			}
		}

		const inverted = invertRun(algorithm, opts.invertedOptions, knobs, constraints);
		if (inverted) {
			for (const invariant of algorithm.invariants) {
				const result: InvariantResult = invariant(inverted.ctx);
				if (!result.ok) {
					runOk = false;
					failures.push({
						run,
						seeds,
						knobs,
						constraints: inverted.constraints,
						invariant: `${result.name} (inverted)`,
						detail: result.detail,
					});
				}
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
