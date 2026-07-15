import { describe, expect, it } from "vitest";
import { getComponent, coverComponent, derive, resolveChartPlot } from "../src/index.js";
import { renderFragmentLight } from "../src/elements/fragment-ssr.js";
import { xtyleDefault } from "../src/batteries.js";

const register = derive(xtyleDefault, {
	constraints: { "--bg-0": "#0b0d12", "--fg-0": "#e6e9ef", "--accent": "#6ea8fe" },
});

const START = Date.UTC(2026, 0, 1, 12, 0, 0);
const at = (i: number): number => START + i * 60_000;

const timeSeries = [
	{ name: "Edge", points: [10, 20, 30, 40].map((value, i) => ({ at: at(i), value })) },
	{ name: "Origin", points: [5, 8, 12, 16].map((value, i) => ({ at: at(i), value })) },
];

/** The element's own binding shape, so a fragment test and the live element render the same plot. */
function bindingsFor(series: typeof timeSeries, extra: Record<string, unknown> = {}): Record<string, unknown> {
	const plot = resolveChartPlot(series, { now: START });
	return {
		series: plot.series,
		colors: ["#6ea8fe", "#f0a"],
		xScale: plot.xScale,
		domainStart: plot.domainStart,
		domainEnd: plot.domainEnd,
		height: 280,
		title: "Requests",
		...extra,
	};
}

describe("chart plot shaping", () => {
	it("maps every series onto one shared normalized domain", () => {
		const plot = resolveChartPlot(timeSeries, { now: START });
		expect(plot.domainStart).toBe(at(0));
		expect(plot.domainEnd).toBe(at(3));
		expect(plot.series[0]?.points.map((p) => p.x)).toEqual([0, 1 / 3, 2 / 3, 1]);
		expect(plot.series[1]?.points).toHaveLength(4);
	});

	it("reads epoch-scale numbers and date strings as a time axis, plain numbers as linear", () => {
		expect(resolveChartPlot(timeSeries, { now: START }).xScale).toBe("time");
		expect(
			resolveChartPlot([{ name: "iso", points: [{ at: "2026-01-01T12:00:00Z", value: 1 }] }], { now: START }).xScale,
		).toBe("time");
		expect(resolveChartPlot([{ name: "n", points: [{ at: 1, value: 1 }, { at: 8, value: 2 }] }], { now: START }).xScale).toBe(
			"linear",
		);
	});

	it("honors an explicit xScale over what the data looks like", () => {
		const plot = resolveChartPlot(timeSeries, { now: START, xScale: "linear" });
		expect(plot.xScale).toBe("linear");
	});

	it("slides a window against now and drops samples that fall outside it", () => {
		const plot = resolveChartPlot(timeSeries, { now: at(3), window: 2 * 60_000 });
		expect(plot.domainStart).toBe(at(1));
		expect(plot.domainEnd).toBe(at(3));
		expect(plot.series[0]?.points.map((p) => p.value)).toEqual([20, 30, 40]);
	});

	it("clips to an explicit domain", () => {
		const plot = resolveChartPlot(timeSeries, { now: START, domain: [at(1), at(2)] });
		expect(plot.series[0]?.points.map((p) => p.value)).toEqual([20, 30]);
	});

	it("centers a lone sample instead of collapsing it onto the axis", () => {
		const plot = resolveChartPlot([{ name: "one", points: [{ at: 5, value: 3 }] }], { now: START });
		expect(plot.domainEnd).toBeGreaterThan(plot.domainStart);
		expect(plot.series[0]?.points[0]?.x).toBeCloseTo(0.5, 5);
	});
});

describe("chart", () => {
	it("is registered under the metrics category", () => {
		const manifest = getComponent("chart");
		expect(manifest.category).toBe("metrics");
		expect(manifest.name).toBe("Chart");
	});

	it("covers every consumed token against xtyle-default", () => {
		const result = coverComponent(getComponent("chart"), register);
		expect(result.missing, `missing: ${result.missing.join(", ")}`).toEqual([]);
		expect(result.covered).toBe(true);
	});

	it("draws one path per series, painted with its resolved color", async () => {
		const html = await renderFragmentLight("chart", bindingsFor(timeSeries));
		const lines = html.match(/class="xtyle-chart__line"/g) ?? [];
		expect(lines).toHaveLength(2);
		expect(html).toContain('stroke="#6ea8fe"');
		expect(html).toContain('stroke="#f0a"');
		expect(html).not.toContain('class="xtyle-chart__area"');
	});

	it("bears real axes: gridlines, tick labels, and axis titles", async () => {
		const html = await renderFragmentLight("chart", bindingsFor(timeSeries, { xLabel: "Time", yLabel: "req/s" }));
		expect(html).toContain('class="xtyle-chart__axis"');
		expect(html).toContain('class="xtyle-chart__grid"');
		expect(html).toContain('class="xtyle-chart__xtick"');
		expect(html).toContain('class="xtyle-chart__ytick"');
		expect(html).toContain(">Time</text>");
		expect(html).toContain(">req/s</text>");
	});

	it("labels a time axis as a clock and a linear axis as numbers", async () => {
		const timeHtml = await renderFragmentLight("chart", bindingsFor(timeSeries));
		expect(timeHtml).toMatch(/class="xtyle-chart__xtick"[^>]*>\d{2}:\d{2}</);

		const numeric = [{ name: "p50", points: [1, 2, 4, 8].map((n) => ({ at: n, value: n * 3 })) }];
		const plot = resolveChartPlot(numeric, { now: START });
		const numericHtml = await renderFragmentLight("chart", {
			series: plot.series,
			colors: ["#6ea8fe"],
			xScale: plot.xScale,
			domainStart: plot.domainStart,
			domainEnd: plot.domainEnd,
			xTicks: 4,
		});
		expect(numericHtml).toContain(">8</text>");
	});

	it("derives a value axis that includes zero and lands on round ticks", async () => {
		const html = await renderFragmentLight("chart", bindingsFor(timeSeries));
		expect(html).toContain('class="xtyle-chart__ytick"');
		expect(html).toContain(">0</text>");
		expect(html).toContain(">40</text>");
	});

	it("pins the value axis to an explicit yMin/yMax", async () => {
		const html = await renderFragmentLight("chart", bindingsFor(timeSeries, { yMin: 0, yMax: 100, yTicks: 4 }));
		expect(html).toContain(">100</text>");
		expect(html).toContain(">75</text>");
	});

	it("draws a zero line only when the data crosses it", async () => {
		const positive = await renderFragmentLight("chart", bindingsFor(timeSeries));
		expect(positive).not.toContain('class="xtyle-chart__zero"');

		const crossing = [{ name: "delta", points: [-4, 2, -1, 5].map((value, i) => ({ at: at(i), value })) }];
		const plot = resolveChartPlot(crossing, { now: START });
		const html = await renderFragmentLight("chart", {
			series: plot.series,
			colors: ["#6ea8fe"],
			xScale: plot.xScale,
			domainStart: plot.domainStart,
			domainEnd: plot.domainEnd,
		});
		expect(html).toContain('class="xtyle-chart__zero"');
	});

	it("fills beneath each line in the area variant", async () => {
		const html = await renderFragmentLight("chart", bindingsFor(timeSeries, { variant: "area" }));
		expect(html).toContain("xtyle-chart--area");
		const areas = html.match(/class="xtyle-chart__area"/g) ?? [];
		expect(areas).toHaveLength(2);
		expect(html).toMatch(/class="xtyle-chart__area"[^>]*d="[^"]*Z"/);
	});

	it("joins samples straight, smoothed, or stepped", async () => {
		const linear = await renderFragmentLight("chart", bindingsFor(timeSeries));
		expect(linear).toMatch(/class="xtyle-chart__line" part="line" d="M[^"]*L/);
		expect(linear).not.toMatch(/class="xtyle-chart__line" part="line" d="[^"]*C/);

		const smooth = await renderFragmentLight("chart", bindingsFor(timeSeries, { curve: "smooth" }));
		expect(smooth).toMatch(/class="xtyle-chart__line" part="line" d="[^"]*C/);

		const step = await renderFragmentLight("chart", bindingsFor(timeSeries, { curve: "step" }));
		const stepPath = /class="xtyle-chart__line" part="line" d="([^"]*)"/.exec(step)?.[1] ?? "";
		expect((stepPath.match(/L/g) ?? []).length).toBe(6);
	});

	it("carries each sample as a point that names its own x and value", async () => {
		const html = await renderFragmentLight("chart", bindingsFor(timeSeries));
		const points = html.match(/class="xtyle-chart__point"/g) ?? [];
		expect(points).toHaveLength(8);
		expect(html).toContain('data-si="1" data-i="3"');
		expect(html).toContain('data-value="16"');
	});

	it("renders a legend for multi-series data and drops it for one", async () => {
		const many = await renderFragmentLight("chart", bindingsFor(timeSeries));
		expect(many).toContain('class="xtyle-chart__legend"');
		expect(many).toContain(">Origin</span>");

		const one = await renderFragmentLight("chart", bindingsFor([timeSeries[0]!]));
		expect(one).not.toContain('class="xtyle-chart__legend"');
	});

	it("renders the crosshair and a readout row per series, both dormant", async () => {
		const html = await renderFragmentLight("chart", bindingsFor(timeSeries));
		expect(html).toMatch(/class="xtyle-chart__guide"[^>]*hidden/);
		expect(html).toMatch(/class="xtyle-chart__tooltip"[^>]*role="status"/);
		expect(html).toContain('data-tip-row="0"');
		expect(html).toContain('data-tip-row="1"');
		expect(html).toContain("data-tip-x");
	});

	it("mirrors the data into a visually-hidden table for assistive tech", async () => {
		const html = await renderFragmentLight("chart", bindingsFor(timeSeries));
		expect(html).toContain('class="xtyle-chart__a11y"');
		expect(html).toContain("<caption>Requests</caption>");
		expect(html).toContain('<th scope="col">Edge</th>');
		expect(html).toContain("<td>16</td>");
	});

	it("makes the plot one focusable tab stop that names its keyboard contract", async () => {
		const html = await renderFragmentLight("chart", bindingsFor(timeSeries));
		expect(html).toMatch(/class="xtyle-chart__plot"[^>]*tabindex="0"/);
		expect(html).toMatch(/class="xtyle-chart__plot"[^>]*role="img"/);
		expect(html).toContain("Use arrow keys to read values.");

		const selectable = await renderFragmentLight("chart", bindingsFor(timeSeries, { selectable: true }));
		expect(selectable).toContain("xtyle-chart--selectable");
		expect(selectable).toContain("Enter to select a point");
	});

	it("shows a No data message with no axes when there is nothing to plot", async () => {
		const html = await renderFragmentLight("chart", { series: [], colors: [] });
		expect(html).toContain('class="xtyle-chart__empty"');
		expect(html).toContain(">No data</text>");
		expect(html).not.toContain('class="xtyle-chart__line"');
		expect(html).not.toContain('class="xtyle-chart__grid"');
		expect(html).toContain('aria-label="No data"');
	});

	it("treats a series with no samples as nothing to plot", async () => {
		const html = await renderFragmentLight("chart", { series: [{ name: "Edge", points: [] }], colors: ["#6ea8fe"] });
		expect(html).toContain(">No data</text>");
	});
});
