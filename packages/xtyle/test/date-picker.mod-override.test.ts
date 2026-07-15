// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import "../src/elements/date-picker.js";
import { loadFill, loadedFillNames } from "../src/elements/fragment-host.js";
import { manifest } from "../src/elements/fragments/date-picker/source.generated.js";

/**
 * The payoff of putting the field's chrome in a fragment: a third-party mod filling
 * `component.date-picker` can rebuild the whole surface. This one throws away the two-button control
 * bar entirely — no clear button, no calendar trigger, a single input with a different class, and the
 * time list rendered as a flat `<ul>` of `role="option"` items rather than the built-in's button row.
 * Everything the *element* owns has to survive that: the parsing, the locale order, the bounds, the
 * arrow keys, the value, and the form plumbing all live in the element, not in the markup.
 */
const brutalistMod = {
	manifest: {
		$schema: "https://xript.dev/schema/mod/v0.7.json",
		xript: "0.7",
		name: "test-date-picker-brutalist",
		version: "0.0.1",
		title: "test-date-picker-brutalist",
		description: "A test mod reshaping the date picker's chrome.",
		capabilities: ["xtyle.component.date-picker"],
		entry: { script: "mod.js", format: "script" },
		fills: {
			"component.date-picker": [
				{
					id: "date-picker",
					format: "text/html+jsml",
					source: "date-picker.html",
					handlers: [
						{ selector: ".xtyle-datepicker__input", on: "change", handler: "commit" },
						{ selector: ".xtyle-datepicker__input", on: "keydown", handler: "inputKeydown" },
						{ selector: ".xtyle-datepicker__time-option", on: "click", handler: "pickTime" },
					],
				},
			],
		},
	},
	fragmentSources: {
		"date-picker.html": '<div class="xtyle-datepicker" part="datepicker" data-root data-datepicker></div>\n',
		"mod.js": `"use strict";
(() => {
	function inner(b) {
		var mode = b.mode || "date";
		var out = '<section class="modded-shell">';
		if (mode !== "time") {
			out += '<input class="xtyle-control xtyle-datepicker__input xtyle-datepicker__input--date modded-input"' +
				' data-part="date" type="text" value="' + (b.dateText || '') + '" aria-label="' + (b.dateLabel || 'Date') + '" />';
		}
		if (mode !== "date") {
			out += '<input class="xtyle-control xtyle-datepicker__input xtyle-datepicker__input--time modded-input"' +
				' data-part="time" type="text" value="' + (b.timeText || '') + '" aria-label="' + (b.timeLabel || 'Time') + '" />';
			var options = b.timeOptions || [];
			out += '<ul class="modded-times" role="listbox">';
			for (var i = 0; i < options.length; i++) {
				var o = options[i];
				out += '<li class="xtyle-datepicker__time-option modded-time" role="option" data-iso="' + o.iso +
					'" aria-selected="' + (o.selected === true) + '">' + o.label + '</li>';
			}
			out += '</ul>';
		}
		return out + '</section>';
	}
	hooks.fragment.mount("date-picker", (b, ops) => {
		ops.setAttr("[data-root]", "class", "xtyle-datepicker modded");
		ops.replaceChildren("[data-datepicker]", inner(b));
	});
	hooks.fragment.update("date-picker", (b, ops) => {
		ops.setAttr("[data-root]", "class", "xtyle-datepicker modded");
		ops.setAttr(".xtyle-datepicker__input--date", "value", b.dateText || "");
		ops.setAttr(".xtyle-datepicker__input--time", "value", b.timeText || "");
	});
})();
`,
	},
};

type PickerEl = HTMLElement & { value: string; isDateDisabled: ((iso: string) => boolean) | null };

beforeAll(async () => {
	const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
	proto.attachInternals = function attachInternals() {
		return { setFormValue() {}, setValidity() {} };
	};
	await loadFill(brutalistMod.manifest, brutalistMod.fragmentSources);
});

afterEach(() => {
	document.body.innerHTML = "";
});

function make(attrs: Record<string, string> = {}): PickerEl {
	const el = document.createElement("xtyle-date-picker") as PickerEl;
	for (const [name, value] of Object.entries({ label: "When", locale: "en-US", ...attrs })) {
		el.setAttribute(name, value);
	}
	document.body.appendChild(el);
	return el;
}

function root(el: PickerEl): ShadowRoot | PickerEl {
	return el.shadowRoot ?? el;
}

function q<T extends Element>(el: PickerEl, selector: string): T | null {
	return root(el).querySelector<T>(selector);
}

function input(el: PickerEl, part: "date" | "time"): HTMLInputElement {
	return q<HTMLInputElement>(el, `.xtyle-datepicker__input--${part}`)!;
}

function type(el: PickerEl, part: "date" | "time", text: string): void {
	const field = input(el, part);
	field.value = text;
	field.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
}

describe("a mod reshapes the date picker's chrome", () => {
	it("registers behind xtyle's own fill, which the app never had to load", () => {
		const names = loadedFillNames();
		expect(names.indexOf(manifest.name)).toBeGreaterThanOrEqual(0);
		expect(names.indexOf(manifest.name)).toBeLessThan(names.indexOf(brutalistMod.manifest.name));
	});

	it("replaces the whole control bar, leaving no clear button or trigger behind", () => {
		const el = make({ value: "2026-03-08" });
		expect(q(el, ".modded-shell")).not.toBeNull();
		expect(q(el, ".xtyle-datepicker__clear")).toBeNull();
		expect(q(el, ".xtyle-datepicker__trigger")).toBeNull();
		expect(q(el, ".xtyle-datepicker__control")).toBeNull();
		expect(input(el, "date").classList.contains("modded-input")).toBe(true);
	});

	it("keeps the parser, the locale order, and the value under the reskin", () => {
		const el = make();
		type(el, "date", "3/8/2026");
		expect(el.value).toBe("2026-03-08");
		expect(input(el, "date").value).toBe("03/08/2026");

		const gb = make({ locale: "en-GB" });
		type(gb, "date", "3/8/2026");
		expect(gb.value).toBe("2026-08-03");
	});

	it("keeps the arrow keys stepping the value", () => {
		const el = make({ value: "2026-03-08" });
		const field = input(el, "date");
		field.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true, composed: true }));
		expect(el.value).toBe("2026-03-09");
		field.dispatchEvent(new KeyboardEvent("keydown", { key: "PageUp", bubbles: true, composed: true }));
		expect(el.value).toBe("2026-04-09");
	});

	it("keeps the bounds and the disabled-date predicate enforced on typed input", () => {
		const clamped = make({ min: "2026-03-08", max: "2026-03-20" });
		type(clamped, "date", "1/1/2026");
		expect(clamped.value).toBe("2026-03-08");

		const refused = make();
		refused.isDateDisabled = (iso) => iso === "2026-03-08";
		type(refused, "date", "3/8/2026");
		expect(refused.value).toBe("");
	});

	it("drives the mod's own time list, rendered as list items rather than buttons", () => {
		const el = make({ mode: "time", step: "3600" });
		const options = [...root(el).querySelectorAll(".modded-time")];
		expect(options).toHaveLength(24);
		expect(options[0]!.tagName.toLowerCase()).toBe("li");
		expect(el.querySelector("button")).toBeNull();

		const nine = q<HTMLElement>(el, '.modded-time[data-iso="09:00"]')!;
		nine.click();
		expect(el.value).toBe("09:00");
	});

	it("keeps the wall-clock contract under the reskin", () => {
		const el = make({ mode: "datetime", value: "2026-03-08T02:30" });
		expect(el.value).toBe("2026-03-08T02:30");
		const field = input(el, "date");
		field.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, composed: true }));
		expect(el.value).toBe("2026-03-07T02:30");
	});
});
