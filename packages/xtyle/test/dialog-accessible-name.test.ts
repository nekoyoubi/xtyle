// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import "../src/elements/dialog.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { manifest, fragmentSources } from "../src/elements/fragments/dialog/source.generated.js";

beforeAll(async () => {
	await loadFill(manifest, fragmentSources);
});

afterEach(() => {
	document.body.innerHTML = "";
});

function make(attrs: Record<string, string>): HTMLElement {
	const el = document.createElement("xtyle-dialog");
	for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
	document.body.appendChild(el);
	return el;
}

const inner = (el: HTMLElement): Element | null =>
	(el.shadowRoot ?? el).querySelector(".xtyle-dialog");

describe("dialog: a re-labelled dialog announces its current name", () => {
	it("moves `aria-label` when `label` changes on a live dialog", () => {
		const el = make({ label: "Relic" });
		expect(inner(el)?.getAttribute("aria-label")).toBe("Relic");

		el.setAttribute("label", "Module");
		expect(inner(el)?.getAttribute("aria-label")).toBe("Module");
	});

	it("moves `aria-labelledby` when `labelledby` is re-pointed", () => {
		const el = make({ labelledby: "first-title" });
		expect(inner(el)?.getAttribute("aria-labelledby")).toBe("first-title");

		el.setAttribute("labelledby", "second-title");
		expect(inner(el)?.getAttribute("aria-labelledby")).toBe("second-title");
	});

	it("keeps the close button's name current", () => {
		const el = make({ label: "Relic", "close-label": "Dismiss" });
		const close = () => (el.shadowRoot ?? el).querySelector(".xtyle-dialog__close");
		expect(close()?.getAttribute("aria-label")).toBe("Dismiss");

		el.setAttribute("close-label", "Close panel");
		expect(close()?.getAttribute("aria-label")).toBe("Close panel");
	});

	it("lets a heading own the name, and keeps `aria-label` off it", () => {
		const el = make({ heading: "Relic" });
		expect(inner(el)?.getAttribute("aria-label")).toBeNull();
		expect(inner(el)?.getAttribute("aria-labelledby")).toBeTruthy();

		el.setAttribute("heading", "Module");
		expect((el.shadowRoot ?? el).querySelector(".xtyle-dialog__title")?.textContent).toBe("Module");
		expect(inner(el)?.getAttribute("aria-label")).toBeNull();
	});
});
