import { describe, expect, it } from "vitest";
import { linearNav } from "../src/elements/collection/nav-reducer.js";
import type { NavItem } from "../src/elements/collection/roving.js";

const items: NavItem[] = [{ key: "a" }, { key: "b" }, { key: "c" }];

describe("collection/nav-reducer linearNav", () => {
	it("moves on the vertical axis and owns only Up/Down (Left/Right left to the caller)", () => {
		expect(linearNav(items, "a", "ArrowDown", { orientation: "vertical" })).toEqual({ focus: "b", handled: true });
		expect(linearNav(items, "b", "ArrowUp", { orientation: "vertical" })).toEqual({ focus: "a", handled: true });
		expect(linearNav(items, "a", "ArrowRight", { orientation: "vertical" })).toEqual({});
		expect(linearNav(items, "a", "ArrowLeft", { orientation: "vertical" })).toEqual({});
	});

	it("moves on the horizontal axis and owns only Left/Right", () => {
		expect(linearNav(items, "a", "ArrowRight", { orientation: "horizontal" })).toEqual({ focus: "b", handled: true });
		expect(linearNav(items, "b", "ArrowLeft", { orientation: "horizontal" })).toEqual({ focus: "a", handled: true });
		expect(linearNav(items, "a", "ArrowDown", { orientation: "horizontal" })).toEqual({});
	});

	it("owns all four arrows under 'both'", () => {
		expect(linearNav(items, "a", "ArrowRight", { orientation: "both" })).toEqual({ focus: "b", handled: true });
		expect(linearNav(items, "a", "ArrowDown", { orientation: "both" })).toEqual({ focus: "b", handled: true });
		expect(linearNav(items, "b", "ArrowLeft", { orientation: "both" })).toEqual({ focus: "a", handled: true });
	});

	it("clamps by default and wraps when asked, staying handled at the boundary", () => {
		expect(linearNav(items, "c", "ArrowDown", { orientation: "vertical" })).toEqual({ handled: true });
		expect(linearNav(items, "c", "ArrowDown", { orientation: "vertical", wrap: true })).toEqual({ focus: "a", handled: true });
	});

	it("handles Home/End only when enabled", () => {
		expect(linearNav(items, "b", "Home", { homeEnd: true })).toEqual({ focus: "a", handled: true });
		expect(linearNav(items, "b", "End", { homeEnd: true })).toEqual({ focus: "c", handled: true });
		expect(linearNav(items, "b", "Home", {})).toEqual({});
	});

	it("reports Enter/Space as an activation the caller interprets", () => {
		expect(linearNav(items, "b", "Enter")).toEqual({ activate: true, handled: true });
		expect(linearNav(items, "b", " ")).toEqual({ activate: true, handled: true });
	});

	it("returns an empty result for keys it does not own", () => {
		expect(linearNav(items, "b", "PageDown", { homeEnd: true })).toEqual({});
		expect(linearNav(items, "b", "x")).toEqual({});
	});
});
