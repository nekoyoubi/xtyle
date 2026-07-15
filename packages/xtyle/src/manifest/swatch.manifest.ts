import type { ComponentManifest } from "./types.js";

const htmlExample = `<xtyle-swatch color="#ff0099" label="Hot pink" value="#ff0099"></xtyle-swatch>
<xtyle-swatch color="#22c55e" label="Success"></xtyle-swatch>

<xtyle-swatch color="#0ea5e9" size="sm"></xtyle-swatch>
<xtyle-swatch color="#0ea5e9" size="lg" label="Sky" value="#0ea5e9"></xtyle-swatch>`;

const svelteExample = `<script lang="ts">
	import { Swatch } from "@xtyle/svelte";
</script>

<Swatch color="#ff0099" label="Hot pink" value="#ff0099" />
<Swatch color="#22c55e" label="Success" />`;

const astroExample = `---
import Swatch from "@xtyle/astro/Swatch.astro";
---

<Swatch color="#ff0099" label="Hot pink" value="#ff0099" />
<Swatch color="#22c55e" label="Success" />`;

const htmlInteractiveExample = `<xtyle-swatch color="#0ea5e9" label="Sky" interactive selected></xtyle-swatch>
<xtyle-swatch color="#22c55e" label="Emerald" interactive></xtyle-swatch>

<xtyle-swatch color="#ff0099" label="Hot pink" details></xtyle-swatch>

<script>
	document.querySelector("xtyle-swatch[interactive]")
		.addEventListener("select", (e) => console.log(e.detail));
</script>`;

const svelteInteractiveExample = `<script lang="ts">
	import { Swatch } from "@xtyle/svelte";
	let picked = $state("#0ea5e9");
</script>

<Swatch color="#0ea5e9" label="Sky" interactive selected={picked === "#0ea5e9"}
	onselect={(e) => (picked = e.detail.color)} />
<Swatch color="#ff0099" label="Hot pink" details />`;

const astroInteractiveExample = `---
import Swatch from "@xtyle/astro/Swatch.astro";
---

<Swatch color="#0ea5e9" label="Sky" interactive selected />
<Swatch color="#ff0099" label="Hot pink" details />`;

export const swatchManifest: ComponentManifest = {
	id: "swatch",
	name: "Swatch",
	category: "control",
	since: "0.1.0",
	keywords: ["color chip", "color swatch", "palette", "color sample", "token chip"],
	seeAlso: ["color-picker", "badge", "icon"],
	summary: "A color chip pairing a colored dot with an optional label and value.",
	description:
		"Swatch is the smallest way to show a color and say what it is. A filled dot beside an optional name and an optional value in mono; the shape every `label + value + dot` row and palette rail is built from. The color it shows is *data*, not theme: it comes in on the `color` prop and is painted straight onto the dot as an inline fill, so a swatch can carry any color a user hands it, including one nowhere in the current theme. Its own chrome is the derived part: the dot's hairline border, the label and value type, the corner radius all read from the same tokens the rest of the UI does, so the chip frames a foreign color in the theme's own voice. A thin border keeps even a near-background color legible against the surface. The `size` prop steps the whole chip with the surrounding type from `sm` to `lg`.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "swatch",
			description: "The chip root: a row laying out the dot, label, and value.",
			selector: ".xtyle-swatch",
		},
		{
			name: "dot",
			description:
				"The color chip itself, filled with the inline `color` data and ringed by a hairline border so a near-background color still reads.",
			selector: ".xtyle-swatch__dot",
			tokens: ["--line-2", "--border-thin", "--radius-sm"],
		},
		{
			name: "label",
			description: "The optional color name, set in body text.",
			selector: ".xtyle-swatch__label",
			tokens: ["--fg-1", "--text-sm", "--leading-tight"],
		},
		{
			name: "value",
			description: "The optional raw value (e.g. a hex string), set in mono and dimmed.",
			selector: ".xtyle-swatch__value",
			tokens: ["--fg-2", "--font-mono", "--text-xs", "--leading-tight"],
		},
		{
			name: "details",
			description:
				"The optional hover/focus popover listing the color across models; an overlay card whose chrome is derived even though the values inside are the swatch's own color, parsed and reformatted.",
			selector: ".xtyle-swatch__details",
			tokens: ["--surface-overlay", "--surface-overlay-border", "--radius-md", "--elevation-2", "--space-1", "--space-2", "--space-8"],
		},
		{
			name: "detail-model",
			description: "A color-model name (`hex`, `rgb`, …) in the details popover, set in body type.",
			selector: ".xtyle-swatch__detail-model",
			tokens: ["--fg-2", "--font-sans", "--text-xs", "--leading-tight"],
		},
		{
			name: "detail-value",
			description: "A formatted color value in the details popover, set in mono.",
			selector: ".xtyle-swatch__detail-value",
			tokens: ["--fg-1", "--font-mono", "--text-xs", "--leading-tight"],
		},
	],
	props: [
		{
			name: "color",
			type: "string",
			description:
				"The color the dot displays; arbitrary user data, painted as an inline fill. Any CSS color works, but it is not a theme token.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "label",
			type: "string",
			description: "An optional name for the color, shown beside the dot.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "value",
			type: "string",
			description: "An optional raw value (e.g. a hex string) shown after the label in mono.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "size",
			type: "SwatchSize",
			default: "md",
			description: "The chip size, stepping with the type scale: `sm`, `md`, or `lg`.",
			bindings: ["html", "svelte", "astro"],
			options: ["sm", "md", "lg"],
		},
		{
			name: "interactive",
			type: "boolean",
			default: "false",
			description:
				"For pickable palettes: render the chip as a `<button>` that emits a `select` event (carrying `{ color, label, value }`) on click, Enter, or Space. Off by default, so a swatch stays a passive display chip.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "selected",
			type: "boolean",
			default: "false",
			description:
				"The chosen state for an interactive chip; rings the dot in the accent and sets `aria-pressed`. Controlled: the consumer owns it and flips it in response to `select`, so a single-choice rail stays authoritative.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "details",
			type: "boolean",
			default: "false",
			description:
				"Show a popover on hover and focus listing the color across `hex` / `rgb` / `hsl` / `oklch`, parsed and reformatted by the engine; a built-in way to read a color without leaving the chip.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [],
	sizes: [
		{ name: "sm", description: "A compact chip for dense palette rails.", className: "xtyle-swatch--sm" },
		{ name: "md", description: "The default chip, sized with body text.", className: "xtyle-swatch", isDefault: true },
		{ name: "lg", description: "A prominent chip for a featured color.", className: "xtyle-swatch--lg" },
	],
	states: [
		{
			name: "selected",
			description: "An interactive chip in its chosen state: the dot ringed in the accent, `aria-pressed` set.",
			selector: ".xtyle-swatch--selected .xtyle-swatch__dot",
			tokens: ["--border-thick", "--accent"],
		},
		{
			name: "focus-visible",
			description: "An interactive chip focused by keyboard; a ring picks it out for the next selection.",
			selector: ".xtyle-swatch--interactive:focus-visible",
			tokens: ["--border-normal", "--border-thick", "--ring"],
		},
	],
	slots: [],
	consumedTokens: [
		"--border-thin",
		"--line-2",
		"--radius-sm",
		"--radius-md",
		"--fg-1",
		"--fg-2",
		"--text-sm",
		"--text-xs",
		"--text-lg",
		"--leading-tight",
		"--font-mono",
		"--font-sans",
		"--border-normal",
		"--border-thick",
		"--ring",
		"--bg-1",
		"--fg-0",
		"--accent",
		"--selection-cue",
		"--space-1",
		"--space-2",
		"--space-8",
		"--surface-overlay",
		"--surface-overlay-border",
		"--elevation-2",
		"--duration-fast",
		"--ease-standard",
	],
	composition: [
		"Stack named swatches in a `Stack` for a legend: each a `label + value + dot` row.",
		"Set bare swatches (color only) in a tight `Cluster` for a palette rail.",
		"Pair a swatch with a `Badge` or `Text` in a `Cluster` to annotate a color in running UI.",
	],
	a11y: [
		"The dot is marked `aria-hidden`. Color alone carries no meaning to assistive tech, so the `label` and `value` text carry the identity.",
		"Always provide a `label` (and ideally a `value`) when the color is meaningful, so the chip is announced by name, not by an invisible swatch.",
		"An `interactive` chip is a real `<button>`, so Enter and Space activate it and Tab reaches it for free; when it carries no visible label it borrows its `value` or `color` as an `aria-label`.",
		"`selected` reflects to `aria-pressed`, so a picked chip announces its chosen state to assistive tech, not just its accent ring. Each chip is an independent toggle; if a rail is single-choice, the consumer enforces that by clearing the others on `select`.",
		"Selection carries a non-color channel on demand: when the theme sets `--selection-cue: marker` (a high-contrast or redundant-cues algorithm), the picked chip keeps its accent ring and gains a second bold neutral `--fg-0` outline around it, so a color-deficient user reads the selection by that added ring, not the accent hue alone, satisfying WCAG 1.4.1.",
		"A `details` chip is keyboard-reachable even when it isn't `interactive`: it takes `tabindex` and points `aria-describedby` at the popover, so the color readout is available on focus, not hover alone.",
	],
	examples: [
		{
			id: "named-and-sizes",
			title: "Named swatches and sizes",
			description: "Labeled chips with values, plus the bare dot across the three sizes.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
		{
			id: "interactive-and-details",
			title: "Pickable chips and color details",
			description:
				"An `interactive` chip emits `select` and shows a `selected` ring; a `details` chip reveals the color across models on hover and focus.",
			source: { html: htmlInteractiveExample, svelte: svelteInteractiveExample, astro: astroInteractiveExample },
		},
	],
};
