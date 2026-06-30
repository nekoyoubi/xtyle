import { define } from "./base.js";
import { resolveDrop, type DockRect, type DockRegion } from "./dock-layout.js";
import {
	dockPanel,
	allPanels,
	allLeaves,
	singleZone,
	parseLayout,
	type DockNode,
	type DockLeaf,
} from "./dock-model.js";

interface PanelMeta {
	id: string;
	title: string;
	el: HTMLElement;
}

/**
 * A drag-and-drop dockable-panel workspace. Its direct children are the panels (any element
 * carrying `data-panel-id`, and a `data-title` or `title` for its tab); the zone reads them,
 * arranges them into a {@link DockNode} layout, and renders the tab strips and splits around
 * them. Dragging a tab re-docks its panel into another zone as a tab (`center`) or a split (an
 * edge), and the new layout dispatches a `layout-change` event carrying the serializable tree.
 *
 * The layout physics are xoji's: the zone wires pointer drags through `resolveDrop` (the drop
 * geometry) and `dockPanel` (the tree mutation), the same headless engine a consumer can drive
 * directly. Set `.layout` to restore a persisted tree; read it back from `layout-change.detail`.
 */
export class XojiDockZone extends HTMLElement {
	private _layout: DockNode | null = null;
	private panels = new Map<string, PanelMeta>();
	/** Drag-preview films painted over the live zones during a drag: the drop target, the remnant a
	 * split would leave behind, and a pooled film over every other zone (each tinted by its modifier
	 * class). All inert; re-attached above the zones after each render replaces the children. */
	private dropFilm: HTMLDivElement | null = null;
	private remnantFilm: HTMLDivElement | null = null;
	private restFilms: HTMLDivElement[] = [];
	/** An in-flight tab gesture. `active` flips true only once the pointer travels past
	 * `DRAG_THRESHOLD`, so a click (no travel) activates the tab instead of re-docking it. */
	private drag: { panelId: string; zoneId: string; index: number; startX: number; startY: number; active: boolean } | null =
		null;

	/** Pointer travel, in px, before a tab press becomes a drag rather than a click. */
	private static readonly DRAG_THRESHOLD = 5;

	get layout(): DockNode | null {
		return this._layout;
	}
	set layout(value: DockNode | null) {
		this._layout = value;
		if (this.isConnected) this.render();
	}

	connectedCallback(): void {
		this.collectPanels();
		if (!this._layout) this._layout = this.initialLayout();
		this.render();
	}

	/** The starting tree: a `layout` attribute (a JSON {@link DockNode}) when present and valid, so a
	 * split workspace can be authored declaratively; otherwise one zone holding every panel. */
	private initialLayout(): DockNode {
		const attr = this.getAttribute("layout");
		if (attr) {
			try {
				const parsed = parseLayout(attr);
				this.seedLeafCounter(parsed);
				return parsed;
			} catch {
				// Malformed authored layout: warn so the declarative path stays debuggable, then fall
				// back to a single zone rather than render nothing.
				console.warn("xoji-dock-zone: malformed `layout` attribute; falling back to a single zone.", attr);
			}
		}
		return singleZone("zone-0", [...this.panels.keys()]);
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
			});
		}
	}

	private leafId = 0;
	private nextLeafId(): string {
		this.leafId += 1;
		return `zone-${this.leafId}`;
	}

	private render(): void {
		if (!this._layout) return;
		const known = new Set(this.panels.keys());
		const live = allPanels(this._layout).filter((p) => known.has(p));
		for (const id of known) {
			if (!live.includes(id)) this._layout = dockPanel(this._layout, { panel: id, target: this.rootLeafId(), region: "center" });
		}
		this.replaceChildren(this.renderNode(this._layout));
		this.ensureOverlays();
		this.placeActivePanels();
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
			el.className = `xoji-dock-split xoji-dock-split--${node.direction}`;
			el.dataset.dockChrome = "";
			node.children.forEach((child, i) => {
				const wrap = this.renderNode(child);
				wrap.style.flex = String(node.sizes?.[i] ?? 1);
				el.appendChild(wrap);
			});
			return el;
		}
		const zone = document.createElement("div");
		zone.className = "xoji-dock-zone__leaf";
		zone.dataset.dockChrome = "";
		zone.dataset.zoneId = node.id;
		zone.style.flex = "1";
		const tabs = document.createElement("div");
		tabs.className = "xoji-dock-zone__tabs";
		node.panels.forEach((pid, i) => {
			const meta = this.panels.get(pid);
			const tab = document.createElement("button");
			tab.type = "button";
			tab.className = "xoji-dock-zone__tab" + (i === node.active ? " is-active" : "");
			tab.textContent = meta?.title ?? pid;
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
		const body = document.createElement("div");
		body.className = "xoji-dock-zone__body";
		body.dataset.bodyFor = node.id;
		zone.append(tabs, body);
		return zone;
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

	private placeActivePanels(): void {
		// Each leaf's active panel moves into its body; the rest stay detached (held by the Map)
		// so their content and state survive a re-render.
		const walk = (n: DockNode): void => {
			if (n.kind === "leaf") {
				const activePid = n.panels[n.active];
				const body = this.querySelector<HTMLElement>(`[data-body-for="${n.id}"]`);
				const meta = activePid ? this.panels.get(activePid) : undefined;
				if (body && meta) {
					meta.el.hidden = false;
					body.appendChild(meta.el);
				}
			} else n.children.forEach(walk);
		};
		walk(this._layout!);
	}

	private film(modifier: string): HTMLDivElement {
		const el = document.createElement("div");
		el.className = `xoji-dock-zone__film xoji-dock-zone__film--${modifier}`;
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

	/** The half of `zone` a split would leave in place — the complement of the drop `highlight`. A
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
		return Array.from(this.querySelectorAll<HTMLElement>(".xoji-dock-zone__leaf")).map((z) => {
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
		if (Math.hypot(event.clientX - d.startX, event.clientY - d.startY) < XojiDockZone.DRAG_THRESHOLD) return false;
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
		const host = this.getBoundingClientRect();
		this.placeFilm(this.dropFilm!, res.highlight, host);
		// A split leaves a remnant; a center (tab) drop leaves none.
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
		// A press that never crossed the threshold is a click: just activate the tab, never re-dock.
		if (!d.active) {
			this.activate(d.zoneId, d.index);
			return;
		}
		const res = resolveDrop({ pointer: { x: event.clientX, y: event.clientY }, targets: this.zoneTargets() });
		if (!res) return;
		this._layout = dockPanel(this._layout, {
			panel: d.panelId,
			target: res.targetId,
			region: res.region,
			newLeafId: this.nextLeafId(),
		});
		this.render();
		this.dispatchEvent(new CustomEvent("layout-change", { bubbles: true, composed: true, detail: { layout: this._layout } }));
	}
}

define("xoji-dock-zone", XojiDockZone);
