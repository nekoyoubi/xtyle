import type { ComponentManifest } from "./types.js";

const htmlExample = `<div aria-busy="true" aria-live="polite">
	<xtyle-skeleton shape="circle"></xtyle-skeleton>
	<xtyle-skeleton shape="text" style="width: 60%"></xtyle-skeleton>
	<xtyle-skeleton shape="text"></xtyle-skeleton>
	<xtyle-skeleton shape="block"></xtyle-skeleton>
	<xtyle-skeleton shape="line"></xtyle-skeleton>
</div>`;

const svelteExample = `<script lang="ts">
	import { Skeleton } from "@xtyle/svelte";
</script>

<div aria-busy="true" aria-live="polite">
	<Skeleton shape="circle" />
	<Skeleton shape="text" style="width: 60%" />
	<Skeleton shape="text" />
	<Skeleton shape="block" />
	<Skeleton shape="line" />
</div>`;

const astroExample = `---
import { Skeleton } from "@xtyle/astro";
---

<div aria-busy="true" aria-live="polite">
	<Skeleton shape="circle" />
	<Skeleton shape="text" style="width: 60%" />
	<Skeleton shape="text" />
	<Skeleton shape="block" />
	<Skeleton shape="line" />
</div>`;

export const skeletonManifest: ComponentManifest = {
	id: "skeleton",
	name: "Skeleton",
	category: "feedback",
	keywords: ["placeholder", "loading", "shimmer", "ghost", "content loader"],
	seeAlso: ["spinner", "empty", "image"],
	summary: "A shimmering loading placeholder in four shapes: text, line, block, and circle.",
	description:
		"Skeleton stands in for content that has not loaded yet, smoothing the perceived wait with a gentle shimmer that sweeps between two surface tints. Pick a `shape` to match the content it foreshadows (`text` for a run of copy, `line` for a thin rule or divider, `block` for a card or media region, `circle` for an avatar) and a `size` to scale it. The element is purely decorative and marks itself `aria-hidden`; the surrounding container owns the busy state via `aria-busy`, so assistive tech announces \"loading\" once rather than narrating every placeholder. Width is left to the caller (set it inline or via a class) so a skeleton can mirror the real content's measure.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "skeleton",
			description: "The placeholder block carrying the shape and size classes; paints and animates the shimmer.",
			selector: ".xtyle-skeleton",
			tokens: ["--bg-2", "--bg-3", "--radius-md", "--duration-slow", "--ease-standard"],
		},
	],
	props: [
		{
			name: "shape",
			type: "SkeletonShape",
			default: "text",
			description: "The placeholder geometry: what kind of content it stands in for.",
			bindings: ["html", "svelte", "astro"],
			options: ["text", "line", "block", "circle"],
		},
		{
			name: "size",
			type: "Size",
			default: "md",
			description: "Scales the placeholder's height (and diameter, for circle).",
			bindings: ["html", "svelte", "astro"],
			options: ["sm", "md", "lg"],
		},
	],
	variants: [
		{
			name: "text",
			description: "A single line of body-height copy with a soft corner radius.",
			className: "xtyle-skeleton--text",
			tokens: ["--text-body", "--radius-sm"],
		},
		{
			name: "line",
			description: "A thin pill standing in for a rule, divider, or caption underline.",
			className: "xtyle-skeleton--line",
			tokens: ["--border-thick", "--radius-full"],
		},
		{
			name: "block",
			description: "A tall rectangle for a card, image, or media region.",
			className: "xtyle-skeleton--block",
			tokens: ["--space-7", "--radius-md"],
		},
		{
			name: "circle",
			description: "A perfect circle for an avatar or icon placeholder.",
			className: "xtyle-skeleton--circle",
			tokens: ["--space-7", "--radius-full"],
		},
	],
	sizes: [
		{ name: "sm", description: "Compact.", className: "xtyle-skeleton--sm" },
		{ name: "md", description: "Default.", className: "xtyle-skeleton", isDefault: true },
		{ name: "lg", description: "Large.", className: "xtyle-skeleton--lg" },
	],
	states: [
		{
			name: "shimmer",
			description: "The always-on loading animation sweeping a highlight across the surface; neutralized under reduced-motion by the base layer.",
			selector: ".xtyle-skeleton",
			tokens: ["--bg-2", "--bg-3", "--duration-slow", "--ease-standard"],
		},
	],
	slots: [],
	consumedTokens: [
		"--bg-2",
		"--bg-3",
		"--border-normal",
		"--border-thick",
		"--duration-slow",
		"--ease-standard",
		"--radius-full",
		"--radius-md",
		"--radius-sm",
		"--space-1",
		"--space-6",
		"--space-7",
		"--space-8",
		"--text-body",
		"--text-lg",
		"--text-sm",
	],
	composition: [
		"Compose several skeletons inside one container that carries `aria-busy=\"true\"`; swap the whole container for real content when it loads.",
		"Set width inline (`style=\"width: 60%\"`) or via a layout class to mirror the measure of the content being awaited.",
		"Mirror a Card's layout with a `circle` avatar plus stacked `text` lines for a faithful loading silhouette.",
	],
	a11y: [
		"The placeholder is decorative; it sets `aria-hidden=\"true\"` so screen readers skip the individual shapes.",
		"The loading state belongs on the surrounding container via `aria-busy=\"true\"` (optionally with `aria-live=\"polite\"`), not on each skeleton.",
		"The shimmer routes through `--duration-slow`/`--ease-standard`, so the global reduced-motion base rule stills it without extra component CSS.",
		"Carries no focusable or interactive content, so it never traps keyboard focus while content loads.",
	],
	examples: [
		{
			id: "loading-card",
			title: "A loading card",
			description: "Four shapes stacked inside an `aria-busy` container. The canonical loading silhouette.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
	],
};
