// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import "../src/elements/checkbox.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { manifest, fragmentSources } from "../src/elements/fragments/checkbox/source.generated.js";

beforeAll(async () => {
	await loadFill(manifest, fragmentSources);
});

afterEach(() => {
	document.body.innerHTML = "";
});

function checkbox(attrs: Record<string, string>, text = ""): HTMLElement {
	const el = document.createElement("xtyle-checkbox");
	for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
	if (text) el.textContent = text;
	document.body.appendChild(el);
	return el;
}

const shown = (el: HTMLElement): string => (el.shadowRoot ?? el).querySelector(".xtyle-checkbox__label")?.textContent?.trim() ?? "";

describe("checkbox label", () => {
	it("shows `label` beside the box, like switch and segmented", () => {
		const el = checkbox({ label: "Nightly build" });
		expect(shown(el)).toBe("Nightly build");
		expect((el.shadowRoot ?? el).querySelector("input")?.getAttribute("aria-label")).toBe("Nightly build");
	});

	it("lets slotted text win over `label`, never showing both", () => {
		const el = checkbox({ label: "Ignored" }, "Slotted");
		expect(shown(el)).not.toContain("Ignored");
	});

	it("shows nothing for an aria-label alone", () => {
		const el = checkbox({ "aria-label": "Hidden name" });
		expect(shown(el)).toBe("");
	});

	it("drops `label` once a framework slots text after connect", async () => {
		const el = checkbox({ label: "Fallback" });
		el.append("Late text");
		await new Promise((r) => setTimeout(r, 0));
		expect((el.shadowRoot ?? el).querySelector(".xtyle-checkbox__label")?.innerHTML).not.toContain("Fallback");
	});
});
