// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import "../src/elements/tree.js";
import type { TreeNode } from "../src/markup/index.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { manifest, fragmentSources } from "../src/elements/fragments/tree/source.generated.js";

type TreeEl = HTMLElement & { items: TreeNode[] };

beforeAll(async () => {
	await loadFill(manifest, fragmentSources);
});
afterEach(() => {
	document.body.innerHTML = "";
});

function binder(): TreeNode[] {
	return [
		{
			label: "Chapter 1",
			value: "ch1",
			expanded: true,
			children: [
				{ label: "Opening", value: "ch1-1" },
				{ label: "Rising action", value: "ch1-2" },
			],
		},
		{ label: "Chapter 2", value: "ch2", expanded: true, children: [{ label: "Turn", value: "ch2-1" }] },
	];
}

function make(items: TreeNode[]): TreeEl {
	const el = document.createElement("xtyle-tree") as TreeEl;
	el.setAttribute("label", "Binder");
	el.items = items;
	document.body.appendChild(el);
	return el;
}

function root(el: TreeEl): ShadowRoot {
	return el.shadowRoot as ShadowRoot;
}
function item(el: TreeEl, value: string): HTMLElement | null {
	return root(el).querySelector<HTMLElement>(`[role="treeitem"][data-value="${value}"]`);
}
function rovingKey(el: TreeEl): string | null {
	return root(el).querySelector<HTMLElement>('[role="treeitem"][tabindex="0"]')?.getAttribute("data-value") ?? null;
}
function press(el: TreeEl, value: string, k: string): void {
	item(el, value)?.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, composed: true, cancelable: true }));
}

describe("<xtyle-tree> keyboard — the linear axis (through the shared core)", () => {
	it("ArrowDown/ArrowUp step across the visible pre-order rows", () => {
		const el = make(binder());
		press(el, "ch1", "ArrowDown");
		expect(rovingKey(el)).toBe("ch1-1");
		press(el, "ch1-1", "ArrowDown");
		expect(rovingKey(el)).toBe("ch1-2");
		press(el, "ch1-2", "ArrowUp");
		expect(rovingKey(el)).toBe("ch1-1");
	});

	it("ArrowDown from the last row clamps (no wrap)", () => {
		const el = make(binder());
		press(el, "ch1", "End");
		expect(rovingKey(el)).toBe("ch2-1");
		press(el, "ch2-1", "ArrowDown");
		expect(rovingKey(el)).toBe("ch2-1");
	});

	it("Home and End jump to the first and last visible rows", () => {
		const el = make(binder());
		press(el, "ch2", "Home");
		expect(rovingKey(el)).toBe("ch1");
		press(el, "ch1", "End");
		expect(rovingKey(el)).toBe("ch2-1");
	});
});

describe("<xtyle-tree> keyboard — the hierarchical axis (tree's own, composed on top)", () => {
	it("ArrowRight on an expanded branch moves to its first child", () => {
		const el = make(binder());
		press(el, "ch1", "ArrowRight");
		expect(rovingKey(el)).toBe("ch1-1");
	});

	it("ArrowRight expands a collapsed branch in place", () => {
		const el = make([{ label: "Root", value: "root", children: [{ label: "Leaf", value: "leaf" }] }]);
		expect(item(el, "root")?.getAttribute("aria-expanded")).toBe("false");
		press(el, "root", "ArrowRight");
		expect(item(el, "root")?.getAttribute("aria-expanded")).toBe("true");
	});

	it("ArrowLeft collapses an expanded branch, then hops to the parent", () => {
		const el = make(binder());
		press(el, "ch1", "ArrowLeft");
		expect(item(el, "ch1")?.getAttribute("aria-expanded")).toBe("false");
		press(el, "ch2-1", "ArrowLeft");
		expect(rovingKey(el)).toBe("ch2");
	});
});
