// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import "../src/elements/alert.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { applyOpsToHtml, renderFragmentLight } from "../src/elements/fragment-ssr.js";
import { manifest, fragmentSources } from "../src/elements/fragments/alert/source.generated.js";

beforeAll(async () => {
	await loadFill(manifest, fragmentSources);
});

afterEach(() => {
	document.body.innerHTML = "";
});

function region(html: string, part: string): string {
	const match = html.match(new RegExp(`<[a-z]+[^>]*part="${part}"[^>]*>`));
	return match?.[0] ?? "";
}

describe("the selectors a fill can address a scaffold node by", () => {
	const html =
		'<div class="card is-open" part="card" data-root>' +
		'<span class="card-caption" part="label" aria-hidden="true">x</span>' +
		'<slot name="header"></slot>' +
		'<b role="listbox" data-selected>y</b>' +
		"</div>";
	const hit = (selector: string) => applyOpsToHtml(html, [{ op: "setAttr", selector, attr: "data-hit", value: "1" }]);

	it("matches an attribute with a value, which is most of what the fills use", () => {
		expect(hit('[part="label"]')).toContain('part="label" aria-hidden="true" data-hit="1"');
	});

	it("still matches a bare attribute and a bare class", () => {
		expect(hit("[data-root]")).toContain('data-hit="1"');
		expect(hit(".card-caption")).toContain('class="card-caption" part="label" aria-hidden="true" data-hit="1"');
	});

	it("bounds a class name on the quotes and spaces, so a longer name is not a match", () => {
		expect(hit(".card")).toContain('class="card is-open" part="card" data-root data-hit="1"');
		expect(applyOpsToHtml('<i class="card-caption"></i>', [{ op: "setAttr", selector: ".card", attr: "z", value: "1" }])).not.toContain("z=");
	});

	it("matches a compound of class and attribute, in either order in the tag", () => {
		expect(hit('.card-caption[part="label"]')).toContain('data-hit="1"');
		expect(hit(".card[data-root]")).toContain('part="card" data-root data-hit="1"');
	});

	it("matches a tag qualified by an attribute, and refuses a tag that only prefixes it", () => {
		expect(hit('slot[name="header"]')).toContain('<slot name="header" data-hit="1">');
		expect(applyOpsToHtml('<slotted name="header"></slotted>', [{ op: "setAttr", selector: 'slot[name="header"]', attr: "z", value: "1" }])).not.toContain("z=");
	});

	it("takes the first alternative of a selector list that matches, the way resolution would", () => {
		expect(hit('[role="combobox"], [role="listbox"]')).toContain('role="listbox" data-selected data-hit="1"');
	});

	it("drops an op whose selector is outside the vocabulary rather than aiming it somewhere else", () => {
		expect(hit("div > span")).toBe(html);
		expect(hit(":first-child")).toBe(html);
		expect(hit("")).toBe(html);
	});
});

describe("the SSR path applies the ops a fill returns", () => {
	it("shows a region the bindings say is filled, rather than leaving the scaffold's hidden in place", async () => {
		const html = await renderFragmentLight("alert", { severity: "info", variant: "soft", hasTitle: true });
		expect(region(html, "title")).not.toContain("hidden");
	});

	it("keeps a region hidden when the bindings say it is empty", async () => {
		const html = await renderFragmentLight("alert", { severity: "info", variant: "soft", hasTitle: false });
		expect(region(html, "title")).toContain("hidden");
	});

	it("carries a class the fill adds and drops one it removes", () => {
		const start = '<div class="chip is-old" part="chip"></div>';
		const added = applyOpsToHtml(start, [{ op: "addClass", selector: '[part="chip"]', value: "is-new" }]);
		expect(added).toContain('class="chip is-old is-new"');
		expect(applyOpsToHtml(added, [{ op: "removeClass", selector: '[part="chip"]', value: "is-old" }])).toContain('class="chip is-new"');
	});

	it("adds a class only once, and removing one it never had changes nothing", () => {
		const start = '<div class="chip" part="chip"></div>';
		expect(applyOpsToHtml(start, [{ op: "addClass", selector: '[part="chip"]', value: "chip" }])).toContain('class="chip"');
		expect(applyOpsToHtml(start, [{ op: "removeClass", selector: '[part="chip"]', value: "absent" }])).toContain('class="chip"');
	});

	it("does not stack a second hidden onto a region already hidden", () => {
		const start = '<div part="r" hidden></div>';
		const out = applyOpsToHtml(start, [{ op: "toggle", selector: '[part="r"]', value: false }]);
		expect(out.match(/hidden/g)).toHaveLength(1);
	});

	it("sees an attribute the scaffold wrote bare, rather than adding a second copy beside it", () => {
		const start = '<div part="r" hidden></div>';
		const out = applyOpsToHtml(start, [{ op: "setAttr", selector: '[part="r"]', attr: "hidden", value: "hidden" }]);
		expect(out.match(/hidden/g)).toHaveLength(2);
		expect(out).toContain('hidden="hidden"');
	});

	it("removes an attribute the scaffold wrote bare, which is what an empty value asks for", () => {
		const start = '<div part="r" hidden></div>';
		expect(applyOpsToHtml(start, [{ op: "setAttr", selector: '[part="r"]', attr: "hidden", value: "" }])).toBe('<div part="r"></div>');
	});

	it("applies an op to every node the selector matches, not only the first", () => {
		const start = '<ul><li class="row">a</li><li class="row">b</li><li class="row">c</li></ul>';
		const out = applyOpsToHtml(start, [{ op: "setAttr", selector: ".row", attr: "aria-selected", value: "false" }]);
		expect(out.match(/aria-selected="false"/g)).toHaveLength(3);
	});

	it("keeps each matched node's own text when it rewrites them all", () => {
		const start = '<ul><li class="row" hidden>a</li><li class="row" hidden>b</li></ul>';
		const out = applyOpsToHtml(start, [{ op: "toggle", selector: ".row", value: true }]);
		expect(out).toBe('<ul><li class="row">a</li><li class="row">b</li></ul>');
	});
});

describe("an SSR-composed element keeps the content the binding already resolved", () => {
	it("does not hide or empty a region the server filled", async () => {
		const html = await renderFragmentLight("alert", { severity: "info", variant: "soft", hasTitle: true });
		const el = document.createElement("xtyle-alert");
		el.setAttribute("severity", "info");
		el.innerHTML = html
			.replace('<slot name="title"></slot>', "Storage almost full")
			.replace("<slot></slot>", "You are using 94% of your quota.");
		document.body.appendChild(el);
		await Promise.resolve();

		const title = el.querySelector<HTMLElement>('[part="title"]');
		expect(title?.textContent).toBe("Storage almost full");
		expect(title?.hidden).toBe(false);
	});
});
