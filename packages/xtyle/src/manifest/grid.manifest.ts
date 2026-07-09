import type { ComponentManifest } from "./types.js";

const htmlExample = `<xtyle-grid columns="3" gap="4">
	<xtyle-card>One</xtyle-card>
	<xtyle-card>Two</xtyle-card>
	<xtyle-card>Three</xtyle-card>
</xtyle-grid>

<xtyle-grid min-col-width="16rem" gap="3">
	<xtyle-card>Auto-fit</xtyle-card>
	<xtyle-card>responsive</xtyle-card>
	<xtyle-card>columns</xtyle-card>
</xtyle-grid>`;

const svelteExample = `<script lang="ts">
	import { Grid, Card } from "@xtyle/svelte";
</script>

<Grid columns={3} gap={4}>
	<Card>One</Card>
	<Card>Two</Card>
	<Card>Three</Card>
</Grid>

<Grid minColWidth="16rem" gap={3}>
	<Card>Auto-fit</Card>
	<Card>responsive</Card>
	<Card>columns</Card>
</Grid>`;

const astroExample = `---
import { Grid, Card } from "@xtyle/astro";
---

<Grid columns={3} gap={4}>
	<Card>One</Card>
	<Card>Two</Card>
	<Card>Three</Card>
</Grid>

<Grid minColWidth="16rem" gap={3}>
	<Card>Auto-fit</Card>
	<Card>responsive</Card>
	<Card>columns</Card>
</Grid>`;

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

export const gridManifest: ComponentManifest = {
	id: "grid",
	name: "Grid",
	category: "layout",
	keywords: ["columns", "layout grid", "auto-fit", "gallery", "masonry"],
	seeAlso: ["stack", "cluster", "section"],
	summary: "A two-dimensional CSS grid: fixed columns or responsive auto-fit, with a token-driven gap.",
	description:
		"Grid arranges its children in a CSS grid with a token-driven `gap` (0–8). Two sizing modes cover most needs: pass `columns` (1–12) for a fixed equal-width column count, or pass `minColWidth` for a responsive `auto-fit` track that packs as many columns as fit at or above that minimum and reflows as the container resizes. When both are set `minColWidth` wins. `align` and `justify` control how items sit within their cells. Like the other layout primitives it adds spacing and structure but no color or chrome of its own.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "root",
			description: "The CSS grid container carrying the gap, column, align, and justify classes.",
			selector: ".xtyle-grid",
			tokens: ["--space-4"],
		},
	],
	props: [
		{
			name: "gap",
			type: "number",
			default: "4",
			description: "Spacing between grid cells, as a step on the `--space` scale (0–8).",
			bindings: ["html", "svelte", "astro"],
			options: ["0", "1", "2", "3", "4", "5", "6", "7", "8"],
		},
		{
			name: "columns",
			type: "number",
			description: "Fixed number of equal-width columns (1–12). Ignored when `minColWidth` is set.",
			bindings: ["html", "svelte", "astro"],
			options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
		},
		{
			name: "minColWidth",
			type: "string",
			description: "Responsive mode: minimum track width (e.g. `16rem`) for an `auto-fit` column count. Takes precedence over `columns`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "align",
			type: "GridAlign",
			description: "How items align within their cells on the block axis (`align-items`).",
			bindings: ["html", "svelte", "astro"],
			options: ["start", "center", "end", "stretch"],
		},
		{
			name: "justify",
			type: "GridAlign",
			description: "How items align within their cells on the inline axis (`justify-items`).",
			bindings: ["html", "svelte", "astro"],
			options: ["start", "center", "end", "stretch"],
		},
		{
			name: "inline",
			type: "boolean",
			default: "false",
			description: "Renders as an inline-grid instead of a block-level one.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [],
	sizes: [],
	states: [],
	slots: [
		{
			name: "default",
			description: "The children to lay out in grid cells.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	consumedTokens: [...SPACE_TOKENS],
	composition: [
		"The two-dimensional layout primitive; reach for Stack or Cluster when one axis is enough.",
		"Use fixed `columns` for known layouts (a 3-up card row) and `minColWidth` for responsive galleries that reflow on resize.",
		"Drop Cards, media, or any content into the cells; Grid imposes structure, not chrome.",
	],
	a11y: [
		"A generic presentational container with no implicit semantics; it adds no roles and announces nothing.",
		"CSS grid does not change DOM order, so keyboard and reading order follow source order; keep source order meaningful.",
	],
	examples: [
		{
			id: "fixed-and-responsive",
			title: "Fixed and responsive columns",
			description: "A fixed three-column grid, then a responsive auto-fit grid driven by a minimum track width.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
	],
};
