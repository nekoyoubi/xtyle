import type { ComponentManifest } from "./types.js";

const htmlExample = `<!-- A preview of an algorithm's default theme -->
<xtyle-theme-card algorithm="xtyle-quiet" name="Quiet"></xtyle-theme-card>

<!-- A seeded invocation, pinned light -->
<xtyle-theme-card
	name="Grape"
	scheme="light"
	constraints='{"--accent":"#7c5cff"}'
></xtyle-theme-card>

<!-- Selectable: emits \`select\` for a picker to listen to -->
<xtyle-theme-card algorithm="xtyle-loud" name="Loud" interactive selected></xtyle-theme-card>`;

const svelteExample = `<script lang="ts">
	import { ThemeCard } from "@xtyle/svelte";

	let chosen = $state("xtyle-default");
</script>

{#each ["xtyle-default", "xtyle-quiet", "xtyle-loud"] as algorithm}
	<ThemeCard
		{algorithm}
		name={algorithm}
		interactive
		selected={chosen === algorithm}
		onselect={() => (chosen = algorithm)}
	/>
{/each}`;

const astroExample = `---
import ThemeCard from "@xtyle/astro/ThemeCard.astro";
---

<ThemeCard algorithm="xtyle-quiet" name="Quiet" />

<!-- a seeded invocation, pinned light -->
<ThemeCard name="Grape" scheme="light" constraints={{ "--accent": "#7c5cff" }} />

<!-- selectable -->
<ThemeCard algorithm="xtyle-loud" name="Loud" interactive selected />`;

export const themeCardManifest: ComponentManifest = {
	id: "theme-card",
	name: "Theme Card",
	since: "0.10.0",
	category: "content",
	keywords: ["theme", "card", "preview", "thumbnail", "fake", "algorithm", "invocation", "picker", "palette"],
	seeAlso: ["theme-scope", "swatch", "card"],
	summary: "A preview of a theme, drawn as a small fake of a themed UI.",
	description:
		"Theme Card derives an invocation exactly the way `<xtyle-theme-scope>` does — a named algorithm plus its `knobs` and token `constraints` — but *paints* the result instead of applying it, so a theme can be shown without the page having to wear it. What it draws is a **fake**: a small simulated interface in the theme's own colors, with a surface, a title, a row of swatches, a filled button, and the status dots. A fake reads a palette faster than a list of hex values does, because it shows the colors doing the job they were derived for. The whole drawing lives in the component's fill, so a mod can redraw the fake into whatever preview an app wants — a different mock, more swatches, a type specimen — without touching the element. `interactive` turns the card into a real button that emits `select`, which is what a theme picker listens to; `selected` marks the current one. A bad invocation shows its error on the card rather than a blank frame.",
	bindings: ["html", "svelte", "astro"],
	exposedParts: ["body", "card", "error", "meta", "name", "preview"],
	anatomy: [
		{
			name: "card",
			description: "The card itself; a `<button>` under `interactive`, a grouped `<span>` otherwise.",
			selector: ".xtyle-theme-card",
		},
		{
			name: "preview",
			description: "The fake: an inline SVG of a themed interface, drawn from the derived register.",
			selector: ".xtyle-theme-card__preview",
		},
		{
			name: "name",
			description: "The theme's display name.",
			selector: ".xtyle-theme-card__name",
		},
		{
			name: "meta",
			description: "The algorithm and the scheme the derivation landed on.",
			selector: ".xtyle-theme-card__meta",
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
			name: "name",
			type: "string",
			description: "The theme's display name, shown under the preview and used in the accessible name.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "scheme",
			type: "\"light\" | \"dark\"",
			description: "Pins the previewed scheme, re-deriving inverted when the algorithm's native mode is the other one.",
			bindings: ["html", "svelte", "astro"],
			options: ["light", "dark"],
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
		{
			name: "interactive",
			type: "boolean",
			default: "false",
			description: "Render as a button that emits `select` when chosen.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "selected",
			type: "boolean",
			default: "false",
			description: "Mark this card as the chosen one; sets `aria-pressed` on the interactive card.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	events: [
		{ name: "select", description: "The card was activated.", bindings: ["html", "svelte", "astro"] },
		{ name: "xtyle:theme-card", detail: "{ theme }", description: "The card's theme was chosen, carrying the whole invocation.", bindings: ["html", "astro"] },
	],
	variants: [],
	sizes: [],
	states: [
		{
			name: "interactive",
			description: "The card is a button and can be chosen.",
			selector: ".xtyle-theme-card--interactive",
		},
		{
			name: "selected",
			description: "The card is the currently chosen theme.",
			selector: ".xtyle-theme-card--selected",
		},
		{
			name: "error",
			description: "The invocation could not be derived; the card shows why instead of a blank frame.",
			selector: ".xtyle-theme-card--error",
		},
	],
	slots: [],
	consumedTokens: [
		"--accent",
		"--bg-1",
		"--border-thick",
		"--border-thin",
		"--danger",
		"--duration-fast",
		"--ease-standard",
		"--fg-0",
		"--fg-2",
		"--font-sans",
		"--leading-tight",
		"--line",
		"--line-2",
		"--radius-md",
		"--ring",
		"--space-1",
		"--space-2",
		"--text-sm",
		"--text-xs",
		"--weight-medium",
	],
	composition: [
		"Lay a grid of them out to let someone choose a theme by eye rather than by name.",
		"Pair with `<xtyle-theme-scope>`: the card previews an invocation, the scope applies the one that was chosen.",
		"Listen for `select` to drive the choice; the event carries the card's `name`, `algorithm`, and `scheme`.",
		"Override the `component.theme-card` fill to redraw the fake when an app wants a different preview.",
	],
	a11y: [
		"Under `interactive` the card is a real `<button>` with `aria-pressed`, so it is reachable, announced, and operable from the keyboard.",
		"The fake is decorative (`aria-hidden`); the card's accessible name carries the theme's name, algorithm, and scheme instead.",
		"A static card is a labelled group rather than a control, so it is never a focus stop that does nothing.",
		"The focus ring is the shared `--ring` token, consistent with every other control.",
	],
	examples: [
		{
			id: "previews-and-picking",
			title: "Previews, a seeded invocation, and a selectable row",
			description: "Cards previewing the blessed algorithms, one seeded and pinned light, and an interactive row that reports what was chosen.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
	],
};
