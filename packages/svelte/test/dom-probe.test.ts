import { describe, expect, it } from "vitest";

// INFO: happy-dom's `querySelectorAll(":scope > [data-x]")` returns 0 for a matching direct child while the same selector without `:scope` returns 1
describe("happy-dom capability probe", () => {
	const build = (): HTMLElement => {
		const host = document.createElement("div");
		host.innerHTML = `<xtyle-progress ramp="thermal" value="70" show-value data-k="v"><span slot="value">x</span></xtyle-progress>`;
		document.body.appendChild(host);
		return host;
	};

	it("keeps an unregistered custom element as a real element with its tag", () => {
		const el = build().firstElementChild!;
		expect(el.tagName.toLowerCase()).toBe("xtyle-progress");
	});

	it("preserves attributes verbatim on an unregistered custom element", () => {
		const el = build().firstElementChild!;
		expect(el.getAttribute("ramp")).toBe("thermal");
		expect(el.getAttribute("value")).toBe("70");
	});

	it("reports a valueless boolean attribute as present with an empty string", () => {
		const el = build().firstElementChild!;
		expect(el.hasAttribute("show-value")).toBe(true);
		expect(el.getAttribute("show-value")).toBe("");
	});

	it("enumerates attributes via getAttributeNames", () => {
		const el = build().firstElementChild!;
		expect(el.getAttributeNames().sort()).toEqual(["data-k", "ramp", "show-value", "value"]);
	});

	it("resolves a tag-name querySelector", () => {
		expect(build().querySelector("xtyle-progress")).not.toBeNull();
	});

	it("walks children via the .children collection", () => {
		const host = build();
		expect(Array.from(host.children).map((c) => c.tagName.toLowerCase())).toEqual(["xtyle-progress"]);
	});

	it("preserves a slot attribute on projected light-DOM content", () => {
		const el = build().firstElementChild!;
		expect(el.firstElementChild!.getAttribute("slot")).toBe("value");
	});

	it("documents the :scope selector gap", () => {
		const host = document.createElement("div");
		host.innerHTML = `<div data-x="1"></div>`;
		document.body.appendChild(host);
		expect(host.querySelectorAll("[data-x]").length).toBe(1);
		expect(host.querySelectorAll(":scope > [data-x]").length).toBe(0);
	});
});
