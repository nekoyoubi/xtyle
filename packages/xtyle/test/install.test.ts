// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import { componentStyleSheet } from "../src/css/index.js";
import { install, installed, uninstall } from "../src/install.js";

afterEach(() => {
	while (installed()) uninstall();
	document.documentElement.removeAttribute("style");
});

function sheetCarries(id: string, needle: string): boolean {
	const mark = document.getElementById(id);
	if (!mark) return false;
	if ("adopted" in mark.dataset) {
		const sheet = componentStyleSheet();
		return !!sheet && document.adoptedStyleSheets.includes(sheet) && [...sheet.cssRules].some((r) => r.cssText.includes(needle));
	}
	return (mark.textContent ?? "").includes(needle);
}

describe("install", () => {
	it("puts the derived tokens on the document element, pinned ones as given", () => {
		install({ constraints: { "--accent": "#5d7fd4" } });
		const root = document.documentElement.style;
		expect(root.getPropertyValue("--accent").trim().toLowerCase()).toBe("#5d7fd4");
		expect(root.getPropertyValue("--fg-0").trim()).not.toBe("");
	});

	it("lands the component sheet in the document, where a light-DOM component finds its rules", () => {
		install();
		expect(sheetCarries("xtyle-components", ".xtyle-rating")).toBe(true);
	});

	it("lands the effect layer, which is what makes a data-fx spec live", () => {
		install();
		expect(sheetCarries("xtyle-effects", "data-fx")).toBe(true);
	});

	it("adds each sheet once however many times it is called", () => {
		install();
		install();
		expect(document.querySelectorAll("#xtyle-components")).toHaveLength(1);
		expect(document.querySelectorAll("#xtyle-effects")).toHaveLength(1);
	});

	it("keeps the sheets while another caller still holds a claim, and removes them with the last", () => {
		install();
		install();
		uninstall();
		expect(installed()).toBe(true);
		uninstall();
		expect(installed()).toBe(false);
		const sheet = componentStyleSheet();
		if (sheet && Array.isArray(document.adoptedStyleSheets)) expect(document.adoptedStyleSheets.includes(sheet)).toBe(false);
	});

	it("does nothing on an uninstall with nothing installed, so the next install stays removable", () => {
		uninstall();
		install();
		uninstall();
		expect(installed()).toBe(false);
	});

	it("leaves out a sheet a host manages itself, and answers for each one separately", () => {
		install({ components: false });
		expect(installed("components")).toBe(false);
		expect(installed("effects")).toBe(true);
		expect(installed()).toBe(true);
		expect(document.documentElement.style.getPropertyValue("--fg-0").trim()).not.toBe("");
	});

	it("scopes the tokens to a subtree when given a target", () => {
		const scope = document.createElement("div");
		document.body.append(scope);
		install({ target: scope, constraints: { "--accent": "#5d7fd4" } });
		expect(scope.style.getPropertyValue("--accent").trim().toLowerCase()).toBe("#5d7fd4");
		expect(document.documentElement.style.getPropertyValue("--accent").trim()).toBe("");
		scope.remove();
	});

	it("answers null without a document rather than throwing", () => {
		const saved = globalThis.document;
		delete (globalThis as { document?: unknown }).document;
		try {
			expect(install()).toBeNull();
			expect(installed()).toBe(false);
		} finally {
			globalThis.document = saved;
		}
	});
});
