import { describe, expect, it } from "vitest";
import { treeMarkup, treeTrailing, type TreeNode } from "../src/markup/tree.js";

describe("tree trailing content", () => {
	it("renders a badge as decorative trailing text", () => {
		const html = treeTrailing({ label: "Opening", badge: "3" }, "opening", false);
		expect(html).toContain('class="xoji-tree__badge"');
		expect(html).toContain('aria-hidden="true"');
		expect(html).toContain(">3<");
	});

	it("renders action buttons carrying the node value and an accessible name", () => {
		const node: TreeNode = { label: "Opening", actions: [{ id: "rename", label: "Rename", icon: "✎" }] };
		const html = treeTrailing(node, "opening", false);
		expect(html).toContain('class="xoji-tree__action"');
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
		expect(html).toContain("xoji-tree__badge");
		expect(html).not.toContain("xoji-tree__action");
	});

	it("returns an empty string when a node has neither badge nor actions", () => {
		expect(treeTrailing({ label: "Plain" }, "plain", false)).toBe("");
	});

	it("places the trailing content inside the row markup", () => {
		const items: TreeNode[] = [{ label: "Opening", value: "op", badge: "3", actions: [{ id: "del", label: "Delete" }] }];
		const html = treeMarkup({ items, label: "Binder" });
		expect(html).toMatch(/xoji-tree__trailing[\s\S]*<\/div>/);
		expect(html).toContain('data-action="del"');
	});
});
