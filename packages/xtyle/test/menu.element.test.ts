// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
// side effect: defines the <xtyle-menu> custom element on the happy-dom registry
import "../src/elements/menu.js";
import type { MenuItem, MenuOpenAtOptions } from "../src/elements/menu.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { renderFragmentLight } from "../src/elements/fragment-ssr.js";
import { manifest, fragmentSources } from "../src/elements/fragments/menu/source.generated.js";

type MenuEl = HTMLElement & {
	items: MenuItem[];
	open: boolean;
	context: boolean;
	openAt(x: number, y: number, opts?: MenuOpenAtOptions): void;
};

const OPEN_FLAG = "data-test-popover-open";

/** happy-dom 15 ships no Popover API: stand one in that tracks state, answers `:popover-open`,
 * and fires the async-in-the-browser `toggle` event so the element's own wiring is exercised. */
beforeAll(async () => {
	const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
	const nativeMatches = HTMLElement.prototype.matches;
	proto.matches = function matches(this: HTMLElement, selector: string): boolean {
		if (selector === ":popover-open") return this.hasAttribute(OPEN_FLAG);
		return nativeMatches.call(this, selector);
	};
	const toggle = (el: HTMLElement, newState: "open" | "closed"): void => {
		el.dispatchEvent(Object.assign(new Event("toggle"), { newState }));
	};
	proto.showPopover = function showPopover(this: HTMLElement): void {
		if (this.hasAttribute(OPEN_FLAG)) return;
		this.setAttribute(OPEN_FLAG, "");
		toggle(this, "open");
	};
	proto.hidePopover = function hidePopover(this: HTMLElement): void {
		if (!this.hasAttribute(OPEN_FLAG)) return;
		this.removeAttribute(OPEN_FLAG);
		toggle(this, "closed");
	};
	await loadFill(manifest, fragmentSources);
});

afterEach(() => {
	document.body.innerHTML = "";
	vi.restoreAllMocks();
});

const actions: MenuItem[] = [
	{ label: "Cut", value: "cut", hint: "Ctrl+X" },
	{ label: "Copy", value: "copy", hint: "Ctrl+C" },
	{ label: "Paste", value: "paste", disabled: true },
	{ separator: true },
	{ label: "Delete", value: "delete", intent: "danger" },
];

function make(attrs: Record<string, string> = {}): MenuEl {
	const el = document.createElement("xtyle-menu") as MenuEl;
	for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
	el.items = actions;
	document.body.appendChild(el);
	return el;
}

function root(el: MenuEl): ShadowRoot {
	return el.shadowRoot as ShadowRoot;
}

function popup(el: MenuEl): HTMLElement {
	return root(el).querySelector(".xtyle-menu__popup") as HTMLElement;
}

function trigger(el: MenuEl): HTMLElement {
	return root(el).querySelector(".xtyle-menu__trigger") as HTMLElement;
}

function isShown(el: MenuEl): boolean {
	return popup(el).hasAttribute(OPEN_FLAG);
}

function item(el: MenuEl, value: string): HTMLElement {
	return root(el).querySelector(`[role="menuitem"][data-value="${value}"]`) as HTMLElement;
}

/** The trigger's rect: happy-dom lays nothing out, so a menu placed against it needs a real one. */
function stubTriggerRect(el: MenuEl, rect: { top: number; left: number; width: number; height: number }): void {
	trigger(el).getBoundingClientRect = () =>
		({ ...rect, right: rect.left + rect.width, bottom: rect.top + rect.height, x: rect.left, y: rect.top }) as DOMRect;
}

describe("<xtyle-menu context> chrome", () => {
	it("hides the trigger and marks the root, with no trigger-label warning", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		const el = make({ context: "" });
		expect(trigger(el).hasAttribute("hidden")).toBe(true);
		expect(root(el).querySelector("[data-root]")?.getAttribute("data-context")).toBe("true");
		expect(warn).not.toHaveBeenCalled();
	});

	it("renders the trigger for a plain (trigger-anchored) menu", () => {
		const el = make({ label: "Edit" });
		expect(trigger(el).hasAttribute("hidden")).toBe(false);
		expect(root(el).querySelector("[data-root]")?.hasAttribute("data-context")).toBe(false);
	});

	it("drops the hidden trigger back in when `context` is turned off", () => {
		const el = make({ context: "", label: "Edit" });
		el.context = false;
		expect(trigger(el).hasAttribute("hidden")).toBe(false);
		expect(root(el).querySelector("[data-root]")?.hasAttribute("data-context")).toBe(false);
	});

	it("keeps the same item model: the actions render identically to a trigger menu", () => {
		const el = make({ context: "" });
		const values = [...root(el).querySelectorAll('[role="menuitem"]')].map((n) => n.getAttribute("data-value"));
		expect(values).toEqual(["cut", "copy", "paste", "delete"]);
		expect(item(el, "paste").getAttribute("aria-disabled")).toBe("true");
		expect(item(el, "delete").getAttribute("data-intent")).toBe("danger");
	});
});

describe("<xtyle-menu>.openAt", () => {
	it("opens the popup at the cursor point, synchronously — no first-frame flash at 0,0", () => {
		const el = make({ context: "" });
		el.openAt(300, 220);
		expect(el.open).toBe(true);
		expect(isShown(el)).toBe(true);
		// zero-size cursor anchor: bottom of the point + the default 4px gap, leading edge at the point
		expect(popup(el).style.left).toBe("300px");
		expect(popup(el).style.top).toBe("224px");
	});

	it("right-aligns at the cursor near the right edge instead of sliding left", () => {
		const el = make({ context: "" });
		el.openAt(window.innerWidth - 24, 100);
		// content falls back to the 192px min-width in a layout-less DOM
		expect(popup(el).style.left).toBe(`${window.innerWidth - 24 - 192}px`);
	});

	it("focuses the first enabled action, and the last on `focus: \"last\"`", () => {
		const el = make({ context: "" });
		el.openAt(10, 10);
		expect(root(el).activeElement).toBe(item(el, "cut"));
		el.openAt(10, 10, { focus: "last" });
		expect(root(el).activeElement).toBe(item(el, "delete"));
	});

	it("leaves focus alone on `focus: \"none\"`", () => {
		const el = make({ context: "" });
		el.openAt(10, 10, { focus: "none" });
		expect(root(el).activeElement).toBeNull();
	});

	it("honors an explicit placement and align", () => {
		const el = make({ context: "" });
		el.openAt(500, 400, { placement: "top", align: "end" });
		expect(popup(el).style.left).toBe(`${500 - 192}px`);
		expect(popup(el).style.top).toBe(`${400 - 4}px`);
	});

	it("fires the same select event and closes", () => {
		const el = make({ context: "" });
		const seen: unknown[] = [];
		el.addEventListener("select", (event) => seen.push((event as CustomEvent).detail));
		el.openAt(120, 90);
		item(el, "copy").dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, cancelable: true }));
		expect(seen).toEqual([{ value: "copy", label: "Copy", index: 1 }]);
		expect(el.open).toBe(false);
		expect(isShown(el)).toBe(false);
	});

	it("returns focus to wherever it was when the menu opened", () => {
		const host = document.createElement("button");
		document.body.appendChild(host);
		host.focus();
		const el = make({ context: "" });
		el.openAt(50, 50);
		item(el, "cut").dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, composed: true }));
		expect(el.open).toBe(false);
		expect(document.activeElement).toBe(host);
	});

	it("hands focus back rather than stranding it on the body when closed programmatically", () => {
		const host = document.createElement("button");
		document.body.appendChild(host);
		host.focus();
		const el = make({ context: "" });
		el.openAt(50, 50);
		expect(root(el).activeElement).toBe(item(el, "cut"));

		el.open = false;

		expect(document.activeElement).toBe(host);
	});

	it("repositions on a second openAt while still open", () => {
		const el = make({ context: "" });
		el.openAt(100, 100);
		el.openAt(240, 300);
		expect(popup(el).style.left).toBe("240px");
		expect(popup(el).style.top).toBe("304px");
	});

	it("drops the cursor anchor on close, so the trigger path places against the trigger again", () => {
		const el = make({ label: "Edit" });
		stubTriggerRect(el, { top: 40, left: 60, width: 80, height: 30 });
		el.openAt(400, 400);
		expect(popup(el).style.left).toBe("400px");

		el.open = false;
		trigger(el).dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, composed: true, cancelable: true }));

		expect(el.open).toBe(true);
		expect(popup(el).style.left).toBe("60px");
		expect(popup(el).style.top).toBe("74px");
	});
});

describe("<xtyle-menu context> SSR (the pre-hydration paint)", () => {
	const ssr = (context: boolean): Promise<string> =>
		renderFragmentLight("menu", { items: actions, label: "Edit", open: false, context, popupId: "p" });

	it("ships the trigger already hidden and the root marked, so no trigger flashes before hydration", async () => {
		const html = await ssr(true);
		expect(html).toContain('data-context="true"');
		expect(html).toMatch(/<button[^>]*\bhidden="hidden"/);
	});

	it("leaves a trigger-anchored menu's markup untouched", async () => {
		const html = await ssr(false);
		expect(html).not.toContain("data-context");
		expect(html).not.toMatch(/<button[^>]*\bhidden="hidden"/);
	});
});

describe("<xtyle-menu> trigger anchoring (unchanged)", () => {
	it("still opens under its trigger, leading edges aligned", () => {
		const el = make({ label: "File" });
		stubTriggerRect(el, { top: 200, left: 120, width: 90, height: 32 });
		trigger(el).dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, composed: true, cancelable: true }));
		expect(el.open).toBe(true);
		expect(popup(el).style.left).toBe("120px");
		expect(popup(el).style.top).toBe("236px");
		expect(root(el).activeElement).toBe(item(el, "cut"));
	});
});
