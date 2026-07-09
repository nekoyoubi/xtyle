import type { ComponentManifest } from "./types.js";

const htmlExample = `<xtyle-cluster gap="2">
	<xtyle-button variant="solid" tone="accent">Save</xtyle-button>
	<xtyle-button variant="outline" tone="neutral">Cancel</xtyle-button>
</xtyle-cluster>

<xtyle-cluster gap="1" justify="between">
	<xtyle-badge tone="success">Active</xtyle-badge>
	<xtyle-badge tone="info">Beta</xtyle-badge>
	<xtyle-badge tone="warn">Limited</xtyle-badge>
</xtyle-cluster>`;

const svelteExample = `<script lang="ts">
	import { Cluster, Button, Badge } from "@xtyle/svelte";
</script>

<Cluster gap={2}>
	<Button variant="solid" tone="accent">Save</Button>
	<Button variant="outline" tone="neutral">Cancel</Button>
</Cluster>

<Cluster gap={1} justify="between">
	<Badge tone="success">Active</Badge>
	<Badge tone="info">Beta</Badge>
	<Badge tone="warn">Limited</Badge>
</Cluster>`;

const astroExample = `---
import { Cluster, Button, Badge } from "@xtyle/astro";
---

<Cluster gap={2}>
	<Button variant="solid" tone="accent">Save</Button>
	<Button variant="outline" tone="neutral">Cancel</Button>
</Cluster>

<Cluster gap={1} justify="between">
	<Badge tone="success">Active</Badge>
	<Badge tone="info">Beta</Badge>
	<Badge tone="warn">Limited</Badge>
</Cluster>`;

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

export const clusterManifest: ComponentManifest = {
	id: "cluster",
	name: "Cluster",
	category: "layout",
	keywords: ["hstack", "row", "inline group", "wrap", "flex row", "tag list"],
	seeAlso: ["stack", "grid", "toolbar"],
	summary: "A horizontal flex row that wraps, for toolbars, tag lists, and inline action groups.",
	description:
		"Cluster lays its children out in a horizontal flex row that wraps onto new lines as space runs out, with a token-driven `gap` (0–8) between every item, including across wrapped rows. It vertically centers its children by default and exposes `align` and `justify` for finer control. A `nowrap` flag pins everything to a single row when wrapping is unwanted. Like Stack it carries no chrome of its own, making it the natural home for button groups, badge and tag lists, breadcrumb trails, and any run of inline-ish boxes that should breathe consistently.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "root",
			description: "The wrapping flex-row container carrying the gap, align, and justify classes.",
			selector: ".xtyle-cluster",
			tokens: ["--space-2"],
		},
	],
	props: [
		{
			name: "gap",
			type: "number",
			default: "2",
			description: "Spacing between children (and across wrapped rows), as a step on the `--space` scale (0–8).",
			bindings: ["html", "svelte", "astro"],
			options: ["0", "1", "2", "3", "4", "5", "6", "7", "8"],
		},
		{
			name: "align",
			type: "ClusterAlign",
			description: "Cross-axis alignment (`align-items`). Defaults to centered.",
			bindings: ["html", "svelte", "astro"],
			options: ["start", "center", "end", "stretch", "baseline"],
		},
		{
			name: "justify",
			type: "ClusterJustify",
			description: "Main-axis distribution (`justify-content`).",
			bindings: ["html", "svelte", "astro"],
			options: ["start", "center", "end", "between", "around", "evenly"],
		},
		{
			name: "nowrap",
			type: "boolean",
			default: "false",
			description: "Pins children to a single row instead of letting them wrap.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "inline",
			type: "boolean",
			default: "false",
			description: "Renders as an inline-flex row instead of a block-level one.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [],
	sizes: [],
	states: [],
	slots: [
		{
			name: "default",
			description: "The children to arrange in a wrapping row.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	consumedTokens: [...SPACE_TOKENS],
	composition: [
		"The horizontal counterpart to Stack; reach for Grid when items need to line up in columns.",
		"Use for button groups, badge/tag lists, breadcrumbs, and toolbar runs.",
		"Set `nowrap` for single-row controls like a segmented toolbar; leave it off for tag clouds that should reflow.",
	],
	a11y: [
		"A generic presentational container with no implicit semantics. It adds no roles and announces nothing.",
		"Wrap in a landmark or list element (`<nav>`, `<ul>`) where the run of items carries meaning.",
	],
	examples: [
		{
			id: "wrapping-row",
			title: "Wrapping row",
			description: "Children flow left to right and wrap onto new lines, gapped consistently in both axes.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
	],
};
