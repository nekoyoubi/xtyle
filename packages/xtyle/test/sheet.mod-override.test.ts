// @vitest-environment happy-dom
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import "../src/elements/sheet.js";
import { loadFill, loadedFillNames } from "../src/elements/fragment-host.js";
import { manifest } from "../src/elements/fragments/sheet/source.generated.js";

/**
 * The payoff of putting the sheet's chrome in a fragment: a third-party mod filling `component.sheet`
 * can throw the whole drawer apart and rebuild it. This one drops the panel/handle/header tree the
 * built-in fill draws and renders a structure it never would — a `<nav>`-shaped rail whose grabber is
 * a wide "pull" bar with its own class, and whose dismiss control is a labelled text button rather than
 * a corner icon. Its hooks are appended to the built-in's and its ops apply last, so its
 * `replaceChildren` is what the DOM ends up with. Everything the element owns — the native `<dialog>`,
 * the open/close lifecycle, the swipe gesture, the ARIA naming — has to survive that.
 *
 * The dismiss button keeps the host's declared `.xtyle-sheet__close` handler selector while looking
 * nothing like the built-in one: handler *wiring* is the host's contract (the element's `FragmentHost`
 * collects the selectors the built-in fill declares), so a fill hooks the declared behavior by
 * satisfying that selector, not by inventing its own event plumbing.
 */
const railMod = {
	manifest: {
		$schema: "https://xript.dev/schema/mod/v0.7.json",
		xript: "0.7",
		name: "test-sheet-rail",
		version: "0.0.1",
		title: "test-sheet-rail",
		description: "A test mod reshaping the sheet into a rail with its own pull bar and text dismiss.",
		capabilities: ["xtyle.component.sheet"],
		entry: { script: "mod.js", format: "script" },
		fills: {
			"component.sheet": [{ id: "sheet", format: "text/html+jsml", source: "sheet.html" }],
		},
	},
	fragmentSources: {
		"sheet.html": '<div class="xtyle-sheet-host" data-root data-sheet></div>\n',
		"mod.js": `"use strict";
(() => {
	function rail(b) {
		var side = b.side === undefined ? "bottom" : b.side;
		var name = b.heading ? ' aria-label="' + b.heading + '"' : '';
		return '<dialog class="xtyle-sheet modded-rail xtyle-sheet--' + side + '" part="sheet"' + name + '>'
			+ '<div class="modded-pull" part="grabber" data-handle aria-hidden="true">⋯</div>'
			+ '<nav class="modded-rail__nav"><slot></slot></nav>'
			+ '<button type="button" class="xtyle-sheet__close modded-dismiss">Dismiss</button>'
			+ '</dialog>';
	}
	hooks.fragment.mount("sheet", (b, ops) => {
		ops.replaceChildren("[data-sheet]", rail(b));
	});
	hooks.fragment.update("sheet", () => {});
})();
`,
	},
};

type SheetEl = HTMLElement & { open: boolean; showModal(): void; close(): void };
type StubDialog = HTMLDialogElement & { modal?: boolean };

beforeAll(async () => {
	await loadFill(railMod.manifest, railMod.fragmentSources);
});

beforeEach(() => {
	const proto = window.HTMLDialogElement.prototype as unknown as StubDialog;
	proto.showModal = function (this: StubDialog) {
		this.open = true;
		this.modal = true;
	};
	proto.close = function (this: StubDialog) {
		if (!this.open) return;
		this.open = false;
		this.dispatchEvent(new Event("close"));
	};
});

afterEach(() => {
	document.body.innerHTML = "";
});

function make(attrs: Record<string, string> = { heading: "Navigate" }): SheetEl {
	const el = document.createElement("xtyle-sheet") as SheetEl;
	for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
	document.body.appendChild(el);
	return el;
}

function root(el: SheetEl): ShadowRoot {
	return el.shadowRoot as ShadowRoot;
}

function pointer(type: string, init: { clientX?: number; clientY?: number } = {}): Event {
	const event = new Event(type, { bubbles: true, composed: true, cancelable: true });
	Object.assign(event, { pointerId: 1, pointerType: "touch", button: 0, ...init });
	return event;
}

describe("a mod reshapes the sheet's chrome", () => {
	it("registers behind xtyle's own fill, which the app never had to load", () => {
		const names = loadedFillNames();
		expect(names.indexOf(manifest.name)).toBeGreaterThanOrEqual(0);
		expect(names.indexOf(manifest.name)).toBeLessThan(names.indexOf(railMod.manifest.name));
	});

	it("replaces the whole panel tree, leaving none of the built-in chrome behind", () => {
		const el = make();
		expect(root(el).querySelector(".modded-rail")).not.toBeNull();
		expect(root(el).querySelector(".modded-pull")).not.toBeNull();
		expect(root(el).querySelector(".modded-rail__nav")).not.toBeNull();
		expect(root(el).querySelector(".xtyle-sheet__panel")).toBeNull();
		expect(root(el).querySelector(".xtyle-sheet__handle")).toBeNull();
		expect(root(el).querySelector(".xtyle-sheet__grabber")).toBeNull();
		expect(root(el).querySelector("svg")).toBeNull();
		expect(root(el).querySelector(".modded-dismiss")!.textContent).toBe("Dismiss");
	});

	it("keeps the reshaped chrome inside the fill scaffold the element still hosts", () => {
		const el = make();
		const scaffold = root(el).querySelector("[data-root][data-sheet]")!;
		expect(scaffold.querySelector(".modded-rail")).not.toBeNull();
	});

	it("keeps the native dialog driving the open/close lifecycle under the reskin", () => {
		const el = make();
		el.showModal();
		const dialog = root(el).querySelector("dialog") as StubDialog;
		expect(dialog.open).toBe(true);
		expect(dialog.modal).toBe(true);
		el.close();
		expect(dialog.open).toBe(false);
	});

	it("routes the mod's own dismiss control back through the element's close intent", () => {
		const el = make();
		el.showModal();
		root(el).querySelector<HTMLButtonElement>(".modded-dismiss")!.click();
		expect(el.open).toBe(false);
	});

	it("keeps swipe-to-dismiss working against the mod's own handle", () => {
		const el = make({ heading: "Navigate", side: "bottom" });
		el.showModal();
		const dialog = root(el).querySelector("dialog") as StubDialog;
		dialog.getBoundingClientRect = () =>
			({ width: 400, height: 400, top: 0, left: 0, right: 400, bottom: 400, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;

		const pull = root(el).querySelector(".modded-pull")!;
		pull.dispatchEvent(pointer("pointerdown", { clientX: 200, clientY: 100 }));
		pull.dispatchEvent(pointer("pointermove", { clientX: 200, clientY: 280 }));
		expect(dialog.style.transform).toBe("translateY(180px)");
		pull.dispatchEvent(pointer("pointerup", { clientX: 200, clientY: 280 }));
		expect(el.open).toBe(false);
	});

	it("keeps the sheet's accessible name under the reskin", () => {
		const el = make({ heading: "Navigate" });
		expect(root(el).querySelector("dialog")!.getAttribute("aria-label")).toBe("Navigate");
	});
});
