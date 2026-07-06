import type { ComponentManifest } from "./types.js";

const htmlExample = `<xtyle-rating value="4.5" max="5">4.5 out of 5 stars</xtyle-rating>`;

const svelteExample = `<script lang="ts">
	import { Rating } from "@xtyle/svelte";
</script>

<Rating value={4.5} label="4.5 out of 5 stars" />`;

const astroExample = `---
import Rating from "@xtyle/astro/Rating.astro";
---

<Rating value={4.5} label="4.5 out of 5 stars" />`;

export const ratingManifest: ComponentManifest = {
	id: "rating",
	name: "Rating",
	since: "0.6.0",
	category: "content",
	summary: "A read-only star rating that shows a fractional value as a partial star.",
	description:
		"Rating displays a score as a row of stars. It draws `max` stars and overlays a filled copy clipped to `value / max`, so a fractional value like 4.5 shows an exact half star rather than rounding. It is read-only: a display for an average review score, a product rating, a survey result. The element's own text is the no-JS fallback and becomes the accessible label once it upgrades, so a screen reader hears \"4.5 out of 5 stars\" while sighted users see the stars, and the stars themselves are hidden from assistive tech. The filled stars take the accent and the empty ones a muted surface, both from the derived register.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "row",
			description: "The base row of empty stars; sets the muted color and the overall size.",
			selector: ".xtyle-rating__row",
			tokens: ["--fg-disabled", "--text-lg"],
		},
		{
			name: "fill",
			description: "The accent-colored copy of the row, clipped to the value fraction and laid over the empty row.",
			selector: ".xtyle-rating__row--filled",
			tokens: ["--accent"],
		},
	],
	props: [
		{
			name: "value",
			type: "number",
			default: "0",
			description: "The rating to show. Fractional values render a partial star; clamped to `0..max`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "max",
			type: "number",
			default: "5",
			description: "How many stars to draw.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "size",
			type: "Size",
			default: "md",
			description: "Star size: `sm`, `md`, or `lg`.",
			bindings: ["html", "svelte", "astro"],
			options: ["sm", "md", "lg"],
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
		{ name: "sm", description: "Small stars.", className: "xtyle-rating--sm" },
		{ name: "md", description: "Default.", className: "xtyle-rating", isDefault: true },
		{ name: "lg", description: "Large stars.", className: "xtyle-rating--lg" },
	],
	states: [],
	slots: [
		{
			name: "default",
			description: "The no-JS fallback text, adopted as the accessible label. Give a human-readable score like `4.5 out of 5`.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	consumedTokens: ["--accent", "--fg-disabled", "--text-lg", "--text-sm", "--text-2xl"],
	composition: [
		"Put it beside a product title with the numeric score and review count for a summary row.",
		"Use `size=\"sm\"` inside a dense list of results, `lg` for a hero or a single featured review.",
		"Drive `value` from an aggregate so the partial star reflects the real average, not a rounded one.",
	],
	a11y: [
		"It exposes itself as a single `role=\"img\"` with a text label, so assistive tech announces the score once (\"4.5 out of 5 stars\") instead of reading each star.",
		"The score is carried by the label, not by color alone, so a color-deficient user gets the same value; the star glyphs are decorative and `aria-hidden`.",
		"With no JavaScript the fallback text stays visible, so the score is never lost behind the enhancement.",
	],
	examples: [
		{
			id: "score",
			title: "Average score",
			description: "A fractional rating shown as a partial star, at three sizes.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
	],
};
