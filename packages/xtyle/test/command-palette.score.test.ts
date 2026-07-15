import { describe, expect, it } from "vitest";
import { highlightRuns, subsequenceMatch, subsequenceScorer } from "../src/markup/command-palette.js";

describe("subsequenceMatch", () => {
	it("matches a query as an ordered subsequence, not a substring", () => {
		const hit = subsequenceMatch("of", "Open File");
		expect(hit).not.toBeNull();
		expect(hit?.indices).toEqual([0, 5]);
	});

	it("returns null when a character is missing, or out of order", () => {
		expect(subsequenceMatch("xyz", "Open File")).toBeNull();
		expect(subsequenceMatch("fo", "Open File")).toBeNull();
	});

	it("matches every character case-insensitively and ignores whitespace in the query", () => {
		expect(subsequenceMatch("  O P E N ", "Open File")?.indices).toEqual([0, 1, 2, 3]);
	});

	it("treats an empty query as a match of everything, with nothing to highlight", () => {
		expect(subsequenceMatch("", "Anything")).toEqual({ score: 0 });
	});

	it("never matches an empty label", () => {
		expect(subsequenceMatch("a", "")).toBeNull();
	});

	it("scores a run of adjacent characters above the same characters scattered", () => {
		const run = subsequenceMatch("com", "Commit changes")?.score ?? 0;
		const scattered = subsequenceMatch("com", "Close other minimap")?.score ?? 0;
		expect(run).toBeGreaterThan(scattered);
	});

	it("scores word starts above mid-word hits", () => {
		const starts = subsequenceMatch("gcm", "Git: Commit Message")?.score ?? 0;
		const buried = subsequenceMatch("gcm", "Toggling the accent for me")?.score ?? 0;
		expect(starts).toBeGreaterThan(buried);
	});

	it("prefers the shorter of two otherwise-equal labels", () => {
		const short = subsequenceMatch("save", "Save")?.score ?? 0;
		const long = subsequenceMatch("save", "Save every open editor now")?.score ?? 0;
		expect(short).toBeGreaterThan(long);
	});

	it("prefers a match that starts earlier", () => {
		const early = subsequenceMatch("zen", "Zen mode")?.score ?? 0;
		const late = subsequenceMatch("zen", "Enter the zen") ?? { score: 0 };
		expect(early).toBeGreaterThan(late.score);
	});
});

describe("subsequenceScorer", () => {
	const item = { id: "git.stash", label: "Git: Stash changes", group: "Source control", keywords: ["shelve"] };

	it("scores against the label, with the label's own indices", () => {
		const hit = subsequenceScorer("stash", item);
		expect(hit?.indices?.[0]).toBe(5);
	});

	it("falls back to keywords, group, and hint — and reports no indices for them", () => {
		const hit = subsequenceScorer("shelve", item);
		expect(hit).not.toBeNull();
		expect(hit?.indices).toBeUndefined();
	});

	it("scores a secondary hit below a label hit for the same query", () => {
		const direct = subsequenceScorer("stash", item)?.score ?? 0;
		const secondary = subsequenceScorer("shelve", item)?.score ?? 0;
		expect(secondary).toBeLessThan(direct);
	});

	it("drops an item the query misses everywhere", () => {
		expect(subsequenceScorer("zzz", item)).toBeNull();
	});

	it("keeps an item with no label match and nothing else to match against out of the results", () => {
		expect(subsequenceScorer("zzz", { id: "bare", label: "Bare" })).toBeNull();
	});
});

describe("highlightRuns", () => {
	it("splits a label into matched and unmatched runs", () => {
		expect(highlightRuns("Open File", [0, 5])).toEqual([
			{ text: "O", match: true },
			{ text: "pen ", match: false },
			{ text: "F", match: true },
			{ text: "ile", match: false },
		]);
	});

	it("coalesces adjacent matched characters into one run", () => {
		expect(highlightRuns("Save", [0, 1, 2, 3])).toEqual([{ text: "Save", match: true }]);
	});

	it("returns the whole label unmarked when there are no indices", () => {
		expect(highlightRuns("Save", undefined)).toEqual([{ text: "Save", match: false }]);
		expect(highlightRuns("Save", [])).toEqual([{ text: "Save", match: false }]);
	});

	it("returns nothing for an empty label", () => {
		expect(highlightRuns("", undefined)).toEqual([]);
	});
});
