// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import "../src/elements/calendar.js";
import { loadFill, loadedFillNames } from "../src/elements/fragment-host.js";
import { manifest } from "../src/elements/fragments/calendar/source.generated.js";

/**
 * The payoff of putting the whole grid in the fill: a third-party mod filling `component.calendar` can
 * throw the table away. This one renders the month as a flat list of `<button>` chips — no `<table>`, no
 * `role="grid"`, no weekday header, and its own decoration glyph — a structure the built-in fill never
 * draws. Everything the element owns has to survive that: the keyboard grid, the range machine, the
 * month steps, and the roving tab stop, all of which bind to the `data-date` / `data-nav` markers the
 * fill contract names.
 */
const chipMod = {
	manifest: {
		$schema: "https://xript.dev/schema/mod/v0.7.json",
		xript: "0.7",
		name: "test-calendar-chips",
		version: "0.0.1",
		title: "test-calendar-chips",
		description: "A test mod reskinning the month grid as a flat row of day chips.",
		capabilities: ["xtyle.component.calendar"],
		entry: { script: "mod.js", format: "script" },
		fills: {
			"component.calendar": [{ id: "calendar", format: "text/html+jsml", source: "calendar.html" }],
		},
	},
	fragmentSources: {
		"calendar.html": '<div class="xtyle-calendar" part="calendar" data-root data-calendar></div>\n',
		"mod.js": `"use strict";
(() => {
	function chips(b) {
		var out = '<button type="button" class="modded-step" data-nav="prev">&lt;</button>';
		out += '<span class="modded-title" data-title>' + (b.title || '') + '</span>';
		out += '<button type="button" class="modded-step" data-nav="next">&gt;</button>';
		out += '<div class="modded-list" data-body>';
		var weeks = b.weeks || [];
		for (var w = 0; w < weeks.length; w++) {
			var days = weeks[w].days || [];
			for (var d = 0; d < days.length; d++) {
				var day = days[d];
				if (day.blank) continue;
				var attrs = ' data-date="' + day.date + '" tabindex="' + (day.focused ? '0' : '-1') + '"';
				attrs += ' aria-label="' + day.label + '"';
				attrs += ' aria-selected="' + (day.selected ? 'true' : 'false') + '"';
				if (day.disabled) attrs += ' aria-disabled="true"';
				if (day.preview) attrs += ' data-preview';
				var dots = (day.dots || []).length ? '<i class="modded-flag">!</i>' : '';
				out += '<button type="button" class="modded-chip"' + attrs + '>' + day.day + dots + '</button>';
			}
		}
		return out + '</div>';
	}
	hooks.fragment.mount("calendar", (b, ops) => {
		ops.replaceChildren("[data-calendar]", chips(b));
	});
	hooks.fragment.update("calendar", (b, ops) => {
		ops.replaceChildren("[data-calendar]", chips(b));
	});
})();
`,
	},
};

type CalendarEl = HTMLElement & {
	value: string;
	month: string;
	decorations: Record<string, { dots?: string[] }>;
	focusDay(iso?: string): void;
};

beforeAll(async () => {
	await loadFill(chipMod.manifest, chipMod.fragmentSources);
});

afterEach(() => {
	document.body.innerHTML = "";
});

function make(attrs: Record<string, string> = {}): CalendarEl {
	const el = document.createElement("xtyle-calendar") as CalendarEl;
	for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
	document.body.appendChild(el);
	return el;
}

const chip = (el: HTMLElement, iso: string): HTMLElement => el.querySelector<HTMLElement>(`[data-date="${iso}"]`)!;

function press(target: HTMLElement, key: string): KeyboardEvent {
	const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
	target.dispatchEvent(event);
	return event;
}

describe("a mod reshapes the month grid", () => {
	it("registers behind xtyle's own fill, which the app never had to load", () => {
		const names = loadedFillNames();
		expect(names.indexOf(manifest.name)).toBeGreaterThanOrEqual(0);
		expect(names.indexOf(manifest.name)).toBeLessThan(names.indexOf(chipMod.manifest.name));
	});

	it("replaces the table outright, leaving no grid behind", () => {
		const el = make({ month: "2026-07", "first-day-of-week": "0" });
		expect(el.querySelector("table")).toBeNull();
		expect(el.querySelector('[role="grid"]')).toBeNull();
		expect(el.querySelector(".xtyle-calendar__weekday")).toBeNull();
		expect(el.querySelectorAll(".modded-chip").length).toBe(35);
	});

	it("keeps the keyboard grid driving the cursor across weeks and months", () => {
		const el = make({ month: "2026-07", "first-day-of-week": "0" });
		el.focusDay("2026-07-15");
		press(chip(el, "2026-07-15"), "ArrowDown");
		expect(el.querySelector('[data-date][tabindex="0"]')!.getAttribute("data-date")).toBe("2026-07-22");
		press(chip(el, "2026-07-22"), "PageDown");
		expect(el.month).toBe("2026-08");
		expect(el.querySelector('[data-date][tabindex="0"]')!.getAttribute("data-date")).toBe("2026-08-22");
	});

	it("keeps the range machine and its preview under the reskin", () => {
		const el = make({ month: "2026-07", mode: "range" });
		chip(el, "2026-07-06").click();
		expect(el.value).toBe("2026-07-06");
		chip(el, "2026-07-06").focus();
		press(chip(el, "2026-07-06"), "ArrowRight");
		expect(el.querySelectorAll("[data-preview]")).toHaveLength(2);
		chip(el, "2026-07-09").click();
		expect(el.value).toBe("2026-07-06,2026-07-09");
		expect(chip(el, "2026-07-08").getAttribute("aria-selected")).toBe("true");
	});

	it("keeps the month steps working off the mod's own chrome", () => {
		const el = make({ month: "2026-07" });
		el.querySelector<HTMLElement>('[data-nav="next"]')!.click();
		expect(el.month).toBe("2026-08");
		expect(el.querySelector(".modded-title")!.textContent).toContain("August");
	});

	it("still refuses a disabled day, and still hands the mod its decorations", () => {
		const el = make({ month: "2026-07", "disabled-dates": "2026-07-09" });
		el.decorations = { "2026-07-16": { dots: ["accent"] } };
		chip(el, "2026-07-09").click();
		expect(el.value).toBe("");
		expect(chip(el, "2026-07-16").querySelector(".modded-flag")).not.toBeNull();
	});
});
