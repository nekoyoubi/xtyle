// @vitest-environment happy-dom
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import "../src/elements/split-button.js";
import { loadFill, loadedFillNames } from "../src/elements/fragment-host.js";
import { manifest } from "../src/elements/fragments/split-button/source.generated.js";
import type { MenuItem } from "../src/markup/index.js";

/**
 * The payoff of putting the group's chrome in a fragment: a mod filling `component.split-button` can throw
 * the whole control apart and rebuild it. This one inverts the geometry — the caret leads and the primary
 * trails — swaps the chevron for a text glyph, drops the divider entirely, and renames every class. What it
 * does *not* touch is the behavior: the element still owns the menu wiring, so the reshaped caret still
 * opens the dropdown, the reshaped primary still fires a plain click, and `aria-expanded` still tracks.
 *
 * The reshaped controls keep the host's declared `[data-toggle]` / `[data-primary]` handler selectors while
 * looking nothing like the built-in ones: handler *wiring* is the host's contract, so a fill hooks the
 * declared behavior by satisfying the selector, not by inventing its own event plumbing.
 */
const invertedMod = {
	manifest: {
		$schema: "https://xript.dev/schema/mod/v0.7.json",
		xript: "0.7",
		name: "test-split-button-inverted",
		version: "0.0.1",
		title: "test-split-button-inverted",
		description: "A test mod that leads with the caret, drops the divider, and renames the chrome.",
		capabilities: ["xtyle.component.split-button"],
		entry: { script: "mod.js", format: "script" },
		fills: {
			"component.split-button": [
				{ id: "split-button", format: "text/html+jsml", source: "split-button.html" },
			],
		},
	},
	fragmentSources: {
		"split-button.html": '<span class="inverted" role="group" data-root></span>\n',
		"mod.js": `"use strict";
(() => {
	function paint(b, ops) {
		var items = b.itemsJson === undefined ? "[]" : b.itemsJson;
		ops.replaceChildren("[data-root]",
			'<button class="inverted__caret" type="button" aria-haspopup="menu" aria-expanded="' + (b.open === true) + '" aria-label="' + (b.menuLabel || "More") + '" data-toggle>▾</button>'
			+ '<button class="inverted__go" type="button" data-primary><slot></slot></button>'
			+ '<xtyle-menu context data-dropdown items=\\'' + items + '\\'></xtyle-menu>');
	}
	hooks.fragment.mount("split-button", (b, ops) => { paint(b, ops); });
	hooks.fragment.update("split-button", (b, ops) => {
		ops.setAttr("[data-toggle]", "aria-expanded", b.open === true ? "true" : "false");
	});
})();
`,
	},
};

type SplitEl = HTMLElement & { open: boolean; items: MenuItem[]; showMenu(): void };

const ACTIONS: MenuItem[] = [
	{ label: "Save and close", value: "save-close" },
	{ label: "Save as draft", value: "save-draft" },
];

beforeAll(async () => {
	await loadFill(invertedMod.manifest, invertedMod.fragmentSources);
});

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

function make(): SplitEl {
	const el = document.createElement("xtyle-split-button") as SplitEl;
	el.textContent = "Save";
	document.body.appendChild(el);
	el.items = ACTIONS;
	return el;
}

function root(el: SplitEl): ShadowRoot {
	return el.shadowRoot as ShadowRoot;
}

describe("a mod reshapes the split button's chrome", () => {
	it("registers behind xtyle's own fill, which the app never had to load", () => {
		const names = loadedFillNames();
		expect(names.indexOf(manifest.name)).toBeGreaterThanOrEqual(0);
		expect(names.indexOf(manifest.name)).toBeLessThan(names.indexOf(invertedMod.manifest.name));
	});

	it("replaces the whole group, leaving none of the built-in chrome behind", () => {
		const el = make();
		expect(root(el).querySelector(".inverted__caret")).not.toBeNull();
		expect(root(el).querySelector(".inverted__go")).not.toBeNull();
		expect(root(el).querySelector(".xtyle-split-button__primary")).toBeNull();
		expect(root(el).querySelector(".xtyle-split-button__divider")).toBeNull();
		expect(root(el).querySelector("svg")).toBeNull();
	});

	it("keeps the behavior the element owns: the reshaped caret still opens the menu", () => {
		const el = make();
		const caret = root(el).querySelector("[data-toggle]") as HTMLButtonElement;
		caret.click();
		expect(el.open).toBe(true);
		expect(caret.getAttribute("aria-expanded")).toBe("true");
		expect((root(el).querySelector("[data-dropdown]") as HTMLElement & { open: boolean }).open).toBe(true);
	});

	it("keeps the reshaped primary a plain click, and the reshaped caret's click still stopped", () => {
		const el = make();
		let clicks = 0;
		el.addEventListener("click", () => clicks++);
		(root(el).querySelector("[data-primary]") as HTMLButtonElement).click();
		(root(el).querySelector("[data-toggle]") as HTMLButtonElement).click();
		expect(clicks).toBe(1);
	});
});
