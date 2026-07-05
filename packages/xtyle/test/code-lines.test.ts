import { describe, expect, it } from "vitest";
import { splitCodeLines, codeGutterWidth, parseLineSpec } from "../src/markup/index.js";

const ZWSP = "\u200b";

describe("splitCodeLines", () => {
	it("wraps each line in a numbered row with a text cell", () => {
		const result = splitCodeLines("a\nb\nc");
		expect(result.lines).toBe(3);
		expect(result.html).toBe(
			`<span class="xtyle-code-line"><span class="xtyle-code-line__text">a</span></span>` +
				`<span class="xtyle-code-line"><span class="xtyle-code-line__text">b</span></span>` +
				`<span class="xtyle-code-line"><span class="xtyle-code-line__text">c</span></span>`,
		);
	});

	it("drops a single trailing newline so a file ending in \\n reads as N lines", () => {
		expect(splitCodeLines("a\nb\n").lines).toBe(2);
	});

	it("keeps an interior blank line as a zero-width-space row", () => {
		const result = splitCodeLines("a\n\nb");
		expect(result.lines).toBe(3);
		expect(result.html).toContain(`<span class="xtyle-code-line__text">${ZWSP}</span>`);
	});

	it("closes and re-opens a token span that straddles a newline", () => {
		const result = splitCodeLines(`<span class="token comment">/* a\nb */</span>`);
		expect(result.lines).toBe(2);
		expect(result.html).toBe(
			`<span class="xtyle-code-line"><span class="xtyle-code-line__text">` +
				`<span class="token comment">/* a</span></span></span>` +
				`<span class="xtyle-code-line"><span class="xtyle-code-line__text">` +
				`<span class="token comment">b */</span></span></span>`,
		);
	});

	it("handles nested spans across a newline, closing inner before outer", () => {
		const result = splitCodeLines(`<span class="a">x<span class="b">y\nz</span>w</span>`);
		expect(result.lines).toBe(2);
		expect(result.html).toBe(
			`<span class="xtyle-code-line"><span class="xtyle-code-line__text">` +
				`<span class="a">x<span class="b">y</span></span></span></span>` +
				`<span class="xtyle-code-line"><span class="xtyle-code-line__text">` +
				`<span class="a"><span class="b">z</span>w</span></span></span>`,
		);
	});

	it("treats single-line input as one row", () => {
		expect(splitCodeLines("just one").lines).toBe(1);
	});

	it("tags only the 1-based lines in the highlight set", () => {
		const result = splitCodeLines("a\nb\nc", new Set([2]));
		expect(result.html).toBe(
			`<span class="xtyle-code-line"><span class="xtyle-code-line__text">a</span></span>` +
				`<span class="xtyle-code-line" data-line-highlight><span class="xtyle-code-line__text">b</span></span>` +
				`<span class="xtyle-code-line"><span class="xtyle-code-line__text">c</span></span>`,
		);
	});

	it("tags nothing without a highlight set", () => {
		expect(splitCodeLines("a\nb").html).not.toContain("data-line-highlight");
	});
});

describe("parseLineSpec", () => {
	it("parses singles, lists, and ranges", () => {
		expect([...parseLineSpec("2")]).toEqual([2]);
		expect([...parseLineSpec("2,4")]).toEqual([2, 4]);
		expect([...parseLineSpec("4-6")]).toEqual([4, 5, 6]);
		expect([...parseLineSpec("1,3-5,8")]).toEqual([1, 3, 4, 5, 8]);
	});

	it("ignores whitespace and reads a reversed range either way", () => {
		expect([...parseLineSpec(" 2 , 4 ")]).toEqual([2, 4]);
		expect([...parseLineSpec("6-4")]).toEqual([4, 5, 6]);
	});

	it("skips non-numeric, zero, and negative entries rather than throwing", () => {
		expect([...parseLineSpec("0,abc,-3,5")]).toEqual([5]);
		expect([...parseLineSpec("")].length).toBe(0);
	});
});

describe("codeGutterWidth", () => {
	it("floors at two digits of room", () => {
		expect(codeGutterWidth(1)).toBe("2.5ch");
		expect(codeGutterWidth(42)).toBe("2.5ch");
	});

	it("widens for three-digit line counts", () => {
		expect(codeGutterWidth(120)).toBe("3.5ch");
	});
});
