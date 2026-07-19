// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
// side effect: defines the <xtyle-tree> custom element on the happy-dom registry
import "../src/elements/tree.js";
import type { TreeNode } from "../src/markup/index.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { manifest, fragmentSources } from "../src/elements/fragments/tree/source.generated.js";

type TreeEl = HTMLElement & { items: TreeNode[]; resetState(): void };

/** Warm the shared fill so every element render below applies its ops synchronously. */
beforeAll(async () => {
	await loadFill(manifest, fragmentSources);
});

afterEach(() => {
	document.body.innerHTML = "";
});

function binder(counts: Record<string, string> = {}): TreeNode[] {
	return [
		{
			label: "Chapter 1",
			value: "ch1",
			expanded: true,
			badge: counts.ch1 ?? "1,204",
			children: [
				{ label: "Opening", value: "ch1-1", badge: counts["ch1-1"] ?? "512" },
				{ label: "Rising action", value: "ch1-2", badge: counts["ch1-2"] ?? "388" },
			],
		},
		{
			label: "Chapter 2",
			value: "ch2",
			expanded: true,
			badge: counts.ch2 ?? "812",
			children: [{ label: "Turn", value: "ch2-1", badge: counts["ch2-1"] ?? "301" }],
		},
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

function expandedOf(el: TreeEl, value: string): string | null {
	return item(el, value)?.getAttribute("aria-expanded") ?? null;
}

function rovingKey(el: TreeEl): string | null {
	const stop = root(el).querySelector<HTMLElement>('[role="treeitem"][tabindex="0"]');
	return stop?.getAttribute("data-value") ?? null;
}

function click(el: TreeEl, selector: string): void {
	root(el)
		.querySelector(selector)
		?.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, cancelable: true }));
}

function collapse(el: TreeEl, value: string): void {
	click(el, `.xtyle-tree__twisty[data-value="${value}"]`);
}

function selectRow(el: TreeEl, value: string): void {
	click(el, `[role="treeitem"][data-value="${value}"] > .xtyle-tree__row`);
}

describe("<xtyle-tree> live-data reconciliation", () => {
	it("keeps a user-collapsed branch collapsed when items are re-assigned with new data", () => {
		const el = make(binder());
		collapse(el, "ch1");
		expect(expandedOf(el, "ch1")).toBe("false");

		el.items = binder({ ch1: "1,207", "ch1-1": "515" });

		expect(expandedOf(el, "ch1")).toBe("false");
		expect(expandedOf(el, "ch2")).toBe("true");
	});

	it("keeps a user-expanded branch expanded even when the new data's flag says collapsed", () => {
		const el = make([{ label: "Root", value: "root", children: [{ label: "Leaf", value: "leaf" }] }]);
		click(el, '.xtyle-tree__twisty[data-value="root"]');
		expect(expandedOf(el, "root")).toBe("true");

		el.items = [{ label: "Root", value: "root", children: [{ label: "Leaf", value: "leaf" }] }];

		expect(expandedOf(el, "root")).toBe("true");
	});

	it("keeps the selection across a data-only items swap", () => {
		const el = make(binder());
		selectRow(el, "ch1-2");
		expect(item(el, "ch1-2")?.getAttribute("aria-selected")).toBe("true");

		el.items = binder({ "ch1-2": "401" });

		expect(item(el, "ch1-2")?.getAttribute("aria-selected")).toBe("true");
	});

	it("seeds a genuinely new branch from its own expanded flag", () => {
		const el = make(binder());
		collapse(el, "ch1");

		el.items = [
			...binder(),
			{ label: "Chapter 3", value: "ch3", expanded: true, children: [{ label: "Climax", value: "ch3-1" }] },
			{ label: "Appendix", value: "apx", children: [{ label: "Notes", value: "apx-1" }] },
		];

		expect(expandedOf(el, "ch1")).toBe("false");
		expect(expandedOf(el, "ch3")).toBe("true");
		expect(expandedOf(el, "apx")).toBe("false");
	});

	/** A leaf that gains its first child is an old *key* but a new *branch*, and nobody has decided
	 * its expansion yet — so the author's `expanded` has to win, exactly as it does for a branch that
	 * appears from nothing. Keying "new" on the node instead of the branch collapsed the branch the
	 * user had just created and hid the child they had just moved into it: the "nest under previous"
	 * gesture made the document vanish. Invisible in a static tree, where every branch is new on the
	 * first render and the flag works perfectly. */
	it("seeds a leaf that becomes a branch from its expanded flag, so the new child is visible", () => {
		const el = make([
			{ label: "Chapter 1", value: "ch1", expanded: true },
			{ label: "Chapter 2", value: "ch2", expanded: true },
		]);
		expect(expandedOf(el, "ch1")).toBe(null);

		// "nest under previous": ch2 moves inside ch1, which was a leaf a moment ago
		el.items = [
			{
				label: "Chapter 1",
				value: "ch1",
				expanded: true,
				children: [{ label: "Chapter 2", value: "ch2", expanded: true }],
			},
		];

		expect(expandedOf(el, "ch1")).toBe("true");
		expect(item(el, "ch2")).not.toBeNull();
	});

	it("still lets the user's collapse win over the flag once the branch exists", () => {
		const el = make([
			{ label: "Chapter 1", value: "ch1", expanded: true, children: [{ label: "Opening", value: "ch1-1" }] },
		]);
		collapse(el, "ch1");
		expect(expandedOf(el, "ch1")).toBe("false");

		// a known branch gaining another child is not a new branch — the collapse holds
		el.items = [
			{
				label: "Chapter 1",
				value: "ch1",
				expanded: true,
				children: [
					{ label: "Opening", value: "ch1-1" },
					{ label: "Rising action", value: "ch1-2" },
				],
			},
		];

		expect(expandedOf(el, "ch1")).toBe("false");
	});

	it("seeds a new locked branch open, as a section header", () => {
		const el = make(binder());
		el.items = [
			...binder(),
			{ label: "Trash", value: "trash", locked: true, children: [{ label: "Cut scene", value: "cut" }] },
		];
		expect(item(el, "cut")).not.toBeNull();
		expect(item(el, "trash")?.getAttribute("data-locked")).toBe("true");
	});

	it("drops a removed key rather than letting it linger in the expanded set", () => {
		const el = make(binder());
		// re-expanding a branch that no longer exists must not resurrect its state
		el.items = [binder()[0]];
		expect(item(el, "ch2")).toBeNull();

		el.items = binder().map((node) => (node.value === "ch2" ? { ...node, expanded: false } : node));

		expect(expandedOf(el, "ch2")).toBe("false");
	});

	it("re-seeds the selection from the new data when the selected node is gone", () => {
		const el = make(binder());
		selectRow(el, "ch2-1");
		expect(item(el, "ch2-1")?.getAttribute("aria-selected")).toBe("true");

		el.items = [{ label: "Chapter 1", value: "ch1", children: [{ label: "Opening", value: "ch1-1", selected: true }] }];

		expect(item(el, "ch1-1")?.getAttribute("aria-selected")).toBe("true");
	});
});

describe("<xtyle-tree> live-data re-render", () => {
	it("repaints a row's badge when only the node data changed", () => {
		const el = make(binder());
		expect(item(el, "ch1-1")?.querySelector(".xtyle-tree__badge")?.textContent).toBe("512");

		el.items = binder({ "ch1-1": "515" });

		expect(item(el, "ch1-1")?.querySelector(".xtyle-tree__badge")?.textContent).toBe("515");
	});

	it("repaints a row's label and adds new rows on an items swap", () => {
		const el = make(binder());
		const next = binder();
		next[1].label = "Chapter Two";
		next.push({ label: "Chapter 3", value: "ch3" });

		el.items = next;

		expect(item(el, "ch2")?.querySelector(".xtyle-tree__label")?.textContent).toBe("Chapter Two");
		expect(item(el, "ch3")).not.toBeNull();
	});

	it("holds keyboard focus on the focused row through a live-data rebuild", () => {
		const el = make(binder());
		const focused = item(el, "ch1-2") as HTMLElement;
		focused.focus();

		el.items = binder({ "ch1-2": "402" });

		expect((root(el).activeElement as HTMLElement | null)?.getAttribute("data-value")).toBe("ch1-2");
	});
});

describe("<xtyle-tree> roving tab stop across an items swap", () => {
	it("keeps exactly one row in the tab order after every swap", () => {
		const el = make(binder());
		expect(rovingKey(el)).toBe("ch1");
		expect(root(el).querySelectorAll('[role="treeitem"][tabindex="0"]')).toHaveLength(1);

		el.items = binder({ ch1: "9" });

		expect(root(el).querySelectorAll('[role="treeitem"][tabindex="0"]')).toHaveLength(1);
	});

	it("stays in the tab order when the swap removes the row that held focus", () => {
		const el = make(binder());
		selectRow(el, "ch2-1");
		expect(rovingKey(el)).toBe("ch2-1");

		el.items = [binder()[0]];

		expect(root(el).querySelectorAll('[role="treeitem"][tabindex="-1"]').length).toBeGreaterThan(0);
		expect(rovingKey(el)).toBe("ch1");
	});

	it("never seats the tab stop on a row hidden inside a collapsed branch", () => {
		const el = make(binder());
		selectRow(el, "ch1-2");
		collapse(el, "ch1");
		expect(rovingKey(el)).toBe("ch1");
	});
});

describe("<xtyle-tree> resetState", () => {
	it("re-seeds expansion, selection, and the tab stop from the current items flags", () => {
		const el = make(binder());
		collapse(el, "ch1");
		selectRow(el, "ch2-1");
		expect(expandedOf(el, "ch1")).toBe("false");

		el.resetState();

		expect(expandedOf(el, "ch1")).toBe("true");
		expect(item(el, "ch2-1")?.getAttribute("aria-selected")).toBe("false");
		expect(rovingKey(el)).toBe("ch1");
	});
});
