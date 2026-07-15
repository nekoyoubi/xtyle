import { describe, expect, it } from "vitest";
import { anchorArrowOffset, placeOverlay, tooltipTetherShift } from "../src/elements/overlay-position.js";

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

	it("flips align:start → end at the right edge (native menu behavior, not a slide)", () => {
		const anchor = { top: 300, left: 950, width: 40, height: 30 };
		const r = placeOverlay({ anchor, content, viewport, preferred: "bottom", align: "start" });
		expect(r.align).toBe("end");
		expect(r.alignFlipped).toBe(true);
		expect(r.left).toBe(anchor.left + anchor.width - content.width);
	});

	it("flips align:end → start at the left edge", () => {
		const anchor = { top: 300, left: 20, width: 40, height: 30 };
		const r = placeOverlay({ anchor, content, viewport, preferred: "bottom", align: "end" });
		expect(r.align).toBe("start");
		expect(r.alignFlipped).toBe(true);
		expect(r.left).toBe(anchor.left);
	});

	it("keeps the requested align (and reports no flip) when it already fits", () => {
		const anchor = { top: 300, left: 400, width: 80, height: 30 };
		const r = placeOverlay({ anchor, content, viewport, preferred: "bottom", align: "start" });
		expect(r.align).toBe("start");
		expect(r.alignFlipped).toBe(false);
	});

	it("clamps as the final fallback when neither alignment fits", () => {
		const wide = { width: 990, height: 100 };
		const anchor = { top: 300, left: 900, width: 40, height: 30 };
		const r = placeOverlay({ anchor, content: wide, viewport, preferred: "bottom", align: "start" });
		expect(r.alignFlipped).toBe(false);
		expect(r.left).toBe(8);
	});

	it("never flips a center-aligned overlay (the tooltip); it clamps", () => {
		const anchor = { top: 300, left: 990, width: 10, height: 20 };
		const r = placeOverlay({ anchor, content, viewport, preferred: "bottom", align: "center" });
		expect(r.align).toBe("center");
		expect(r.alignFlipped).toBe(false);
		expect(r.left).toBe(viewport.width - content.width - 8);
	});

	it("flips the cross-axis on a side placement too (align:start at the bottom edge)", () => {
		const anchor = { top: 740, left: 400, width: 40, height: 30 };
		const r = placeOverlay({ anchor, content, viewport, preferred: "right", align: "start" });
		expect(r.placement).toBe("right");
		expect(r.align).toBe("end");
		expect(r.top).toBe(anchor.top + anchor.height - content.height);
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

describe("placeOverlay against a cursor point (a zero-size anchor)", () => {
	const at = (x: number, y: number) => ({ top: y, left: x, width: 0, height: 0 });

	it("drops the menu from the point, leading edge on the cursor", () => {
		const r = placeOverlay({ anchor: at(300, 220), content, viewport, preferred: "bottom", align: "start" });
		expect(r.left).toBe(300);
		expect(r.top).toBe(224);
	});

	it("right-aligns on the cursor near the right edge", () => {
		const r = placeOverlay({ anchor: at(950, 220), content, viewport, preferred: "bottom", align: "start" });
		expect(r.align).toBe("end");
		expect(r.left).toBe(950 - content.width);
	});

	it("opens upward from the cursor near the bottom edge", () => {
		const r = placeOverlay({ anchor: at(300, 760), content, viewport, preferred: "bottom", align: "start" });
		expect(r.placement).toBe("top");
		expect(r.top).toBe(760 - content.height - 4);
	});

	it("does both in the bottom-right corner", () => {
		const r = placeOverlay({ anchor: at(990, 790), content, viewport, preferred: "bottom", align: "start" });
		expect(r.placement).toBe("top");
		expect(r.align).toBe("end");
		expect(r.left).toBe(990 - content.width);
		expect(r.top).toBe(790 - content.height - 4);
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

describe("anchorArrowOffset", () => {
	const place = (
		anchor: { top: number; left: number; width: number; height: number },
		opts: { preferred?: "top" | "bottom" | "left" | "right"; align?: "start" | "center" | "end" } = {},
	) => {
		const placed = placeOverlay({ anchor, content, viewport, preferred: opts.preferred ?? "bottom", align: opts.align ?? "center", gap: 8 });
		const offset = anchorArrowOffset({ placement: placed.placement, placedLeft: placed.left, placedTop: placed.top, anchor, content });
		return { placed, offset };
	};

	it("points at the anchor's center for a centered panel", () => {
		const anchor = { top: 300, left: 400, width: 80, height: 30 };
		const { placed, offset } = place(anchor);
		expect(placed.left + offset).toBe(anchor.left + anchor.width / 2);
	});

	it("still points at the anchor's center for a start-aligned panel", () => {
		const anchor = { top: 300, left: 400, width: 80, height: 30 };
		const { placed, offset } = place(anchor, { align: "start" });
		expect(placed.left).toBe(anchor.left);
		expect(placed.left + offset).toBe(anchor.left + anchor.width / 2);
	});

	it("keeps pointing at the anchor after the viewport clamp shoves the panel sideways", () => {
		const anchor = { top: 300, left: 20, width: 40, height: 20 };
		const { placed, offset } = place(anchor);
		expect(placed.left).toBe(8);
		expect(placed.left + offset).toBe(anchor.left + anchor.width / 2);
	});

	it("bounds the arrow to the inset so it never rounds the panel's corner", () => {
		const anchor = { top: 300, left: 0, width: 2, height: 20 };
		const { placed, offset } = place(anchor);
		expect(placed.left).toBe(8);
		expect(offset).toBe(12);
	});

	it("measures down the panel's near edge for a side placement", () => {
		const anchor = { top: 300, left: 400, width: 80, height: 30 };
		const { placed, offset } = place(anchor, { preferred: "right" });
		expect(placed.placement).toBe("right");
		expect(placed.top + offset).toBe(anchor.top + anchor.height / 2);
	});
});
