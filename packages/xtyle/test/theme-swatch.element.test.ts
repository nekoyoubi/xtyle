// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import "../src/elements/theme-swatch.js";

afterEach(() => {
	document.body.innerHTML = "";
});

/** `styleMode: "auto"` gives a bare-created row a shadow root, so queries go through the render root. */
function root(el: HTMLElement): ParentNode {
	return el.shadowRoot ?? el;
}

function mount(attrs: Record<string, string> = {}): HTMLElement {
	const el = document.createElement("xtyle-theme-swatch");
	for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
	document.body.appendChild(el);
	return el;
}

/**
 * The row derives through a dynamic import, so a test waits for the settled event. The bound is
 * generous on purpose: settling costs a sandboxed derive, which measures ~5.8s on an idle machine
 * against the 8s this used to allow, so ordinary full-suite contention tipped it rather than any
 * failure. These assertions ask whether the row composes what it claims, never how fast; a genuine
 * hang still fails.
 */
async function settled(el: HTMLElement): Promise<CustomEvent> {
	return await new Promise((resolve, reject) => {
		const timer = setTimeout(() => reject(new Error("theme swatch never settled")), 30_000);
		el.addEventListener(
			"xtyle:theme-swatch",
			(event) => {
				clearTimeout(timer);
				resolve(event as CustomEvent);
			},
			{ once: true },
		);
	});
}

function chips(el: HTMLElement): HTMLElement[] {
	return [...root(el).querySelectorAll<HTMLElement>("xtyle-swatch")];
}

describe("xtyle-theme-swatch", () => {
	it("composes xtyle-swatch rather than hand-rolling a chip", async () => {
		const el = mount();
		await settled(el);
		expect(chips(el).length).toBeGreaterThan(0);
		expect(root(el).querySelector(".xtyle-theme-swatch__row")).not.toBeNull();
	});

	it("reads the colors off the derivation instead of a fixed palette", async () => {
		const plain = mount();
		const seeded = mount({ constraints: '{"--accent":"#7c5cff"}' });
		await Promise.all([settled(plain), settled(seeded)]);
		const accentOf = (el: HTMLElement) => chips(el)[0]?.getAttribute("color");
		expect(accentOf(seeded)).toBe("#7c5cff");
		expect(accentOf(plain)).not.toBe(accentOf(seeded));
	});

	it("paints the palette without applying it to the page", async () => {
		const el = mount();
		await settled(el);
		expect(document.documentElement.style.getPropertyValue("--bg-0")).toBe("");
		expect(el.style.getPropertyValue("--bg-0")).toBe("");
	});

	it("shows the tokens asked for, in order", async () => {
		const el = mount({ tokens: "--success,--warn,--danger" });
		await settled(el);
		expect(chips(el).map((c) => c.getAttribute("label"))).toEqual(["success", "warn", "danger"]);
	});

	it("accepts token names with or without the leading dashes", async () => {
		const el = mount({ tokens: "accent, --accent-2" });
		await settled(el);
		expect(chips(el).map((c) => c.getAttribute("label"))).toEqual(["accent", "accent 2"]);
	});

	it("skips a token the algorithm never produced rather than drawing an empty chip", async () => {
		const el = mount({ tokens: "--accent,--not-a-real-token" });
		await settled(el);
		expect(chips(el)).toHaveLength(1);
		expect(chips(el)[0]?.getAttribute("label")).toBe("accent");
	});

	it("drops the labels when asked, keeping the chips", async () => {
		const el = mount({ labels: "false", tokens: "--accent,--accent-2" });
		await settled(el);
		expect(chips(el)).toHaveLength(2);
		expect(chips(el).every((c) => !c.hasAttribute("label"))).toBe(true);
	});

	it("passes size and details through to the composed chips", async () => {
		const el = mount({ size: "lg", details: "", tokens: "--accent" });
		await settled(el);
		expect(chips(el)[0]?.getAttribute("size")).toBe("lg");
		expect(chips(el)[0]?.hasAttribute("details")).toBe(true);
	});

	it("re-derives inverted for a pinned scheme", async () => {
		const dark = mount({ tokens: "--bg-0", scheme: "dark" });
		const light = mount({ tokens: "--bg-0", scheme: "light" });
		await Promise.all([settled(dark), settled(light)]);
		expect(chips(dark)[0]?.getAttribute("color")).not.toBe(chips(light)[0]?.getAttribute("color"));
	});

	it("says why instead of rendering an empty row when the invocation fails", async () => {
		const el = mount({ algorithm: "no-such-algorithm" });
		const event = await settled(el);
		expect(event.detail.error).toBeTruthy();
		expect(root(el).querySelector(".xtyle-theme-swatch__error")?.textContent).toBeTruthy();
	});
});
