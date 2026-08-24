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

const sidebarHtmlExample = `<xtyle-grid sidebar="18rem" min-col-width="22rem" gap="4">
	<xtyle-card>The document</xtyle-card>
	<xtyle-card>The outline</xtyle-card>
</xtyle-grid>

<xtyle-grid sidebar="14rem" side="start" gap="4">
	<xtyle-card>The rail, first in source order</xtyle-card>
	<xtyle-card>The content beside it</xtyle-card>
</xtyle-grid>`;

const sidebarSvelteExample = `<script lang="ts">
	import { Grid, Card } from "@xtyle/svelte";
</script>

<Grid sidebar="18rem" minColWidth="22rem" gap={4}>
	<Card>The document</Card>
	<Card>The outline</Card>
</Grid>

<Grid sidebar="14rem" side="start" gap={4}>
	<Card>The rail, first in source order</Card>
	<Card>The content beside it</Card>
</Grid>`;

const sidebarAstroExample = `---
import { Grid, Card } from "@xtyle/astro";
---

<Grid sidebar="18rem" minColWidth="22rem" gap={4}>
	<Card>The document</Card>
	<Card>The outline</Card>
</Grid>

<Grid sidebar="14rem" side="start" gap={4}>
	<Card>The rail, first in source order</Card>
	<Card>The content beside it</Card>
</Grid>`;

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
	since: "0.1.0",
	keywords: ["columns", "layout grid", "auto-fit", "gallery", "masonry", "sidebar", "rail"],
	seeAlso: ["stack", "cluster", "section", "splitter"],
	summary: "A two-dimensional CSS grid: fixed columns, responsive auto-fit, or a content-plus-rail shell.",
	description:
		"Grid arranges its children with a token-driven `gap` (0–8). Three sizing modes cover most needs: pass `columns` (1–12) for a fixed equal-width column count, `minColWidth` for a responsive `auto-fit` track that packs as many columns as fit at or above that minimum, or `sidebar` for the asymmetric two-track shell — content beside a fixed-width rail, the layout behind a document with an outline, an editor with an inspector, or a list with a detail pane. `sidebar` takes precedence over both, and `minColWidth` reads as the main column's floor under it: the pair stacks when the main column would be forced narrower, and never stacks if it is omitted. Otherwise `minColWidth` wins over `columns`. `align` and `justify` control how items sit within their cells. Like the other layout primitives it adds spacing and structure but no color or chrome of its own.",
	bindings: ["html", "svelte", "astro"],
	exposedParts: ["grid"],
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
			description: "Responsive mode: minimum track width (e.g. `16rem`) for an `auto-fit` column count. Takes precedence over `columns`. Under `sidebar` it reads as the main column's floor instead, below which the pair stacks; the floor is carried as the child's own `min-inline-size`, so a stylesheet setting `min-width: 0` on that child cancels it and the pair squeezes instead of stacking.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "sidebar",
			type: "string",
			description: "Sidebar mode: the rail's fixed track width (e.g. `18rem`), with the other child taking the remainder. Takes precedence over `columns` and `minColWidth`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "side",
			type: "GridSide",
			default: "end",
			description: "Which child is the rail in `sidebar` mode: `end` reads it as the last child, `start` as the first.",
			bindings: ["html", "svelte", "astro"],
			options: ["start", "end"],
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
			description: "How items align within their cells on the inline axis (`justify-items`). No effect in `sidebar` mode, where the two tracks are sized to fill the row.",
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
		"Use `sidebar` for the application shell — a document beside its outline, a canvas beside its inspector — and reach for Splitter instead only when the divider should be draggable, since that trades a static track for a gesture surface and its persistence.",
		"Resist the reflex to write `min-width: 0` on a sidebar child: that is the property carrying the main column's floor, so cancelling it replaces the stack with a squeeze, and a column crushed to a few dozen pixels reads as a broken layout rather than a missing one.",
		"Drop Cards, media, or any content into the cells; Grid imposes structure, not chrome.",
	],
	a11y: [
		"A generic presentational container with no implicit semantics; it adds no roles and announces nothing.",
		"CSS grid does not change DOM order, so keyboard and reading order follow source order; keep source order meaningful.",
		"`side` moves the rail between the first and last track without reordering the DOM, so the visual and tab orders stay in agreement whichever one you pick.",
	],
	examples: [
		{
			id: "fixed-and-responsive",
			title: "Fixed and responsive columns",
			description: "A fixed three-column grid, then a responsive auto-fit grid driven by a minimum track width.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
		{
			id: "sidebar-shell",
			title: "Content beside a fixed rail",
			description:
				"A rail at a fixed width with the content taking the remainder, stacking once the content would be squeezed under its floor, then the same shell with the rail first.",
			source: { html: sidebarHtmlExample, svelte: sidebarSvelteExample, astro: sidebarAstroExample },
		},
	],
};
