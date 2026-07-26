// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import "../src/elements/theme-card.js";

afterEach(() => {
	document.body.innerHTML = "";
});

/** `styleMode: "auto"` gives a bare-created card a shadow root, so queries go through the render root. */
function root(el: HTMLElement): ParentNode {
	return el.shadowRoot ?? el;
}

function mount(attrs: Record<string, string> = {}): HTMLElement {
	const el = document.createElement("xtyle-theme-card");
	for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
	document.body.appendChild(el);
	return el;
}

/** The card derives through a dynamic import, so a test waits for the settled event. */
async function settled(el: HTMLElement): Promise<CustomEvent> {
	return await new Promise((resolve, reject) => {
		const timer = setTimeout(() => reject(new Error("theme card never settled")), 8000);
		el.addEventListener(
			"xtyle:theme-card",
			(event) => {
				clearTimeout(timer);
				resolve(event as CustomEvent);
			},
			{ once: true },
		);
	});
}

describe("xtyle-theme-card", () => {
	it("paints the theme instead of applying it to the page", async () => {
		const el = mount({ name: "Default" });
		await settled(el);
		expect(root(el).querySelector("svg")).not.toBeNull();
		expect(document.documentElement.style.getPropertyValue("--bg-0")).toBe("");
		expect(el.style.getPropertyValue("--bg-0")).toBe("");
	});

	it("draws the fake from the derived register, not a fixed palette", async () => {
		const plain = mount({ name: "Plain" });
		const seeded = mount({ name: "Seeded", constraints: '{"--accent":"#7c5cff"}' });
		await Promise.all([settled(plain), settled(seeded)]);
		expect(root(plain).querySelector("svg")?.innerHTML).not.toBe(root(seeded).querySelector("svg")?.innerHTML);
	});

	it("shows the theme's name and what it derived", async () => {
		const el = mount({ name: "Quiet", algorithm: "xtyle-quiet" });
		await settled(el);
		expect(root(el).querySelector(".xtyle-theme-card__name")?.textContent).toBe("Quiet");
		expect(root(el).querySelector(".xtyle-theme-card__meta")?.textContent).toContain("xtyle-quiet");
	});

	it("re-derives inverted for a pinned scheme", async () => {
		const el = mount({ name: "Light", scheme: "light" });
		const event = await settled(el);
		expect(event.detail.scheme).toBe("light");
	});

	it("is a labelled group when static and a real button when interactive", async () => {
		const still = mount({ name: "Still" });
		await settled(still);
		expect(root(still).querySelector("button")).toBeNull();
		expect(root(still).querySelector('[part="card"]')?.getAttribute("role")).toBe("group");

		const live = mount({ name: "Live", interactive: "" });
		await settled(live);
		const button = root(live).querySelector("button");
		expect(button).not.toBeNull();
		expect(button?.getAttribute("aria-pressed")).toBe("false");
		expect(button?.getAttribute("aria-label")).toContain("Live");
	});

	it("emits select carrying the invocation it previewed", async () => {
		const el = mount({ name: "Loud", algorithm: "xtyle-loud", interactive: "" });
		await settled(el);
		let detail: Record<string, unknown> | null = null;
		el.addEventListener("select", (event) => {
			detail = (event as CustomEvent<Record<string, unknown>>).detail;
		});
		root(el).querySelector<HTMLElement>("button")?.click();
		expect(detail).toMatchObject({ name: "Loud", algorithm: "xtyle-loud" });
	});

	it("reflects the selected state onto the button", async () => {
		const el = mount({ name: "Pick", interactive: "", selected: "" });
		await settled(el);
		expect(root(el).querySelector("button")?.getAttribute("aria-pressed")).toBe("true");
	});

	it("keeps the fake decorative so the name carries the meaning", async () => {
		const el = mount({ name: "Default" });
		await settled(el);
		expect(root(el).querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
	});

	it("shows the failure on the card rather than an empty frame", async () => {
		const el = mount({ name: "Broken", algorithm: "no-such-algorithm" });
		const event = await settled(el);
		expect(event.detail.error).toBeTruthy();
		expect(root(el).querySelector(".xtyle-theme-card__error")?.textContent).toBeTruthy();
	});
});
