// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import "../src/elements/tabs.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { manifest, fragmentSources } from "../src/elements/fragments/tabs/source.generated.js";

beforeAll(async () => {
	await loadFill(manifest, fragmentSources);
});
afterEach(() => {
	document.body.innerHTML = "";
});

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

function mountUnkeyed(active: string): HTMLElement {
	const el = document.createElement("xtyle-tabs");
	el.setAttribute("label", "Sections");
	el.setAttribute("value", active);
	el.innerHTML = `
		<span slot="tab">Alpha</span>
		<span slot="tab">Beta</span>
		<div slot="panel">First</div>
		<div slot="panel">Second</div>`;
	document.body.appendChild(el);
	return el;
}

const selected = (el: HTMLElement): string[] =>
	Array.from((el.shadowRoot as ShadowRoot).querySelectorAll('[role="tab"][aria-selected="true"]')).map(
		(tab) => tab.getAttribute("data-key") ?? "",
	);

const shownPanels = (el: HTMLElement): string[] =>
	Array.from((el.shadowRoot as ShadowRoot).querySelectorAll('[role="tabpanel"]'))
		.filter((panel) => !panel.hasAttribute("hidden"))
		.map((panel) => panel.getAttribute("data-key") ?? "");

describe("a tab keyed after it is inserted still answers the requested value", () => {
	it("falls back to the first tab while the children carry no key", () => {
		const el = mountUnkeyed("b");
		expect(selected(el)).toEqual(["0"]);
	});

	it("re-reads the keys when they arrive after the settle frame has already run", async () => {
		const el = mountUnkeyed("b");
		await settle();
		await settle();
		expect(selected(el), "the settle pass should have run and still found no key").toEqual(["0"]);

		const tabs = Array.from(el.querySelectorAll("span"));
		tabs[0]?.setAttribute("data-value", "a");
		tabs[1]?.setAttribute("data-value", "b");
		await settle();

		expect(selected(el)).toEqual(["b"]);
		expect(shownPanels(el)).toEqual(["b"]);
	});

	it("re-reads a key that changes after the first render", async () => {
		const el = document.createElement("xtyle-tabs");
		el.setAttribute("label", "Sections");
		el.setAttribute("value", "b");
		el.innerHTML = `
			<span slot="tab" data-value="a">Alpha</span>
			<span slot="tab" data-value="b">Beta</span>
			<div slot="panel">First</div>
			<div slot="panel">Second</div>`;
		document.body.appendChild(el);
		expect(selected(el)).toEqual(["b"]);

		el.querySelectorAll("span")[1]?.setAttribute("data-value", "changed");
		await settle();

		expect(selected(el)).toEqual(["a"]);
	});
});
