/**
 * The state half of the docking seam: a serializable zone/panel tree and the
 * immutable mutations that apply a drop to it. Pairs with {@link ./dock-layout}:
 * `resolveDrop` says *where* a dragged panel lands (`{ targetId, region }`), and
 * {@link dockPanel} applies that to the tree. A consumer (or the future docking
 * elements) renders the tree and persists it with `JSON.stringify`, since every
 * node is plain data. No DOM, no mutation in place.
 */

import type { DockRect, DockRegion } from "./dock-layout.js";

/** A tab group: one or more panels sharing a region, with one active. */
export interface DockLeaf {
	kind: "leaf";
	/** The zone id a {@link DropResolution} targets. */
	id: string;
	/** Panel ids in tab order; the group is empty only transiently during a mutation. */
	panels: string[];
	/** Index into `panels` of the active tab. */
	active: number;
	/**
	 * How the leaf renders its panels. `"tabs"` (the default) shows one active panel behind a tab
	 * strip; `"stack"` shows every panel as a collapsible section stacked top-to-bottom, the shape a
	 * tool/inspector rail wants. `active` and the drag seam are unchanged either way.
	 */
	mode?: "tabs" | "stack";
	/** In `"stack"` mode, the panel ids currently collapsed to just their header. Ignored in `"tabs"` mode. */
	collapsed?: string[];
}

/** A split: children arranged in a row (horizontal neighbors) or column (vertical stack). */
export interface DockSplit {
	kind: "split";
	direction: "row" | "column";
	children: DockNode[];
	/** Flex weights, one per child; equal when omitted. */
	sizes?: number[];
}

export type DockNode = DockLeaf | DockSplit;

/** A panel torn out of the docked tree into a free-floating window, with its rect on the workspace. */
export interface FloatingPanel {
	/** The panel id, matching a panel that is *not* in the docked tree. */
	panelId: string;
	/** Left of the window, in px relative to the workspace's own box. */
	x: number;
	/** Top of the window, in px relative to the workspace's own box. */
	y: number;
	/** Window width in px. */
	w: number;
	/** Window height in px. */
	h: number;
	/** The leaf the panel floated out of, so a plain re-dock can return it there when that leaf still exists. */
	origin?: string;
}

/**
 * The whole persisted workspace: the docked {@link DockNode} tree plus any floating panels. One
 * serializable shape (round-trips with `JSON.stringify`) so a workspace's docks and floats persist
 * together, never split across two stores. A bare `DockNode` still parses (legacy / authored) as a
 * layout with no floats.
 */
export interface DockLayout {
	tree: DockNode;
	floating: FloatingPanel[];
}

function leaf(id: string, panels: string[], active = 0, extra?: Pick<DockLeaf, "mode" | "collapsed">): DockLeaf {
	const node: DockLeaf = { kind: "leaf", id, panels, active: Math.max(0, Math.min(active, panels.length - 1)) };
	if (extra?.mode) node.mode = extra.mode;
	const collapsed = extra?.collapsed?.filter((p) => panels.includes(p));
	if (collapsed && collapsed.length) node.collapsed = collapsed;
	return node;
}

/** Every leaf in the tree, in document order. */
export function allLeaves(node: DockNode): DockLeaf[] {
	if (node.kind === "leaf") return [node];
	return node.children.flatMap(allLeaves);
}

/** Every panel id in the tree, in document order. */
export function allPanels(node: DockNode): string[] {
	return allLeaves(node).flatMap((l) => l.panels);
}

/** The leaf currently holding `panel`, or `null`. */
export function leafOf(node: DockNode, panel: string): DockLeaf | null {
	for (const l of allLeaves(node)) {
		if (l.panels.includes(panel)) return l;
	}
	return null;
}

/** Drop `panel` into a leaf's tab group (center) or beside it as a split (an edge). */
function applyDock(node: DockNode, panel: string, target: string, region: DockRegion, newLeafId: string): DockNode {
	if (node.kind === "leaf") {
		if (node.id !== target) return node;
		if (region === "center") {
			const panels = [...node.panels, panel];
			return leaf(node.id, panels, panels.length - 1, { mode: node.mode, collapsed: node.collapsed });
		}
		const added = leaf(newLeafId, [panel]);
		const direction: DockSplit["direction"] = region === "left" || region === "right" ? "row" : "column";
		const leading = region === "left" || region === "top";
		const children = leading ? [added, node] : [node, added];
		return { kind: "split", direction, children };
	}
	return { ...node, children: node.children.map((c) => applyDock(c, panel, target, region, newLeafId)) };
}

function withoutPanel(node: DockNode, panel: string): DockNode {
	if (node.kind === "leaf") {
		if (!node.panels.includes(panel)) return node;
		const panels = node.panels.filter((p) => p !== panel);
		const active = Math.min(node.active, Math.max(0, panels.length - 1));
		return leaf(node.id, panels, active, { mode: node.mode, collapsed: node.collapsed });
	}
	return { ...node, children: node.children.map((c) => withoutPanel(c, panel)) };
}

/** Drop empty leaves and collapse any split left with a single child. */
function prune(node: DockNode): DockNode | null {
	if (node.kind === "leaf") return node.panels.length === 0 ? null : node;
	const kept: DockNode[] = [];
	const keptSizes: number[] = [];
	node.children.forEach((child, i) => {
		const pruned = prune(child);
		if (pruned) {
			kept.push(pruned);
			keptSizes.push(node.sizes?.[i] ?? 1);
		}
	});
	if (kept.length === 0) return null;
	if (kept.length === 1) return kept[0] ?? null;
	return { ...node, children: kept, sizes: keptSizes };
}

export interface DockPanelInput {
	/** The panel id being docked. */
	panel: string;
	/** The leaf id the drop targets (from a {@link DropResolution}). */
	target: string;
	/** Where on the target the panel lands. */
	region: DockRegion;
	/** Id for the new zone created by an edge drop; required for a split, ignored for `center`. */
	newLeafId?: string;
}

/**
 * Move `panel` onto `target` at `region`, returning a new tree. The panel leaves its
 * current leaf first (an empty leaf and any single-child split it leaves behind
 * collapse away), then joins the target as a tab (`center`) or beside it in a split
 * (an edge). An edge drop needs `newLeafId` for the zone it creates. Docking a panel
 * onto its own leaf at `center` is a no-op.
 */
export function dockPanel(root: DockNode, input: DockPanelInput): DockNode {
	const { panel, target, region } = input;
	const current = leafOf(root, panel);
	if (current && current.id === target && region === "center") return root;
	const withoutIt = prune(withoutPanel(root, panel)) ?? leaf(target, []);
	const newLeafId = input.newLeafId ?? `${target}:${region}`;
	return applyDock(withoutIt, panel, target, region, newLeafId);
}

/** Remove `panel` from the tree, collapsing any zone or split it empties. Returns `null` if the tree is now empty. */
export function removePanel(root: DockNode, panel: string): DockNode | null {
	return prune(withoutPanel(root, panel));
}

/** Activate `panel`'s tab within its leaf, returning a new tree (a no-op if absent). */
export function activatePanel(root: DockNode, panel: string): DockNode {
	if (root.kind === "leaf") {
		const idx = root.panels.indexOf(panel);
		return idx < 0 ? root : { ...root, active: idx };
	}
	return { ...root, children: root.children.map((c) => activatePanel(c, panel)) };
}

/** Build a single-zone layout from a list of panels, optionally in `"stack"` mode. */
export function singleZone(id: string, panels: string[], mode?: DockLeaf["mode"]): DockLeaf {
	return leaf(id, panels, 0, { mode });
}

/**
 * Toggle a panel's collapsed state within its leaf (a `"stack"`-mode affordance), returning a new
 * tree. A no-op for a panel that isn't found; the leaf's `mode` is left to the caller, so this works
 * whether or not the leaf is currently stacked.
 */
export function toggleCollapsed(root: DockNode, panel: string): DockNode {
	if (root.kind === "leaf") {
		if (!root.panels.includes(panel)) return root;
		const collapsed = root.collapsed ?? [];
		const next = collapsed.includes(panel) ? collapsed.filter((p) => p !== panel) : [...collapsed, panel];
		return leaf(root.id, root.panels, root.active, { mode: root.mode, collapsed: next });
	}
	return { ...root, children: root.children.map((c) => toggleCollapsed(c, panel)) };
}

/** Set a leaf's render mode (`"tabs"` or `"stack"`) by id, returning a new tree (a no-op if absent). */
export function setLeafMode(root: DockNode, leafId: string, mode: DockLeaf["mode"]): DockNode {
	if (root.kind === "leaf") {
		return root.id === leafId ? leaf(root.id, root.panels, root.active, { mode, collapsed: root.collapsed }) : root;
	}
	return { ...root, children: root.children.map((c) => setLeafMode(c, leafId, mode)) };
}

/** The window rect a panel floats at. */
export type FloatRect = Pick<FloatingPanel, "x" | "y" | "w" | "h">;

/**
 * Tear `panel` out of the docked tree into a floating window at `rect`, returning a new layout. The
 * panel leaves its leaf (an emptied leaf and any single-child split it leaves collapse away, exactly
 * as a re-dock does), then joins `floating`. A no-op for a panel already floating or absent. If the
 * tree empties, it falls back to an empty `rootId` zone so the workspace still has a drop target.
 */
export function floatPanel(layout: DockLayout, panel: string, rect: FloatRect, rootId = "zone-0"): DockLayout {
	const origin = leafOf(layout.tree, panel);
	if (!origin) return layout;
	const tree = removePanel(layout.tree, panel) ?? leaf(rootId, []);
	const floating = [...layout.floating.filter((f) => f.panelId !== panel), { panelId: panel, ...rect, origin: origin.id }];
	return { tree, floating };
}

/** Move / resize a floating panel's window, returning a new layout (a no-op if the panel isn't floating). */
export function updateFloating(layout: DockLayout, panel: string, rect: Partial<FloatRect>): DockLayout {
	if (!layout.floating.some((f) => f.panelId === panel)) return layout;
	return { ...layout, floating: layout.floating.map((f) => (f.panelId === panel ? { ...f, ...rect } : f)) };
}

/**
 * Re-dock a floating panel back into the tree, returning a new layout. Routes through the same
 * {@link dockPanel} a tab move uses, so a float lands as a tab (`center`) or a split (an edge) just
 * like any other drop. A no-op for a panel that isn't currently floating.
 */
export function dockFloating(layout: DockLayout, panel: string, input: Omit<DockPanelInput, "panel">): DockLayout {
	if (!layout.floating.some((f) => f.panelId === panel)) return layout;
	const tree = dockPanel(layout.tree, { ...input, panel });
	return { tree, floating: layout.floating.filter((f) => f.panelId !== panel) };
}

/** Drop a floating panel entirely (a float that is closed), returning a new layout. */
export function removeFloating(layout: DockLayout, panel: string): DockLayout {
	return { ...layout, floating: layout.floating.filter((f) => f.panelId !== panel) };
}

/** Every panel id in a layout: the docked panels in tree order, then the floating ones in their array order. */
export function allLayoutPanels(layout: DockLayout): string[] {
	return [...allPanels(layout.tree), ...layout.floating.map((f) => f.panelId)];
}

function isNode(value: unknown): value is DockNode {
	if (!value || typeof value !== "object") return false;
	const node = value as { kind?: unknown };
	if (node.kind === "leaf") {
		const l = value as Partial<DockLeaf>;
		if (!(typeof l.id === "string" && Array.isArray(l.panels) && l.panels.every((p) => typeof p === "string") && typeof l.active === "number")) return false;
		if (l.mode !== undefined && l.mode !== "tabs" && l.mode !== "stack") return false;
		if (l.collapsed !== undefined && !(Array.isArray(l.collapsed) && l.collapsed.every((p) => typeof p === "string"))) return false;
		return true;
	}
	if (node.kind === "split") {
		const s = value as Partial<DockSplit>;
		return (s.direction === "row" || s.direction === "column") && Array.isArray(s.children) && s.children.every(isNode);
	}
	return false;
}

/** Parse a persisted layout (round-trips with `JSON.stringify`), throwing on a malformed shape. */
export function parseLayout(json: string): DockNode {
	const value: unknown = JSON.parse(json);
	if (!isNode(value)) throw new Error("xoji: malformed dock layout");
	return value;
}

function isFloatingPanel(value: unknown): value is FloatingPanel {
	if (!value || typeof value !== "object") return false;
	const f = value as Partial<FloatingPanel>;
	if (f.origin !== undefined && typeof f.origin !== "string") return false;
	return typeof f.panelId === "string" && typeof f.x === "number" && typeof f.y === "number" && typeof f.w === "number" && typeof f.h === "number";
}

function isLayout(value: unknown): value is DockLayout {
	if (!value || typeof value !== "object") return false;
	const l = value as Partial<DockLayout>;
	return isNode(l.tree) && Array.isArray(l.floating) && l.floating.every(isFloatingPanel);
}

/**
 * Parse a persisted {@link DockLayout} (docks + floats), throwing on a malformed shape. Accepts a
 * bare {@link DockNode} too, wrapping it as a layout with no floats, so an authored `layout` attribute
 * and a pre-float persisted tree both still load.
 */
export function parseDockLayout(json: string): DockLayout {
	const value: unknown = JSON.parse(json);
	if (isLayout(value)) return value;
	if (isNode(value)) return { tree: value, floating: [] };
	throw new Error("xoji: malformed dock layout");
}

export interface LeafRect {
	/** The leaf's id, matching a {@link DockLeaf}. */
	id: string;
	/** The leaf's rectangle within the laid-out container. */
	rect: DockRect;
}

/**
 * Lay the tree out inside `container`, returning every leaf's rectangle. Splits divide
 * their axis by `sizes` (equal when absent) and inset their children by `gap`. This is
 * the geometry-out companion to {@link ./dock-layout}'s `resolveDrop` (geometry-in): a
 * renderer positions each zone by its rect, and the same rects feed straight back in as
 * `resolveDrop` targets, so the engine round-trips tree to rects to drop to tree.
 */
export function layoutRects(node: DockNode, container: DockRect, gap = 0): LeafRect[] {
	if (node.kind === "leaf") return [{ id: node.id, rect: container }];
	const count = node.children.length;
	if (count === 0) return [];
	const sizes = node.sizes && node.sizes.length === count ? node.sizes : node.children.map(() => 1);
	const total = sizes.reduce((sum, s) => sum + s, 0) || count;
	const isRow = node.direction === "row";
	const axis = isRow ? container.width : container.height;
	const available = axis - gap * (count - 1);
	let offset = isRow ? container.left : container.top;
	const out: LeafRect[] = [];
	node.children.forEach((child, i) => {
		const extent = available * ((sizes[i] ?? 1) / total);
		const childRect: DockRect = isRow
			? { top: container.top, left: offset, width: extent, height: container.height }
			: { top: offset, left: container.left, width: container.width, height: extent };
		out.push(...layoutRects(child, childRect, gap));
		offset += extent + gap;
	});
	return out;
}
