// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import "../src/elements/segmented.js";
import "../src/elements/rating.js";
import "../src/elements/bottom-nav.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { flowKey } from "../src/elements/flow-key.js";
import { manifest as segmentedManifest, fragmentSources as segmentedSources } from "../src/elements/fragments/segmented/source.generated.js";
import { manifest as ratingManifest, fragmentSources as ratingSources } from "../src/elements/fragments/rating/source.generated.js";
import { manifest as navManifest, fragmentSources as navSources } from "../src/elements/fragments/bottom-nav/source.generated.js";

beforeAll(async () => {
	await loadFill(segmentedManifest, segmentedSources);
	await loadFill(ratingManifest, ratingSources);
	await loadFill(navManifest, navSources);
});
afterEach(() => {
	document.body.innerHTML = "";
});

function within(direction: "ltr" | "rtl"): HTMLElement {
	const wrapper = document.createElement("div");
	wrapper.style.direction = direction;
	document.body.appendChild(wrapper);
	return wrapper;
}

function key(target: Element, k: string): void {
	target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, composed: true, cancelable: true }));
}

describe("flowKey", () => {
	it("swaps the inline-axis arrows under right-to-left and passes everything else through", () => {
		const rtl = within("rtl");
		const ltr = within("ltr");
		expect(flowKey("ArrowRight", rtl)).toBe("ArrowLeft");
		expect(flowKey("ArrowLeft", rtl)).toBe("ArrowRight");
		expect(flowKey("ArrowDown", rtl)).toBe("ArrowDown");
		expect(flowKey("Home", rtl)).toBe("Home");
		expect(flowKey("ArrowRight", ltr)).toBe("ArrowRight");
	});
});

describe("arrow keys follow the writing direction", () => {
	it("moves a fragment-rendered radiogroup toward the key's side under rtl, and unchanged under ltr", () => {
		for (const [direction, expected] of [["rtl", "Month"], ["ltr", "Week"]] as const) {
			const el = document.createElement("xtyle-segmented") as HTMLElement & { value: string };
			el.setAttribute("label", "View");
			el.setAttribute("options", "Day,Week,Month");
			el.setAttribute("value", "Day");
			within(direction).appendChild(el);
			key(el.shadowRoot!.querySelector('[role="radio"][data-value="Day"]')!, "ArrowRight");
			expect(el.value, direction).toBe(expected);
		}
	});

	it("raises a rating with the arrow pointing along its stars under rtl", () => {
		const el = document.createElement("xtyle-rating") as HTMLElement & { value: number };
		el.setAttribute("value", "2");
		within("rtl").appendChild(el);
		key(el, "ArrowLeft");
		expect(el.value).toBe(3);
		key(el, "ArrowRight");
		key(el, "ArrowRight");
		expect(el.value).toBe(1);
	});

	it("steps a bottom nav toward the key's side under rtl", () => {
		const el = document.createElement("xtyle-bottom-nav") as HTMLElement & { value: string; tabs: Array<{ value: string; label: string }> };
		within("rtl").appendChild(el);
		el.tabs = [{ value: "home", label: "Home" }, { value: "search", label: "Search" }, { value: "profile", label: "Profile" }];
		el.setAttribute("value", "home");
		key(el, "ArrowLeft");
		expect(el.value).toBe("search");
	});
});
