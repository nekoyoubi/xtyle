// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { prefersReducedMotion, settle, startDrag, type DragState } from "../src/elements/gesture.js";

afterEach(() => {
	document.body.innerHTML = "";
	vi.unstubAllGlobals();
});

const pointer = (type: string, x: number, y: number, pointerId = 1): PointerEvent =>
	new PointerEvent(type, { clientX: x, clientY: y, pointerId, bubbles: true });

const drive = (handlers: Parameters<typeof startDrag>[1], moves: Array<[number, number]>, from: [number, number] = [0, 0]) => {
	const seen: DragState[] = [];
	startDrag(pointer("pointerdown", from[0], from[1]), {
		...handlers,
		onMove: (state, event) => {
			seen.push(state);
			handlers.onMove?.(state, event);
		},
	});
	for (const [x, y] of moves) window.dispatchEvent(pointer("pointermove", x, y));
	return seen;
};

describe("startDrag", () => {
	it("reports raw deltas from the pointer's start position", () => {
		const seen = drive({ axes: "x" }, [[10, 4]]);
		expect(seen[0]).toMatchObject({ dx: 10, dy: 4 });
	});

	it("locks to the axis that moved further and never changes it again", () => {
		const seen = drive({ lockThreshold: 5 }, [
			[12, 3],
			[2, 40],
		]);
		expect(seen.map((s) => s.axis)).toEqual(["x", "x"]);
	});

	it("locks to y when the vertical travel dominates", () => {
		const seen = drive({ lockThreshold: 5 }, [[3, 12]]);
		expect(seen[0].axis).toBe("y");
	});

	it("holds the axis open until the lock threshold is passed, reporting no distance meanwhile", () => {
		const seen = drive({ lockThreshold: 20 }, [
			[4, 0],
			[30, 0],
		]);
		expect(seen[0]).toMatchObject({ axis: null, distance: 0 });
		expect(seen[1]).toMatchObject({ axis: "x", distance: 30 });
	});

	it("never locks on a pointer that has not moved", () => {
		const seen = drive({ lockThreshold: 0 }, [[0, 0]]);
		expect(seen[0].axis).toBeNull();
	});

	it("pins the axis when the consumer names one, without waiting for travel", () => {
		const seen = drive({ axes: "y" }, [[40, 6]]);
		expect(seen[0]).toMatchObject({ axis: "y", distance: 6 });
	});

	it("refuses the drag when onStart returns false", () => {
		const onMove = vi.fn();
		startDrag(pointer("pointerdown", 0, 0), { onStart: () => false, onMove });
		window.dispatchEvent(pointer("pointermove", 30, 0));
		expect(onMove).not.toHaveBeenCalled();
	});

	it("ignores a second pointer's moves while one drag is live", () => {
		const onMove = vi.fn();
		startDrag(pointer("pointerdown", 0, 0, 1), { axes: "x", onMove });
		window.dispatchEvent(pointer("pointermove", 30, 0, 2));
		expect(onMove).not.toHaveBeenCalled();
		window.dispatchEvent(pointer("pointermove", 30, 0, 1));
		expect(onMove).toHaveBeenCalledOnce();
	});

	it("stops listening once the drag ends", () => {
		const onMove = vi.fn();
		const onEnd = vi.fn();
		startDrag(pointer("pointerdown", 0, 0), { axes: "x", onMove, onEnd });
		window.dispatchEvent(pointer("pointerup", 12, 0));
		window.dispatchEvent(pointer("pointermove", 90, 0));
		expect(onEnd).toHaveBeenCalledOnce();
		expect(onMove).not.toHaveBeenCalled();
	});

	it("ends on pointercancel the same way it ends on pointerup", () => {
		const onEnd = vi.fn();
		startDrag(pointer("pointerdown", 0, 0), { axes: "x", onEnd });
		window.dispatchEvent(pointer("pointercancel", 5, 0));
		window.dispatchEvent(pointer("pointermove", 90, 0));
		expect(onEnd).toHaveBeenCalledOnce();
		expect(onEnd.mock.calls[0][0]).toMatchObject({ dx: 5 });
	});
});

describe("settle", () => {
	it("lands the transform outright when motion is reduced, without animating", async () => {
		vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener() {}, removeEventListener() {} }));
		const el = document.createElement("div");
		document.body.append(el);
		const animate = vi.fn();
		el.animate = animate as never;

		await settle(el, "translateX(40px)");

		expect(el.style.transform).toBe("translateX(40px)");
		expect(animate).not.toHaveBeenCalled();
	});

	it("lands the transform when the Web Animations API is missing", async () => {
		vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
		const el = document.createElement("div");
		document.body.append(el);
		(el as { animate?: unknown }).animate = undefined;

		await settle(el, "translateX(12px)");

		expect(el.style.transform).toBe("translateX(12px)");
	});

	it("reads its duration and easing from the theme's motion tokens", async () => {
		vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
		const el = document.createElement("div");
		document.body.append(el);
		el.style.setProperty("--duration-base", "150ms");
		el.style.setProperty("--ease-standard", "cubic-bezier(0.2, 0, 0, 1)");
		const animate = vi.fn(() => ({ finished: Promise.resolve(), cancel() {} }));
		el.animate = animate as never;
		el.getAnimations = (() => []) as never;

		await settle(el, "translateX(40px)");

		expect(animate).toHaveBeenCalledOnce();
		expect(animate.mock.calls[0][1]).toMatchObject({ duration: 150, easing: "cubic-bezier(0.2, 0, 0, 1)" });
	});

	it("skips the animation when the theme's duration resolves to zero", async () => {
		vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
		const el = document.createElement("div");
		document.body.append(el);
		el.style.setProperty("--duration-base", "0ms");
		const animate = vi.fn();
		el.animate = animate as never;

		await settle(el, "translateX(40px)");

		expect(animate).not.toHaveBeenCalled();
		expect(el.style.transform).toBe("translateX(40px)");
	});
});

describe("prefersReducedMotion", () => {
	it("reads false where matchMedia is absent, so a server render never claims a preference", () => {
		vi.stubGlobal("matchMedia", undefined);
		expect(prefersReducedMotion()).toBe(false);
	});
});
