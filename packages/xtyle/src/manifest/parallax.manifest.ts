import type { ComponentManifest } from "./types.js";

const htmlExample = `<xtyle-parallax min-height="24rem" amplitude="140">
	<img data-speed="0.45" src="/sky.jpg" alt="" />
	<img data-speed="0.85" data-direction="w" src="/hills.png" alt="" />
	<div>
		<h1>Into the valley</h1>
		<p>A layered banner that drifts as you scroll.</p>
	</div>
</xtyle-parallax>`;

const cursorExample = `<xtyle-parallax min-height="24rem" mode="cursor" amplitude="50">
	<img data-speed="0.4" src="/sky.jpg" alt="" />
	<img data-speed="0.9" src="/hills.png" alt="" />
	<div>
		<h1>Move your cursor</h1>
		<p>The layers follow the pointer for depth.</p>
	</div>
</xtyle-parallax>`;

const svelteExample = `<script lang="ts">
	import { Parallax, Heading, Text } from "@xtyle/svelte";
</script>

<Parallax minHeight="24rem" amplitude={140}>
	<img data-speed="0.45" src="/sky.jpg" alt="" />
	<img data-speed="0.85" data-direction="w" src="/hills.png" alt="" />
	<div>
		<Heading level={1}>Into the valley</Heading>
		<Text>A layered banner that drifts as you scroll.</Text>
	</div>
</Parallax>`;

const astroExample = `---
import Parallax from "@xtyle/astro/Parallax.astro";
import Heading from "@xtyle/astro/Heading.astro";
import Text from "@xtyle/astro/Text.astro";
---

<Parallax minHeight="24rem" amplitude={140}>
	<img data-speed="0.45" src="/sky.jpg" alt="" />
	<img data-speed="0.85" data-direction="w" src="/hills.png" alt="" />
	<div>
		<Heading level={1}>Into the valley</Heading>
		<Text>A layered banner that drifts as you scroll.</Text>
	</div>
</Parallax>`;

export const parallaxManifest: ComponentManifest = {
	id: "parallax",
	name: "Parallax",
	since: "0.4.0",
	category: "media",
	keywords: ["layered banner", "scroll effect", "depth", "hero banner"],
	seeAlso: ["hero", "image", "section"],
	summary: "A layered banner whose layers drift on scroll or follow the cursor, static with no JS or reduced motion.",
	description:
		"Parallax stacks its children into one banner: CSS lays every child in the same grid cell, so the layers overlay and the content centers over the background with no JavaScript at all. Give a layer a `data-speed` and the runtime shifts it (the faster the speed, the deeper the drift), while a layer with no `data-speed` (the content) holds still on top. In the default `scroll` mode the shift is scroll-linked as the banner passes through the viewport; set `mode=\"cursor\"` and the layers follow the pointer instead. Each moving layer picks its own travel axis with `data-direction` (a compass token like `n`/`se`, or an angle in degrees clockwise from north), so layers can drift up, sideways, diagonally, or opposite one another; a cursor-mode layer with no direction follows the pointer in full 2D. The whole effect is an enhancement: with JavaScript off the layers sit at rest, and under `prefers-reduced-motion` the runtime leaves them alone, so the banner is always a legible layered composition and never depends on the motion to make sense. `min-height` sizes the band and `amplitude` scales how far the layers travel.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "banner",
			description: "The clipping band that stacks the layers and centers the content.",
			selector: "xtyle-parallax",
			tokens: ["--bg-1", "--radius-lg"],
		},
		{
			name: "content",
			description: "A layer with no `data-speed`: it holds still on top, padded and centered.",
			selector: "xtyle-parallax > :not([data-speed])",
			tokens: ["--space-6"],
		},
	],
	props: [
		{
			name: "minHeight",
			type: "string",
			default: "22rem",
			description: "The band's minimum height (any CSS length).",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "amplitude",
			type: "number",
			default: "80",
			description:
				"The maximum travel of a `data-speed=\"1\"` layer, in pixels; each layer scales it by its own speed. A negative value flips the whole banner's direction at once (and composes with a layer's own `data-speed` sign).",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "mode",
			type: `"scroll" | "cursor"`,
			default: "scroll",
			description: "What drives the drift: `scroll` links it to the banner passing through the viewport; `cursor` makes the layers follow the pointer.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "static",
			type: "boolean",
			default: "false",
			description:
				"Astro only: emit the layered banner but never load the runtime to hydrate it. The layers stack and paint from CSS either way; only the scroll- or cursor-linked drift is lost, exactly as it is under `prefers-reduced-motion`. The Svelte and raw-element paths always upgrade, so they carry no equivalent.",
			bindings: ["astro"],
		},
	],
	variants: [],
	sizes: [],
	states: [],
	slots: [
		{
			name: "default",
			description:
				"The layers, back to front. A layer with a `data-speed` (a number) drifts and fills the band, optionally along a `data-direction` axis; a negative `data-speed` reverses just that layer. A layer with no `data-speed` is the still content, centered on top.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	consumedTokens: ["--bg-1", "--radius-lg", "--space-6"],
	composition: [
		"Put an `Image` or two behind the content with ascending `data-speed`s (`0.3`, `0.6`) for a layered depth effect; leave the content layer without a `data-speed` so it stays put.",
		"Drop a `Stack` of `Heading` / `Text` / `Button` as the content layer for a hero band that reads as a normal centered banner with no JS.",
		"Pair with `Section` above and below for a full page-header shape.",
	],
	a11y: [
		"The banner is a plain container; the meaning lives in the slotted content (a `Heading`, a `Button`), so structure it as you would any hero.",
		"Give a purely-decorative background layer an empty `alt`, so assistive tech skips it.",
		"Under `prefers-reduced-motion` the layers never move; the banner stays a static layered composition.",
	],
	examples: [
		{
			id: "layered-banner",
			title: "Layered banner",
			description: "Two drifting background layers (the hills drift sideways) behind a still content layer.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
		{
			id: "cursor-follow",
			title: "Cursor follow",
			description: "The same stack in `mode=\"cursor\"`: the layers track the pointer in 2D for a depth effect.",
			source: { html: cursorExample },
		},
	],
};
