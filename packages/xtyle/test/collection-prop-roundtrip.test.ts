// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import "../src/elements/toc.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { manifest, fragmentSources } from "../src/elements/fragments/toc/source.generated.js";

const ITEMS = [
	{ id: "anchors", label: "Anchors", level: 1 },
	{ id: "knobs", label: "Knobs", level: 1 },
	{ id: "emit", label: "Emitting", level: 2 },
];

beforeAll(async () => {
	await loadFill(manifest, fragmentSources);
});

afterEach(() => {
	document.body.innerHTML = "";
});

function mount(): HTMLElement & { items: unknown } {
	const element = document.createElement("xtyle-toc") as HTMLElement & { items: unknown };
	document.body.append(element);
	return element;
}

function rendered(element: HTMLElement): number {
	const root = element.querySelector("[data-list]") ?? element.shadowRoot?.querySelector("[data-list]");
	return root ? root.querySelectorAll("li").length : -1;
}

/**
 * A collection prop reaches an element two ways, and a framework picks between them without asking:
 * a property assignment when the element defines a setter, an attribute write when it does not. A
 * setter that serializes unconditionally therefore double-encodes whatever a wrapper already
 * serialized, and the getter's `Array.isArray` guard turns that into an empty collection rather than
 * an error — so the component renders its frame, renders none of its rows, and reports nothing.
 */
describe("a collection prop survives both the property and the attribute path", () => {
	it("takes an array through the property setter", () => {
		const element = mount();
		element.items = ITEMS;
		expect(element.items).toEqual(ITEMS);
		expect(rendered(element), "no rows rendered from an array assignment").toBe(ITEMS.length);
	});

	it("takes an already-serialized string without encoding it a second time", () => {
		const element = mount();
		element.items = JSON.stringify(ITEMS);
		expect(element.items, "a pre-serialized value double-encoded and read back empty").toEqual(ITEMS);
		expect(rendered(element), "no rows rendered from a serialized assignment").toBe(ITEMS.length);
	});

	it("takes the attribute directly, as static markup writes it", () => {
		const element = mount();
		element.setAttribute("items", JSON.stringify(ITEMS));
		expect(element.items).toEqual(ITEMS);
		expect(rendered(element)).toBe(ITEMS.length);
	});

	it("reads back empty for a value that is genuinely not a list, rather than throwing", () => {
		const element = mount();
		element.setAttribute("items", "not json at all");
		expect(element.items).toEqual([]);
	});

	it("agrees across all three paths, so the framework's choice cannot change the render", () => {
		const counts = new Set<number>();
		for (const write of [
			(el: HTMLElement & { items: unknown }) => (el.items = ITEMS),
			(el: HTMLElement & { items: unknown }) => (el.items = JSON.stringify(ITEMS)),
			(el: HTMLElement & { items: unknown }) => el.setAttribute("items", JSON.stringify(ITEMS)),
		]) {
			const element = mount();
			write(element);
			counts.add(rendered(element));
			document.body.innerHTML = "";
		}
		expect(counts.size, `the three paths rendered different row counts: ${[...counts].join(", ")}`).toBe(1);
		expect([...counts][0]).toBe(ITEMS.length);
	});
});
