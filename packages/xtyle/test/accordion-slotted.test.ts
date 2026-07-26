// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import "../src/elements/accordion.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { manifest, fragmentSources } from "../src/elements/fragments/accordion/source.generated.js";

beforeAll(async () => {
	await loadFill(manifest, fragmentSources);
});
afterEach(() => {
	document.body.innerHTML = "";
	vi.restoreAllMocks();
});

function mount(children: string): HTMLElement {
	const el = document.createElement("xtyle-accordion");
	el.innerHTML = children;
	document.body.appendChild(el);
	return el;
}
/** The text a browser paints, resolving `<slot>` to what it projects. An authored header reaches the
 * trigger through a named slot (so header markup survives instead of being escaped to text), and a
 * slot's own `textContent` is empty — only its assigned nodes carry the content. */
function projectedText(node: Node): string {
	if (node instanceof HTMLSlotElement) return node.assignedNodes().map(projectedText).join("");
	if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
	return Array.from(node.childNodes).map(projectedText).join("");
}
function headers(el: HTMLElement): string[] {
	const root = el.shadowRoot as ShadowRoot;
	return Array.from(root.querySelectorAll<HTMLElement>(".xtyle-accordion__trigger")).map((t) =>
		projectedText(t).trim(),
	);
}

const slotMarkup = `
	<span slot="header">Shipping</span>
	<div slot="panel">Ships in two days.</div>
	<span slot="header">Returns</span>
	<div slot="panel">Thirty days.</div>`;

// INFO: Astro consumes a child's `slot` attribute to route it, so on upgrade children carry only the
// `data-` marker; this is the exact DOM the Astro binding produces
const dataMarkup = `
	<span data-xtyle-header>Shipping</span>
	<div data-xtyle-panel>Ships in two days.</div>
	<span data-xtyle-header>Returns</span>
	<div data-xtyle-panel>Thirty days.</div>`;

describe("<xtyle-accordion> slotted mapping", () => {
	it("maps children marked with `slot`", () => {
		expect(headers(mount(slotMarkup))).toEqual(["Shipping", "Returns"]);
	});

	it("maps children marked with `data-xtyle-header` / `data-xtyle-panel`", () => {
		expect(headers(mount(dataMarkup))).toEqual(["Shipping", "Returns"]);
	});

	it("pairs each data-marked panel to the header of the same order", () => {
		const el = mount(dataMarkup);
		const panels = Array.from(el.querySelectorAll<HTMLElement>("[data-xtyle-panel]"));
		expect(panels.map((p) => p.getAttribute("slot"))).toEqual(["panel-0", "panel-1"]);
	});

	it("pairs marked children by marker, not by position, when an extra child sits between them", () => {
		const el = mount(`
			<span data-xtyle-header>Shipping</span>
			<div data-xtyle-panel>Ships in two days.</div>
			<hr />
			<span data-xtyle-header>Returns</span>
			<div data-xtyle-panel>Thirty days.</div>`);
		expect(headers(el)).toEqual(["Shipping", "Returns"]);
		const panels = Array.from(el.querySelectorAll<HTMLElement>("[data-xtyle-panel]"));
		expect(panels.map((p) => p.textContent?.trim())).toEqual(["Ships in two days.", "Thirty days."]);
	});

	it("warns once when children are present but none carry a marker", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		const el = mount(`<span>Shipping</span><div>Ships in two days.</div>`);
		el.setAttribute("size", "sm");
		const matched = warn.mock.calls.filter((call) => String(call[0]).includes("none are marked"));
		expect(matched).toHaveLength(1);
		expect(String(matched[0][0])).toContain("data-xtyle-header");
	});

	it("stays quiet when the markers map", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		mount(dataMarkup);
		expect(warn.mock.calls.filter((call) => String(call[0]).includes("none are marked"))).toHaveLength(0);
	});
});
