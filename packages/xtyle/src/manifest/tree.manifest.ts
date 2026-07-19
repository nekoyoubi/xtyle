import type { ComponentManifest } from "./types.js";
import { FULL_TONES } from "../vocab.js";

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
		{
			label: "Reference",
			children: [
				{ label: "Engine", value: "engine", actions: [{ id: "rename", label: "Rename", icon: "✎" }] },
			],
		},
	];
</script>

<Tree
	label="Documentation"
	{items}
	onselect={(e) => console.log("select", e.detail.value)}
	ontreeaction={(e) => console.log(e.detail.action, "on", e.detail.value)}
/>`;

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
			label: "Chapter 1", value: "ch1", expanded: true,
			// a word count plus a toned drift pill: two trailing badges, each its own color
			badge: ["1,204", { text: "3", tone: "warn" }],
			// hover text for a label the rail will ellipse; label stays the accessible name
			title: "The lighthouse keeper finds the letter",
			children: [
				{ label: "Opening", value: "ch1-1", badge: "512", title: "Dawn over the harbour", actions: [
					{ id: "up", label: "Move up", icon: "↑", disabled: true },
					{ id: "rename", label: "Rename", icon: "✎" },
					{ id: "delete", label: "Delete", icon: "✕" },
				] },
				{ label: "Rising action", value: "ch1-2", actions: [{ id: "rename", label: "Rename", icon: "✎" }] },
			],
		},
		{ label: "Chapter 2", value: "ch2", badge: "812", title: "She reads it twice, then burns it" },
	];
	// Badges show always; actions reveal on hover and fire tree-action (a disabled action stays greyed).
	// title is supplementary hover text — a synopsis behind a truncated label.
	tree.addEventListener("tree-action", (e) => console.log(e.detail.action, "on", e.detail.value));
</script>`;

const liveExample = `<xtyle-tree label="Manuscript"></xtyle-tree>

<script>
	const tree = document.querySelector("xtyle-tree");
	const counts = { "ch1-1": 512, "ch1-2": 692 };

	// A live feed re-sets \`items\` wholesale on every edit — here, a per-row word count that ticks
	// on every keystroke in the editor. Expansion, selection, and the roving tab stop are host-owned,
	// so they ride straight through the swap: a branch the user collapsed stays collapsed even though
	// the data still declares \`expanded: true\`, and the selected row stays selected.
	const render = () => {
		tree.items = [{
			label: "Chapter 1", value: "ch1", expanded: true,
			badge: String(counts["ch1-1"] + counts["ch1-2"]),
			children: [
				{ label: "Opening", value: "ch1-1", selected: true, badge: String(counts["ch1-1"]) },
				{ label: "Rising action", value: "ch1-2", badge: String(counts["ch1-2"]) },
			],
		}];
	};

	editor.addEventListener("input", () => {
		counts["ch1-1"] = editor.value.split(/\\s+/).filter(Boolean).length;
		render();
	});
	render();

	// Only a *new* branch seeds from its own flags. To throw the user's state away on purpose
	// (loading a different manuscript, say), ask for it:
	tree.resetState();
</script>`;

export const treeManifest: ComponentManifest = {
	id: "tree",
	name: "Tree",
	category: "navigation",
	since: "0.1.0",
	keywords: ["tree view", "file tree", "nested list", "hierarchy", "explorer", "outline"],
	seeAlso: ["toc", "accordion", "table"],
	summary: "A hierarchical, keyboard-navigable list of expandable nodes built from a data array.",
	description:
		"Tree renders a nested hierarchy from an `items` array. Each node carries a `label`, an optional `value`, `href`, and `children`, plus flags for `expanded`, `selected`, and `disabled`. It builds the WAI-ARIA tree pattern: a `role=\"tree\"` with nested `role=\"group\"` levels and `role=\"treeitem\"` nodes carrying `aria-level`, `aria-expanded`, and `aria-selected`, with a single roving tab stop so the whole tree is one Tab stop and the arrow keys walk it. A twisty rotates on expand. A node with an `href` renders its row as a link whether or not it has children, so a branch can be both navigable and a group; the row navigates while the twisty (and Left/Right) work the children. A branch without an `href` is a pure container that toggles on click. A node also carries per-row trailing content: one or more `badge` pills (a count plus a toned status pill after the label) and `actions` (hover-revealed row buttons that fire a `tree-action` event, each optionally `disabled` in place), the file-tree-with-inline-controls shape. Being data-driven keeps it robust across the bindings and a natural fit for a file or navigation tree. Three sizes (`sm`, `md`, `lg`) scale the row density.\n\nExpansion, selection, and the roving tab stop are **host-owned**: the node flags only *seed* them, and an `items` re-assignment reconciles rather than resets. So a live data feed (a per-row word count that ticks on every keystroke) can re-set `items` as often as it likes without re-expanding a branch the user collapsed or moving the tab stop. A key that disappears is dropped; a genuinely new branch seeds from its own `expanded` / `locked` flag. Call `resetState()` for the deliberate clean slate — loading a different document, not repainting the same one.",
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
			description: "Per-row content after the label: one or more `badge` pills (a count plus a toned status, always shown) and hover-revealed `actions` buttons. Reachable at `::part(badge)` and `::part(row-action)`.",
			selector: ".xtyle-tree__trailing",
			tokens: ["--text-xs", "--fg-0", "--fg-2", "--fg-3", "--state-hover", "--space-0"],
		},
	],
	props: [
		{ name: "items", type: "TreeNode[]", description: "The node hierarchy. Each `TreeNode` has a `label` and optional `value`, `href`, `children`, `expanded`, `selected`, and `disabled`. Each node can also take a `badge` (trailing content after the label: a plain string, a toned `{ text, tone }` pill, or a list of them so a count and a status pill each keep their own color) and `actions` (a `{ id, label, icon?, disabled? }[]` of hover-revealed trailing buttons, non-link rows only) that fire a `tree-action` event; a `disabled` action renders greyed and non-firing instead of being omitted, so a positional control set keeps a stable count. Passed as a property in the bindings (serialized to JSON for the element). Re-assigning `items` reconciles against the live keys rather than resetting: the `expanded` and `selected` flags seed a node the first time the tree sees it, after which expansion and selection belong to the user.", bindings: ["html", "svelte", "astro"] },
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
			description: "The chosen node: its row takes the accent tint under the primary ink. When the theme's `--selection-cue` resolves to `marker` (a high-contrast or redundant-cues algorithm), a non-color check glyph is added so selection never rests on color alone.",
			selector: ".xtyle-tree__item[aria-selected=\"true\"] > .xtyle-tree__row",
			tokens: ["--accent-bg", "--fg-0", "--selection-cue", "--weight-medium"],
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
		...FULL_TONES.map((t) => `--${t}-text` as const),
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
		"Drive it from live data: re-set `items` whenever the underlying rows change (a streaming word count, a file watcher). The tree reconciles instead of resetting, so the user's expansion, selection, and tab stop survive the swap; `resetState()` is the explicit opt-out when a new document really should start fresh.",
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
		"The roving tab stop is resolved against the rows that are actually on screen, so it survives an `items` swap: if the row that held focus is gone from the new data (or hidden inside a collapsed branch), the stop falls back to the selected row, then to the first visible row. The tree is always exactly one Tab stop, never zero.",
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
		{
			id: "live-data",
			title: "Live data, kept state",
			description: "A manuscript whose word counts stream in on every keystroke: `items` is re-set wholesale each time, and the user's expansion, selection, and tab stop ride through it untouched.",
			source: { html: liveExample },
		},
	],
};
