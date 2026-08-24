// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import "../src/elements/tabs.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { manifest, fragmentSources } from "../src/elements/fragments/tabs/source.generated.js";
import { tabsCss } from "../src/css/components/tabs.js";
import { TABS_OVERFLOWS } from "../src/vocab.js";

beforeAll(async () => {
	await loadFill(manifest, fragmentSources);
});
afterEach(() => {
	document.body.innerHTML = "";
});

function mount(attrs = ""): HTMLElement {
	const el = document.createElement("xtyle-tabs");
	el.setAttribute("label", "Sections");
	for (const pair of attrs.split(" ").filter(Boolean)) {
		const [name, value] = pair.split("=");
		el.setAttribute(name, value ?? "");
	}
	el.innerHTML = `<span slot="tab" data-value="a">A</span><div slot="panel">A</div>`;
	document.body.appendChild(el);
	return el;
}

function rootClass(el: HTMLElement): string {
	const root = el.shadowRoot?.querySelector(".xtyle-tabs") ?? el.querySelector(".xtyle-tabs");
	const className = root?.className ?? "";
	if (className === "") throw new Error("the fill rendered no root, so a class assertion would pass vacuously");
	return className;
}

describe("a tab strip with more tabs than room", () => {
	it("wraps by default, so no tab hides behind a gesture", () => {
		const el = mount();
		expect((el as HTMLElement & { overflow: string }).overflow).toBe("wrap");
		expect(rootClass(el)).not.toContain("xtyle-tabs--scroll");
	});

	it("takes the single-row treatment only when asked", () => {
		expect(rootClass(mount("overflow=scroll"))).toContain("xtyle-tabs--scroll");
	});

	it("falls back to wrapping when handed a value the vocabulary has no rule for", () => {
		const el = mount("overflow=marquee");
		expect((el as HTMLElement & { overflow: string }).overflow).toBe("wrap");
		expect(rootClass(el)).not.toContain("xtyle-tabs--scroll");
	});

	it("scopes the scrollbar to the mode that opted into it, rather than every strip", () => {
		const list = tabsCss.slice(tabsCss.indexOf(".xtyle-tabs__tablist"), tabsCss.indexOf(".xtyle-tabs__tab {"));
		const [base, scrolling] = list.split(".xtyle-tabs--scroll .xtyle-tabs__tablist");
		expect(base).toContain("flex-wrap: wrap");
		expect(base).not.toContain("overflow-x: auto");
		expect(base).not.toContain("scrollbar-width");
		expect(scrolling).toContain("overflow-x: auto");
		expect(scrolling).toContain("flex-wrap: nowrap");
	});

	it("names both modes in the vocabulary the wrappers resolve against", () => {
		expect([...TABS_OVERFLOWS]).toEqual(["wrap", "scroll"]);
	});
});
