import type { ComponentManifest } from "./types.js";
import { SERIES_SCHEMES } from "../series.js";

const htmlExample = `<xtyle-bar
	categories='["Q1","Q2","Q3","Q4"]'
	scheme="accents"
	label="Revenue by quarter"
	height="280"></xtyle-bar>
<script>
	document.querySelector("xtyle-bar").series = [
		{ name: "Web", values: [12, 19, 15, 22] },
		{ name: "Mobile", values: [8, 14, 18, 25] },
	];
</script>`;

const svelteExample = `<script lang="ts">
	import { Bar } from "@xtyle/svelte";

	const categories = ["Q1", "Q2", "Q3", "Q4"];
	const series = [
		{ name: "Web", values: [12, 19, 15, 22] },
		{ name: "Mobile", values: [8, 14, 18, 25] },
	];
</script>

<Bar {categories} {series} scheme="accents" label="Revenue by quarter" height={280} />`;

const astroExample = `---
import { Bar } from "@xtyle/astro";
const categories = ["Q1", "Q2", "Q3", "Q4"];
const series = [
	{ name: "Web", values: [12, 19, 15, 22] },
	{ name: "Mobile", values: [8, 14, 18, 25] },
];
---

<Bar categories={categories} series={series} scheme="accents" label="Revenue by quarter" height={280} />`;

const stackedHtmlExample = `<xtyle-bar
	categories='["Mon","Tue","Wed","Thu","Fri"]'
	scheme="thermal"
	stacked
	label="Load by tier"></xtyle-bar>
<script>
	document.querySelector("xtyle-bar").series = [
		{ name: "CPU", values: [30, 45, 28, 52, 40] },
		{ name: "IO", values: [20, 18, 34, 22, 30] },
		{ name: "Net", values: [12, 22, 16, 28, 18] },
	];
</script>`;

const stackedSvelteExample = `<script lang="ts">
	import { Bar } from "@xtyle/svelte";

	const categories = ["Mon", "Tue", "Wed", "Thu", "Fri"];
	const series = [
		{ name: "CPU", values: [30, 45, 28, 52, 40] },
		{ name: "IO", values: [20, 18, 34, 22, 30] },
		{ name: "Net", values: [12, 22, 16, 28, 18] },
	];
</script>

<Bar {categories} {series} scheme="thermal" stacked label="Load by tier" />`;

const stackedAstroExample = `---
import { Bar } from "@xtyle/astro";
const categories = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const series = [
	{ name: "CPU", values: [30, 45, 28, 52, 40] },
	{ name: "IO", values: [20, 18, 34, 22, 30] },
	{ name: "Net", values: [12, 22, 16, 28, 18] },
];
---

<Bar categories={categories} series={series} scheme="thermal" stacked label="Load by tier" />`;

const horizontalHtmlExample = `<xtyle-bar
	categories='["Rust","TypeScript","Svelte","Astro","CSS"]'
	orientation="horizontal"
	scheme="skittles"
	label="Lines by language"
	height="240"></xtyle-bar>
<script>
	document.querySelector("xtyle-bar").series = [
		{ name: "Lines", values: [4200, 3800, 1500, 900, 2100] },
	];
</script>`;

const horizontalSvelteExample = `<script lang="ts">
	import { Bar } from "@xtyle/svelte";

	const categories = ["Rust", "TypeScript", "Svelte", "Astro", "CSS"];
	const series = [{ name: "Lines", values: [4200, 3800, 1500, 900, 2100] }];
</script>

<Bar {categories} {series} orientation="horizontal" scheme="skittles" label="Lines by language" height={240} />`;

const horizontalAstroExample = `---
import { Bar } from "@xtyle/astro";
const categories = ["Rust", "TypeScript", "Svelte", "Astro", "CSS"];
const series = [{ name: "Lines", values: [4200, 3800, 1500, 900, 2100] }];
---

<Bar categories={categories} series={series} orientation="horizontal" scheme="skittles" label="Lines by language" height={240} />`;

const actionableHtmlExample = `<xtyle-bar
	categories='["Alpha","Bravo","Charlie","Delta"]'
	label="Runs by workflow"
	selectable
	height="240"></xtyle-bar>
<script>
	const bar = document.querySelector("xtyle-bar");
	bar.series = [{ name: "Runs", values: [42, 30, 18, 9] }];
	bar.addEventListener("select", (e) => {
		openWorkflow(e.detail.category);
	});
</script>`;

const actionableSvelteExample = `<script lang="ts">
	import { Bar } from "@xtyle/svelte";

	const categories = ["Alpha", "Bravo", "Charlie", "Delta"];
	const series = [{ name: "Runs", values: [42, 30, 18, 9] }];
</script>

<Bar
	{categories}
	{series}
	label="Runs by workflow"
	selectable
	height={240}
	onselect={(e) => openWorkflow(e.detail.category)}
/>`;

const actionableAstroExample = `---
import { Bar } from "@xtyle/astro";
const categories = ["Alpha", "Bravo", "Charlie", "Delta"];
const series = [{ name: "Runs", values: [42, 30, 18, 9] }];
---

<Bar categories={categories} series={series} label="Runs by workflow" selectable height={240} />
<script>
	document.querySelector("xtyle-bar").addEventListener("select", (e) => {
		openWorkflow(e.detail.category);
	});
</script>`;

export const barManifest: ComponentManifest = {
	id: "bar",
	name: "Bar",
	since: "0.3.0",
	category: "metrics",
	keywords: ["bar chart", "column chart", "histogram", "graph", "stacked bar"],
	seeAlso: ["pie", "sparkline", "heatmap", "stat"],
	summary: "A grouped or stacked bar chart, colored from a theme-derived series palette, with an interactive value readout and opt-in clickable bars.",
	description:
		"Bar plots one or more numeric series across a set of categories as an SVG chart that renders from data alone. Each series takes its color from a `scheme` resolved off the live theme (the `accents` fan, the `skittles` hue ring, a `thermal` cold-to-hot scale, or the `status` roster), so a chart is coherent with the rest of the UI out of the box; pass an explicit color array for full control, and `reverse` to flip any scheme. Bars sit side by side by default or stack with `stacked`, and run vertically or horizontally (`orientation`) for long category labels. It's interactive: hovering or focusing a bar dims the rest and floats a value readout, and the whole chart is mirrored into a visually-hidden data table so assistive tech reads the numbers, not the pixels. Set `selectable` to make it a drill-in surface: each bar becomes a button that fires a `select` event with its series, category, and value, so a click filters, navigates, or drills into that data. A value axis with gridlines and category labels come derived; a legend appears for multi-series data. Set `height` for the plot area; the chart fills its container's width. With no categories or series to plot, it shows a muted `No data` message in place of the axes.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "chart",
			description: "The `<figure>` root holding the SVG plot, legend, tooltip, and the accessible data table.",
			selector: ".xtyle-bar",
			tokens: ["--font-sans"],
		},
		{
			name: "bar",
			description: "A single value bar, filled with its series color; the focus/hover target.",
			selector: ".xtyle-bar__bar",
			tokens: ["--ring", "--border-thick", "--duration-fast", "--ease-standard"],
		},
		{
			name: "grid",
			description: "The value gridlines, axis baseline, and tick labels.",
			selector: ".xtyle-bar__grid",
			tokens: ["--line", "--line-2", "--fg-3", "--text-xs"],
		},
		{
			name: "legend",
			description: "The series key, shown for multi-series charts; each item pairs a color dot with the series name.",
			selector: ".xtyle-bar__legend",
			tokens: ["--fg-1", "--text-sm", "--space-1", "--space-3", "--radius-sm"],
		},
		{
			name: "tooltip",
			description: "The floating value readout shown on hover or focus of a bar.",
			selector: ".xtyle-bar__tooltip",
			tokens: ["--surface-overlay", "--surface-overlay-border", "--elevation-3", "--radius-md", "--fg-0"],
		},
	],
	props: [
		{
			name: "series",
			type: "{ name: string; values: number[] }[]",
			description: "The data: one entry per series, each a name and a value per category. JS property in html/svelte, JSON attribute or prop in astro.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "categories",
			type: "string[]",
			description: "The category labels along the axis; one per index in each series' `values`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "scheme",
			type: "SeriesScheme | string[]",
			default: "accents",
			description: "How series are colored: a built-in scheme resolved off the theme, or an explicit color array.",
			bindings: ["html", "svelte", "astro"],
			options: [...SERIES_SCHEMES],
		},
		{
			name: "reverse",
			type: "boolean",
			default: "false",
			description: "Flips the scheme end for end (a sequential scale runs the other way; a categorical set reverses order).",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "colorBy",
			type: `"series" | "category"`,
			default: "auto",
			description: "Which axis drives the palette. Defaults to coloring by category for a single series (so the scheme still varies bar to bar) and by series once there's more than one; set explicitly to override. Kebab `color-by` on the element.",
			bindings: ["html", "svelte", "astro"],
			options: ["series", "category"],
		},
		{
			name: "orientation",
			type: `"vertical" | "horizontal"`,
			default: "vertical",
			description: "Bars grow up from a category axis (`vertical`) or rightward from the categories down the side (`horizontal`, better for long labels or many categories).",
			bindings: ["html", "svelte", "astro"],
			options: ["vertical", "horizontal"],
		},
		{
			name: "stacked",
			type: "boolean",
			default: "false",
			description: "Stacks each category's series into one bar instead of placing them side by side.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "showValues",
			type: "boolean",
			default: "false",
			description: "Draws each bar's value above it (grouped mode). Kebab `show-values` on the element.",
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
			description: "An accessible name for the chart, used as the data table's caption.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "selectable",
			type: "boolean",
			default: "false",
			description:
				"Makes bars actionable: each bar becomes a `role=\"button\"` with a pointer cursor, and clicking one (or pressing Enter/Space while it's focused) fires a `select` `CustomEvent` whose `detail` carries `{ series, category, value, seriesIndex, categoryIndex }`. `@xtyle/svelte` surfaces it as an `onselect` callback. Leave it off for a read-only chart.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [],
	sizes: [],
	states: [
		{
			name: "bar-hover",
			description: "Pointer over or keyboard focus on a bar: the rest dim and a value readout floats above it.",
			selector: ".xtyle-bar--hovering .xtyle-bar__bar:not(.is-active)",
			tokens: ["--duration-fast", "--ease-standard"],
		},
		{
			name: "bar-focus",
			description: "Keyboard focus on a bar draws a token ring; each bar is a tab stop that announces its series, category, and value.",
			selector: ".xtyle-bar__bar:focus-visible",
			tokens: ["--ring", "--border-thick"],
		},
	],
	slots: [],
	consumedTokens: [
		"--font-sans",
		"--text-xs",
		"--text-sm",
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
		"Colors come from the same register the rest of the UI does, so a chart matches its surrounding chrome without hand-picking colors. Pick a `scheme` that fits the data: `accents` for a branded set, `skittles` for many distinct categories, `thermal` or `status` for a scale.",
		"Pair a Bar with `Stat` cards in the Metrics family for a headline number beside its breakdown.",
		"For a single-series chart, drop the legend (`legend={false}`) and let the category labels carry the meaning.",
		"Make a dashboard chart a drill-in with `selectable` and a `select` listener: click a bar to filter the table beside it, open that category's detail, or route to a filtered view. The event's `detail` names the exact `series` / `category` / `value` clicked, so the handler needs no lookup.",
	],
	a11y: [
		"The SVG is decorative (`aria-hidden`); the chart's data is mirrored into a visually-hidden `<table>` so assistive tech reads the actual numbers. `label` becomes the table's caption.",
		"Each bar is a focusable tab stop with an `aria-label` naming its series, category, and value, so the chart is navigable by keyboard, and the value readout appears on focus as well as hover.",
		"With `selectable`, each bar becomes a `role=\"button\"` (announced as actionable) and activates on Enter/Space as well as click, so a keyboard user can drill in; a read-only chart keeps its bars as `role=\"img\"` data points.",
		"Color is never the only channel: the legend names each series in text, and the table repeats every value.",
	],
	examples: [
		{
			id: "grouped",
			title: "Grouped series",
			description: "Two series across four categories, colored from the `accents` scheme, with an interactive readout.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
		{
			id: "stacked",
			title: "Stacked",
			description: "`stacked` folds each category's series into one bar; here on the `thermal` scale.",
			source: { html: stackedHtmlExample, svelte: stackedSvelteExample, astro: stackedAstroExample },
		},
		{
			id: "horizontal",
			title: "Horizontal",
			description: "`orientation=\"horizontal\"` runs bars rightward with the categories down the side. A single series colors by category, so each bar takes its own `skittles` hue.",
			source: { html: horizontalHtmlExample, svelte: horizontalSvelteExample, astro: horizontalAstroExample },
		},
		{
			id: "actionable",
			title: "Actionable bars",
			description: "`selectable` makes each bar a button that fires `select` on click or Enter/Space, so a chart can drive a drill-in. The `detail` carries the series, category, value, and both indices.",
			source: { html: actionableHtmlExample, svelte: actionableSvelteExample, astro: actionableAstroExample },
		},
	],
};
