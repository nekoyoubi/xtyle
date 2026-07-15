// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
// side effect: defines the <xtyle-panel> custom element on the happy-dom registry
import "../src/elements/panel.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { manifest, fragmentSources } from "../src/elements/fragments/panel/source.generated.js";

/** Warm the shared fill so every element render below applies its ops synchronously. */
beforeAll(async () => {
	await loadFill(manifest, fragmentSources);
});

afterEach(() => {
	document.body.innerHTML = "";
});

type PanelEl = HTMLElement & { open: boolean };

function make(attrs: Record<string, string> = {}): PanelEl {
	const el = document.createElement("xtyle-panel") as PanelEl;
	el.setAttribute("title", "Advanced options");
	for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
	document.body.appendChild(el);
	return el;
}

function root(el: PanelEl): ShadowRoot {
	return el.shadowRoot as ShadowRoot;
}

function marker(el: PanelEl): HTMLElement | null {
	return root(el).querySelector<HTMLElement>(".xtyle-panel__marker");
}

function toggle(el: PanelEl): HTMLElement {
	return root(el).querySelector<HTMLElement>(".xtyle-panel__toggle") as HTMLElement;
}

function click(node: HTMLElement): void {
	node.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, cancelable: true }));
}

describe("<xtyle-panel> disclosure marker", () => {
	it("draws the marker as an <xtyle-icon>, so the glyph comes from the icon fragment", () => {
		const el = make({ variant: "collapsible" });
		const glyph = marker(el) as HTMLElement;
		expect(glyph.tagName.toLowerCase()).toBe("xtyle-icon");
		expect(glyph.getAttribute("name")).toBe("chevron-right");
		expect(glyph.getAttribute("aria-hidden")).toBe("true");
	});

	it("carries an inline glyph inside the icon element, so the zero-JS render still shows a caret", () => {
		const glyph = marker(make({ variant: "collapsible" })) as HTMLElement;
		expect(glyph.innerHTML).toContain("<svg");
		expect(glyph.innerHTML).toContain("M9 6l6 6-6 6");
	});

	it("draws no marker on the default (non-collapsible) variant", () => {
		expect(marker(make())).toBeNull();
	});
});

describe("<xtyle-panel> collapse survives the marker swap", () => {
	it("starts collapsed, with the region hidden", () => {
		const el = make({ variant: "collapsible" });
		expect(toggle(el).getAttribute("aria-expanded")).toBe("false");
		expect(root(el).querySelector<HTMLElement>(".xtyle-panel__collapse")?.hidden).toBe(true);
	});

	it("starts expanded under `open`", () => {
		const el = make({ variant: "collapsible", open: "" });
		expect(toggle(el).getAttribute("aria-expanded")).toBe("true");
		expect(root(el).querySelector<HTMLElement>(".xtyle-panel__collapse")?.hidden).toBe(false);
	});

	it("toggles open and closed on click, flipping aria-expanded and the region", () => {
		const el = make({ variant: "collapsible" });
		click(toggle(el));
		expect(el.open).toBe(true);
		expect(toggle(el).getAttribute("aria-expanded")).toBe("true");
		expect(root(el).querySelector<HTMLElement>(".xtyle-panel__collapse")?.hidden).toBe(false);
		click(toggle(el));
		expect(el.open).toBe(false);
		expect(toggle(el).getAttribute("aria-expanded")).toBe("false");
		expect(root(el).querySelector<HTMLElement>(".xtyle-panel__collapse")?.hidden).toBe(true);
	});

	it("toggles when the marker itself is clicked — the icon does not swallow the event", () => {
		const el = make({ variant: "collapsible" });
		click(marker(el) as HTMLElement);
		expect(el.open).toBe(true);
	});

	it("emits a toggle event on each flip", () => {
		const el = make({ variant: "collapsible" });
		let toggles = 0;
		el.addEventListener("toggle", () => toggles++);
		click(toggle(el));
		click(toggle(el));
		expect(toggles).toBe(2);
	});

	it("keeps the toggle labelling its region", () => {
		const el = make({ variant: "collapsible" });
		const region = root(el).querySelector<HTMLElement>(".xtyle-panel__collapse") as HTMLElement;
		expect(toggle(el).getAttribute("aria-controls")).toBe(region.id);
		expect(region.getAttribute("role")).toBe("region");
		expect(region.getAttribute("aria-labelledby")).toBe(
			root(el).querySelector(".xtyle-panel__title")?.id,
		);
	});
});
