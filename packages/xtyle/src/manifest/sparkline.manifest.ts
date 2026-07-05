import type { ComponentManifest } from "./types.js";
import { FULL_TONES } from "../vocab.js";

const htmlExample = `<xtyle-sparkline values="4,6,5,8,7,9,12,10,13" label="Weekly signups"></xtyle-sparkline>

<xtyle-sparkline values="4,6,5,8,7,9,12,10,13" variant="area" tone="success"></xtyle-sparkline>

<xtyle-sparkline values="4,6,5,8,7,9,12,10,13" variant="bar" tone="purple"></xtyle-sparkline>`;

const svelteExample = `<script lang="ts">
	import { Sparkline } from "@xtyle/svelte";

	const trend = [4, 6, 5, 8, 7, 9, 12, 10, 13];
</script>

<Sparkline values={trend} label="Weekly signups" />
<Sparkline values={trend} variant="area" tone="success" />`;

const astroExample = `---
import { Sparkline } from "@xtyle/astro";
const trend = [4, 6, 5, 8, 7, 9, 12, 10, 13];
---

<Sparkline values={trend} label="Weekly signups" />
<Sparkline values={trend} variant="area" tone="success" />`;

const inlineHtmlExample = `<p>
	Signups this week
	<xtyle-sparkline values="4,6,5,8,7,9,12,10,13" tone="accent" style="--spark-width: 5rem; --spark-height: 1.2rem;"></xtyle-sparkline>
	up 34%.
</p>`;

const inlineSvelteExample = `<p>
	Signups this week
	<Sparkline values={trend} style="--spark-width: 5rem; --spark-height: 1.2rem;" />
	up 34%.
</p>`;

const inlineAstroExample = `<p>
	Signups this week
	<Sparkline values={trend} style="--spark-width: 5rem; --spark-height: 1.2rem;" />
	up 34%.
</p>`;

const timeHtmlExample = `<xtyle-sparkline window="300000" variant="area" tone="info" label="Signal, last 5m"></xtyle-sparkline>
<script>
	const spark = document.querySelector("xtyle-sparkline");
	// irregular samples over real time: { at: epoch ms | ISO string, value }
	spark.points = history;
</script>`;

const timeSvelteExample = `<script lang="ts">
	import { Sparkline } from "@xtyle/svelte";
	// { at: epoch ms | ISO string, value }[]
	const history = readSignalHistory();
</script>

<Sparkline points={history} window={300000} variant="area" tone="info" label="Signal, last 5m" />`;

const timeAstroExample = `---
import { Sparkline } from "@xtyle/astro";
const history = readSignalHistory(); // { at: epoch ms | ISO string, value }[]
---

<Sparkline points={history} window={300000} variant="area" tone="info" label="Signal, last 5m" />`;

export const sparklineManifest: ComponentManifest = {
	id: "sparkline",
	name: "Sparkline",
	since: "0.3.0",
	category: "metrics",
	summary: "A tiny, word-sized trend line, area, or bar chart, single-tone and axis-free, for inline use or a live time-series.",
	description:
		"Sparkline draws a single series of numbers as a small, axis-free SVG that reads as a trend at a glance, sized to sit inline in a sentence, a table cell, or beside a `Stat`. Three shapes: a `line`, a filled `area`, or a mini `bar` run. Feed it evenly-spaced `values`, or switch to `points` (timestamped samples) for a real time-series: they map onto a sliding `window` (or an explicit `domain`), so irregular samples sit at their true position and slide left over real time. Add `step` to hold each value for an on/off signal. It takes one `tone` from the theme roster (any semantic role or named hue) and marks the latest point with an end dot. It's interactive: sweeping across it floats a marker and the value at the nearest point. Size it with the `--spark-width` and `--spark-height` custom properties; give it a `label` for an accessible name. Auto-ranged from the data, or pin `min` / `max` to share a baseline across a column of sparklines. An empty series shows a muted `No data` label instead of a blank box.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "sparkline",
			description: "The inline-block root sized by `--spark-width` / `--spark-height`, tinted by `--spark-color`.",
			selector: ".xtyle-sparkline",
			tokens: ["--accent"],
		},
		{
			name: "line",
			description: "The trend polyline (or the area's outline), stroked in the tone.",
			selector: ".xtyle-sparkline__line",
		},
		{
			name: "end",
			description: "The dot marking the most recent value.",
			selector: ".xtyle-sparkline__end",
			tokens: ["--bg-0"],
		},
		{
			name: "marker",
			description: "The hover guide, dot, and value tooltip shown while sweeping across the chart.",
			selector: ".xtyle-sparkline__marker",
			tokens: ["--line-2", "--surface-overlay", "--surface-overlay-border", "--elevation-3", "--fg-0"],
		},
	],
	props: [
		{
			name: "values",
			type: "number[]",
			description: "The data series, evenly spaced. JS property in html/svelte, a JSON or comma list attribute, or a prop in astro.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "points",
			type: "{ at: number | string; value: number }[]",
			description:
				"Time-windowed mode: timestamped samples (`at` is epoch ms or a date string) placed on a real time axis instead of even spacing, so irregular samples read at their true position and slide left over time. JS property in html/svelte, JSON attribute or prop in astro. Pair with `window` or `domain`; overrides `values` when set.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "window",
			type: "number",
			default: "300000",
			description: "The sliding time window in ms (default 5 minutes), ending at now; samples older than it drop off the left. Used only in `points` mode, and ignored when `domain` is set.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "domain",
			type: "[number | string, number | string]",
			description: "An explicit `[start, end]` time span (epoch ms or date strings) for the x-axis, instead of the sliding `window`. JSON attribute or prop.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "step",
			type: "boolean",
			default: "false",
			description: "Draws the line as a sample-and-hold step, so an on/off or discrete series reads as held levels rather than diagonal ramps.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "variant",
			type: "\"line\" | \"area\" | \"bar\"",
			default: "line",
			description: "The shape: a stroked line, a filled area under it, or a mini bar run.",
			bindings: ["html", "svelte", "astro"],
			options: ["line", "area", "bar"],
		},
		{
			name: "tone",
			type: "SparklineTone",
			default: "accent",
			description: "The single color, any semantic role (accent, success, danger, …) or named hue (red … black).",
			bindings: ["html", "svelte", "astro"],
			options: [...FULL_TONES],
		},
		{
			name: "showEnd",
			type: "boolean",
			default: "true",
			description: "Marks the latest point with a dot (line and area only). Kebab `show-end` on the element.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "min",
			type: "number",
			description: "Pin the low end of the range; omit to auto-range from the data. Share across a column for a common baseline.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "max",
			type: "number",
			description: "Pin the high end of the range; omit to auto-range from the data.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "label",
			type: "string",
			description: "An accessible name for the chart.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [
		{ name: "line", description: "A stroked trend line, the default.", className: "xtyle-sparkline--line" },
		{ name: "area", description: "The line with a soft fill down to the baseline.", className: "xtyle-sparkline--area" },
		{ name: "bar", description: "A run of tiny bars, one per value.", className: "xtyle-sparkline--bar" },
	],
	sizes: [],
	states: [
		{
			name: "hover",
			description: "Sweeping across the chart floats a guide, a dot at the nearest point, and its value.",
			selector: ".xtyle-sparkline__marker",
			tokens: ["--line-2"],
		},
	],
	slots: [],
	consumedTokens: [
		"--accent",
		"--bg-0",
		"--line-2",
		"--font-sans",
		"--text-xs",
		"--leading-normal",
		"--fg-0",
		"--fg-2",
		"--space-1",
		"--space-2",
		"--radius-md",
		"--surface-overlay",
		"--surface-overlay-border",
		"--elevation-3",
		"--border-thin",
		...FULL_TONES.map((t) => `--${t}` as const),
	],
	composition: [
		"Drop one beside a `Stat` value for a headline number with its recent trend, both in the Metrics family.",
		"Set `--spark-width` / `--spark-height` small to sit a sparkline inline in running text or a table cell.",
		"Pin the same `min` / `max` across a column of sparklines so their heights compare honestly.",
	],
	a11y: [
		"The SVG carries `role=\"img\"` and an `aria-label` (your `label`, or a value-count fallback), so it announces as a single image rather than a pile of shapes.",
		"Tone is chosen from the theme roster; pair a sparkline with a nearby number or `label` so meaning never rides on the trend shape or color alone.",
	],
	examples: [
		{
			id: "shapes",
			title: "Line, area, and bar",
			description: "The same series as a stroked line, a filled area, and a mini bar run, each in a different tone.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
		{
			id: "inline",
			title: "Inline in text",
			description: "Sized down with `--spark-width` / `--spark-height` to sit word-height in a sentence.",
			source: { html: inlineHtmlExample, svelte: inlineSvelteExample, astro: inlineAstroExample },
		},
		{
			id: "timeseries",
			title: "Time-windowed series",
			description: "`points` with timestamps on a sliding `window` place irregular samples at their true position over real time, so a live signal reads honestly instead of assuming even spacing. Add `step` for a held on/off series.",
			source: { html: timeHtmlExample, svelte: timeSvelteExample, astro: timeAstroExample },
		},
	],
};
