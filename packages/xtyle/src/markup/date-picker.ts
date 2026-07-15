/**
 * The date picker's value model, parser, and formatter — pure, DOM-free, and deliberately
 * **wall-clock, not instant**.
 *
 * A value here is a civil date and/or a civil time: the numbers a person would write on a
 * calendar or read off a clock. It carries no timezone and no offset, exactly like
 * `<input type="date">` / `<input type="time">` / `<input type="datetime-local">`. A birthday,
 * a due date, a 09:00 standup are civil facts; resolving one to an instant needs a timezone the
 * component does not have and must not guess.
 *
 * The practical consequence is that **no arithmetic here can cross a DST boundary**, because none
 * of it runs on instants:
 *
 * - Date math is integer math on `{ year, month, day }`, carried through `Date`'s *UTC* accessors
 *   (a fixed 86400s day, no offsets, no gaps). Stepping from 2026-03-07 to 2026-03-08 in a
 *   spring-forward zone yields 2026-03-08, never 2026-03-07T23:00.
 * - Time math is integer math on seconds-of-day in `[0, 86400)`. Stepping 01:30 → 02:30 yields
 *   02:30 even on a day when 02:30 does not exist as an instant locally, which is the honest
 *   answer for a wall-clock field.
 * - `Date` is used only to *format* (through `Intl`), always at a UTC noon anchor with
 *   `timeZone: "UTC"`, so the fields put in are the fields that come out. Local midnight is
 *   deliberately never constructed: some zones have skipped it (Brazil's old DST), which is a
 *   classic way for a picker to show the previous day.
 */

import { compareDates, daysInMonth, parseIso, toIso, type CivilDate } from "./calendar.js";

export type DatePickerMode = "date" | "time" | "datetime";

/** How the time field displays: follow the locale (default), or force a 12- or 24-hour clock. */
export type HourCyclePosture = "auto" | "12" | "24";

/** A clock time with no timezone or date. */
export interface CivilTime {
	hour: number;
	minute: number;
	second: number;
}

/** A picker value: the date half, the time half, or both, depending on `mode`. */
export interface CivilValue {
	date: CivilDate | null;
	time: CivilTime | null;
}

export const EMPTY_VALUE: CivilValue = { date: null, time: null };

/** The instant a civil date is formatted at: UTC noon, so no zone or DST rule can shift the fields. */
function utcAnchor(date: CivilDate | null, time: CivilTime | null): Date {
	const d = new Date(0);
	const base = date ?? { year: 2000, month: 1, day: 1 };
	d.setUTCFullYear(base.year, base.month - 1, base.day);
	if (time) d.setUTCHours(time.hour, time.minute, time.second, 0);
	else d.setUTCHours(12, 0, 0, 0);
	return d;
}

export function isValidDate(date: CivilDate): boolean {
	const { year, month, day } = date;
	if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
	if (month < 1 || month > 12 || day < 1) return false;
	return day <= daysInMonth(year, month);
}

export function isValidTime(time: CivilTime): boolean {
	const { hour, minute, second } = time;
	if (!Number.isInteger(hour) || !Number.isInteger(minute) || !Number.isInteger(second)) return false;
	return hour >= 0 && hour < 24 && minute >= 0 && minute < 60 && second >= 0 && second < 60;
}

export function secondsOfDay(time: CivilTime): number {
	return time.hour * 3600 + time.minute * 60 + time.second;
}

export function timeFromSeconds(seconds: number): CivilTime {
	const s = ((Math.round(seconds) % 86_400) + 86_400) % 86_400;
	return { hour: Math.floor(s / 3600), minute: Math.floor((s % 3600) / 60), second: s % 60 };
}

export function compareCivilTime(a: CivilTime, b: CivilTime): number {
	return secondsOfDay(a) - secondsOfDay(b);
}

/** Order a value against another, comparing date first and only then time. `null` halves sort first. */
export function compareCivilValue(a: CivilValue, b: CivilValue): number {
	if (a.date && b.date) {
		const byDate = compareDates(a.date, b.date);
		if (byDate !== 0) return byDate;
	} else if (a.date !== b.date) {
		return a.date ? 1 : -1;
	}
	if (a.time && b.time) return compareCivilTime(a.time, b.time);
	if (a.time === b.time) return 0;
	return a.time ? 1 : -1;
}

function pad(n: number, width = 2): string {
	return String(Math.abs(n)).padStart(width, "0");
}

export function formatIsoTime(time: CivilTime, withSeconds = time.second !== 0): string {
	const hm = `${pad(time.hour)}:${pad(time.minute)}`;
	return withSeconds ? `${hm}:${pad(time.second)}` : hm;
}

export function parseIsoTime(raw: string): CivilTime | null {
	const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(raw.trim());
	if (!match) return null;
	const time = { hour: Number(match[1]), minute: Number(match[2]), second: Number(match[3] ?? 0) };
	return isValidTime(time) ? time : null;
}

/**
 * Parse the canonical wire value — `YYYY-MM-DD`, `HH:mm[:ss]`, or `YYYY-MM-DDTHH:mm[:ss]`. A
 * trailing `Z` or `±HH:MM` is *rejected*, not silently dropped: an offset means the caller handed
 * over an instant, and reinterpreting one as a wall-clock reading is precisely the shift this
 * component refuses to make.
 */
export function parseIsoValue(raw: string | null | undefined, mode: DatePickerMode): CivilValue | null {
	const text = (raw ?? "").trim();
	if (text === "") return null;
	if (mode === "time") {
		const time = parseIsoTime(text);
		return time ? { date: null, time } : null;
	}
	if (mode === "date") {
		const date = parseIso(text);
		return date ? { date, time: null } : null;
	}
	const [datePart, timePart, ...rest] = text.split("T");
	if (rest.length > 0 || !datePart || !timePart) return null;
	const date = parseIso(datePart);
	const time = parseIsoTime(timePart);
	return date && time ? { date, time } : null;
}

export function formatIsoValue(value: CivilValue, mode: DatePickerMode, withSeconds = false): string {
	if (mode === "time") return value.time ? formatIsoTime(value.time, withSeconds || value.time.second !== 0) : "";
	if (mode === "date") return value.date ? toIso(value.date) : "";
	if (!value.date || !value.time) return "";
	return `${toIso(value.date)}T${formatIsoTime(value.time, withSeconds || value.time.second !== 0)}`;
}

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function formatter(locale: string | undefined, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
	const key = `${locale ?? ""}|${JSON.stringify(options)}`;
	let cached = formatterCache.get(key);
	if (!cached) {
		cached = new Intl.DateTimeFormat(locale, { timeZone: "UTC", ...options });
		formatterCache.set(key, cached);
	}
	return cached;
}

/** The order the locale writes a numeric date in — the order the field displays *and* parses. */
export function localeDateOrder(locale?: string): ("year" | "month" | "day")[] {
	const parts = formatter(locale, { year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(
		utcAnchor({ year: 2026, month: 11, day: 22 }, null),
	);
	const order = parts
		.map((part) => part.type)
		.filter((type): type is "year" | "month" | "day" => type === "year" || type === "month" || type === "day");
	return order.length === 3 ? order : ["month", "day", "year"];
}

/**
 * Whether the locale writes clock times on a 12-hour dial. Detected by formatting 13:00 and looking
 * for a day-period part, which every engine reports — rather than `resolvedOptions().hour12`, which
 * older engines omit.
 */
export function localeHour12(locale?: string): boolean {
	const parts = formatter(locale, { hour: "numeric", minute: "2-digit" }).formatToParts(
		utcAnchor(null, { hour: 13, minute: 0, second: 0 }),
	);
	return parts.some((part) => part.type === "dayPeriod");
}

export function resolveHour12(posture: HourCyclePosture, locale?: string): boolean {
	if (posture === "12") return true;
	if (posture === "24") return false;
	return localeHour12(locale);
}

/** The locale's own AM/PM words, so a typed `13:00` field accepts what the field itself prints. */
export function localeDayPeriods(locale?: string): { am: string; pm: string } {
	const read = (hour: number): string => {
		const parts = formatter(locale, { hour: "numeric", hour12: true }).formatToParts(
			utcAnchor(null, { hour, minute: 0, second: 0 }),
		);
		return parts.find((part) => part.type === "dayPeriod")?.value ?? (hour < 12 ? "AM" : "PM");
	};
	return { am: read(9), pm: read(21) };
}

export function formatDateDisplay(date: CivilDate, locale?: string): string {
	return formatter(locale, { year: "numeric", month: "2-digit", day: "2-digit" }).format(utcAnchor(date, null));
}

export function formatTimeDisplay(
	time: CivilTime,
	options: { locale?: string; hour12: boolean; withSeconds?: boolean },
): string {
	const { locale, hour12, withSeconds = false } = options;
	return formatter(locale, {
		hour: hour12 ? "numeric" : "2-digit",
		minute: "2-digit",
		...(withSeconds ? { second: "2-digit" as const } : {}),
		hour12,
		hourCycle: hour12 ? undefined : "h23",
	}).format(utcAnchor(null, time));
}

/** A placeholder that shows the shape the field expects, in the locale's own field order. */
export function datePlaceholder(locale?: string): string {
	const label: Record<"year" | "month" | "day", string> = { year: "YYYY", month: "MM", day: "DD" };
	return localeDateOrder(locale)
		.map((part) => label[part])
		.join("/");
}

export function timePlaceholder(hour12: boolean, withSeconds = false): string {
	const core = withSeconds ? "HH:MM:SS" : "HH:MM";
	return hour12 ? `${core} AM` : core;
}

/** Collapse the separators and the narrow no-break spaces newer ICU emits, so parsing sees plain text. */
function normalize(raw: string): string {
	return raw.replace(/[   ]/g, " ").trim().toLowerCase();
}

/**
 * Expand a two-digit year against a sliding window: a year up to 50 ahead of today reads as this
 * century, anything beyond as the last. `26` is 2026, `99` is 1999.
 */
function expandYear(year: number, today: CivilDate): number {
	if (year >= 100) return year;
	const century = Math.floor(today.year / 100) * 100;
	const candidate = century + year;
	return candidate <= today.year + 50 ? candidate : candidate - 100;
}

/**
 * Parse what a person typed into the date field. Accepts the locale's own numeric order with any of
 * `/ - . ` as separators, ISO `YYYY-MM-DD` always (a four-digit group is the year wherever it sits),
 * a bare `DDMMYYYY`-style digit run, a two-part `M/D` against the current year, and a bare day number
 * against the current month. Anything that does not resolve to a real calendar date returns `null` —
 * the field reverts rather than inventing a date the user did not mean (Feb 31 is not Mar 3).
 */
export function parseDateText(
	raw: string,
	options: { locale?: string; today: CivilDate },
): CivilDate | null {
	const text = normalize(raw);
	if (text === "") return null;
	const iso = parseIso(text);
	if (iso) return iso;

	const groups = text.split(/[^\d]+/).filter((part) => part.length > 0);
	if (groups.length === 0 || groups.length > 3) return null;

	const order = localeDateOrder(options.locale);
	const fields: Partial<Record<"year" | "month" | "day", number>> = {};

	if (groups.length === 1) {
		const only = groups[0]!;
		if (only.length === 8) {
			const [a, b, c] = [only.slice(0, 4), only.slice(4, 6), only.slice(6, 8)];
			const candidate = { year: Number(a), month: Number(b), day: Number(c) };
			return isValidDate(candidate) ? candidate : null;
		}
		if (only.length <= 2) {
			const candidate = { year: options.today.year, month: options.today.month, day: Number(only) };
			return isValidDate(candidate) ? candidate : null;
		}
		return null;
	}

	const monthDaySlots = order.filter((part) => part !== "year");

	if (groups.length === 3) {
		// A four-digit group is unambiguously the year wherever it sits, so it is claimed positionally
		// and the other two groups fill the locale's month/day order around it — which is what lets a
		// US-locale field still accept `2026/3/8` typed the ISO way round.
		const yearIndex = groups.findIndex((group) => group.length === 4);
		if (yearIndex === -1) {
			order.forEach((part, index) => {
				fields[part] = Number(groups[index]);
			});
		} else {
			fields.year = Number(groups[yearIndex]);
			const rest = groups.filter((_, index) => index !== yearIndex);
			monthDaySlots.forEach((part, index) => {
				fields[part] = Number(rest[index]);
			});
		}
	} else {
		// Two groups: no year typed, so it is this year and both groups are month/day in locale order.
		if (groups.some((group) => group.length > 2)) return null;
		fields.year = options.today.year;
		monthDaySlots.forEach((part, index) => {
			fields[part] = Number(groups[index]);
		});
	}

	if (fields.year === undefined || fields.month === undefined || fields.day === undefined) return null;
	const candidate = {
		year: expandYear(fields.year, options.today),
		month: fields.month,
		day: fields.day,
	};
	return isValidDate(candidate) ? candidate : null;
}

/**
 * Parse what a person typed into the time field. Accepts `9`, `930`, `0930`, `9:30`, `9:30:15`,
 * `9.30`, and any of those with an AM/PM marker — the locale's own day-period words as well as the
 * latin `a`/`am`/`p`/`pm`, so a field that prints `9:30 PM` accepts `9:30 p` back. Returns `null`
 * on anything that is not a real clock time.
 */
export function parseTimeText(raw: string, options: { locale?: string } = {}): CivilTime | null {
	let text = normalize(raw);
	if (text === "") return null;

	const periods = localeDayPeriods(options.locale);
	const amWords = new Set(["am", "a", "a.m.", "a.m", normalize(periods.am)]);
	const pmWords = new Set(["pm", "p", "p.m.", "p.m", normalize(periods.pm)]);

	let meridiem: "am" | "pm" | null = null;
	for (const word of [...pmWords].sort((a, b) => b.length - a.length)) {
		if (word && text.endsWith(word)) {
			meridiem = "pm";
			text = text.slice(0, -word.length).trim();
			break;
		}
	}
	if (!meridiem) {
		for (const word of [...amWords].sort((a, b) => b.length - a.length)) {
			if (word && text.endsWith(word)) {
				meridiem = "am";
				text = text.slice(0, -word.length).trim();
				break;
			}
		}
	}

	const groups = text.split(/[^\d]+/).filter((part) => part.length > 0);
	let hour: number;
	let minute = 0;
	let second = 0;

	if (groups.length === 1) {
		const only = groups[0]!;
		if (only.length <= 2) {
			hour = Number(only);
		} else if (only.length === 3 || only.length === 4) {
			hour = Number(only.slice(0, only.length - 2));
			minute = Number(only.slice(-2));
		} else if (only.length === 5 || only.length === 6) {
			hour = Number(only.slice(0, only.length - 4));
			minute = Number(only.slice(-4, -2));
			second = Number(only.slice(-2));
		} else {
			return null;
		}
	} else if (groups.length === 2 || groups.length === 3) {
		hour = Number(groups[0]);
		minute = Number(groups[1]);
		second = groups.length === 3 ? Number(groups[2]) : 0;
	} else {
		return null;
	}

	if (meridiem) {
		if (hour < 1 || hour > 12) return null;
		if (meridiem === "am") hour = hour === 12 ? 0 : hour;
		else hour = hour === 12 ? 12 : hour + 12;
	}

	const time = { hour, minute, second };
	return isValidTime(time) ? time : null;
}

/** Whether a step (in seconds, the native `<input type="time">` contract) needs the seconds field shown. */
export function stepShowsSeconds(stepSeconds: number): boolean {
	return stepSeconds > 0 && stepSeconds % 60 !== 0;
}

/** Snap a time onto the step grid, measured from midnight. Never rolls into another day. */
export function snapTimeToStep(time: CivilTime, stepSeconds: number): CivilTime {
	if (!(stepSeconds > 0)) return time;
	const snapped = Math.round(secondsOfDay(time) / stepSeconds) * stepSeconds;
	return timeFromSeconds(Math.min(snapped, 86_399));
}

/**
 * Nudge a time by whole steps, saturating at the ends of the day rather than wrapping. Wrapping would
 * silently change the *date* half of a datetime value, which is the kind of quiet shift this component
 * exists to avoid.
 */
export function nudgeTime(time: CivilTime, steps: number, stepSeconds: number): CivilTime {
	const step = stepSeconds > 0 ? stepSeconds : 60;
	const next = secondsOfDay(time) + steps * step;
	return timeFromSeconds(Math.min(Math.max(next, 0), 86_399));
}

/**
 * The floor the popup's time list is generated at. A list at the field's own `step` would be 1440
 * entries for the default 60s step, so the list quantizes to a quarter hour unless the step is coarser
 * (or the author names a `listStep`); typing and the arrow keys still resolve to the exact step.
 */
export const TIME_LIST_FLOOR_SECONDS = 900;

export function resolveListStep(stepSeconds: number, listStep?: number): number {
	if (listStep && listStep > 0) return listStep;
	return Math.max(stepSeconds > 0 ? stepSeconds : 60, TIME_LIST_FLOOR_SECONDS);
}

/** Every time the popup list offers, walked from `min` (or midnight) to `max` (or the end of the day). */
export function timeListOptions(options: {
	stepSeconds: number;
	listStep?: number;
	min?: CivilTime | null;
	max?: CivilTime | null;
}): CivilTime[] {
	const step = resolveListStep(options.stepSeconds, options.listStep);
	const start = options.min ? Math.ceil(secondsOfDay(options.min) / step) * step : 0;
	const end = options.max ? secondsOfDay(options.max) : 86_399;
	const out: CivilTime[] = [];
	for (let s = start; s <= end && out.length < 1440; s += step) out.push(timeFromSeconds(s));
	return out;
}

/**
 * The time bounds that actually apply on a given date. In `datetime` mode a `min` of
 * `2026-03-08T09:00` only floors the clock *on 2026-03-08*; every later day is open from midnight.
 * Getting this wrong is how a picker ends up refusing 08:00 next Tuesday because Monday opened at nine.
 */
export function effectiveTimeBounds(
	date: CivilDate | null,
	mode: DatePickerMode,
	min: CivilValue | null,
	max: CivilValue | null,
): { min: CivilTime | null; max: CivilTime | null } {
	if (mode === "time") return { min: min?.time ?? null, max: max?.time ?? null };
	if (mode !== "datetime" || !date) return { min: null, max: null };
	const lower = min?.date && min.time && compareDates(date, min.date) === 0 ? min.time : null;
	const upper = max?.date && max.time && compareDates(date, max.date) === 0 ? max.time : null;
	return { min: lower, max: upper };
}

/** Clamp a value into `[min, max]`, comparing whole values so a datetime is bounded by both halves. */
export function clampCivilValue(
	value: CivilValue,
	mode: DatePickerMode,
	min: CivilValue | null,
	max: CivilValue | null,
): CivilValue {
	if (mode === "time") {
		if (!value.time) return value;
		let time = value.time;
		if (min?.time && compareCivilTime(time, min.time) < 0) time = min.time;
		if (max?.time && compareCivilTime(time, max.time) > 0) time = max.time;
		return { date: null, time };
	}
	if (!value.date) return value;
	if (min && compareCivilValue(value, min) < 0) return { ...min };
	if (max && compareCivilValue(value, max) > 0) return { ...max };
	return value;
}

/** Whether a value falls inside `[min, max]` — the read the field uses before committing typed input. */
export function isWithinBounds(
	value: CivilValue,
	mode: DatePickerMode,
	min: CivilValue | null,
	max: CivilValue | null,
): boolean {
	if (mode === "time") {
		if (!value.time) return true;
		if (min?.time && compareCivilTime(value.time, min.time) < 0) return false;
		if (max?.time && compareCivilTime(value.time, max.time) > 0) return false;
		return true;
	}
	if (!value.date) return true;
	if (min && compareCivilValue(value, min) < 0) return false;
	if (max && compareCivilValue(value, max) > 0) return false;
	return true;
}

/** Parse a `disabled-weekdays` attribute (`"0,6"` → weekends) into the weekday set the grid greys out. */
export function parseDisabledDays(raw: string | null | undefined): number[] {
	if (!raw) return [];
	return [
		...new Set(
			raw
				.split(/[\s,]+/)
				.map((part) => Number(part))
				.filter((n) => Number.isInteger(n) && n >= 0 && n <= 6),
		),
	].sort((a, b) => a - b);
}

/** The one `:host` rule the date picker's scaffold and its SSR declarative shadow root share. */
export const datePickerHostCss = ":host { display: inline-block; }";
