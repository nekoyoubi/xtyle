import type { ComponentManifest } from "./types.js";

const htmlExample = `<xoji-stat label="Monthly revenue" delta="+12.5%" trend="up" caption="vs. last month">$48,250</xoji-stat>

<xoji-stat label="Active themes" delta="-3" trend="down">1,204</xoji-stat>

<xoji-stat label="Token coverage" size="lg" align="center">57 / 57</xoji-stat>

<xoji-stat label="components" delta="+1" trend="up" inline>49</xoji-stat>`;

const svelteExample = `<script lang="ts">
	import { Stat } from "@xoji/svelte";
</script>

<Stat label="Monthly revenue" delta="+12.5%" trend="up" caption="vs. last month">$48,250</Stat>

<Stat label="Active themes" delta="-3" trend="down">1,204</Stat>

<Stat label="Token coverage" size="lg" align="center">57 / 57</Stat>

<Stat label="components" delta="+1" trend="up" inline>49</Stat>`;

const astroExample = `---
import { Stat } from "@xoji/astro";
---

<Stat label="Monthly revenue" delta="+12.5%" trend="up" caption="vs. last month">$48,250</Stat>

<Stat label="Active themes" delta="-3" trend="down">1,204</Stat>

<Stat label="Token coverage" size="lg" align="center">57 / 57</Stat>

<Stat label="components" delta="+1" trend="up" inline>49</Stat>`;

export const statManifest: ComponentManifest = {
	id: "stat",
	name: "Stat",
	category: "data-display",
	summary: "A single metric: a prominent value with its label, optional trend delta, and caption.",
	description:
		"Stat presents one figure at a glance: a large `value` (the default slot) under a small uppercase `label`, with an optional `delta` carrying a `trend` (up / down / flat) and an optional `caption` for context. The value and delta render in tabular figures so columns of stats align digit-for-digit. The trend tints the delta (success for up, danger for down, neutral for flat) and pairs the color with a directional arrow so meaning never rides on color alone. Pure presentation: compose several in a `Grid` or `Cluster` for a dashboard strip, or drop one into a `Card` header.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "stat",
			description: "The flex-column root carrying the alignment and size classes.",
			selector: ".xoji-stat",
			tokens: ["--font-sans", "--space-1"],
		},
		{
			name: "label",
			description: "The metric name: small, uppercase, and muted, rendered above the value via flex order.",
			selector: ".xoji-stat__label",
			tokens: ["--text-xs", "--weight-semibold", "--leading-normal", "--fg-2"],
		},
		{
			name: "value",
			description: "The headline figure: display font, bold, tabular, in the primary ink.",
			selector: ".xoji-stat__value",
			tokens: ["--font-display", "--text-xl", "--text-2xl", "--text-3xl", "--weight-bold", "--leading-tight", "--fg-0"],
		},
		{
			name: "delta",
			description: "The optional change indicator with a directional arrow, tinted by trend.",
			selector: ".xoji-stat__delta",
			tokens: ["--text-sm", "--weight-semibold", "--space-1", "--neutral-text", "--success-text", "--danger-text"],
		},
		{
			name: "caption",
			description: "An optional subtle line of context below the value.",
			selector: ".xoji-stat__caption",
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
			description: "Colors the delta and picks its arrow: success/up, danger/down, neutral/flat.",
			bindings: ["html", "svelte", "astro"],
			options: ["up", "down", "flat"],
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
		{ name: "sm", description: "Compact value.", className: "xoji-stat--sm" },
		{ name: "md", description: "Default.", className: "xoji-stat", isDefault: true },
		{ name: "lg", description: "Large display value.", className: "xoji-stat--lg" },
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
	],
};
