// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import "../src/elements/list.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { manifest, fragmentSources } from "../src/elements/fragments/list/source.generated.js";

type ListEl = HTMLElement & { items: unknown; selected: string[] };

beforeAll(async () => {
	await loadFill(manifest, fragmentSources);
});
afterEach(() => {
	document.body.innerHTML = "";
});

function make(attrs: Record<string, string>, options: string): ListEl {
	const el = document.createElement("xtyle-list") as ListEl;
	el.setAttribute("label", "Demo");
	for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
	el.setAttribute("options", options);
	document.body.appendChild(el);
	return el;
}
function root(el: ListEl): ShadowRoot {
	return el.shadowRoot as ShadowRoot;
}
function itemEl(el: ListEl, value: string): HTMLElement | null {
	return root(el).querySelector<HTMLElement>(`.xtyle-list__item[data-value="${value}"]`);
}
function selectedValues(el: ListEl): string[] {
	return [...root(el).querySelectorAll('.xtyle-list__item[aria-selected="true"]')].map((n) => n.getAttribute("data-value") as string);
}
function rovingKey(el: ListEl): string | null {
	return root(el).querySelector<HTMLElement>('.xtyle-list__item[tabindex="0"]')?.getAttribute("data-value") ?? null;
}
function click(el: ListEl, value: string, opts: MouseEventInit = {}): void {
	itemEl(el, value)?.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, cancelable: true, ...opts }));
}
function press(el: ListEl, value: string, key: string): void {
	itemEl(el, value)?.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, composed: true, cancelable: true }));
}

describe("<xtyle-list> roles", () => {
	it("is a listbox of options when selectable, a list of listitems otherwise", () => {
		const sel = make({ interaction: "selectable", selection: "single" }, "A,B,C");
		expect(root(sel).querySelector('[role="listbox"]')).not.toBeNull();
		expect(root(sel).querySelectorAll('[role="option"]')).toHaveLength(3);

		const nav = make({ interaction: "navigational" }, "A,B,C");
		expect(root(nav).querySelector('[role="list"]')).not.toBeNull();
		expect(root(nav).querySelectorAll('[role="listitem"]')).toHaveLength(3);
	});
});

describe("<xtyle-list> single selection", () => {
	it("selects one and replaces on the next click", () => {
		const el = make({ interaction: "selectable", selection: "single" }, "A,B,C");
		click(el, "A");
		expect(selectedValues(el)).toEqual(["A"]);
		click(el, "B");
		expect(selectedValues(el)).toEqual(["B"]);
	});
});

describe("<xtyle-list> multi selection", () => {
	it("plain click replaces; ctrl-click toggles independently", () => {
		const el = make({ interaction: "selectable", selection: "multi" }, "A,B,C,D");
		click(el, "A");
		expect(selectedValues(el)).toEqual(["A"]);
		click(el, "B", { ctrlKey: true });
		expect(new Set(selectedValues(el))).toEqual(new Set(["A", "B"]));
		click(el, "A", { ctrlKey: true });
		expect(selectedValues(el)).toEqual(["B"]);
	});
});

describe("<xtyle-list> range selection", () => {
	it("shift-click extends a span from the anchor", () => {
		const el = make({ interaction: "selectable", selection: "range" }, "A,B,C,D,E");
		click(el, "B");
		click(el, "D", { shiftKey: true });
		expect(selectedValues(el)).toEqual(["B", "C", "D"]);
	});
});

describe("<xtyle-list> keyboard", () => {
	it("ArrowDown moves the roving cursor and Enter selects it", () => {
		const el = make({ interaction: "selectable", selection: "single" }, "A,B,C");
		expect(rovingKey(el)).toBe("A");
		press(el, "A", "ArrowDown");
		expect(rovingKey(el)).toBe("B");
		press(el, "B", "Enter");
		expect(selectedValues(el)).toEqual(["B"]);
	});
});

describe("<xtyle-list> navigational", () => {
	it("emits a select event on activation and marks nothing", () => {
		const el = make({ interaction: "navigational" }, "A,B,C");
		let activated: string | null = null;
		el.addEventListener("select", (e) => {
			activated = (e as CustomEvent).detail.value;
		});
		click(el, "B");
		expect(activated).toBe("B");
		expect(selectedValues(el)).toEqual([]);
	});
});
