// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import "../src/elements/calendar.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { manifest, fragmentSources } from "../src/elements/fragments/calendar/source.generated.js";

type CalendarEl = HTMLElement & {
	value: string;
	dates: string[];
	month: string;
	mode: "single" | "multiple" | "range";
	decorations: Record<string, { dots?: string[]; busy?: boolean; label?: string }>;
	isDateDisabled?: (iso: string) => boolean;
	focusDay(iso?: string): void;
};

beforeAll(async () => {
	await loadFill(manifest, fragmentSources);
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

const cell = (el: HTMLElement, iso: string): HTMLElement => el.querySelector<HTMLElement>(`[data-date="${iso}"]`)!;
const cells = (el: HTMLElement): HTMLElement[] => [...el.querySelectorAll<HTMLElement>("[data-date]")];
const focused = (el: HTMLElement): string | null =>
	el.querySelector<HTMLElement>('[data-date][tabindex="0"]')?.getAttribute("data-date") ?? null;

function press(target: HTMLElement, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
	const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init });
	target.dispatchEvent(event);
	return event;
}

function hover(target: HTMLElement): void {
	target.dispatchEvent(new Event("pointerover", { bubbles: true }));
}

describe("the month grid", () => {
	it("renders a labelled grid of gridcells with the month as its name", () => {
		const el = make({ month: "2026-07", locale: "en-US", "first-day-of-week": "0" });
		const grid = el.querySelector('[role="grid"]')!;
		const title = el.querySelector(".xtyle-calendar__title")!;
		expect(grid.getAttribute("aria-labelledby")).toBe(title.id);
		expect(title.textContent).toBe("July 2026");
		expect(title.getAttribute("aria-live")).toBe("polite");
		expect(cells(el).length).toBe(35);
		expect(cells(el)[0]!.getAttribute("data-date")).toBe("2026-06-28");
	});

	it("names every day in full, so a screen reader never reads a bare numeral", () => {
		const el = make({ month: "2026-07", locale: "en-US" });
		expect(cell(el, "2026-07-01").getAttribute("aria-label")).toBe("Wednesday, July 1, 2026");
		expect(cell(el, "2026-07-01").querySelector(".xtyle-calendar__num")!.textContent).toBe("1");
	});

	it("starts the week where the locale says", () => {
		const us = make({ month: "2026-07", locale: "en-US" });
		expect(us.querySelector(".xtyle-calendar__weekday")!.getAttribute("abbr")).toBe("Sunday");
		document.body.innerHTML = "";
		const gb = make({ month: "2026-07", locale: "en-GB" });
		expect(gb.querySelector(".xtyle-calendar__weekday")!.getAttribute("abbr")).toBe("Monday");
	});

	it("lets a consumer override the first day of the week outright", () => {
		const el = make({ month: "2026-07", locale: "en-US", "first-day-of-week": "1" });
		expect(el.querySelector(".xtyle-calendar__weekday")!.getAttribute("abbr")).toBe("Monday");
		expect(cells(el)[0]!.getAttribute("data-date")).toBe("2026-06-29");
	});

	it("steps the month with the nav, announcing the new one in the live title", () => {
		const el = make({ month: "2026-07" });
		const months: string[] = [];
		el.addEventListener("month-change", (event) => months.push((event as CustomEvent<{ month: string }>).detail.month));
		el.querySelector<HTMLElement>('[data-nav="next"]')!.click();
		expect(el.month).toBe("2026-08");
		expect(el.querySelector(".xtyle-calendar__title")!.textContent).toContain("August");
		el.querySelector<HTMLElement>('[data-nav="prev"]')!.click();
		el.querySelector<HTMLElement>('[data-nav="prev"]')!.click();
		expect(el.month).toBe("2026-06");
		expect(months).toEqual(["2026-08", "2026-07", "2026-06"]);
	});

	it("disables a month step that would leave the min/max window", () => {
		const el = make({ month: "2026-07", min: "2026-07-01", max: "2026-07-31" });
		expect(el.querySelector('[data-nav="prev"]')!.getAttribute("aria-disabled")).toBe("true");
		expect(el.querySelector('[data-nav="next"]')!.getAttribute("aria-disabled")).toBe("true");
		el.querySelector<HTMLElement>('[data-nav="next"]')!.click();
		expect(el.month).toBe("2026-07");
	});

	it("numbers the weeks as row headers when asked", () => {
		const el = make({ month: "2026-07", locale: "en-GB", "week-numbers": "" });
		const first = el.querySelector<HTMLElement>('.xtyle-calendar__weeknum[role="rowheader"]')!;
		expect(first.textContent).toBe("27");
	});
});

describe("selecting", () => {
	it("picks a single day and reports it", () => {
		const el = make({ month: "2026-07", mode: "single" });
		const changes: Array<Record<string, unknown>> = [];
		el.addEventListener("change", (event) => changes.push((event as CustomEvent).detail));
		cell(el, "2026-07-04").click();
		expect(el.value).toBe("2026-07-04");
		expect(cell(el, "2026-07-04").getAttribute("aria-selected")).toBe("true");
		expect(changes).toEqual([
			{ mode: "single", value: "2026-07-04", dates: ["2026-07-04"], start: null, end: null, complete: true },
		]);
	});

	it("toggles a set of days in multiple mode", () => {
		const el = make({ month: "2026-07", mode: "multiple" });
		cell(el, "2026-07-04").click();
		cell(el, "2026-07-06").click();
		expect(el.dates).toEqual(["2026-07-04", "2026-07-06"]);
		cell(el, "2026-07-04").click();
		expect(el.dates).toEqual(["2026-07-06"]);
	});

	it("draws a range in two picks, ordering it however it was drawn", () => {
		const el = make({ month: "2026-07", mode: "range" });
		const changes: Array<{ complete: boolean; start: string | null; end: string | null }> = [];
		el.addEventListener("change", (event) => changes.push((event as CustomEvent).detail));
		cell(el, "2026-07-10").click();
		expect(changes[0]).toMatchObject({ start: "2026-07-10", end: null, complete: false });
		cell(el, "2026-07-06").click();
		expect(changes[1]).toMatchObject({ start: "2026-07-06", end: "2026-07-10", complete: true });
		expect(el.value).toBe("2026-07-06,2026-07-10");
		expect(cell(el, "2026-07-08").hasAttribute("data-in-range")).toBe(true);
		expect(cell(el, "2026-07-06").hasAttribute("data-range-start")).toBe(true);
		expect(cell(el, "2026-07-10").hasAttribute("data-range-end")).toBe(true);
	});

	it("previews the pending half of a range under the pointer, and drops it on leave", () => {
		const el = make({ month: "2026-07", mode: "range" });
		cell(el, "2026-07-06").click();
		hover(cell(el, "2026-07-09"));
		expect(cells(el).filter((c) => c.hasAttribute("data-preview")).map((c) => c.getAttribute("data-date"))).toEqual([
			"2026-07-06",
			"2026-07-07",
			"2026-07-08",
			"2026-07-09",
		]);
		expect(cell(el, "2026-07-09").hasAttribute("data-preview-edge")).toBe(true);
		el.dispatchEvent(new Event("pointerleave"));
		expect(el.querySelectorAll("[data-preview]")).toHaveLength(0);
	});

	it("previews under the keyboard cursor too, so the preview is not mouse-only", () => {
		const el = make({ month: "2026-07", mode: "range" });
		cell(el, "2026-07-06").click();
		cell(el, "2026-07-06").focus();
		press(cell(el, "2026-07-06"), "ArrowRight");
		press(cell(el, "2026-07-07"), "ArrowRight");
		expect(cells(el).filter((c) => c.hasAttribute("data-preview")).map((c) => c.getAttribute("data-date"))).toEqual([
			"2026-07-06",
			"2026-07-07",
			"2026-07-08",
		]);
	});

	it("cancels a half-drawn range on Escape", () => {
		const el = make({ month: "2026-07", mode: "range" });
		cell(el, "2026-07-06").click();
		const target = cell(el, "2026-07-06");
		target.focus();
		const event = press(target, "Escape");
		expect(event.defaultPrevented).toBe(true);
		expect(el.value).toBe("");
		expect(el.querySelectorAll('[aria-selected="true"]')).toHaveLength(0);
	});

	it("picking an adjacent-month day steps the grid onto its month", () => {
		const el = make({ month: "2026-07", "first-day-of-week": "0" });
		cell(el, "2026-06-30").click();
		expect(el.value).toBe("2026-06-30");
		expect(el.month).toBe("2026-06");
	});

	it("refuses a disabled day by bound, by list, and by predicate — and keeps it focusable", () => {
		const el = make({ month: "2026-07", min: "2026-07-05", "disabled-dates": "2026-07-09" });
		el.isDateDisabled = (iso) => iso === "2026-07-13";
		el.focusDay("2026-07-10");
		expect(cell(el, "2026-07-04").getAttribute("aria-disabled")).toBe("true");
		expect(cell(el, "2026-07-09").getAttribute("aria-disabled")).toBe("true");
		expect(cell(el, "2026-07-13").getAttribute("aria-disabled")).toBe("true");
		cell(el, "2026-07-09").click();
		expect(el.value).toBe("");
		// still reachable by keyboard: the cursor passes over it rather than skipping the square
		expect(cell(el, "2026-07-09").hasAttribute("tabindex")).toBe(true);
	});

	it("never selects while readonly, but still navigates", () => {
		const el = make({ month: "2026-07", readonly: "", value: "2026-07-04" });
		cell(el, "2026-07-06").click();
		expect(el.value).toBe("2026-07-04");
		expect(el.querySelector('[role="grid"]')!.getAttribute("aria-readonly")).toBe("true");
		el.querySelector<HTMLElement>('[data-nav="next"]')!.click();
		expect(el.month).toBe("2026-08");
	});

	it("is wholly inert when disabled — no tab stop, no steps, no picks", () => {
		const el = make({ month: "2026-07", disabled: "" });
		expect(focused(el)).toBeNull();
		expect(el.querySelector('[data-nav="prev"]')!.getAttribute("aria-disabled")).toBe("true");
		cell(el, "2026-07-06").click();
		expect(el.value).toBe("");
	});
});

describe("the keyboard grid", () => {
	function grid(): CalendarEl {
		const el = make({ month: "2026-07", locale: "en-US", "first-day-of-week": "0" });
		el.focusDay("2026-07-15");
		return el;
	}

	const cursor = (el: CalendarEl): string | null => focused(el);

	it("walks days and weeks with the arrows", () => {
		const el = grid();
		press(cell(el, "2026-07-15"), "ArrowRight");
		expect(cursor(el)).toBe("2026-07-16");
		press(cell(el, "2026-07-16"), "ArrowLeft");
		press(cell(el, "2026-07-15"), "ArrowDown");
		expect(cursor(el)).toBe("2026-07-22");
		press(cell(el, "2026-07-22"), "ArrowUp");
		expect(cursor(el)).toBe("2026-07-15");
	});

	it("crosses the week boundary, and the month boundary, without stopping", () => {
		const el = make({ month: "2026-07", "first-day-of-week": "0" });
		el.focusDay("2026-07-01");
		press(cell(el, "2026-07-01"), "ArrowLeft");
		expect(cursor(el)).toBe("2026-06-30");
		expect(el.month).toBe("2026-06");
		el.focusDay("2026-06-30");
		press(cell(el, "2026-06-30"), "ArrowDown");
		expect(cursor(el)).toBe("2026-07-07");
		expect(el.month).toBe("2026-07");
	});

	it("snaps to the week's edges with Home and End, honoring the week start", () => {
		const el = grid();
		press(cell(el, "2026-07-15"), "Home");
		expect(cursor(el)).toBe("2026-07-12");
		press(cell(el, "2026-07-12"), "End");
		expect(cursor(el)).toBe("2026-07-18");
	});

	it("steps months with PageUp/PageDown, and years with Shift", () => {
		const el = grid();
		press(cell(el, "2026-07-15"), "PageDown");
		expect(cursor(el)).toBe("2026-08-15");
		expect(el.month).toBe("2026-08");
		press(cell(el, "2026-08-15"), "PageUp");
		expect(el.month).toBe("2026-07");
		press(cell(el, "2026-07-15"), "PageDown", { shiftKey: true });
		expect(cursor(el)).toBe("2027-07-15");
		press(cell(el, "2027-07-15"), "PageUp", { shiftKey: true });
		expect(cursor(el)).toBe("2026-07-15");
	});

	it("selects with Enter and Space", () => {
		const el = grid();
		const enter = press(cell(el, "2026-07-15"), "Enter");
		expect(enter.defaultPrevented).toBe(true);
		expect(el.value).toBe("2026-07-15");
		press(cell(el, "2026-07-15"), "ArrowRight");
		press(cell(el, "2026-07-16"), " ");
		expect(el.value).toBe("2026-07-16");
	});

	it("clamps the cursor at min and max instead of wandering out of the window", () => {
		const el = make({ month: "2026-07", min: "2026-07-05", max: "2026-07-20" });
		el.focusDay("2026-07-05");
		press(cell(el, "2026-07-05"), "ArrowLeft");
		expect(cursor(el)).toBe("2026-07-05");
		el.focusDay("2026-07-20");
		press(cell(el, "2026-07-20"), "ArrowRight");
		expect(cursor(el)).toBe("2026-07-20");
	});

	it("keeps exactly one tab stop, and re-seats it on the equivalent cell after a repaint", () => {
		const el = grid();
		expect(el.querySelectorAll('[data-date][tabindex="0"]')).toHaveLength(1);
		cell(el, "2026-07-15").focus();
		press(cell(el, "2026-07-15"), "ArrowDown");
		expect(document.activeElement).toBe(cell(el, "2026-07-22"));
		expect(el.querySelectorAll('[data-date][tabindex="0"]')).toHaveLength(1);
	});

	it("seats the tab stop on the selected day, else today, else the first of the month", () => {
		const selected = make({ month: "2026-07", value: "2026-07-09" });
		expect(focused(selected)).toBe("2026-07-09");
		document.body.innerHTML = "";

		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-07-14T12:00:00Z"));
		const today = make({ month: "2026-07", timezone: "UTC" });
		expect(focused(today)).toBe("2026-07-14");
		document.body.innerHTML = "";

		// a month with neither a selection nor today in it opens on its first day
		const elsewhere = make({ month: "2026-09", timezone: "UTC" });
		expect(focused(elsewhere)).toBe("2026-09-01");
		vi.useRealTimers();
	});
});

describe("decorations", () => {
	it("draws a dot per event and a busy bar, as real elements", () => {
		const el = make({ month: "2026-07" });
		el.decorations = {
			"2026-07-16": { dots: ["accent", "success"], label: "2 events" },
			"2026-07-17": { busy: true, label: "fully booked" },
		};
		const dots = cell(el, "2026-07-16").querySelectorAll(".xtyle-calendar__dot");
		expect(dots).toHaveLength(2);
		expect(dots[1]!.getAttribute("data-tone")).toBe("success");
		expect(cell(el, "2026-07-17").querySelector(".xtyle-calendar__busy")).not.toBeNull();
	});

	it("announces a decoration through the day's name, so a mark is never visual-only", () => {
		const el = make({ month: "2026-07", locale: "en-US" });
		el.decorations = { "2026-07-16": { dots: ["accent"], label: "2 events" } };
		expect(cell(el, "2026-07-16").getAttribute("aria-label")).toBe("Thursday, July 16, 2026, 2 events");
	});

	it("takes decorations off the attribute as JSON, for the no-framework path", () => {
		const el = make({ month: "2026-07", decorations: '{"2026-07-16":{"busy":true}}' });
		expect(cell(el, "2026-07-16").querySelector(".xtyle-calendar__busy")).not.toBeNull();
	});
});

describe("timezone", () => {
	it("marks today from the wall clock of the zone it is pinned to", () => {
		vi.useFakeTimers();
		// 03:30 UTC on the 15th is still the 14th in New York — the calendar must mark the 14th
		vi.setSystemTime(new Date("2026-07-15T03:30:00Z"));
		const el = make({ month: "2026-07", timezone: "America/New_York" });
		expect(cell(el, "2026-07-14").hasAttribute("data-today")).toBe(true);
		expect(cell(el, "2026-07-15").hasAttribute("data-today")).toBe(false);
		expect(cell(el, "2026-07-14").getAttribute("aria-current")).toBe("date");
		document.body.innerHTML = "";
		const utc = make({ month: "2026-07", timezone: "UTC" });
		expect(cell(utc, "2026-07-15").hasAttribute("data-today")).toBe(true);
		vi.useRealTimers();
	});
});
