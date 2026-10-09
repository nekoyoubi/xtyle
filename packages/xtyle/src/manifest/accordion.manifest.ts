import type { ComponentManifest } from "./types.js";

const htmlExample = `<xtyle-accordion>
	<span slot="header">Shipping</span>
	<div slot="panel">Orders ship within two business days.</div>
	<span slot="header" open>Returns</span>
	<div slot="panel">Unworn items are accepted within 30 days.</div>
	<span slot="header">Warranty</span>
	<div slot="panel">Covered against defects for one year.</div>
</xtyle-accordion>`;

const markerHtmlExample = `<xtyle-accordion chevron-icon="plus">
	<span slot="header">What is a marker glyph?</span>
	<div slot="panel">Any name the icon roster can draw.</div>
	<span slot="header">Can a mod add one?</span>
	<div slot="panel">Yes, by filling the <code>xtyle.icons</code> slot.</div>
</xtyle-accordion>`;

const markerSvelteExample = `<script lang="ts">
	import { Accordion } from "@xtyle/svelte";

	const sections = [{ value: "marker", header: "What is a marker glyph?" }];
</script>

<Accordion chevronIcon="plus" {sections}>
	{#snippet panel()}Any name the icon roster can draw.{/snippet}
</Accordion>`;

const markerAstroExample = `---
import Accordion from "@xtyle/astro/Accordion.astro";
---

<Accordion chevronIcon="plus">
	<span data-xtyle-header>What is a marker glyph?</span>
	<div data-xtyle-panel>Any name the icon roster can draw.</div>
</Accordion>`;

const itemsHtmlExample = `<xtyle-accordion items='[
	{ "value": "shipping", "header": "Shipping", "panel": "Orders ship within two business days." },
	{ "value": "returns", "header": "Returns", "panel": "Unworn items are accepted within 30 days.", "open": true }
]'></xtyle-accordion>`;

const itemsAstroExample = `---
import Accordion from "@xtyle/astro/Accordion.astro";

const sections = [
	{ value: "shipping", header: "Shipping", panel: "Orders ship within two business days." },
	{ value: "returns", header: "Returns", panel: "Unworn items are accepted within 30 days.", open: true },
];
---

<Accordion items={sections} />`;

const actionsHtmlExample = `<xtyle-accordion multiple>
	<span slot="header" value="outcomes" open>Outcomes</span>
	<span slot="actions">
		<xtyle-segmented size="sm" options="Rows,Chart" value="Rows" aria-label="Outcome view"></xtyle-segmented>
	</span>
	<div slot="panel">Each run's result, newest first.</div>
	<span slot="header" value="roster">Roster</span>
	<span slot="actions">
		<xtyle-button variant="ghost" tone="neutral" size="sm" icon-only aria-label="Move Roster up">
			<xtyle-icon slot="icon-start" name="chevron-up"></xtyle-icon>
		</xtyle-button>
	</span>
	<div slot="panel">Who is on shift, as chips.</div>
</xtyle-accordion>`;

const actionsSvelteExample = `<script lang="ts">
	import { Accordion, Button, Icon } from "@xtyle/svelte";

	let sections = $state([
		{ value: "outcomes", header: "Outcomes", open: true },
		{ value: "roster", header: "Roster" },
		{ value: "notes", header: "Notes" },
	]);

	function move(value: string, by: -1 | 1) {
		const from = sections.findIndex((s) => s.value === value);
		const to = from + by;
		if (to < 0 || to >= sections.length) return;
		const next = [...sections];
		[next[from], next[to]] = [next[to], next[from]];
		sections = next;
	}
</script>

<Accordion multiple {sections}>
	{#snippet actions(value)}
		<Button variant="ghost" tone="neutral" size="sm" iconOnly aria-label="Move up" onclick={() => move(value, -1)}>
			<Icon slot="icon-start" name="chevron-up" />
		</Button>
		<Button variant="ghost" tone="neutral" size="sm" iconOnly aria-label="Move down" onclick={() => move(value, 1)}>
			<Icon slot="icon-start" name="chevron-down" />
		</Button>
	{/snippet}
	{#snippet panel(value)}
		<p>{value} goes here.</p>
	{/snippet}
</Accordion>`;

const actionsAstroExample = `---
import { Accordion, Segmented } from "@xtyle/astro";
---

<Accordion multiple>
	<span data-xtyle-header aria-expanded="true">Outcomes</span>
	<span data-xtyle-actions>
		<Segmented size="sm" options="Rows,Chart" value="Rows" aria-label="Outcome view" />
	</span>
	<div data-xtyle-panel>Each run's result, newest first.</div>
	<span data-xtyle-header>Notes</span>
	<div data-xtyle-panel>A section without controls keeps the plain header row.</div>
</Accordion>`;

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

	const sections = [
		{ value: "shipping", header: "Shipping" },
		{ value: "returns", header: "Returns", open: true },
	];
</script>

<Accordion {sections}>
	{#snippet panel(value)}
		{#if value === "shipping"}Orders ship within two business days.{/if}
		{#if value === "returns"}Unworn items are accepted within 30 days.{/if}
	{/snippet}
</Accordion>`;

const astroExample = `---
import { Accordion } from "@xtyle/astro";
---

<!-- Astro consumes a child's \`slot\` attribute to route it, so mark headers and
     panels with \`data-xtyle-header\` / \`data-xtyle-panel\` here. -->
<Accordion multiple>
	<span data-xtyle-header>Shipping</span>
	<div data-xtyle-panel>Orders ship within two business days.</div>
	<span data-xtyle-header open>Returns</span>
	<div data-xtyle-panel>Unworn items are accepted within 30 days.</div>
</Accordion>`;

export const accordionManifest: ComponentManifest = {
	id: "accordion",
	name: "Accordion",
	category: "layout",
	since: "0.1.0",
	keywords: ["collapse", "expander", "disclosure", "faq", "collapsible sections"],
	seeAlso: ["panel", "tabs", "tree"],
	summary: "A stack of collapsible sections, one or many open at a time, driven by pointer or keyboard.",
	description:
		"Accordion stacks a set of disclosure sections that expand and collapse. Each section pairs a `[slot=\"header\"]` header with the `[slot=\"panel\"]` that follows it; the component wraps every header in a heading and a `role=\"button\"` trigger carrying `aria-expanded` and `aria-controls`, and turns each panel into a labelled `role=\"region\"` that hides when collapsed. By default it is single-open: opening one section closes the rest. `multiple` lets several stay open at once. Mark a header `open` to expand its section initially, or `disabled` to lock it. The heading level is `h3` by default and settable with `headingLevel`, and three sizes (`sm`, `md`, `lg`) scale the trigger density. A chevron rotates with the open state, and pointer, Enter/Space, and the arrow/Home/End keys all drive it. A section can also carry `[slot=\"actions\"]` controls (reorder arrows, a view switch) that sit on its header row beside the trigger rather than inside it, so they stay real buttons, never toggle the section, and stay visible while it is closed. Sections are matched by `value`, so reordering the authored pairs keeps each header, panel, open state, and keyboard focus with its section.",
	bindings: ["html", "svelte", "astro"],
	render: "auto",
	exposedParts: ["accordion", "actions", "chevron", "heading", "item", "panel", "section", "trigger"],
	anatomy: [
		{
			name: "accordion",
			description: "The bordered container stacking the sections, with hairlines between them.",
			selector: ".xtyle-accordion",
			tokens: ["--font-sans", "--fg-0", "--bg-1", "--border-thin", "--line", "--radius-md"],
		},
		{
			name: "section",
			description: "One section: its `<details>` disclosure plus, when it has any, the header-row actions beside it. The hairline between sections sits here.",
			selector: ".xtyle-accordion__section",
			tokens: ["--border-thin", "--line"],
		},
		{
			name: "actions",
			description: "The authored header-row controls, laid over the trigger's row just before the chevron; the label keeps clear of them. A sibling of the `<summary>`, never inside it.",
			selector: ".xtyle-accordion__actions",
			tokens: ["--space-1", "--space-3", "--space-4", "--text-body", "--leading-tight"],
		},
		{
			name: "trigger",
			description: "The full-width `<summary>` that toggles its section; carries the hover/press overlay. The native disclosure marker is suppressed in favor of the chevron.",
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
			description:
				"The disclosure caret in the trigger corner; rotates 180° when the section is open. It is an `<xtyle-icon name=\"chevron-down\">` inside the accordion's fragment, so the glyph renders through the Icon component and a mod can swap it without touching the accordion.",
			selector: ".xtyle-accordion__chevron",
			tokens: ["--fg-2", "--duration-fast", "--ease-standard"],
		},
		{
			name: "panel",
			description: "The collapsible `role=\"region\"` holding the section content; the enclosing `<details>` collapses it, so it carries no `hidden` of its own.",
			selector: ".xtyle-accordion__panel",
			tokens: ["--fg-1", "--space-1", "--space-4", "--text-body", "--leading-normal"],
		},
	],
	props: [
		{
			name: "items",
			type: "AccordionSection[]",
			description:
				"The sections as data instead of authored `[slot=\"header\"]` / `[slot=\"panel\"]` pairs: an array of `{ value, header, body?, disabled? }`, serialized to JSON on the attribute. The Svelte binding spells the same list `sections` and takes its bodies from a `panel` snippet.",
			bindings: ["html", "astro"],
		},
		{
			name: "sections",
			type: "AccordionSection[]",
			description: "Svelte only: the sections as data, with each panel rendered by the `panel` snippet keyed by value. The same list is `items` on every other binding.",
			bindings: ["svelte"],
		},
		{
			name: "header",
			type: "Snippet<[string]>",
			description: "Svelte only: rich header content for each section, given its value, in place of the section's `header` text. It renders inside the trigger, so keep it non-interactive; controls belong in `actions`.",
			bindings: ["svelte"],
			propertyOnly: true,
		},
		{
			name: "actions",
			type: "Snippet<[string]>",
			description: "Svelte only: a section's header-row controls, given its value. They render beside the trigger, not inside it.",
			bindings: ["svelte"],
			propertyOnly: true,
		},
		{ name: "multiple", type: "boolean", default: "false", description: "Allows several sections to stay open at once; when off, opening one closes the others.", bindings: ["html", "svelte", "astro"] },
		{ name: "size", type: "Size", default: "md", description: "Trigger density: `sm`, `md`, or `lg`.", bindings: ["html", "svelte", "astro"], options: ["sm", "md", "lg"] },
		{ name: "headingLevel", type: "2 | 3 | 4 | 5 | 6", default: "3", description: "The heading level wrapping each trigger, so the accordion sits correctly in the document outline.", bindings: ["html", "svelte", "astro"] },
		{ name: "chevronIcon", type: "string", default: "\"chevron-down\"", description: "The roster glyph drawn as the disclosure marker. Any name the icon roster can draw, including one a mod contributed through the `xtyle.icons` slot.", bindings: ["html", "svelte", "astro"] },
	],
	events: [
		{ name: "toggle", detail: "{ value, open, values }", description: "A section opened or closed.", bindings: ["html", "svelte", "astro"] },
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
			description:
				"Each section's header label, marked `slot=\"header\"` or `data-xtyle-header`; add `open` to expand it initially or `disabled` to lock it. Astro consumes `slot` to route children, so use `data-xtyle-header` there. Carries markup, not just text: an icon, a badge, and nested components all survive into the render, including the static one.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "panel",
			description:
				"Each section's collapsible content, marked `slot=\"panel\"` or `data-xtyle-panel` (use `data-xtyle-panel` under Astro), paired to the header before it by order. A full render slot: nested components keep working, and under Astro the pairing resolves at build time so the sections are complete before any script runs.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "actions",
			description:
				"Optional controls for a section's header row, marked `slot=\"actions\"` or `data-xtyle-actions` (use the marker under Astro) and placed after the header they belong to. They render beside the trigger, not inside it, so a button there is a real button. In Svelte, pass an `actions` snippet that receives the section's value.",
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
		"The slotted form is for raw HTML and Astro; under Astro use the `data-xtyle-header` / `data-xtyle-panel` markers, because its named-slot handling consumes `slot` before the element sees it. `@xtyle/svelte` takes its sections as data instead — a `sections` array and a `panel` snippet — and renders the pairs itself, so slotted children handed to it are not read.",
		"Leave `multiple` off for an FAQ where one answer shows at a time; turn it on for independent filter or settings groups.",
		"For a small fixed set of mutually exclusive views with their own content area, reach for Tabs instead.",
	],
	a11y: [
		"Each section is a native `<details>`/`<summary>` disclosure, so it opens and closes with the runtime never loading and the browser announces the expanded state itself rather than a hand-maintained `aria-expanded`.",
		"The summary holds a heading (`h3` by default, set with `headingLevel`) so the sections still land in the document outline and screen-reader rotor.",
		"Single-open mode gives every section a shared `name`, which is what makes opening one collapse the rest; the browser enforces it, with no script involved. Under `multiple` the grouping is dropped.",
		"The panel is a `role=\"region\"` wired back with `aria-labelledby`; it never carries `hidden`, because the disclosure already owns its own visibility.",
		"Pointer, Enter, and Space toggle a section; Up/Down arrows move focus between headers and Home/End jump to the first and last.",
		"A header marked `disabled` is skipped by the arrow keys and cannot toggle. `<summary>` has no native disabled state, so it is `aria-disabled` and the toggle is cancelled; it stays focusable, which is the ARIA-preferred treatment.",
		"Focus on a header shows an inset token ring plus a transparent outline the forced-colors base rule promotes to a real system outline.",
		"Header-row actions are siblings of the `<summary>`, never children of it: a `<summary>` is a button, and a button nested inside one is announced wrongly and toggles the section when pressed. Give an icon-only action an `aria-label` that names its section (\"Move Roster up\"), since it sits outside the heading.",
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
		{
			id: "sections-as-data",
			title: "Sections as data",
			description:
				"The same accordion declared as a list instead of authored pairs. The attribute takes JSON, the Astro binding takes the array, and the Svelte binding spells it `sections` with a `panel` snippet.",
			source: { html: itemsHtmlExample, svelte: svelteExample, astro: itemsAstroExample },
		},
		{
			id: "header-actions",
			title: "Controls on the header row",
			description: "A view switch and reorder arrows beside each trigger. Reordering the sections keeps every panel, open state, and focused header with its section.",
			source: { html: actionsHtmlExample, svelte: actionsSvelteExample, astro: actionsAstroExample },
		},
		{
			id: "marker-glyph",
			title: "A different marker glyph",
			description: "The disclosure marker drawn from any name the icon roster can draw, including one a mod contributed.",
			source: { html: markerHtmlExample, svelte: markerSvelteExample, astro: markerAstroExample },
		},
	],
};
