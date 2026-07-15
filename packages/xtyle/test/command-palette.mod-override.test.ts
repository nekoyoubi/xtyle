// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import "../src/elements/command-palette.js";
import type { CommandItem } from "../src/elements/command-palette.js";
import { loadFill, loadedFillNames } from "../src/elements/fragment-host.js";
import { manifest } from "../src/elements/fragments/command-palette/source.generated.js";

/**
 * The payoff of putting the palette's chrome in a fragment: a third-party fill for
 * `component.command-palette` can throw the whole surface away and rebuild it. This one flattens every
 * group into one `<ul>` — no headings — renders each command as an `<li>` with the shortcut *before* the
 * label as bare text rather than keycaps, and drops the search glyph, the empty state, and the legend
 * outright. What it keeps is the behavioral seam the built-in fill's handler selectors name (the input
 * and option classes); everything the element owns — the ranking, the virtual focus, the keyboard, the
 * dialog, `select` — has to survive the reskin.
 */
const listMod = {
	manifest: {
		$schema: "https://xript.dev/schema/mod/v0.7.json",
		xript: "0.7",
		name: "test-command-palette-list",
		version: "0.0.1",
		title: "test-command-palette-list",
		description: "A test mod reskinning the command palette as a flat list.",
		capabilities: ["xtyle.component.command-palette"],
		entry: { script: "mod.js", format: "script" },
		fills: {
			"component.command-palette": [
				{ id: "command-palette", format: "text/html+jsml", source: "command-palette.html" },
			],
		},
	},
	fragmentSources: {
		"command-palette.html":
			'<div class="xtyle-command-palette" data-root>' +
			'<dialog class="xtyle-command-palette__dialog" data-modal>' +
			'<input class="xtyle-command-palette__input" data-input type="text" role="combobox" />' +
			'<ul class="modded-list" role="listbox" data-list></ul>' +
			"</dialog></div>\n",
		"mod.js": `"use strict";
(() => {
	function rows(b) {
		var groups = b.groups || [];
		var out = '';
		for (var g = 0; g < groups.length; g++) {
			var options = groups[g].options || [];
			for (var i = 0; i < options.length; i++) {
				var o = options[i];
				var text = (o.runs || []).map(function (r) { return r.text; }).join('');
				var on = o.active ? ' data-active="true"' : '';
				out += '<li class="xtyle-command-palette__option modded-option" role="option" id="' + o.optionId +
					'" data-id="' + o.id + '"' + on + '>' +
					'<span class="modded-key">' + (o.shortcut || '') + '</span>' + text + '</li>';
			}
		}
		return out;
	}
	function paint(b, ops) {
		ops.replaceChildren('[data-list]', rows(b));
		ops.setAttr('[data-input]', 'aria-activedescendant', b.activeId || '');
		ops.replaceChildren('[data-glyph]', '');
		ops.replaceChildren('[data-footer]', '');
		ops.setAttr('[data-footer]', 'hidden', 'hidden');
	}
	hooks.fragment.mount("command-palette", paint);
	hooks.fragment.update("command-palette", paint);
})();
`,
	},
};

const COMMANDS: CommandItem[] = [
	{ id: "file.new", label: "New file", group: "File", shortcut: "Ctrl+N" },
	{ id: "file.open", label: "Open file…", group: "File" },
	{ id: "view.theme", label: "Toggle theme", group: "View" },
];

beforeAll(async () => {
	await loadFill(listMod.manifest, listMod.fragmentSources);
});

afterEach(() => {
	document.body.innerHTML = "";
});

type PaletteEl = HTMLElement & { open: boolean; items: CommandItem[]; show(): void };

function make(): PaletteEl {
	const el = document.createElement("xtyle-command-palette") as PaletteEl;
	document.body.appendChild(el);
	el.items = COMMANDS;
	return el;
}

function root(el: PaletteEl): ShadowRoot {
	return el.shadowRoot as ShadowRoot;
}

function input(el: PaletteEl): HTMLInputElement {
	return root(el).querySelector(".xtyle-command-palette__input") as HTMLInputElement;
}

function rows(el: PaletteEl): HTMLElement[] {
	return [...root(el).querySelectorAll<HTMLElement>(".modded-option")];
}

function press(el: PaletteEl, key: string): void {
	input(el).dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, composed: true }));
}

function type(el: PaletteEl, value: string): void {
	const field = input(el);
	field.value = value;
	field.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
}

describe("a mod reshapes the command palette", () => {
	it("registers behind xtyle's own fill, which the app never had to load", () => {
		const names = loadedFillNames();
		expect(names.indexOf(manifest.name)).toBeGreaterThanOrEqual(0);
		expect(names.indexOf(manifest.name)).toBeLessThan(names.indexOf(listMod.manifest.name));
	});

	it("replaces the whole result surface, leaving no headings, keycaps, glyph, or legend behind", () => {
		const el = make();
		expect(rows(el)).toHaveLength(3);
		expect(rows(el)[0]!.tagName).toBe("LI");
		expect(root(el).querySelector(".xtyle-command-palette__heading")).toBeNull();
		expect(root(el).querySelector(".xtyle-command-palette__group")).toBeNull();
		expect(root(el).querySelector("kbd")).toBeNull();
		expect(root(el).querySelector("svg")).toBeNull();
		const footer = root(el).querySelector(".xtyle-command-palette__footer") as HTMLElement;
		expect(footer.hasAttribute("hidden")).toBe(true);
		expect(footer.textContent).toBe("");
		expect(rows(el)[0]!.querySelector(".modded-key")?.textContent).toBe("Ctrl+N");
	});

	it("keeps the element's own ranking driving the mod's markup", () => {
		const el = make();
		type(el, "of");
		expect(rows(el).map((row) => row.dataset.id)).toEqual(["file.open"]);
	});

	it("keeps virtual focus, the keyboard, and select working under the reskin", () => {
		const el = make();
		const ran: string[] = [];
		el.addEventListener("select", (event) => ran.push((event as CustomEvent).detail.id));
		el.show();
		press(el, "ArrowDown");
		expect(rows(el).find((row) => row.dataset.active === "true")?.dataset.id).toBe("file.open");
		expect(input(el).getAttribute("aria-activedescendant")).toBe(rows(el)[1]!.id);
		press(el, "Enter");
		expect(ran).toEqual(["file.open"]);
		expect(el.open).toBe(false);
	});

	it("still runs the command a click lands on, through the mod's own row", () => {
		const el = make();
		const ran: string[] = [];
		el.addEventListener("select", (event) => ran.push((event as CustomEvent).detail.id));
		el.show();
		rows(el)[2]!.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, cancelable: true }));
		expect(ran).toEqual(["view.theme"]);
	});
});
