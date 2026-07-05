import { define } from "./base.js";
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

const CLOSE_GLYPH = "✕";

/**
 * A drag-and-drop dockable-panel workspace. Its direct children are the panels (any element
 * carrying `data-panel-id`, and a `data-title` or `title` for its tab); the zone reads them,
 * arranges them into a {@link DockNode} layout, and renders the tab strips and splits around
 * them. Dragging a tab re-docks its panel into another zone as a tab (`center`) or a split (an
 * edge), and the new layout dispatches a `layout-change` event carrying the serializable tree.
 *
 * The layout physics are xtyle's: the zone wires pointer drags through `resolveDrop` (the drop
 * geometry) and `dockPanel` (the tree mutation), the same headless engine a consumer can drive
 * directly. Set `.layout` to restore a persisted tree; read it back from `layout-change.detail`.
 *
 * A panel carries its own header chrome, declared on the panel child: `data-closable` renders a
 * close button (a cancelable `panel-close` event; unless prevented, the zone removes the panel and
 * fires `layout-change`), `data-actions` (a JSON `{ id, label, icon? }[]`) renders direct header
 * buttons, and `data-menu` (a JSON menu-item array) renders a kebab overflow `<xtyle-menu>`. Both a
 * direct button and a menu row fire a `panel-action` event (`detail: { panelId, actionId }`). The
 * action chrome always reflects the zone's active panel; a `data-badge` (trailing status text) rides
 * on every panel's own tab or stacked-section header, not just the active one.
 */
export class XtyleDockZone extends HTMLElement {
	private _layout: DockNode | null = null;
	private _floating: FloatingPanel[] = [];
	private panels = new Map<string, PanelMeta>();
	/** Drag-preview films painted over the live zones during a drag: the drop target, the remnant a
	 * split would leave behind, and a pooled film over every other zone (each tinted by its modifier
	 * class). All inert; re-attached above the zones after each render replaces the children. */
	private dropFilm: HTMLDivElement | null = null;
	private remnantFilm: HTMLDivElement | null = null;
	private restFilms: HTMLDivElement[] = [];
	/** The container holding the floating panel windows, layered above the docked zones. */
	private floatLayer: HTMLDivElement | null = null;
	/** An in-flight tab gesture. `active` flips true only once the pointer travels past
	 * `DRAG_THRESHOLD`, so a click (no travel) activates the tab instead of re-docking it. */
	private drag: { panelId: string; zoneId: string; index: number; startX: number; startY: number; active: boolean } | null =
		null;

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
		this.collectPanels();
		if (!this._layout) {
			const init = this.initialLayout();
			this._layout = init.tree;
			this._floating = init.floating;
		}
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

	private collectPanels(): void {
		this.panels.clear();
		for (const child of Array.from(this.children) as HTMLElement[]) {
			const id = child.getAttribute("data-panel-id");
			if (!id || child.dataset.dockChrome != null) continue;
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

	private render(): void {
		if (!this._layout) {
			this.replaceChildren();
			return;
		}
		const known = new Set(this.panels.keys());
		const floating = new Set(this._floating.map((f) => f.panelId));
		const live = allPanels(this._layout).filter((p) => known.has(p));
		for (const id of known) {
			// A floating panel is legitimately absent from the tree; only re-dock a truly orphaned one.
			if (!live.includes(id) && !floating.has(id)) this._layout = dockPanel(this._layout, { panel: id, target: this.rootLeafId(), region: "center" });
		}
		this.replaceChildren(this.renderNode(this._layout));
		this.ensureOverlays();
		this.placeActivePanels();
		this.renderFloats();
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

	private renderNode(node: DockNode): HTMLElement {
		if (node.kind === "split") {
			const el = document.createElement("div");
			el.className = `xtyle-dock-split xtyle-dock-split--${node.direction}`;
			el.dataset.dockChrome = "";
			node.children.forEach((child, i) => {
				const wrap = this.renderNode(child);
				wrap.style.flex = String(node.sizes?.[i] ?? 1);
				el.appendChild(wrap);
			});
			return el;
		}
		if (node.mode === "stack") return this.renderStackLeaf(node);
		const zone = document.createElement("div");
		zone.className = "xtyle-dock-zone__leaf";
		zone.dataset.dockChrome = "";
		zone.dataset.zoneId = node.id;
		zone.style.flex = "1";
		const head = document.createElement("div");
		head.className = "xtyle-dock-zone__head";
		const tabs = document.createElement("div");
		tabs.className = "xtyle-dock-zone__tabs";
		node.panels.forEach((pid, i) => {
			const meta = this.panels.get(pid);
			const tab = document.createElement("button");
			tab.type = "button";
			tab.className = "xtyle-dock-zone__tab" + (i === node.active ? " is-active" : "");
			tab.textContent = meta?.title ?? pid;
			const tabBadge = this.badgeEl(meta);
			if (tabBadge) tab.appendChild(tabBadge);
			tab.dataset.panelId = pid;
			tab.setAttribute("role", "tab");
			tab.setAttribute("aria-selected", String(i === node.active));
			tab.addEventListener("pointerdown", (e) => this.onTabPointerdown(e as PointerEvent, pid, node.id, i));
			// Keyboard activation only (`detail === 0`); pointer presses route through the drag gesture
			// so a click-vs-drag is decided by travel, not by a second, racing handler.
			tab.addEventListener("click", (e) => {
				if (e.detail === 0) this.activate(node.id, i);
			});
			tabs.appendChild(tab);
		});
		head.appendChild(tabs);
		const activePid = node.panels[node.active];
		const activeMeta = activePid ? this.panels.get(activePid) : undefined;
		const actions = activeMeta ? this.renderActions(activeMeta) : null;
		if (actions) head.appendChild(actions);
		const body = document.createElement("div");
		body.className = "xtyle-dock-zone__body";
		body.dataset.bodyFor = node.id;
		zone.append(head, body);
		return zone;
	}

	/**
	 * A `stack`-mode leaf: every panel is a collapsible section (a header with a disclosure toggle and
	 * the panel's own controls, a body shown when expanded), stacked top-to-bottom, the tool/inspector
	 * rail shape. The header drags to re-dock the panel just like a tab; a plain click toggles collapse.
	 */
	private renderStackLeaf(node: DockLeaf): HTMLElement {
		const zone = document.createElement("div");
		zone.className = "xtyle-dock-zone__leaf xtyle-dock-zone__leaf--stack";
		zone.dataset.dockChrome = "";
		zone.dataset.zoneId = node.id;
		zone.style.flex = "1";
		const collapsed = new Set(node.collapsed ?? []);
		node.panels.forEach((pid, i) => {
			const meta = this.panels.get(pid);
			const isCollapsed = collapsed.has(pid);
			const section = document.createElement("div");
			section.className = "xtyle-dock-zone__section" + (isCollapsed ? " is-collapsed" : "");
			const head = document.createElement("div");
			head.className = "xtyle-dock-zone__section-head";
			const toggle = document.createElement("button");
			toggle.type = "button";
			toggle.className = "xtyle-dock-zone__section-toggle";
			toggle.dataset.panelId = pid;
			toggle.setAttribute("aria-expanded", String(!isCollapsed));
			const chevron = document.createElement("span");
			chevron.className = "xtyle-dock-zone__chevron";
			chevron.setAttribute("aria-hidden", "true");
			const title = document.createElement("span");
			title.className = "xtyle-dock-zone__section-title";
			title.textContent = meta?.title ?? pid;
			toggle.append(chevron, title);
			const sectionBadge = this.badgeEl(meta);
			if (sectionBadge) toggle.appendChild(sectionBadge);
			toggle.addEventListener("pointerdown", (e) => this.onTabPointerdown(e as PointerEvent, pid, node.id, i));
			// Keyboard toggle only (`detail === 0`); a pointer press routes through the drag gesture, so a
			// click-vs-drag is decided by travel, matching how a tab decides activate-vs-redock.
			toggle.addEventListener("click", (e) => {
				if (e.detail === 0) this.toggleCollapse(pid);
			});
			head.appendChild(toggle);
			const actions = meta ? this.renderActions(meta) : null;
			if (actions) head.appendChild(actions);
			const body = document.createElement("div");
			body.className = "xtyle-dock-zone__section-body";
			body.dataset.sectionBodyFor = pid;
			body.hidden = isCollapsed;
			section.append(head, body);
			zone.appendChild(section);
		});
		return zone;
	}

	/** A panel's trailing status badge for its tab / section header. Decorative (`aria-hidden`),
	 * so a tab's accessible name stays its title; a consumer that needs the count announced puts it in `data-title`. */
	private badgeEl(meta: PanelMeta | undefined): HTMLElement | null {
		if (!meta?.badge) return null;
		const badge = document.createElement("span");
		badge.className = "xtyle-dock-zone__badge";
		badge.setAttribute("aria-hidden", "true");
		badge.textContent = meta.badge;
		return badge;
	}

	/** The active panel's header controls: direct action buttons, then a kebab overflow menu, then close. */
	private renderActions(meta: PanelMeta): HTMLElement | null {
		if (!meta.closable && meta.actions.length === 0 && !meta.menu) return null;
		const area = document.createElement("div");
		area.className = "xtyle-dock-zone__actions";
		area.dataset.dockChrome = "";
		for (const action of meta.actions) {
			const btn = document.createElement("button");
			btn.type = "button";
			btn.className = "xtyle-dock-zone__action";
			btn.dataset.actionId = action.id;
			btn.setAttribute("aria-label", action.label);
			btn.title = action.label;
			btn.textContent = action.icon ?? action.label;
			btn.addEventListener("click", () => this.emitAction(meta.id, action.id));
			area.appendChild(btn);
		}
		if (meta.menu) {
			const menu = document.createElement("xtyle-menu") as HTMLElement & { items: MenuItem[] };
			menu.className = "xtyle-dock-zone__menu";
			menu.setAttribute("label", `${meta.title} options`);
			menu.items = meta.menu;
			menu.addEventListener("select", (e) => {
				const value = (e as CustomEvent<{ value?: string }>).detail?.value;
				if (value != null) this.emitAction(meta.id, value);
			});
			area.appendChild(menu);
		}
		if (meta.closable) {
			const close = document.createElement("button");
			close.type = "button";
			close.className = "xtyle-dock-zone__action xtyle-dock-zone__close";
			close.setAttribute("aria-label", `Close ${meta.title}`);
			close.title = `Close ${meta.title}`;
			close.textContent = CLOSE_GLYPH;
			close.addEventListener("click", () => this.closePanel(meta.id));
			area.appendChild(close);
		}
		return area;
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
		// Panels not currently placed stay detached (held by the Map), so their content and state survive
		// a re-render; a collapsed stacked panel is placed but its body is hidden.
		const walk = (n: DockNode): void => {
			if (n.kind === "leaf") {
				if (n.mode === "stack") {
					for (const pid of n.panels) this.placePanel(pid, this.querySelector<HTMLElement>(`[data-section-body-for="${pid}"]`));
				} else {
					this.placePanel(n.panels[n.active], this.querySelector<HTMLElement>(`[data-body-for="${n.id}"]`));
				}
			} else n.children.forEach(walk);
		};
		walk(this._layout!);
	}

	private placePanel(panelId: string | undefined, body: HTMLElement | null): void {
		const meta = panelId ? this.panels.get(panelId) : undefined;
		if (body && meta) {
			meta.el.hidden = false;
			body.appendChild(meta.el);
		}
	}

	/** Render the floating windows over the docked zones, each holding its panel's live content, with a
	 * draggable titlebar plus dock and close buttons. Rebuilt each render; the panel content is re-placed
	 * from the Map, so it survives a re-render exactly as a docked panel does. */
	private renderFloats(): void {
		if (this._floating.length === 0) {
			this.floatLayer?.remove();
			this.floatLayer = null;
			return;
		}
		if (!this.floatLayer) {
			this.floatLayer = document.createElement("div");
			this.floatLayer.className = "xtyle-dock-zone__floats";
			this.floatLayer.dataset.dockChrome = "";
		}
		this.floatLayer.replaceChildren();
		// Re-attach last so the float layer sits above the zones and the drop films.
		this.appendChild(this.floatLayer);
		for (const f of this._floating) {
			const meta = this.panels.get(f.panelId);
			const displayTitle = meta?.title ?? f.panelId;
			const win = document.createElement("div");
			win.className = "xtyle-dock-zone__float";
			win.dataset.dockChrome = "";
			win.dataset.floatId = f.panelId;
			Object.assign(win.style, { left: `${f.x}px`, top: `${f.y}px`, width: `${f.w}px`, height: `${f.h}px` });
			const head = document.createElement("div");
			head.className = "xtyle-dock-zone__float-head";
			const title = document.createElement("span");
			title.className = "xtyle-dock-zone__float-title";
			title.textContent = displayTitle;
			head.appendChild(title);
			head.appendChild(this.floatButton("⤓", `Dock ${displayTitle}`, () => this.dockFloating(f.panelId)));
			head.appendChild(this.floatButton(CLOSE_GLYPH, `Close ${displayTitle}`, () => this.closePanel(f.panelId)));
			head.addEventListener("pointerdown", (e) => this.onFloatPointerdown(e as PointerEvent, f.panelId));
			const body = document.createElement("div");
			body.className = "xtyle-dock-zone__float-body";
			const resize = document.createElement("div");
			resize.className = "xtyle-dock-zone__float-resize";
			resize.setAttribute("aria-hidden", "true");
			resize.addEventListener("pointerdown", (e) => this.onFloatResizedown(e as PointerEvent, f.panelId));
			win.append(head, body, resize);
			this.floatLayer.appendChild(win);
			if (meta) {
				meta.el.hidden = false;
				body.appendChild(meta.el);
			}
		}
	}

	private floatButton(glyph: string, label: string, onClick: () => void): HTMLButtonElement {
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "xtyle-dock-zone__action";
		btn.setAttribute("aria-label", label);
		btn.title = label;
		btn.textContent = glyph;
		// Stop the titlebar's own drag from arming when a control is pressed.
		btn.addEventListener("pointerdown", (e) => e.stopPropagation());
		btn.addEventListener("click", onClick);
		return btn;
	}

	/** The smallest a floating window resizes to, in px; kept in step with the CSS `min-width` / `min-height`. */
	private static readonly FLOAT_MIN_W = 160;
	private static readonly FLOAT_MIN_H = 112;
	/** Roughly the titlebar height, in px; offsets a drag-out float so the pointer lands on the titlebar. */
	private static readonly FLOAT_TITLE_H = 16;

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

	/**
	 * Drag a floating window's titlebar. Moving over open space repositions it (clamped to the workspace);
	 * moving over a zone previews a re-dock, and releasing there docks the panel back into the tree.
	 */
	private onFloatPointerdown(event: PointerEvent, panelId: string): void {
		if (event.button !== 0) return;
		const start = this._floating.find((f) => f.panelId === panelId);
		const win = this.floatLayer?.querySelector<HTMLElement>(`[data-float-id="${CSS.escape(panelId)}"]`);
		if (!start || !win) return;
		event.preventDefault();
		const host = this.getBoundingClientRect();
		const maxX = Math.max(0, host.width - start.w);
		const maxY = Math.max(0, host.height - start.h);
		const offsetX = event.clientX - start.x;
		const offsetY = event.clientY - start.y;
		this.ensureOverlays();
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
				redock = resolveDrop({ pointer: { x: e.clientX, y: e.clientY }, targets: zones });
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
		const win = this.floatLayer?.querySelector<HTMLElement>(`[data-float-id="${CSS.escape(panelId)}"]`);
		if (!start || !win) return;
		event.preventDefault();
		event.stopPropagation();
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

	private film(modifier: string): HTMLDivElement {
		const el = document.createElement("div");
		el.className = `xtyle-dock-zone__film xtyle-dock-zone__film--${modifier}`;
		el.dataset.dockChrome = "";
		el.hidden = true;
		return el;
	}

	private ensureOverlays(): void {
		this.dropFilm ??= this.film("drop");
		this.remnantFilm ??= this.film("remnant");
		// Re-attach last so the films layer above the freshly rendered zones.
		this.appendChild(this.dropFilm);
		this.appendChild(this.remnantFilm);
		for (const f of this.restFilms) this.appendChild(f);
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

	/** Grow the film pool to cover every non-target zone, hiding any surplus. */
	private placeRestFilms(rects: DockRect[], host: DOMRect): void {
		while (this.restFilms.length < rects.length) {
			const f = this.film("rest");
			this.restFilms.push(f);
			this.appendChild(f);
		}
		rects.forEach((r, i) => this.placeFilm(this.restFilms[i]!, r, host));
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
		this.ensureOverlays();
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
		this.placeFilm(this.dropFilm!, res.highlight, host);
		const zoneRect = zones.find((z) => z.id === res.targetId)?.rect;
		const remnant = zoneRect ? this.remnantRect(zoneRect, res.highlight, res.region) : null;
		if (remnant) this.placeFilm(this.remnantFilm!, remnant, host);
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
