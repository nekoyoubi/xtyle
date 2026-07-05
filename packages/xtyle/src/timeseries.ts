/** The default sliding-window width for a time-windowed series: five minutes. */
export const DEFAULT_SPARK_WINDOW_MS = 300_000;

/** One timestamped sample: `at` is epoch ms or a date string, paired with a numeric value. */
export interface TimeSample {
	at: number | string;
	value: number;
}

export interface WindowedPlotOptions {
	/** The sliding window width in ms, ending at `now`; ignored when `domain` is set. Defaults to 5 minutes. */
	window?: number;
	/** An explicit `[start, end]` span (epoch ms or date strings) instead of a sliding window. */
	domain?: [number | string, number | string] | null;
	/** The "now" the sliding window ends at, epoch ms. Passed in so the shaping stays pure and testable. */
	now: number;
}

function toMs(at: number | string): number {
	return typeof at === "number" ? at : Date.parse(at);
}

/**
 * Maps timestamped samples onto a normalized x (0..1) across a sliding window or an explicit domain,
 * dropping any that fall outside it, and sorts them by time. The time-series sibling of `seriesPalette`:
 * pure data shaping a time-series component (a sparkline, a strip) turns into a plotted series, with no
 * DOM and no clock of its own (the caller passes `now`). Returns `{ x, value }[]` ready to render.
 */
export function windowedPlot(points: TimeSample[], opts: WindowedPlotOptions): { x: number; value: number }[] {
	const domain = opts.domain;
	const [start, end] =
		domain && domain.length === 2
			? [toMs(domain[0]), toMs(domain[1])]
			: [opts.now - (opts.window ?? DEFAULT_SPARK_WINDOW_MS), opts.now];
	const span = end - start || 1;
	return points
		.map((p) => ({ x: (toMs(p.at) - start) / span, value: Number(p.value) }))
		.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.value) && p.x >= 0 && p.x <= 1)
		.sort((a, b) => a.x - b.x);
}
