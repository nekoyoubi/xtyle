import type { ComponentManifest } from "./types.js";

const htmlExample = `<xtyle-stat label="Monthly revenue" delta="+12.5%" trend="up" caption="vs. last month">$48,250</xtyle-stat>

<xtyle-stat label="Active themes" delta="-3" trend="down">1,204</xtyle-stat>

<xtyle-stat label="Token coverage" size="lg" align="center">57 / 57</xtyle-stat>

<xtyle-stat label="components" delta="+1" trend="up" inline>49</xtyle-stat>`;

const svelteExample = `<script lang="ts">
	import { Stat } from "@xtyle/svelte";
</script>

<Stat label="Monthly revenue" delta="+12.5%" trend="up" caption="vs. last month">$48,250</Stat>

<Stat label="Active themes" delta="-3" trend="down">1,204</Stat>

<Stat label="Token coverage" size="lg" align="center">57 / 57</Stat>

<Stat label="components" delta="+1" trend="up" inline>49</Stat>`;

const astroExample = `---
import { Stat } from "@xtyle/astro";
---

<Stat label="Monthly revenue" delta="+12.5%" trend="up" caption="vs. last month">$48,250</Stat>

<Stat label="Active themes" delta="-3" trend="down">1,204</Stat>

<Stat label="Token coverage" size="lg" align="center">57 / 57</Stat>

<Stat label="components" delta="+1" trend="up" inline>49</Stat>`;

const sentimentExample = `<!-- Up is bad: a rising error rate arrows up but paints red. -->
<xtyle-stat label="Error rate" delta="+2.1%" trend="up" sentiment="negative" caption="last hour">4.8%</xtyle-stat>

<!-- Down is good: latency falling arrows down and paints green. -->
<xtyle-stat label="p95 latency" delta="-18ms" trend="down" sentiment="positive">142ms</xtyle-stat>

<!-- Directional but neutral: a run-count delta shows the arrow in a muted tint, no good/bad. -->
<xtyle-stat label="Runs" delta="-8%" trend="down" sentiment="neutral" caption="24h">312</xtyle-stat>`;

export const statManifest: ComponentManifest = {
	id: "stat",
	name: "Stat",
	category: "metrics",
	since: "0.1.0",
	keywords: ["metric", "kpi", "number", "figure", "trend", "delta", "big number"],
	seeAlso: ["sparkline", "bar", "badge"],
	summary: "A single metric: a prominent value with its label, optional trend delta, and caption.",
	description:
		"Stat presents one figure at a glance: a large `value` (the default slot) under a small uppercase `label`, with an optional `delta` carrying a `trend` (up / down / flat) and an optional `caption` for context. The value and delta render in tabular figures so columns of stats align digit-for-digit. `trend` picks the delta's directional arrow; a separate `sentiment` (positive / negative / neutral) picks its color and defaults to the trend's own reading (up→positive/green, down→negative/red, flat→neutral). Splitting the axes lets an up-is-bad metric (a rising error rate) paint red on an up-arrow, or a sentiment-neutral metric show a direction in a muted tint, while the color is always paired with the arrow so meaning never rides on color alone. Pure presentation: compose several in a `Grid` or `Cluster` for a dashboard strip, or drop one into a `Card` header.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "stat",
			description: "The flex-column root carrying the alignment and size classes.",
			selector: ".xtyle-stat",
			tokens: ["--font-sans", "--space-1"],
		},
		{
			name: "label",
			description: "The metric name: small, uppercase, and muted, rendered above the value via flex order.",
			selector: ".xtyle-stat__label",
			tokens: ["--text-xs", "--weight-semibold", "--leading-normal", "--fg-2"],
		},
		{
			name: "value",
			description: "The headline figure: display font, bold, tabular, in the primary ink.",
			selector: ".xtyle-stat__value",
			tokens: ["--font-display", "--text-xl", "--text-2xl", "--text-3xl", "--weight-bold", "--leading-tight", "--fg-0"],
		},
		{
			name: "delta",
			description: "The optional change indicator: a directional arrow (from `trend`) over a base `--neutral-text`, tinted by `sentiment` (positive `--success-vivid`, negative `--danger-vivid`, neutral `--neutral-vivid`).",
			selector: ".xtyle-stat__delta",
			tokens: ["--text-sm", "--weight-semibold", "--space-1", "--neutral-text", "--neutral-vivid", "--success-vivid", "--danger-vivid"],
		},
		{
			name: "caption",
			description: "An optional subtle line of context below the value.",
			selector: ".xtyle-stat__caption",
			tokens: ["--text-xs", "--leading-normal", "--fg-3"],
		},
	],
	props: [
		{
			name: "label",
			type: "string",
			description: "The metric name rendered above the value.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "delta",
			type: "string",
			description: "An optional change indicator (e.g. `+12.5%`) rendered below the value with a trend arrow.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "trend",
			type: "StatTrend",
			default: "flat",
			description: "Picks the delta's directional arrow (▲ up, ▼ down, a flat bar). Also the default color, via `sentiment`.",
			bindings: ["html", "svelte", "astro"],
			options: ["up", "down", "flat"],
		},
		{
			name: "sentiment",
			type: "StatSentiment",
			description: "Colors the delta independently of its arrow: positive (`--success-vivid`), negative (`--danger-vivid`), neutral (`--neutral-vivid`). Omit to derive from `trend` (up→positive, down→negative, flat→neutral), so an up-is-bad metric sets `trend=\"up\" sentiment=\"negative\"` and a directional-but-neutral one sets `sentiment=\"neutral\"`.",
			bindings: ["html", "svelte", "astro"],
			options: ["positive", "negative", "neutral"],
		},
		{
			name: "caption",
			type: "string",
			description: "An optional subtle line of context below the value.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "size",
			type: "Size",
			default: "md",
			description: "Scales the value (`sm` → `xl`, `md` → `2xl`, `lg` → `3xl`).",
			bindings: ["html", "svelte", "astro"],
			options: ["sm", "md", "lg"],
		},
		{
			name: "align",
			type: "StatAlign",
			default: "start",
			description: "Block alignment of the stat's contents.",
			bindings: ["html", "svelte", "astro"],
			options: ["start", "center"],
		},
		{
			name: "inline",
			type: "boolean",
			default: "false",
			description:
				"Lays the stat out horizontally (label, value, and trend delta on one baseline, like a ticker) for a status strip or a dense row instead of a dashboard tile.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [],
	sizes: [
		{ name: "sm", description: "Compact value.", className: "xtyle-stat--sm" },
		{ name: "md", description: "Default.", className: "xtyle-stat", isDefault: true },
		{ name: "lg", description: "Large display value.", className: "xtyle-stat--lg" },
	],
	states: [],
	slots: [
		{
			name: "default",
			description: "The metric value.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	consumedTokens: [
		"--font-sans",
		"--font-display",
		"--text-xs",
		"--text-sm",
		"--text-xl",
		"--text-2xl",
		"--text-3xl",
		"--weight-semibold",
		"--weight-bold",
		"--leading-tight",
		"--leading-normal",
		"--fg-0",
		"--fg-2",
		"--fg-3",
		"--neutral-text",
		"--success-vivid",
		"--danger-vivid",
		"--neutral-vivid",
		"--space-1",
		"--space-2",
	],
	composition: [
		"Lay several in a `Grid` or `Cluster` for a dashboard strip; the tabular figures keep the values aligned.",
		"Drop one into a `Card` to head a panel with its key number.",
		"Pair the `delta` + `trend` with period-over-period figures; the arrow carries direction without relying on color.",
		"For a metric where up is bad (error rate, latency, queue depth) set `trend=\"up\" sentiment=\"negative\"`; for a direction that carries no good/bad meaning set `sentiment=\"neutral\"` to keep the arrow but drop the green/red.",
	],
	a11y: [
		"The trend pairs its color with a directional arrow (▲ up, ▼ down, a flat bar for no change), so the change reads without color perception (WCAG 1.4.1).",
		"The arrow glyph is a decorative `aria-hidden` SVG; the delta's meaning comes from its text.",
		"Order is visual only; the label sits above the value via flex `order`, while the DOM keeps value-then-label, so a screen reader reads the figure first.",
	],
	examples: [
		{
			id: "metrics-trends-and-sizes",
			title: "Metrics, trends, and sizes",
			description: "A value under its label, with optional trend deltas and captions, across the three sizes and both alignments, plus the `inline` ticker layout that lays label, value, and delta on one line.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
		{
			id: "direction-vs-sentiment",
			title: "Direction vs. sentiment",
			description: "`sentiment` colors the delta independently of the `trend` arrow: an up-is-bad error rate arrows up but reads red, a falling latency arrows down but reads green, and a neutral run-count keeps the arrow without a good/bad tint.",
			source: { html: sentimentExample },
		},
	],
};
