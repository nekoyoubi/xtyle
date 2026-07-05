import type { ComponentManifest } from "./types.js";
import { FULL_TONES } from "../vocab.js";

/** The on-surface chromatic ink each tone resolves to; AA-clean against `--bg-0`. */
const toneVividTokens = FULL_TONES.map((t) => `--${t}-vivid`);

const htmlExample = `<xtyle-eyebrow>Themable-derivation engine</xtyle-eyebrow>

<xtyle-eyebrow tone="muted" tracking="wide">By the numbers</xtyle-eyebrow>

<xtyle-eyebrow tone="success">Now shipping</xtyle-eyebrow>`;

const svelteExample = `<script lang="ts">
	import { Eyebrow } from "@xtyle/svelte";
</script>

<Eyebrow>Themable-derivation engine</Eyebrow>

<Eyebrow tone="muted" tracking="wide">By the numbers</Eyebrow>

<Eyebrow tone="success">Now shipping</Eyebrow>`;

const astroExample = `---
import { Eyebrow } from "@xtyle/astro";
---

<Eyebrow>Themable-derivation engine</Eyebrow>

<Eyebrow tone="muted" tracking="wide">By the numbers</Eyebrow>

<Eyebrow tone="success">Now shipping</Eyebrow>`;

export const eyebrowManifest: ComponentManifest = {
	id: "eyebrow",
	name: "Eyebrow",
	category: "content",
	summary: "The small uppercase kicker that sits above a heading.",
	description:
		"Eyebrow is the overline a section wears above its title: short, uppercase, tracked-out, and accent-toned by default. It is one element with no layout of its own: drop it as the first child of a `Stack` and the gap does the spacing. `tone` swaps the accent ink for a quieter `muted` or `subtle`, or for any tone in the full roster (every semantic role, accent variant, or named hue) so a kicker can carry a status color, in that tone's on-surface ink derived to stay legible against the page. `tracking` widens the letter-spacing for a more deliberate label. Choose the `as` element to match the surrounding flow: a `p` for a standalone kicker, a `span` for one inline with other text.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "eyebrow",
			description: "The kicker root carrying the tone and tracking classes.",
			selector: ".xtyle-eyebrow",
			tokens: ["--font-sans", "--text-xs", "--weight-semibold", "--leading-tight", "--accent-vivid"],
		},
	],
	props: [
		{
			name: "as",
			type: "EyebrowTag",
			default: "p",
			description: "The element to render: a block `p`/`div` kicker or an inline `span`.",
			bindings: ["html", "svelte", "astro"],
			options: ["p", "span", "div"],
		},
		{
			name: "tone",
			type: "EyebrowTone",
			default: "accent",
			description: "Ink: accent by default, a quieter `muted` / `subtle`, or any tone in the full roster (semantic role, accent variant, or named hue) for a status-colored kicker in that tone's on-surface ink.",
			bindings: ["html", "svelte", "astro"],
			options: ["muted", "subtle", ...FULL_TONES],
		},
		{
			name: "tracking",
			type: "EyebrowTracking",
			default: "normal",
			description: "Letter-spacing: `normal` (0.08em) or `wide` (0.12em) for a more deliberate label.",
			bindings: ["html", "svelte", "astro"],
			options: ["normal", "wide"],
		},
	],
	variants: [],
	sizes: [],
	states: [],
	slots: [
		{
			name: "default",
			description: "The kicker text.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	consumedTokens: [
		"--font-sans",
		"--text-xs",
		"--weight-semibold",
		"--leading-tight",
		"--fg-2",
		"--fg-3",
		...toneVividTokens,
	],
	composition: [
		"Lead a `Section` or a `Card` header with an Eyebrow, then a `Heading`, then `Text`: a three-step hierarchy with no bespoke CSS.",
		"Inside a gap-controlled `Stack`, the Eyebrow needs no margin; the stack's gap sets the rhythm.",
		"Use `tone=\"muted\"` where an accent kicker would compete with nearby accent color.",
	],
	a11y: [
		"An eyebrow is a visual label, not a heading. Keep the real `Heading` directly after it so the document outline stays correct.",
		"The uppercasing is presentational (`text-transform`); the accessible text keeps its authored casing for screen readers.",
	],
	examples: [
		{
			id: "tones-and-tracking",
			title: "Tones and tracking",
			description: "The accent default against the muted emphasis tone and a status color from the full roster, at both tracking widths.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
	],
};
