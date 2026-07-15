// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
// side effect: defines the <xtyle-accordion> custom element on the happy-dom registry
import "../src/elements/accordion.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { manifest, fragmentSources } from "../src/elements/fragments/accordion/source.generated.js";

/** Warm the shared fill so every element render below applies its ops synchronously. */
beforeAll(async () => {
	await loadFill(manifest, fragmentSources);
});

afterEach(() => {
	document.body.innerHTML = "";
});

function make(attrs: Record<string, string> = {}): HTMLElement {
	const el = document.createElement("xtyle-accordion");
	for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
	el.setAttribute(
		"items",
		JSON.stringify([
			{ header: "Shipping", panel: "Ships same day.", value: "a" },
			{ header: "Returns", panel: "Thirty days.", value: "b", open: true },
			{ header: "Warranty", panel: "One year.", value: "c" },
		]),
	);
	document.body.appendChild(el);
	return el;
}

function root(el: HTMLElement): ShadowRoot {
	return el.shadowRoot as ShadowRoot;
}

function trigger(el: HTMLElement, key: string): HTMLElement {
	return root(el).querySelector<HTMLElement>(`.xtyle-accordion__trigger[data-key="${key}"]`) as HTMLElement;
}

function expandedOf(el: HTMLElement, key: string): string | null {
	return trigger(el, key).getAttribute("aria-expanded");
}

function click(el: HTMLElement, key: string): void {
	trigger(el, key).dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, cancelable: true }));
}

describe("<xtyle-accordion> chevron", () => {
	it("draws the chevron as an <xtyle-icon>, so the glyph comes from the icon fragment", () => {
		const el = make();
		const chevron = trigger(el, "a").querySelector(".xtyle-accordion__chevron") as HTMLElement;
		expect(chevron.tagName.toLowerCase()).toBe("xtyle-icon");
		expect(chevron.getAttribute("name")).toBe("chevron-down");
		expect(chevron.getAttribute("aria-hidden")).toBe("true");
	});

	it("gives every section its own chevron", () => {
		expect(root(make()).querySelectorAll(".xtyle-accordion__chevron")).toHaveLength(3);
	});

	it("carries an inline glyph inside the icon element, so the zero-JS render still shows a caret", () => {
		const chevron = root(make()).querySelector(".xtyle-accordion__chevron") as HTMLElement;
		// the fallback is the icon set's own `chevron-down` body, not a hand-copied path
		expect(chevron.innerHTML).toContain("<svg");
		expect(chevron.innerHTML).toContain("M6 9l6 6 6-6");
	});
});

describe("<xtyle-accordion> expand/collapse survives the chevron swap", () => {
	it("opens the section seeded open and leaves the rest collapsed", () => {
		const el = make();
		expect(expandedOf(el, "a")).toBe("false");
		expect(expandedOf(el, "b")).toBe("true");
		expect(root(el).querySelector<HTMLElement>('.xtyle-accordion__panel[data-key="b"]')?.hidden).toBe(false);
		expect(root(el).querySelector<HTMLElement>('.xtyle-accordion__panel[data-key="a"]')?.hidden).toBe(true);
	});

	it("toggles a section open on click and closes the previously open one (single-open)", () => {
		const el = make();
		click(el, "a");
		expect(expandedOf(el, "a")).toBe("true");
		expect(expandedOf(el, "b")).toBe("false");
		expect(root(el).querySelector<HTMLElement>('.xtyle-accordion__panel[data-key="a"]')?.hidden).toBe(false);
	});

	it("closes an open section when it is clicked again", () => {
		const el = make();
		click(el, "b");
		expect(expandedOf(el, "b")).toBe("false");
		expect(root(el).querySelector<HTMLElement>('.xtyle-accordion__panel[data-key="b"]')?.hidden).toBe(true);
	});

	it("keeps several sections open under `multiple`", () => {
		const el = make({ multiple: "" });
		click(el, "a");
		expect(expandedOf(el, "a")).toBe("true");
		expect(expandedOf(el, "b")).toBe("true");
	});

	it("emits a toggle event carrying the key and the new open state", () => {
		const el = make();
		const seen: { key: string; open: boolean }[] = [];
		el.addEventListener("toggle", (event) => {
			const detail = (event as CustomEvent).detail as { key: string; open: boolean };
			seen.push({ key: detail.key, open: detail.open });
		});
		click(el, "a");
		click(el, "a");
		expect(seen).toEqual([
			{ key: "a", open: true },
			{ key: "a", open: false },
		]);
	});

	it("clicking the chevron toggles its own section — the icon does not swallow the event", () => {
		const el = make();
		const chevron = trigger(el, "a").querySelector(".xtyle-accordion__chevron") as HTMLElement;
		chevron.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, cancelable: true }));
		expect(expandedOf(el, "a")).toBe("true");
	});
});
