// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
// side effect: defines the <xtyle-dock-zone> (and, through it, <xtyle-menu>) custom elements
import "../src/elements/dock-zone.js";
import type { DockLayout, DockNode } from "../src/elements/dock-model.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { manifest, fragmentSources } from "../src/elements/fragments/dock-zone/source.generated.js";
import { manifest as menuManifest, fragmentSources as menuSources } from "../src/elements/fragments/menu/source.generated.js";

type ZoneEl = HTMLElement & {
	layout: DockLayout | null;
	closePanel(panelId: string): void;
	floatPanel(panelId: string, rect?: { x: number; y: number; w: number; h: number }): void;
	dockFloating(panelId: string, target?: string, region?: string): void;
};

const OPEN_FLAG = "data-test-popover-open";

/** happy-dom ships no Popover API and no layout engine; the overflow menu needs the first and the
 * drag gestures need the second, so both are stood in before the fills load. */
beforeAll(async () => {
	const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
	const nativeMatches = HTMLElement.prototype.matches;
	proto.matches = function matches(this: HTMLElement, selector: string): boolean {
		if (selector === ":popover-open") return this.hasAttribute(OPEN_FLAG);
		return nativeMatches.call(this, selector);
	};
	proto.showPopover = function showPopover(this: HTMLElement): void {
		this.setAttribute(OPEN_FLAG, "");
	};
	proto.hidePopover = function hidePopover(this: HTMLElement): void {
		this.removeAttribute(OPEN_FLAG);
	};
	await loadFill(manifest, fragmentSources);
	await loadFill(menuManifest, menuSources);
});

afterEach(() => {
	document.body.innerHTML = "";
});

interface PanelSpec {
	id: string;
	title?: string;
	badge?: string;
	closable?: boolean;
	actions?: { id: string; label: string; icon?: string }[];
	menu?: unknown[];
	body?: string;
}

function make(panels: PanelSpec[], attrs: Record<string, string> = {}): ZoneEl {
	const el = document.createElement("xtyle-dock-zone") as ZoneEl;
	for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
	for (const spec of panels) {
		const section = document.createElement("section");
		section.setAttribute("data-panel-id", spec.id);
		section.setAttribute("data-title", spec.title ?? spec.id);
		if (spec.badge) section.setAttribute("data-badge", spec.badge);
		if (spec.closable) section.setAttribute("data-closable", "");
		if (spec.actions) section.setAttribute("data-actions", JSON.stringify(spec.actions));
		if (spec.menu) section.setAttribute("data-menu", JSON.stringify(spec.menu));
		section.textContent = spec.body ?? `${spec.id} content`;
		el.appendChild(section);
	}
	document.body.appendChild(el);
	return el;
}

/** Give the zone (and every leaf the fill drew inside it) a real box, so `resolveDrop` can map a
 * pointer to a region. Zones are laid out side by side across the host's width. */
function withLayout(el: HTMLElement, width = 400, height = 200): void {
	const rect = (left: number, top: number, w: number, h: number): DOMRect =>
		({ left, top, right: left + w, bottom: top + h, width: w, height: h, x: left, y: top, toJSON() {} }) as DOMRect;
	el.getBoundingClientRect = () => rect(0, 0, width, height);
	const leaves = Array.from(el.querySelectorAll<HTMLElement>(".xtyle-dock-zone__leaf"));
	const slice = width / Math.max(1, leaves.length);
	leaves.forEach((leaf, i) => {
		leaf.getBoundingClientRect = () => rect(i * slice, 0, slice, height);
	});
}

function pointerdown(el: Element, clientX: number, clientY: number): void {
	el.dispatchEvent(new MouseEvent("pointerdown", { clientX, clientY, button: 0, bubbles: true, cancelable: true }));
}

function pointermove(clientX: number, clientY: number): void {
	window.dispatchEvent(new MouseEvent("pointermove", { clientX, clientY, bubbles: true }));
}

function pointerup(clientX: number, clientY: number): void {
	window.dispatchEvent(new MouseEvent("pointerup", { clientX, clientY, bubbles: true }));
}

/** A full press-travel-release drag from one point to another, re-measuring the chrome mid-gesture. */
function drag(el: HTMLElement, from: Element, to: { x: number; y: number }): void {
	const start = from.getBoundingClientRect();
	pointerdown(from, start.left + 4, start.top + 4);
	pointermove(start.left + 40, start.top + 4);
	withLayout(el);
	pointermove(to.x, to.y);
	pointerup(to.x, to.y);
}

function click(el: Element, detail = 1): void {
	el.dispatchEvent(new MouseEvent("click", { detail, bubbles: true, cancelable: true }));
}

function tabs(el: HTMLElement): HTMLElement[] {
	return Array.from(el.querySelectorAll<HTMLElement>("[data-tab]"));
}

/** The author's panel element itself (`data-dock-dock-panel-host` marks it), not the tab that names it. */
function panelBody(el: HTMLElement, panelId: string): HTMLElement | null {
	return el.querySelector<HTMLElement>(`[data-dock-panel-host][data-panel-id="${panelId}"]`);
}

/** The drag-preview films the fill renders: hidden unless a drop is actually on offer. */
function films(el: HTMLElement): { drop: HTMLElement; remnant: HTMLElement } {
	return {
		drop: el.querySelector<HTMLElement>('[data-film="drop"]')!,
		remnant: el.querySelector<HTMLElement>('[data-film="remnant"]')!,
	};
}

const THREE: PanelSpec[] = [{ id: "files" }, { id: "outline" }, { id: "preview" }];

describe("dock-zone renders its chrome through the fragment", () => {
	it("paints the fill's scaffold and draws a tab per panel inside it", () => {
		const el = make(THREE);
		expect(el.querySelector("[data-root][data-dock-zone]")).not.toBeNull();
		expect(tabs(el).map((t) => t.textContent)).toEqual(["files", "outline", "preview"]);
		// every drawn surface lives under the fill's root, not beside it
		for (const tab of tabs(el)) expect(el.querySelector("[data-dock-zone]")!.contains(tab)).toBe(true);
	});

	it("hands the author's panels back into the bodies the fill drew", () => {
		const el = make(THREE);
		const active = panelBody(el, "files");
		expect(active?.parentElement?.dataset.bodyFor).toBe("zone-0");
		expect(active?.textContent).toBe("files content");
		// only the active panel is placed; the rest stay in the element's custody, detached
		expect(panelBody(el, "outline")).toBeNull();
	});

	it("draws the kebab as real markup, not a CSS-conjured glyph", () => {
		const el = make([{ id: "files", menu: [{ label: "Refresh", value: "refresh" }] }]);
		const kebab = el.querySelector<HTMLElement>("[data-panel-menu]");
		expect(kebab?.querySelector(".xtyle-dock-zone__kebab-glyph")?.textContent).toBe("⋮");
		expect(kebab?.getAttribute("aria-label")).toBe("files options");
	});

	it("draws a film for the drop target, the remnant, and every other zone", () => {
		const el = make(THREE, {
			layout: JSON.stringify({
				kind: "split",
				direction: "row",
				children: [
					{ kind: "leaf", id: "zone-0", panels: ["files"], active: 0 },
					{ kind: "leaf", id: "zone-1", panels: ["outline"], active: 0 },
					{ kind: "leaf", id: "zone-2", panels: ["preview"], active: 0 },
				],
			}),
		});
		expect(el.querySelectorAll('[data-film="drop"]').length).toBe(1);
		expect(el.querySelectorAll('[data-film="remnant"]').length).toBe(1);
		expect(el.querySelectorAll('[data-film="rest"]').length).toBe(2);
	});

	it("keeps a panel's element identity across a re-render", () => {
		const el = make(THREE);
		const before = panelBody(el, "files")!;
		before.setAttribute("data-scribble", "live state");
		click(tabs(el)[1]!, 0);
		click(tabs(el)[0]!, 0);
		// the same node comes back, so a panel's live content and state survive a rebuild of the chrome
		expect(panelBody(el, "files")).toBe(before);
		expect(panelBody(el, "files")!.getAttribute("data-scribble")).toBe("live state");
	});
});

describe("dock-zone behavior survives the conversion", () => {
	it("activates a tab on keyboard click without re-docking", () => {
		const el = make(THREE);
		click(tabs(el)[2]!, 0);
		expect(tabs(el)[2]!.getAttribute("aria-selected")).toBe("true");
		expect(panelBody(el, "preview")).not.toBeNull();
		expect(el.layout!.tree).toMatchObject({ kind: "leaf", active: 2 });
	});

	it("activates a tab on a pointer press that never travels", () => {
		const el = make(THREE);
		withLayout(el);
		const tab = tabs(el)[1]!;
		pointerdown(tab, 10, 5);
		pointerup(10, 5);
		expect(el.layout!.tree).toMatchObject({ kind: "leaf", active: 1 });
	});

	it("splits a zone when a tab is dragged to an edge", () => {
		const el = make(THREE);
		withLayout(el);
		const changes: DockLayout[] = [];
		el.addEventListener("layout-change", (e) => changes.push((e as CustomEvent<{ layout: DockLayout }>).detail.layout));
		// drop far right of the only zone: an edge drop, so the zone splits
		drag(el, tabs(el)[0]!, { x: 395, y: 100 });
		const tree = el.layout!.tree as DockNode & { kind: "split" };
		expect(tree.kind).toBe("split");
		expect(tree.direction).toBe("row");
		expect(changes.length).toBe(1);
		expect(el.querySelectorAll(".xtyle-dock-zone__leaf").length).toBe(2);
	});

	it("re-tabs a panel when a tab is dropped over a zone's center", () => {
		const el = make(THREE, {
			layout: JSON.stringify({
				kind: "split",
				direction: "row",
				children: [
					{ kind: "leaf", id: "zone-0", panels: ["files", "outline"], active: 0 },
					{ kind: "leaf", id: "zone-1", panels: ["preview"], active: 0 },
				],
			}),
		});
		withLayout(el);
		const tab = tabs(el).find((t) => t.dataset.panelId === "outline")!;
		// the center of the second zone (which spans x 200..400)
		drag(el, tab, { x: 300, y: 100 });
		const tree = el.layout!.tree as DockNode & { kind: "split"; children: DockNode[] };
		const second = tree.children[1] as DockNode & { kind: "leaf"; panels: string[] };
		expect(second.panels).toContain("outline");
	});

	it("floats a panel when a tab is dragged out past every zone", () => {
		const el = make(THREE);
		withLayout(el);
		drag(el, tabs(el)[0]!, { x: 900, y: 900 });
		expect(el.layout!.floating.map((f) => f.panelId)).toEqual(["files"]);
		const win = el.querySelector<HTMLElement>('[data-float-id="files"]');
		expect(win).not.toBeNull();
		// the panel's own element moved into the float window's body, not a copy of it
		expect(panelBody(el, "files")!.parentElement!.dataset.floatBodyFor).toBe("files");
	});

	it("moves a floating window by its titlebar and persists the new rect", () => {
		const el = make(THREE);
		withLayout(el);
		el.floatPanel("files", { x: 10, y: 10, w: 120, h: 90 });
		const win = el.querySelector<HTMLElement>('[data-float-id="files"]')!;
		expect(win.style.left).toBe("10px");
		const head = win.querySelector("[data-float-head]")!;
		pointerdown(head, 20, 20);
		pointermove(60, 50);
		pointerup(60, 50);
		expect(el.layout!.floating[0]).toMatchObject({ x: 50, y: 40 });
	});

	it("resizes a floating window from its grip, floored at the minimum", () => {
		const el = make(THREE);
		withLayout(el);
		el.floatPanel("files", { x: 0, y: 0, w: 200, h: 150 });
		const win = el.querySelector<HTMLElement>('[data-float-id="files"]')!;
		const grip = win.querySelector("[data-float-resize]")!;
		pointerdown(grip, 200, 150);
		pointermove(240, 190);
		pointerup(240, 190);
		expect(el.layout!.floating[0]).toMatchObject({ w: 240, h: 190 });
		// a press on the grip must not also arm the titlebar drag
		expect(el.layout!.floating[0]).toMatchObject({ x: 0, y: 0 });
	});

	it("docks a floating window back with its dock button", () => {
		const el = make(THREE);
		withLayout(el);
		el.floatPanel("files");
		const dockBtn = el.querySelector<HTMLElement>("[data-float-dock]")!;
		expect(dockBtn.getAttribute("aria-label")).toBe("Dock files");
		click(dockBtn);
		expect(el.layout!.floating).toEqual([]);
		expect(el.querySelector('[data-float-id="files"]')).toBeNull();
		expect(panelBody(el, "files")).not.toBeNull();
	});

	it("moves a floating window dragged across the open workspace, rather than re-docking it", () => {
		// the zones tile the whole workspace, so every point inside it resolves to a drop target. A titlebar
		// drag that stopped at the first one would re-dock the window the moment it was nudged.
		const el = make(THREE);
		withLayout(el);
		el.floatPanel("outline", { x: 300, y: 120, w: 80, h: 60 });
		withLayout(el);
		const head = el.querySelector('[data-float-id="outline"] [data-float-head]')!;
		pointerdown(head, 310, 130);
		pointermove(280, 100);
		pointerup(280, 100);
		expect(el.layout!.floating).toMatchObject([{ panelId: "outline", x: 270, y: 90 }]);
		expect(films(el).drop.hidden).toBe(true);
	});

	it("offers a dock, films and all, once a float reaches the band along a zone's boundary", () => {
		const el = make(THREE);
		withLayout(el);
		el.floatPanel("outline", { x: 300, y: 120, w: 80, h: 60 });
		withLayout(el);
		const head = el.querySelector('[data-float-id="outline"] [data-float-head]')!;
		pointerdown(head, 310, 130);

		// still open floor: the pointer is 100px in from the nearest boundary, past the 48px band
		pointermove(200, 100);
		expect(films(el).drop.hidden).toBe(true);

		// inside the band along the zone's left boundary: the split is on offer, so the films light up
		pointermove(10, 100);
		expect(films(el).drop.hidden).toBe(false);
		expect(films(el).remnant.hidden).toBe(false);

		pointerup(10, 100);
		expect(el.layout!.floating).toEqual([]);
		const tree = el.layout!.tree as DockNode & { kind: "split"; direction: string; children: DockNode[] };
		expect(tree.kind).toBe("split");
		expect(tree.direction).toBe("row");
		expect((tree.children[0] as DockNode & { panels: string[] }).panels).toContain("outline");
		expect(films(el).drop.hidden).toBe(true);
	});

	it("a float's own controls do not drag the window under them", () => {
		const el = make(THREE);
		withLayout(el);
		el.floatPanel("files", { x: 40, y: 40, w: 120, h: 90 });
		const dockBtn = el.querySelector<HTMLElement>("[data-float-dock]")!;
		pointerdown(dockBtn, 50, 45);
		pointermove(150, 150);
		pointerup(150, 150);
		expect(el.layout!.floating[0]).toMatchObject({ x: 40, y: 40 });
	});
});

describe("dock-zone panel controls", () => {
	it("fires panel-action from a direct header button", () => {
		const el = make([{ id: "files", actions: [{ id: "new-file", label: "New file", icon: "+" }] }]);
		const fired: { panelId: string; actionId: string }[] = [];
		el.addEventListener("panel-action", (e) => fired.push((e as CustomEvent).detail));
		const btn = el.querySelector<HTMLElement>("[data-panel-action]")!;
		expect(btn.textContent).toBe("+");
		expect(btn.getAttribute("aria-label")).toBe("New file");
		click(btn);
		expect(fired).toEqual([{ panelId: "files", actionId: "new-file" }]);
	});

	it("fires panel-action from a kebab menu row, keyed to the panel whose kebab opened it", () => {
		const el = make([
			{ id: "files", menu: [{ label: "Refresh", value: "refresh" }] },
			{ id: "history", menu: [{ label: "Clear", value: "clear" }] },
		]);
		const fired: { panelId: string; actionId: string }[] = [];
		el.addEventListener("panel-action", (e) => fired.push((e as CustomEvent).detail));
		// the overflow menu is one shared, cursor-anchored <xtyle-menu> the kebab loads and opens
		const popup = el.querySelector<HTMLElement>("[data-panel-menu-popup]")!;
		expect(el.querySelectorAll("[data-panel-menu-popup]").length).toBe(1);
		// only the active panel's controls render in tabs mode
		const kebab = el.querySelector<HTMLElement>('[data-panel-menu][data-owner-panel="files"]')!;
		kebab.getBoundingClientRect = () =>
			({ left: 0, top: 0, right: 20, bottom: 20, width: 20, height: 20, x: 0, y: 0, toJSON() {} }) as DOMRect;
		click(kebab);
		const row = popup.shadowRoot!.querySelector<HTMLElement>('[data-value="refresh"]')!;
		expect(row).not.toBeNull();
		click(row);
		expect(fired).toEqual([{ panelId: "files", actionId: "refresh" }]);
	});

	it("closes a panel through a cancelable panel-close", () => {
		const el = make([{ id: "files", closable: true }, { id: "outline" }]);
		const close = el.querySelector<HTMLElement>("[data-panel-close]")!;
		expect(close.getAttribute("aria-label")).toBe("Close files");
		el.addEventListener("panel-close", (e) => e.preventDefault(), { once: true });
		click(close);
		expect(el.layout!.tree).toMatchObject({ panels: ["files", "outline"] });
		click(el.querySelector<HTMLElement>("[data-panel-close]")!);
		expect(el.layout!.tree).toMatchObject({ panels: ["outline"] });
		expect(el.querySelector("[data-panel-close]")).toBeNull();
	});

	it("puts a badge on every panel's own tab, not just the active one", () => {
		const el = make([{ id: "files" }, { id: "problems", badge: "3" }]);
		const badged = el.querySelector<HTMLElement>('[data-tab][data-panel-id="problems"] .xtyle-dock-zone__badge')!;
		expect(badged.textContent).toBe("3");
		expect(badged.getAttribute("aria-hidden")).toBe("true");
	});
});

describe("dock-zone stack mode", () => {
	it("draws a disclosure section per panel with a chevron and its own controls", () => {
		const el = make([{ id: "layers", actions: [{ id: "add", label: "Add layer", icon: "+" }] }, { id: "props" }], {
			mode: "stack",
		});
		const toggles = Array.from(el.querySelectorAll<HTMLElement>("[data-section-toggle]"));
		expect(toggles.map((t) => t.dataset.panelId)).toEqual(["layers", "props"]);
		expect(toggles[0]!.querySelector(".xtyle-dock-zone__chevron")).not.toBeNull();
		expect(toggles[0]!.getAttribute("aria-expanded")).toBe("true");
		// every stacked panel is placed, not just one
		expect(panelBody(el, "layers")).not.toBeNull();
		expect(panelBody(el, "props")).not.toBeNull();
		// controls ride on each section, not only the active panel
		expect(el.querySelector('[data-panel-action][data-owner-panel="layers"]')).not.toBeNull();
	});

	it("collapses a section on click and persists it to the layout", () => {
		const el = make([{ id: "layers" }, { id: "props" }], { mode: "stack" });
		const changes: DockLayout[] = [];
		el.addEventListener("layout-change", (e) => changes.push((e as CustomEvent<{ layout: DockLayout }>).detail.layout));
		click(el.querySelector<HTMLElement>('[data-section-toggle][data-panel-id="layers"]')!, 0);
		expect(el.layout!.tree).toMatchObject({ collapsed: ["layers"] });
		expect(changes.length).toBe(1);
		const toggle = el.querySelector<HTMLElement>('[data-section-toggle][data-panel-id="layers"]')!;
		expect(toggle.getAttribute("aria-expanded")).toBe("false");
		expect(el.querySelector<HTMLElement>('[data-section-body-for="layers"]')!.hidden).toBe(true);
	});

	it("collapses a section on a pointer press that never travels", () => {
		const el = make([{ id: "layers" }, { id: "props" }], { mode: "stack" });
		withLayout(el);
		const toggle = el.querySelector<HTMLElement>('[data-section-toggle][data-panel-id="props"]')!;
		pointerdown(toggle, 10, 40);
		pointerup(10, 40);
		expect(el.layout!.tree).toMatchObject({ collapsed: ["props"] });
	});

	it("re-docks a stacked panel when its header is dragged", () => {
		const el = make([{ id: "layers" }, { id: "props" }], { mode: "stack" });
		withLayout(el);
		drag(el, el.querySelector('[data-section-toggle][data-panel-id="props"]')!, { x: 900, y: 900 });
		expect(el.layout!.floating.map((f) => f.panelId)).toEqual(["props"]);
	});
});

describe("dock-zone layout round-trip", () => {
	it("restores a persisted layout, floats and all", () => {
		const el = make(THREE);
		const restored: DockLayout = {
			tree: {
				kind: "split",
				direction: "column",
				sizes: [2, 1],
				children: [
					{ kind: "leaf", id: "zone-0", panels: ["files"], active: 0 },
					{ kind: "leaf", id: "zone-1", panels: ["outline"], active: 0 },
				],
			},
			floating: [{ panelId: "preview", x: 20, y: 30, w: 200, h: 160, origin: "zone-0" }],
		};
		el.layout = restored;
		expect(el.querySelectorAll(".xtyle-dock-zone__leaf").length).toBe(2);
		expect(el.querySelector(".xtyle-dock-split--column")).not.toBeNull();
		const win = el.querySelector<HTMLElement>('[data-float-id="preview"]')!;
		expect(win.style.top).toBe("30px");
		expect(win.style.width).toBe("200px");
		expect(el.layout!.floating).toHaveLength(1);
	});

	it("re-docks an orphaned panel rather than losing it", () => {
		const el = make(THREE);
		el.layout = { kind: "leaf", id: "zone-0", panels: ["files"], active: 0 } as DockNode;
		const tree = el.layout!.tree as DockNode & { kind: "leaf"; panels: string[] };
		expect(tree.panels).toEqual(expect.arrayContaining(["files", "outline", "preview"]));
	});
});
