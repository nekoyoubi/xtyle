import type { ComponentManifest } from "./types.js";

const htmlExample = `<xoji-dock-zone style="height: 320px;">
	<section data-panel-id="files" data-title="Files">The file tree.</section>
	<section data-panel-id="outline" data-title="Outline">The document outline.</section>
	<section data-panel-id="preview" data-title="Preview">The rendered preview.</section>
</xoji-dock-zone>

<script type="module">
	import "@xoji/core/elements";
	const zone = document.querySelector("xoji-dock-zone");
	zone.addEventListener("layout-change", (e) => {
		localStorage.setItem("layout", JSON.stringify(e.detail.layout));
	});
	const saved = localStorage.getItem("layout");
	if (saved) zone.layout = JSON.parse(saved);
</script>`;

export const dockZoneManifest: ComponentManifest = {
	id: "dock-zone",
	name: "Dock Zone",
	category: "layout",
	summary: "A drag-and-drop dockable-panel workspace: tabbed zones that rearrange by dragging.",
	description:
		"Dock Zone is a movable-panel workspace, the editor-style chrome an app builds its layout from. Its direct children are the panels: any element with a `data-panel-id` and a `data-title` (or `title`) for its tab. The zone reads them, arranges them into a layout of tabbed zones, and renders the tab strips and splits around them. Dragging a tab re-docks its panel onto another zone, joining it as a tab when dropped over the center or splitting the zone when dropped against an edge. Every rearrangement dispatches a `layout-change` event carrying the serializable layout tree, and setting the `layout` property restores a saved one, so a workspace persists across reloads. The layout physics are xoji's own headless engine (`resolveDrop` for the drop geometry, `dockPanel` for the tree), the same primitives a consumer can drive directly from `@xoji/core/elements`. The Svelte binding surfaces `layout` as a prop and reports each rearrangement through an `onLayoutChange` callback; the Astro binding renders the panels and upgrades the workspace on the client.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "zone",
			description: "A leaf of the layout: a tab strip over the active panel's body.",
			selector: ".xoji-dock-zone__leaf",
			tokens: ["--bg-1", "--border", "--radius-md"],
		},
		{
			name: "tab",
			description: "A draggable tab; the active one carries an accent underline.",
			selector: ".xoji-dock-zone__tab",
			tokens: ["--fg-2", "--text-sm", "--accent"],
		},
		{
			name: "highlight",
			description: "The drop preview that tracks the drag, an accent-tinted rectangle over the target region.",
			selector: ".xoji-dock-zone__highlight",
			tokens: ["--accent", "--border-normal"],
		},
	],
	props: [
		{
			name: "layout",
			type: "DockNode",
			default: "all panels in one zone",
			description: "The layout tree (a `DockNode` from `@xoji/core/elements`). A JS property, not an attribute; set it to restore a persisted layout, read it from `layout-change.detail`.",
			bindings: ["html", "svelte"],
		},
	],
	variants: [],
	sizes: [],
	states: [],
	slots: [
		{
			name: "default",
			description: "The panels: elements carrying `data-panel-id` and `data-title`. Their content shows in the active zone body.",
			bindings: ["html"],
		},
	],
	consumedTokens: [
		"--accent",
		"--bg-1",
		"--bg-2",
		"--border",
		"--border-normal",
		"--border-thick",
		"--border-thin",
		"--duration-fast",
		"--ease-standard",
		"--fg-0",
		"--fg-1",
		"--fg-2",
		"--font-sans",
		"--radius-md",
		"--radius-sm",
		"--ring",
		"--space-0",
		"--space-1",
		"--space-3",
		"--state-hover",
		"--text-sm",
	],
	composition: [
		"Give the zone a height (it fills its container); inside a `Splitter` or an `AppShell` main region it takes the available space.",
		"Persist the workspace by saving `layout-change.detail.layout` and restoring it into the `layout` property on load.",
		"For a headless workspace (your own panel chrome), drive `resolveDrop` and `dockPanel` from `@xoji/core/elements` directly instead.",
	],
	a11y: [
		"Tabs are real `<button>`s with `role=\"tab\"` and `aria-selected`, so the active panel is announced and the strip is keyboard-focusable.",
		"Dragging is pointer-driven; clicking a tab activates its panel without a drag, so rearrangement is not the only way to switch panels.",
	],
	examples: [
		{
			id: "panels-and-persistence",
			title: "Panels and persistence",
			description: "Three panels in one zone; drag a tab to split or re-tab, and the layout persists to `localStorage`.",
			source: { html: htmlExample },
		},
	],
};
