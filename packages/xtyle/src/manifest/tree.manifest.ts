import type { ComponentManifest } from "./types.js";

const htmlExample = `<xtyle-tree label="Documentation"></xtyle-tree>

<script>
	document.querySelector("xtyle-tree").items = [
		{
			label: "Guides",
			expanded: true,
			children: [
				{ label: "Getting started", href: "/guides/start", selected: true },
				{ label: "Theming", href: "/guides/theming" },
			],
		},
		{
			label: "Reference",
			children: [{ label: "Engine", href: "/reference/engine" }],
		},
	];
</script>`;

const svelteExample = `<script lang="ts">
	import { Tree } from "@xtyle/svelte";

	const items = [
		{
			label: "Guides",
			expanded: true,
			children: [
				{ label: "Getting started", href: "/guides/start", selected: true },
				{ label: "Theming", href: "/guides/theming" },
			],
		},
		{ label: "Reference", children: [{ label: "Engine", href: "/reference/engine" }] },
	];
</script>

<Tree label="Documentation" {items} onselect={(e) => console.log(e.detail.value)} />`;

const astroExample = `---
import { Tree } from "@xtyle/astro";

const items = [
	{
		label: "Guides",
		expanded: true,
		children: [
			{ label: "Getting started", href: "/guides/start", selected: true },
			{ label: "Theming", href: "/guides/theming" },
		],
	},
	{ label: "Reference", children: [{ label: "Engine", href: "/reference/engine" }] },
];
---

<Tree label="Documentation" items={items} />`;

const trailingExample = `<xtyle-tree label="Binder"></xtyle-tree>

<script>
	const tree = document.querySelector("xtyle-tree");
	tree.items = [
		{
			label: "Chapter 1", value: "ch1", expanded: true, badge: "1.2k",
			children: [
				{ label: "Opening", value: "ch1-1", badge: "3", actions: [
					{ id: "rename", label: "Rename", icon: "✎" },
					{ id: "delete", label: "Delete", icon: "✕" },
				] },
				{ label: "Rising action", value: "ch1-2", actions: [{ id: "rename", label: "Rename", icon: "✎" }] },
			],
		},
		{ label: "Chapter 2", value: "ch2", badge: "0.8k" },
	];
	// A row's badge shows always; its actions reveal on hover and fire tree-action.
	tree.addEventListener("tree-action", (e) => console.log(e.detail.action, "on", e.detail.value));
</script>`;

export const treeManifest: ComponentManifest = {
	id: "tree",
	name: "Tree",
	category: "navigation",
	summary: "A hierarchical, keyboard-navigable list of expandable nodes built from a data array.",
	description:
		"Tree renders a nested hierarchy from an `items` array. Each node carries a `label`, an optional `value`, `href`, and `children`, plus flags for `expanded`, `selected`, and `disabled`. It builds the WAI-ARIA tree pattern: a `role=\"tree\"` with nested `role=\"group\"` levels and `role=\"treeitem\"` nodes carrying `aria-level`, `aria-expanded`, and `aria-selected`, with a single roving tab stop so the whole tree is one Tab stop and the arrow keys walk it. A twisty rotates on expand. A node with an `href` renders its row as a link whether or not it has children, so a branch can be both navigable and a group; the row navigates while the twisty (and Left/Right) work the children. A branch without an `href` is a pure container that toggles on click. A node also carries per-row trailing content: a `badge` (a count or status after the label) and `actions` (hover-revealed row buttons that fire a `tree-action` event), the file-tree-with-inline-controls shape. Being data-driven keeps it robust across the bindings and a natural fit for a file or navigation tree. Three sizes (`sm`, `md`, `lg`) scale the row density.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "tree",
			description: "The `role=\"tree\"` root list holding the top-level nodes.",
			selector: ".xtyle-tree",
			tokens: ["--font-sans", "--text-sm", "--fg-1"],
		},
		{
			name: "row",
			description: "A node's clickable row, indented by its level; a `<div>`, or an `<a>` when the node has an `href`.",
			selector: ".xtyle-tree__row",
			tokens: [
				"--space-1",
				"--space-2",
				"--space-4",
				"--radius-sm",
				"--fg-0",
				"--fg-2",
				"--state-hover",
				"--accent-bg",
				"--accent-text",
				"--weight-medium",
				"--border-normal",
				"--border-thick",
				"--ring",
				"--fg-disabled",
				"--duration-fast",
				"--ease-standard",
			],
		},
		{
			name: "twisty",
			description: "The disclosure caret on parent nodes; rotates 90° when the node is expanded, hidden on leaves.",
			selector: ".xtyle-tree__twisty",
			tokens: ["--fg-3", "--duration-fast", "--ease-standard"],
		},
		{
			name: "group",
			description: "A nested `role=\"group\"` list of child nodes; `hidden` when its parent is collapsed.",
			selector: ".xtyle-tree__group",
			tokens: [],
		},
		{
			name: "trailing",
			description: "Per-row content after the label: a `badge` (a count or status, always shown) and hover-revealed `actions` buttons. Reachable at `::part(badge)` and `::part(row-action)`.",
			selector: ".xtyle-tree__trailing",
			tokens: ["--text-xs", "--fg-0", "--fg-2", "--fg-3", "--state-hover", "--space-0"],
		},
	],
	props: [
		{ name: "items", type: "TreeNode[]", description: "The node hierarchy. Each `TreeNode` has a `label` and optional `value`, `href`, `children`, `expanded`, `selected`, and `disabled`. Each node can also take a `badge` (trailing text after the label, a count or status) and `actions` (a `{ id, label, icon? }[]` of hover-revealed trailing buttons, non-link rows only) that fire a `tree-action` event. Passed as a property in the bindings (serialized to JSON for the element).", bindings: ["html", "svelte", "astro"] },
		{ name: "size", type: "Size", default: "md", description: "Row density: `sm`, `md`, or `lg`.", bindings: ["html", "svelte", "astro"], options: ["sm", "md", "lg"] },
		{ name: "label", type: "string", description: "Accessible name for the tree, applied as `aria-label`.", bindings: ["html", "svelte", "astro"] },
		{ name: "labelledby", type: "string", description: "Id of an external element naming the tree; takes precedence over `label`.", bindings: ["html", "svelte", "astro"] },
	],
	variants: [],
	sizes: [
		{ name: "sm", description: "Compact rows.", className: "xtyle-tree--sm" },
		{ name: "md", description: "Default.", className: "xtyle-tree", isDefault: true },
		{ name: "lg", description: "Roomy rows.", className: "xtyle-tree--lg" },
	],
	states: [
		{
			name: "selected",
			description: "The chosen node: its row takes the accent background and text. When the theme's `--selection-cue` resolves to `marker` (a high-contrast or redundant-cues algorithm), a non-color check glyph is added so selection never rests on color alone.",
			selector: ".xtyle-tree__item[aria-selected=\"true\"] > .xtyle-tree__row",
			tokens: ["--accent-bg", "--accent-text", "--selection-cue", "--weight-medium"],
		},
		{
			name: "row-hover",
			description: "Pointer over a row: the hover tint.",
			selector: ".xtyle-tree__row:hover",
			tokens: ["--state-hover", "--fg-0"],
		},
		{
			name: "expanded",
			description: "An open parent: the twisty rotates and the child group shows.",
			selector: ".xtyle-tree__item[aria-expanded=\"true\"]",
			tokens: [],
		},
		{
			name: "focus-visible",
			description: "Keyboard focus on a node: an inset token ring on its row.",
			selector: ".xtyle-tree__item:focus-visible > .xtyle-tree__row",
			tokens: ["--border-normal", "--border-thick", "--ring"],
		},
		{
			name: "disabled",
			description: "A locked node: muted and non-interactive.",
			selector: ".xtyle-tree__item[aria-disabled=\"true\"] > .xtyle-tree__row",
			tokens: ["--fg-disabled"],
		},
	],
	slots: [],
	consumedTokens: [
		"--font-sans",
		"--text-sm",
		"--text-body",
		"--fg-0",
		"--fg-1",
		"--fg-2",
		"--fg-3",
		"--fg-disabled",
		"--accent-bg",
		"--accent-text",
		"--selection-cue",
		"--weight-medium",
		"--state-hover",
		"--ring",
		"--border-normal",
		"--border-thick",
		"--radius-sm",
		"--space-0",
		"--space-1",
		"--space-2",
		"--space-4",
		"--text-xs",
		"--duration-fast",
		"--ease-standard",
	],
	composition: [
		"Feed it a `value` per node and listen for the `select` event to drive a detail pane or route.",
		"Give leaf nodes an `href` to render them as links: the natural shape for a docs or file-navigation sidebar.",
		"Hang a `badge` (a count, a status) and `actions` (a hover cluster of row controls) on a node for the file-tree-with-inline-controls shape; listen for `tree-action` (`detail: { value, action }`) to run them, and theme the parts via `::part(badge)` / `::part(row-action)`.",
		"For a flat set of collapsible sections rather than a hierarchy, reach for Accordion instead.",
	],
	a11y: [
		"Builds the WAI-ARIA tree pattern: a `role=\"tree\"` containing `role=\"treeitem\"` nodes and nested `role=\"group\"` levels, each item carrying `aria-level`, `aria-selected`, and (on parents) `aria-expanded`.",
		"A single roving tab stop makes the whole tree one Tab stop; Up/Down move between visible nodes, Right expands or steps into a node, Left collapses or steps out to the parent, and Home/End jump to the first and last.",
		"Enter or Space activates a node: selecting it, toggling a parent, or following a leaf's link.",
		"A node marked `disabled` is announced and cannot be selected or toggled.",
		"A `locked` branch with no `href` is a non-interactive section header: roving focus skips it and it can't be selected, so a keyboard user tabs straight to its children (a locked branch that carries an `href` stays a navigable header).",
		"Focus shows an inset token ring on the node's row plus a transparent outline the forced-colors base rule promotes to a real system outline.",
		"Selection carries a non-color channel on demand: when the theme sets `--selection-cue: marker`, the selected row gains a check glyph alongside the color, satisfying WCAG 1.4.1 (color is not the only differentiator). The algorithm decides. High-contrast emits `marker` by default, and any algorithm can opt in via the `cues` knob.",
		"A row's `actions` are real `<button>`s with an accessible name (their `label`), revealed on row hover and keyboard focus; a `badge` is decorative (`aria-hidden`), so the row's accessible name stays the bare label. The action buttons are pointer- and screen-reader-reachable; they are not standalone Tab stops, matching the tree's single roving tab stop.",
	],
	examples: [
		{
			id: "docs-tree",
			title: "A documentation tree",
			description: "An expanded Guides branch with a selected page and links, beside a collapsed Reference branch.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
		{
			id: "trailing-content",
			title: "Badges and row actions",
			description: "A binder tree where each row carries a trailing badge (a count) and a hover cluster of action buttons, all firing `tree-action`.",
			source: { html: trailingExample },
		},
	],
};
