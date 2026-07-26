// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import "../src/elements/scheme-toggle.js";

afterEach(() => {
	document.body.innerHTML = "";
	document.documentElement.removeAttribute("data-scheme");
	document.documentElement.removeAttribute("data-effective-scheme");
});

function mount(attrs: Record<string, string | boolean> = {}): HTMLElement {
	const el = document.createElement("xtyle-scheme-toggle");
	for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value === true ? "" : String(value));
	document.body.appendChild(el);
	return el;
}

describe("xtyle-scheme-toggle", () => {
	it("composes an icon-only xtyle-button rather than a hand-rolled control", () => {
		const el = mount();
		const btn = el.querySelector("xtyle-button");
		expect(btn).not.toBeNull();
		expect(btn?.hasAttribute("icon-only")).toBe(true);
		expect(btn?.getAttribute("variant")).toBe("ghost");
	});

	it("carries a title tooltip on the composed button", () => {
		const btn = mount({ label: "Switch appearance" }).querySelector("xtyle-button");
		expect(btn?.getAttribute("title")).toBe("Switch appearance");
	});

	it("stays unresolved when nothing pinned it, so the stylesheet follows the document", () => {
		const el = mount();
		expect(el.classList.contains("xtyle-scheme-toggle--auto")).toBe(true);
		expect(el.classList.contains("xtyle-scheme-toggle--dark")).toBe(false);
		expect(el.classList.contains("xtyle-scheme-toggle--light")).toBe(false);
	});

	it("reads the scheme the page is rendering, not the one that was asked for", () => {
		document.documentElement.setAttribute("data-scheme", "dark");
		document.documentElement.setAttribute("data-effective-scheme", "light");
		expect((mount() as HTMLElement & { scheme: string }).scheme).toBe("light");
	});

	it("falls back to the requested scheme when nothing published an effective one", () => {
		document.documentElement.setAttribute("data-scheme", "light");
		expect((mount() as HTMLElement & { scheme: string }).scheme).toBe("light");
	});

	it("flips :root[data-scheme] and fires an event on click, both directions", () => {
		const el = mount();
		let fired: string | null = null;
		el.addEventListener("xtyle:scheme-change", (e) => {
			fired = (e as CustomEvent<{ scheme: string }>).detail.scheme;
		});
		el.querySelector<HTMLElement>("xtyle-button")?.click();
		expect(document.documentElement.getAttribute("data-scheme")).toBe("light");
		expect(fired).toBe("light");
		el.querySelector<HTMLElement>("xtyle-button")?.click();
		expect(document.documentElement.getAttribute("data-scheme")).toBeNull();
		expect(fired).toBe("dark");
	});

	it("publishes what is rendering when it runs standalone, so the glyph can follow it", () => {
		const el = mount();
		el.querySelector<HTMLElement>("xtyle-button")?.click();
		expect(document.documentElement.getAttribute("data-effective-scheme")).toBe("light");
		el.querySelector<HTMLElement>("xtyle-button")?.click();
		expect(document.documentElement.getAttribute("data-effective-scheme")).toBe("dark");
	});

	it("adds the reverse modifier so CSS shows the current mode", () => {
		expect(mount({ reverse: true }).classList.contains("xtyle-scheme-toggle--reverse")).toBe(true);
	});

	it("renders a named xtyle icon for a custom glyph", () => {
		const el = mount({ "light-icon": "palette" });
		const icon = el.querySelector(".xtyle-scheme-toggle__light xtyle-icon");
		expect(icon).not.toBeNull();
		expect(icon?.getAttribute("name")).toBe("palette");
	});

	it("sizes the glyph on its own, so a chrome-free control can still hold a big icon", () => {
		const el = mount({ "light-icon": "palette", "icon-size": "lg", variant: "link" });
		expect(el.querySelector(".xtyle-scheme-toggle__light xtyle-icon")?.getAttribute("size")).toBe("lg");
		expect(el.querySelector("xtyle-button")?.getAttribute("variant")).toBe("link");
	});

	it("passes variant and size through to the composed button", () => {
		const btn = mount({ variant: "subtle", size: "lg" }).querySelector("xtyle-button");
		expect(btn?.getAttribute("variant")).toBe("subtle");
		expect(btn?.getAttribute("size")).toBe("lg");
	});

	it("stays unresolved inside a scope, so a re-derive cannot leave the glyph stale", async () => {
		await import("../src/elements/theme-scope.js");
		const scope = document.createElement("xtyle-theme-scope");
		document.body.appendChild(scope);
		const el = document.createElement("xtyle-scheme-toggle");
		scope.appendChild(el);
		expect(el.classList.contains("xtyle-scheme-toggle--auto")).toBe(true);
		expect(el.classList.contains("xtyle-scheme-toggle--light")).toBe(false);
		expect(el.classList.contains("xtyle-scheme-toggle--dark")).toBe(false);
	});

	it("pins the scheme when the attribute is set, ignoring the document", () => {
		document.documentElement.setAttribute("data-scheme", "light");
		expect(mount({ scheme: "dark" }).classList.contains("xtyle-scheme-toggle--dark")).toBe(true);
	});
});
