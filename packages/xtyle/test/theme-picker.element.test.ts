// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import "../src/elements/theme-picker.js";

afterEach(() => {
	document.body.innerHTML = "";
});

/** `styleMode: "auto"` gives a bare-created picker a shadow root, so queries go through it. */
function root(el: HTMLElement): ParentNode {
	return el.shadowRoot ?? el;
}

const THEMES = [
	{ name: "Default", algorithm: "xtyle-default" },
	{ name: "Quiet", algorithm: "xtyle-quiet" },
	{ name: "Grape", constraints: { "--accent": "#7c5cff" } },
];

function mount(attrs: Record<string, string> = {}, themes: unknown[] | null = THEMES): HTMLElement {
	const el = document.createElement("xtyle-theme-picker");
	if (themes !== null) el.setAttribute("themes", JSON.stringify(themes));
	for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
	document.body.appendChild(el);
	return el;
}

/** The fill renders through the sandbox, so painting is async: wait for the grid (or the empty
 * note) before asserting. */
async function painted(el: HTMLElement): Promise<HTMLElement> {
	for (let i = 0; i < 240; i++) {
		if (root(el).querySelector(".xtyle-theme-picker__grid, .xtyle-theme-picker__empty")) return el;
		await new Promise((r) => setTimeout(r, 25));
	}
	throw new Error("theme picker never painted");
}

function cards(el: HTMLElement): HTMLElement[] {
	return [...root(el).querySelectorAll<HTMLElement>("xtyle-theme-card")];
}

describe("xtyle-theme-picker", () => {
	it("offers one card per theme, composing the card rather than a bespoke tile", async () => {
		const el = mount();
		await painted(el);
		expect(cards(el)).toHaveLength(3);
		expect(cards(el).every((c) => c.hasAttribute("interactive"))).toBe(true);
	});

	it("hands each card its own invocation", async () => {
		const el = mount();
		await painted(el);
		const [first, , third] = cards(el);
		expect(first?.getAttribute("algorithm")).toBe("xtyle-default");
		expect(first?.getAttribute("name")).toBe("Default");
		expect(third?.getAttribute("constraints")).toBe('{"--accent":"#7c5cff"}');
	});

	it("marks the current choice and only that one", async () => {
		const el = mount({ value: "Quiet" });
		await painted(el);
		expect(cards(el).map((c) => c.hasAttribute("selected"))).toEqual([false, true, false]);
	});

	it("adopts a card's select as its value and reports the whole invocation", async () => {
		const el = mount({ value: "Default" });
		await painted(el);
		let detail: { value?: string; theme?: Record<string, unknown> | null } | null = null;
		el.addEventListener("xtyle:theme-pick", (event) => {
			detail = (event as CustomEvent).detail;
		});
		cards(el)[2]?.dispatchEvent(new CustomEvent("select", { bubbles: true, composed: true }));
		expect(el.getAttribute("value")).toBe("Grape");
		expect(detail?.value).toBe("Grape");
		expect(detail?.theme).toMatchObject({ name: "Grape", constraints: { "--accent": "#7c5cff" } });
	});

	it("patches the choice instead of rebuilding, so the activated button survives", async () => {
		const el = mount({ value: "Default" });
		await painted(el);
		const before = cards(el);
		el.setAttribute("value", "Grape");
		for (let i = 0; i < 120 && !before[2]?.hasAttribute("selected"); i++) {
			await new Promise((r) => setTimeout(r, 25));
		}
		const after = cards(el);
		expect(after[0]).toBe(before[0]);
		expect(after[2]).toBe(before[2]);
		expect(after.map((c) => c.hasAttribute("selected"))).toEqual([false, false, true]);
	});

	it("does not re-announce a choice that is already current", async () => {
		const el = mount({ value: "Quiet" });
		await painted(el);
		let fired = 0;
		el.addEventListener("xtyle:theme-pick", () => { fired += 1; });
		cards(el)[1]?.dispatchEvent(new CustomEvent("select", { bubbles: true, composed: true }));
		expect(fired).toBe(0);
	});

	it("keeps the card's select from escaping as the picker's own event", async () => {
		const el = mount();
		await painted(el);
		let escaped = 0;
		document.addEventListener("select", () => { escaped += 1; }, { once: true });
		cards(el)[0]?.dispatchEvent(new CustomEvent("select", { bubbles: true, composed: true }));
		expect(escaped).toBe(0);
	});

	it("exposes the chosen invocation as a property", async () => {
		const el = mount({ value: "Grape" }) as HTMLElement & { selected: Record<string, unknown> | null };
		await painted(el);
		expect(el.selected).toMatchObject({ name: "Grape" });
	});

	it("adds no cursor of its own, leaving the cards as the focus stops", async () => {
		const el = mount();
		await painted(el);
		expect(root(el).querySelector("[tabindex]")).toBeNull();
		expect(root(el).querySelector('[role="group"]')).not.toBeNull();
	});

	it("pairs each card with a swatch row when asked", async () => {
		const el = mount({ swatches: "" });
		await painted(el);
		expect(root(el).querySelectorAll("xtyle-theme-swatch")).toHaveLength(3);
	});

	it("puts the same gallery behind a popover under the menu layout", async () => {
		const el = mount({ layout: "menu", value: "Quiet" });
		await painted(el);
		const popover = root(el).querySelector("xtyle-popover");
		expect(popover).not.toBeNull();
		expect(popover?.getAttribute("panel-role")).toBe("menu");
		expect(cards(el)).toHaveLength(3);
		expect(root(el).querySelector('[part="trigger-label"]')?.textContent).toBe("Quiet");
	});

	it("keeps the gallery bare by default, with no trigger", async () => {
		const el = mount();
		await painted(el);
		expect(root(el).querySelector("xtyle-popover")).toBeNull();
		expect(root(el).querySelector('[part="trigger-label"]')).toBeNull();
	});

	it("says so instead of rendering an empty grid", async () => {
		const el = mount({ empty: "Nothing saved yet." }, []);
		await painted(el);
		expect(cards(el)).toHaveLength(0);
		expect(root(el).querySelector(".xtyle-theme-picker__empty")?.textContent).toBe("Nothing saved yet.");
	});

	it("falls back to the algorithm as the key when a theme has no name", async () => {
		const el = mount({}, [{ algorithm: "xtyle-loud" }]);
		await painted(el);
		cards(el)[0]?.dispatchEvent(new CustomEvent("select", { bubbles: true, composed: true }));
		expect(el.getAttribute("value")).toBe("xtyle-loud");
	});
});
