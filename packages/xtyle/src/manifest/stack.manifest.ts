import type { ComponentManifest } from "./types.js";

const htmlExample = `<xtyle-stack gap="4">
	<xtyle-card>First</xtyle-card>
	<xtyle-card>Second</xtyle-card>
	<xtyle-card>Third</xtyle-card>
</xtyle-stack>

<xtyle-stack gap="2" align="center">
	<h2>Centered column</h2>
	<p>Children stack vertically, centered on the cross axis.</p>
</xtyle-stack>`;

const svelteExample = `<script lang="ts">
	import { Stack, Card } from "@xtyle/svelte";
</script>

<Stack gap={4}>
	<Card>First</Card>
	<Card>Second</Card>
	<Card>Third</Card>
</Stack>

<Stack gap={2} align="center">
	<h2>Centered column</h2>
	<p>Children stack vertically, centered on the cross axis.</p>
</Stack>`;

const astroExample = `---
import { Stack, Card } from "@xtyle/astro";
---

<Stack gap={4}>
	<Card>First</Card>
	<Card>Second</Card>
	<Card>Third</Card>
</Stack>

<Stack gap={2} align="center">
	<h2>Centered column</h2>
	<p>Children stack vertically, centered on the cross axis.</p>
</Stack>`;

const SPACE_TOKENS = [
	"--space-0",
	"--space-1",
	"--space-2",
	"--space-3",
	"--space-4",
	"--space-5",
	"--space-6",
	"--space-7",
	"--space-8",
] as const;

export const stackManifest: ComponentManifest = {
	id: "stack",
	name: "Stack",
	category: "layout",
	since: "0.1.0",
	keywords: ["vstack", "column", "vertical layout", "spacing", "flex column"],
	seeAlso: ["cluster", "grid", "section"],
	summary: "A vertical flex column with a token-driven gap, the primitive for stacking content.",
	description:
		"Stack lays its children out in a flex column with a consistent gap drawn from the `--space` scale. The `gap` prop (0–8) selects the spacing step, while `align` and `justify` control the cross- and main-axis distribution. It carries no visual chrome of its own (no background, border, or color), so it composes cleanly inside cards, panels, and page shells. An `inline` flag switches it to an inline-flex column for embedding in running text or alongside other inline boxes.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "root",
			description: "The flex-column container carrying the gap, align, and justify classes.",
			selector: ".xtyle-stack",
			tokens: ["--space-4"],
		},
	],
	props: [
		{
			name: "gap",
			type: "number",
			default: "4",
			description: "Spacing between children, as a step on the `--space` scale (0–8).",
			bindings: ["html", "svelte", "astro"],
			options: ["0", "1", "2", "3", "4", "5", "6", "7", "8"],
		},
		{
			name: "align",
			type: "StackAlign",
			description: "Cross-axis alignment (`align-items`). Omitted leaves the browser default (stretch).",
			bindings: ["html", "svelte", "astro"],
			options: ["start", "center", "end", "stretch", "baseline"],
		},
		{
			name: "justify",
			type: "StackJustify",
			description: "Main-axis distribution (`justify-content`).",
			bindings: ["html", "svelte", "astro"],
			options: ["start", "center", "end", "between", "around", "evenly"],
		},
		{
			name: "inline",
			type: "boolean",
			default: "false",
			description: "Renders as an inline-flex column instead of a block-level one.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [],
	sizes: [],
	states: [],
	slots: [
		{
			name: "default",
			description: "The children to stack vertically.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	consumedTokens: [...SPACE_TOKENS],
	composition: [
		"Pair with Cluster (horizontal) and Grid (two-dimensional); the three layout primitives cover most page scaffolding.",
		"Nest Stacks for sections-within-sections; each level picks its own `gap`.",
		"Drop any component inside; Stack adds spacing without imposing color or chrome.",
	],
	a11y: [
		"A generic presentational container with no implicit semantics; it adds no roles and announces nothing.",
		"Wrap in a landmark element (`<section>`, `<nav>`) or pass a semantic tag where document structure matters.",
	],
	examples: [
		{
			id: "vertical-stacking",
			title: "Vertical stacking",
			description: "Children flow top to bottom with a uniform, token-driven gap.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
	],
};
