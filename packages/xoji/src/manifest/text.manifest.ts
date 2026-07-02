import type { ComponentManifest } from "./types.js";
import { FULL_TONES } from "../vocab.js";

/** The on-surface chromatic ink each tone resolves to; AA-clean against `--bg-0`. */
const toneVividTokens = FULL_TONES.map((t) => `--${t}-vivid`);

const htmlExample = `<xoji-text>The quiet default: body copy at comfortable measure.</xoji-text>

<xoji-text size="lg" weight="semibold">A lead paragraph that sets up the section.</xoji-text>

<xoji-text tone="muted" size="sm">A muted aside, dialed down a notch.</xoji-text>

<xoji-text as="span" tone="subtle" size="xs">inline fine print</xoji-text>

<xoji-text mono size="sm">npm install @xoji/core</xoji-text>`;

const svelteExample = `<script lang="ts">
	import { Text } from "@xoji/svelte";
</script>

<Text>The quiet default: body copy at comfortable measure.</Text>

<Text size="lg" weight="semibold">A lead paragraph that sets up the section.</Text>

<Text tone="muted" size="sm">A muted aside, dialed down a notch.</Text>

<Text as="span" tone="subtle" size="xs">inline fine print</Text>

<Text mono size="sm">npm install @xoji/core</Text>`;

const astroExample = `---
import { Text } from "@xoji/astro";
---

<Text>The quiet default: body copy at comfortable measure.</Text>

<Text size="lg" weight="semibold">A lead paragraph that sets up the section.</Text>

<Text tone="muted" size="sm">A muted aside, dialed down a notch.</Text>

<Text as="span" tone="subtle" size="xs">inline fine print</Text>

<Text mono size="sm">npm install @xoji/core</Text>`;

export const textManifest: ComponentManifest = {
	id: "text",
	name: "Text",
	category: "data-display",
	summary: "A body-text primitive: paragraph or inline span across four sizes, four weights, three leadings, and four tones.",
	description:
		"Text is the primitive for running copy. It renders a block `<p>` by default or an inline `<span>` via the `as` prop, then tunes appearance along four independent axes: `size` (xs, sm, body, lg), `weight` (normal, medium, semibold, bold), `leading` (tight, snug, loose), and `tone`. A `mono` flag swaps the family to the monospace stack for inline code and tabular figures. Every axis maps to a design token, so a paragraph picks up the active theme's type scale and ink ladder without any local color: the `default`/`muted`/`subtle` emphasis tones read as `--fg-0`/`--fg-2`/`--fg-3`, and the full color roster (every semantic role, accent variant, or named hue) paints the copy in that tone's on-surface ink, derived to stay legible against the page.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "text",
			description: "The paragraph or span element carrying the size, weight, leading, tone, and mono classes; exposed as `::part(text)` for a consumer-side color override.",
			selector: ".xoji-text",
			tokens: ["--font-sans", "--text-body", "--weight-normal", "--leading-normal", "--fg-0"],
		},
	],
	props: [
		{
			name: "as",
			type: "TextAs",
			default: "p",
			description: "The element to render: a block paragraph or an inline span.",
			bindings: ["html", "svelte", "astro"],
			options: ["p", "span"],
		},
		{
			name: "size",
			type: "TextSize",
			default: "body",
			description: "Type scale step. `body` is the default and emits no class.",
			bindings: ["html", "svelte", "astro"],
			options: ["xs", "sm", "body", "lg"],
		},
		{
			name: "weight",
			type: "TextWeight",
			default: "normal",
			description: "Font weight. `normal` is the default and emits no class.",
			bindings: ["html", "svelte", "astro"],
			options: ["normal", "medium", "semibold", "bold"],
		},
		{
			name: "leading",
			type: "TextLeading",
			default: "snug",
			description: "Line height. `snug` is the default (maps to `--leading-normal`) and emits no class.",
			bindings: ["html", "svelte", "astro"],
			options: ["tight", "snug", "loose"],
		},
		{
			name: "tone",
			type: "TextTone",
			default: "default",
			description: "Ink: the `default`/`muted`/`subtle` emphasis ramp off the foreground, or any tone in the full roster (semantic role, accent variant, or named hue) for colored copy in that tone's on-surface ink. `default` emits no class.",
			bindings: ["html", "svelte", "astro"],
			options: ["default", "muted", "subtle", ...FULL_TONES],
		},
		{
			name: "mono",
			type: "boolean",
			default: "false",
			description: "Switches the font family to the monospace stack for inline code and tabular figures.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [
		{
			name: "default",
			description: "Primary ink at full strength; the standard reading tone.",
			className: "xoji-text",
			tokens: ["--fg-0"],
		},
		{
			name: "muted",
			description: "A step down the ink ladder for secondary copy and asides.",
			className: "xoji-text--muted",
			tokens: ["--fg-2"],
		},
		{
			name: "subtle",
			description: "The quietest ink: captions, fine print, and metadata.",
			className: "xoji-text--subtle",
			tokens: ["--fg-3"],
		},
		{
			name: "accent",
			description: "Accent-colored ink for a highlighted word, link-like emphasis, or a figure; the first stop of the full tone roster, which paints any run in a tone's on-surface `--{tone}-vivid` ink.",
			className: "xoji-text--accent",
			tokens: ["--accent-vivid"],
		},
		{
			name: "mono",
			description: "Monospace family for inline code and tabular figures; composes with any tone or size.",
			className: "xoji-text--mono",
			tokens: ["--font-mono"],
		},
	],
	sizes: [
		{ name: "xs", description: "Smallest: fine print.", className: "xoji-text--xs" },
		{ name: "sm", description: "Small: secondary copy.", className: "xoji-text--sm" },
		{ name: "body", description: "Default reading size.", className: "xoji-text", isDefault: true },
		{ name: "lg", description: "Large: lead paragraphs.", className: "xoji-text--lg" },
	],
	states: [],
	slots: [
		{
			name: "default",
			description: "The text content.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	consumedTokens: [
		"--fg-0",
		"--fg-2",
		"--fg-3",
		...toneVividTokens,
		"--font-mono",
		"--font-sans",
		"--leading-loose",
		"--leading-normal",
		"--leading-tight",
		"--text-body",
		"--text-lg",
		"--text-sm",
		"--text-xs",
		"--weight-bold",
		"--weight-medium",
		"--weight-normal",
		"--weight-semibold",
	],
	composition: [
		"Pair with Heading for titles; Text carries the running copy beneath them.",
		"Use `mono` for inline code spans; for code blocks reach for a dedicated Code component once it lands.",
		"Compose `tone=\"subtle\"` with `size=\"xs\"` for captions and metadata under cards and figures.",
		"A colored tone renders in its on-surface `--{tone}-vivid` ink by contract. To pin text to a tone's base shade instead, style `::part(text)` from the consumer side: `xoji-text::part(text) { color: var(--accent) }`. A per-instance custom property set on the host does not reach the inner element's own token register, so `::part` is the reliable seam for a one-off color.",
	],
	a11y: [
		"Renders a native `<p>` or `<span>`, so the semantics carry meaning; no ARIA needed.",
		"Tone is purely visual; the ink ladder (default / muted / subtle) is derived to stay legible against the theme's surfaces, never below contrast thresholds.",
		"`mono` changes only the font family, not the accessible text, so screen readers announce the content unchanged.",
		"Choose `as=\"span\"` only for genuinely inline runs; block copy should stay a `<p>` so structure is conveyed.",
	],
	examples: [
		{
			id: "sizes-tones-and-mono",
			title: "Sizes, tones, and mono",
			description: "The four axes are independent: size, weight, leading, and tone mix freely, and `mono` layers on top.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
	],
};
