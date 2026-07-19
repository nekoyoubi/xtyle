// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import "../src/elements/segmented.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { manifest, fragmentSources } from "../src/elements/fragments/segmented/source.generated.js";

type SegEl = HTMLElement & { value: string; options: unknown };

beforeAll(async () => {
	await loadFill(manifest, fragmentSources);
});
afterEach(() => {
	document.body.innerHTML = "";
});

function make(attrs: Record<string, string>): SegEl {
	const el = document.createElement("xtyle-segmented") as SegEl;
	el.setAttribute("label", "View");
	for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
	document.body.appendChild(el);
	return el;
}
function root(el: SegEl): ShadowRoot {
	return el.shadowRoot as ShadowRoot;
}
function radio(el: SegEl, value: string): HTMLElement | null {
	return root(el).querySelector<HTMLElement>(`[role="radio"][data-value="${value}"]`);
}
function checked(el: SegEl): string | null {
	return root(el).querySelector<HTMLElement>('[role="radio"][aria-checked="true"]')?.getAttribute("data-value") ?? null;
}
function press(el: SegEl, value: string, k: string): void {
	radio(el, value)?.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, composed: true, cancelable: true }));
}

describe("<xtyle-segmented> keyboard — radiogroup (activate on move)", () => {
	it("arrows move and check together, and wrap over the ends", () => {
		const el = make({ options: "Day,Week,Month", value: "Day" });
		press(el, "Day", "ArrowRight");
		expect(checked(el)).toBe("Week");
		expect(el.value).toBe("Week");
		press(el, "Week", "ArrowRight");
		expect(checked(el)).toBe("Month");
		press(el, "Month", "ArrowRight");
		expect(checked(el)).toBe("Day");
		press(el, "Day", "ArrowLeft");
		expect(checked(el)).toBe("Month");
	});

	it("Home and End jump to the ends", () => {
		const el = make({ options: "Day,Week,Month", value: "Week" });
		press(el, "Week", "Home");
		expect(checked(el)).toBe("Day");
		press(el, "Day", "End");
		expect(checked(el)).toBe("Month");
	});

	it("skips a disabled segment", () => {
		const el = make({ value: "a" });
		el.options = [
			{ value: "a", label: "A" },
			{ value: "b", label: "B", disabled: true },
			{ value: "c", label: "C" },
		];
		press(el, "a", "ArrowRight");
		expect(checked(el)).toBe("c");
	});
});
