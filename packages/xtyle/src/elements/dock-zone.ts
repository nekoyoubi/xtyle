import { XtyleDecoratorElement, define } from "./base.js";
import { resolveDrop, type DockRect, type DockRegion, type DropResolution } from "./dock-layout.js";
import {
	dockPanel,
	removePanel,
	toggleCollapsed,
	floatPanel,
	updateFloating,
	dockFloating,
	allPanels,
	allLeaves,
	singleZone,
	parseDockLayout,
	type DockNode,
	type DockLeaf,
	type DockLayout,
	type FloatingPanel,
	type FloatRect,
} from "./dock-model.js";
import { FragmentHost } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/dock-zone/source.generated.js";
// The fill's kebab opens a real `<xtyle-menu>` it renders, so the tag must be defined wherever the
// zone is: importing the class both registers the element and types the popup the zone drives.
import { XtyleMenu } from "./menu.js";
import type { MenuItem } from "../markup/index.js";

/** A direct control button in a panel's header: a glyph and the accessible name that fires a `panel-action`. */
interface PanelAction {
	id: string;
	label: string;
	/** A short glyph or emoji shown on the button; `label` is its accessible name. */
	icon?: string;
}

interface PanelMeta {
	id: string;
	title: string;
	el: HTMLElement;
	/** Trailing text on the panel's tab / section header (a status count). */
	badge: string | null;
	/** Renders a built-in close button that fires a cancelable `panel-close`. */
	closable: boolean;
	/** Direct header buttons, rendered before the overflow menu and close. */
	actions: PanelAction[];
	/** A kebab overflow menu (an `<xtyle-menu>`) for the operations that don't earn a dedicated button. */
	menu: MenuItem[] | null;
}

/**
 * A drag-and-drop dockable-panel workspace. Its direct children are the panels (any element
 * carrying `data-panel-id`, and a `data-title` or `title` for its tab); the zone reads them,
 * arranges them into a {@link DockNode} layout, and its fragment renders the tab strips, splits,
 * float windows, and drag films around them. Dragging a tab re-docks its panel into another zone as
 * a tab (`center`) or a split (an edge), and the new layout dispatches a `layout-change` event
 * carrying the serializable tree.
 *
 * The chrome is a fragment (`fragments/dock-zone`), so an app can reshape a tab, a section header,
 * a float window, or the kebab the same way a third-party mod would; the element keeps the parts a
 * sandbox cannot own — the dock math, the pointer gestures, panel custody, and the persisted layout —
 * and reaches the chrome only by selector, so a re-render never strands a handler on a dead node.
 *
 * The layout physics are xtyle's: the zone wires pointer drags through `resolveDrop` (the drop
 * geometry) and `dockPanel` (the tree mutation), the same headless engine a consumer can drive
 * directly. Set `.layout` to restore a persisted tree; read it back from `layout-change.detail`.
 *
 * A floating window's titlebar *moves* it. Because the zones tile the whole workspace, a drop resolver
 * asked for every pointer position answers everywhere — so a float earns a re-dock only inside the
 * `--dock-band` along a zone's boundary, and the drop films appear only there. Everywhere else is open
 * floor. The window's own dock button is the way back to a tab.
 *
 * A panel carries its own header chrome, declared on the panel child: `data-closable` renders a
 * close button (a cancelable `panel-close` event; unless prevented, the zone removes the panel and
 * fires `layout-change`), `data-actions` (a JSON `{ id, label, icon? }[]`) renders direct header
 * buttons, and `data-menu` (a JSON menu-item array) renders a kebab overflow `<xtyle-menu>`. Both a
 * direct button and a menu row fire a `panel-action` event (`detail: { panelId, actionId }`). The
 * action chrome always reflects the zone's active panel; a `data-badge` (trailing status text) rides
 * on every panel's own tab or stacked-section header, not just the active one.
 */
export class XtyleDockZone extends XtyleDecoratorElement {
	private _layout: DockNode | null = null;
	private _floating: FloatingPanel[] = [];
	private panels = new Map<string, PanelMeta>();
	private collected = false;
	private delegated = false;
	/** Drag-preview films the fill renders over the live zones: the drop target, the remnant a split
	 * would leave behind, and one per other zone (each tinted by its modifier class). All inert; the
	 * element only places and reveals them, re-resolving them after every re-render. */
	private dropFilm: HTMLElement | null = null;
	private remnantFilm: HTMLElement | null = null;
	private restFilms: HTMLElement[] = [];
	/** The cursor-anchored `<xtyle-menu>` the fill renders once; every panel's kebab opens it with
	 * that panel's rows. */
	private overflow: XtyleMenu | null = null;
	private overflowPanelId: string | null = null;
	/** An in-flight tab gesture. `active` flips true only once the pointer travels past
	 * `DRAG_THRESHOLD`, so a click (no travel) activates the tab instead of re-docking it. */
	private drag: { panelId: string; zoneId: string; index: number; startX: number; startY: number; active: boolean } | null =
		null;

	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "dock-zone", {
		applyIntent: () => {},
		afterApply: () => this.afterApply(),
	});

	/** Pointer travel, in px, before a tab press becomes a drag rather than a click. */
	private static readonly DRAG_THRESHOLD = 5;

	/** The whole workspace: the docked tree plus any floating windows. A bare `DockNode` is still
	 * accepted (legacy / authored) and read as a layout with no floats. */
	get layout(): DockLayout | null {
		return this._layout ? { tree: this._layout, floating: this._floating } : null;
	}
	set layout(value: DockNode | DockLayout | null) {
		if (value == null) {
			this._layout = null;
			this._floating = [];
		} else if ("kind" in value) {
			this._layout = value;
			this._floating = [];
		} else {
			this._layout = value.tree;
			this._floating = value.floating ?? [];
		}
		if (this.isConnected) this.render();
	}

	/** Set both halves of the layout from a {@link DockLayout} and re-render. */
	private applyLayout(layout: DockLayout): void {
		this._layout = layout.tree;
		this._floating = layout.floating;
		this.render();
	}

	private emitLayoutChange(): void {
		this.dispatchEvent(new CustomEvent("layout-change", { bubbles: true, composed: true, detail: { layout: this.layout } }));
	}

	connectedCallback(): void {
		// Setup precedes `super.connectedCallback()` here (unlike the other elements): the base's first-connect
		// render calls this override, and an un-collected, un-seeded render would paint the fill's scaffold over
		// the panel children before `collectPanels` could capture them. Seed first, then let the base render.
		this.collectPanels();
		if (!this._layout) {
			const init = this.initialLayout();
			this._layout = init.tree;
			this._floating = init.floating;
		}
		this.delegate();
		super.connectedCallback();
		this.render();
	}

	/** The starting layout: a `layout` attribute (a JSON {@link DockLayout} or bare {@link DockNode})
	 * when present and valid, so a split workspace with floats can be authored declaratively; otherwise
	 * one zone holding every docked panel, in the `mode` attribute's mode (`stack` for a collapsible
	 * rail, `tabs` otherwise), with no floats. */
	private initialLayout(): DockLayout {
		const attr = this.getAttribute("layout");
		if (attr) {
			try {
				const parsed = parseDockLayout(attr);
				this.seedLeafCounter(parsed.tree);
				return parsed;
			} catch {
				// Malformed authored layout: warn so the declarative path stays debuggable, then fall
				// back to a single zone rather than render nothing.
				console.warn("xtyle-dock-zone: malformed `layout` attribute; falling back to a single zone.", attr);
			}
		}
		const mode = this.getAttribute("mode") === "stack" ? "stack" : undefined;
		return { tree: singleZone("zone-0", [...this.panels.keys()], mode), floating: [] };
	}

	/** Advance the new-zone counter past the highest `zone-N` already in the tree, so a split made from
	 * an authored layout never reuses an existing id. */
	private seedLeafCounter(node: DockNode): void {
		let max = 0;
		for (const l of allLeaves(node)) {
			const m = /^zone-(\d+)$/.exec(l.id);
			if (m) max = Math.max(max, Number(m[1]));
		}
		this.leafId = max;
	}

	/** Read the authored panel children once. The fill's scaffold replaces the element's children, and
	 * a placed panel then lives inside the chrome rather than beside it, so a second pass (a re-connect
	 * after a move in the DOM) would find no panels and empty the workspace. Custody stays in the map. */
	private collectPanels(): void {
		if (this.collected) return;
		this.collected = true;
		for (const child of Array.from(this.children) as HTMLElement[]) {
			const id = child.getAttribute("data-panel-id");
			if (!id) continue;
			child.dataset.dockPanelHost = "";
			this.panels.set(id, {
				id,
				title: child.getAttribute("data-title") ?? child.getAttribute("title") ?? id,
				el: child,
				badge: child.getAttribute("data-badge"),
				closable: child.hasAttribute("data-closable"),
				actions: this.parsePanelActions(child),
				menu: this.parsePanelMenu(child),
			});
		}
	}

	private parsePanelActions(child: HTMLElement): PanelAction[] {
		const raw = child.getAttribute("data-actions");
		if (!raw) return [];
		try {
			const parsed: unknown = JSON.parse(raw);
			if (!Array.isArray(parsed)) return [];
			return parsed.filter(
				(a): a is PanelAction => !!a && typeof a === "object" && typeof (a as PanelAction).id === "string" && typeof (a as PanelAction).label === "string",
			);
		} catch {
			console.warn("xtyle-dock-zone: malformed `data-actions` on a panel; expected a JSON array of { id, label, icon? }.", raw);
			return [];
		}
	}

	private parsePanelMenu(child: HTMLElement): MenuItem[] | null {
		const raw = child.getAttribute("data-menu");
		if (!raw) return null;
		try {
			const parsed: unknown = JSON.parse(raw);
			return Array.isArray(parsed) ? (parsed as MenuItem[]) : null;
		} catch {
			console.warn("xtyle-dock-zone: malformed `data-menu` on a panel; expected a JSON array of menu items.", raw);
			return null;
		}
	}

	private leafId = 0;
	private nextLeafId(): string {
		this.leafId += 1;
		return `zone-${this.leafId}`;
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.fragment.ensureScaffold("");
		if (this._layout) {
			const known = new Set(this.panels.keys());
			const floating = new Set(this._floating.map((f) => f.panelId));
			const live = allPanels(this._layout).filter((p) => known.has(p));
			for (const id of known) {
				// A floating panel is legitimately absent from the tree; only re-dock a truly orphaned one.
				if (!live.includes(id) && !floating.has(id)) this._layout = dockPanel(this._layout, { panel: id, target: this.rootLeafId(), region: "center" });
			}
		}
		// The chrome's structure changes on nearly every render (a split appears, a tab moves zones, a
		// window floats), which the patch ops cannot express — so each render rebuilds it.
		this.fragment.remount();
		this.fragment.update(this.bindings());
	}

	/** Re-resolve the chrome the fill just (re)built and hand the panels back to it. The panels are the
	 * consumer's own elements, held in the map across every rebuild, so their content and state survive
	 * a re-render; a panel that is neither active nor floating stays detached. */
	private afterApply(): void {
		this.dropFilm = this.queryChrome('[data-film="drop"]');
		this.remnantFilm = this.queryChrome('[data-film="remnant"]');
		this.restFilms = Array.from(this.querySelectorAll<HTMLElement>('[data-film="rest"]'));
		this.overflow = this.queryChrome<XtyleMenu>("[data-panel-menu-popup]");
		this.placeActivePanels();
		this.placeFloatPanels();
	}

	private queryChrome<T extends Element = HTMLElement>(selector: string): T | null {
		return this.querySelector<T>(selector);
	}

	private rootLeafId(): string {
		let leaf: DockLeaf | null = null;
		const walk = (n: DockNode): void => {
			if (n.kind === "leaf") {
				if (!leaf) leaf = n;
			} else n.children.forEach(walk);
		};
		walk(this._layout!);
		return leaf ? (leaf as DockLeaf).id : "zone-0";
	}

	/** The whole workspace, flattened to the JSON the fill renders from: the tree with each panel's
	 * title, badge, and controls resolved, the floating windows with their rects, one spare film per
	 * other zone, and whether any panel carries an overflow menu at all. */
	private bindings(): Record<string, unknown> {
		if (!this._layout) return { tree: null, floats: [], restFilms: 0, hasMenu: false };
		return {
			tree: this.nodeBinding(this._layout, 1),
			floats: this._floating.map((f) => ({
				panelId: f.panelId,
				title: this.panels.get(f.panelId)?.title ?? f.panelId,
				x: f.x,
				y: f.y,
				w: f.w,
				h: f.h,
			})),
			restFilms: Math.max(0, allLeaves(this._layout).length - 1),
			hasMenu: [...this.panels.values()].some((p) => p.menu !== null),
		};
	}

	private nodeBinding(node: DockNode, flex: number): Record<string, unknown> {
		if (node.kind === "split") {
			return {
				kind: "split",
				direction: node.direction,
				flex,
				children: node.children.map((child, i) => this.nodeBinding(child, node.sizes?.[i] ?? 1)),
			};
		}
		const collapsed = new Set(node.collapsed ?? []);
		return {
			kind: "leaf",
			id: node.id,
			mode: node.mode === "stack" ? "stack" : "tabs",
			active: node.active,
			flex,
			panels: node.panels.map((pid, index) => {
				const meta = this.panels.get(pid);
				return {
					id: pid,
					index,
					title: meta?.title ?? pid,
					badge: meta?.badge ?? null,
					closable: meta?.closable === true,
					actions: meta?.actions ?? [],
					hasMenu: meta?.menu != null,
					collapsed: collapsed.has(pid),
				};
			}),
		};
	}

	private emitAction(panelId: string, actionId: string): void {
		this.dispatchEvent(new CustomEvent("panel-action", { bubbles: true, composed: true, detail: { panelId, actionId } }));
	}

	/**
	 * Close a panel exactly as the built-in close button does: fire a cancelable `panel-close`, and
	 * unless a listener prevents it, remove the panel and report the new layout through
	 * `layout-change`. Public so a consumer's own control (a `data-menu` "close" row, a keyboard
	 * shortcut) closes through the same path. Pulling a panel from the tree by hand and re-setting
	 * `.layout` won't stick, since the panel is still a DOM child the zone will recover.
	 */
	closePanel(panelId: string): void {
		const proceed = this.dispatchEvent(
			new CustomEvent("panel-close", { bubbles: true, composed: true, cancelable: true, detail: { panelId } }),
		);
		if (!proceed || !this._layout) return;
		this.panels.delete(panelId);
		this._layout = removePanel(this._layout, panelId);
		this._floating = this._floating.filter((f) => f.panelId !== panelId);
		this.render();
		this.emitLayoutChange();
	}

	/**
	 * Tear a docked panel out into a floating window over the workspace, returning it via
	 * `layout-change`. The window opens at `rect` (or a cascaded default). Public so a consumer wires
	 * it to a `data-menu` "float" row or a shortcut; the float persists on the same layout as the docks.
	 */
	floatPanel(panelId: string, rect?: FloatRect): void {
		if (!this._layout || !this.panels.has(panelId)) return;
		const before = this.layout!;
		const after = floatPanel(before, panelId, rect ?? this.defaultFloatRect(), this.rootLeafId());
		if (after === before) return;
		this.applyLayout(after);
		this.emitLayoutChange();
	}

	/**
	 * Re-dock a floating panel back into the tree, returning it via `layout-change`. Routes through the
	 * same `dockPanel` a tab move uses, so by default the panel rejoins the root zone as a tab; pass a
	 * `target` / `region` to land it elsewhere. Public so a float window's dock button (or a consumer
	 * control) closes the round-trip.
	 */
	dockFloating(panelId: string, target?: string, region: DockRegion = "center"): void {
		const before = this.layout;
		if (!before) return;
		const to = target ?? this.redockTarget(before, panelId);
		const after = dockFloating(before, panelId, { target: to, region, newLeafId: this.nextLeafId() });
		if (after === before) return;
		this.applyLayout(after);
		this.emitLayoutChange();
	}

	/** Where a plain re-dock lands: the float's origin leaf when it still exists, otherwise the root zone. */
	private redockTarget(layout: DockLayout, panelId: string): string {
		const origin = layout.floating.find((f) => f.panelId === panelId)?.origin;
		if (origin && allLeaves(layout.tree).some((l) => l.id === origin)) return origin;
		return this.rootLeafId();
	}

	/** A cascaded default rect for a newly floated panel, so successive floats do not stack exactly. */
	private defaultFloatRect(): FloatRect {
		const n = this._floating.length;
		const host = this.getBoundingClientRect();
		const w = Math.min(480, Math.max(300, host.width * 0.5));
		const h = Math.min(400, Math.max(240, host.height * 0.6));
		const cascade = (n % 6) * 28;
		return { x: 32 + cascade, y: 32 + cascade, w, h };
	}

	private activate(zoneId: string, index: number): void {
		if (!this._layout) return;
		const setActive = (n: DockNode): DockNode => {
			if (n.kind === "leaf") return n.id === zoneId ? { ...n, active: index } : n;
			return { ...n, children: n.children.map(setActive) };
		};
		this._layout = setActive(this._layout);
		this.render();
	}

	/** Toggle a stacked section's collapsed state, then report the new tree (collapse is part of the persisted layout). */
	private toggleCollapse(panelId: string): void {
		if (!this._layout) return;
		this._layout = toggleCollapsed(this._layout, panelId);
		this.render();
		this.emitLayoutChange();
	}

	private placeActivePanels(): void {
		if (!this._layout) return;
		const walk = (n: DockNode): void => {
			if (n.kind === "leaf") {
				if (n.mode === "stack") {
					for (const pid of n.panels) this.placePanel(pid, this.querySelector<HTMLElement>(`[data-section-body-for="${CSS.escape(pid)}"]`));
				} else {
					this.placePanel(n.panels[n.active], this.querySelector<HTMLElement>(`[data-body-for="${CSS.escape(n.id)}"]`));
				}
			} else n.children.forEach(walk);
		};
		walk(this._layout);
	}

	private placeFloatPanels(): void {
		for (const f of this._floating) {
			this.placePanel(f.panelId, this.querySelector<HTMLElement>(`[data-float-body-for="${CSS.escape(f.panelId)}"]`));
		}
	}

	private placePanel(panelId: string | undefined, body: HTMLElement | null): void {
		const meta = panelId ? this.panels.get(panelId) : undefined;
		if (body && meta) {
			meta.el.hidden = false;
			body.appendChild(meta.el);
		}
	}

	/** One pointerdown / click / select listener on the host, resolving every control by selector. The
	 * chrome is rebuilt on every render, so a handler bound to a node the fill built would be stranded
	 * the first time the layout changes; delegation means the gestures never hold a chrome reference. */
	private delegate(): void {
		if (this.delegated) return;
		this.delegated = true;
		this.addEventListener("pointerdown", (e) => this.onPointerdown(e as PointerEvent));
		this.addEventListener("click", (e) => this.onClick(e as MouseEvent));
		this.addEventListener("select", (e) => this.onOverflowSelect(e as CustomEvent<{ value?: string }>));
	}

	private onPointerdown(event: PointerEvent): void {
		const target = event.target as HTMLElement | null;
		if (!target?.closest) return;
		const resize = target.closest<HTMLElement>("[data-float-resize]");
		if (resize) {
			this.onFloatResizedown(event, resize.dataset.ownerPanel ?? "");
			return;
		}
		// A press on a float's own control must not also arm the titlebar drag under it.
		if (target.closest("[data-float-control]")) return;
		const head = target.closest("[data-float-head]");
		if (head) {
			const win = head.closest<HTMLElement>("[data-float-id]");
			if (win?.dataset.floatId) this.onFloatPointerdown(event, win.dataset.floatId);
			return;
		}
		const grip = target.closest<HTMLElement>("[data-tab], [data-section-toggle]");
		if (!grip?.dataset.panelId) return;
		this.onTabPointerdown(event, grip.dataset.panelId, grip.dataset.zoneId ?? "", Number(grip.dataset.index ?? "0"));
	}

	private onClick(event: MouseEvent): void {
		const target = event.target as HTMLElement | null;
		if (!target?.closest) return;
		const action = target.closest<HTMLElement>("[data-panel-action]");
		if (action) {
			this.emitAction(action.dataset.ownerPanel ?? "", action.dataset.actionId ?? "");
			return;
		}
		const kebab = target.closest<HTMLElement>("[data-panel-menu]");
		if (kebab) {
			this.openOverflow(kebab);
			return;
		}
		const close = target.closest<HTMLElement>("[data-panel-close]");
		if (close) {
			this.closePanel(close.dataset.ownerPanel ?? "");
			return;
		}
		const dock = target.closest<HTMLElement>("[data-float-dock]");
		if (dock) {
			this.dockFloating(dock.dataset.ownerPanel ?? "");
			return;
		}
		// Keyboard activation only (`detail === 0`); a pointer press on a tab or a section header routes
		// through the drag gesture, so click-vs-drag is decided by travel, not by a second racing handler.
		if (event.detail !== 0) return;
		const tab = target.closest<HTMLElement>("[data-tab]");
		if (tab) {
			this.activate(tab.dataset.zoneId ?? "", Number(tab.dataset.index ?? "0"));
			return;
		}
		const toggle = target.closest<HTMLElement>("[data-section-toggle]");
		if (toggle?.dataset.panelId) this.toggleCollapse(toggle.dataset.panelId);
	}

	/** Open the shared overflow menu at a panel's kebab, loaded with that panel's rows. */
	private openOverflow(kebab: HTMLElement): void {
		const panelId = kebab.dataset.ownerPanel ?? "";
		const meta = this.panels.get(panelId);
		if (!this.overflow || !meta?.menu) return;
		this.overflowPanelId = panelId;
		this.overflow.items = meta.menu;
		this.overflow.label = `${meta.title} options`;
		const rect = kebab.getBoundingClientRect();
		this.overflow.openAt(rect.right, rect.bottom, { align: "end" });
	}

	private onOverflowSelect(event: CustomEvent<{ value?: string }>): void {
		if (event.target !== this.overflow || !this.overflowPanelId) return;
		const value = event.detail?.value;
		if (value != null) this.emitAction(this.overflowPanelId, value);
	}

	/** The smallest a floating window resizes to, in px; kept in step with the CSS `min-width` / `min-height`. */
	private static readonly FLOAT_MIN_W = 160;
	private static readonly FLOAT_MIN_H = 112;
	/** Roughly the titlebar height, in px; offsets a drag-out float so the pointer lands on the titlebar. */
	private static readonly FLOAT_TITLE_H = 16;

	/** The band's width comes from the theme's spacing scale through `--dock-band`, registered as a
	 * `<length>` so it computes to px; the literal is what a host with no register applied falls back to. */
	private static readonly DOCK_BAND_PROP = "--dock-band";
	private static readonly DOCK_BAND_PX = 48;

	/** How close, in px, the pointer must come to a zone's boundary before a re-dock is on offer. */
	private dockBand(): number {
		const raw = getComputedStyle(this).getPropertyValue(XtyleDockZone.DOCK_BAND_PROP).trim();
		const px = raw.endsWith("px") ? Number.parseFloat(raw) : Number.NaN;
		return Number.isFinite(px) && px > 0 ? px : XtyleDockZone.DOCK_BAND_PX;
	}

	/**
	 * The dock a float's titlebar drag is offering, or `null` for a plain move.
	 *
	 * The zones tile the whole workspace, so `resolveDrop` answers *everywhere* inside it — asking it alone
	 * would re-dock a window the moment its titlebar was nudged, and a pure move would only be possible by
	 * dragging clean out of the workspace. So a float has to earn its dock: the pointer must come within
	 * {@link dockBand} px of a zone's boundary, which is the seam a split would land against anyway. Every
	 * other point in the workspace is open floor.
	 *
	 * Inside the band the drop is always a split. A `center` there means the zone is too narrow to have an
	 * outside, and there is nothing to split; the window's dock button is the way back to a tab.
	 */
	private floatDockOffer(pointer: { x: number; y: number }, zones: Array<{ id: string; rect: DockRect }>): DropResolution | null {
		const res = resolveDrop({ pointer, targets: zones });
		if (!res || res.region === "center") return null;
		const rect = zones.find((z) => z.id === res.targetId)?.rect;
		if (!rect) return null;
		const toBoundary = Math.min(
			pointer.x - rect.left,
			rect.left + rect.width - pointer.x,
			pointer.y - rect.top,
			rect.top + rect.height - pointer.y,
		);
		return toBoundary <= this.dockBand() ? res : null;
	}

	/** Wire a pointer-drag loop (`onMove` per pointermove, `onCommit` on release), tearing the listeners
	 * down on release or cancel. The callers own their own pending state through closures. */
	private trackPointerDrag(onMove: (event: PointerEvent) => void, onCommit: () => void): void {
		const up = () => {
			window.removeEventListener("pointermove", onMove);
			window.removeEventListener("pointerup", up);
			window.removeEventListener("pointercancel", up);
			onCommit();
		};
		window.addEventListener("pointermove", onMove);
		window.addEventListener("pointerup", up);
		window.addEventListener("pointercancel", up);
	}

	private floatWindow(panelId: string): HTMLElement | null {
		return this.querySelector<HTMLElement>(`[data-float-id="${CSS.escape(panelId)}"]`);
	}

	/**
	 * Drag a floating window's titlebar. This is a **move**: the window follows the pointer, clamped to the
	 * workspace, and releasing it leaves it where it lies.
	 *
	 * It becomes a re-dock only where one is actually on offer — {@link floatDockOffer}, the band along a
	 * zone's boundary. There, the drop films light up to promise the split, and releasing takes it.
	 */
	private onFloatPointerdown(event: PointerEvent, panelId: string): void {
		if (event.button !== 0) return;
		const start = this._floating.find((f) => f.panelId === panelId);
		const win = this.floatWindow(panelId);
		if (!start || !win) return;
		event.preventDefault();
		const host = this.getBoundingClientRect();
		const maxX = Math.max(0, host.width - start.w);
		const maxY = Math.max(0, host.height - start.h);
		const offsetX = event.clientX - start.x;
		const offsetY = event.clientY - start.y;
		win.classList.add("is-dragging");
		let next: FloatRect = { x: start.x, y: start.y, w: start.w, h: start.h };
		let redock: DropResolution | null = null;
		this.trackPointerDrag(
			(e) => {
				const x = Math.max(0, Math.min(maxX, Math.round(e.clientX - offsetX)));
				const y = Math.max(0, Math.min(maxY, Math.round(e.clientY - offsetY)));
				win.style.left = `${x}px`;
				win.style.top = `${y}px`;
				next = { x, y, w: start.w, h: start.h };
				const zones = this.zoneTargets();
				redock = this.floatDockOffer({ x: e.clientX, y: e.clientY }, zones);
				if (redock) this.paintDropFilms(redock, zones, host);
				else this.hideFilms();
			},
			() => {
				win.classList.remove("is-dragging");
				this.hideFilms();
				if (redock) {
					this.dockFloating(panelId, redock.targetId, redock.region);
				} else {
					this._floating = updateFloating(this.layout!, panelId, next).floating;
					this.emitLayoutChange();
				}
			},
		);
	}

	/** Drag the bottom-right grip to resize a floating window, floored at the minimum and capped at the edge. */
	private onFloatResizedown(event: PointerEvent, panelId: string): void {
		if (event.button !== 0) return;
		const start = this._floating.find((f) => f.panelId === panelId);
		const win = this.floatWindow(panelId);
		if (!start || !win) return;
		event.preventDefault();
		const host = this.getBoundingClientRect();
		const maxW = Math.max(XtyleDockZone.FLOAT_MIN_W, host.width - start.x);
		const maxH = Math.max(XtyleDockZone.FLOAT_MIN_H, host.height - start.y);
		let next: FloatRect = { x: start.x, y: start.y, w: start.w, h: start.h };
		this.trackPointerDrag(
			(e) => {
				const w = Math.max(XtyleDockZone.FLOAT_MIN_W, Math.min(maxW, Math.round(start.w + (e.clientX - event.clientX))));
				const h = Math.max(XtyleDockZone.FLOAT_MIN_H, Math.min(maxH, Math.round(start.h + (e.clientY - event.clientY))));
				win.style.width = `${w}px`;
				win.style.height = `${h}px`;
				next = { x: start.x, y: start.y, w, h };
			},
			() => {
				this._floating = updateFloating(this.layout!, panelId, next).floating;
				this.emitLayoutChange();
			},
		);
	}

	private placeFilm(el: HTMLElement, rect: DockRect, host: DOMRect): void {
		Object.assign(el.style, {
			top: `${rect.top - host.top}px`,
			left: `${rect.left - host.left}px`,
			width: `${rect.width}px`,
			height: `${rect.height}px`,
		});
		el.hidden = false;
	}

	private hideFilms(): void {
		if (this.dropFilm) this.dropFilm.hidden = true;
		if (this.remnantFilm) this.remnantFilm.hidden = true;
		for (const f of this.restFilms) f.hidden = true;
	}

	/** Place a film over every non-target zone, hiding any spare. */
	private placeRestFilms(rects: DockRect[], host: DOMRect): void {
		rects.forEach((r, i) => {
			const film = this.restFilms[i];
			if (film) this.placeFilm(film, r, host);
		});
		for (let i = rects.length; i < this.restFilms.length; i += 1) this.restFilms[i]!.hidden = true;
	}

	/** The half of `zone` a split would leave in place, the complement of the drop `highlight`. A
	 * center (tab) drop splits nothing, so it has no remnant. */
	private remnantRect(zone: DockRect, drop: DockRect, region: DockRegion): DockRect | null {
		switch (region) {
			case "left":
				return { top: zone.top, left: drop.left + drop.width, width: zone.width - drop.width, height: zone.height };
			case "right":
				return { top: zone.top, left: zone.left, width: zone.width - drop.width, height: zone.height };
			case "top":
				return { top: drop.top + drop.height, left: zone.left, width: zone.width, height: zone.height - drop.height };
			case "bottom":
				return { top: zone.top, left: zone.left, width: zone.width, height: zone.height - drop.height };
			default:
				return null;
		}
	}

	private zoneTargets(): Array<{ id: string; rect: DockRect }> {
		return Array.from(this.querySelectorAll<HTMLElement>(".xtyle-dock-zone__leaf")).map((z) => {
			const r = z.getBoundingClientRect();
			return { id: z.dataset.zoneId ?? "", rect: { top: r.top, left: r.left, width: r.width, height: r.height } };
		});
	}

	private onTabPointerdown(event: PointerEvent, panelId: string, zoneId: string, index: number): void {
		if (event.button !== 0) return;
		this.drag = { panelId, zoneId, index, startX: event.clientX, startY: event.clientY, active: false };
		const move = (e: PointerEvent) => this.onDragMove(e);
		const up = (e: PointerEvent) => {
			window.removeEventListener("pointermove", move);
			window.removeEventListener("pointerup", up);
			window.removeEventListener("pointercancel", up);
			this.onDrop(e);
		};
		window.addEventListener("pointermove", move);
		window.addEventListener("pointerup", up);
		window.addEventListener("pointercancel", up);
	}

	/** Promote the gesture to a drag once the pointer has traveled past the threshold. */
	private armDrag(event: PointerEvent): boolean {
		const d = this.drag;
		if (!d) return false;
		if (d.active) return true;
		if (Math.hypot(event.clientX - d.startX, event.clientY - d.startY) < XtyleDockZone.DRAG_THRESHOLD) return false;
		d.active = true;
		event.preventDefault();
		return true;
	}

	private onDragMove(event: PointerEvent): void {
		if (!this.armDrag(event)) return;
		const zones = this.zoneTargets();
		const res = resolveDrop({ pointer: { x: event.clientX, y: event.clientY }, targets: zones });
		if (!res) {
			this.hideFilms();
			return;
		}
		this.paintDropFilms(res, zones, this.getBoundingClientRect());
	}

	/** Paint the drop preview for a resolved target: the drop half, the split remnant (none for a tab drop),
	 * and a film over every other zone. */
	private paintDropFilms(res: DropResolution, zones: Array<{ id: string; rect: DockRect }>, host: DOMRect): void {
		if (!this.dropFilm) return;
		this.placeFilm(this.dropFilm, res.highlight, host);
		const zoneRect = zones.find((z) => z.id === res.targetId)?.rect;
		const remnant = zoneRect ? this.remnantRect(zoneRect, res.highlight, res.region) : null;
		if (remnant && this.remnantFilm) this.placeFilm(this.remnantFilm, remnant, host);
		else if (this.remnantFilm) this.remnantFilm.hidden = true;
		this.placeRestFilms(
			zones.filter((z) => z.id !== res.targetId).map((z) => z.rect),
			host,
		);
	}

	private onDrop(event: PointerEvent): void {
		const d = this.drag;
		this.drag = null;
		this.hideFilms();
		if (!d || !this._layout) return;
		// A press that never crossed the threshold is a click: toggle a stacked section, or activate a
		// tab, never re-dock.
		if (!d.active) {
			const leaf = allLeaves(this._layout).find((l) => l.id === d.zoneId);
			if (leaf?.mode === "stack") this.toggleCollapse(d.panelId);
			else this.activate(d.zoneId, d.index);
			return;
		}
		const res = resolveDrop({ pointer: { x: event.clientX, y: event.clientY }, targets: this.zoneTargets() });
		if (!res) {
			this.floatPanelAtPointer(d.panelId, event);
			return;
		}
		this._layout = dockPanel(this._layout, {
			panel: d.panelId,
			target: res.targetId,
			region: res.region,
			newLeafId: this.nextLeafId(),
		});
		this.render();
		this.emitLayoutChange();
	}

	/** Float a panel with its titlebar under the pointer (the tab-drag-out gesture), clamped to the workspace. */
	private floatPanelAtPointer(panelId: string, event: PointerEvent): void {
		const host = this.getBoundingClientRect();
		const { w, h } = this.defaultFloatRect();
		const maxX = Math.max(0, host.width - w);
		const maxY = Math.max(0, host.height - h);
		const x = Math.max(0, Math.min(maxX, Math.round(event.clientX - host.left - w / 2)));
		const y = Math.max(0, Math.min(maxY, Math.round(event.clientY - host.top - XtyleDockZone.FLOAT_TITLE_H)));
		this.floatPanel(panelId, { x, y, w, h });
	}
}

define("xtyle-dock-zone", XtyleDockZone);
