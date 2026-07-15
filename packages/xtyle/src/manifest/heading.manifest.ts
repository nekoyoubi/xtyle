import type { ComponentManifest } from "./types.js";
import { FULL_TONES } from "../vocab.js";

/** The on-surface chromatic ink each tone resolves to; AA-clean against `--bg-0`. */
const toneVividTokens = FULL_TONES.map((t) => `--${t}-vivid`);

const htmlExample = `<xtyle-heading level="1" size="3xl">Themable derivation</xtyle-heading>

<xtyle-heading level="2" size="xl">The algorithm is the asset</xtyle-heading>

<xtyle-heading level="3" size="lg" tone="muted">A theme is the print</xtyle-heading>

<xtyle-heading level="2" size="sm" tone="danger">Breaking change</xtyle-heading>`;

const svelteExample = `<script lang="ts">
	import { Heading } from "@xtyle/svelte";
</script>

<Heading level={1} size="3xl">Themable derivation</Heading>

<Heading level={2} size="xl">The algorithm is the asset</Heading>

<Heading level={3} size="lg" tone="muted">A theme is the print</Heading>

<Heading level={2} size="sm" tone="danger">Breaking change</Heading>`;

const astroExample = `---
import { Heading } from "@xtyle/astro";
---

<Heading level={1} size="3xl">Themable derivation</Heading>

<Heading level={2} size="xl">The algorithm is the asset</Heading>

<Heading level={3} size="lg" tone="muted">A theme is the print</Heading>

<Heading level={2} size="sm" tone="danger">Breaking change</Heading>`;

export const headingManifest: ComponentManifest = {
	id: "heading",
	name: "Heading",
	category: "content",
	since: "0.1.0",
	keywords: ["title", "headline", "h1", "h2", "display text"],
	seeAlso: ["text", "eyebrow", "hero"],
	summary: "A semantic section heading whose visual size is decoupled from its document level.",
	description:
		"Heading renders a native `<h1>`–`<h6>` chosen by `level`, while `size` sets the visual scale independently across seven steps (xs, sm, body, lg, xl, 2xl, 3xl). That split lets the document outline stay correct (an `<h2>` deep in a page) while the type still reads at whatever weight the layout wants (small label, or a hero at 3xl), so a site can stop faking type with raw tags and ad-hoc font sizes. The `tone` axis sets the ink: `default`, `muted`, and `subtle` walk down the foreground ramp for primary titles, secondary headings, and quiet labels; the full color roster (every semantic role, accent variant, or named hue) paints a colored heading in that tone's on-surface ink, derived to stay legible against the page. The display font carries every step.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "heading",
			description: "The native heading element (`<h1>`–`<h6>`) carrying the size and tone classes; exposed as `::part(heading)` for a consumer-side color override.",
			selector: ".xtyle-heading",
			tokens: [
				"--font-display",
				"--text-body",
				"--weight-bold",
				"--leading-tight",
				"--fg-0",
			],
		},
	],
	props: [
		{
			name: "level",
			type: "HeadingLevel",
			default: "2",
			description: "Document heading level: picks the `<h1>`–`<h6>` tag. Drives the outline, not the size.",
			bindings: ["html", "svelte", "astro"],
			options: ["1", "2", "3", "4", "5", "6"],
		},
		{
			name: "size",
			type: "HeadingSize",
			default: "derived from level",
			description: "Visual type scale, independent of `level`. Unset, it derives from `level` (1→3xl, 2→2xl, 3→xl, 4→lg, 5→body, 6→sm); set it to override, up to the `4xl`/`5xl` display steps for hero titles.",
			bindings: ["html", "svelte", "astro"],
			options: ["xs", "sm", "md", "body", "lg", "xl", "2xl", "3xl", "4xl", "5xl"],
		},
		{
			name: "tone",
			type: "HeadingTone",
			default: "default",
			description: "Heading ink: the `default`/`muted`/`subtle` emphasis ramp off the foreground, or any tone in the full roster (semantic role, accent variant, or named hue) for a colored heading in that tone's on-surface ink.",
			bindings: ["html", "svelte", "astro"],
			options: ["default", "muted", "subtle", ...FULL_TONES],
		},
	],
	variants: [
		{
			name: "default",
			description: "Primary heading ink: full-strength foreground.",
			className: "xtyle-heading--default",
			tokens: ["--fg-0"],
		},
		{
			name: "muted",
			description: "Secondary ink for supporting headings.",
			className: "xtyle-heading--muted",
			tokens: ["--fg-2"],
		},
		{
			name: "subtle",
			description: "Quiet ink for eyebrow and section labels.",
			className: "xtyle-heading--subtle",
			tokens: ["--fg-3"],
		},
		{
			name: "accent",
			description: "Accent-colored ink for a highlighted title or a metric figure; the first stop of the full tone roster, which paints any heading in a tone's on-surface `--{tone}-vivid` ink.",
			className: "xtyle-heading--accent",
			tokens: ["--accent-vivid"],
		},
	],
	sizes: [
		{ name: "xs", description: "Smallest; a quiet label.", className: "xtyle-heading--xs" },
		{ name: "sm", description: "Compact heading.", className: "xtyle-heading--sm" },
		{ name: "body", description: "Body-scale heading; the derived default at `level` 5.", className: "xtyle-heading" },
		{ name: "lg", description: "Large; section titles.", className: "xtyle-heading--lg" },
		{ name: "xl", description: "Extra large; page titles.", className: "xtyle-heading--xl" },
		{ name: "2xl", description: "Display; section heroes.", className: "xtyle-heading--2xl" },
		{ name: "3xl", description: "Hero; page heroes.", className: "xtyle-heading--3xl" },
		{ name: "4xl", description: "Oversized; for hero titles.", className: "xtyle-heading--4xl" },
		{ name: "5xl", description: "Largest step; for landing-page headlines.", className: "xtyle-heading--5xl" },
	],
	states: [],
	slots: [
		{
			name: "default",
			description: "The heading text.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	consumedTokens: [
		"--font-display",
		"--text-xs",
		"--text-sm",
		"--text-body",
		"--text-lg",
		"--text-xl",
		"--text-2xl",
		"--text-3xl",
		"--text-4xl",
		"--text-5xl",
		"--weight-bold",
		"--weight-semibold",
		"--leading-tight",
		"--leading-normal",
		"--fg-0",
		"--fg-2",
		"--fg-3",
		...toneVividTokens,
	],
	composition: [
		"Pair with Text for the body copy beneath a heading; the two share the foreground ramp.",
		"Set `level` to keep the document outline correct, then pick `size` purely for the look.",
		"Use `size=\"xs\"` or `size=\"sm\"` with `tone=\"subtle\"` for eyebrow labels above a larger title.",
		"A colored tone renders in its on-surface `--{tone}-vivid` ink by contract. To pin a heading to a tone's base shade instead (a brand whose accent *is* `--accent`, say), style `::part(heading)` from the consumer side: `xtyle-heading::part(heading) { color: var(--accent) }`. A per-instance custom property set on the host (`xtyle-heading { --accent-vivid: ... }`) does not reach the inner element's own token register, so `::part` is the reliable seam for a one-off color.",
	],
	a11y: [
		"Renders a real `<h1>`–`<h6>` so the document outline and screen-reader heading navigation come for free.",
		"`level` controls the semantic tag; `size` is purely visual, so headings can shrink or grow without breaking the outline.",
		"No fixed-size styling on the tag itself. Visual scale never forces a wrong level.",
		"Tone changes color only; emphasis is conveyed by the heading semantics, not the shade.",
	],
	examples: [
		{
			id: "levels-sizes-tones",
			title: "Levels, sizes, and tones",
			description: "Level sets the tag; size sets the look; tone sets the ink, all independent.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
	],
};
