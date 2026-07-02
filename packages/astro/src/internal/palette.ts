import { derive, seriesPalette, type SeriesScheme } from "@xoji/core";
import { resolveAlgorithm } from "@xoji/core/host";

/** Baking colors at build time needs a register; the runtime theme isn't known yet, so SSR uses the
 * default one and the upgraded element re-resolves against the live cascade. Memoized per build. */
let cached: Promise<Record<string, string>> | null = null;
async function defaultRegister(): Promise<Record<string, string>> {
	cached ??= (async () => derive(await resolveAlgorithm("xoji-default"), {}))();
	return cached;
}

export async function resolveSeriesColors(
	scheme: SeriesScheme | string[],
	count: number,
	reverse: boolean,
): Promise<string[]> {
	if (Array.isArray(scheme)) return seriesPalette(scheme, count, {}, { reverse });
	return seriesPalette(scheme, count, await defaultRegister(), { reverse });
}
