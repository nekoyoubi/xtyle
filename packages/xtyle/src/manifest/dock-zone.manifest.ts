import type { ComponentManifest } from "./types.js";

const htmlExample = `<xtyle-dock-zone style="height: 320px;">
	<section data-panel-id="files" data-title="Files">The file tree.</section>
	<section data-panel-id="outline" data-title="Outline">The document outline.</section>
	<section data-panel-id="preview" data-title="Preview">The rendered preview.</section>
</xtyle-dock-zone>

<script type="module">
	import "@xtyle/core/elements";
	const zone = document.querySelector("xtyle-dock-zone");
	zone.addEventListener("layout-change", (e) => {
		localStorage.setItem("layout", JSON.stringify(e.detail.layout));
	});
	const saved = localStorage.getItem("layout");
	if (saved) zone.layout = JSON.parse(saved);
</script>`;

const chromeExample = `<xtyle-dock-zone style="height: 320px;">
	<section
		data-panel-id="editor"
		data-title="Editor"
		data-badge="3"
		data-closable
		data-actions='[{ "id": "split", "label": "Split editor", "icon": "◫" }]'
		data-menu='[{ "heading": "Panel" }, { "label": "Reveal in tree", "value": "reveal" }, { "separator": true }, { "label": "Close", "value": "close", "intent": "danger" }]'
	>The document.</section>
	<section data-panel-id="preview" data-title="Preview" data-closable>The rendered preview.</section>
</xtyle-dock-zone>

<script type="module">
	import "@xtyle/core/elements";
	const zone = document.querySelector("xtyle-dock-zone");
	// A header button or a menu row: both arrive as panel-action.
	zone.addEventListener("panel-action", (e) => {
		if (e.detail.actionId === "close") zone.closePanel(e.detail.panelId); // same path as the ✕ button
		else runCommand(e.detail.panelId, e.detail.actionId);
	});
	// The built-in close is cancelable; the zone removes the panel and re-reports the layout unless you veto it.
	zone.addEventListener("panel-close", (e) => {
		if (e.detail.panelId === "editor" && hasUnsavedChanges()) e.preventDefault();
	});
</script>`;

const stackExample = `<!-- A tool rail: every panel open at once, each a collapsible section. -->
<xtyle-dock-zone mode="stack" style="height: 320px; max-width: 280px;">
	<section data-panel-id="layers" data-title="Layers">The layer list.</section>
	<section data-panel-id="props" data-title="Properties">The property inspector.</section>
	<section data-panel-id="history" data-title="History">The undo stack.</section>
</xtyle-dock-zone>

<!-- For a mixed workspace (a stacked rail beside a tabbed editor), author the leaf's mode in the tree: -->
<script type="module">
	import "@xtyle/core/elements";
	document.querySelector("xtyle-dock-zone").layout = {
		kind: "split", direction: "row", sizes: [1, 3],
		children: [
			{ kind: "leaf", id: "rail", panels: ["layers", "props", "history"], active: 0, mode: "stack", collapsed: ["history"] },
			{ kind: "leaf", id: "main", panels: ["editor", "preview"], active: 0 },
		],
	};
</script>`;

const svelteExample = `<script lang="ts">
	import { DockZone } from "@xtyle/svelte";
	import type { DockLayout } from "@xtyle/core/elements";

	// Restore a persisted layout in; read the current one back out via onLayoutChange.
	let layout: DockLayout | null = $state(JSON.parse(localStorage.getItem("layout") ?? "null"));
</script>

<DockZone
	{layout}
	style="height: 320px;"
	onLayoutChange={(e) => {
		layout = e.detail.layout;
		localStorage.setItem("layout", JSON.stringify(layout));
	}}
>
	<section data-panel-id="files" data-title="Files">The file tree.</section>
	<section data-panel-id="outline" data-title="Outline">The document outline.</section>
	<section data-panel-id="preview" data-title="Preview">The rendered preview.</section>
</DockZone>`;

const astroExample = `---
import { DockZone } from "@xtyle/astro";
---

<DockZone style="height: 320px;">
	<section data-panel-id="files" data-title="Files">The file tree.</section>
	<section data-panel-id="outline" data-title="Outline">The document outline.</section>
	<section data-panel-id="preview" data-title="Preview">The rendered preview.</section>
</DockZone>

<!-- The Astro wrapper renders the initial panels; wire persistence in a client
	 script that reads the element's \`layout\` and listens for \`layout-change\`. -->`;

export const dockZoneManifest: ComponentManifest = {
	id: "dock-zone",
	name: "Dock Zone",
	category: "shell",
	keywords: ["docking", "panels", "workspace", "ide layout", "draggable panels", "tear-off", "float"],
	seeAlso: ["dock", "app-shell", "panel", "splitter"],
	summary: "A drag-and-drop dockable-panel workspace: tabbed zones that rearrange by dragging.",
	description:
		"Dock Zone is a movable-panel workspace, the editor-style chrome an app builds its layout from. Its direct children are the panels: any element with a `data-panel-id` and a `data-title` (or `title`) for its tab. The zone reads them, arranges them into a layout of tabbed zones, and renders the tab strips and splits around them. Dragging a tab re-docks its panel onto another zone, joining it as a tab when dropped over the center or splitting the zone when dropped against an edge. Dragging a tab out past every zone tears it into a floating window that moves, resizes, and docks back on the same layout. Every rearrangement dispatches a `layout-change` event carrying the serializable layout, and setting the `layout` property restores a saved one, so a workspace persists across reloads. A panel carries its own header chrome, declared on the panel child: `data-closable` for a built-in close (a cancelable `panel-close`, then removal and a fresh `layout-change`), `data-actions` for direct header buttons, and `data-menu` for a kebab overflow `<xtyle-menu>`. A header button or a menu row both fire `panel-action`, and a `data-badge` puts trailing status text (a count) on the panel's own tab. A leaf renders in one of two modes: `tabs` (the default, one active panel behind a tab strip) or `stack` (every panel a collapsible section, the tool-rail shape); set `mode` for the whole workspace or per leaf in the tree. The layout physics are xtyle's own headless engine (`resolveDrop` for the drop geometry, `dockPanel` for the tree), the same primitives a consumer can drive directly from `@xtyle/core/elements`. The Svelte binding surfaces `layout` as a prop and reports rearrangement through `onLayoutChange`, close through `onPanelClose`, and header controls through `onPanelAction`; the Astro binding renders the panels and upgrades the workspace on the client.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "zone",
			description: "A leaf of the layout: a tab strip over the active panel's body.",
			selector: ".xtyle-dock-zone__leaf",
			tokens: ["--bg-1", "--line", "--radius-md"],
		},
		{
			name: "tab",
			description: "A draggable tab; the active one carries an accent underline. A `data-badge` renders trailing status text (`.xtyle-dock-zone__badge`, muted) after the title.",
			selector: ".xtyle-dock-zone__tab",
			tokens: ["--fg-2", "--text-sm", "--accent", "--space-1"],
		},
		{
			name: "actions",
			description: "The active panel's header controls, pinned to the end of the tab strip: direct action buttons, a kebab overflow menu, and the close button (its hover tints `--danger`).",
			selector: ".xtyle-dock-zone__actions",
			tokens: ["--fg-0", "--fg-2", "--danger", "--state-hover"],
		},
		{
			name: "section",
			description: "A stack-mode panel: a disclosure header (a rotating chevron and the title, the panel's controls beside it) over a body shown when expanded.",
			selector: ".xtyle-dock-zone__section",
			tokens: ["--bg-2", "--fg-0", "--fg-2", "--line", "--state-hover"],
		},
		{
			name: "highlight",
			description: "The drag-preview films over the live zones: the drop target (`--accent`), the remnant a split would leave (`--accent-2`), and every other zone (`--accent-3`).",
			selector: ".xtyle-dock-zone__film",
			tokens: ["--accent", "--accent-2", "--accent-3", "--border-normal"],
		},
	],
	props: [
		{
			name: "layout",
			type: "DockLayout",
			default: "all panels in one zone",
			description: "The whole workspace (a `DockLayout` from `@xtyle/core/elements`: `{ tree, floating }`, the docked tree plus any floating windows). Set the JS property to restore a persisted layout and read it back from `layout-change.detail`; for a declarative start, pass it as a JSON `layout` attribute. A bare `DockNode` tree is still accepted and read as a layout with no floats. A leaf's `mode` / `collapsed` and each float's rect travel in the one layout, so the whole workspace persists together.",
			bindings: ["html", "svelte"],
		},
		{
			name: "mode",
			type: '"tabs" | "stack"',
			default: '"tabs"',
			description: "The starting render mode when no `layout` is authored: `\"tabs\"` shows one active panel behind a tab strip; `\"stack\"` shows every panel as a collapsible section stacked top-to-bottom (a tool/inspector rail). Per-leaf mode lives in the layout tree; this attribute only seeds the auto single zone.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "data-badge",
			type: "string (on a panel child)",
			description: "Trailing status text on the panel's own tab (and its stacked-section header), like an unread or problem count. Rides on every panel's tab, not just the active one; decorative (`aria-hidden`), so the tab's accessible name stays its title.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "data-closable",
			type: "boolean attribute (on a panel child)",
			description: "Renders a close button in the panel's header. Clicking it fires a cancelable `panel-close` (`detail: { panelId }`); unless a listener calls `preventDefault()`, the zone removes the panel and fires `layout-change` with the new tree.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "data-actions",
			type: "JSON `{ id, label, icon? }[]` (on a panel child)",
			description: "Direct header buttons for a panel. `icon` is a short glyph shown on the button, `label` its accessible name. Clicking one fires `panel-action` (`detail: { panelId, actionId }`).",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "data-menu",
			type: "JSON `MenuItem[]` (on a panel child)",
			description: "A kebab (⋮) overflow menu for the panel, rendered as an `<xtyle-menu>` (so it carries headings, hints, and `intent: \"danger\"`). Selecting a row fires `panel-action` with the row's `value` as the `actionId`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "closePanel",
			type: "(panelId: string) => void (method)",
			description: "Close a panel through the same path as the built-in close button (a cancelable `panel-close`, then removal + `layout-change`). Call this from a `data-menu` \"close\" row or a shortcut; pulling a panel from the tree by hand and re-setting `layout` won't stick, since the panel is still a DOM child the zone will recover.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "floatPanel",
			type: "(panelId: string, rect?: { x, y, w, h }) => void (method)",
			description: "Tear a docked panel out into a floating window over the workspace, opening at `rect` (or a cascaded default), and report the new layout through `layout-change`. The window has a draggable titlebar (clamped to the workspace), a bottom-right resize grip, plus dock and close buttons; its rect rides on the same `layout` as the docks, so it persists with everything else. Dragging a tab out past every zone floats it too. Wire the method to a `data-menu` \"float\" row or a shortcut.",
			bindings: ["html", "svelte"],
		},
		{
			name: "dockFloating",
			type: "(panelId: string, target?: string, region?: DockRegion) => void (method)",
			description: "Re-dock a floating panel back into the tree, routing through the same drop path a tab move uses. With no `target` it returns to the zone it floated out of (or the root zone if that's gone); pass a `target` zone id and `region` to land it elsewhere. The float window's dock button calls this, and dragging the window over a zone re-docks it there through the drop preview.",
			bindings: ["html", "svelte"],
		},
		{
			name: "onPanelClose",
			type: "(event: CustomEvent<{ panelId }>) => void",
			description: "Svelte callback for the `panel-close` event. Call `event.preventDefault()` to veto the removal (e.g. an unsaved-changes guard).",
			bindings: ["svelte"],
		},
		{
			name: "onPanelAction",
			type: "(event: CustomEvent<{ panelId, actionId }>) => void",
			description: "Svelte callback for the `panel-action` event fired by a header button or a menu row.",
			bindings: ["svelte"],
		},
	],
	variants: [],
	sizes: [],
	states: [],
	slots: [
		{
			name: "default",
			description: "The panels: elements carrying `data-panel-id` and `data-title`. Their content shows in the active zone body. A panel can also carry its own header chrome: `data-closable`, `data-actions`, `data-menu`, and `data-badge`.",
			bindings: ["html"],
		},
	],
	consumedTokens: [
		"--accent",
		"--accent-2",
		"--accent-3",
		"--bg-1",
		"--bg-2",
		"--border-normal",
		"--border-thick",
		"--border-thin",
		"--danger",
		"--duration-fast",
		"--ease-standard",
		"--elevation-4",
		"--fg-0",
		"--fg-1",
		"--fg-2",
		"--font-sans",
		"--line",
		"--radius-md",
		"--radius-sm",
		"--ring",
		"--space-0",
		"--space-1",
		"--space-2",
		"--space-3",
		"--space-4",
		"--space-6",
		"--state-hover",
		"--text-lg",
		"--text-sm",
		"--weight-medium",
	],
	composition: [
		"Give the zone a height (it fills its container); inside a `Splitter` or an `AppShell` main region it takes the available space.",
		"Persist the workspace by saving `layout-change.detail.layout` and restoring it into the `layout` property on load.",
		"For a headless workspace (your own panel chrome), drive `resolveDrop` and `dockPanel` from `@xtyle/core/elements` directly instead.",
		"Give a panel header controls without leaving the layout: `data-closable` for a built-in close, `data-actions` for direct buttons, and `data-menu` for a kebab `<xtyle-menu>`. The chrome always reflects the active panel.",
		"`panel-close` is cancelable, so a consumer can gate removal (unsaved changes) with `preventDefault()`; otherwise the zone removes the panel and reports the new tree through `layout-change`.",
	],
	a11y: [
		"Tabs are real `<button>`s with `role=\"tab\"` and `aria-selected`, so the active panel is announced and the strip is keyboard-focusable.",
		"Dragging is pointer-driven; clicking a tab activates its panel without a drag, so rearrangement is not the only way to switch panels.",
		"Header controls are real `<button>`s with an accessible name (`data-actions` uses its `label`, close reads `Close <title>`); the kebab menu is a full `<xtyle-menu>` with keyboard navigation.",
		"A `data-badge` is decorative (`aria-hidden`), so a tab's accessible name stays its title; put anything a screen reader must announce in `data-title`.",
		"In `stack` mode each section header is a real `<button>` with `aria-expanded`, so its collapsed state is announced and it toggles by keyboard; the chevron is decorative (`aria-hidden`).",
	],
	examples: [
		{
			id: "panels-and-persistence",
			title: "Panels and persistence",
			description: "Three panels in one zone; drag a tab to split or re-tab, and the layout persists to `localStorage`.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
		{
			id: "panel-chrome",
			title: "Panel controls",
			description: "A panel with a close button, a direct action button, and a kebab overflow menu, all declared on the panel child, all reporting through `panel-action` / `panel-close`.",
			source: { html: chromeExample },
		},
		{
			id: "stacked-rail",
			title: "Stacked rail",
			description: "`mode=\"stack\"` renders every panel as a collapsible section instead of a tab strip, the shape a tool or inspector rail wants. Per-leaf mode also lives in the layout tree, so a stacked rail and a tabbed editor coexist in one workspace.",
			source: { html: stackExample },
		},
	],
};
