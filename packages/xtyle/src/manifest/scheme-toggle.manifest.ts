import type { ComponentManifest } from "./types.js";

const htmlExample = `<!-- Standalone: flips :root[data-scheme] and persists the choice -->
<xtyle-scheme-toggle></xtyle-scheme-toggle>

<!-- Custom glyphs (any named xtyle icon) and a reversed display -->
<xtyle-scheme-toggle
	light-icon="light-theme--sun-c3--circle-s65-ko--circle-s55-c3---ps-skittles"
	dark-icon="dark-theme--circle-c3--circle-x20-y-10-s80-ko---ps-skittles"
	reverse
></xtyle-scheme-toggle>

<!-- A toolbar icon: no chrome of its own, so the glyph owns the box -->
<xtyle-scheme-toggle variant="link" icon-size="lg"></xtyle-scheme-toggle>

<!-- Inside a theme scope: drives the scope, which re-derives the active theme -->
<xtyle-theme-scope>
	<xtyle-scheme-toggle variant="subtle" label="Switch theme mode"></xtyle-scheme-toggle>
</xtyle-theme-scope>`;

const svelteExample = `<script lang="ts">
	import { SchemeToggle } from "@xtyle/svelte";
</script>

<SchemeToggle label="Switch theme mode" />

<!-- reversed display on a subtle-variant button -->
<SchemeToggle reverse variant="subtle" />

<!-- custom glyphs: any named xtyle icon -->
<SchemeToggle lightIcon="palette" darkIcon="bookmark" />

<!-- a toolbar icon: chrome-free, so the glyph owns the box -->
<SchemeToggle variant="link" iconSize="lg" />`;

const astroExample = `---
import SchemeToggle from "@xtyle/astro/SchemeToggle.astro";
---

<SchemeToggle label="Switch theme mode" />

<!-- reversed display on a subtle-variant button -->
<SchemeToggle reverse variant="subtle" />

<!-- custom glyphs: any named xtyle icon -->
<SchemeToggle lightIcon="palette" darkIcon="bookmark" />

<!-- a toolbar icon: chrome-free, so the glyph owns the box -->
<SchemeToggle variant="link" iconSize="lg" />`;

export const schemeToggleManifest: ComponentManifest = {
	id: "scheme-toggle",
	name: "Scheme Toggle",
	since: "0.10.0",
	category: "control",
	keywords: ["theme", "dark mode", "light mode", "scheme", "toggle", "sun", "moon", "appearance", "reverse"],
	seeAlso: ["button", "switch"],
	summary: "A sun/moon control that flips the active light/dark scheme.",
	description:
		"Scheme Toggle is the dark/light switch, and it *is* an icon-only `<xtyle-button>` — it composes the button rather than reinventing a control, so it inherits its variants, sizes, focus ring, hover, and mods for free. Inside an `<xtyle-theme-scope>` it drives the scope, which re-derives the active theme through the engine's inversion so every surface lands where the algorithm places it for the opposite mode. Standalone, with no scope in sight, it flips `:root[data-scheme]`, persists the choice to `localStorage` (key `storage-key`, default `xtyle.scheme`), and fires an `xtyle:scheme-change` event. The glyph follows the convention of showing the mode you'd switch *to* — a sun while dark, a moon while light. `light-icon` and `dark-icon` swap either glyph for any named xtyle icon, and `reverse` flips the convention to show the mode you're currently *in* (for the contrarians).",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "control",
			description: "The composed icon-only `<xtyle-button>` that flips the scheme on click.",
			selector: ".xtyle-scheme-toggle > xtyle-button",
		},
		{
			name: "light",
			description: "The light-face glyph (default a sun), shown while dark unless `reverse` is set.",
			selector: ".xtyle-scheme-toggle__light",
		},
		{
			name: "dark",
			description: "The dark-face glyph (default a moon), shown while light unless `reverse` is set.",
			selector: ".xtyle-scheme-toggle__dark",
		},
	],
	props: [
		{
			name: "scheme",
			type: "\"light\" | \"dark\"",
			description: "Pins the shown scheme. Omit to track the scope (when scoped) or `:root[data-scheme]` (standalone, defaulting to dark).",
			bindings: ["html", "svelte", "astro"],
			options: ["light", "dark"],
		},
		{
			name: "lightIcon",
			type: "string",
			description: "A named xtyle icon for the light face, replacing the built-in sun.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "darkIcon",
			type: "string",
			description: "A named xtyle icon for the dark face, replacing the built-in moon.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "iconSize",
			type: "IconSize",
			default: "md",
			description: "The glyph's size, independent of the control's. A chrome-free toolbar button often wants a large glyph in a small box, which the button's own `size` cannot express.",
			bindings: ["html", "svelte", "astro"],
			options: ["sm", "md", "lg", "xl"],
		},
		{
			name: "reverse",
			type: "boolean",
			default: "false",
			description: "Show the mode you're currently in rather than the one you'd switch to.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "variant",
			type: "ButtonVariant",
			default: "ghost",
			description: "The underlying button's variant (`ghost`, `subtle`, `outline`, `solid`, `link`).",
			bindings: ["html", "svelte", "astro"],
			options: ["solid", "outline", "ghost", "subtle", "link"],
		},
		{
			name: "size",
			type: "Size",
			description: "The underlying button's size (`sm`, `md`, `lg`).",
			bindings: ["html", "svelte", "astro"],
			options: ["sm", "md", "lg"],
		},
		{
			name: "label",
			type: "string",
			default: "Toggle light and dark mode",
			description: "Accessible name for the button, used as its `aria-label`.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	events: [
		{ name: "xtyle:scheme-change", detail: "{ scheme }", description: "The colour scheme was switched.", bindings: ["html", "astro"] },
	],
	variants: [],
	sizes: [],
	states: [
		{
			name: "dark",
			description: "The scheme is dark; the light-face glyph shows (or the dark one under `reverse`).",
			selector: ".xtyle-scheme-toggle--dark",
		},
		{
			name: "light",
			description: "The scheme is light; the dark-face glyph shows (or the light one under `reverse`).",
			selector: ".xtyle-scheme-toggle--light",
		},
		{
			name: "reverse",
			description: "The display is flipped to show the current mode rather than the switch-to mode.",
			selector: ".xtyle-scheme-toggle--reverse",
		},
	],
	slots: [],
	consumedTokens: [],
	composition: [
		"Drop it bare into any page for a working dark/light switch that persists across reloads and drives the site's inverted stylesheet.",
		"Wrap it (and a `<xtyle-theme-picker>`) in a `<xtyle-theme-scope>` when the app derives themes live, so the toggle re-derives the active theme rather than swapping a prebuilt stylesheet.",
		"It composes `<xtyle-button>`, so `variant` and `size` reach straight through to the button, and a Button mod restyles the toggle with it.",
		"Swap the glyphs with `light-icon` / `dark-icon` for any named xtyle icon, and listen for `xtyle:scheme-change` to mirror the choice elsewhere when running standalone.",
	],
	a11y: [
		"Composes an icon-only `<xtyle-button>` with an `aria-label`, so it is a real, reachable, announced button.",
		"Only one glyph is shown at a time, and both are decorative (`aria-hidden`); the button's label carries the meaning, not the icon.",
		"Focus, hover, and the focus ring come from the composed button, consistent with every other control.",
	],
	examples: [
		{
			id: "standalone-icons-reverse",
			title: "Standalone, custom icons, and reversed",
			description: "A bare toggle that flips the document scheme, one with custom glyphs and a reversed display, and one inside a theme scope.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
	],
};
