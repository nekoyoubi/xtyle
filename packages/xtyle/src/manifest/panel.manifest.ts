import type { ComponentManifest } from "./types.js";

const htmlExample = `<xtyle-panel title="Connections" level="2">
	<button slot="actions" class="xtyle-button xtyle-button--ghost xtyle-button--neutral xtyle-button--sm">Refresh</button>
	<p>Two services are connected.</p>
	<p slot="footer">Last synced a moment ago.</p>
</xtyle-panel>

<xtyle-panel title="Advanced options" variant="collapsible">
	<label><input type="checkbox" /> Verbose logging</label>
	<label><input type="checkbox" /> Telemetry</label>
</xtyle-panel>

<xtyle-panel title="Activity log" scroll>
	<p>A long stream of entries that scrolls inside the panel body…</p>
</xtyle-panel>`;

const svelteExample = `<script lang="ts">
	import { Panel } from "@xtyle/svelte";
</script>

<Panel title="Connections" level={2}>
	{#snippet actions()}
		<button class="xtyle-button xtyle-button--ghost xtyle-button--neutral xtyle-button--sm">Refresh</button>
	{/snippet}
	<p>Two services are connected.</p>
	{#snippet footer()}
		<span>Last synced a moment ago.</span>
	{/snippet}
</Panel>

<Panel title="Advanced options" variant="collapsible">
	<label><input type="checkbox" /> Verbose logging</label>
	<label><input type="checkbox" /> Telemetry</label>
</Panel>

<Panel title="Activity log" scroll>
	<p>A long stream of entries that scrolls inside the panel body…</p>
</Panel>`;

const astroExample = `---
import { Panel } from "@xtyle/astro";
---

<Panel title="Connections" level={2}>
	<button slot="actions" class="xtyle-button xtyle-button--ghost xtyle-button--neutral xtyle-button--sm">Refresh</button>
	<p>Two services are connected.</p>
	<p slot="footer">Last synced a moment ago.</p>
</Panel>

<Panel title="Advanced options" variant="collapsible">
	<label><input type="checkbox" /> Verbose logging</label>
	<label><input type="checkbox" /> Telemetry</label>
</Panel>

<Panel title="Activity log" scroll>
	<p>A long stream of entries that scrolls inside the panel body…</p>
</Panel>`;

export const panelManifest: ComponentManifest = {
	id: "panel",
	name: "Panel",
	category: "layout",
	keywords: ["pane", "collapsible", "titled region", "section", "card"],
	seeAlso: ["card", "accordion", "dock"],
	summary: "A titled content region: a header with a configurable heading and actions, a body, an optional footer, and an optional collapsible or scrollable form.",
	description:
		"Panel frames a labelled section of content. Its header carries a title (rendered at a configurable heading `level` for a correct document outline), an actions slot pushed to the trailing edge by a spacer, and the body it labels via `aria-labelledby`. The `default` variant is a static `<section>`; the `collapsible` variant is a native `<details>`/`<summary>` disclosure that needs no JavaScript in markup. The custom element drives it with `aria-expanded`. A `footer` slot adds a quiet trailing row, and the `scroll` flag turns the body into a focusable, keyboard-scrollable region capped at a fixed height.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "panel",
			description: "The root section (or details) carrying the variant and modifier classes.",
			selector: ".xtyle-panel",
			tokens: ["--bg-0", "--line", "--border-thin", "--radius-lg"],
		},
		{
			name: "header",
			description: "The title row; for the collapsible variant it's the clickable summary/toggle.",
			selector: ".xtyle-panel__header",
			tokens: ["--bg-1", "--line", "--border-thin", "--space-3", "--space-4", "--space-2"],
		},
		{
			name: "title",
			description: "The heading, rendered at the configured level and referenced by the section's aria-labelledby.",
			selector: ".xtyle-panel__title",
			tokens: ["--font-display", "--weight-semibold", "--text-sm", "--fg-1"],
		},
		{
			name: "spacer",
			description: "A flexible gap that pushes the actions slot to the trailing edge of the header.",
			selector: ".xtyle-panel__spacer",
		},
		{
			name: "body",
			description: "The content region the panel labels; becomes a scroll container under the scroll flag.",
			selector: ".xtyle-panel__body",
			tokens: ["--space-4", "--space-3"],
		},
		{
			name: "footer",
			description: "A quiet trailing row for metadata or secondary actions.",
			selector: ".xtyle-panel__footer",
			tokens: ["--bg-1", "--line", "--border-thin", "--fg-2", "--text-sm", "--space-3", "--space-4", "--space-2"],
		},
	],
	props: [
		{
			name: "title",
			type: "string",
			description: "The panel heading text. When set (or an actions slot is filled) the header renders.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "level",
			type: "1 | 2 | 3 | 4 | 5 | 6",
			default: "2",
			description: "The heading level for the title, so the panel slots into the document outline correctly.",
			bindings: ["html", "svelte", "astro"],
			options: ["1", "2", "3", "4", "5", "6"],
		},
		{
			name: "variant",
			type: "PanelVariant",
			default: "default",
			description: "`default` is a static section; `collapsible` is a disclosure with a clickable header.",
			bindings: ["html", "svelte", "astro"],
			options: ["default", "collapsible"],
		},
		{
			name: "open",
			type: "boolean",
			default: "false",
			description: "For the collapsible variant: whether the body starts expanded.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "scroll",
			type: "boolean",
			default: "false",
			description: "Caps the body height and makes it a focusable, keyboard-scrollable region.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [
		{
			name: "default",
			description: "A static titled section.",
			className: "xtyle-panel",
		},
		{
			name: "collapsible",
			description: "A native disclosure; the header toggles the body open and closed.",
			className: "xtyle-panel--collapsible",
			tokens: ["--bg-1", "--fg-1", "--state-hover", "--state-press"],
		},
	],
	sizes: [],
	states: [
		{
			name: "open",
			description: "The collapsible panel is expanded; the marker rotates to point down.",
			selector: ".xtyle-panel--collapsible[open] > summary .xtyle-panel__marker",
			tokens: ["--ease-emphasized", "--duration-fast"],
		},
		{
			name: "collapsed",
			description: "The collapsible panel is closed; the body is hidden, the marker points right.",
			selector: ".xtyle-panel__marker",
			tokens: ["--fg-2", "--duration-fast", "--ease-emphasized"],
		},
		{
			name: "hover",
			description: "Pointer over a collapsible header; the overlay paints the hover tint.",
			selector: ".xtyle-panel--collapsible > summary:hover::after",
			tokens: ["--state-hover"],
		},
		{
			name: "active",
			description: "Collapsible header pressed; the overlay paints the press tint.",
			selector: ".xtyle-panel--collapsible > summary:active::after",
			tokens: ["--state-press"],
		},
		{
			name: "focus-visible",
			description: "Keyboard focus on the toggle or the scroll body: an inset token-colored ring.",
			selector: ".xtyle-panel__toggle:focus-visible",
			tokens: ["--border-normal", "--border-thick", "--ring"],
		},
	],
	slots: [
		{
			name: "default",
			description: "The panel body content.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "actions",
			description: "Controls aligned to the trailing edge of the header.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "footer",
			description: "A quiet trailing row below the body.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	consumedTokens: [
		"--bg-0",
		"--bg-1",
		"--border-normal",
		"--border-thick",
		"--border-thin",
		"--duration-fast",
		"--ease-emphasized",
		"--ease-standard",
		"--fg-1",
		"--fg-2",
		"--font-display",
		"--line",
		"--line-2",
		"--radius-lg",
		"--ring",
		"--space-2",
		"--space-3",
		"--space-4",
		"--space-8",
		"--state-hover",
		"--state-press",
		"--text-sm",
		"--weight-semibold",
	],
	composition: [
		"Use as the building block of a Dock column; `.xtyle-dock .xtyle-panel` drops the border and radius so panels stack flush.",
		"Put a Button cluster in the `actions` slot for per-panel controls; the spacer keeps them right-aligned.",
		"Set `level` so nested panels keep a valid heading hierarchy: a top-level panel at 2, sub-panels at 3, and so on.",
	],
	a11y: [
		"The default variant is a native `<section>` labelled by its title via `aria-labelledby`, so it is announced as a named region.",
		"The title renders at a configurable heading `level` so the panel participates correctly in the document outline; the binding warns when neither a title nor an actions slot supplies a heading.",
		"The collapsible variant uses native `<details>`/`<summary>` (or a `<button>` with `aria-expanded` in the custom element), giving keyboard toggling and screen-reader disclosure semantics for free.",
		"The disclosure marker is decorative (`aria-hidden`); expanded state lives in `[open]` / `aria-expanded`, not the rotation.",
		"Under `scroll` the body is a focusable region (`tabindex=\"0\"`, `role=\"region\"`) so keyboard users can scroll it, with the standard inset focus ring.",
	],
	examples: [
		{
			id: "header-collapsible-scroll",
			title: "Header, collapsible, and scroll",
			description: "A titled panel with actions and a footer, a collapsible disclosure, and a scrollable body.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
	],
};
