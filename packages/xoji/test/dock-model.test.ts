import { describe, expect, it } from "vitest";
import {
	dockPanel,
	removePanel,
	activatePanel,
	singleZone,
	allPanels,
	leafOf,
	parseLayout,
	layoutRects,
	type DockNode,
	type DockSplit,
} from "../src/elements/dock-model.js";
import { resolveDrop } from "../src/elements/dock-layout.js";

const base = () => singleZone("root", ["a", "b"]);

describe("dock-model", () => {
	it("lists panels and finds the leaf of a panel", () => {
		const root = base();
		expect(allPanels(root)).toEqual(["a", "b"]);
		expect(leafOf(root, "b")?.id).toBe("root");
		expect(leafOf(root, "z")).toBeNull();
	});

	it("docks to the center as a new active tab", () => {
		const root = dockPanel(singleZone("root", ["a"]), { panel: "c", target: "root", region: "center" });
		expect(root.kind).toBe("leaf");
		if (root.kind === "leaf") {
			expect(root.panels).toEqual(["a", "c"]);
			expect(root.active).toBe(1);
		}
	});

	it("docks to an edge as a split with the right direction and order", () => {
		const left = dockPanel(singleZone("root", ["a"]), { panel: "c", target: "root", region: "left", newLeafId: "z" }) as DockSplit;
		expect(left.kind).toBe("split");
		expect(left.direction).toBe("row");
		expect(left.children.map((c) => (c.kind === "leaf" ? c.id : "split"))).toEqual(["z", "root"]);

		const bottom = dockPanel(singleZone("root", ["a"]), { panel: "c", target: "root", region: "bottom", newLeafId: "z" }) as DockSplit;
		expect(bottom.direction).toBe("column");
		expect(bottom.children.map((c) => (c.kind === "leaf" ? c.id : "split"))).toEqual(["root", "z"]);
	});

	it("moves a panel: the source leaf and any single-child split it empties collapse away", () => {
		// Two zones side by side; move the only panel out of the right zone.
		const split: DockNode = {
			kind: "split",
			direction: "row",
			children: [singleZone("L", ["a"]), singleZone("R", ["b"])],
		};
		const moved = dockPanel(split, { panel: "b", target: "L", region: "center" });
		// R emptied -> pruned; the split had one child left -> collapsed to that leaf.
		expect(moved.kind).toBe("leaf");
		if (moved.kind === "leaf") {
			expect(moved.id).toBe("L");
			expect(moved.panels).toEqual(["a", "b"]);
		}
	});

	it("is a no-op when docking a panel onto its own leaf at center", () => {
		const root = singleZone("root", ["a", "b"]);
		expect(dockPanel(root, { panel: "a", target: "root", region: "center" })).toBe(root);
	});

	it("removes a panel and collapses, returning null when the tree empties", () => {
		const root = singleZone("root", ["a"]);
		expect(removePanel(root, "a")).toBeNull();

		const split: DockNode = {
			kind: "split",
			direction: "column",
			children: [singleZone("T", ["a"]), singleZone("B", ["b"])],
		};
		const afterRemove = removePanel(split, "a");
		expect(afterRemove?.kind).toBe("leaf");
		if (afterRemove?.kind === "leaf") expect(afterRemove.id).toBe("B");
	});

	it("keeps the kept children's sizes when a split prunes", () => {
		const split: DockNode = {
			kind: "split",
			direction: "row",
			sizes: [2, 1, 3],
			children: [singleZone("A", ["a"]), singleZone("B", ["b"]), singleZone("C", ["c"])],
		};
		const afterRemove = removePanel(split, "b") as DockSplit;
		expect(afterRemove.kind).toBe("split");
		expect(afterRemove.children.map((c) => (c.kind === "leaf" ? c.id : "?"))).toEqual(["A", "C"]);
		expect(afterRemove.sizes).toEqual([2, 3]);
	});

	it("activates a tab without mutating the input", () => {
		const root = singleZone("root", ["a", "b", "c"]);
		const activated = activatePanel(root, "c");
		expect(activated.kind === "leaf" && activated.active).toBe(2);
		expect(root.active).toBe(0); // original untouched
	});

	it("round-trips through parseLayout and rejects a malformed shape", () => {
		const root = dockPanel(singleZone("root", ["a"]), { panel: "c", target: "root", region: "right", newLeafId: "z" });
		const restored = parseLayout(JSON.stringify(root));
		expect(restored).toEqual(root);
		expect(() => parseLayout('{"kind":"leaf","id":"x"}')).toThrow(/malformed/);
		expect(() => parseLayout('{"kind":"bogus"}')).toThrow(/malformed/);
	});
});

const container = { top: 0, left: 0, width: 1000, height: 400 };

describe("layoutRects", () => {
	it("gives a single leaf the whole container", () => {
		expect(layoutRects(singleZone("root", ["a"]), container)).toEqual([{ id: "root", rect: container }]);
	});

	it("divides a row split into side-by-side halves", () => {
		const split: DockNode = { kind: "split", direction: "row", children: [singleZone("L", ["a"]), singleZone("R", ["b"])] };
		const rects = layoutRects(split, container);
		expect(rects).toEqual([
			{ id: "L", rect: { top: 0, left: 0, width: 500, height: 400 } },
			{ id: "R", rect: { top: 0, left: 500, width: 500, height: 400 } },
		]);
	});

	it("stacks a column split top over bottom", () => {
		const split: DockNode = { kind: "split", direction: "column", children: [singleZone("T", ["a"]), singleZone("B", ["b"])] };
		const rects = layoutRects(split, container);
		expect(rects[0]?.rect).toEqual({ top: 0, left: 0, width: 1000, height: 200 });
		expect(rects[1]?.rect).toEqual({ top: 200, left: 0, width: 1000, height: 200 });
	});

	it("honors weighted sizes and insets children by the gap", () => {
		const split: DockNode = { kind: "split", direction: "row", sizes: [3, 1], children: [singleZone("L", ["a"]), singleZone("R", ["b"])] };
		const rects = layoutRects(split, container, 8);
		// available = 1000 - 8 = 992; L = 992 * 3/4 = 744, R = 992 * 1/4 = 248
		expect(rects[0]?.rect.width).toBe(744);
		expect(rects[1]?.rect.left).toBe(744 + 8);
		expect(rects[1]?.rect.width).toBe(248);
	});

	it("round-trips the whole engine: tree to rects to drop to tree", () => {
		// A row split; lay it out, drop a new panel onto the left edge of zone R, apply, re-lay-out.
		let layout: DockNode = { kind: "split", direction: "row", children: [singleZone("L", ["a"]), singleZone("R", ["b"])] };
		const rects = layoutRects(layout, container);
		const rTarget = rects.find((r) => r.id === "R")!;
		// pointer near R's left edge -> resolveDrop says R/left
		const res = resolveDrop({
			pointer: { x: rTarget.rect.left + rTarget.rect.width * 0.05, y: rTarget.rect.top + rTarget.rect.height / 2 },
			targets: rects.map((r) => ({ id: r.id, rect: r.rect })),
		});
		expect(res).toMatchObject({ targetId: "R", region: "left" });
		layout = dockPanel(layout, { panel: "c", target: res!.targetId, region: res!.region, newLeafId: "new" });
		// R split into [new(c), R(b)]; the whole tree now lays out to three leaves that tile the container.
		const after = layoutRects(layout, container);
		expect(after.map((r) => r.id)).toEqual(["L", "new", "R"]);
		const totalWidth = after.reduce((sum, r) => sum + r.rect.width, 0);
		expect(totalWidth).toBeCloseTo(container.width, 5);
	});
});
