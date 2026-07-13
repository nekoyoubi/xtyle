import type { ComponentManifest } from "./types.js";
import { FULL_TONES } from "../vocab.js";

const htmlExample = `<xtyle-dot tone="success" label="Online"></xtyle-dot>

<xtyle-dot tone="danger" ping label="Live"></xtyle-dot>

<xtyle-dot tone="accent" glow size="lg"></xtyle-dot>

<xtyle-dot color="#a855f7" ping></xtyle-dot>`;

const svelteExample = `<script lang="ts">
	import { Dot } from "@xtyle/svelte";
</script>

<Dot tone="success" label="Online" />

<Dot tone="danger" ping label="Live" />

<Dot tone="accent" glow size="lg" />

<Dot color="#a855f7" ping />`;

const astroExample = `---
import Dot from "@xtyle/astro/Dot.astro";
---

<Dot tone="success" label="Online" />

<Dot tone="danger" ping label="Live" />

<Dot tone="accent" glow size="lg" />

<Dot color="#a855f7" ping />`;

export const dotManifest: ComponentManifest = {
	id: "dot",
	name: "Dot",
	since: "0.7.0",
	category: "feedback",
	keywords: ["status", "indicator", "presence", "online", "offline", "live", "ping", "pulse", "pip", "led"],
	seeAlso: ["badge", "spinner", "swatch"],
	summary: "A standalone status dot: a bare indicator in any tone, with optional ping, glow, and pulse.",
	description:
		"Dot is the bare indicator for \"presence without a full chip\": a connection light in a titlebar, a per-row streaming pip, an online/offline marker. `tone` colors it across the six semantic roles (plus the accent variants and named hues), `size` picks sm, md, or lg, and a `color` escape hatch paints any raw value past the tone set (a `color-mix(...)` expression, a per-state color from a status map). Three composable animations layer on: `ping` radiates an expanding ring, `glow` adds a soft halo, and `pulse` breathes the dot at a slow or fast cadence; all three hold still under `prefers-reduced-motion`. It ships as a first-class element that self-styles in its own shadow root, so a shadow-DOM consumer with no global stylesheet gets it for free, and the `.xtyle-dot` utility class stays available for global-CSS pages. A labelled dot is exposed as a named `role=\"img\"`; an unlabelled one is decorative and hidden from assistive tech.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "dot",
			description: "The dot itself: a full-radius circle filled with the resolved `--dot-color`.",
			selector: ".xtyle-dot",
			tokens: ["--neutral", "--radius-full", "--space-2"],
		},
		{
			name: "ping",
			description: "The expanding ring on a `ping` dot: an `::after` clone that scales out and fades on a loop.",
			selector: ".xtyle-dot--ping::after",
			tokens: ["--ease-standard"],
		},
	],
	props: [
		{
			name: "tone",
			type: "FullTone",
			default: "neutral",
			description: "Semantic color role (or named hue) driving the dot color.",
			bindings: ["html", "svelte", "astro"],
			options: [...FULL_TONES],
		},
		{
			name: "size",
			type: "DotSize",
			default: "md",
			description: "Dot diameter, stepped off the spacing scale.",
			bindings: ["html", "svelte", "astro"],
			options: ["sm", "md", "lg"],
		},
		{
			name: "pulse",
			type: "DotPulse",
			description: "Breathe the dot's opacity at a slow or fast cadence.",
			bindings: ["html", "svelte", "astro"],
			options: ["slow", "fast"],
		},
		{
			name: "ping",
			type: "boolean",
			default: "false",
			description: "Radiate an expanding ring for a live/active indicator.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "glow",
			type: "boolean",
			default: "false",
			description: "Add a soft halo in the dot color.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "color",
			type: "string",
			description: "Escape hatch: paint the dot any raw color, past the tone set. Sets `--dot-color` and wins over `tone`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "label",
			type: "string",
			description: "Accessible name. When set, the dot is exposed as `role=\"img\"`; when absent, it is decorative and hidden.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: FULL_TONES.map((tone) => ({
		name: tone,
		description: `${tone}-toned dot.`,
		className: `xtyle-dot--${tone}`,
		tokens: [`--${tone}` as const],
	})),
	sizes: [
		{ name: "sm", description: "Compact.", className: "xtyle-dot--sm" },
		{ name: "md", description: "Default.", className: "xtyle-dot", isDefault: true },
		{ name: "lg", description: "Large.", className: "xtyle-dot--lg" },
	],
	states: [
		{
			name: "ping",
			description: "An expanding ring radiates outward on a loop.",
			selector: ".xtyle-dot--ping",
			tokens: ["--ease-standard"],
		},
		{
			name: "glow",
			description: "A soft halo in the dot color.",
			selector: ".xtyle-dot--glow",
			tokens: ["--border-thin"],
		},
		{
			name: "pulse-slow",
			description: "Slow opacity breathe.",
			selector: ".xtyle-dot--pulse-slow",
			tokens: ["--ease-standard"],
		},
		{
			name: "pulse-fast",
			description: "Fast opacity breathe.",
			selector: ".xtyle-dot--pulse-fast",
			tokens: ["--ease-standard"],
		},
	],
	slots: [],
	consumedTokens: [
		"--radius-full",
		"--space-2",
		"--space-3",
		"--space-4",
		"--border-thin",
		"--ease-standard",
		...FULL_TONES.map((t) => `--${t}` as const),
	],
	composition: [
		"Reach for Dot when you want a color-coded status without a label chip; reach for Badge when the status wants a word beside it.",
		"Compose `ping` + `glow` for a strong live indicator; add `pulse` for a quieter breathe when a full ping ring is too loud.",
		"Use `color` for a per-state palette wider than the tone set (a run-state map, a `color-mix(...)` expression); `tone` covers the common semantic cases.",
	],
	a11y: [
		"A labelled dot is exposed as a named `role=\"img\"`, so its meaning does not rest on color alone.",
		"An unlabelled dot is treated as decorative and hidden from assistive tech, since color without a name carries no meaning to a screen reader.",
		"All three animations (`ping`, `glow` shimmer, `pulse`) hold still under `prefers-reduced-motion`.",
	],
	examples: [
		{
			id: "tones-states-color",
			title: "Tones, states, and the color escape hatch",
			description: "A labelled status dot, a live ping, a glowing accent, and a raw custom color.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
	],
};
