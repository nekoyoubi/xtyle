import { describe, expect, it } from "vitest";
import { renderFragmentLight } from "../src/elements/fragment-ssr.js";
import {
	addDays,
	addMonths,
	calendarBindings,
	clampDate,
	compareDates,
	dayNumeral,
	daysInMonth,
	formatCalendarValue,
	isDayDisabled,
	isSelectionComplete,
	monthTitle,
	parseCalendarValue,
	parseIso,
	parseMonth,
	resolveWeekInfo,
	selectDate,
	startOfWeek,
	toIso,
	toMonthKey,
	todayIn,
	weekNumber,
	weekdayNames,
	weekdayOf,
} from "../src/markup/calendar.js";

describe("civil dates are wall-clock, not instants", () => {
	// The bug this suite exists to prevent: a local-midnight `new Date(y, m, d)` in a zone that
	// springs forward at midnight lands on 23:00 the previous day, so "add a day" silently loses one.
	it("crosses the US spring-forward boundary without drifting", () => {
		const before = parseIso("2026-03-07")!;
		expect(toIso(addDays(before, 1))).toBe("2026-03-08");
		expect(toIso(addDays(before, 2))).toBe("2026-03-09");
		expect(toIso(addDays(parseIso("2026-03-08")!, 1))).toBe("2026-03-09");
	});

	it("crosses the fall-back boundary without repeating a day", () => {
		expect(toIso(addDays(parseIso("2026-11-01")!, 1))).toBe("2026-11-02");
		expect(toIso(addDays(parseIso("2026-10-31")!, 2))).toBe("2026-11-02");
	});

	it("crosses a southern-hemisphere DST boundary too (Australia, October)", () => {
		expect(toIso(addDays(parseIso("2026-10-04")!, 1))).toBe("2026-10-05");
	});

	it("walks a whole leap-year February day by day and lands on March 1", () => {
		let date = parseIso("2028-02-27")!;
		const seen: string[] = [];
		for (let i = 0; i < 4; i++) {
			date = addDays(date, 1);
			seen.push(toIso(date));
		}
		expect(seen).toEqual(["2028-02-28", "2028-02-29", "2028-03-01", "2028-03-02"]);
	});

	it("steps months by clamping the day into the target month", () => {
		expect(toIso(addMonths(parseIso("2026-01-31")!, 1))).toBe("2026-02-28");
		expect(toIso(addMonths(parseIso("2028-01-31")!, 1))).toBe("2028-02-29");
		expect(toIso(addMonths(parseIso("2026-03-15")!, -3))).toBe("2025-12-15");
		expect(toIso(addMonths(parseIso("2026-07-14")!, 12))).toBe("2027-07-14");
	});

	it("knows each month's length, leap years included", () => {
		expect(daysInMonth(2026, 2)).toBe(28);
		expect(daysInMonth(2028, 2)).toBe(29);
		expect(daysInMonth(2100, 2)).toBe(28);
		expect(daysInMonth(2026, 7)).toBe(31);
	});

	it("reads a weekday off the UTC carrier, so no zone can shift it", () => {
		expect(weekdayOf(parseIso("2026-07-14")!)).toBe(2);
		expect(weekdayOf(parseIso("2026-03-08")!)).toBe(0);
	});

	it("resolves today as a wall-clock date in the named zone", () => {
		const today = todayIn("UTC");
		expect(toIso(today)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		expect(toIso(todayIn())).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});
});

describe("iso parsing", () => {
	it("rejects a day that does not exist", () => {
		expect(parseIso("2026-02-30")).toBeNull();
		expect(parseIso("2026-13-01")).toBeNull();
		expect(parseIso("2026-00-10")).toBeNull();
		expect(parseIso("not-a-date")).toBeNull();
		expect(parseIso(null)).toBeNull();
	});

	it("round-trips a real day", () => {
		expect(toIso(parseIso("2026-07-04")!)).toBe("2026-07-04");
		expect(toMonthKey(parseIso("2026-07-04")!)).toBe("2026-07");
		expect(parseMonth("2026-07")).toEqual({ year: 2026, month: 7, day: 1 });
		expect(parseMonth("2026-99")).toBeNull();
	});

	it("orders and clamps", () => {
		expect(compareDates(parseIso("2026-01-01")!, parseIso("2026-01-02")!)).toBeLessThan(0);
		expect(toIso(clampDate(parseIso("2026-01-01")!, parseIso("2026-02-01")!, null))).toBe("2026-02-01");
		expect(toIso(clampDate(parseIso("2026-12-31")!, null, parseIso("2026-06-30")!))).toBe("2026-06-30");
		expect(toIso(clampDate(parseIso("2026-03-03")!, parseIso("2026-01-01")!, parseIso("2026-12-31")!))).toBe("2026-03-03");
	});
});

describe("locale week rules", () => {
	it("starts the week where the locale says, never a hardcoded Sunday", () => {
		expect(resolveWeekInfo("en-US").firstDay).toBe(0);
		expect(resolveWeekInfo("en-GB").firstDay).toBe(1);
		expect(resolveWeekInfo("fr-FR").firstDay).toBe(1);
	});

	it("falls back to ISO-8601 when the locale is unresolvable", () => {
		const info = resolveWeekInfo("!!not-a-locale!!");
		expect(info.firstDay).toBe(1);
		expect(info.minimalDays).toBe(4);
	});

	it("finds the start of the week under either week start", () => {
		// 2026-07-14 is a Tuesday
		expect(toIso(startOfWeek(parseIso("2026-07-14")!, 1))).toBe("2026-07-13");
		expect(toIso(startOfWeek(parseIso("2026-07-14")!, 0))).toBe("2026-07-12");
	});

	it("numbers weeks per ISO-8601 at the turn of the year", () => {
		// 2026-01-01 is a Thursday, so its week (starting Mon 2025-12-29) is week 1 of 2026
		expect(weekNumber(parseIso("2025-12-29")!, 1, 4)).toBe(1);
		expect(weekNumber(parseIso("2026-01-01")!, 1, 4)).toBe(1);
		// 2026 starts on a Thursday, so it runs to 53 weeks; 2027-01-01 (a Friday) is still in it
		expect(weekNumber(parseIso("2027-01-01")!, 1, 4)).toBe(53);
		expect(weekNumber(parseIso("2026-07-14")!, 1, 4)).toBe(29);
	});

	it("names the months and weekdays through Intl, rotated to the week start", () => {
		expect(monthTitle("en-US", parseIso("2026-07-01")!)).toBe("July 2026");
		expect(weekdayNames("en-US", 0, "short")[0]!.long).toBe("Sunday");
		expect(weekdayNames("en-GB", 1, "short")[0]!.long).toBe("Monday");
		expect(weekdayNames("en-US", 0, "narrow")[0]!.short).toBe("S");
		expect(dayNumeral("en-US", parseIso("2026-07-04")!)).toBe("4");
	});
});

describe("selection", () => {
	it("parses and formats a value per mode", () => {
		expect(parseCalendarValue("2026-07-04,2026-07-01", "multiple")).toEqual(["2026-07-01", "2026-07-04"]);
		expect(parseCalendarValue("2026-07-04,2026-07-01", "single")).toEqual(["2026-07-01"]);
		expect(parseCalendarValue("2026-07-01,2026-07-04,2026-07-09", "range")).toEqual(["2026-07-01", "2026-07-04"]);
		expect(parseCalendarValue("garbage,2026-07-04", "single")).toEqual(["2026-07-04"]);
		expect(parseCalendarValue(null, "single")).toEqual([]);
		expect(formatCalendarValue(["2026-07-01", "2026-07-04"])).toBe("2026-07-01,2026-07-04");
	});

	it("single replaces, and re-picking the selected day is a no-op rather than a surprise clear", () => {
		expect(selectDate([], "2026-07-04", "single")).toEqual(["2026-07-04"]);
		expect(selectDate(["2026-07-01"], "2026-07-04", "single")).toEqual(["2026-07-04"]);
		expect(selectDate(["2026-07-04"], "2026-07-04", "single")).toEqual(["2026-07-04"]);
	});

	it("multiple toggles a day in and out of the set", () => {
		expect(selectDate(["2026-07-04"], "2026-07-01", "multiple")).toEqual(["2026-07-01", "2026-07-04"]);
		expect(selectDate(["2026-07-01", "2026-07-04"], "2026-07-04", "multiple")).toEqual(["2026-07-01"]);
	});

	it("range opens, closes ordered (even picked backwards), and reopens", () => {
		expect(selectDate([], "2026-07-10", "range")).toEqual(["2026-07-10"]);
		expect(selectDate(["2026-07-10"], "2026-07-14", "range")).toEqual(["2026-07-10", "2026-07-14"]);
		expect(selectDate(["2026-07-10"], "2026-07-04", "range")).toEqual(["2026-07-04", "2026-07-10"]);
		expect(selectDate(["2026-07-04", "2026-07-10"], "2026-07-20", "range")).toEqual(["2026-07-20"]);
	});

	it("knows when a range is closed", () => {
		expect(isSelectionComplete(["2026-07-10"], "range")).toBe(false);
		expect(isSelectionComplete(["2026-07-10", "2026-07-14"], "range")).toBe(true);
		expect(isSelectionComplete(["2026-07-10"], "single")).toBe(true);
	});

	it("refuses days by bound, by list, and by predicate", () => {
		const limits = {
			min: "2026-07-05",
			max: "2026-07-20",
			disabledDates: ["2026-07-09"],
			isDateDisabled: (iso: string) => iso.endsWith("-13"),
		};
		expect(isDayDisabled("2026-07-04", limits)).toBe(true);
		expect(isDayDisabled("2026-07-21", limits)).toBe(true);
		expect(isDayDisabled("2026-07-09", limits)).toBe(true);
		expect(isDayDisabled("2026-07-13", limits)).toBe(true);
		expect(isDayDisabled("2026-07-10", limits)).toBe(false);
	});
});

describe("calendarBindings", () => {
	const base = { uid: "cal", month: "2026-07", locale: "en-US", today: "2026-07-14" };

	it("lays a month out in whole weeks from the locale's first day", () => {
		const bindings = calendarBindings({ ...base, firstDay: 0 });
		expect(bindings.weeks[0]!.days).toHaveLength(7);
		// July 2026 starts on a Wednesday; a Sunday-start grid opens on June 28
		expect(bindings.weeks[0]!.days[0]!.date).toBe("2026-06-28");
		expect(bindings.weeks[0]!.days[0]!.outside).toBe(true);
		expect(bindings.weeks[0]!.days[3]!.date).toBe("2026-07-01");
		expect(bindings.weeks).toHaveLength(5);
	});

	it("shifts the whole grid when the week starts on Monday", () => {
		const bindings = calendarBindings({ ...base, firstDay: 1 });
		expect(bindings.weeks[0]!.days[0]!.date).toBe("2026-06-29");
		expect(bindings.weekdays[0]!.long).toBe("Monday");
	});

	it("pads to six rows under fixedWeeks, so the grid never changes height", () => {
		expect(calendarBindings({ ...base, firstDay: 0, fixedWeeks: true }).weeks).toHaveLength(6);
		// February 2026 opens on a Sunday and runs 28 days: exactly four rows, two short of July's five
		expect(calendarBindings({ ...base, month: "2026-02", firstDay: 0 }).weeks).toHaveLength(4);
		expect(calendarBindings({ ...base, month: "2026-02", firstDay: 0, fixedWeeks: true }).weeks).toHaveLength(6);
	});

	it("blanks the adjacent-month days when asked, keeping seven cells per row", () => {
		const bindings = calendarBindings({ ...base, firstDay: 0, outsideDays: false });
		expect(bindings.weeks[0]!.days[0]!.blank).toBe(true);
		expect(bindings.weeks[0]!.days).toHaveLength(7);
		expect(bindings.weeks[0]!.days[3]!.blank).toBeUndefined();
	});

	it("marks today, the weekend, and the selection", () => {
		const bindings = calendarBindings({ ...base, firstDay: 0, selected: ["2026-07-04"], mode: "single" });
		const days = bindings.weeks.flatMap((week) => week.days);
		expect(days.find((d) => d.date === "2026-07-14")!.today).toBe(true);
		expect(days.find((d) => d.date === "2026-07-04")!.selected).toBe(true);
		expect(days.find((d) => d.date === "2026-07-04")!.weekend).toBe(true);
		expect(days.find((d) => d.date === "2026-07-06")!.weekend).toBeUndefined();
	});

	it("bands a closed range and marks its two ends", () => {
		const bindings = calendarBindings({
			...base,
			firstDay: 0,
			mode: "range",
			selected: ["2026-07-06", "2026-07-09"],
		});
		const days = bindings.weeks.flatMap((week) => week.days);
		expect(days.find((d) => d.date === "2026-07-06")!.start).toBe(true);
		expect(days.find((d) => d.date === "2026-07-09")!.end).toBe(true);
		expect(days.filter((d) => d.inRange).map((d) => d.date)).toEqual([
			"2026-07-06",
			"2026-07-07",
			"2026-07-08",
			"2026-07-09",
		]);
		expect(days.find((d) => d.date === "2026-07-10")!.inRange).toBeUndefined();
	});

	it("previews the pending half of a range under the hovered day — in either direction", () => {
		const forward = calendarBindings({
			...base,
			firstDay: 0,
			mode: "range",
			selected: ["2026-07-06"],
			hoverDate: "2026-07-08",
		});
		const days = forward.weeks.flatMap((week) => week.days);
		expect(days.filter((d) => d.preview).map((d) => d.date)).toEqual(["2026-07-06", "2026-07-07", "2026-07-08"]);
		expect(days.find((d) => d.date === "2026-07-08")!.previewEdge).toBe(true);

		const backward = calendarBindings({
			...base,
			firstDay: 0,
			mode: "range",
			selected: ["2026-07-06"],
			hoverDate: "2026-07-04",
		});
		expect(backward.weeks.flatMap((w) => w.days).filter((d) => d.preview).map((d) => d.date)).toEqual([
			"2026-07-04",
			"2026-07-05",
			"2026-07-06",
		]);
	});

	it("previews off the keyboard cursor when there is no pointer, so the preview is not mouse-only", () => {
		const bindings = calendarBindings({
			...base,
			firstDay: 0,
			mode: "range",
			selected: ["2026-07-06"],
			focusDate: "2026-07-07",
		});
		expect(bindings.weeks.flatMap((w) => w.days).filter((d) => d.preview).map((d) => d.date)).toEqual([
			"2026-07-06",
			"2026-07-07",
		]);
	});

	it("disables days by bound, list, and predicate, and disables the steps at the edge of the range", () => {
		const bindings = calendarBindings({
			...base,
			firstDay: 0,
			min: "2026-07-05",
			max: "2026-07-20",
			disabledDates: ["2026-07-09"],
			isDateDisabled: (iso) => iso === "2026-07-13",
		});
		const days = bindings.weeks.flatMap((week) => week.days);
		expect(days.find((d) => d.date === "2026-07-04")!.disabled).toBe(true);
		expect(days.find((d) => d.date === "2026-07-09")!.disabled).toBe(true);
		expect(days.find((d) => d.date === "2026-07-13")!.disabled).toBe(true);
		expect(days.find((d) => d.date === "2026-07-10")!.disabled).toBeUndefined();
		expect(bindings.prevDisabled).toBe(true);
		expect(bindings.nextDisabled).toBe(true);
	});

	it("hangs decorations on a day and folds their label into its announcement", () => {
		const bindings = calendarBindings({
			...base,
			firstDay: 0,
			decorations: { "2026-07-16": { dots: ["accent", "success"], busy: true, label: "2 events" } },
		});
		const day = bindings.weeks.flatMap((week) => week.days).find((d) => d.date === "2026-07-16")!;
		expect(day.dots).toEqual(["accent", "success"]);
		expect(day.busy).toBe(true);
		expect(day.label).toBe("Thursday, July 16, 2026, 2 events");
	});

	it("numbers the weeks when asked", () => {
		const bindings = calendarBindings({ ...base, firstDay: 1, weekNumbers: true, minimalDays: 4 });
		expect(bindings.weeks[0]!.number).toBe("27");
		expect(bindings.weekNumbers).toBe(true);
	});

	it("renders to real light-DOM markup at build time, before any script loads", async () => {
		const html = await renderFragmentLight(
			"calendar",
			calendarBindings({
				...base,
				firstDay: 0,
				mode: "range",
				selected: ["2026-07-06", "2026-07-09"],
			}) as unknown as Record<string, unknown>,
		);
		expect(html).toContain('role="grid"');
		expect(html).toContain('aria-labelledby="cal-title"');
		expect(html).toContain(">July 2026<");
		expect(html).toContain('abbr="Sunday"');
		expect(html).toContain('data-date="2026-07-04"');
		expect(html).toContain('aria-label="Saturday, July 4, 2026"');
		expect(html).toContain("data-range-start");
		expect(html).toContain("data-in-range");
		expect(html).toContain('data-nav="prev"');
	});

	it("localizes the title and day numerals without a locale table", () => {
		expect(calendarBindings({ ...base, locale: "fr-FR", firstDay: 1 }).title).toBe("juillet 2026");
		const arabic = calendarBindings({ ...base, locale: "ar-EG", firstDay: 6 });
		expect(arabic.weeks[0]!.days.some((d) => /[٠-٩]/.test(d.day))).toBe(true);
	});
});
