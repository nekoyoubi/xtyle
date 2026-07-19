// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { apply, clear } from "../src/dom.js";
import { emitCss } from "../src/emit/css.js";

/**
 * The theme block's footprint. A derived theme owns the app's chrome — scrollbars included — so both
 * doors declare it by default. The point of the option is that the two doors agree: `emitCss` used to
 * write `scrollbar-color` while `apply()` silently didn't, so the same theme had two different
 * footprints depending on which path a consumer took.
 *
 * `npm run audit:css` reports what the component sheet reaches; this covers what the *token* block does.
 */
const register = {
	"--bg-0": "#101014",
	"--scrollbar-thumb": "#333333",
	"--scrollbar-track": "#111111",
};

describe("the theme block", () => {
	it("themes the scrollbars by default", () => {
		expect(emitCss(register)).toContain(
			"scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);",
		);
	});

	it("leaves them to the browser when asked", () => {
		expect(emitCss(register, { scrollbars: false })).not.toContain("scrollbar-color");
	});

	it("omits them when the algorithm produces no scrollbar tokens", () => {
		expect(emitCss({ "--bg-0": "#101014" })).not.toContain("scrollbar-color");
	});

	it("declares color-scheme, which nothing else can do", () => {
		expect(emitCss(register)).toContain("color-scheme: dark;");
	});

	it("writes to a caller's selector, so a theme can be scoped to a subtree", () => {
		expect(emitCss(register, { selector: ".theme-dark" })).toMatch(/^\.theme-dark \{/);
		expect(emitCss(register)).toMatch(/^:root \{/);
	});
});

describe("apply() and emitCss agree on the footprint", () => {
	it("apply() themes the scrollbars, the way the emitted sheet does", () => {
		const target = document.createElement("div");
		apply(register, { target });
		expect(target.style.scrollbarColor).toBe("#333333 #111111");
		expect(target.style.colorScheme).toBe("dark");
	});

	it("apply() honors the same opt-out", () => {
		const target = document.createElement("div");
		apply(register, { target, scrollbars: false });
		// never-set reads back as `undefined` in happy-dom and `""` in a browser; both mean untouched
		expect(target.style.scrollbarColor).toBeFalsy();
		expect(target.style.colorScheme).toBe("dark");
	});

	it("clear() puts back everything apply() set", () => {
		const target = document.createElement("div");
		apply(register, { target });
		clear(register, target);
		expect(target.style.scrollbarColor).toBe("");
		expect(target.style.colorScheme).toBe("");
	});
});
