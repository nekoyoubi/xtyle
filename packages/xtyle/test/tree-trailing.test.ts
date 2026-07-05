import { describe, expect, it } from "vitest";
import { treeMarkup, treeTrailing, type TreeNode } from "../src/markup/tree.js";
import { renderFragmentLight } from "../src/elements/fragment-ssr.js";

const NAV: TreeNode[] = [
	{ label: "About", value: "overview", href: "/" },
	{ label: "Bench", value: "bench", locked: true, expanded: true, children: [{ label: "Themes", value: "themes", href: "/bench/themes" }] },
	{ label: "Components", value: "components", href: "/components", locked: true, expanded: true, children: [{ label: "Button", value: "button", href: "/components/button" }] },
];

describe("tree trailing content", () => {
	it("renders a badge as decorative trailing text", () => {
		const html = treeTrailing({ label: "Opening", badge: "3" }, "opening", false);
		expect(html).toContain('class="xtyle-tree__badge"');
		expect(html).toContain('aria-hidden="true"');
		expect(html).toContain(">3<");
	});

	it("renders action buttons carrying the node value and an accessible name", () => {
		const node: TreeNode = { label: "Opening", actions: [{ id: "rename", label: "Rename", icon: "✎" }] };
		const html = treeTrailing(node, "opening", false);
		expect(html).toContain('class="xtyle-tree__action"');
		expect(html).toContain('data-action="rename"');
		expect(html).toContain('data-value="opening"');
		expect(html).toContain('aria-label="Rename"');
		expect(html).toContain(">✎<");
	});

	it("falls back to the action label when no icon is given", () => {
		const html = treeTrailing({ label: "X", actions: [{ id: "go", label: "Go" }] }, "x", false);
		expect(html).toContain(">Go<");
	});

	it("omits action buttons on a link row (buttons cannot nest in an anchor), keeping the badge", () => {
		const node: TreeNode = { label: "Docs", href: "/docs", badge: "2", actions: [{ id: "x", label: "X" }] };
		const html = treeTrailing(node, "docs", true);
		expect(html).toContain("xtyle-tree__badge");
		expect(html).not.toContain("xtyle-tree__action");
	});

	it("returns an empty string when a node has neither badge nor actions", () => {
		expect(treeTrailing({ label: "Plain" }, "plain", false)).toBe("");
	});

	it("places the trailing content inside the row markup", () => {
		const items: TreeNode[] = [{ label: "Opening", value: "op", badge: "3", actions: [{ id: "del", label: "Delete" }] }];
		const html = treeMarkup({ items, label: "Binder" });
		expect(html).toMatch(/xtyle-tree__trailing[\s\S]*<\/div>/);
		expect(html).toContain('data-action="del"');
	});
});

describe("tree locked section headers", () => {
	it("marks a locked, hrefless branch as a static (non-interactive) header", () => {
		const html = treeMarkup({ items: NAV, label: "Nav" });
		// Bench: locked, no href → inert div header
		expect(html).toMatch(/<div class="xtyle-tree__row xtyle-tree__row--static"[^>]*data-static="true"/);
		// its child is still a normal link
		expect(html).toContain('href="/bench/themes"');
	});

	it("keeps a locked branch that carries an href a navigable link, not a static header", () => {
		const html = treeMarkup({ items: NAV, label: "Nav" });
		// Components: locked + href → an <a>, never static
		expect(html).toMatch(/<a class="xtyle-tree__row"[^>]*href="\/components"/);
		const componentsRow = html.slice(html.indexOf('href="/components"') - 60, html.indexOf('href="/components"') + 20);
		expect(componentsRow).not.toContain("data-static");
	});

	it("renders the same static-header markup through the live SSR fragment", async () => {
		const html = await renderFragmentLight("tree", {
			items: NAV,
			label: "Nav",
			selectedValue: null,
			expandedKeys: ["bench", "components"],
			rovingValue: null,
		});
		expect(html).toMatch(/data-value="bench"[^>]*data-static="true"|data-static="true"[^>]*data-value="bench"/);
		expect(html).toContain("xtyle-tree__row--static");
		// a locked header never takes the roving tab stop
		expect(html).toMatch(/<li class="xtyle-tree__item xtyle-tree__item--locked"[^>]*data-value="bench"[^>]*tabindex="-1"/);
		// Components (locked + href) stays a link with no static marker
		expect(html).toMatch(/<a class="xtyle-tree__row"[^>]*data-value="components"/);
	});
});
