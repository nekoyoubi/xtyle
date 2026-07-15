// @vitest-environment happy-dom
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
// side effect: defines <xtyle-split-button> (and, through it, <xtyle-menu>) on the happy-dom registry
import "../src/elements/split-button.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { renderFragmentLight } from "../src/elements/fragment-ssr.js";
import { manifest, fragmentSources } from "../src/elements/fragments/split-button/source.generated.js";
import { manifest as menuManifest, fragmentSources as menuSources } from "../src/elements/fragments/menu/source.generated.js";
import type { MenuItem } from "../src/markup/index.js";

type SplitEl = HTMLElement & {
	items: MenuItem[];
	open: boolean;
	disabled: boolean;
	loading: boolean;
	showMenu(focus?: "first" | "last"): void;
	closeMenu(): void;
};
type MenuEl = HTMLElement & { open: boolean; items: MenuItem[] };

const ACTIONS: MenuItem[] = [
	{ label: "Save and close", value: "save-close" },
	{ label: "Save as draft", value: "save-draft", hint: "Ctrl+D" },
	{ separator: true },
	{ label: "Discard changes", value: "discard", intent: "danger" },
];

// both fills are pulled in before the first element paints — the built-in fill loads lazily on first
// render, and the group's own chrome and the composed menu's each come from one
beforeAll(async () => {
	await loadFill(manifest, fragmentSources);
	await loadFill(menuManifest, menuSources);
});

/** happy-dom ships no Popover API, so the menu's popup is stood in down to the half the elements read:
 * `:popover-open` and the `toggle` event. */
beforeEach(() => {
	const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
	const nativeMatches = HTMLElement.prototype.matches;
	proto.matches = function matches(this: HTMLElement, selector: string): boolean {
		if (selector === ":popover-open") return this.hasAttribute("data-test-open");
		return nativeMatches.call(this, selector);
	};
	proto.showPopover = function showPopover(this: HTMLElement): void {
		this.setAttribute("data-test-open", "");
		this.dispatchEvent(Object.assign(new Event("toggle"), { newState: "open" }));
	};
	proto.hidePopover = function hidePopover(this: HTMLElement): void {
		this.removeAttribute("data-test-open");
		this.dispatchEvent(Object.assign(new Event("toggle"), { newState: "closed" }));
	};
});

afterEach(() => {
	document.body.innerHTML = "";
});

function make(attrs: Record<string, string> = {}, items: MenuItem[] | null = ACTIONS): SplitEl {
	const el = document.createElement("xtyle-split-button") as SplitEl;
	for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
	el.textContent = "Save";
	document.body.appendChild(el);
	if (items) el.items = items;
	return el;
}

function root(el: SplitEl): ShadowRoot {
	return el.shadowRoot as ShadowRoot;
}

function primary(el: SplitEl): HTMLButtonElement {
	return root(el).querySelector("[data-primary]") as HTMLButtonElement;
}

function toggle(el: SplitEl): HTMLButtonElement {
	return root(el).querySelector("[data-toggle]") as HTMLButtonElement;
}

function menu(el: SplitEl): MenuEl {
	return root(el).querySelector("[data-dropdown]") as MenuEl;
}

function menuRows(el: SplitEl): HTMLElement[] {
	return Array.from(menu(el).shadowRoot?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
}

function key(target: HTMLElement, name: string): KeyboardEvent {
	const event = new KeyboardEvent("keydown", { key: name, bubbles: true, composed: true, cancelable: true });
	target.dispatchEvent(event);
	return event;
}

describe("<xtyle-split-button> the group", () => {
	it("renders two real buttons: the default action and a menu button", () => {
		const el = make();
		expect(primary(el).tagName).toBe("BUTTON");
		expect(toggle(el).tagName).toBe("BUTTON");
		expect(root(el).querySelector("[data-root]")?.getAttribute("role")).toBe("group");
		expect(toggle(el).getAttribute("aria-haspopup")).toBe("menu");
		expect(toggle(el).getAttribute("aria-expanded")).toBe("false");
	});

	it("carries Button's own classes onto both halves, so a variant and tone reach the whole control", () => {
		const el = make({ variant: "outline", tone: "danger", size: "sm" });
		for (const half of [primary(el), toggle(el)]) {
			expect(half.className).toContain("xtyle-button");
			expect(half.className).toContain("xtyle-button--outline");
			expect(half.className).toContain("xtyle-button--danger");
			expect(half.className).toContain("xtyle-button--sm");
		}
	});

	it("names the caret from menu-label, and falls back to a generic name", () => {
		expect(toggle(make({ "menu-label": "More save actions" })).getAttribute("aria-label")).toBe("More save actions");
		expect(toggle(make()).getAttribute("aria-label")).toBe("More actions");
	});

	it("hands the items to the composed menu rather than rendering a second listbox", () => {
		const el = make();
		expect(menu(el).items).toHaveLength(4);
		expect(menu(el).hasAttribute("context")).toBe(true);
		expect(menuRows(el).map((row) => row.textContent?.trim())).toContain("Save and close");
	});
});

describe("<xtyle-split-button> the two paths never blur together", () => {
	it("lets the primary's click reach a listener on the host", () => {
		const el = make();
		let clicks = 0;
		el.addEventListener("click", () => clicks++);
		primary(el).click();
		expect(clicks).toBe(1);
	});

	it("stops the caret's click, so a click listener only ever hears the primary", () => {
		const el = make();
		let clicks = 0;
		el.addEventListener("click", () => clicks++);
		toggle(el).click();
		expect(clicks).toBe(0);
		expect(el.open).toBe(true);
	});

	// the bug this pins: a row's click bubbles, and the dropdown is a child of the group — so picking
	// "Discard changes" from the menu reached a `click` listener as though the primary had been pressed, and
	// an app wired the documented way would have run Save on the way to discarding
	it("never lets a menu row's click impersonate a press of the primary", () => {
		const el = make();
		const seen: string[] = [];
		el.addEventListener("click", () => seen.push("click"));
		el.addEventListener("select", (event) => seen.push(`select:${(event as CustomEvent).detail.value}`));
		el.showMenu();
		const discard = menuRows(el).find((row) => row.dataset.value === "discard") as HTMLElement;
		discard.click();
		expect(seen).toEqual(["select:discard"]);
	});

	it("re-emits nothing: the menu's own select event bubbles out of the group", () => {
		const el = make();
		const picks: { value: string; label: string; index: number }[] = [];
		el.addEventListener("select", (event) => picks.push((event as CustomEvent).detail));
		el.showMenu();
		menuRows(el)[0].click();
		expect(picks).toEqual([{ value: "save-close", label: "Save and close", index: 0 }]);
	});
});

describe("<xtyle-split-button> the menu", () => {
	it("toggles open and shut from the caret", () => {
		const el = make();
		toggle(el).click();
		expect(el.open).toBe(true);
		expect(menu(el).open).toBe(true);
		expect(toggle(el).getAttribute("aria-expanded")).toBe("true");
		toggle(el).click();
		expect(el.open).toBe(false);
		expect(menu(el).open).toBe(false);
		expect(toggle(el).getAttribute("aria-expanded")).toBe("false");
	});

	it("drops the menu on ArrowDown from either half — the primary as well as the caret", () => {
		const fromPrimary = make();
		const event = key(primary(fromPrimary), "ArrowDown");
		expect(fromPrimary.open).toBe(true);
		expect(event.defaultPrevented).toBe(true);

		const fromToggle = make();
		key(toggle(fromToggle), "ArrowDown");
		expect(fromToggle.open).toBe(true);
	});

	it("opens onto the last row on ArrowUp", () => {
		const el = make();
		key(primary(el), "ArrowUp");
		expect(el.open).toBe(true);
	});

	it("follows the menu's own state when it closes on a path the group never saw", () => {
		const el = make();
		el.showMenu();
		expect(el.open).toBe(true);
		menu(el).open = false;
		expect(el.open).toBe(false);
		expect(toggle(el).getAttribute("aria-expanded")).toBe("false");
	});

	it("opens from the property path too, not just the caret", () => {
		const el = make();
		el.open = true;
		expect(menu(el).open).toBe(true);
		el.open = false;
		expect(menu(el).open).toBe(false);
	});
});

describe("<xtyle-split-button> disabled and loading", () => {
	it("disables both halves", () => {
		const el = make({ disabled: "" });
		expect(primary(el).disabled).toBe(true);
		expect(toggle(el).disabled).toBe(true);
	});

	it("refuses to open while disabled", () => {
		const el = make({ disabled: "" });
		el.showMenu();
		expect(el.open).toBe(false);
	});

	it("blocks the primary while loading but leaves the caret live, so the menu is still reachable", () => {
		const el = make({ loading: "" });
		expect(primary(el).disabled).toBe(true);
		expect(primary(el).getAttribute("aria-busy")).toBe("true");
		expect(toggle(el).disabled).toBe(false);
		toggle(el).click();
		expect(el.open).toBe(true);
	});
});

describe("<xtyle-split-button> SSR (the pre-hydration paint)", () => {
	it("renders both halves and the label slot without a runtime", async () => {
		const html = await renderFragmentLight("split-button", {
			variant: "solid",
			tone: "accent",
			size: "md",
			menuLabel: "More save actions",
			itemsJson: JSON.stringify(ACTIONS),
		});
		expect(html).toContain("xtyle-split-button__primary");
		expect(html).toContain("xtyle-split-button__toggle");
		expect(html).toContain('aria-haspopup="menu"');
		expect(html).toContain("<slot></slot>");
		expect(html).toContain("More save actions");
	});
});
