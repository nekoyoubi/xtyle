// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import "../src/elements/index.js";
import { componentsCss } from "../src/css/components.js";
import { loadAllFills } from "./all-fills.js";

const TAGS = [...new Set(componentsCss.match(/(?<![.\w-])xtyle-[a-z-]+(?=\s*\{|\[)/g) ?? [])].filter((tag) => customElements.get(tag) !== undefined);

beforeAll(async () => {
	await loadAllFills();
	const sheet = document.createElement("style");
	sheet.textContent = componentsCss;
	document.head.appendChild(sheet);
});
afterEach(() => {
	document.body.innerHTML = "";
});

describe("the hidden attribute", () => {
	it("hides every element the light-DOM layer gives a display, its variants included", () => {
		expect(TAGS.length).toBeGreaterThan(50);
		const visible: string[] = [];
		for (const tag of TAGS) {
			const el = document.createElement(tag);
			el.setAttribute("hidden", "");
			document.body.appendChild(el);
			if (getComputedStyle(el).display !== "none") visible.push(tag);
		}
		expect(visible).toEqual([]);
		const span = document.createElement("xtyle-text");
		span.setAttribute("as", "span");
		span.setAttribute("hidden", "");
		document.body.appendChild(span);
		expect(getComputedStyle(span).display).toBe("none");
	});

	it("leads every shadow host sheet with a hidden guard that outranks its own host display", () => {
		const shadowed: string[] = [];
		const unguarded: string[] = [];
		for (const tag of TAGS) {
			const host = document.createElement(tag);
			document.body.appendChild(host);
			for (const style of host.shadowRoot?.querySelectorAll("style") ?? []) {
				if (!/:host\s*(\([^)]*\))?\s*\{[^}]*display\s*:/.test(style.textContent ?? "")) continue;
				shadowed.push(tag);
				if (!style.textContent!.startsWith(":host([hidden]) { display: none !important; }")) unguarded.push(tag);
			}
		}
		expect(shadowed, "the probe reached the progress and segmented shadow hosts").toEqual(expect.arrayContaining(["xtyle-progress", "xtyle-segmented"]));
		expect(unguarded).toEqual([]);
	});
});
