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

const boundsHtmlExample = `<!-- A percent series pins to [0, 100] so 40% reads as 40% of full height -->
<xtyle-sparkline values="38,41,52,49,63,58,71" bounds="percent" tone="info" label="CPU %"></xtyle-sparkline>

<!-- A duration series caps at a rolling power of two, so one spike lifts the ceiling
     instead of squashing the baseline -->
<xtyle-sparkline values="120,90,140,110,760,130,150" bounds="duration" tone="warn" label="Latency ms"></xtyle-sparkline>`;

const boundsSvelteExample = `<script lang="ts">
	import { Sparkline } from "@xtyle/svelte";
</script>

<Sparkline values={cpu} bounds="percent" tone="info" label="CPU %" />
<Sparkline values={latency} bounds="duration" tone="warn" label="Latency ms" />`;

const occupancyHtmlExample = `<!-- A bool/occupancy series: "on" samples read as solid blocks, "off" as gaps -->
<xtyle-sparkline values="1,1,0,1,1,1,0,0,1,1" variant="occupancy" bounds="unit" tone="success" label="Uptime"></xtyle-sparkline>`;

const occupancySvelteExample = `<script lang="ts">
	import { Sparkline } from "@xtyle/svelte";
	// 1 = up, 0 = down
	const uptime = [1, 1, 0, 1, 1, 1, 0, 0, 1, 1];
</script>

<Sparkline values={uptime} variant="occupancy" bounds="unit" tone="success" label="Uptime" />`;

export const sparklineManifest: ComponentManifest = {
	id: "sparkline",
	name: "Sparkline",
	since: "0.3.0",
	category: "metrics",
	keywords: ["mini chart", "trend line", "inline chart", "time series", "micro chart"],
	seeAlso: ["stat", "bar", "heatmap"],
	summary: "A tiny, word-sized trend line, area, bar, or occupancy chart, single-tone and axis-free, for inline use or a live time-series.",
	description:
		"Sparkline draws a single series of numbers as a small, axis-free SVG that reads as a trend at a glance, sized to sit inline in a sentence, a table cell, or beside a `Stat`. Four shapes: a `line`, a filled `area`, a mini `bar` run, or an `occupancy` strip that fills each \"on\" sample of a bool/binary series as a solid block (uptime, presence, connection state) rather than drawing a 0/1 line. Feed it evenly-spaced `values`, or switch to `points` (timestamped samples) for a real time-series: they map onto a sliding `window` (or an explicit `domain`), so irregular samples sit at their true position and slide left over real time. Add `step` to hold each value for an on/off signal. It takes one `tone` from the theme roster (any semantic role or named hue) and marks the latest point with an end dot. It's interactive: sweeping across it floats a marker and the value at the nearest point. Size it with the `--spark-width` and `--spark-height` custom properties; give it a `label` for an accessible name. Auto-ranged from the data, pinned with `min` / `max`, or ranged by kind with `bounds`: `percent` locks `[0, 100]`, `unit` locks `[0, 1]`, and `duration` caps at a rolling power of two so a latency spike lifts the ceiling instead of squashing the baseline — the per-kind range every consumer of a typed metric would otherwise re-derive by hand. An empty series shows a muted `No data` label instead of a blank box.",
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
			name: "occupancy-track",
			description: "The faint full-width rail behind an `occupancy` strip that shows the empty (off) slots.",
			selector: ".xtyle-sparkline__track",
			tokens: ["--line"],
		},
		{
			name: "occupancy-block",
			description: "A filled block for each \"on\" sample of an `occupancy` strip, in the tone.",
			selector: ".xtyle-sparkline__block",
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
			type: "\"line\" | \"area\" | \"bar\" | \"occupancy\"",
			default: "line",
			description: "The shape: a stroked line, a filled area under it, a mini bar run, or an `occupancy` strip that fills each \"on\" sample of a bool series as a solid block. Pair `occupancy` with `bounds=\"unit\"` for a clean 0/1 threshold.",
			bindings: ["html", "svelte", "astro"],
			options: ["line", "area", "bar", "occupancy"],
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
			name: "bounds",
			type: "\"percent\" | \"unit\" | \"duration\"",
			description:
				"Kind-aware auto y-bounds for a typed metric, so you don't re-derive the same range at every call site. `percent` → `[0, 100]`; `unit` → `[0, 1]` (a fraction or bool); `duration` → `[0, rolling power-of-two cap]` so a spike lifts the ceiling instead of squashing the baseline. An explicit `min`/`max` overrides it.",
			bindings: ["html", "svelte", "astro"],
			options: ["percent", "unit", "duration"],
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
		{
			name: "occupancy",
			description: "A filled block per \"on\" sample of a bool/binary series over a faint track — the on/off reading a step line can't give.",
			className: "xtyle-sparkline--occupancy",
			tokens: ["--line"],
		},
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
		"--line",
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
		{
			id: "kind-bounds",
			title: "Kind-aware bounds",
			description: "`bounds` ranges a typed metric without hand-math: `percent` pins `[0, 100]`, `unit` pins `[0, 1]`, and `duration` caps at a rolling power of two so a spike lifts the ceiling rather than flattening everything else.",
			source: { html: boundsHtmlExample, svelte: boundsSvelteExample },
		},
		{
			id: "occupancy",
			title: "Occupancy strip for a bool series",
			description: "`variant=\"occupancy\"` fills each \"on\" sample as a solid block over a faint track — the uptime/presence/connection reading a 0/1 step line can't give. Pair with `bounds=\"unit\"`.",
			source: { html: occupancyHtmlExample, svelte: occupancySvelteExample },
		},
	],
};
