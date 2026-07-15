// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
// side effect: defines <xtyle-table> (and, through it, the <xtyle-icon> its sort caret renders as)
import "../src/elements/table.js";
import { tableParts } from "../src/markup/table.js";

afterEach(() => {
	document.body.innerHTML = "";
});

function make(headers: string): HTMLElement {
	const el = document.createElement("xtyle-table");
	el.setAttribute("aria-label", "Orders");
	el.innerHTML = `<table><thead><tr>${headers}</tr></thead><tbody><tr><td>#1</td><td>2</td></tr></tbody></table>`;
	document.body.appendChild(el);
	return el;
}

function caret(el: HTMLElement): HTMLElement | null {
	return el.querySelector<HTMLElement>(`.${tableParts.sort}`);
}

describe("<xtyle-table> sort caret", () => {
	it("renders the caret as an <xtyle-icon>, so the glyph comes from the icon fragment", () => {
		const el = make(`<th data-sortable>Order</th><th>Total</th>`);
		const glyph = caret(el);
		expect(glyph).not.toBeNull();
		expect(glyph?.tagName.toLowerCase()).toBe("xtyle-icon");
		expect(glyph?.getAttribute("name")).toBe("chevron-down");
	});

	it("inlines no <svg> of its own — the element invents no glyph markup", () => {
		const el = make(`<th data-sortable>Order</th>`);
		const header = el.querySelector("th") as HTMLElement;
		expect(header.querySelector("svg")).toBeNull();
		expect(caret(el)?.getAttribute("aria-hidden")).toBe("true");
	});

	it("hangs the caret off the header-content row, after the author's own header content", () => {
		const el = make(`<th data-sortable>Order</th>`);
		const content = el.querySelector(`.${tableParts.headerContent}`) as HTMLElement;
		expect(content).not.toBeNull();
		expect(content.textContent).toContain("Order");
		expect(content.lastElementChild).toBe(caret(el));
	});

	it("gives an unsortable header no caret at all", () => {
		const el = make(`<th>Total</th>`);
		expect(caret(el)).toBeNull();
		expect(el.querySelector(`.${tableParts.headerContent}`)).toBeNull();
	});

	it("adds exactly one caret however many times the table re-decorates", () => {
		const el = make(`<th data-sortable>Order</th>`);
		el.setAttribute("variant", "striped");
		el.setAttribute("size", "compact");
		expect(el.querySelectorAll(`.${tableParts.sort}`)).toHaveLength(1);
		expect(el.querySelectorAll(`.${tableParts.headerContent}`)).toHaveLength(1);
	});
});

describe("<xtyle-table> sort state and a11y survive the caret swap", () => {
	it("marks a sortable header, gives it a tab stop, and seeds aria-sort", () => {
		const el = make(`<th data-sortable>Order</th>`);
		const header = el.querySelector("th") as HTMLElement;
		expect(header.classList.contains(tableParts.sortableHeaderCell)).toBe(true);
		expect(header.getAttribute("tabindex")).toBe("0");
		expect(header.getAttribute("aria-sort")).toBe("none");
	});

	it("treats a header that already carries aria-sort as sortable, and keeps that state", () => {
		const el = make(`<th aria-sort="descending">Order</th>`);
		const header = el.querySelector("th") as HTMLElement;
		expect(header.classList.contains(tableParts.sortableHeaderCell)).toBe(true);
		expect(header.getAttribute("aria-sort")).toBe("descending");
		expect(caret(el)).not.toBeNull();
	});

	it("leaves the consumer's aria-sort writes alone — the caret only follows them in CSS", () => {
		const el = make(`<th data-sortable>Order</th>`);
		const header = el.querySelector("th") as HTMLElement;
		header.setAttribute("aria-sort", "ascending");
		expect(header.getAttribute("aria-sort")).toBe("ascending");
		expect(el.querySelectorAll(`.${tableParts.sort}`)).toHaveLength(1);
	});

	it("still classes rows, cells, and groups from the typed parts", () => {
		const el = make(`<th data-sortable>Order</th><th>Total</th>`);
		expect(el.querySelector("thead")?.classList.contains(tableParts.head)).toBe(true);
		expect(el.querySelector("tbody")?.classList.contains(tableParts.body)).toBe(true);
		expect(el.querySelector("tbody tr")?.classList.contains(tableParts.row)).toBe(true);
		expect(el.querySelector("td")?.classList.contains(tableParts.cell)).toBe(true);
	});

	// the subtree observer that re-decorates live rows fires on a microtask, so let it run
	it("decorates a header appended after mount, caret and all", async () => {
		const el = make(`<th data-sortable>Order</th>`);
		const head = el.querySelector("thead tr") as HTMLElement;
		const added = document.createElement("th");
		added.setAttribute("data-sortable", "");
		added.textContent = "Total";
		head.appendChild(added);
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(added.querySelector(`.${tableParts.sort}`)?.getAttribute("name")).toBe("chevron-down");
		expect(el.querySelectorAll(`.${tableParts.sort}`)).toHaveLength(2);
	});
});
