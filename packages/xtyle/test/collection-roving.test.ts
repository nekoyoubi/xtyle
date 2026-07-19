import { describe, expect, it } from "vitest";
import { firstKey, lastKey, stepKey, resolveRoving, type NavItem } from "../src/elements/collection/roving.js";

const items: NavItem[] = [{ key: "a" }, { key: "b" }, { key: "c" }, { key: "d" }];
const withSkips: NavItem[] = [{ key: "a", skip: true }, { key: "b" }, { key: "c", skip: true }, { key: "d" }];

describe("collection/roving stepKey", () => {
	it("steps forward and back, clamping at the ends", () => {
		expect(stepKey(items, "a", 1)).toBe("b");
		expect(stepKey(items, "c", -1)).toBe("b");
		expect(stepKey(items, "d", 1)).toBe(null);
		expect(stepKey(items, "a", -1)).toBe(null);
	});

	it("wraps when asked", () => {
		expect(stepKey(items, "d", 1, true)).toBe("a");
		expect(stepKey(items, "a", -1, true)).toBe("d");
	});

	it("skips non-focusable items in both directions", () => {
		expect(stepKey(withSkips, "b", 1)).toBe("d");
		expect(stepKey(withSkips, "d", -1)).toBe("b");
	});

	it("wraps over skips without landing on one", () => {
		expect(stepKey(withSkips, "d", 1, true)).toBe("b");
		expect(stepKey(withSkips, "b", -1, true)).toBe("d");
	});

	it("returns null on an empty or all-skipped list", () => {
		expect(stepKey([], "a", 1)).toBe(null);
		expect(stepKey([{ key: "a", skip: true }], "a", 1, true)).toBe(null);
	});

	it("lands a null/unknown cursor on the first item going forward and the last going back", () => {
		expect(stepKey(items, null, 1)).toBe("a");
		expect(stepKey(items, null, -1)).toBe("d");
		expect(stepKey(items, "gone", 1)).toBe("a");
		expect(stepKey(items, "gone", -1)).toBe("d");
	});
});

describe("collection/roving first/last", () => {
	it("finds the first and last focusable, skipping edges", () => {
		expect(firstKey(withSkips)).toBe("b");
		expect(lastKey(withSkips)).toBe("d");
		expect(firstKey([])).toBe(null);
	});
});

describe("collection/roving resolveRoving", () => {
	it("prefers the first live focusable key among preferences", () => {
		expect(resolveRoving(items, ["c", "a"])).toBe("c");
		expect(resolveRoving(items, [null, "b"])).toBe("b");
	});

	it("drops a stale/skipped preference and falls through", () => {
		expect(resolveRoving(items, ["gone", "b"])).toBe("b");
		expect(resolveRoving(withSkips, ["a", "d"])).toBe("d");
	});

	it("falls back to the first focusable when no preference lives", () => {
		expect(resolveRoving(withSkips, ["gone", null])).toBe("b");
		expect(resolveRoving([], ["a"])).toBe(null);
	});
});
