import type { ComponentManifest } from "./types.js";

const htmlExample = `<xtyle-hero>
	<xtyle-eyebrow>Now in beta</xtyle-eyebrow>
	<xtyle-heading level="1">Theme anything, instantly</xtyle-heading>
	<xtyle-text size="lg">A derivation engine that turns a few colors into a whole design.</xtyle-text>
	<xtyle-cluster gap="3">
		<xtyle-button variant="solid">Get started</xtyle-button>
		<xtyle-button variant="subtle">Read the docs</xtyle-button>
	</xtyle-cluster>
</xtyle-hero>`;

const splitHtmlExample = `<xtyle-hero split align="start">
	<div>
		<xtyle-heading level="1">Ship a themed app today</xtyle-heading>
		<xtyle-text>Compose the hero from the primitives you already have.</xtyle-text>
	</div>
	<xtyle-image src="/screenshot.png" alt="The app in action" ratio="4/3" />
</xtyle-hero>`;

const splitSvelteExample = `<script lang="ts">
	import { Hero, Heading, Text, Image } from "@xtyle/svelte";
</script>

<Hero split align="start">
	<div>
		<Heading level={1}>Ship a themed app today</Heading>
		<Text>Compose the hero from the primitives you already have.</Text>
	</div>
	<Image src="/screenshot.png" alt="The app in action" ratio="4/3" />
</Hero>`;

const splitAstroExample = `---
import Hero from "@xtyle/astro/Hero.astro";
import Heading from "@xtyle/astro/Heading.astro";
import Text from "@xtyle/astro/Text.astro";
import Image from "@xtyle/astro/Image.astro";
---

<Hero split align="start">
	<div>
		<Heading level={1}>Ship a themed app today</Heading>
		<Text>Compose the hero from the primitives you already have.</Text>
	</div>
	<Image src="/screenshot.png" alt="The app in action" ratio="4/3" />
</Hero>`;

const svelteExample = `<script lang="ts">
	import { Hero, Eyebrow, Heading, Text, Cluster, Button } from "@xtyle/svelte";
</script>

<Hero>
	<Eyebrow>Now in beta</Eyebrow>
	<Heading level={1}>Theme anything, instantly</Heading>
	<Text size="lg">A derivation engine that turns a few colors into a whole design.</Text>
	<Cluster gap={3}>
		<Button variant="solid">Get started</Button>
		<Button variant="subtle">Read the docs</Button>
	</Cluster>
</Hero>`;

const astroExample = `---
import Hero from "@xtyle/astro/Hero.astro";
import Eyebrow from "@xtyle/astro/Eyebrow.astro";
import Heading from "@xtyle/astro/Heading.astro";
import Text from "@xtyle/astro/Text.astro";
import Cluster from "@xtyle/astro/Cluster.astro";
import Button from "@xtyle/astro/Button.astro";
---

<Hero>
	<Eyebrow>Now in beta</Eyebrow>
	<Heading level={1}>Theme anything, instantly</Heading>
	<Text size="lg">A derivation engine that turns a few colors into a whole design.</Text>
	<Cluster gap={3}>
		<Button variant="solid">Get started</Button>
		<Button variant="subtle">Read the docs</Button>
	</Cluster>
</Hero>`;

export const heroManifest: ComponentManifest = {
	id: "hero",
	name: "Hero",
	since: "0.4.0",
	category: "media",
	summary: "A top-of-page band that composes an eyebrow, heading, text, actions, and media into a hero.",
	description:
		"Hero is the top-of-page shape, assembled from the primitives you already have. Drop an `Eyebrow`, a `Heading`, a `Text`, a `Cluster` of `Button`s, and maybe an `Image` inside it, and they stack into a centered hero with a comfortable measure and generous spacing. It adds no behavior and no chrome of its own, so it inherits the page's surface and pairs cleanly over a `Parallax` band; the layout is pure CSS, so the hero renders the same with or without JavaScript. `align` switches the stack from centered to left-aligned, and `split` turns it into a two-column content-and-media band that folds back to one column on a narrow screen.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "hero",
			description: "The band: a centered stack of the composed primitives with generous padding.",
			selector: "xtyle-hero",
			tokens: ["--space-5", "--space-6", "--space-8"],
		},
	],
	props: [
		{
			name: "align",
			type: "HeroAlign",
			default: "center",
			description: "The content alignment: `center` (a centered landing hero) or `start` (left-aligned).",
			bindings: ["html", "svelte", "astro"],
			options: ["center", "start"],
		},
		{
			name: "split",
			type: "boolean",
			default: "false",
			description: "Lays the band out as two columns (content and media) that fold to one column on a narrow screen. Give it two children: a content block and a media block.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [],
	sizes: [],
	states: [],
	slots: [
		{
			name: "default",
			description:
				"The hero content, composed from primitives: an `Eyebrow`, a `Heading`, a `Text`, a `Cluster` of `Button`s, and optionally an `Image`. In `split` mode, a content block and a media block.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	consumedTokens: ["--space-5", "--space-6", "--space-8"],
	composition: [
		"Stack an `Eyebrow` / `Heading` / `Text` / `Cluster` of `Button`s for a centered landing hero.",
		"Set `split` with a content block and an `Image` for a product-shot hero that folds to one column on mobile.",
		"Drop a Hero inside a `Parallax` as the still content layer for a moving hero band.",
		"Set `align=\"start\"` for a left-aligned hero in a narrower column.",
	],
	a11y: [
		"Hero is a presentational band; the structure comes from the primitives inside it, so a `Heading` at the right level carries the document outline.",
		"The layout is pure CSS and identical with JavaScript off, so nothing about the hero depends on the runtime.",
	],
	examples: [
		{
			id: "centered-hero",
			title: "Centered hero",
			description: "An eyebrow, heading, supporting text, and a pair of actions, stacked and centered.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
		{
			id: "split-hero",
			title: "Split hero",
			description: "A left-aligned content block beside a media block.",
			source: { html: splitHtmlExample, svelte: splitSvelteExample, astro: splitAstroExample },
		},
	],
};
