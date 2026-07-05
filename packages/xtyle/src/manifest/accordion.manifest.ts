import type { ComponentManifest } from "./types.js";

const htmlExample = `<xtyle-accordion>
	<span slot="header">Shipping</span>
	<div slot="panel">Orders ship within two business days.</div>
	<span slot="header" open>Returns</span>
	<div slot="panel">Unworn items are accepted within 30 days.</div>
	<span slot="header">Warranty</span>
	<div slot="panel">Covered against defects for one year.</div>
</xtyle-accordion>`;

const multipleExample = `<xtyle-accordion multiple size="sm">
	<span slot="header" open>Filters</span>
	<div slot="panel">In stock, on sale, free shipping.</div>
	<span slot="header" open>Sort</span>
	<div slot="panel">Price, rating, newest.</div>
	<span slot="header" disabled>Saved searches</span>
	<div slot="panel">Sign in to save a search.</div>
</xtyle-accordion>`;

const svelteExample = `<script lang="ts">
	import { Accordion } from "@xtyle/svelte";
</script>

<Accordion>
	<span slot="header">Shipping</span>
	<div slot="panel">Orders ship within two business days.</div>
	<span slot="header" open>Returns</span>
	<div slot="panel">Unworn items are accepted within 30 days.</div>
</Accordion>`;

const astroExample = `---
import { Accordion } from "@xtyle/astro";
---

<Accordion multiple>
	<span slot="header">Shipping</span>
	<div slot="panel">Orders ship within two business days.</div>
	<span slot="header" open>Returns</span>
	<div slot="panel">Unworn items are accepted within 30 days.</div>
</Accordion>`;

export const accordionManifest: ComponentManifest = {
	id: "accordion",
	name: "Accordion",
	category: "control",
	summary: "A stack of collapsible sections, one or many open at a time, driven by pointer or keyboard.",
	description:
		"Accordion stacks a set of disclosure sections that expand and collapse. Each section pairs a `[slot=\"header\"]` header with the `[slot=\"panel\"]` that follows it; the component wraps every header in a heading and a `role=\"button\"` trigger carrying `aria-expanded` and `aria-controls`, and turns each panel into a labelled `role=\"region\"` that hides when collapsed. By default it is single-open: opening one section closes the rest. `multiple` lets several stay open at once. Mark a header `open` to expand its section initially, or `disabled` to lock it. The heading level is `h3` by default and settable with `headingLevel`, and three sizes (`sm`, `md`, `lg`) scale the trigger density. A chevron rotates with the open state, and pointer, Enter/Space, and the arrow/Home/End keys all drive it.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "accordion",
			description: "The bordered container stacking the sections, with hairlines between them.",
			selector: ".xtyle-accordion",
			tokens: ["--font-sans", "--fg-0", "--bg-1", "--border-thin", "--line", "--radius-md"],
		},
		{
			name: "trigger",
			description: "The full-width header button that toggles its section; carries `aria-expanded` and the hover/press overlay.",
			selector: ".xtyle-accordion__trigger",
			tokens: [
				"--text-body",
				"--weight-medium",
				"--leading-tight",
				"--fg-0",
				"--space-3",
				"--space-4",
				"--state-hover",
				"--state-press",
				"--border-normal",
				"--border-thick",
				"--ring",
				"--fg-disabled",
				"--duration-fast",
				"--ease-standard",
			],
		},
		{
			name: "chevron",
			description: "The disclosure caret in the trigger corner; rotates 180° when the section is open.",
			selector: ".xtyle-accordion__chevron",
			tokens: ["--fg-2", "--duration-fast", "--ease-standard"],
		},
		{
			name: "panel",
			description: "The collapsible `role=\"region\"` holding the section content; `hidden` when collapsed.",
			selector: ".xtyle-accordion__panel",
			tokens: ["--fg-1", "--space-1", "--space-4", "--text-body", "--leading-normal"],
		},
	],
	props: [
		{ name: "multiple", type: "boolean", default: "false", description: "Allows several sections to stay open at once; when off, opening one closes the others.", bindings: ["html", "svelte", "astro"] },
		{ name: "size", type: "Size", default: "md", description: "Trigger density: `sm`, `md`, or `lg`.", bindings: ["html", "svelte", "astro"], options: ["sm", "md", "lg"] },
		{ name: "headingLevel", type: "2 | 3 | 4 | 5 | 6", default: "3", description: "The heading level wrapping each trigger, so the accordion sits correctly in the document outline.", bindings: ["html", "svelte", "astro"] },
	],
	variants: [],
	sizes: [
		{ name: "sm", description: "Compact triggers.", className: "xtyle-accordion--sm" },
		{ name: "md", description: "Default.", className: "xtyle-accordion", isDefault: true },
		{ name: "lg", description: "Roomy triggers.", className: "xtyle-accordion--lg" },
	],
	states: [
		{
			name: "open",
			description: "An expanded section: the trigger reads `aria-expanded=\"true\"` and the chevron rotates.",
			selector: ".xtyle-accordion__trigger[aria-expanded=\"true\"]",
			tokens: [],
		},
		{
			name: "trigger-hover",
			description: "Pointer over a header: the hover tint paints behind it.",
			selector: ".xtyle-accordion__trigger:hover",
			tokens: ["--state-hover"],
		},
		{
			name: "trigger-focus-visible",
			description: "Keyboard focus on a header: an inset token ring plus the transparent outline promoted in forced-colors mode.",
			selector: ".xtyle-accordion__trigger:focus-visible",
			tokens: ["--border-normal", "--border-thick", "--ring"],
		},
		{
			name: "disabled",
			description: "A locked header: muted and non-interactive.",
			selector: ".xtyle-accordion__trigger:disabled",
			tokens: ["--fg-disabled"],
		},
	],
	slots: [
		{
			name: "header",
			description: "Each section's header label, marked `slot=\"header\"`; add `open` to expand it initially or `disabled` to lock it.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "panel",
			description: "Each section's collapsible content, marked `slot=\"panel\"`, paired to the header before it by order.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	consumedTokens: [
		"--font-sans",
		"--fg-0",
		"--fg-1",
		"--fg-2",
		"--fg-disabled",
		"--bg-1",
		"--line",
		"--border-thin",
		"--border-normal",
		"--border-thick",
		"--radius-md",
		"--ring",
		"--text-body",
		"--text-sm",
		"--text-lg",
		"--weight-medium",
		"--leading-tight",
		"--leading-normal",
		"--space-1",
		"--space-2",
		"--space-3",
		"--space-4",
		"--space-5",
		"--state-hover",
		"--state-press",
		"--duration-fast",
		"--ease-standard",
	],
	composition: [
		"Pair headers and panels in order (a `[slot=\"header\"]` followed by its `[slot=\"panel\"]`) and repeat for each section.",
		"Leave `multiple` off for an FAQ where one answer shows at a time; turn it on for independent filter or settings groups.",
		"For a small fixed set of mutually exclusive views with their own content area, reach for Tabs instead.",
	],
	a11y: [
		"Each header is a real `<button>` wrapped in a heading (`h3` by default, set with `headingLevel`) so the sections land in the document outline and screen-reader rotor.",
		"The trigger carries `aria-expanded` and `aria-controls`; its panel is a `role=\"region\"` wired back with `aria-labelledby`, and `hidden` collapses it from the accessibility tree.",
		"Pointer, Enter, and Space toggle a section; Up/Down arrows move focus between headers and Home/End jump to the first and last.",
		"A header marked `disabled` is skipped by the arrow keys and cannot toggle.",
		"Focus on a header shows an inset token ring plus a transparent outline the forced-colors base rule promotes to a real system outline.",
	],
	examples: [
		{
			id: "single-open-faq",
			title: "Single-open FAQ",
			description: "Three sections where opening one collapses the others; the second starts open.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
		{
			id: "multiple-open",
			title: "Multiple open, with a disabled section",
			description: "A compact accordion that lets several panels stay open, with one locked header.",
			source: { html: multipleExample, svelte: svelteExample, astro: astroExample },
		},
	],
};
