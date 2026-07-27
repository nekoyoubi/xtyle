// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import "../src/elements/avatar.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { manifest, fragmentSources } from "../src/elements/fragments/avatar/source.generated.js";
import { avatarMarkup } from "../src/markup/avatar.js";

beforeAll(async () => {
	await loadFill(manifest, fragmentSources);
});

afterEach(() => {
	document.body.innerHTML = "";
});

function avatar(attrs: Record<string, string> = {}): HTMLElement {
	const el = document.createElement("xtyle-avatar");
	el.setAttribute("user-name", "Ada Lovelace");
	el.setAttribute("alt", "Ada Lovelace");
	for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
	document.body.appendChild(el);
	return el;
}

function shadow(el: HTMLElement, selector: string): HTMLElement | null {
	return el.shadowRoot?.querySelector<HTMLElement>(selector) ?? null;
}

describe("<xtyle-avatar> broken image reveals the fallback", () => {
	it("drops the image when its source fails, uncovering the initials", () => {
		const el = avatar({ src: "/missing.png" });

		const img = shadow(el, ".xtyle-avatar__image");
		expect(img).not.toBeNull();
		expect(shadow(el, ".xtyle-avatar__initials")?.textContent).toBe("AL");

		img?.dispatchEvent(new Event("error"));

		expect(shadow(el, ".xtyle-avatar__image")).toBeNull();
		expect(shadow(el, ".xtyle-avatar__initials")?.textContent).toBe("AL");
	});

	it("leaves a healthy image alone", () => {
		const el = avatar({ src: "/ada.png" });
		shadow(el, ".xtyle-avatar__image")?.dispatchEvent(new Event("load"));
		expect(shadow(el, ".xtyle-avatar__image")).not.toBeNull();
	});

	it("resurrects the image when a failed src is later corrected", () => {
		const el = avatar({ src: "/missing.png" });
		shadow(el, ".xtyle-avatar__image")?.dispatchEvent(new Event("error"));
		expect(shadow(el, ".xtyle-avatar__image")).toBeNull();

		el.setAttribute("src", "/ada.png");

		const img = shadow(el, ".xtyle-avatar__image");
		expect(img).not.toBeNull();
		expect(img?.getAttribute("src")).toBe("/ada.png");
	});

	it("still falls back for an avatar whose only fallback is a name, not slotted content", () => {
		const el = avatar({ src: "/missing.png", "user-name": "Grace Hopper" });
		shadow(el, ".xtyle-avatar__image")?.dispatchEvent(new Event("error"));
		expect(shadow(el, ".xtyle-avatar__image")).toBeNull();
		expect(shadow(el, ".xtyle-avatar__initials")?.textContent).toBe("GH");
	});
});

describe("avatar markup carries no inline event handler", () => {
	// INFO: the fragment sandbox strips every `on*` attribute before a fill reaches the DOM, so an
	// inline handler in the markup never fires
	it("emits no on* attribute from the SSR markup", () => {
		const html = avatarMarkup({ src: "/ada.png", alt: "Ada", userName: "Ada Lovelace" });
		expect(html).toContain('class="xtyle-avatar__image"');
		expect(html).not.toMatch(/\son[a-z]+=/i);
	});

	it("emits no on* attribute from the built fragment fill", () => {
		expect(fragmentSources["mod.js"]).not.toMatch(/\\?"\s*on[a-z]+=/i);
		expect(fragmentSources["mod.js"]).not.toContain("this.remove()");
	});
});
