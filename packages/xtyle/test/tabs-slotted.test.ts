// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import "../src/elements/tabs.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { manifest, fragmentSources } from "../src/elements/fragments/tabs/source.generated.js";

beforeAll(async () => {
	await loadFill(manifest, fragmentSources);
});
afterEach(() => {
	document.body.innerHTML = "";
	vi.restoreAllMocks();
});

function mount(children: string): HTMLElement {
	const el = document.createElement("xtyle-tabs");
	el.setAttribute("label", "Sections");
	el.innerHTML = children;
	document.body.appendChild(el);
	return el;
}
/** The text a browser paints, resolving `<slot>` to what it projects. An authored tab reaches the
 * trigger through a named slot (so label markup survives instead of being escaped to text), and a
 * slot's own `textContent` is empty — only its assigned nodes carry the content. */
function projectedText(node: Node): string {
	if (node instanceof HTMLSlotElement) return node.assignedNodes().map(projectedText).join("");
	if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
	return Array.from(node.childNodes).map(projectedText).join("");
}
function labels(el: HTMLElement): string[] {
	const root = el.shadowRoot as ShadowRoot;
	return Array.from(root.querySelectorAll<HTMLElement>('[role="tab"]')).map((t) => projectedText(t).trim());
}

const slotMarkup = `
	<span slot="tab" value="a">Alpha</span>
	<span slot="tab" value="b">Beta</span>
	<div slot="panel">First</div>
	<div slot="panel">Second</div>`;

// INFO: Astro consumes a child's `slot` attribute to route it, so by upgrade time the children carry
// only the `data-` marker; this is the exact DOM the Astro binding produces
const dataMarkup = `
	<span data-xtyle-tab value="a">Alpha</span>
	<span data-xtyle-tab value="b">Beta</span>
	<div data-xtyle-panel>First</div>
	<div data-xtyle-panel>Second</div>`;

describe("<xtyle-tabs> slotted mapping", () => {
	it("maps children marked with `slot`", () => {
		expect(labels(mount(slotMarkup))).toEqual(["Alpha", "Beta"]);
	});

	it("maps children marked with `data-xtyle-tab` / `data-xtyle-panel`", () => {
		expect(labels(mount(dataMarkup))).toEqual(["Alpha", "Beta"]);
	});

	it("maps a mix of both markers", () => {
		const el = mount(`
			<span slot="tab" value="a">Alpha</span>
			<span data-xtyle-tab value="b">Beta</span>
			<div slot="panel">First</div>
			<div data-xtyle-panel>Second</div>`);
		expect(labels(el)).toEqual(["Alpha", "Beta"]);
	});

	it("slots each data-marked panel by its own index", () => {
		const el = mount(dataMarkup);
		const panels = Array.from(el.querySelectorAll<HTMLElement>("[data-xtyle-panel]"));
		expect(panels.map((p) => p.getAttribute("slot"))).toEqual(["panel-0", "panel-1"]);
	});

	it("re-asserting the mapping after the DOM settles keeps the panel slots stable", () => {
		const el = mount(dataMarkup);
		el.setAttribute("value", "b");
		const panels = Array.from(el.querySelectorAll<HTMLElement>("[data-xtyle-panel]"));
		expect(panels.map((p) => p.getAttribute("slot"))).toEqual(["panel-0", "panel-1"]);
		expect(labels(el)).toEqual(["Alpha", "Beta"]);
	});

	it("warns once when children are present but none carry a marker", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		const el = mount(`<span value="a">Alpha</span><div>First</div>`);
		el.setAttribute("value", "a");
		const matched = warn.mock.calls.filter((call) => String(call[0]).includes("matched no tabs"));
		expect(matched).toHaveLength(1);
		expect(String(matched[0][0])).toContain("data-xtyle-tab");
	});

	it("stays quiet when the markers map", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		mount(dataMarkup);
		expect(warn.mock.calls.filter((call) => String(call[0]).includes("matched no tabs"))).toHaveLength(0);
	});
});
