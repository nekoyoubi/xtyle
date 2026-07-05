import { describe, expect, it } from "vitest";
import { paginationRange, paginationHref } from "../src/markup/index.js";

describe("paginationRange", () => {
	it("shows the full run when everything fits", () => {
		expect(paginationRange(3, 5)).toEqual([1, 2, 3, 4, 5]);
		expect(paginationRange(1, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
	});

	it("collapses the far side to an ellipsis near the start, widening to hold the slot count", () => {
		expect(paginationRange(1, 20)).toEqual([1, 2, 3, 4, 5, "ellipsis", 20]);
		expect(paginationRange(2, 20)).toEqual([1, 2, 3, 4, 5, "ellipsis", 20]);
	});

	it("shows both ellipses in the middle", () => {
		expect(paginationRange(10, 20)).toEqual([1, "ellipsis", 9, 10, 11, "ellipsis", 20]);
	});

	it("collapses the near side to an ellipsis at the end, widening to hold the slot count", () => {
		expect(paginationRange(20, 20)).toEqual([1, "ellipsis", 16, 17, 18, 19, 20]);
		expect(paginationRange(19, 20)).toEqual([1, "ellipsis", 16, 17, 18, 19, 20]);
	});

	it("keeps a constant slot count across every page so the arrows never shift", () => {
		const counts = new Set<number>();
		for (let page = 1; page <= 20; page++) counts.add(paginationRange(page, 20).length);
		expect([...counts]).toEqual([7]);
		// a wider window stays constant at its own count, too
		const wide = new Set<number>();
		for (let page = 1; page <= 30; page++) wide.add(paginationRange(page, 30, 2).length);
		expect([...wide]).toEqual([9]);
	});

	it("widens the window with more siblings", () => {
		expect(paginationRange(10, 20, 2)).toEqual([1, "ellipsis", 8, 9, 10, 11, 12, "ellipsis", 20]);
	});

	it("pins more pages at the ends with more boundaries", () => {
		expect(paginationRange(10, 20, 1, 2)).toEqual([1, 2, "ellipsis", 9, 10, 11, "ellipsis", 19, 20]);
	});

	it("renders a real gap rather than an ellipsis hiding a single page", () => {
		// page 4 of 20: the left side is 1,2,3,4 — no ellipsis should hide the lone page 3
		expect(paginationRange(4, 20)).toEqual([1, 2, 3, 4, 5, "ellipsis", 20]);
	});

	it("clamps an out-of-range page and a tiny total", () => {
		expect(paginationRange(99, 5)).toEqual([1, 2, 3, 4, 5]);
		expect(paginationRange(0, 3)).toEqual([1, 2, 3]);
		expect(paginationRange(1, 1)).toEqual([1]);
	});
});

describe("paginationHref", () => {
	it("substitutes the {page} placeholder", () => {
		expect(paginationHref("/blog?page={page}", 4)).toBe("/blog?page=4");
		expect(paginationHref("/p/{page}/{page}", 2)).toBe("/p/2/2");
	});

	it("appends the page when no placeholder is present", () => {
		expect(paginationHref("/blog/", 4)).toBe("/blog/4");
	});
});
