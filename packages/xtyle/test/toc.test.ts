import { describe, it, expect } from "vitest";
import { renderFragmentLight } from "../src/elements/fragment-ssr.js";
import { tocTargetFallbackCss, tocCurrentDeclarations, type TocItem } from "../src/markup/toc.js";
import { tocCss } from "../src/css/components/toc.js";

async function render(items: TocItem[]): Promise<string> {
	return renderFragmentLight("toc", { items, label: "On this page", sticky: false });
}

describe("toc nesting", () => {
	it("renders a flat list when no item carries a level", async () => {
		const html = await render([
			{ id: "a", label: "A" },
			{ id: "b", label: "B" },
		]);
		expect(html).not.toContain("xtyle-toc__list--nested");
		expect(html.match(/<li>/g)).toHaveLength(2);
	});

	it("nests a deeper entry inside the li of the section above it", async () => {
		const html = await render([
			{ id: "a", label: "A", level: 1 },
			{ id: "a1", label: "A1", level: 2 },
			{ id: "b", label: "B", level: 1 },
		]);
		const nested = html.indexOf("xtyle-toc__list--nested");
		expect(nested).toBeGreaterThan(html.indexOf('data-toc-link="a"'));
		expect(nested).toBeLessThan(html.indexOf('data-toc-link="a1"'));
		expect(html).toContain("</ul></li>");
		expect(html.indexOf("</ul></li>")).toBeLessThan(html.indexOf('data-toc-link="b"'));
	});

	it("closes every list it opens", async () => {
		const html = await render([
			{ id: "a", label: "A", level: 1 },
			{ id: "a1", label: "A1", level: 2 },
			{ id: "a1a", label: "A1a", level: 3 },
			{ id: "b", label: "B", level: 1 },
			{ id: "b1", label: "B1", level: 2 },
		]);
		expect(html.match(/<ul/g) ?? []).toHaveLength((html.match(/<\/ul>/g) ?? []).length);
		expect(html.match(/<li>/g) ?? []).toHaveLength((html.match(/<\/li>/g) ?? []).length);
	});

	it("treats a skipped depth as one step down, so an h2→h4 jump still nests once", async () => {
		const html = await render([
			{ id: "a", label: "A", level: 1 },
			{ id: "deep", label: "Deep", level: 4 },
		]);
		expect(html.match(/xtyle-toc__list--nested/g)).toHaveLength(1);
		expect(html).toContain('data-level="2"');
	});

	it("never nests the first item, however deep it claims to be", async () => {
		const html = await render([{ id: "only", label: "Only", level: 3 }]);
		expect(html).not.toContain("xtyle-toc__list--nested");
	});

	it("ignores a nonsense level rather than dropping the entry", async () => {
		const html = await render([
			{ id: "a", label: "A" },
			{ id: "b", label: "B", level: Number.NaN },
			{ id: "c", label: "C", level: -2 },
		]);
		for (const id of ["a", "b", "c"]) expect(html).toContain(`data-toc-link="${id}"`);
		expect(html).not.toContain("xtyle-toc__list--nested");
	});
});

describe("toc zero-JS target fallback", () => {
	it("emits one rule per item, keyed to that item's link", () => {
		const css = tocTargetFallbackCss([
			{ id: "a", label: "A" },
			{ id: "b", label: "B" },
		]);
		expect(css.split("\n")).toHaveLength(2);
		expect(css).toContain(':root:has([id="a"]:target)');
		expect(css).toContain('[data-toc-link="a"]');
	});

	it("stands down once the spy is live", () => {
		expect(tocTargetFallbackCss([{ id: "a", label: "A" }])).toContain("xtyle-toc:not([data-spy])");
	});

	it("sets the same custom properties the active class does, so one look serves both paths", () => {
		const css = tocTargetFallbackCss([{ id: "a", label: "A" }]);
		for (const prop of ["--xtyle-toc-ink", "--xtyle-toc-rail", "--xtyle-toc-weight", "--xtyle-toc-chip"]) {
			expect(css).toContain(prop);
			expect(tocCurrentDeclarations).toContain(prop);
			expect(tocCss).toContain(prop);
		}
	});

	it("every subject is an xtyle link — the :root:has() prefix is a condition, not a footprint", () => {
		const css = tocTargetFallbackCss([{ id: "a", label: "A" }]);
		for (const rule of css.split("\n")) {
			const selector = rule.slice(0, rule.indexOf("{")).trim();
			expect(selector.endsWith('[data-toc-link="a"]')).toBe(true);
		}
	});

	it("cannot break out of the style element or the attribute selector", () => {
		const hostile = [
			{ id: 'a"] { color: red } body { display: none } [x="', label: "y" },
			{ id: "back\\slash", label: "z" },
			{ id: "new\nline", label: "w" },
		];
		const css = tocTargetFallbackCss(hostile);

		// Each item yields exactly one rule, and its declaration block is ours verbatim — so nothing
		// in an id opened a block of its own. The hostile text survives, quoted and inert.
		const rules = css.split("\n").filter(Boolean);
		expect(rules).toHaveLength(hostile.length);
		for (const rule of rules) {
			expect(rule.endsWith(`{ ${tocCurrentDeclarations} }`)).toBe(true);
			const selector = rule.slice(0, rule.lastIndexOf("{"));
			// Every `"` in the selector is either a delimiter or backslash-escaped, so the value
			// cannot terminate early; and a raw newline would end the string and invalidate the rule.
			expect(selector.replace(/\\./g, "").match(/"/g) ?? []).toHaveLength(4);
			expect(selector).not.toContain("\n");
		}
	});

	it("drops an id that could close the style element, since escaping does not apply there", () => {
		const css = tocTargetFallbackCss([{ id: "</style><script>alert(1)</script>", label: "x" }]);
		expect(css).toBe("");
	});

	it("drops nothing legitimate while dropping the breakout", () => {
		const css = tocTargetFallbackCss([
			{ id: "<bad", label: "dropped" },
			{ id: "good-id", label: "kept" },
		]);
		expect(css.split("\n").filter(Boolean)).toHaveLength(1);
		expect(css).toContain('[id="good-id"]');
	});
});
