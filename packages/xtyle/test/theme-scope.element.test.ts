// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import "../src/elements/theme-scope.js";
import "../src/elements/scheme-toggle.js";

afterEach(() => {
	document.body.innerHTML = "";
	document.documentElement.removeAttribute("data-scheme");
	document.documentElement.style.cssText = "";
});

function mount(attrs: Record<string, string> = {}, children = ""): HTMLElement {
	const el = document.createElement("xtyle-theme-scope");
	for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
	el.innerHTML = children;
	document.body.appendChild(el);
	return el;
}

/** The scope derives through a dynamic import, so a test waits for the applied register rather than
 * reading straight after mount. */
async function settled(el: HTMLElement): Promise<CustomEvent> {
	return await new Promise((resolve, reject) => {
		const timer = setTimeout(() => reject(new Error("theme scope never settled")), 30000);
		el.addEventListener(
			"xtyle:theme-scope",
			(event) => {
				clearTimeout(timer);
				resolve(event as CustomEvent);
			},
			{ once: true },
		);
	});
}

describe("xtyle-theme-scope", () => {
	it("leaves the author's children exactly as written", async () => {
		const el = mount({}, `<p id="kept">Content</p>`);
		await settled(el);
		expect(el.querySelector("#kept")?.textContent).toBe("Content");
		expect(el.children).toHaveLength(1);
	});

	it("applies the derived register to itself, not the document, by default", async () => {
		const el = mount();
		await settled(el);
		expect(el.style.getPropertyValue("--bg-0")).not.toBe("");
		expect(document.documentElement.style.getPropertyValue("--bg-0")).toBe("");
	});

	it("drives :root when asked to", async () => {
		const el = mount({ target: "root" });
		await settled(el);
		expect(document.documentElement.style.getPropertyValue("--bg-0")).not.toBe("");
		expect(el.style.getPropertyValue("--bg-0")).toBe("");
	});

	it("publishes the scheme the derivation actually produced", async () => {
		const el = mount();
		const event = await settled(el);
		expect(["light", "dark"]).toContain(event.detail.scheme);
		expect(el.getAttribute("data-effective-scheme")).toBe(event.detail.scheme);
	});

	it("honors a pinned scheme by re-deriving inverted", async () => {
		const el = mount({ scheme: "light" });
		const event = await settled(el);
		expect(event.detail.scheme).toBe("light");
		expect(el.scheme).toBe("light");
	});

	it("re-derives to the other mode when toggleScheme flips it", async () => {
		const el = mount({ scheme: "dark" });
		await settled(el);
		const next = settled(el);
		(el as HTMLElement & { toggleScheme(): void }).toggleScheme();
		expect((await next).detail.scheme).toBe("light");
	});

	it("lets a nested scheme toggle drive the scope instead of the document", async () => {
		const el = mount({ scheme: "dark" }, `<xtyle-scheme-toggle></xtyle-scheme-toggle>`);
		await settled(el);
		const next = settled(el);
		el.querySelector<HTMLElement>("xtyle-button")?.click();
		expect((await next).detail.scheme).toBe("light");
		expect(document.documentElement.getAttribute("data-scheme")).toBeNull();
	});

	it("reports the failure instead of applying a half-derived theme", async () => {
		const el = mount({ algorithm: "no-such-algorithm" });
		const event = await settled(el);
		expect(event.detail.error).toBeTruthy();
		expect(el.hasAttribute("data-effective-scheme")).toBe(false);
	});

	it("releases the tokens it applied when it leaves the document", async () => {
		const el = mount({ target: "root" });
		await settled(el);
		el.remove();
		expect(document.documentElement.style.getPropertyValue("--bg-0")).toBe("");
	});
});
