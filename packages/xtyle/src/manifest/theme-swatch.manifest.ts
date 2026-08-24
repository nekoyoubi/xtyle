import type { ComponentManifest } from "./types.js";

const htmlExample = `<!-- The default palette read of an algorithm's theme -->
<xtyle-theme-swatch algorithm="xtyle-quiet"></xtyle-theme-swatch>

<!-- Just the accents, larger, with the colour-model readout on hover -->
<xtyle-theme-swatch tokens="--accent,--accent-2,--accent-3" size="lg" details></xtyle-theme-swatch>

<!-- A seeded invocation, pinned light, chips only -->
<xtyle-theme-swatch
	scheme="light"
	labels="false"
	constraints='{"--accent":"#7c5cff"}'
></xtyle-theme-swatch>`;

const svelteExample = `<script lang="ts">
	import { ThemeSwatch } from "@xtyle/svelte";
</script>

<ThemeSwatch algorithm="xtyle-quiet" />

<!-- just the accents, larger, with the colour-model readout -->
<ThemeSwatch tokens={["--accent", "--accent-2", "--accent-3"]} size="lg" details />

<!-- a seeded invocation, pinned light, chips only -->
<ThemeSwatch scheme="light" labels={false} constraints={{ "--accent": "#7c5cff" }} />`;

const astroExample = `---
import ThemeSwatch from "@xtyle/astro/ThemeSwatch.astro";
---

<ThemeSwatch algorithm="xtyle-quiet" />

<!-- just the accents, larger, with the colour-model readout -->
<ThemeSwatch tokens={["--accent", "--accent-2", "--accent-3"]} size="lg" details />

<!-- a seeded invocation, pinned light, chips only -->
<ThemeSwatch scheme="light" labels={false} constraints={{ "--accent": "#7c5cff" }} />`;

export const themeSwatchManifest: ComponentManifest = {
	id: "theme-swatch",
	name: "Theme Swatch",
	since: "0.10.0",
	category: "content",
	keywords: ["theme", "swatch", "palette", "chips", "colors", "tokens", "algorithm", "invocation"],
	seeAlso: ["swatch", "theme-card", "theme-scope"],
	summary: "A theme's palette as a row of chips, read straight off the derivation.",
	description:
		"Theme Swatch derives an invocation the way `<xtyle-theme-scope>` does and paints the palette instead of applying it, so the colors a theme produced can be read without the page having to wear it. It **composes `<xtyle-swatch>`** for every chip rather than reinventing one — the dot, the label, the value readout, and the colour-model details all come from that component, so a Swatch mod restyles these along with every other chip in the app. `tokens` picks which of the derived tokens to show and takes any token name, so a row can be the default palette read, just the accents, or the four status hues; a token the algorithm never produced is skipped rather than drawn as a hole. Where `<xtyle-theme-card>` shows a theme as a *fake* of an interface, this shows it as its literal values — the two are the picture and the parts list, and a picker often wants both. The row itself renders through this component's own fill, so a mod can restructure it without touching the element.",
	bindings: ["html", "svelte", "astro"],
	exposedParts: ["chip", "error", "row"],
	anatomy: [
		{
			name: "row",
			description: "The chip row. Wraps, so a long token list reflows rather than scrolling.",
			selector: ".xtyle-theme-swatch__row",
		},
		{
			name: "chip",
			description: "One `<xtyle-swatch>` per shown token, carrying the derived color as both its swatch and its value.",
			selector: ".xtyle-theme-swatch__row > xtyle-swatch",
		},
	],
	props: [
		{
			name: "algorithm",
			type: "string",
			default: "xtyle-default",
			description: "The id of the algorithm to invoke.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "tokens",
			type: "string[]",
			default: "--accent, --accent-2, --bg-0, --fg-0, --success, --warn, --danger, --info",
			description: "Which derived tokens to show, as a comma-separated list in HTML and an array in the framework bindings. A leading `--` is optional.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "scheme",
			type: "\"light\" | \"dark\"",
			description: "Pins the scheme read, re-deriving inverted when the algorithm's native mode is the other one.",
			bindings: ["html", "svelte", "astro"],
			options: ["light", "dark"],
		},
		{
			name: "size",
			type: "SwatchSize",
			default: "md",
			description: "The chip size, passed through to each composed `<xtyle-swatch>`.",
			bindings: ["html", "svelte", "astro"],
			options: ["sm", "md", "lg"],
		},
		{
			name: "labels",
			type: "boolean",
			default: "true",
			description: "Show each token's name beside its chip. Set false for a bare palette strip.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "details",
			type: "boolean",
			default: "false",
			description: "Give every chip the Swatch colour-model readout on hover and focus.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "knobs",
			type: "Knobs",
			description: "The algorithm's own dials, as an object in the framework bindings and JSON in the HTML attribute.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "constraints",
			type: "Constraints",
			description: "Direct token overrides applied over the derivation.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	events: [
		{ name: "xtyle:theme-swatch", detail: "{ theme }", description: "The swatch's theme was chosen.", bindings: ["html", "astro"] },
	],
	variants: [],
	sizes: [],
	states: [
		{
			name: "error",
			description: "The invocation could not be derived; the row says why instead of rendering empty.",
			selector: ".xtyle-theme-swatch__error",
		},
	],
	slots: [],
	consumedTokens: [
		"--danger",
		"--font-sans",
		"--leading-tight",
		"--space-2",
		"--text-xs",
	],
	composition: [
		"Put one under a `<xtyle-theme-card>` so a theme reads as both a picture and its literal values.",
		"Narrow `tokens` to a family (`--success,--warn,--danger,--info`) to show what a theme does to status color specifically.",
		"Turn on `details` when someone needs the hex, rgb, hsl, and oklch of what the algorithm produced.",
		"It composes `<xtyle-swatch>`, so a Swatch mod restyles these chips along with every other one.",
	],
	a11y: [
		"Each chip is an `<xtyle-swatch>`, so its label, value, and colour-model readout carry the meaning rather than the color alone.",
		"The row is plain content and takes no focus unless `details` makes each chip focusable, which is the Swatch's own behavior.",
		"A token the algorithm never produced is skipped, so the row never presents an unlabelled empty chip.",
	],
	examples: [
		{
			id: "palette-reads",
			title: "The default read, an accent-only row, and a bare strip",
			description: "A full palette read, a larger accents-only row with the colour-model readout, and a seeded light theme as chips alone.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
	],
};
