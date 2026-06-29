import { define } from "./base.js";
import { resolveDrop, type DockRect } from "./dock-layout.js";
import {
	dockPanel,
	allPanels,
	singleZone,
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
	private highlight: HTMLDivElement | null = null;
	private dragging: string | null = null;

	get layout(): DockNode | null {
		return this._layout;
	}
	set layout(value: DockNode | null) {
		this._layout = value;
		if (this.isConnected) this.render();
	}

	connectedCallback(): void {
		this.collectPanels();
		if (!this._layout) this._layout = singleZone("zone-0", [...this.panels.keys()]);
		this.render();
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
		// Prune any panels that vanished from the DOM; keep only known ids in the tree.
		const known = new Set(this.panels.keys());
		const live = allPanels(this._layout).filter((p) => known.has(p));
		for (const id of known) {
			if (!live.includes(id)) this._layout = dockPanel(this._layout, { panel: id, target: this.rootLeafId(), region: "center" });
		}
		this.replaceChildren(this.renderNode(this._layout));
		this.ensureHighlight();
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
			tab.addEventListener("pointerdown", (e) => this.onTabPointerdown(e as PointerEvent, pid));
			tab.addEventListener("click", () => this.activate(node.id, i));
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

	private ensureHighlight(): void {
		if (!this.highlight) {
			this.highlight = document.createElement("div");
			this.highlight.className = "xoji-dock-zone__highlight";
			this.highlight.dataset.dockChrome = "";
			this.highlight.hidden = true;
		}
		this.appendChild(this.highlight);
	}

	private zoneTargets(): Array<{ id: string; rect: DockRect }> {
		return Array.from(this.querySelectorAll<HTMLElement>(".xoji-dock-zone__leaf")).map((z) => {
			const r = z.getBoundingClientRect();
			return { id: z.dataset.zoneId ?? "", rect: { top: r.top, left: r.left, width: r.width, height: r.height } };
		});
	}

	private onTabPointerdown(event: PointerEvent, panelId: string): void {
		event.preventDefault();
		this.dragging = panelId;
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

	private onDragMove(event: PointerEvent): void {
		if (!this.dragging || !this.highlight) return;
		const res = resolveDrop({ pointer: { x: event.clientX, y: event.clientY }, targets: this.zoneTargets() });
		if (!res) {
			this.highlight.hidden = true;
			return;
		}
		const host = this.getBoundingClientRect();
		const h = res.highlight;
		Object.assign(this.highlight.style, {
			top: `${h.top - host.top}px`,
			left: `${h.left - host.left}px`,
			width: `${h.width}px`,
			height: `${h.height}px`,
		});
		this.highlight.hidden = false;
	}

	private onDrop(event: PointerEvent): void {
		const panel = this.dragging;
		this.dragging = null;
		if (this.highlight) this.highlight.hidden = true;
		if (!panel || !this._layout) return;
		const res = resolveDrop({ pointer: { x: event.clientX, y: event.clientY }, targets: this.zoneTargets() });
		if (!res) return;
		this._layout = dockPanel(this._layout, { panel, target: res.targetId, region: res.region, newLeafId: this.nextLeafId() });
		this.render();
		this.dispatchEvent(new CustomEvent("layout-change", { bubbles: true, composed: true, detail: { layout: this._layout } }));
	}
}

define("xoji-dock-zone", XojiDockZone);
