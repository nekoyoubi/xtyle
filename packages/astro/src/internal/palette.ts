import { derive, seriesPalette, seriesColorsFor, rampColor, glowFilter, resolveIconMark, composeIconThemed, type SeriesScheme, type RampScheme } from "@xtyle/core";
import { resolveAlgorithm } from "@xtyle/core/host";

function matrixCeiling(matrix: number[][], explicit?: number): number {
	if (explicit && explicit > 0) return explicit;
	return Math.max(1, ...matrix.flatMap((row) => row.map((v) => (Number.isFinite(v) ? v : 0))));
}

/** Baking colors at build time needs a register; the runtime theme isn't known yet, so SSR uses the
 * default one and the upgraded element re-resolves against the live cascade. Memoized per build. */
let cached: Promise<Record<string, string>> | null = null;
async function defaultRegister(): Promise<Record<string, string>> {
	cached ??= (async () => derive(await resolveAlgorithm("xtyle-default"), {}))();
	return cached;
}

/** Bakes a generated icon mark for SSR: series slots resolve against the default register while
 * token fills stay `var(--…)`, so a static (un-hydrated) mark still recolors with the theme and the
 * upgraded element re-resolves its series off the live cascade. Returns null for a non-spec name. */
export async function bakeIconMark(
	name: string,
	scheme: SeriesScheme | string[],
	className?: string,
): Promise<string | null> {
	const parsed = resolveIconMark(name);
	if (!parsed) return null;
	return composeIconThemed(parsed.composition, { register: await defaultRegister(), scheme, className, part: "icon" });
}

export async function resolveSeriesColors(
	scheme: SeriesScheme | string[],
	count: number,
	reverse: boolean,
): Promise<string[]> {
	if (Array.isArray(scheme)) return seriesPalette(scheme, count, {}, { reverse });
	return seriesPalette(scheme, count, await defaultRegister(), { reverse });
}

/** The by-name companion to `resolveSeriesColors` for SSR: a per-item resolver that honors each
 * item's semantic `tone` under the `statuses` scheme, so a static outcome chart pins by meaning even
 * when a zero-value category is filtered out. Positional for every other scheme. */
export async function resolveSeriesColorsFor(
	scheme: SeriesScheme | string[],
	items: readonly { tone?: string }[],
	reverse: boolean,
): Promise<string[]> {
	if (Array.isArray(scheme)) return seriesColorsFor(scheme, items, {}, { reverse });
	return seriesColorsFor(scheme, items, await defaultRegister(), { reverse });
}

/** Bakes each cell's intensity color against the default register for the zero-JS SSR grid; the
 * upgraded element re-resolves against the live cascade. */
export async function resolveHeatmapColors(
	scheme: RampScheme | string[],
	values: number[][],
	reverse: boolean,
	max?: number,
): Promise<string[][]> {
	const register = Array.isArray(scheme) ? {} : await defaultRegister();
	const ceiling = matrixCeiling(values, max);
	return values.map((row) => row.map((v) => rampColor(scheme, (Number.isFinite(v) ? v : 0) / ceiling, register, { reverse })));
}

/** Bakes each cell's secondary-glow drop-shadow against the default register for the zero-JS SSR
 * grid; the upgraded element re-resolves against the live cascade. */
export async function resolveHeatmapGlows(
	scheme: RampScheme | string[],
	glow: number[][],
	reverse: boolean,
	glowMax?: number,
	glowBlur?: number,
): Promise<(string | null)[][]> {
	if (!glow.length) return [];
	const register = Array.isArray(scheme) ? {} : await defaultRegister();
	const color = rampColor(scheme, 1, register, { reverse });
	const ceiling = matrixCeiling(glow, glowMax);
	const maxBlur = glowBlur && glowBlur > 0 ? glowBlur : undefined;
	return glow.map((row) => row.map((v) => glowFilter((Number.isFinite(v) ? v : 0) / ceiling, color, maxBlur)));
}

/** Bakes the scale key against the default register for SSR; the upgraded element re-resolves against
 * the live cascade. */
export async function resolveHeatmapScale(
	scheme: RampScheme | string[],
	values: number[][],
	reverse: boolean,
	max?: number,
): Promise<{ scaleColors: string[]; scaleLow: number; scaleHigh: number }> {
	const register = Array.isArray(scheme) ? {} : await defaultRegister();
	const scaleColors = [0, 0.25, 0.5, 0.75, 1].map((t) => rampColor(scheme, t, register, { reverse }));
	return { scaleColors, scaleLow: 0, scaleHigh: matrixCeiling(values, max) };
}
