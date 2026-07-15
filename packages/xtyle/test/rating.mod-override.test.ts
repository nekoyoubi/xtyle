// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import "../src/elements/rating.js";
import { loadFill, loadedFillNames } from "../src/elements/fragment-host.js";
import { manifest } from "../src/elements/fragments/rating/source.generated.js";

/**
 * The payoff of moving the star row out of the element: a third-party mod filling `component.rating`
 * can throw the whole row away. This one swaps the star for a heart *and* drops the two-layer
 * width-clip technique entirely, drawing one row of discrete glyphs flagged `data-on` — a structure
 * the built-in fill never renders. Everything the element owns — the value, the keys, the ARIA, the
 * hidden input — has to survive that.
 *
 * The load order here is the one an app actually has: install the mod at boot, and only later let an
 * element connect and paint. Nothing pre-loads xtyle's own fill — the host pulls mod-zero in ahead of
 * any override, so the override's ops are the ones that land last no matter when the app installs it.
 */
const heartMod = {
	manifest: {
		$schema: "https://xript.dev/schema/mod/v0.7.json",
		xript: "0.7",
		name: "test-rating-hearts",
		version: "0.0.1",
		title: "test-rating-hearts",
		description: "A test mod reskinning the rating row as discrete hearts.",
		capabilities: ["xtyle.component.rating"],
		entry: { script: "mod.js", format: "script" },
		fills: {
			"component.rating": [{ id: "rating", format: "text/html+jsml", source: "rating.html" }],
		},
	},
	fragmentSources: {
		"rating.html": '<span class="xtyle-rating__rows" part="rows" data-root data-rating></span>\n',
		"mod.js": `"use strict";
(() => {
	function hearts(b) {
		var max = b.max === undefined ? 5 : b.max;
		var value = Math.min(Math.max(b.value === undefined ? 0 : b.value, 0), max);
		var out = '';
		for (var i = 1; i <= max; i++) {
			var on = i <= Math.ceil(value) ? ' data-on=""' : '';
			out += '<i class="modded-heart" part="heart"' + on + ' aria-hidden="true">♥</i>';
		}
		return '<span class="modded-row" part="row">' + out + '</span>';
	}
	hooks.fragment.mount("rating", (b, ops) => {
		ops.replaceChildren("[data-rating]", hearts(b));
	});
	hooks.fragment.update("rating", (b, ops) => {
		ops.replaceChildren("[data-rating]", hearts(b));
	});
})();
`,
	},
};

type RatingEl = HTMLElement & { value: number; max: number };

beforeAll(async () => {
	await loadFill(heartMod.manifest, heartMod.fragmentSources);
});

afterEach(() => {
	document.body.innerHTML = "";
});

function make(attrs: Record<string, string> = {}): RatingEl {
	const el = document.createElement("xtyle-rating") as RatingEl;
	for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
	document.body.appendChild(el);
	return el;
}

function press(el: HTMLElement, key: string): KeyboardEvent {
	const ev = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
	el.dispatchEvent(ev);
	return ev;
}

function lit(el: HTMLElement): number {
	return el.querySelectorAll(".modded-heart[data-on]").length;
}

describe("a mod reshapes the rating row", () => {
	it("registers behind xtyle's own fill, which the app never had to load", () => {
		const names = loadedFillNames();
		expect(names).toContain(manifest.name);
		expect(names.indexOf(manifest.name)).toBeLessThan(names.indexOf(heartMod.manifest.name));
	});

	it("replaces both star rows with its own glyph row, leaving no stars behind", () => {
		const el = make({ value: "3", max: "5" });
		expect(el.querySelectorAll(".modded-heart")).toHaveLength(5);
		expect(lit(el)).toBe(3);
		expect(el.querySelector(".xtyle-rating__row--empty")).toBeNull();
		expect(el.querySelector(".xtyle-rating__row--filled")).toBeNull();
		expect(el.querySelector("svg")).toBeNull();
	});

	it("keeps the row inside the fill scaffold the element still hosts", () => {
		const el = make({ value: "2", max: "5" });
		const scaffold = el.querySelector("[data-root][data-rating]")!;
		expect(scaffold.querySelector(".modded-row")).not.toBeNull();
		expect(el.classList.contains("xtyle-rating")).toBe(true);
	});

	it("keeps the keyboard driving the value, and the row following it", () => {
		const el = make({ value: "3", max: "5" });
		const ev = press(el, "ArrowRight");
		expect(ev.defaultPrevented).toBe(true);
		expect(el.value).toBe(4);
		expect(lit(el)).toBe(4);
		press(el, "Home");
		expect(el.value).toBe(0);
		expect(lit(el)).toBe(0);
		press(el, "End");
		expect(el.value).toBe(5);
		expect(lit(el)).toBe(5);
	});

	it("keeps the slider semantics on the host under the reskin", () => {
		const el = make({ value: "3", max: "5", label: "Rate this" });
		expect(el.getAttribute("role")).toBe("slider");
		expect(el.getAttribute("tabindex")).toBe("0");
		expect(el.getAttribute("aria-valuemin")).toBe("0");
		expect(el.getAttribute("aria-valuemax")).toBe("5");
		expect(el.getAttribute("aria-valuenow")).toBe("3");
		expect(el.getAttribute("aria-label")).toBe("Rate this");
		press(el, "ArrowRight");
		expect(el.getAttribute("aria-valuenow")).toBe("4");
		expect(el.getAttribute("aria-valuetext")).toBe("4 out of 5");
		expect(el.querySelector(".modded-heart")!.getAttribute("aria-hidden")).toBe("true");
	});

	it("keeps a readonly control a labelled image with no tab stop", () => {
		const el = make({ value: "4", max: "5", readonly: "", label: "4 out of 5" });
		expect(el.getAttribute("role")).toBe("img");
		expect(el.hasAttribute("tabindex")).toBe(false);
		expect(lit(el)).toBe(4);
		press(el, "ArrowRight");
		expect(el.value).toBe(4);
	});

	it("keeps posting the value through a form under the reskin", () => {
		const form = document.createElement("form");
		document.body.appendChild(form);
		const el = document.createElement("xtyle-rating") as RatingEl;
		el.setAttribute("name", "score");
		el.setAttribute("value", "2");
		form.appendChild(el);

		expect(new FormData(form).get("score")).toBe("2");
		press(el, "ArrowRight");
		expect(new FormData(form).get("score")).toBe("3");
		expect(lit(el)).toBe(3);
		expect(el.querySelector("[data-rating]")!.querySelector("input")).toBeNull();
	});
});
