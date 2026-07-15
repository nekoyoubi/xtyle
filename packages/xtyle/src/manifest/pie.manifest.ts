import type { ComponentManifest } from "./types.js";
import { PALETTES } from "../series.js";

const htmlExample = `<xtyle-pie label="Traffic by source"></xtyle-pie>
<script>
	document.querySelector("xtyle-pie").data = [
		{ label: "Direct", value: 42 },
		{ label: "Search", value: 30 },
		{ label: "Social", value: 18 },
		{ label: "Referral", value: 10 },
	];
</script>`;

const svelteExample = `<script lang="ts">
	import { Pie } from "@xtyle/svelte";

	const data = [
		{ label: "Direct", value: 42 },
		{ label: "Search", value: 30 },
		{ label: "Social", value: 18 },
		{ label: "Referral", value: 10 },
	];
</script>

<Pie {data} label="Traffic by source" />`;

const astroExample = `---
import { Pie } from "@xtyle/astro";
const data = [
	{ label: "Direct", value: 42 },
	{ label: "Search", value: 30 },
	{ label: "Social", value: 18 },
	{ label: "Referral", value: 10 },
];
---

<Pie data={data} label="Traffic by source" />`;

const donutHtmlExample = `<xtyle-pie variant="donut" scheme="accents" label="Budget"></xtyle-pie>
<script>
	document.querySelector("xtyle-pie").data = [
		{ label: "Rent", value: 1200 },
		{ label: "Food", value: 600 },
		{ label: "Transit", value: 300 },
		{ label: "Fun", value: 400 },
	];
</script>`;

const donutSvelteExample = `<script lang="ts">
	import { Pie } from "@xtyle/svelte";

	const data = [
		{ label: "Rent", value: 1200 },
		{ label: "Food", value: 600 },
		{ label: "Transit", value: 300 },
		{ label: "Fun", value: 400 },
	];
</script>

<Pie {data} variant="donut" scheme="accents" label="Budget" />`;

const donutAstroExample = `---
import { Pie } from "@xtyle/astro";
const data = [
	{ label: "Rent", value: 1200 },
	{ label: "Food", value: 600 },
	{ label: "Transit", value: 300 },
	{ label: "Fun", value: 400 },
];
---

<Pie data={data} variant="donut" scheme="accents" label="Budget" />`;

const outcomeHtmlExample = `<xtyle-pie variant="donut" scheme="statuses" label="Runs"></xtyle-pie>
<script>
	// Give each slice a semantic \`tone\` so it colors by meaning: a run where nothing
	// failed drops the failed slice without shifting the others' colors.
	document.querySelector("xtyle-pie").data = [
		{ label: "Passed", value: 128, tone: "success" },
		{ label: "Failed", value: 14, tone: "failed" },
		{ label: "Flaky", value: 9, tone: "warn" },
		{ label: "Skipped", value: 21, tone: "skipped" },
		{ label: "Running", value: 6, tone: "live" },
		{ label: "Queued", value: 11, tone: "info" },
	];
</script>`;

const outcomeSvelteExample = `<script lang="ts">
	import { Pie } from "@xtyle/svelte";

	// A semantic \`tone\` per slice colors by meaning, stable even if a category is absent.
	const data = [
		{ label: "Passed", value: 128, tone: "success" },
		{ label: "Failed", value: 14, tone: "failed" },
		{ label: "Flaky", value: 9, tone: "warn" },
		{ label: "Skipped", value: 21, tone: "skipped" },
		{ label: "Running", value: 6, tone: "live" },
		{ label: "Queued", value: 11, tone: "info" },
	];
</script>

<Pie {data} variant="donut" scheme="statuses" label="Runs" />`;

const outcomeAstroExample = `---
import { Pie } from "@xtyle/astro";
// A semantic \`tone\` per slice colors by meaning, stable even if a category is absent.
const data = [
	{ label: "Passed", value: 128, tone: "success" },
	{ label: "Failed", value: 14, tone: "failed" },
	{ label: "Flaky", value: 9, tone: "warn" },
	{ label: "Skipped", value: 21, tone: "skipped" },
	{ label: "Running", value: 6, tone: "live" },
	{ label: "Queued", value: 11, tone: "info" },
];
---

<Pie data={data} variant="donut" scheme="statuses" label="Runs" />`;

export const pieManifest: ComponentManifest = {
	id: "pie",
	name: "Pie",
	since: "0.3.0",
	category: "metrics",
	keywords: ["pie chart", "donut", "doughnut", "parts of a whole", "share", "distribution"],
	seeAlso: ["bar", "sparkline", "stat"],
	summary: "A pie or donut chart of parts against a whole, colored from a theme-derived palette, with an interactive readout.",
	description:
		"Pie plots a set of labelled values as wedges of a circle, each a share of the whole. Each slice takes its color from a `scheme` resolved off the live theme (`skittles` by default, so the parts read as distinct), or pass explicit colors and `reverse`. Set `variant=\"donut\"` for a ring with the total in its center. It's interactive: hovering or focusing a slice dims the rest and floats its value and share, and the chart is mirrored into a visually-hidden table so assistive tech reads the numbers. A legend names each slice; optional `showValues` prints the percentage on each wedge. Size it with `size`; zero and negative values drop out, and a chart with nothing left to plot shows a muted `No data` message in place of the wedges.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "chart",
			description: "The `<figure>` root holding the SVG, legend, tooltip, and the accessible data table.",
			selector: ".xtyle-pie",
			tokens: ["--font-sans"],
		},
		{
			name: "slice",
			description: "One wedge, filled with its palette color and separated by a hairline; the focus/hover target.",
			selector: ".xtyle-pie__slice",
			tokens: ["--bg-1", "--ring", "--border-thick", "--duration-fast", "--ease-standard"],
		},
		{
			name: "center",
			description: "The donut's center total.",
			selector: ".xtyle-pie__center",
			tokens: ["--fg-0", "--text-lg", "--weight-bold"],
		},
		{
			name: "legend",
			description: "The slice key; each item pairs a color dot with the slice label.",
			selector: ".xtyle-pie__legend",
			tokens: ["--fg-1", "--text-sm", "--space-1", "--space-3", "--radius-sm"],
		},
		{
			name: "tooltip",
			description: "The floating value/share readout shown on hover or focus of a slice; it holds one row per slice and reveals the one under the cursor.",
			selector: ".xtyle-pie__tooltip",
			tokens: ["--surface-overlay", "--surface-overlay-border", "--elevation-3", "--radius-md", "--fg-0"],
		},
		{
			name: "tooltip-row",
			description: "One slice's readout line, pairing its label with its value and share. The fill draws every row up front and the element only unhides the hovered one, so a mod's reshaped row (a swatch, a unit, its own order) survives the hover.",
			selector: ".xtyle-pie__tooltip-row",
			tokens: ["--fg-2", "--text-sm", "--weight-semibold"],
		},
	],
	props: [
		{
			name: "data",
			type: "{ label: string; value: number; tone?: StatusTone }[]",
			description:
				"The slices: a label and a value each. JS property in html/svelte, JSON attribute or prop in astro. Zero and negative values drop out. Under `scheme=\"statuses\"`, an optional `tone` (`success` / `failed` / `warn` / `info` / `skipped` / `live`) colors a slice by meaning, so a dropped zero-value category never shifts the rest.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "variant",
			type: "\"pie\" | \"donut\"",
			default: "pie",
			description: "A full pie, or a `donut` ring with the total in its center.",
			bindings: ["html", "svelte", "astro"],
			options: ["pie", "donut"],
		},
		{
			name: "scheme",
			type: "Palette | string[]",
			default: "skittles",
			description: "How slices are colored: a built-in palette sampled off the theme, or an explicit color array.",
			bindings: ["html", "svelte", "astro"],
			options: [...PALETTES],
		},
		{
			name: "reverse",
			type: "boolean",
			default: "false",
			description: "Flips the scheme end for end.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "showValues",
			type: "boolean",
			default: "false",
			description: "Prints each slice's percentage on the wedge (slices under 5% are skipped for legibility). Kebab `show-values`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "legend",
			type: "boolean",
			default: "true",
			description: "Shows the slice legend; set false to hide it.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "size",
			type: "number",
			default: "200",
			description: "The chart diameter in pixels.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "label",
			type: "string",
			description: "An accessible name for the chart, used as the data table's caption.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [
		{ name: "pie", description: "A full pie of solid wedges.", className: "xtyle-pie" },
		{ name: "donut", description: "A ring with the total in its center.", className: "xtyle-pie--donut" },
	],
	sizes: [],
	states: [
		{
			name: "slice-hover",
			description: "Pointer over or keyboard focus on a slice: the rest dim and a value/share readout floats above it.",
			selector: ".xtyle-pie--hovering .xtyle-pie__slice:not(.is-active)",
			tokens: ["--duration-fast", "--ease-standard"],
		},
		{
			name: "slice-focus",
			description: "Keyboard focus on a slice draws a token ring; each slice is a tab stop announcing its label, value, and share.",
			selector: ".xtyle-pie__slice:focus-visible",
			tokens: ["--ring", "--border-thick"],
		},
	],
	slots: [],
	consumedTokens: [
		"--font-sans",
		"--bg-0",
		"--bg-1",
		"--fg-0",
		"--fg-1",
		"--fg-2",
		"--text-xs",
		"--text-sm",
		"--text-lg",
		"--weight-semibold",
		"--weight-bold",
		"--duration-fast",
		"--ease-standard",
		"--ring",
		"--border-thick",
		"--border-thin",
		"--leading-normal",
		"--space-1",
		"--space-2",
		"--space-3",
		"--radius-sm",
		"--radius-md",
		"--surface-overlay",
		"--surface-overlay-border",
		"--elevation-3",
	],
	composition: [
		"Colors come from the theme register, so the slices match the surrounding UI. `skittles` (the default) keeps the parts distinct; `statuses` pins each slice to a semantic tone (success, failed, warn, info, skipped, live) for discrete-outcome charts, distinct from `severity`, the good-to-bad gradient; pass an explicit array to pin brand colors, and a `var(--token)` string in that array lands straight in the fill and resolves against the theme.",
		"Under `statuses`, give each slice an explicit `tone` when a category can be absent: without one, colors are assigned by position, so a run where nothing failed drops the failed slice and shifts every survivor to the wrong tone. A `tone` pins each slice to its meaning regardless of which categories are present.",
		"Reach for a `donut` when you want a headline total in the middle; a full `pie` when the parts are the whole story.",
		"Pair with a `Stat` or a `Bar` in the Metrics family for a composition-plus-trend view.",
	],
	a11y: [
		"Each slice carries `role=\"img\"` and an `aria-label` naming its label, value, and share, and is a focusable tab stop, so the chart is navigable by keyboard.",
		"The full breakdown is mirrored into a visually-hidden `<table>` (label, value, share), and the legend names every slice in text, so meaning never rides on color alone.",
	],
	examples: [
		{
			id: "pie",
			title: "Pie",
			description: "Four sources as shares of the whole, colored from the `skittles` scheme.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
		{
			id: "donut",
			title: "Donut",
			description: "`variant=\"donut\"` opens the center for the total; here on the `accents` scheme.",
			source: { html: donutHtmlExample, svelte: donutSvelteExample, astro: donutAstroExample },
		},
		{
			id: "statuses",
			title: "Discrete outcomes",
			description: "`scheme=\"statuses\"` colors each slice by a semantic `tone` (success, failed, warn, info, skipped, live) so a run-outcome chart reads by meaning, and stays right even when a category is absent.",
			source: { html: outcomeHtmlExample, svelte: outcomeSvelteExample, astro: outcomeAstroExample },
		},
	],
};
