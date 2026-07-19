import { describe, it, expect } from "vitest";
import { parseAttrs, listItems, decorateTable, type TableParts } from "../src/elements/ssr-markup.js";
import { tableParts } from "../src/markup/table.js";

const parts: TableParts = tableParts;

describe("parseAttrs", () => {
	it("reads quoted, unquoted, and valueless attributes", () => {
		expect(parseAttrs(' class="a b" id=main data-open')).toEqual({ class: "a b", id: "main", "data-open": "" });
	});

	it("decodes entities the way the DOM would", () => {
		expect(parseAttrs(' title="Tom &amp; Jerry &lt;3"')).toEqual({ title: "Tom & Jerry <3" });
	});

	it("keeps a `>` that lives inside an attribute value", () => {
		expect(parseAttrs(' data-q="a > b"')).toEqual({ "data-q": "a > b" });
	});
});

describe("listItems", () => {
	it("splits the authored list into items with their attributes and content", () => {
		const html = `<ol><li class="hot" data-x="1">Shipped <b>v1</b></li><li>Drafted</li></ol>`;
		expect(listItems(html)).toEqual([
			{ attrs: { class: "hot", "data-x": "1" }, html: "Shipped <b>v1</b>" },
			{ attrs: {}, html: "Drafted" },
		]);
	});

	it("treats a nested list as content, not as more items", () => {
		const html = `<ul><li>One<ul><li>inner</li></ul></li><li>Two</li></ul>`;
		const items = listItems(html);
		expect(items).toHaveLength(2);
		expect(items[0].html).toBe("One<ul><li>inner</li></ul>");
		expect(items[1].html).toBe("Two");
	});

	it("skips the fill's own rendered root and finds the authored list", () => {
		const html = `<ol data-root data-events></ol><ol><li>Real</li></ol>`;
		expect(listItems(html)).toEqual([{ attrs: {}, html: "Real" }]);
	});

	it("is empty when there is no list to adopt", () => {
		expect(listItems("<p>nothing here</p>")).toEqual([]);
	});

	it("ignores a `<li>`-looking string inside a comment", () => {
		expect(listItems(`<ol><!-- <li>ghost</li> --><li>Real</li></ol>`)).toEqual([{ attrs: {}, html: "Real" }]);
	});
});

describe("decorateTable", () => {
	const html =
		`<table><caption>Orders</caption>` +
		`<thead><tr><th scope="col">Order</th></tr></thead>` +
		`<tbody><tr class="mine"><td>1</td></tr></tbody>` +
		`<tfoot><tr><td>Total</td></tr></tfoot>` +
		`</table>`;

	it("classes every part the decorator would class at upgrade", () => {
		const out = decorateTable(html, parts, [parts.table]);
		expect(out).toContain(`<caption class="${parts.caption}">`);
		expect(out).toContain(`<thead class="${parts.head}">`);
		expect(out).toContain(`<tbody class="${parts.body}">`);
		expect(out).toContain(`<th scope="col" class="${parts.headerCell}">`);
		expect(out).toContain(`<td class="${parts.cell}">1</td>`);
	});

	it("gives footer cells the footer class instead of the body cell class", () => {
		const out = decorateTable(html, parts, [parts.table]);
		const foot = out.slice(out.indexOf("<tfoot"));
		expect(foot).toContain(`<td class="${parts.footerCell}">Total</td>`);
		expect(foot).not.toContain(parts.cell);
		expect(foot).toContain(`<tr class="${parts.row}">`);
	});

	it("merges the part class onto an authored class rather than replacing it", () => {
		const out = decorateTable(html, parts, [parts.table]);
		expect(out).toContain(`<tr class="mine ${parts.row}">`);
	});

	it("carries the variant classes and the accessible name onto the table", () => {
		const out = decorateTable(html, parts, [parts.table, "xtyle-table--compact"], "Recent orders");
		expect(out).toContain(`class="${parts.table} xtyle-table--compact"`);
		expect(out).toContain(`aria-label="Recent orders"`);
		expect(out).toContain(`part="table"`);
	});

	it("leaves an authored aria-label alone", () => {
		const out = decorateTable(`<table aria-label="Mine"><tbody><tr><td>1</td></tr></tbody></table>`, parts, [], "Other");
		expect(out).toContain(`aria-label="Mine"`);
		expect(out).not.toContain("Other");
	});

	it("passes markup with no table through untouched", () => {
		expect(decorateTable("<p>no table</p>", parts, [parts.table])).toBe("<p>no table</p>");
	});
});
