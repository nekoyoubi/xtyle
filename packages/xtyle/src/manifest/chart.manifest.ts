import type { ComponentManifest } from "./types.js";
import { PALETTES } from "../series.js";

const htmlExample = `<xtyle-chart
	label="Requests per second"
	x-label="Time"
	y-label="req/s"
	height="280"></xtyle-chart>
<script>
	const now = Date.now();
	const at = (i) => now - (11 - i) * 60_000;
	document.querySelector("xtyle-chart").series = [
		{ name: "Edge", points: [18, 24, 21, 30, 44, 38, 52, 47, 61, 55, 68, 64].map((value, i) => ({ at: at(i), value })) },
		{ name: "Origin", points: [10, 12, 15, 14, 22, 19, 26, 24, 31, 28, 34, 30].map((value, i) => ({ at: at(i), value })) },
	];
</script>`;

const svelteExample = `<script lang="ts">
	import { Chart } from "@xtyle/svelte";

	const now = Date.now();
	const at = (i: number) => now - (11 - i) * 60_000;
	const series = [
		{ name: "Edge", points: [18, 24, 21, 30, 44, 38, 52, 47, 61, 55, 68, 64].map((value, i) => ({ at: at(i), value })) },
		{ name: "Origin", points: [10, 12, 15, 14, 22, 19, 26, 24, 31, 28, 34, 30].map((value, i) => ({ at: at(i), value })) },
	];
</script>

<Chart {series} label="Requests per second" xLabel="Time" yLabel="req/s" height={280} />`;

const astroExample = `---
import { Chart } from "@xtyle/astro";
const now = Date.now();
const at = (i: number) => now - (11 - i) * 60_000;
const series = [
	{ name: "Edge", points: [18, 24, 21, 30, 44, 38, 52, 47, 61, 55, 68, 64].map((value, i) => ({ at: at(i), value })) },
	{ name: "Origin", points: [10, 12, 15, 14, 22, 19, 26, 24, 31, 28, 34, 30].map((value, i) => ({ at: at(i), value })) },
];
---

<Chart series={series} label="Requests per second" xLabel="Time" yLabel="req/s" height={280} />`;

const areaHtmlExample = `<xtyle-chart
	variant="area"
	curve="smooth"
	scheme="thermal"
	label="Memory in use"
	y-label="GB"
	height="240"></xtyle-chart>
<script>
	document.querySelector("xtyle-chart").series = [
		{ name: "Heap", points: [2.1, 2.4, 3.0, 2.8, 3.6, 4.1, 3.9, 4.6].map((value, i) => ({ at: i, value })) },
		{ name: "Cache", points: [1.0, 1.2, 1.1, 1.6, 1.5, 2.0, 2.2, 2.1].map((value, i) => ({ at: i, value })) },
	];
</script>`;

const areaSvelteExample = `<script lang="ts">
	import { Chart } from "@xtyle/svelte";

	const series = [
		{ name: "Heap", points: [2.1, 2.4, 3.0, 2.8, 3.6, 4.1, 3.9, 4.6].map((value, at) => ({ at, value })) },
		{ name: "Cache", points: [1.0, 1.2, 1.1, 1.6, 1.5, 2.0, 2.2, 2.1].map((value, at) => ({ at, value })) },
	];
</script>

<Chart {series} variant="area" curve="smooth" scheme="thermal" label="Memory in use" yLabel="GB" height={240} />`;

const areaAstroExample = `---
import { Chart } from "@xtyle/astro";
const series = [
	{ name: "Heap", points: [2.1, 2.4, 3.0, 2.8, 3.6, 4.1, 3.9, 4.6].map((value, at) => ({ at, value })) },
	{ name: "Cache", points: [1.0, 1.2, 1.1, 1.6, 1.5, 2.0, 2.2, 2.1].map((value, at) => ({ at, value })) },
];
---

<Chart series={series} variant="area" curve="smooth" scheme="thermal" label="Memory in use" yLabel="GB" height={240} />`;

const numericHtmlExample = `<xtyle-chart
	x-scale="linear"
	curve="step"
	markers
	x-label="Concurrency"
	y-label="ms"
	label="Latency by concurrency"
	height="240"></xtyle-chart>
<script>
	document.querySelector("xtyle-chart").series = [
		{ name: "p50", points: [1, 2, 4, 8, 16, 32].map((at, i) => ({ at, value: [12, 14, 19, 28, 46, 91][i] })) },
		{ name: "p99", points: [1, 2, 4, 8, 16, 32].map((at, i) => ({ at, value: [30, 38, 55, 92, 170, 320][i] })) },
	];
</script>`;

const numericSvelteExample = `<script lang="ts">
	import { Chart } from "@xtyle/svelte";

	const load = [1, 2, 4, 8, 16, 32];
	const series = [
		{ name: "p50", points: load.map((at, i) => ({ at, value: [12, 14, 19, 28, 46, 91][i] })) },
		{ name: "p99", points: load.map((at, i) => ({ at, value: [30, 38, 55, 92, 170, 320][i] })) },
	];
</script>

<Chart {series} xScale="linear" curve="step" markers xLabel="Concurrency" yLabel="ms" label="Latency by concurrency" height={240} />`;

const numericAstroExample = `---
import { Chart } from "@xtyle/astro";
const load = [1, 2, 4, 8, 16, 32];
const series = [
	{ name: "p50", points: load.map((at, i) => ({ at, value: [12, 14, 19, 28, 46, 91][i] })) },
	{ name: "p99", points: load.map((at, i) => ({ at, value: [30, 38, 55, 92, 170, 320][i] })) },
];
---

<Chart series={series} xScale="linear" curve="step" markers xLabel="Concurrency" yLabel="ms" label="Latency by concurrency" height={240} />`;

const selectableHtmlExample = `<xtyle-chart
	id="deploys"
	selectable
	label="Error rate"
	y-label="%"
	height="220"></xtyle-chart>
<script>
	const chart = document.getElementById("deploys");
	chart.series = [{ name: "5xx", points: [0.2, 0.3, 1.9, 0.4, 0.3].map((value, at) => ({ at, value })) }];
	chart.addEventListener("select", (e) => {
		openIncident(e.detail.x, e.detail.points[0].value);
	});
</script>`;

const selectableSvelteExample = `<script lang="ts">
	import { Chart } from "@xtyle/svelte";

	const series = [{ name: "5xx", points: [0.2, 0.3, 1.9, 0.4, 0.3].map((value, at) => ({ at, value })) }];
</script>

<Chart
	{series}
	selectable
	label="Error rate"
	yLabel="%"
	height={220}
	onselect={(e) => openIncident(e.detail.x, e.detail.points[0].value)}
/>`;

const selectableAstroExample = `---
import { Chart } from "@xtyle/astro";
const series = [{ name: "5xx", points: [0.2, 0.3, 1.9, 0.4, 0.3].map((value, at) => ({ at, value })) }];
---

<Chart id="deploys" series={series} selectable label="Error rate" yLabel="%" height={220} />
<script>
	document.getElementById("deploys").addEventListener("select", (e) => {
		openIncident(e.detail.x, e.detail.points[0].value);
	});
</script>`;

export const chartManifest: ComponentManifest = {
	id: "chart",
	name: "Chart",
	since: "0.8.0",
	category: "metrics",
	keywords: ["line chart", "area chart", "time series", "axis", "trend", "graph", "plot"],
	seeAlso: ["sparkline", "bar", "stat", "heatmap"],
	summary: "A multi-series line or area chart with real x and y axes, a time or numeric domain, and a cursor that reads every series at once.",
	description:
		"Chart plots one or more series against a shared x axis as an SVG that renders from data alone. Each series is a list of `{ at, value }` samples; `at` may be a timestamp (epoch ms or a date string) or a plain number, and the axis labels itself accordingly — `xScale` is inferred by default and can be pinned to `time` or `linear`. The domain is the data's own extent unless you set an explicit `domain` or a sliding `window` for a live feed, and samples outside it are dropped. Series take their colors from a `scheme` naming a palette resolved off the live theme, so a chart is coherent with the rest of the UI out of the box. Draw it as a `line` or an `area`, and join points `linear`, `smooth`, or `step`. The value axis derives round bounds and gridlines from the data (always including zero, and drawing a zero line when the data crosses it); `yMin` / `yMax` pin it instead. It reads out on hover *and* on keyboard: a crosshair snaps to the nearest x and a tooltip reports every series at that position at once, and the whole plot is mirrored into a visually-hidden data table so assistive tech reads the numbers, not the pixels. Set `selectable` to make it a drill-in surface: clicking (or pressing Enter at the cursor) fires a `select` event carrying the x position and each series' value there. A legend appears for multi-series data. With nothing to plot, it shows a muted `No data` message in place of the axes.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "chart",
			description: "The `<figure>` root holding the plot, the legend, and the accessible data table.",
			selector: ".xtyle-chart",
			tokens: ["--font-sans"],
		},
		{
			name: "plot",
			description: "The focusable plot surface: the SVG, the crosshair, and the readout live inside it.",
			selector: ".xtyle-chart__plot",
			tokens: ["--ring", "--border-thick", "--radius-sm"],
		},
		{
			name: "line",
			description: "One series' stroked path; `area` adds a translucent fill beneath it.",
			selector: ".xtyle-chart__line",
			tokens: ["--border-thick"],
		},
		{
			name: "point",
			description: "A sample on a series, revealed by `markers` or when the cursor snaps to it.",
			selector: ".xtyle-chart__point",
			tokens: ["--bg-0", "--border-thin", "--duration-fast", "--ease-standard"],
		},
		{
			name: "axis",
			description: "The x and y axis lines, their gridlines, tick labels, and optional axis titles.",
			selector: ".xtyle-chart__axis",
			tokens: ["--line", "--line-2", "--fg-2", "--fg-3", "--text-xs", "--weight-semibold"],
		},
		{
			name: "guide",
			description: "The crosshair that snaps to the cursor's x position.",
			selector: ".xtyle-chart__guide",
			tokens: ["--fg-3"],
		},
		{
			name: "legend",
			description: "The series key, shown for multi-series charts; each item pairs a color swatch with the series name.",
			selector: ".xtyle-chart__legend",
			tokens: ["--fg-1", "--text-sm", "--space-1", "--space-3", "--radius-sm"],
		},
		{
			name: "tooltip",
			description: "The readout at the cursor: the x label, then one row per series that has a sample there.",
			selector: ".xtyle-chart__tooltip",
			tokens: ["--surface-overlay", "--surface-overlay-border", "--elevation-3", "--radius-md", "--fg-0", "--fg-2", "--space-1", "--space-2", "--text-xs", "--text-sm", "--leading-normal", "--weight-semibold"],
		},
	],
	props: [
		{
			name: "series",
			type: "{ name: string; points: { at: number | string; value: number }[] }[]",
			description:
				"The data: one entry per series, each a name and its samples. `at` is epoch ms, a date string, or a plain number; `value` is the y. JS property in html/svelte, JSON attribute or prop in astro.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "variant",
			type: `"line" | "area"`,
			default: "line",
			description: "Stroke each series as a line, or fill the region beneath it as well.",
			bindings: ["html", "svelte", "astro"],
			options: ["line", "area"],
		},
		{
			name: "curve",
			type: `"linear" | "smooth" | "step"`,
			default: "linear",
			description: "How consecutive samples are joined: straight segments, a smoothed spline, or a stepped hold (right for values that change discretely).",
			bindings: ["html", "svelte", "astro"],
			options: ["linear", "smooth", "step"],
		},
		{
			name: "scheme",
			type: "Palette | string[]",
			default: "accents",
			description: "How series are colored: a built-in palette sampled off the theme, or an explicit color array.",
			bindings: ["html", "svelte", "astro"],
			options: [...PALETTES],
		},
		{
			name: "reverse",
			type: "boolean",
			default: "false",
			description: "Flips the scheme end for end (a sequential scale runs the other way; a categorical set reverses order).",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "markers",
			type: "boolean",
			default: "false",
			description: "Always draw a dot at every sample, instead of only under the cursor. Right for sparse series where the samples themselves are the data.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "xScale",
			type: `"auto" | "time" | "linear"`,
			default: "auto",
			description:
				"What the x axis measures. `auto` reads `time` from date strings or epoch-scale numbers and `linear` otherwise; pin it when the data is ambiguous. Kebab `x-scale` on the element.",
			bindings: ["html", "svelte", "astro"],
			options: ["auto", "time", "linear"],
		},
		{
			name: "domain",
			type: "[number | string, number | string]",
			description: "An explicit `[start, end]` for the x axis instead of the data's own extent; samples outside it are dropped.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "window",
			type: "number",
			description: "A sliding window in milliseconds ending at now, for a live time-domain feed. Ignored when `domain` is set, or on a linear axis.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "yMin",
			type: "number",
			description: "Pins the bottom of the value axis instead of deriving it (which always includes zero). Kebab `y-min` on the element.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "yMax",
			type: "number",
			description: "Pins the top of the value axis instead of deriving a round ceiling from the data. Kebab `y-max` on the element.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "xTicks",
			type: "number",
			default: "5",
			description: "How many divisions the x axis is labeled at. Kebab `x-ticks` on the element.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "yTicks",
			type: "number",
			default: "4",
			description: "Roughly how many gridlines the value axis aims for; the exact count follows from the round step it lands on. Kebab `y-ticks` on the element.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "xLabel",
			type: "string",
			description: "A title under the x axis naming what it measures. Kebab `x-label` on the element.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "yLabel",
			type: "string",
			description: "A title alongside the y axis naming its unit. Kebab `y-label` on the element.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "legend",
			type: "boolean",
			default: "true",
			description: "Shows the series legend for multi-series charts; set false to hide it.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "height",
			type: "number",
			default: "320",
			description: "The plot height in pixels; the chart fills its container's width.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "label",
			type: "string",
			description: "An accessible name for the chart, used as the data table's caption and the plot's `aria-label`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "selectable",
			type: "boolean",
			default: "false",
			description:
				"Makes the plot actionable: clicking it (or pressing Enter/Space at the keyboard cursor) fires a `select` `CustomEvent` whose `detail` carries `{ x, label, index, points }` — the cursor's position in domain units, how the chart labels it, and every series' value there. `@xtyle/svelte` surfaces it as an `onselect` callback.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [
		{
			name: "line",
			description: "The default: each series is a stroked path. Right when the shape of the trend is the message.",
			className: "xtyle-chart",
		},
		{
			name: "area",
			description: "Fills the region beneath each line with a translucent wash. Right for volumes and totals, where the area under the curve means something.",
			className: "xtyle-chart--area",
		},
	],
	sizes: [],
	states: [
		{
			name: "cursor",
			description: "The cursor is over a position: a crosshair snaps to it, the samples there swell, and the readout reports every series at once.",
			selector: ".xtyle-chart__point.is-active",
			tokens: ["--bg-0", "--border-thin", "--duration-fast", "--ease-standard"],
		},
		{
			name: "plot-focus",
			description: "Keyboard focus on the plot draws a token ring; arrow keys then walk the cursor along the axis and the readout announces each position.",
			selector: ".xtyle-chart__plot:focus-visible",
			tokens: ["--ring", "--border-thick"],
		},
	],
	slots: [],
	consumedTokens: [
		"--font-sans",
		"--text-xs",
		"--text-sm",
		"--bg-0",
		"--fg-0",
		"--fg-1",
		"--fg-2",
		"--fg-3",
		"--line",
		"--line-2",
		"--space-1",
		"--space-2",
		"--space-3",
		"--radius-sm",
		"--radius-md",
		"--surface-overlay",
		"--surface-overlay-border",
		"--elevation-3",
		"--duration-fast",
		"--ease-standard",
		"--ring",
		"--border-thin",
		"--border-thick",
		"--weight-semibold",
		"--leading-normal",
	],
	composition: [
		"Chart is the axis-bearing member of the Metrics family: reach for it when *when* a value happened matters. `Sparkline` is the axis-free glance at the same shape (right inline, in a table cell, beside a `Stat`), and `Bar` compares across categories rather than along a domain.",
		"Pair a headline `Stat` with the Chart that explains it: the number above, the trend that produced it below.",
		"For a live feed, keep pushing samples onto `series` and set a `window` — the domain slides with the clock and old samples fall off the left edge on their own.",
		"Colors come from the same register the rest of the UI does. `accents` suits a couple of related series; `skittles` separates many; `severity` or `thermal` when the series are themselves a scale.",
		"Make a dashboard chart a drill-in with `selectable` and a `select` listener: click a spike to open that moment's logs, filter a table to that window, or route to a detail view. The `detail` names the exact x and every series' value there, so the handler needs no lookup.",
	],
	a11y: [
		"The SVG is decorative (`aria-hidden`); the chart's data is mirrored into a visually-hidden `<table>` — one row per x position, one column per series — so assistive tech reads the actual numbers. `label` becomes the table's caption.",
		"The plot is a single tab stop (`role=\"img\"`, named by `label`) rather than one stop per sample, which would make a long series unnavigable. Arrow Left/Right walk the cursor along the axis, Home/End jump to the ends, and Escape dismisses the readout.",
		"The readout is a live region (`role=\"status\"`), so moving the cursor by keyboard announces the x position and every series' value there without moving focus.",
		"With `selectable`, Enter or Space at the cursor fires `select`, so a keyboard user can drill in exactly where a pointer user clicks; the plot's accessible name says so.",
		"Color is never the only channel: the legend names each series in text, the readout names them again at the cursor, and the table repeats every value.",
	],
	examples: [
		{
			id: "time-series",
			title: "Time series",
			description: "Two series over a time domain. The axis labels itself as a clock, and the cursor reads both series at once.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
		{
			id: "area",
			title: "Area",
			description: "`variant=\"area\"` fills beneath each line, and `curve=\"smooth\"` rounds the joins. Here on the `thermal` scale.",
			source: { html: areaHtmlExample, svelte: areaSvelteExample, astro: areaAstroExample },
		},
		{
			id: "numeric",
			title: "Numeric domain",
			description: "`xScale=\"linear\"` plots against a plain number rather than a clock; `curve=\"step\"` and `markers` suit discrete measurements.",
			source: { html: numericHtmlExample, svelte: numericSvelteExample, astro: numericAstroExample },
		},
		{
			id: "selectable",
			title: "Drill in",
			description: "`selectable` fires `select` on click or Enter, carrying the cursor's x and every series' value there.",
			source: { html: selectableHtmlExample, svelte: selectableSvelteExample, astro: selectableAstroExample },
		},
	],
};
