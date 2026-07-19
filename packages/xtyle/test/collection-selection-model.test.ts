import { describe, expect, it } from "vitest";
import { SelectionModel } from "../src/elements/collection/selection-model.js";

const order = ["a", "b", "c", "d", "e"];

describe("SelectionModel none", () => {
	it("ignores every mutation", () => {
		const m = new SelectionModel("none");
		m.replaceWith("a");
		m.toggle("b");
		expect(m.selectedKeys()).toEqual([]);
	});
});

describe("SelectionModel single", () => {
	it("keeps at most one key; replace swaps it", () => {
		const m = new SelectionModel("single");
		m.replaceWith("a");
		expect(m.selectedKeys()).toEqual(["a"]);
		m.replaceWith("c");
		expect(m.selectedKeys()).toEqual(["c"]);
	});

	it("toggling the selected key clears it; toggling another replaces", () => {
		const m = new SelectionModel("single");
		m.toggle("a");
		expect(m.isSelected("a")).toBe(true);
		m.toggle("a");
		expect(m.selectedKeys()).toEqual([]);
		m.toggle("a");
		m.toggle("b");
		expect(m.selectedKeys()).toEqual(["b"]);
	});
});

describe("SelectionModel multi", () => {
	it("toggles keys independently and a plain replace collapses to one", () => {
		const m = new SelectionModel("multi");
		m.toggle("a");
		m.toggle("c");
		expect(new Set(m.selectedKeys())).toEqual(new Set(["a", "c"]));
		m.toggle("a");
		expect(m.selectedKeys()).toEqual(["c"]);
		m.replaceWith("e");
		expect(m.selectedKeys()).toEqual(["e"]);
	});
});

describe("SelectionModel range", () => {
	it("spans from the anchor to the extended key, inclusive, either direction", () => {
		const m = new SelectionModel("range");
		m.replaceWith("b");
		m.extendTo("d", order);
		expect(m.selectedKeys()).toEqual(["b", "c", "d"]);
		m.extendTo("a", order);
		expect(m.selectedKeys()).toEqual(["a", "b"]);
	});

	it("keeps the anchor stable across re-extends", () => {
		const m = new SelectionModel("range");
		m.replaceWith("c");
		m.extendTo("e", order);
		expect(m.selectedKeys()).toEqual(["c", "d", "e"]);
		m.extendTo("c", order);
		expect(m.selectedKeys()).toEqual(["c"]);
		expect(m.anchor).toBe("c");
	});

	it("ctrl-style toggle moves the anchor and preserves the rest", () => {
		const m = new SelectionModel("range");
		m.replaceWith("a");
		m.toggle("d");
		expect(new Set(m.selectedKeys())).toEqual(new Set(["a", "d"]));
		m.extendTo("e", order);
		expect(m.selectedKeys()).toEqual(["d", "e"]);
	});
});

describe("SelectionModel reset + retain", () => {
	it("reseeds from external flags", () => {
		const m = new SelectionModel("multi");
		m.reset(["b", "d"]);
		expect(new Set(m.selectedKeys())).toEqual(new Set(["b", "d"]));
	});

	it("retain drops keys that are no longer live and reports the change", () => {
		const m = new SelectionModel("multi");
		m.reset(["b", "d"]);
		expect(m.retain(new Set(["b", "c"]))).toBe(true);
		expect(m.selectedKeys()).toEqual(["b"]);
		expect(m.retain(new Set(["b", "c"]))).toBe(false);
	});

	it("collapses to one key when switched to single", () => {
		const m = new SelectionModel("multi");
		m.reset(["b", "d"]);
		m.setMode("single");
		expect(m.selectedKeys()).toHaveLength(1);
	});
});
