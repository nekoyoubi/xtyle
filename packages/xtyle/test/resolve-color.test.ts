// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import { resolveColor } from "../src/dom.js";
import { formatColor } from "../src/convert.js";

afterEach(() => {
	document.body.innerHTML = "";
	document.documentElement.removeAttribute("style");
});

describe("resolveColor", () => {
	it("resolves a plain color without touching the cascade", () => {
		const color = resolveColor("#be9f00")!;
		expect(formatColor(color, "hex")).toBe("#be9f00");
	});

	it("returns null for a value that is not a color", () => {
		expect(resolveColor("definitely not a color")).toBeNull();
		expect(resolveColor("")).toBeNull();
	});

	it("reads a token off an element and resolves it", () => {
		const el = document.createElement("div");
		el.style.setProperty("--shade", "#336699");
		document.body.appendChild(el);
		expect(formatColor(resolveColor(el, "--shade")!, "hex")).toBe("#336699");
	});

	it("returns null for a property the element does not carry", () => {
		const el = document.createElement("div");
		document.body.appendChild(el);
		expect(resolveColor(el, "--missing")).toBeNull();
	});

	it("leaves no probe behind in the context it resolved against", () => {
		const scope = document.createElement("section");
		scope.style.setProperty("--shade", "#336699");
		document.body.appendChild(scope);
		resolveColor("var(--shade)", scope);
		expect(scope.childElementCount).toBe(0);
	});
});
