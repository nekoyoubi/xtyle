import type { ComponentManifest } from "./types.js";
import { FULL_TONES } from "../vocab.js";

const htmlExample = `<xtyle-segmented label="View" options="Day,Week,Month" value="Week"></xtyle-segmented>

<xtyle-segmented label="Align" options="Left:start,Center:center,Right:end" value="center"></xtyle-segmented>

<xtyle-segmented size="sm" label="Theme" options="Light,Dark,Auto" value="Auto"></xtyle-segmented>

<xtyle-segmented label="Locked" options="One,Two,Three" value="Two" disabled></xtyle-segmented>`;

const htmlStructuredExample = `<xtyle-segmented id="fmt" label="Export"></xtyle-segmented>
<script>
	document.getElementById("fmt").options = [
		{ value: "md", label: "Markdown" },
		{ value: "html", label: "HTML" },
		{ value: "epub", label: "EPUB" },
	];
</script>`;

const svelteStructuredExample = `<script lang="ts">
	import { Segmented } from "@xtyle/svelte";

	const formats = [
		{ value: "md", label: "Markdown" },
		{ value: "html", label: "HTML" },
		{ value: "epub", label: "EPUB" },
	];
	let format = $state("md");
</script>

<Segmented label="Export" options={formats} bind:value={format} />`;

const perOptionExample = `<xtyle-segmented id="run-view" label="Run output"></xtyle-segmented>
<script>
	document.getElementById("run-view").options = [
		{ value: "report", label: "Report", badge: "128", title: "The parsed summary view" },
		{ value: "text", label: "Text", disabled: true, title: "Raw text (no run yet)" },
		{ value: "log", label: "Log", disabled: true, title: "Execution log (no run yet)" },
	];
</script>`;

const astroStructuredExample = `---
import { Segmented } from "@xtyle/astro";
const formats = [
	{ value: "md", label: "Markdown" },
	{ value: "html", label: "HTML" },
	{ value: "epub", label: "EPUB" },
];
---

<Segmented label="Export" options={formats} value="md" />`;

const htmlSlottedExample = `<xtyle-segmented label="Severity" value="info">
	<span slot="segment" value="info" label="Info"><xtyle-icon name="info"></xtyle-icon></span>
	<span slot="segment" value="warn" label="Warnings"><xtyle-icon name="warning"></xtyle-icon></span>
	<span slot="segment" value="error" label="Errors"><xtyle-icon name="error"></xtyle-icon></span>
</xtyle-segmented>`;

const svelteSlottedExample = `<script lang="ts">
	import { Segmented, Segment, Icon } from "@xtyle/svelte";

	let severity = $state("info");
</script>

<Segmented label="Severity" bind:value={severity}>
	<Segment value="info" label="Info"><Icon name="info" /></Segment>
	<Segment value="warn" label="Warnings"><Icon name="warning" /></Segment>
	<Segment value="error" label="Errors"><Icon name="error" /></Segment>
</Segmented>`;

const astroSlottedExample = `---
import { Segmented, Segment, Icon } from "@xtyle/astro";
---

<Segmented label="Severity" value="info">
	<Segment value="info" label="Info"><Icon name="info" /></Segment>
	<Segment value="warn" label="Warnings"><Icon name="warning" /></Segment>
	<Segment value="error" label="Errors"><Icon name="error" /></Segment>
</Segmented>`;

const svelteExample = `<script lang="ts">
	import { Segmented } from "@xtyle/svelte";

	let view = $state("Week");
</script>

<Segmented label="View" options="Day,Week,Month" bind:value={view} />

<Segmented label="Align" options="Left:start,Center:center,Right:end" value="center" />

<Segmented size="sm" label="Theme" options="Light,Dark,Auto" value="Auto" />

<Segmented label="Locked" options="One,Two,Three" value="Two" disabled />`;

const astroExample = `---
import { Segmented } from "@xtyle/astro";
---

<Segmented label="View" options="Day,Week,Month" value="Week" />

<Segmented label="Align" options="Left:start,Center:center,Right:end" value="center" />

<Segmented size="sm" label="Theme" options="Light,Dark,Auto" value="Auto" />

<Segmented label="Locked" options="One,Two,Three" value="Two" disabled />`;

export const segmentedManifest: ComponentManifest = {
	id: "segmented",
	name: "Segmented",
	category: "control",
	keywords: ["segmented control", "toggle group", "button group", "single select", "pills"],
	seeAlso: ["tabs", "switch", "radio", "button"],
	summary: "A single-select toggle bar: pick one of a few options from a connected button group.",
	description:
		"Segmented picks one option from a small, fixed set rendered as a connected button bar. It's the compact alternative to a radio group when the choices are few and worth showing at once. It is a `role=\"radiogroup\"` of `role=\"radio\"` buttons with roving tabindex: the selected segment is the tab stop, arrow keys move and select with wraparound, and Home/End jump to the ends. Options are declared as a comma-separated `options` string (bare labels, or `label:value` pairs), or as a structured `{ value, label }[]` when a label differs from its value or carries a comma or colon. For rich segments, drop in `<Segment value=\"…\" label=\"…\">` children holding an icon or other markup instead of a text label; they win over `options` when both are present. It's form-associated; give it a `name` and the chosen value submits. Three sizes: `sm`, `md`, `lg`.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "field",
			description: "The wrapper stacking the optional label over the toggle bar.",
			selector: ".xtyle-segmented-field",
			tokens: ["--font-sans", "--space-2"],
		},
		{
			name: "segmented",
			description: "The `role=\"radiogroup\"` track holding the options.",
			selector: ".xtyle-segmented",
			tokens: ["--space-1", "--bg-1", "--border-thin", "--line-2", "--radius-md"],
		},
		{
			name: "option",
			description: "Each `role=\"radio\"` segment; the selected one fills with the accent.",
			selector: ".xtyle-segmented__option",
			tokens: ["--fg-1", "--fg-0", "--text-sm", "--text-body", "--weight-medium", "--space-1", "--space-2", "--space-3", "--space-4", "--radius-sm", "--accent", "--accent-fg", "--state-hover", "--state-press"],
		},
		{
			name: "label",
			description: "The optional visible label, referenced as the group's accessible name.",
			selector: ".xtyle-segmented__label",
			tokens: ["--fg-1", "--text-sm"],
		},
		{
			name: "badge",
			description: "A per-option trailing count/status inside its segment; reach it at `::part(badge)`.",
			selector: ".xtyle-segmented__badge",
			tokens: ["--space-1"],
		},
	],
	props: [
		{ name: "value", type: "string", description: "The selected option's value. Defaults to the first option. Reflected and form-submitted.", bindings: ["html", "svelte", "astro"] },
		{
			name: "options",
			type: "string | { value: string; label?: string; disabled?: boolean; badge?: string; title?: string }[]",
			description:
				"The options. The comma-string shorthand takes bare labels (`Day,Week`, the label is the value) or `label:value` pairs (`Left:start`). For labels that differ from their value or carry a comma or colon, pass a `{ value, label }[]` instead (the JS property in html / svelte, a JSON array attribute in Astro); a bare `string[]` works too. The structured form also takes a per-option `disabled` (a choice the current data can't offer, skipped by pointer and keyboard), a `badge` (trailing text like a count), and a `title` (a hover hint on the segment, for a short label that needs disambiguating context) per segment.",
			bindings: ["html", "svelte", "astro"],
		},
		{ name: "disabled", type: "boolean", default: "false", description: "Disables selection and mutes the bar.", bindings: ["html", "svelte", "astro"] },
		{ name: "size", type: "Size", default: "md", description: "Control size: `sm`, `md`, or `lg`.", bindings: ["html", "svelte", "astro"], options: ["sm", "md", "lg"] },
		{ name: "tone", type: "FullTone", default: "accent", description: "Color of the selected segment's fill. Any semantic role, accent variant, or named hue.", bindings: ["html", "svelte", "astro"], options: [...FULL_TONES] },
		{ name: "label", type: "string", description: "Visible label, also the accessible name via `aria-labelledby`.", bindings: ["html", "svelte", "astro"] },
		{ name: "labelledby", type: "string", description: "ID of an external element that names the group. Takes precedence over `label`.", bindings: ["html", "svelte", "astro"] },
		{ name: "aria-label", type: "string", description: "Names the group with no visible label, for a compact icon bar (a toolbar) where a heading would be noise. `labelledby` and a visible `label` both win over it.", bindings: ["html", "svelte", "astro"] },
		{ name: "name", type: "string", description: "Form field name; the selected value submits with the form.", bindings: ["html", "svelte", "astro"] },
	],
	variants: [],
	sizes: [
		{ name: "sm", description: "Compact.", className: "xtyle-segmented--sm" },
		{ name: "md", description: "Default.", className: "xtyle-segmented", isDefault: true },
		{ name: "lg", description: "Large.", className: "xtyle-segmented--lg" },
	],
	states: [
		{
			name: "selected",
			description:
				"The chosen segment: filled with the accent and its readable foreground. When the theme's `--selection-cue` resolves to `marker` (a high-contrast or redundant-cues algorithm), the selected segment gains a non-color check glyph so selection never rests on color alone.",
			selector: '.xtyle-segmented__option[aria-checked="true"]',
			tokens: ["--accent", "--accent-fg", "--selection-cue"],
		},
		{
			name: "hover",
			description: "Pointer over an unselected segment; an overlay paints the hover tint.",
			selector: ".xtyle-segmented__option:hover::after",
			tokens: ["--state-hover", "--fg-0"],
		},
		{
			name: "focus-visible",
			description: "Keyboard focus on a segment: a token ring plus a transparent outline that becomes real in forced-colors mode.",
			selector: ".xtyle-segmented__option:focus-visible",
			tokens: ["--border-normal", "--border-thick", "--ring"],
		},
		{
			name: "disabled",
			description: "The whole group disabled: muted, non-interactive.",
			selector: ".xtyle-segmented--disabled",
			tokens: ["--fg-disabled", "--state-disabled"],
		},
	],
	slots: [
		{
			name: "segment",
			description:
				"Rich-content segments: one `[slot=\"segment\"]` child (a `<Segment>`) per option, each carrying `value`, an accessible `label`, and markup like an `<Icon>`. The element derives selection, roving tabindex, and the form value from them exactly as it would from `options`, and projects each child's live content into its radio. Children win over `options` when both are given.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	consumedTokens: [
		"--font-sans",
		"--text-sm",
		"--text-body",
		"--weight-medium",
		"--fg-0",
		"--fg-1",
		"--fg-disabled",
		"--bg-1",
		"--line-2",
		"--border-thin",
		"--border-normal",
		"--border-thick",
		"--radius-md",
		"--radius-sm",
		...FULL_TONES.flatMap((t) => [`--${t}`, `--${t}-fg`]),
		"--ring",
		"--selection-cue",
		"--space-1",
		"--space-2",
		"--space-3",
		"--space-4",
		"--state-hover",
		"--state-press",
		"--state-disabled",
		"--duration-fast",
		"--ease-standard",
	],
	composition: [
		"Reach for it over a radio group when there are two to five options worth showing at once: view switches, alignment, light/dark/auto.",
		"For many options, a long list, or free text, use Select instead.",
		"Pair with a form and a `name` so the chosen value submits like any field.",
		"For icon-only or icon-plus-text segments, use `<Segment>` children instead of `options`, and give each an accessible `label`.",
	],
	a11y: [
		"The bar is `role=\"radiogroup\"` and each segment `role=\"radio\"` with `aria-checked`, never conveying selection by color alone.",
		"Roving tabindex: the selected segment is the single tab stop; arrow keys move and select with wraparound, Home/End jump to the ends, click selects.",
		"Requires an accessible name: `labelledby` wins, then a visible `label`, then a bare `aria-label` for an unlabeled icon bar; the binding warns at runtime when none is present.",
		"An icon segment owns its option's name and tooltip: the radio carries `aria-label` and a `title` from the `<Segment>`'s `label`, so the projected icon stays decorative and hovering the option (not the glyph) shows what it selects.",
		"Focus is shown with a token ring and a transparent outline the forced-colors base rule promotes to a real system outline.",
		"Selection carries a non-color channel on demand: when the theme sets `--selection-cue: marker`, the selected segment gains a check glyph alongside the color fill, satisfying WCAG 1.4.1. High-contrast emits `marker` by default, and any algorithm can opt in via the `cues` knob.",
		"The group-level `disabled` blocks selection, drops the segments out of the tab order, and mutes the bar; a per-option `disabled` does the same for one segment, so the arrow keys skip it and the default selection lands on the first enabled option.",
		"A per-option `badge` is trailing text inside the segment (a count); it rides along with the option's label as part of that radio's accessible name.",
	],
	examples: [
		{
			id: "views-pairs-sizes",
			title: "Labels, value pairs, and sizes",
			description: "A view switch, an alignment control using `label:value` pairs, the compact size, and a disabled group.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
		{
			id: "structured-options",
			title: "Structured options",
			description: "An export-format row built from a `{ value, label }[]`, showing `Markdown` / `HTML` / `EPUB` while the handler receives `md` / `html` / `epub`.",
			source: { html: htmlStructuredExample, svelte: svelteStructuredExample, astro: astroStructuredExample },
		},
		{
			id: "per-option-state",
			title: "Per-option disabled and badges",
			description: "A data-conditional view switch: a `report` segment carries a count while `text` / `log` stay disabled until their data exists, so the arrow keys skip them and the selection lands on the first enabled option.",
			source: { html: perOptionExample },
		},
		{
			id: "rich-segments",
			title: "Icon segments",
			description:
				"Drop `<Segment>` children holding an `<Icon>` in place of text labels; each carries a `value` and an accessible `label`, and the bar keeps its selection, roving focus, and form value unchanged. The children project live, so framework-owned content stays reactive.",
			source: { html: htmlSlottedExample, svelte: svelteSlottedExample, astro: astroSlottedExample },
		},
	],
};
