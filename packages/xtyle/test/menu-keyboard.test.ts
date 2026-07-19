// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import "../src/elements/menu.js";
import type { MenuItem, MenuOpenAtOptions } from "../src/elements/menu.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { manifest, fragmentSources } from "../src/elements/fragments/menu/source.generated.js";

type MenuEl = HTMLElement & { items: MenuItem[]; openAt(x: number, y: number, opts?: MenuOpenAtOptions): void };

const OPEN_FLAG = "data-test-popover-open";

// happy-dom ships no Popover API; stand one in so the menu's open/focus wiring runs (mirrors menu.element.test.ts).
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
});

const actions: MenuItem[] = [
	{ label: "Cut", value: "cut" },
	{ label: "Copy", value: "copy" },
	{ label: "Paste", value: "paste", disabled: true },
	{ separator: true },
	{ label: "Delete", value: "delete" },
];

function make(): MenuEl {
	const el = document.createElement("xtyle-menu") as MenuEl;
	el.setAttribute("context", "");
	el.items = actions;
	document.body.appendChild(el);
	return el;
}
function root(el: MenuEl): ShadowRoot {
	return el.shadowRoot as ShadowRoot;
}
function item(el: MenuEl, value: string): HTMLElement {
	return root(el).querySelector(`[role="menuitem"][data-value="${value}"]`) as HTMLElement;
}
function focused(el: MenuEl): string | null {
	return (root(el).activeElement as HTMLElement | null)?.getAttribute("data-value") ?? null;
}
function press(el: MenuEl, value: string, key: string): void {
	item(el, value)?.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, composed: true, cancelable: true }));
}

describe("<xtyle-menu> keyboard roving (through the shared core)", () => {
	it("arrows move focus across enabled items, skipping disabled and wrapping", () => {
		const el = make();
		el.openAt(10, 10);
		expect(focused(el)).toBe("cut");
		press(el, "cut", "ArrowDown");
		expect(focused(el)).toBe("copy");
		press(el, "copy", "ArrowDown"); // skips the disabled Paste
		expect(focused(el)).toBe("delete");
		press(el, "delete", "ArrowDown"); // wraps to the top
		expect(focused(el)).toBe("cut");
		press(el, "cut", "ArrowUp"); // wraps to the bottom
		expect(focused(el)).toBe("delete");
	});

	it("Home and End jump to the first and last enabled items", () => {
		const el = make();
		el.openAt(10, 10);
		press(el, "cut", "End");
		expect(focused(el)).toBe("delete");
		press(el, "delete", "Home");
		expect(focused(el)).toBe("cut");
	});
});
