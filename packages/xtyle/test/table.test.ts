import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { tableCss } from "../src/css/components/table.js";
import { tableParts } from "../src/index.js";
import { FULL_TONES } from "../src/vocab.js";

const source = readFileSync(fileURLToPath(new URL("../src/elements/table.ts", import.meta.url)), "utf8");

describe("xtyle-table re-decoration", () => {
	it("arms a MutationObserver over the subtree so post-mount rows get decorated", () => {
		expect(source).toContain("new MutationObserver");
		expect(source).toMatch(/observe\(this,\s*\{\s*childList:\s*true,\s*subtree:\s*true\s*\}\)/);
	});

	it("disconnects the observer while decorating, so its own writes can't loop", () => {
		expect(source).toMatch(/decorate\(\):\s*void\s*\{\s*this\.contentObserver\?\.disconnect\(\)/);
	});

	it("disconnects the observer on teardown", () => {
		expect(source).toMatch(/disconnectedCallback[\s\S]*this\.contentObserver\?\.disconnect\(\)/);
	});
});

describe("xtyle-table scroll-region focus", () => {
	it("makes the wrap tabbable only when it overflows", () => {
		expect(source).toContain("updateScrollAffordance");
		expect(source).toMatch(/scrollWidth > this\.clientWidth/);
	});

	it("gives that focusable scroll region a visible focus ring", () => {
		expect(tableCss).toContain(".xtyle-table-wrap:focus-visible");
		const rule = tableCss.slice(tableCss.indexOf(".xtyle-table-wrap:focus-visible"));
		expect(rule.slice(0, rule.indexOf("}"))).toContain("var(--ring)");
	});
});

describe("xtyle-table sort caret", () => {
	it("invents no glyph markup of its own — the caret is an <xtyle-icon>", () => {
		expect(source).not.toContain("viewBox");
		expect(source).not.toContain("<path");
		expect(source).not.toContain("insertAdjacentHTML");
		expect(source).toContain('createElement("xtyle-icon")');
	});

	it("styles the caret host, not a nested svg it no longer owns", () => {
		expect(tableCss).toContain(".xtyle-table__sort");
		expect(tableCss).not.toContain(".xtyle-table__sort svg");
	});
});

describe("tableParts export", () => {
	it("names the part classes the decorator writes, as the single source of truth", () => {
		expect(tableParts.row).toBe("xtyle-table__row");
		expect(tableParts.head).toBe("xtyle-table__head");
		expect(tableParts.body).toBe("xtyle-table__body");
		expect(tableParts.headerCell).toBe("xtyle-table__header-cell");
		expect(source).toContain("tableParts.row");
		expect(source).toContain("import { tableParts }");
	});
});

describe("xtyle-table row and cell tones", () => {
	it("paints a toned row or cell in every tone of the roster", () => {
		for (const tone of FULL_TONES) {
			expect(tableCss).toContain(`.xtyle-table__row[data-tone="${tone}"] > .xtyle-table__cell`);
			expect(tableCss).toContain(`.xtyle-table__row > .xtyle-table__cell[data-tone="${tone}"]`);
			expect(tableCss).toContain(`var(--${tone}-bg)`);
		}
	});

	it("lets a cell's tone win over its row's by coming later at equal weight", () => {
		const row = tableCss.indexOf('.xtyle-table__row[data-tone="danger"] > .xtyle-table__cell');
		const cell = tableCss.indexOf('.xtyle-table__row > .xtyle-table__cell[data-tone="danger"]');
		expect(row).toBeGreaterThan(-1);
		expect(cell).toBeGreaterThan(row);
	});

	it("keeps the selected row's accent fill on top of a tone", () => {
		const tones = tableCss.indexOf("[data-tone=");
		const selected = tableCss.indexOf('.xtyle-table__row[aria-selected="true"] > .xtyle-table__cell');
		expect(selected).toBeGreaterThan(tones);
	});

	it("lays the hover tint over each cell, so a tone, a stripe, or an opaque sticky cell keeps it", () => {
		expect(tableCss).toMatch(/\.xtyle-table--hover \.xtyle-table__body \.xtyle-table__row:hover > \* \{\s*background-image: linear-gradient\(var\(--state-hover\), var\(--state-hover\)\);/);
		expect(tableCss).not.toMatch(/\.xtyle-table__row:hover \{\s*background:/);
	});
});
