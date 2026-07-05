import { describe, expect, it } from "vitest";
import { placeOverlay, tooltipTetherShift } from "../src/elements/overlay-position.js";

const viewport = { width: 1000, height: 800 };
const content = { width: 200, height: 100 };

describe("placeOverlay", () => {
	it("honors the preferred side when it fits", () => {
		const anchor = { top: 300, left: 400, width: 80, height: 30 };
		const r = placeOverlay({ anchor, content, viewport, preferred: "bottom", gap: 4, margin: 8 });
		expect(r.placement).toBe("bottom");
		expect(r.flipped).toBe(false);
		expect(r.top).toBe(anchor.top + anchor.height + 4);
		expect(r.left).toBe(Math.round(anchor.left + anchor.width / 2 - content.width / 2));
	});

	it("flips bottom→top when there is no room below but room above", () => {
		const anchor = { top: 700, left: 400, width: 80, height: 30 };
		const r = placeOverlay({ anchor, content, viewport, preferred: "bottom" });
		expect(r.placement).toBe("top");
		expect(r.flipped).toBe(true);
		expect(r.top).toBe(anchor.top - content.height - 4);
	});

	it("flips top→bottom when there is no room above", () => {
		const anchor = { top: 20, left: 400, width: 80, height: 30 };
		const r = placeOverlay({ anchor, content, viewport, preferred: "top" });
		expect(r.placement).toBe("bottom");
		expect(r.flipped).toBe(true);
	});

	it("clamps the cross-axis at the left viewport edge", () => {
		const anchor = { top: 300, left: 0, width: 20, height: 20 };
		const r = placeOverlay({ anchor, content, viewport, preferred: "bottom", margin: 8 });
		expect(r.left).toBe(8);
	});

	it("clamps the cross-axis at the right viewport edge", () => {
		const anchor = { top: 300, left: 990, width: 10, height: 20 };
		const r = placeOverlay({ anchor, content, viewport, preferred: "bottom", margin: 8 });
		expect(r.left).toBe(viewport.width - content.width - 8);
	});

	it("places to the right when preferred and there is room", () => {
		const anchor = { top: 300, left: 400, width: 80, height: 30 };
		const r = placeOverlay({ anchor, content, viewport, preferred: "right", gap: 4 });
		expect(r.placement).toBe("right");
		expect(r.left).toBe(anchor.left + anchor.width + 4);
		expect(r.top).toBe(Math.round(anchor.top + anchor.height / 2 - content.height / 2));
	});

	it("flips right→left when there is no room to the right", () => {
		const anchor = { top: 300, left: 950, width: 40, height: 30 };
		const r = placeOverlay({ anchor, content, viewport, preferred: "right" });
		expect(r.placement).toBe("left");
		expect(r.flipped).toBe(true);
		expect(r.left).toBe(anchor.left - content.width - 4);
	});

	it("falls back to the side with more room when neither side fits", () => {
		const tall = { width: 200, height: 700 };
		const anchor = { top: 450, left: 400, width: 80, height: 30 };
		const r = placeOverlay({ anchor, content: tall, viewport, preferred: "bottom" });
		expect(r.placement).toBe("top");
		expect(r.flipped).toBe(true);
	});

	it("aligns the leading edge with align:start (dropdown behavior)", () => {
		const anchor = { top: 300, left: 400, width: 80, height: 30 };
		const r = placeOverlay({ anchor, content, viewport, preferred: "bottom", align: "start" });
		expect(r.left).toBe(anchor.left);
	});

	it("aligns the trailing edge with align:end", () => {
		const anchor = { top: 300, left: 400, width: 80, height: 30 };
		const r = placeOverlay({ anchor, content, viewport, preferred: "bottom", align: "end" });
		expect(r.left).toBe(anchor.left + anchor.width - content.width);
	});

	it("still clamps an align:start overlay at the right edge", () => {
		const anchor = { top: 300, left: 950, width: 40, height: 30 };
		const r = placeOverlay({ anchor, content, viewport, preferred: "bottom", align: "start" });
		expect(r.left).toBe(viewport.width - content.width - 8);
	});

	it("applies defaults (bottom, center, gap 4, margin 8) when omitted", () => {
		const anchor = { top: 300, left: 400, width: 80, height: 30 };
		const r = placeOverlay({ anchor, content, viewport });
		expect(r.placement).toBe("bottom");
		expect(r.top).toBe(anchor.top + anchor.height + 4);
	});

	it("reproduces the menu flip-above contract (space below < content height)", () => {
		const anchor = { top: 760, left: 100, width: 120, height: 30 };
		const r = placeOverlay({ anchor, content, viewport, preferred: "bottom" });
		expect(r.placement).toBe("top");
		expect(r.left).toBeGreaterThanOrEqual(8);
		expect(r.left + content.width).toBeLessThanOrEqual(viewport.width - 8);
	});
});

describe("tooltipTetherShift", () => {
	const tether = (anchor: { top: number; left: number; width: number; height: number }, preferred: "top" | "bottom" | "left" | "right") => {
		const placed = placeOverlay({ anchor, content, viewport, preferred, align: "center", gap: 8 });
		return { placed, shift: tooltipTetherShift({ placement: placed.placement, placedLeft: placed.left, placedTop: placed.top, anchor, content }) };
	};

	it("is a no-op when the centered tip already fits", () => {
		const { shift } = tether({ top: 300, left: 400, width: 80, height: 30 }, "bottom");
		expect(shift.content).toBe(0);
		expect(shift.arrow).toBe(0);
	});

	it("pushes the tip right and pulls the arrow back at the left edge", () => {
		const { placed, shift } = tether({ top: 300, left: 0, width: 20, height: 20 }, "bottom");
		expect(placed.left).toBe(8);
		expect(shift.content).toBeGreaterThan(0);
		expect(shift.arrow).toBeLessThan(0);
		expect(shift.arrow).toBe(-(content.width / 2 - 10));
	});

	it("pushes the tip left and pulls the arrow back at the right edge", () => {
		const { shift } = tether({ top: 300, left: 990, width: 10, height: 20 }, "bottom");
		expect(shift.content).toBeLessThan(0);
		expect(shift.arrow).toBe(content.width / 2 - 10);
	});

	it("never lets the arrow leave the content edge (bounded by inset)", () => {
		const { shift } = tether({ top: 300, left: 0, width: 2, height: 20 }, "bottom");
		expect(Math.abs(shift.arrow)).toBeLessThanOrEqual(content.width / 2 - 10);
	});

	it("clamps on the vertical axis for a side placement", () => {
		const { placed, shift } = tether({ top: 0, left: 400, width: 80, height: 30 }, "right");
		expect(placed.placement).toBe("right");
		expect(placed.top).toBe(8);
		expect(shift.content).toBeGreaterThan(0);
		expect(shift.arrow).toBe(-(content.height / 2 - 10));
	});

	it("keeps the arrow centered under the anchor for a mid-viewport edge clamp", () => {
		const anchor = { top: 300, left: 60, width: 40, height: 20 };
		const placed = placeOverlay({ anchor, content, viewport, preferred: "bottom", align: "center", gap: 8 });
		const shift = tooltipTetherShift({ placement: placed.placement, placedLeft: placed.left, placedTop: placed.top, anchor, content });
		const anchorCenter = anchor.left + anchor.width / 2;
		const arrowViewportX = placed.left + content.width / 2 + shift.arrow;
		expect(arrowViewportX).toBeCloseTo(anchorCenter, 5);
	});
});
