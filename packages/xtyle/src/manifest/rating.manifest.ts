import type { ComponentManifest } from "./types.js";
import { PALETTES } from "../series.js";

const htmlExample = `<xtyle-rating value="3" label="Rate this product"></xtyle-rating>

<xtyle-rating value="4.5" readonly label="4.5 out of 5 stars"></xtyle-rating>

<xtyle-rating value="4" icon="heart" tone="red" label="Rate this recipe"></xtyle-rating>

<xtyle-rating value="3.5" allowhalf label="Rate this stay"></xtyle-rating>

<xtyle-rating value="4" icon="crest--shield-c1--star-s45-cf" colors="skittles" label="Rate this guild"></xtyle-rating>

<form>
	<xtyle-rating value="4" name="score" label="Rate this stay"></xtyle-rating>
</form>

<xtyle-rating value="7" max="10" size="sm" readonly label="7 out of 10"></xtyle-rating>`;

const svelteExample = `<script lang="ts">
	import { Rating } from "@xtyle/svelte";

	let score = $state(3);
</script>

<Rating bind:value={score} label="Rate this product" />

<Rating value={4.5} readonly label="4.5 out of 5 stars" />

<Rating value={4} icon="heart" tone="red" label="Rate this recipe" />

<Rating value={3.5} allowHalf label="Rate this stay" />

<Rating value={4} icon="crest--shield-c1--star-s45-cf" colors="skittles" label="Rate this guild" />

<form>
	<Rating value={4} name="score" label="Rate this stay" />
</form>

<Rating value={7} max={10} size="sm" readonly label="7 out of 10" />`;

const astroExample = `---
import Rating from "@xtyle/astro/Rating.astro";
---

<Rating value={3} label="Rate this product" />

<Rating value={4.5} readonly label="4.5 out of 5 stars" />

<Rating value={4} icon="heart" tone="red" label="Rate this recipe" />

<Rating value={3.5} allowHalf label="Rate this stay" />

<Rating value={4} icon="crest--shield-c1--star-s45-cf" colors="skittles" label="Rate this guild" />

<form>
	<Rating value={4} name="score" label="Rate this stay" />
</form>

<Rating value={7} max={10} size="sm" readonly label="7 out of 10" />`;

export const ratingManifest: ComponentManifest = {
	id: "rating",
	name: "Rating",
	since: "0.6.0",
	category: "control",
	keywords: ["stars", "star rating", "score", "review", "vote", "rank"],
	seeAlso: ["icon", "slider"],
	summary: "A rating control — interactive or read-only — that scores with any icon and shows fractional values as a partial icon.",
	description:
		"Rating draws `max` icons and overlays a colored copy clipped to `value / max`, so a fractional value like 4.5 shows an exact partial icon rather than rounding. It renders two rows: a neutral **base** row (the icon silhouetted to a muted track color) and a **filled** row (the icon in full color) clipped to the value fraction. Both rows are the component's fill, not markup the element hardcodes, so a mod filling `component.rating` can swap the star for a heart, clip the fill by mask or by count instead of by width, or restructure the row entirely — the element keeps the value, the keys, the pointer, and the ARIA either way. Any icon works: the default `star`, any functional glyph (`heart`, `bolt`, …), or a composed colorful mark spec (`taco--…`), drawn through the icon system. A monochrome glyph takes its fill from `tone` (a register hue), a colorful mark draws its palette from `colors`. By default it is an interactive slider — focusable, `role=\"slider\"`, driven by pointer drag, click, and Arrow/Home/End keys, with a hover preview, firing `input` and `change` and posting through a hidden input when `name` is set. Add `readonly` and it becomes a fixed `role=\"img\"` display for an average score, a product rating, a survey result. The element's own text is the no-JS fallback and the accessible label. Override `--rating-track` (base color, defaults to `--neutral-bg`) or `--rating-fill` (fill color, defaults to `--accent`) per instance to retune it.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "root",
			description:
				"The control wrapper. Sizes the icons, stacks the two rows, and carries the interactive class, focus ring, and the `--rating-track` / `--rating-fill` override vars.",
			selector: ".xtyle-rating",
			tokens: ["--neutral-bg", "--accent", "--text-lg", "--ring", "--radius-sm", "--border-thick"],
		},
		{
			name: "rows",
			description:
				"The fill's own region, holding whatever rows it draws. Laid out as `display: contents` so the rows are the control's own flex children; a mod filling `component.rating` renders into it.",
			selector: ".xtyle-rating__rows",
			tokens: [],
		},
		{
			name: "row",
			description:
				"The base row of silhouetted icons (`part=\"track\"`); sets the neutral track color (`--rating-track`) and the overall size. A real node the fill renders, so a mod can restructure it.",
			selector: ".xtyle-rating__row--empty",
			tokens: ["--neutral-bg"],
		},
		{
			name: "fill",
			description:
				"The full-color copy of the row (`part=\"fill\"`), clipped by width to the value fraction and laid over the base row. The element writes the hover preview to whatever node carries `part=\"fill\"`, so a mod that keeps the part keeps the preview.",
			selector: ".xtyle-rating__row--filled",
			tokens: ["--accent"],
		},
	],
	props: [
		{
			name: "value",
			type: "number",
			default: "0",
			description: "The rating. Fractional values render a partial icon; clamped to `0..max`. Two-way bindable in Svelte.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "max",
			type: "number",
			default: "5",
			description: "How many icons to draw.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "icon",
			type: "string",
			default: "star",
			description:
				"The icon to rate with: `star` (default), any functional glyph by name (`heart`, `bolt`, …), or a composed mark spec (a `--` name like `taco--…`) for a colorful multi-layer mark.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "readonly",
			type: "boolean",
			default: "false",
			description:
				"Renders a fixed, fractional display (`role=\"img\"`) instead of the interactive slider. Omit it (the default) for an editable control.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "allowHalf",
			type: "boolean",
			default: "false",
			description: "Snaps interactive input (pointer and keys) to half steps instead of whole ones. Attribute is `allowhalf`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "tone",
			type: "string",
			description: "Fill hue for a monochrome icon: a register token name (`accent`, `success`, `red`, …). Sets `--rating-fill`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "colors",
			type: "Palette",
			default: "accents",
			description: "The palette a colorful mark spec draws its colors from (`accents`, `skittles`, …).",
			bindings: ["html", "svelte", "astro"],
			options: [...PALETTES],
		},
		{
			name: "size",
			type: "Size",
			default: "md",
			description: "Icon size: `sm`, `md`, or `lg`.",
			bindings: ["html", "svelte", "astro"],
			options: ["sm", "md", "lg"],
		},
		{
			name: "name",
			type: "string",
			description: "Form field name; when set (and interactive), the current value posts through a hidden input.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "label",
			type: "string",
			description: "Accessible label. Defaults to the element's text content, then to a generated `\"{value} out of {max} stars\"`.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [],
	sizes: [
		{ name: "sm", description: "Small icons.", className: "xtyle-rating--sm" },
		{ name: "md", description: "Default.", className: "xtyle-rating", isDefault: true },
		{ name: "lg", description: "Large icons.", className: "xtyle-rating--lg" },
	],
	states: [
		{
			name: "interactive",
			description: "Editable (the default, `readonly` absent): `role=\"slider\"`, focusable, pointer- and key-driven, with a pointer cursor.",
			selector: ".xtyle-rating--interactive",
			tokens: [],
		},
		{
			name: "hover",
			description: "Pointer over an interactive control: the filled row previews the value under the cursor without committing it.",
			selector: ".xtyle-rating--interactive:hover",
			tokens: [],
		},
		{
			name: "focus-visible",
			description: "Keyboard focus on an interactive control: a token-colored ring around the rounded control.",
			selector: ".xtyle-rating--interactive:focus-visible",
			tokens: ["--ring", "--radius-sm", "--border-thick"],
		},
		{
			name: "readonly",
			description: "Non-interactive display (`readonly` set): a fixed `role=\"img\"` with no cursor, tab stop, or events.",
			selector: ".xtyle-rating:not(.xtyle-rating--interactive)",
			tokens: [],
		},
	],
	slots: [
		{
			name: "default",
			description: "The no-JS fallback text, adopted as the accessible label. Give a human-readable score or prompt like `4.5 out of 5` or `Rate this product`.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	consumedTokens: ["--accent", "--neutral-bg", "--ring", "--text-lg", "--text-sm", "--text-2xl", "--radius-sm", "--border-thick"],
	composition: [
		"Leave it interactive to collect a rating in a form; pair it with a `name` so the value posts, or bind `value` in Svelte.",
		"Add `readonly` beside a product title with the numeric score and review count for a summary row.",
		"Swap `icon` (a `heart` with `tone=\"red\"`, a `bolt`, a colorful mark) so the rating matches the thing being rated.",
		"Use `size=\"sm\"` inside a dense list of results, `lg` for a hero or a single featured review.",
		"The star row is the fill's markup: a mod filling `component.rating` can rate in hearts, in discrete lit glyphs instead of a clipped overlay, or in a shape of its own, and the value, keys, ARIA, and form posting all keep working.",
	],
	a11y: [
		"Interactive, it is a `role=\"slider\"` with `aria-valuemin`/`aria-valuemax`/`aria-valuenow`/`aria-valuetext` kept in sync, focusable, and driven by Arrow keys (by step), Home/End (to min/max), plus pointer drag and click.",
		"Read-only, it is a single `role=\"img\"` with a text label, so assistive tech announces the score once (\"4.5 out of 5 stars\") instead of reading each icon; the icon glyphs are decorative and `aria-hidden`.",
		"The value is carried by the label, not by color alone, so a color-deficient user gets the same information.",
		"With `name` set, an interactive control writes its value to a hidden input so it participates in form submission.",
		"With no JavaScript the fallback text stays visible, so the score or prompt is never lost behind the enhancement.",
	],
	examples: [
		{
			id: "interactive-and-icons",
			title: "Interactive, read-only, and custom icons",
			description:
				"An editable star rating, a fractional read-only score, a heart rating tinted red, a half-step control, a colorful mark drawn from a palette, a form-posting control, and a compact 10-point display.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
	],
};
