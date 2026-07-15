// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import "../src/elements/combobox.js";
import { loadFill, loadedFillNames } from "../src/elements/fragment-host.js";
import { manifest } from "../src/elements/fragments/combobox/source.generated.js";
import { manifest as popoverManifest, fragmentSources as popoverSources } from "../src/elements/fragments/popover/source.generated.js";

/**
 * The payoff of keeping the option rows and the chips in the fragment: a third-party mod filling
 * `component.combobox` can throw the built-in rows away and draw its own — here, rows with an avatar dot
 * and a `data-modded` flag, and chips that are bare `<b>` tags with no remove button — a structure the
 * built-in fill never renders. Its ops apply after the built-in's, so its `replaceChildren` is what the DOM
 * ends up with. Everything the element owns has to survive that: the filtering, the keyboard cursor, the
 * ARIA, the selection, and the hidden form input.
 */
const dotMod = {
	manifest: {
		$schema: "https://xript.dev/schema/mod/v0.7.json",
		xript: "0.7",
		name: "test-combobox-dots",
		version: "0.0.1",
		title: "test-combobox-dots",
		description: "A test mod reskinning the combobox rows and chips.",
		capabilities: ["xtyle.component.combobox"],
		entry: { script: "mod.js", format: "script" },
		fills: {
			"component.combobox": [{ id: "combobox", format: "text/html+jsml", source: "combobox.html" }],
		},
	},
	fragmentSources: {
		"combobox.html": "<div data-root></div>\n",
		"mod.js": `"use strict";
(() => {
	function rows(b) {
		var out = '';
		var options = b.options || [];
		for (var i = 0; i < options.length; i++) {
			var o = options[i];
			out +=
				'<li class="modded-option" role="option" data-option data-modded' +
				' id="' + o.id + '"' +
				' data-value="' + o.value + '"' +
				' data-label="' + o.label + '"' +
				' aria-selected="' + (o.selected === true) + '"' +
				' data-active="' + (o.active === true) + '">' +
				'<i class="modded-dot" aria-hidden="true">•</i>' + o.label +
				'</li>';
		}
		return out;
	}
	function chips(b) {
		var out = '';
		var picked = b.chips || [];
		for (var i = 0; i < picked.length; i++) {
			out += '<b class="modded-chip" data-chip data-value="' + picked[i].value + '">' + picked[i].label + '</b>';
		}
		return out;
	}
	hooks.fragment.mount("combobox", (b, ops) => {
		ops.replaceChildren("[data-list]", rows(b));
		ops.replaceChildren("[data-chips]", chips(b));
	});
	hooks.fragment.update("combobox", (b, ops) => {
		ops.replaceChildren("[data-list]", rows(b));
		ops.replaceChildren("[data-chips]", chips(b));
	});
})();
`,
	},
};

type ComboboxEl = HTMLElement & { value: string; values: string[]; open: boolean; options: unknown };

const OPEN_FLAG = "data-test-popover-open";

const LABELS = [
	{ value: "bug", label: "Bug" },
	{ value: "docs", label: "Docs" },
	{ value: "chore", label: "Chore" },
];

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
	// Popover is a collaborator the combobox renders inside, not the slot under test: warming its fill
	// keeps the panel's first paint synchronous. The combobox's own fill is left for the host to pull
	// in behind the mod.
	await loadFill(popoverManifest, popoverSources);
	await loadFill(dotMod.manifest, dotMod.fragmentSources);
});

afterEach(() => {
	document.body.innerHTML = "";
});

function make(attrs: Record<string, string> = {}): ComboboxEl {
	const el = document.createElement("xtyle-combobox") as ComboboxEl;
	for (const [name, value] of Object.entries({ label: "Labels", ...attrs })) el.setAttribute(name, value);
	document.body.appendChild(el);
	el.options = LABELS;
	return el;
}

function root(el: ComboboxEl): ShadowRoot {
	return el.shadowRoot as ShadowRoot;
}

function input(el: ComboboxEl): HTMLInputElement {
	return root(el).querySelector("[data-input]") as HTMLInputElement;
}

function rows(el: ComboboxEl): HTMLElement[] {
	return [...root(el).querySelectorAll<HTMLElement>(".modded-option")];
}

function key(el: ComboboxEl, name: string): void {
	input(el).dispatchEvent(new KeyboardEvent("keydown", { key: name, bubbles: true, composed: true, cancelable: true }));
}

function type(el: ComboboxEl, text: string): void {
	input(el).value = text;
	input(el).dispatchEvent(new Event("input", { bubbles: true, composed: true }));
}

describe("a mod reshapes the combobox", () => {
	it("registers behind xtyle's own fill, which the app never had to load", () => {
		const names = loadedFillNames();
		expect(names.indexOf(manifest.name)).toBeGreaterThanOrEqual(0);
		expect(names.indexOf(manifest.name)).toBeLessThan(names.indexOf(dotMod.manifest.name));
	});

	it("replaces the option rows with its own, leaving none of the built-in ones behind", () => {
		const el = make();
		key(el, "ArrowDown");
		expect(rows(el)).toHaveLength(3);
		expect(rows(el)[0].querySelector(".modded-dot")).not.toBeNull();
		expect(root(el).querySelector(".xtyle-combobox__option")).toBeNull();
		expect(root(el).querySelector(".xtyle-combobox__check")).toBeNull();
	});

	it("keeps the keyboard cursor driving the modded rows through aria-activedescendant", () => {
		const el = make();
		key(el, "ArrowDown");
		expect(input(el).getAttribute("aria-activedescendant")).toBe(rows(el)[0].id);
		expect(rows(el)[0].getAttribute("data-active")).toBe("true");
		key(el, "ArrowDown");
		expect(input(el).getAttribute("aria-activedescendant")).toBe(rows(el)[1].id);
		key(el, "Enter");
		expect(el.value).toBe("docs");
		expect(el.open).toBe(false);
	});

	it("keeps the filtering, and a click on a modded row still commits it", () => {
		const el = make();
		type(el, "cho");
		expect(rows(el).map((row) => row.dataset.value)).toEqual(["chore"]);
		rows(el)[0].dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, cancelable: true }));
		expect(el.value).toBe("chore");
	});

	it("keeps multi-select working with chips the mod drew itself", () => {
		const el = make({ multiple: "", name: "labels" });
		key(el, "ArrowDown"); // cursor onto the first row
		key(el, "Enter"); // pick it; the list stays open with the cursor where it was
		key(el, "ArrowDown"); // onto the next row
		key(el, "Enter");
		expect(el.values).toEqual(["bug", "docs"]);
		const chips = [...root(el).querySelectorAll<HTMLElement>(".modded-chip")];
		expect(chips.map((chip) => chip.textContent)).toEqual(["Bug", "Docs"]);
		expect(root(el).querySelector(".xtyle-combobox__chip")).toBeNull();
	});

	it("keeps posting the value through the form under the reskin", () => {
		const el = make({ name: "label" });
		key(el, "ArrowDown");
		key(el, "Enter");
		const hidden = [...root(el).querySelectorAll<HTMLInputElement>("input[data-form-value]")];
		expect(hidden.map((node) => [node.name, node.value])).toEqual([["label", "bug"]]);
	});

	it("keeps the combobox semantics on the input under the reskin", () => {
		const el = make();
		expect(input(el).getAttribute("role")).toBe("combobox");
		key(el, "ArrowDown");
		expect(input(el).getAttribute("aria-expanded")).toBe("true");
		expect(rows(el)[0].getAttribute("role")).toBe("option");
	});
});
