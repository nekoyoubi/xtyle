import { describe, expect, it } from "vitest";
// the calendar-math half is Calendar's module, consumed here rather than duplicated
import { addDays, addMonths, daysInMonth, weekdayOf, type CivilDate } from "../src/markup/calendar.js";
import {
	clampCivilValue,
	compareCivilValue,
	datePlaceholder,
	effectiveTimeBounds,
	formatDateDisplay,
	formatIsoValue,
	formatTimeDisplay,
	isWithinBounds,
	localeDateOrder,
	localeHour12,
	nudgeTime,
	parseDateText,
	parseDisabledDays,
	parseIsoValue,
	parseTimeText,
	resolveListStep,
	snapTimeToStep,
	stepShowsSeconds,
	timeListOptions,
} from "../src/markup/date-picker.js";

const today: CivilDate = { year: 2026, month: 7, day: 14 };

describe("calendar arithmetic is wall-clock, never instant", () => {
	it("steps across a spring-forward boundary without losing the day", () => {
		// 2026-03-08 is the US spring-forward date; an instant-based picker lands on 03-07T23:00 here
		expect(addDays({ year: 2026, month: 3, day: 7 }, 1)).toEqual({ year: 2026, month: 3, day: 8 });
		expect(addDays({ year: 2026, month: 3, day: 8 }, -1)).toEqual({ year: 2026, month: 3, day: 7 });
	});

	it("steps across a fall-back boundary without doubling the day", () => {
		expect(addDays({ year: 2026, month: 11, day: 1 }, 1)).toEqual({ year: 2026, month: 11, day: 2 });
	});

	it("never rolls a clock time into another day, even at the edges", () => {
		expect(nudgeTime({ hour: 23, minute: 45, second: 0 }, 1, 900)).toEqual({ hour: 23, minute: 59, second: 59 });
		expect(nudgeTime({ hour: 0, minute: 10, second: 0 }, -1, 900)).toEqual({ hour: 0, minute: 0, second: 0 });
	});

	it("steps a time through the DST gap hour unchanged — 01:30 + 1h is 02:30", () => {
		expect(nudgeTime({ hour: 1, minute: 30, second: 0 }, 1, 3600)).toEqual({ hour: 2, minute: 30, second: 0 });
	});

	it("crosses month and year boundaries", () => {
		expect(addDays({ year: 2026, month: 12, day: 31 }, 1)).toEqual({ year: 2027, month: 1, day: 1 });
		expect(addDays({ year: 2027, month: 1, day: 1 }, -1)).toEqual({ year: 2026, month: 12, day: 31 });
	});

	it("clamps the day when a month shift lands in a shorter month", () => {
		expect(addMonths({ year: 2026, month: 1, day: 31 }, 1)).toEqual({ year: 2026, month: 2, day: 28 });
		expect(addMonths({ year: 2024, month: 1, day: 31 }, 1)).toEqual({ year: 2024, month: 2, day: 29 });
		expect(addMonths({ year: 2026, month: 1, day: 15 }, -1)).toEqual({ year: 2025, month: 12, day: 15 });
	});

	it("knows leap Februaries", () => {
		expect(daysInMonth(2024, 2)).toBe(29);
		expect(daysInMonth(2026, 2)).toBe(28);
		expect(daysInMonth(2000, 2)).toBe(29);
		expect(daysInMonth(1900, 2)).toBe(28);
	});

	it("reports the weekday with Sunday at zero", () => {
		expect(weekdayOf({ year: 2026, month: 7, day: 12 })).toBe(0);
		expect(weekdayOf({ year: 2026, month: 7, day: 14 })).toBe(2);
	});
});

describe("canonical value parsing and formatting", () => {
	it("round-trips a date", () => {
		const value = parseIsoValue("2026-03-08", "date");
		expect(value?.date).toEqual({ year: 2026, month: 3, day: 8 });
		expect(formatIsoValue(value!, "date")).toBe("2026-03-08");
	});

	it("round-trips a time, keeping seconds only when they carry information", () => {
		expect(formatIsoValue(parseIsoValue("09:30", "time")!, "time")).toBe("09:30");
		expect(formatIsoValue(parseIsoValue("09:30:15", "time")!, "time")).toBe("09:30:15");
	});

	it("round-trips a datetime with no zone designator", () => {
		const value = parseIsoValue("2026-03-08T02:30", "datetime");
		expect(value).toEqual({ date: { year: 2026, month: 3, day: 8 }, time: { hour: 2, minute: 30, second: 0 } });
		expect(formatIsoValue(value!, "datetime")).toBe("2026-03-08T02:30");
	});

	it("rejects an offset or a Z rather than reinterpreting an instant as wall-clock", () => {
		expect(parseIsoValue("2026-03-08T02:30Z", "datetime")).toBeNull();
		expect(parseIsoValue("2026-03-08T02:30+01:00", "datetime")).toBeNull();
	});

	it("rejects an impossible calendar date", () => {
		expect(parseIsoValue("2026-02-30", "date")).toBeNull();
		expect(parseIsoValue("2026-13-01", "date")).toBeNull();
		expect(parseIsoValue("25:00", "time")).toBeNull();
	});

	it("treats an empty value as no value", () => {
		expect(parseIsoValue("", "date")).toBeNull();
		expect(parseIsoValue(null, "date")).toBeNull();
	});
});

describe("typed date parsing follows the locale's field order", () => {
	it("reads a US-order date", () => {
		expect(parseDateText("3/8/2026", { locale: "en-US", today })).toEqual({ year: 2026, month: 3, day: 8 });
	});

	it("reads a GB-order date — the same digits, the other date", () => {
		expect(parseDateText("3/8/2026", { locale: "en-GB", today })).toEqual({ year: 2026, month: 8, day: 3 });
	});

	it("accepts ISO input whatever the locale's own order is", () => {
		expect(parseDateText("2026-03-08", { locale: "en-US", today })).toEqual({ year: 2026, month: 3, day: 8 });
		expect(parseDateText("2026/3/8", { locale: "en-US", today })).toEqual({ year: 2026, month: 3, day: 8 });
	});

	it("accepts dots and dashes as separators", () => {
		expect(parseDateText("3.8.2026", { locale: "en-US", today })).toEqual({ year: 2026, month: 3, day: 8 });
		expect(parseDateText("3-8-2026", { locale: "en-US", today })).toEqual({ year: 2026, month: 3, day: 8 });
	});

	it("expands a two-digit year on a sliding window", () => {
		expect(parseDateText("3/8/26", { locale: "en-US", today })).toEqual({ year: 2026, month: 3, day: 8 });
		expect(parseDateText("3/8/99", { locale: "en-US", today })).toEqual({ year: 1999, month: 3, day: 8 });
	});

	it("fills this year when the year is left off", () => {
		expect(parseDateText("3/8", { locale: "en-US", today })).toEqual({ year: 2026, month: 3, day: 8 });
	});

	it("reads a bare number as a day in the current month", () => {
		expect(parseDateText("22", { locale: "en-US", today })).toEqual({ year: 2026, month: 7, day: 22 });
	});

	it("reads a bare eight-digit run as YYYYMMDD", () => {
		expect(parseDateText("20260308", { locale: "en-US", today })).toEqual({ year: 2026, month: 3, day: 8 });
	});

	it("returns null on a date that does not exist, rather than rolling it over", () => {
		expect(parseDateText("2/31/2026", { locale: "en-US", today })).toBeNull();
		expect(parseDateText("13/1/2026", { locale: "en-US", today })).toBeNull();
		expect(parseDateText("hello", { locale: "en-US", today })).toBeNull();
		expect(parseDateText("", { locale: "en-US", today })).toBeNull();
	});

	it("round-trips its own display output", () => {
		const date = { year: 2026, month: 3, day: 8 };
		for (const locale of ["en-US", "en-GB", "de-DE", "ja-JP"]) {
			const shown = formatDateDisplay(date, locale);
			expect(parseDateText(shown, { locale, today }), `${locale}: ${shown}`).toEqual(date);
		}
	});
});

describe("typed time parsing", () => {
	it("reads the compact forms", () => {
		expect(parseTimeText("9")).toEqual({ hour: 9, minute: 0, second: 0 });
		expect(parseTimeText("930")).toEqual({ hour: 9, minute: 30, second: 0 });
		expect(parseTimeText("0930")).toEqual({ hour: 9, minute: 30, second: 0 });
		expect(parseTimeText("1430")).toEqual({ hour: 14, minute: 30, second: 0 });
	});

	it("reads separated forms with and without seconds", () => {
		expect(parseTimeText("9:30")).toEqual({ hour: 9, minute: 30, second: 0 });
		expect(parseTimeText("9.30")).toEqual({ hour: 9, minute: 30, second: 0 });
		expect(parseTimeText("09:30:15")).toEqual({ hour: 9, minute: 30, second: 15 });
	});

	it("reads an AM/PM marker, including the bare letter", () => {
		expect(parseTimeText("9:30 pm")).toEqual({ hour: 21, minute: 30, second: 0 });
		expect(parseTimeText("9:30p")).toEqual({ hour: 21, minute: 30, second: 0 });
		expect(parseTimeText("9:30 am")).toEqual({ hour: 9, minute: 30, second: 0 });
	});

	it("gets the midnight and noon edges of a 12-hour clock right", () => {
		expect(parseTimeText("12:00 am")).toEqual({ hour: 0, minute: 0, second: 0 });
		expect(parseTimeText("12:00 pm")).toEqual({ hour: 12, minute: 0, second: 0 });
	});

	it("rejects a nonsense clock time", () => {
		expect(parseTimeText("25:00")).toBeNull();
		expect(parseTimeText("9:75")).toBeNull();
		expect(parseTimeText("13:00 pm")).toBeNull();
		expect(parseTimeText("later")).toBeNull();
	});

	it("round-trips its own display output on both dials", () => {
		const time = { hour: 21, minute: 30, second: 0 };
		for (const [locale, hour12] of [
			["en-US", true],
			["en-GB", false],
			["de-DE", false],
		] as const) {
			const shown = formatTimeDisplay(time, { locale, hour12 });
			expect(parseTimeText(shown, { locale }), `${locale}: ${shown}`).toEqual(time);
		}
	});
});

describe("locale posture", () => {
	it("reads the locale's numeric date order", () => {
		expect(localeDateOrder("en-US")).toEqual(["month", "day", "year"]);
		expect(localeDateOrder("en-GB")).toEqual(["day", "month", "year"]);
		expect(localeDateOrder("ja-JP")).toEqual(["year", "month", "day"]);
	});

	it("reads the locale's clock, rather than hardcoding one", () => {
		expect(localeHour12("en-US")).toBe(true);
		expect(localeHour12("en-GB")).toBe(false);
		expect(localeHour12("de-DE")).toBe(false);
	});

	it("shows the expected shape in the placeholder", () => {
		expect(datePlaceholder("en-US")).toBe("MM/DD/YYYY");
		expect(datePlaceholder("en-GB")).toBe("DD/MM/YYYY");
		expect(datePlaceholder("ja-JP")).toBe("YYYY/MM/DD");
	});
});

describe("step, snapping, and the popup time list", () => {
	it("shows seconds only for a sub-minute step, matching the native contract", () => {
		expect(stepShowsSeconds(60)).toBe(false);
		expect(stepShowsSeconds(900)).toBe(false);
		expect(stepShowsSeconds(30)).toBe(true);
		expect(stepShowsSeconds(1)).toBe(true);
	});

	it("snaps a time onto the step grid measured from midnight", () => {
		expect(snapTimeToStep({ hour: 9, minute: 37, second: 0 }, 900)).toEqual({ hour: 9, minute: 30, second: 0 });
		expect(snapTimeToStep({ hour: 9, minute: 38, second: 0 }, 900)).toEqual({ hour: 9, minute: 45, second: 0 });
	});

	it("floors the list at a quarter hour so a 60s step is not 1440 options", () => {
		expect(resolveListStep(60)).toBe(900);
		expect(resolveListStep(1800)).toBe(1800);
		expect(resolveListStep(60, 3600)).toBe(3600);
		expect(timeListOptions({ stepSeconds: 60 })).toHaveLength(96);
	});

	it("walks the list between the bounds", () => {
		const options = timeListOptions({
			stepSeconds: 3600,
			min: { hour: 9, minute: 0, second: 0 },
			max: { hour: 12, minute: 0, second: 0 },
		});
		expect(options.map((t) => t.hour)).toEqual([9, 10, 11, 12]);
	});
});

describe("bounds", () => {
	const min = parseIsoValue("2026-03-08", "date");
	const max = parseIsoValue("2026-03-20", "date");

	it("clamps a date into range", () => {
		expect(clampCivilValue(parseIsoValue("2026-01-01", "date")!, "date", min, max).date).toEqual({
			year: 2026,
			month: 3,
			day: 8,
		});
		expect(clampCivilValue(parseIsoValue("2026-12-01", "date")!, "date", min, max).date).toEqual({
			year: 2026,
			month: 3,
			day: 20,
		});
	});

	it("reports whether a value is in range", () => {
		expect(isWithinBounds(parseIsoValue("2026-03-10", "date")!, "date", min, max)).toBe(true);
		expect(isWithinBounds(parseIsoValue("2026-03-07", "date")!, "date", min, max)).toBe(false);
	});

	it("compares a datetime by both halves", () => {
		const a = parseIsoValue("2026-03-08T09:00", "datetime")!;
		const b = parseIsoValue("2026-03-08T17:00", "datetime")!;
		expect(compareCivilValue(a, b)).toBeLessThan(0);
	});

	it("applies a datetime's time bound only on the bounding day", () => {
		const lo = parseIsoValue("2026-03-08T09:00", "datetime");
		const hi = parseIsoValue("2026-03-20T17:00", "datetime");
		expect(effectiveTimeBounds({ year: 2026, month: 3, day: 8 }, "datetime", lo, hi).min).toEqual({
			hour: 9,
			minute: 0,
			second: 0,
		});
		// the day after the floor is open from midnight — the bug where Monday's 9am floors every Tuesday
		expect(effectiveTimeBounds({ year: 2026, month: 3, day: 9 }, "datetime", lo, hi).min).toBeNull();
		expect(effectiveTimeBounds({ year: 2026, month: 3, day: 20 }, "datetime", lo, hi).max).toEqual({
			hour: 17,
			minute: 0,
			second: 0,
		});
	});

	it("clamps a time-mode value into a business-hours window", () => {
		const lo = parseIsoValue("09:00", "time");
		const hi = parseIsoValue("17:00", "time");
		expect(clampCivilValue(parseIsoValue("07:30", "time")!, "time", lo, hi).time).toEqual({
			hour: 9,
			minute: 0,
			second: 0,
		});
		expect(clampCivilValue(parseIsoValue("22:00", "time")!, "time", lo, hi).time).toEqual({
			hour: 17,
			minute: 0,
			second: 0,
		});
	});
});

describe("disabled days", () => {
	it("parses a weekday list", () => {
		expect(parseDisabledDays("0,6")).toEqual([0, 6]);
		expect(parseDisabledDays("6 0 6")).toEqual([0, 6]);
		expect(parseDisabledDays("9,-1,x")).toEqual([]);
		expect(parseDisabledDays(null)).toEqual([]);
	});
});
