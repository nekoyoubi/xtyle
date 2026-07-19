import { listComponents, coverComponents, derive, ICON_PRIMITIVE_NAMES } from "@xtyle/core";
import { resolveAlgorithm } from "@xtyle/core/algorithms";
import baseline from "./stats-baseline.json";
import { BENCH_TOOLS } from "./bench-tools";
import pkg from "../../package.json";

export const SITE_ANCHORS = { bg: "#0b0d12", fg: "#e6e9ef", accent: "#6ea8fe" } as const;
export const SITE_ALGORITHM = "xtyle-default";
export const SITE_FONTS = {
	sans: '"Poppins", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
	display: '"REM Variable", system-ui, -apple-system, "Segoe UI", sans-serif',
} as const;
export const BINDINGS = ["html", "svelte", "astro"] as const;

export type Countable = "components" | "tokens" | "categories" | "bindings" | "primitives" | "tools";

export interface SiteStats {
	components: number;
	tokens: number;
	categories: number;
	bindings: number;
	primitives: number;
	tools: number;
	/** The in-flight release version (the current cycle), for the version readout. */
	version: string;
	coverage: { covered: number; total: number; ok: boolean };
	algorithm: Awaited<ReturnType<typeof resolveAlgorithm>>;
	register: ReturnType<typeof derive>;
	baseline: { version: string } & Record<Countable, number>;
	delta(key: Countable): number;
}

export interface DisplayStat {
	/** The countable this stat reads, used for growth deltas. */
	key: Countable;
	label: string;
	value: number;
}

/** The core component-centric by-the-numbers list — one ordering and label set shared by the
 * components index and the homepage so the two never drift. The statusbar shows these plus the
 * bench stats; the components index stays about components, so it reads only these. */
export function displayStats(s: SiteStats): DisplayStat[] {
	return [
		{ key: "components", label: "components", value: s.components },
		{ key: "categories", label: "categories", value: s.categories },
		{ key: "bindings", label: "libraries", value: s.bindings },
		{ key: "tokens", label: "tokens", value: s.tokens },
	];
}

/** The bench-side numbers: the icon primitive library and the bench tools. Appended after
 * `displayStats` on the statusbar, kept off the components index (which shouldn't quote them). */
export function benchStats(s: SiteStats): DisplayStat[] {
	return [
		{ key: "primitives", label: "primitives", value: s.primitives },
		{ key: "tools", label: "tools", value: s.tools },
	];
}

let cached: SiteStats | null = null;

/** The site's single source of live numbers. Derives the canonical theme once, counts everything off it, and exposes growth deltas against the last release's snapshot. Every surface that quotes a stat reads from here so nothing goes stale. */
export async function getStats(): Promise<SiteStats> {
	if (cached) return cached;
	const algorithm = await resolveAlgorithm(SITE_ALGORITHM);
	const register = derive(algorithm, {
		constraints: { "--bg-0": SITE_ANCHORS.bg, "--fg-0": SITE_ANCHORS.fg, "--accent": SITE_ANCHORS.accent },
		knobs: { fonts: SITE_FONTS },
	});
	const components = listComponents();
	const cov = coverComponents(register);
	const covered = cov.filter((c) => c.covered).length;
	const live: Record<Countable, number> = {
		components: components.length,
		tokens: Object.keys(register).length,
		categories: new Set(components.map((c) => c.category)).size,
		bindings: BINDINGS.length,
		primitives: ICON_PRIMITIVE_NAMES.length,
		tools: BENCH_TOOLS.length,
	};
	cached = {
		...live,
		version: pkg.version,
		coverage: { covered, total: cov.length, ok: covered === cov.length },
		algorithm,
		register,
		baseline,
		delta: (key) => live[key] - (baseline[key] ?? 0),
	};
	return cached;
}
