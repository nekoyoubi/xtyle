// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { startDrag } from "../src/elements/gesture.js";

describe("startDrag survives a pointer the browser is not tracking", () => {
	it("still follows a synthetic drag when capture is impossible", () => {
		const target = document.createElement("div");
		document.body.appendChild(target);
		(target as unknown as { setPointerCapture: (id: number) => void }).setPointerCapture = () => {
			throw new DOMException("no such pointer", "NotFoundError");
		};
		const moves: number[] = [];
		const down = new PointerEvent("pointerdown", { pointerId: 1, clientX: 0, clientY: 0, bubbles: true });
		Object.defineProperty(down, "target", { value: target });
		startDrag(down, { lockThreshold: 0, onMove: (state) => moves.push(state.travel) });
		window.dispatchEvent(new PointerEvent("pointermove", { pointerId: 1, clientX: 40, clientY: 0 }));
		window.dispatchEvent(new PointerEvent("pointerup", { pointerId: 1, clientX: 40, clientY: 0 }));
		expect(moves.length).toBeGreaterThan(0);
	});
});
