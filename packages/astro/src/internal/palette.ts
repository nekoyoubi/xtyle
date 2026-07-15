import { derive, seriesPalette, seriesColorsFor, rampColor, glowFilter, categoricalHeatColors, matrixCeiling, resolveIconMark, composeIconThemed, qrScannability, type Palette, type QrMode } from "@xtyle/core";
import { resolveAlgorithm } from "@xtyle/core/host";

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
	scheme: Palette | string[],
	className?: string,
): Promise<string | null> {
	const parsed = resolveIconMark(name);
	if (!parsed) return null;
	return composeIconThemed(parsed.composition, { register: await defaultRegister(), scheme, className, part: "icon" });
}

export async function resolveSeriesColors(
	scheme: Palette | string[],
	count: number,
	reverse: boolean,
): Promise<string[]> {
	if (Array.isArray(scheme)) return seriesPalette(scheme, count, {}, { reverse });
	return seriesPalette(scheme, count, await defaultRegister(), { reverse });
}

/** The by-name companion to `resolveSeriesColors` for SSR: a per-item resolver that honors each
 * item's semantic `tone` under the `statuses` palette, so a static outcome chart pins by meaning even
 * when a zero-value category is filtered out. Positional for every other palette. */
export async function resolveSeriesColorsFor(
	scheme: Palette | string[],
	items: readonly { tone?: string }[],
	reverse: boolean,
): Promise<string[]> {
	if (Array.isArray(scheme)) return seriesColorsFor(scheme, items, {}, { reverse });
	return seriesColorsFor(scheme, items, await defaultRegister(), { reverse });
}

/** Bakes each cell's intensity color against the default register for the zero-JS SSR grid; the
 * upgraded element re-resolves against the live cascade. */
export async function resolveHeatmapColors(
	scheme: Palette | string[],
	values: number[][],
	reverse: boolean,
	max?: number,
): Promise<string[][]> {
	const register = Array.isArray(scheme) ? {} : await defaultRegister();
	const ceiling = matrixCeiling(values, max);
	return values.map((row) => row.map((v) => rampColor(scheme, (Number.isFinite(v) ? v : 0) / ceiling, register, { reverse })));
}

/** Bakes each cell's secondary-glow drop-shadow against the default register for the zero-JS SSR
 * grid; the upgraded element re-resolves against the live cascade. Pass `hues` (a categorical grid's
 * per-category colors) and its `axis` to give each halo its cell's own category hue; otherwise every
 * halo takes the ramp's hot end. Mirrors the element's own `cellGlows`. */
export async function resolveHeatmapGlows(
	scheme: Palette | string[],
	glow: number[][],
	reverse: boolean,
	glowMax?: number,
	glowBlur?: number,
	hues?: string[],
	axis: "col" | "row" = "col",
): Promise<(string | null)[][]> {
	if (!glow.length) return [];
	const ceiling = matrixCeiling(glow, glowMax);
	const maxBlur = glowBlur && glowBlur > 0 ? glowBlur : undefined;
	if (hues) {
		return glow.map((row, r) =>
			row.map((v, c) => glowFilter((Number.isFinite(v) ? v : 0) / ceiling, hues[axis === "col" ? c : r] ?? "currentColor", maxBlur)),
		);
	}
	const color = rampColor(scheme, 1, Array.isArray(scheme) ? {} : await defaultRegister(), { reverse });
	return glow.map((row) => row.map((v) => glowFilter((Number.isFinite(v) ? v : 0) / ceiling, color, maxBlur)));
}

/** Bakes a categorical grid's per-category hues and cell fills against the default register for SSR;
 * the upgraded element re-resolves against the live cascade. Each category (a column by default, or a
 * row) takes a distinct sampled hue, and each cell blends from the surface to its category hue by value. */
export async function resolveHeatmapCategorical(
	scheme: Palette | string[],
	values: number[][],
	axis: "col" | "row",
	reverse: boolean,
	max?: number,
): Promise<{ cellColors: string[][]; hues: string[] }> {
	return categoricalHeatColors(scheme, values, await defaultRegister(), { axis, reverse, max });
}

/** Bakes the scale key against the default register for SSR; the upgraded element re-resolves against
 * the live cascade. */
export async function resolveHeatmapScale(
	scheme: Palette | string[],
	values: number[][],
	reverse: boolean,
	max?: number,
): Promise<{ scaleColors: string[]; scaleLow: number; scaleHigh: number }> {
	const register = Array.isArray(scheme) ? {} : await defaultRegister();
	const scaleColors = [0, 0.25, 0.5, 0.75, 1].map((t) => rampColor(scheme, t, register, { reverse }));
	return { scaleColors, scaleLow: 0, scaleHigh: matrixCeiling(values, max) };
}

/** Decide a QR symbol's module/background pair at build time for the given mode. `theme` inks from
 * the tokens (null colors) but still reports low contrast; `bitonal` pins black-on-white; `auto`
 * measures the default register and falls back to bitonal when the theme can't be scanned. The
 * upgraded element re-measures against the live cascade. */
export async function resolveQrColors(
	mode: QrMode,
): Promise<{ moduleColor: string | null; bgColor: string | null; lowContrast: boolean; bitonal: boolean }> {
	if (mode === "bitonal") return { moduleColor: "#000000", bgColor: "#ffffff", lowContrast: false, bitonal: true };
	const scan = qrScannability(await defaultRegister());
	if (mode === "auto" && !scan.scannable) return { moduleColor: "#000000", bgColor: "#ffffff", lowContrast: true, bitonal: true };
	return { moduleColor: null, bgColor: null, lowContrast: !scan.scannable, bitonal: false };
}
