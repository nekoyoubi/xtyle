import type { ComponentManifest } from "./types.js";
import { FULL_TONES } from "../vocab.js";

const htmlExample = `<div style="position: relative; width: 16rem; height: 9rem; border-radius: var(--radius-lg); background: var(--bg-1);">
	<xtyle-ribbon tone="accent" label="New"></xtyle-ribbon>
	<!-- …card content… -->
</div>

<div style="position: relative; …">
	<xtyle-ribbon tone="danger" corner="top-left" label="Sale"></xtyle-ribbon>
</div>

<div style="position: relative; …">
	<xtyle-ribbon tone="success" variant="soft" corner="bottom-right" label="Beta"></xtyle-ribbon>
</div>`;

const svelteExample = `<script lang="ts">
	import { Ribbon } from "@xtyle/svelte";
</script>

<!-- the container only needs position: relative; the ribbon clips itself -->
<div style="position: relative;">
	<Ribbon tone="accent" label="New" />
	<!-- …card content… -->
</div>

<div style="position: relative;">
	<Ribbon tone="danger" corner="top-left" label="Sale" />
</div>

<div style="position: relative;">
	<Ribbon tone="success" variant="soft" corner="bottom-right" label="Beta" />
</div>`;

const astroExample = `---
import Ribbon from "@xtyle/astro/Ribbon.astro";
---

<!-- the container only needs position: relative; the ribbon clips itself -->
<div style="position: relative;">
	<Ribbon tone="accent" label="New" />
	<!-- …card content… -->
</div>

<div style="position: relative;">
	<Ribbon tone="danger" corner="top-left" label="Sale" />
</div>

<div style="position: relative;">
	<Ribbon tone="success" variant="soft" corner="bottom-right" label="Beta" />
</div>`;

export const ribbonManifest: ComponentManifest = {
	id: "ribbon",
	name: "Ribbon",
	since: "0.7.0",
	category: "feedback",
	keywords: ["corner", "banner", "flag", "new", "sale", "beta", "featured", "decoration", "callout"],
	seeAlso: ["badge", "dot", "card"],
	summary: "A corner ribbon: a diagonal banner pinned to a container's corner for a short label, in any tone.",
	description:
		"Ribbon is the diagonal corner banner for a short call-out on a card, a tile, or an image: `New`, `Beta`, `Sale`, `Featured`. `tone` skins it across the six semantic roles (plus the accent variants and named hues), `variant` picks a `solid` fill or a `soft` tint, `corner` chooses which of the four corners it hugs, and `size` steps the band from `sm` to `lg`. A `color` / `textColor` pair is the escape hatch for a band background and text past the tone set. It fills its container as a clipping overlay, so the band's overhang is trimmed to the container's edges and the ribbon reads as a real folded banner rather than a floating strip; the container just needs `position: relative` (the ribbon clips itself to the container's box, rounded corners included). It ships as a first-class element that self-styles in its own shadow root, so a shadow-DOM consumer with no global stylesheet gets it for free, and the `.xtyle-ribbon` utility class stays available for global-CSS pages. Ribbon is decoration, not a control: the overlay is `pointer-events: none`, and its short label is rendered as visible text, so it reads to assistive tech in the container's reading order. Keep the label short; the band is a fixed width per size and a longer label clips.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "ribbon",
			description: "The clip layer: an absolutely-positioned overlay that fills the container and trims the band's overhang.",
			selector: ".xtyle-ribbon",
		},
		{
			name: "band",
			description: "The diagonal banner itself: the rotated strip carrying the label, filled with the resolved tone.",
			selector: ".xtyle-ribbon__band",
			tokens: ["--accent", "--accent-fg", "--weight-semibold", "--elevation-2"],
		},
	],
	props: [
		{
			name: "tone",
			type: "FullTone",
			default: "accent",
			description: "Semantic color role (or named hue) driving the ribbon color.",
			bindings: ["html", "svelte", "astro"],
			options: [...FULL_TONES],
		},
		{
			name: "corner",
			type: "RibbonCorner",
			default: "top-right",
			description: "Which corner of the container the ribbon hugs.",
			bindings: ["html", "svelte", "astro"],
			options: ["top-right", "top-left", "bottom-right", "bottom-left"],
		},
		{
			name: "size",
			type: "RibbonSize",
			default: "md",
			description: "Band width and type size.",
			bindings: ["html", "svelte", "astro"],
			options: ["sm", "md", "lg"],
		},
		{
			name: "variant",
			type: "RibbonVariant",
			default: "solid",
			description: "Fill style: a `solid` tone fill or a `soft` tinted band.",
			bindings: ["html", "svelte", "astro"],
			options: ["solid", "soft"],
		},
		{
			name: "color",
			type: "string",
			description: "Escape hatch: paint the band background any raw color, past the tone set. Sets `--rb-bg` and wins over `tone`. Pair it with `textColor` so the label stays legible on a custom fill.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "textColor",
			type: "string",
			description: "The label color to pair with a custom `color` fill (sets `--rb-fg`). Set both together so a raw-color ribbon keeps its text readable; on a tone it is unneeded.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "label",
			type: "string",
			description: "The ribbon's text: a short call-out like `New` or `Sale`.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [
		{ name: "solid", description: "A solid tone fill with on-tone text (the default).", className: "xtyle-ribbon" },
		{ name: "soft", description: "A soft tinted band with tone-colored text.", className: "xtyle-ribbon--soft" },
		...FULL_TONES.map((tone) => ({
			name: tone,
			description: `${tone}-toned ribbon.`,
			className: `xtyle-ribbon--${tone}`,
			tokens: [`--${tone}` as const],
		})),
	],
	sizes: [
		{ name: "sm", description: "Compact.", className: "xtyle-ribbon--sm" },
		{ name: "md", description: "Default.", className: "xtyle-ribbon", isDefault: true },
		{ name: "lg", description: "Large.", className: "xtyle-ribbon--lg" },
	],
	states: [
		{ name: "top-right", description: "Pinned to the top-right corner (default).", selector: ".xtyle-ribbon--top-right" },
		{ name: "top-left", description: "Pinned to the top-left corner.", selector: ".xtyle-ribbon--top-left" },
		{ name: "bottom-right", description: "Pinned to the bottom-right corner.", selector: ".xtyle-ribbon--bottom-right" },
		{ name: "bottom-left", description: "Pinned to the bottom-left corner.", selector: ".xtyle-ribbon--bottom-left" },
	],
	slots: [],
	consumedTokens: [
		...FULL_TONES.flatMap(
			(t) => [`--${t}`, `--${t}-fg`, `--${t}-bg`, `--${t}-text`] as const,
		),
		"--text-xs",
		"--text-sm",
		"--text-lg",
		"--weight-semibold",
		"--elevation-2",
	],
	composition: [
		"Reach for Ribbon when a call-out should hug a corner and read as a folded banner (a `Sale` flash on a product tile); reach for Badge when the label sits inline with content, and Dot when a bare color-coded status is enough.",
		"Give the container `position: relative` and the ribbon does the rest: it pins to the corner and clips the band's ends to the container's edges, rounded corners included. It never needs the container to set `overflow: hidden`, so a card with an escaping dropdown or focus ring keeps it.",
		"Keep the label short (a word or two); the band is a fixed width per size, and a longer label is clipped rather than wrapped.",
		"Use `soft` for a quieter call-out that tints rather than shouts; `color` + `textColor` for a per-campaign palette wider than the tone set.",
	],
	a11y: [
		"The label is rendered as visible text, so it reads to assistive tech in the container's normal reading order rather than resting on color or position alone.",
		"Ribbon is decoration, not a control: the overlay is `pointer-events: none`, so it never intercepts clicks meant for the content beneath, and a clickable call-out belongs in a real link or button instead.",
		"The `color` escape hatch bypasses the derived contrast the tones guarantee, so pair it with `textColor` to keep the label legible on a custom fill.",
	],
	examples: [
		{
			id: "corners-tones-variants",
			title: "Corners, tones, and variants",
			description: "A ribbon pinned to each corner, in solid and soft fills across the semantic tones.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
	],
};
