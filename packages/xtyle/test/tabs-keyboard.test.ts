// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import "../src/elements/tabs.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { manifest, fragmentSources } from "../src/elements/fragments/tabs/source.generated.js";

type TabsEl = HTMLElement & { value: string | null };

beforeAll(async () => {
	await loadFill(manifest, fragmentSources);
});
afterEach(() => {
	document.body.innerHTML = "";
});

function make(items: Array<{ label: string; value: string; disabled?: boolean }>, attrs: Record<string, string> = {}): TabsEl {
	const el = document.createElement("xtyle-tabs") as TabsEl;
	el.setAttribute("label", "Sections");
	el.setAttribute("items", JSON.stringify(items));
	for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
	document.body.appendChild(el);
	return el;
}
function root(el: TabsEl): ShadowRoot {
	return el.shadowRoot as ShadowRoot;
}
function tab(el: TabsEl, key: string): HTMLElement | null {
	return root(el).querySelector<HTMLElement>(`[role="tab"][data-key="${key}"]`);
}
function selected(el: TabsEl): string | null {
	return root(el).querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')?.getAttribute("data-key") ?? null;
}
function rovingTab(el: TabsEl): string | null {
	return root(el).querySelector<HTMLElement>('[role="tab"][tabindex="0"]')?.getAttribute("data-key") ?? null;
}
function press(el: TabsEl, key: string, k: string): void {
	tab(el, key)?.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, composed: true, cancelable: true }));
}

const items = [
	{ label: "Alpha", value: "a" },
	{ label: "Beta", value: "b" },
	{ label: "Gamma", value: "c" },
];

describe("<xtyle-tabs> keyboard — automatic activation (default)", () => {
	it("arrows move and select together, and wrap over the ends", () => {
		const el = make(items, { value: "a" });
		press(el, "a", "ArrowRight");
		expect(selected(el)).toBe("b");
		press(el, "b", "ArrowRight");
		expect(selected(el)).toBe("c");
		press(el, "c", "ArrowRight");
		expect(selected(el)).toBe("a");
		press(el, "a", "ArrowLeft");
		expect(selected(el)).toBe("c");
	});

	it("Home and End jump to the ends", () => {
		const el = make(items, { value: "b" });
		press(el, "b", "Home");
		expect(selected(el)).toBe("a");
		press(el, "a", "End");
		expect(selected(el)).toBe("c");
	});

	it("skips a disabled tab", () => {
		const el = make([{ label: "Alpha", value: "a" }, { label: "Beta", value: "b", disabled: true }, { label: "Gamma", value: "c" }], { value: "a" });
		press(el, "a", "ArrowRight");
		expect(selected(el)).toBe("c");
	});
});

describe("<xtyle-tabs> keyboard — manual activation", () => {
	it("arrows move focus without selecting; Enter commits", () => {
		const el = make(items, { value: "a", activation: "manual" });
		press(el, "a", "ArrowRight");
		expect(root(el).activeElement?.getAttribute("data-key")).toBe("b");
		expect(selected(el)).toBe("a");
		press(el, "b", "Enter");
		expect(selected(el)).toBe("b");
	});
});
