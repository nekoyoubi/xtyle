// @vitest-environment happy-dom
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import "../src/elements/spotlight.js";
import { loadFill, loadedFillNames } from "../src/elements/fragment-host.js";
import { manifest } from "../src/elements/fragments/spotlight/source.generated.js";

/**
 * The payoff of putting the isolation in a fragment: a mod can throw out the veil, the ring, the pointer and
 * the panel and rebuild all of it. This one drops the ring and the bouncing arrow entirely, renames every
 * class, and swaps the "Got it" button for a text link — the coachmark language a lot of apps actually use.
 *
 * What it does *not* touch is the geometry: the element still measures the target and hands the clip path
 * down as a binding, so the reshaped veil still cuts a hole in exactly the right place, and the reshaped
 * dismiss still dismisses.
 */
const plainMod = {
	manifest: {
		$schema: "https://xript.dev/schema/mod/v0.7.json",
		xript: "0.7",
		name: "test-spotlight-plain",
		version: "0.0.1",
		title: "test-spotlight-plain",
		description: "A test mod: no ring, no arrow, a text link to leave.",
		capabilities: ["xtyle.component.spotlight"],
		entry: { script: "mod.js", format: "script" },
		fills: {
			"component.spotlight": [{ id: "spotlight", format: "text/html+jsml", source: "spotlight.html" }],
		},
	},
	fragmentSources: {
		"spotlight.html": '<div class="plainlight" data-root hidden></div>\n',
		"mod.js": `"use strict";
(() => {
	function paint(b, ops) {
		ops.setAttr("[data-root]", "hidden", b.open === true ? "" : "hidden");
		ops.replaceChildren("[data-root]",
			'<div class="plainlight__shade" data-veil style=\\'' + (b.cutout ? 'clip-path: path(evenodd, "' + b.cutout + '");' : '') + '\\'></div>'
			+ '<xtyle-popover class="plainlight__say" data-callout><div class="plainlight__panel">'
			+ '<p class="plainlight__text"><slot></slot></p>'
			+ '<a href="#" class="plainlight__leave" data-sl-close>skip this</a>'
			+ '</div></xtyle-popover>');
	}
	hooks.fragment.mount("spotlight", (b, ops) => { paint(b, ops); });
	hooks.fragment.update("spotlight", (b, ops) => {
		ops.setAttr("[data-root]", "hidden", b.open === true ? "" : "hidden");
		ops.setAttr("[data-veil]", "style", b.cutout ? 'clip-path: path(evenodd, "' + b.cutout + '");' : '');
	});
})();
`,
	},
};

type SpotlightEl = HTMLElement & { open: boolean; show(): void; close(): void };

beforeAll(async () => {
	await loadFill(plainMod.manifest, plainMod.fragmentSources);
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
	};
	proto.hidePopover = function hidePopover(this: HTMLElement): void {
		this.removeAttribute("data-test-open");
	};
	(window as unknown as { innerWidth: number }).innerWidth = 1000;
	(window as unknown as { innerHeight: number }).innerHeight = 800;
});

afterEach(() => {
	document.body.innerHTML = "";
});

function makeTarget(): HTMLElement {
	const el = document.createElement("button");
	el.id = "save";
	el.getBoundingClientRect = () =>
		({ top: 100, left: 200, width: 120, height: 40, right: 320, bottom: 140, x: 200, y: 100 }) as DOMRect;
	document.body.appendChild(el);
	return el;
}

function make(): SpotlightEl {
	const el = document.createElement("xtyle-spotlight") as SpotlightEl;
	el.setAttribute("target", "#save");
	el.setAttribute("padding", "0");
	el.setAttribute("shape", "rect");
	document.body.appendChild(el);
	return el;
}

function root(el: SpotlightEl): ShadowRoot {
	return el.shadowRoot as ShadowRoot;
}

describe("a mod reshapes the spotlight", () => {
	it("registers behind xtyle's own fill, which the app never had to load", () => {
		const names = loadedFillNames();
		expect(names.indexOf(manifest.name)).toBeGreaterThanOrEqual(0);
		expect(names.indexOf(manifest.name)).toBeLessThan(names.indexOf(plainMod.manifest.name));
	});

	it("replaces the whole overlay, leaving none of the built-in chrome behind", () => {
		makeTarget();
		const el = make();
		expect(root(el).querySelector(".plainlight__shade")).not.toBeNull();
		expect(root(el).querySelector(".plainlight__leave")).not.toBeNull();
		expect(root(el).querySelector(".xtyle-spotlight__ring")).toBeNull();
		expect(root(el).querySelector(".xtyle-spotlight__pointer")).toBeNull();
		expect(root(el).querySelector(".xtyle-spotlight__close")).toBeNull();
	});

	it("keeps the geometry the element owns: the reshaped veil still cuts the hole in the right place", () => {
		makeTarget();
		const el = make();
		el.show();
		const style = (root(el).querySelector("[data-veil]") as HTMLElement).getAttribute("style") ?? "";
		expect(style).toContain("M0 0H1000V800H0Z");
		expect(style).toContain("M200 100H320V140H200Z");
	});

	it("keeps the behavior the element owns: the reshaped dismiss still dismisses", () => {
		makeTarget();
		const el = make();
		el.show();
		expect(el.open).toBe(true);
		(root(el).querySelector("[data-sl-close]") as HTMLElement).click();
		expect(el.open).toBe(false);
	});
});
