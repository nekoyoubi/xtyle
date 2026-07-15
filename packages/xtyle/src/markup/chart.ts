import type { Palette, StatusTone } from "../series.js";
import { windowedPlot, type TimeSample } from "../timeseries.js";

/** One plotted series: a name, its samples, and (for the `statuses` palette) the outcome it stands for. */
export interface ChartSeries {
	name: string;
	points: TimeSample[];
	/** For the `statuses` palette, the semantic outcome this series represents, so it colors by meaning
	 * regardless of which series are present. Ignored by every other palette. */
	tone?: StatusTone;
}

export type ChartScheme = Palette | string[];

/** How a series is drawn: a stroked line, or a line with the region beneath it filled. */
export type ChartVariant = "line" | "area";

/** How consecutive points are joined: straight segments, a smoothed spline, or a stepped hold. */
export type ChartCurve = "linear" | "smooth" | "step";

/** What the x axis measures: timestamps, plain numbers, or a guess from the data. */
export type ChartXScale = "auto" | "time" | "linear";

export const CHART_VARIANTS: readonly ChartVariant[] = ["line", "area"];
export const CHART_CURVES: readonly ChartCurve[] = ["linear", "smooth", "step"];
export const CHART_X_SCALES: readonly ChartXScale[] = ["auto", "time", "linear"];

/** The host-layout rule for a chart, shared by the element's scaffold and the SSR shadow root. */
export const chartHostCss = ":host { display: block; }";

/** An `at` at or beyond this magnitude reads as epoch milliseconds rather than a plain number (1973-03). */
const EPOCH_MS_FLOOR = 1e11;

export interface ChartPlotOptions {
	/** What the x axis measures; `auto` (default) infers `time` from date strings or epoch-scale numbers. */
	xScale?: ChartXScale;
	/** A sliding window in ms ending at `now`, for a live time-domain chart. Ignored when `domain` is set. */
	window?: number;
	/** An explicit `[start, end]` domain (epoch ms, date strings, or plain numbers) instead of the data's extent. */
	domain?: [number | string, number | string] | null;
	/** The "now" a sliding window ends at, passed in so the shaping stays pure and testable. */
	now: number;
}

export interface ChartPlotSeries {
	name: string;
	points: { x: number; value: number }[];
}

export interface ChartPlot {
	series: ChartPlotSeries[];
	xScale: "time" | "linear";
	domainStart: number;
	domainEnd: number;
}

function toMs(at: number | string): number {
	return typeof at === "number" ? at : Date.parse(at);
}

function detectScale(series: readonly ChartSeries[], explicit: ChartXScale | undefined): "time" | "linear" {
	if (explicit === "time" || explicit === "linear") return explicit;
	for (const s of series) {
		for (const p of s.points ?? []) {
			if (typeof p.at === "string") return "time";
			if (Number.isFinite(p.at) && Math.abs(p.at) >= EPOCH_MS_FLOOR) return "time";
		}
	}
	return "linear";
}

function extent(series: readonly ChartSeries[]): [number, number] | null {
	let lo = Infinity;
	let hi = -Infinity;
	for (const s of series) {
		for (const p of s.points ?? []) {
			const at = toMs(p.at);
			if (!Number.isFinite(at)) continue;
			if (at < lo) lo = at;
			if (at > hi) hi = at;
		}
	}
	return Number.isFinite(lo) && Number.isFinite(hi) ? [lo, hi] : null;
}

/**
 * Shapes a chart's series onto a shared x domain: resolves what the axis measures (timestamps or plain
 * numbers), settles the domain (an explicit one, a sliding window ending at `now`, or the data's own
 * extent), and maps every series' samples onto a normalized 0..1 x through the same `windowedPlot`
 * primitive the sparkline uses — dropping anything outside the domain and sorting by x. Pure: no DOM and
 * no clock of its own, so the element, the SSR bake, and a test all shape identically. A single-sample
 * (or zero-width) domain is padded so the lone point lands mid-plot instead of collapsing onto the axis.
 */
export function resolveChartPlot(series: readonly ChartSeries[], opts: ChartPlotOptions): ChartPlot {
	const xScale = detectScale(series, opts.xScale);
	const explicit = opts.domain;
	const bounds =
		explicit && explicit.length === 2 && Number.isFinite(toMs(explicit[0])) && Number.isFinite(toMs(explicit[1]))
			? ([toMs(explicit[0]), toMs(explicit[1])] as [number, number])
			: opts.window && opts.window > 0 && xScale === "time"
				? ([opts.now - opts.window, opts.now] as [number, number])
				: (extent(series) ?? ([0, 1] as [number, number]));
	let [start, end] = bounds;
	if (!(end > start)) {
		const pad = Math.abs(start) > 0 ? Math.abs(start) * 0.0005 || 0.5 : 0.5;
		start -= pad;
		end += pad;
	}
	return {
		series: series.map((s) => ({
			name: s.name ?? "",
			points: windowedPlot(s.points ?? [], { domain: [start, end], now: opts.now }),
		})),
		xScale,
		domainStart: start,
		domainEnd: end,
	};
}
