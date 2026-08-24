// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import "../src/elements/accordion.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { manifest, fragmentSources } from "../src/elements/fragments/accordion/source.generated.js";

beforeAll(async () => {
	await loadFill(manifest, fragmentSources);
});

afterEach(() => {
	document.body.innerHTML = "";
});

function section(marker: "header" | "panel", text: string): HTMLElement {
	const el = document.createElement("span");
	el.setAttribute(`data-xtyle-${marker}`, "");
	el.textContent = text;
	return el;
}

function headers(host: HTMLElement): number {
	const root = host.querySelector("[data-items]") ?? host.shadowRoot?.querySelector("[data-items]");
	return root ? root.querySelectorAll("[part='item']").length : -1;
}

/**
 * A framework that owns the children appends them after the element is already in the document, so a
 * component that reads `this.children` once at upgrade sees an empty host and renders an empty frame.
 * Nothing throws, so the failure reads as "I passed the wrong data" from the outside.
 */
describe("an accordion sees the sections it is given, whenever they arrive", () => {
	it("renders sections present before it upgrades", () => {
		const host = document.createElement("xtyle-accordion");
		host.append(section("header", "One"), section("panel", "First"));
		document.body.append(host);
		expect(headers(host), "sections authored up front did not render").toBe(1);
	});

	it("renders sections appended after it is already connected", async () => {
		const host = document.createElement("xtyle-accordion");
		document.body.append(host);
		expect(headers(host)).toBe(0);

		host.append(section("header", "One"), section("panel", "First"));
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(headers(host), "a section that arrived after upgrade never rendered").toBe(1);
	});

	it("keeps up when a second section arrives later still", async () => {
		const host = document.createElement("xtyle-accordion");
		document.body.append(host);
		host.append(section("header", "One"), section("panel", "First"));
		await new Promise((resolve) => setTimeout(resolve, 0));

		host.append(section("header", "Two"), section("panel", "Second"));
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(headers(host), "the accordion stopped watching after the first batch").toBe(2);
	});

	it("does not mistake its own slot stamps for unmarked markup when a panel updates", async () => {
		const warnings: string[] = [];
		const original = console.warn;
		console.warn = (...args: unknown[]) => void warnings.push(String(args[0]));

		try {
			const host = document.createElement("xtyle-accordion");
			const header = document.createElement("span");
			header.setAttribute("slot", "header");
			header.textContent = "One";
			const panel = document.createElement("div");
			panel.setAttribute("slot", "panel");
			panel.textContent = "First";
			host.append(header, panel);
			document.body.append(host);

			panel.textContent = "First, edited";
			await new Promise((resolve) => setTimeout(resolve, 0));

			expect(warnings.filter((line) => line.includes("none are marked"))).toEqual([]);
		} finally {
			console.warn = original;
		}
	});
});
