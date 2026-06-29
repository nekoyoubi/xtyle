import { describe, expect, it } from "vitest";
import { resolveDrop, type DockTarget } from "../src/elements/dock-layout.js";

// A single 200x200 target at the origin. Center spans [50,150] on each axis at the
// default edgeRatio 0.25 (the outer 50px on each side is an edge band).
const zone: DockTarget = { id: "main", rect: { top: 0, left: 0, width: 200, height: 200 } };

describe("resolveDrop", () => {
	it("resolves the center to a tab drop with a full-rect highlight", () => {
		const r = resolveDrop({ pointer: { x: 100, y: 100 }, targets: [zone] });
		expect(r).not.toBeNull();
		expect(r?.targetId).toBe("main");
		expect(r?.region).toBe("center");
		expect(r?.highlight).toEqual({ top: 0, left: 0, width: 200, height: 200 });
	});

	it("resolves each edge band to a split with a half-rect highlight", () => {
		const left = resolveDrop({ pointer: { x: 20, y: 100 }, targets: [zone] });
		expect(left?.region).toBe("left");
		expect(left?.highlight).toEqual({ top: 0, left: 0, width: 100, height: 200 });

		const right = resolveDrop({ pointer: { x: 180, y: 100 }, targets: [zone] });
		expect(right?.region).toBe("right");
		expect(right?.highlight).toEqual({ top: 0, left: 100, width: 100, height: 200 });

		const top = resolveDrop({ pointer: { x: 100, y: 20 }, targets: [zone] });
		expect(top?.region).toBe("top");
		expect(top?.highlight).toEqual({ top: 0, left: 0, width: 200, height: 100 });

		const bottom = resolveDrop({ pointer: { x: 100, y: 180 }, targets: [zone] });
		expect(bottom?.region).toBe("bottom");
		expect(bottom?.highlight).toEqual({ top: 100, left: 0, width: 200, height: 100 });
	});

	it("resolves a corner to the nearer edge", () => {
		// Closer to the top edge than the left edge.
		const r = resolveDrop({ pointer: { x: 30, y: 10 }, targets: [zone] });
		expect(r?.region).toBe("top");
	});

	it("returns null when the pointer is over no target", () => {
		expect(resolveDrop({ pointer: { x: 500, y: 500 }, targets: [zone] })).toBeNull();
	});

	it("picks the innermost (last containing) target when rects nest", () => {
		const outer: DockTarget = { id: "outer", rect: { top: 0, left: 0, width: 400, height: 400 } };
		const inner: DockTarget = { id: "inner", rect: { top: 100, left: 100, width: 200, height: 200 } };
		const r = resolveDrop({ pointer: { x: 200, y: 200 }, targets: [outer, inner] });
		expect(r?.targetId).toBe("inner");
	});

	it("honors a custom edgeRatio for the center band", () => {
		// At edgeRatio 0.1 the center spans [20,180]; x=30 now lands in the center, not the left band.
		const r = resolveDrop({ pointer: { x: 30, y: 100 }, targets: [zone], edgeRatio: 0.1 });
		expect(r?.region).toBe("center");
	});

	it("falls back to the nearest allowed edge when center is disallowed", () => {
		const edgesOnly: DockTarget = { ...zone, regions: ["left", "right", "top", "bottom"] };
		const r = resolveDrop({ pointer: { x: 100, y: 100 }, targets: [edgesOnly] });
		expect(r?.region).not.toBe("center");
		expect(["left", "right", "top", "bottom"]).toContain(r?.region);
	});

	it("falls back to center when an edge is disallowed and center is the only option", () => {
		const centerOnly: DockTarget = { ...zone, regions: ["center"] };
		const r = resolveDrop({ pointer: { x: 10, y: 100 }, targets: [centerOnly] });
		expect(r?.region).toBe("center");
		expect(r?.highlight).toEqual({ top: 0, left: 0, width: 200, height: 200 });
	});

	it("treats the rect boundary as inside the target", () => {
		const r = resolveDrop({ pointer: { x: 0, y: 0 }, targets: [zone] });
		expect(r).not.toBeNull();
	});
});
