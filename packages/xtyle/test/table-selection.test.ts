// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "../src/elements/table.js";

type TableEl = HTMLElement & { selected: string[] };

afterEach(() => {
	document.body.innerHTML = "";
});

const ROWS = ["a", "b", "c", "d"];

function make(selection: string | null, opts: { flag?: string; checkbox?: boolean } = {}): TableEl {
	const el = document.createElement("xtyle-table") as TableEl;
	el.setAttribute("aria-label", "Data");
	if (selection) el.setAttribute("selection", selection);
	const rows = ROWS.map((v) => {
		const sel = v === opts.flag ? " data-selected" : "";
		const box = opts.checkbox ? '<td><input type="checkbox" data-row-select /></td>' : "";
		return `<tr data-value="${v}"${sel}>${box}<td>${v.toUpperCase()}</td></tr>`;
	}).join("");
	el.innerHTML = `<table><tbody>${rows}</tbody></table>`;
	document.body.appendChild(el);
	return el;
}
function table(el: TableEl): HTMLElement {
	return el.querySelector("table") as HTMLElement;
}
function row(el: TableEl, value: string): HTMLElement {
	return el.querySelector(`tbody tr[data-value="${value}"]`) as HTMLElement;
}
function selectedValues(el: TableEl): string[] {
	return [...el.querySelectorAll('tbody tr[aria-selected="true"]')].map((r) => (r as HTMLElement).dataset.value as string);
}
function rovingRow(el: TableEl): string | null {
	return (el.querySelector('tbody tr[tabindex="0"]') as HTMLElement | null)?.dataset.value ?? null;
}
function click(el: TableEl, value: string, init: MouseEventInit = {}): void {
	row(el, value).querySelector("td")?.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, cancelable: true, ...init }));
}
function press(el: TableEl, value: string, key: string): void {
	row(el, value).dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, composed: true, cancelable: true }));
}

describe("<xtyle-table> selection off (default)", () => {
	it("leaves the native table untouched", () => {
		const el = make(null);
		expect(table(el).getAttribute("role")).toBeNull();
		expect(row(el, "a").hasAttribute("aria-selected")).toBe(false);
		expect(row(el, "a").hasAttribute("tabindex")).toBe(false);
	});
});

describe("<xtyle-table> single selection", () => {
	it("becomes a grid; click selects one row and replaces on the next", () => {
		const el = make("single");
		expect(table(el).getAttribute("role")).toBe("grid");
		click(el, "b");
		expect(selectedValues(el)).toEqual(["b"]);
		click(el, "d");
		expect(selectedValues(el)).toEqual(["d"]);
	});

	it("seeds from data-selected", () => {
		const el = make("single", { flag: "c" });
		expect(selectedValues(el)).toEqual(["c"]);
	});
});

describe("<xtyle-table> multi selection", () => {
	it("ctrl-click toggles rows independently; a checkbox mirrors state", () => {
		const el = make("multi", { checkbox: true });
		expect(table(el).getAttribute("aria-multiselectable")).toBe("true");
		click(el, "a");
		click(el, "c", { ctrlKey: true });
		expect(new Set(selectedValues(el))).toEqual(new Set(["a", "c"]));
		expect((row(el, "a").querySelector("input") as HTMLInputElement).checked).toBe(true);
		click(el, "a", { ctrlKey: true });
		expect(selectedValues(el)).toEqual(["c"]);
	});
});

describe("<xtyle-table> range selection", () => {
	it("shift-click extends a span from the anchor", () => {
		const el = make("range");
		click(el, "b");
		click(el, "d", { shiftKey: true });
		expect(selectedValues(el)).toEqual(["b", "c", "d"]);
	});
});

describe("<xtyle-table> keyboard", () => {
	it("ArrowDown moves the roving row; Space toggles; Enter selects", () => {
		const el = make("multi");
		expect(rovingRow(el)).toBe("a");
		press(el, "a", "ArrowDown");
		expect(rovingRow(el)).toBe("b");
		press(el, "b", " ");
		expect(selectedValues(el)).toEqual(["b"]);
		press(el, "b", "End");
		expect(rovingRow(el)).toBe("d");
		press(el, "d", "Enter"); // Enter replaces, collapsing the selection to just this row
		expect(selectedValues(el)).toEqual(["d"]);
	});
});
