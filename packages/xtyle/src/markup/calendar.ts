/**
 * The calendar's date core: wall-clock civil dates, locale resolution through `Intl`, and the
 * pure binding builder both the custom element and the Astro SSR binding render from.
 *
 * ## Wall-clock, never an instant
 *
 * Every date here is a **civil date** — a `{ year, month, day }` triple, serialized as `YYYY-MM-DD`.
 * It is a calendar square, not a moment in time, so it has no timezone and no DST to cross. All
 * arithmetic runs on the triple (through a UTC-anchored `Date`, which has no DST offsets at all),
 * and every `Intl` format is asked for `timeZone: "UTC"`. A local-midnight `new Date(y, m, d)` would
 * land on 23:00 the previous day in a zone that springs forward at midnight — the exact bug that
 * makes date pickers show the wrong month twice a year. Nothing in this module constructs one.
 *
 * The only place a real instant enters is `todayIn()`, which asks what the wall-clock date *is* in
 * a given zone (defaulting to the host's) and immediately drops back to a civil date.
 */

export type CalendarMode = "single" | "multiple" | "range";

/** A wall-clock date: no time, no zone. `month` is 1-12. */
export interface CivilDate {
	year: number;
	month: number;
	day: number;
}

/** What a consuming project hangs on a day: event dots, a busy marker, extra announced text. */
export interface CalendarDecoration {
	/** Tone names (`accent`, `success`, a named hue) — one dot each, drawn under the day number. */
	dots?: string[];
	/** Marks the day as fully booked; drawn as a bar across the cell. */
	busy?: boolean;
	/** Appended to the day's accessible name, so the decoration is announced rather than seen only. */
	label?: string;
}

export type CalendarDecorations = Record<string, CalendarDecoration>;

/** The locale's week shape, as `Intl` reports it. `firstDay` / `weekendDays` are 0 = Sunday … 6 = Saturday. */
export interface WeekInfo {
	firstDay: number;
	weekendDays: number[];
	/** Days of the new year a week must contain to count as that year's week 1 (ISO: 4). */
	minimalDays: number;
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** A UTC-anchored `Date` for a civil date — the arithmetic and `Intl` carrier, never a local instant. */
export function civilToDate(date: CivilDate): Date {
	const carrier = new Date(0);
	carrier.setUTCFullYear(date.year, date.month - 1, date.day);
	carrier.setUTCHours(0, 0, 0, 0);
	return carrier;
}

function dateToCivil(carrier: Date): CivilDate {
	return { year: carrier.getUTCFullYear(), month: carrier.getUTCMonth() + 1, day: carrier.getUTCDate() };
}

const pad = (n: number): string => String(n).padStart(2, "0");

/** `YYYY-MM-DD`. */
export function toIso(date: CivilDate): string {
	return `${String(date.year).padStart(4, "0")}-${pad(date.month)}-${pad(date.day)}`;
}

/** Parse `YYYY-MM-DD`, rejecting anything that isn't a real calendar day (`2026-02-30` → null). */
export function parseIso(value: string | null | undefined): CivilDate | null {
	const match = typeof value === "string" ? value.trim().match(ISO_DATE) : null;
	if (!match) return null;
	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	if (month < 1 || month > 12) return null;
	if (day < 1 || day > daysInMonth(year, month)) return null;
	return { year, month, day };
}

/** `YYYY-MM` → the first of that month. */
export function parseMonth(value: string | null | undefined): CivilDate | null {
	const match = typeof value === "string" ? value.trim().match(/^(\d{4})-(\d{2})$/) : null;
	if (!match) return null;
	const month = Number(match[2]);
	if (month < 1 || month > 12) return null;
	return { year: Number(match[1]), month, day: 1 };
}

/** `YYYY-MM` for the month a date sits in. */
export function toMonthKey(date: CivilDate): string {
	return `${String(date.year).padStart(4, "0")}-${pad(date.month)}`;
}

export function daysInMonth(year: number, month: number): number {
	const carrier = new Date(0);
	carrier.setUTCFullYear(year, month, 0);
	return carrier.getUTCDate();
}

/** Day of the week, 0 = Sunday … 6 = Saturday. DST-free: read off the UTC carrier. */
export function weekdayOf(date: CivilDate): number {
	return civilToDate(date).getUTCDay();
}

/** Shift by whole days. Crosses months, years, and DST boundaries without drift. */
export function addDays(date: CivilDate, days: number): CivilDate {
	const carrier = civilToDate(date);
	carrier.setUTCDate(carrier.getUTCDate() + days);
	return dateToCivil(carrier);
}

/** Shift by whole months, clamping the day into the target month (Jan 31 + 1 month → Feb 28/29). */
export function addMonths(date: CivilDate, months: number): CivilDate {
	const total = date.year * 12 + (date.month - 1) + months;
	const year = Math.floor(total / 12);
	const month = (total % 12) + 1;
	return { year, month, day: Math.min(date.day, daysInMonth(year, month)) };
}

/** Negative when `a` is earlier, positive when later, zero when the same day. */
export function compareDates(a: CivilDate, b: CivilDate): number {
	return a.year - b.year || a.month - b.month || a.day - b.day;
}

/** Clamp a date into an inclusive `[min, max]` window; either bound may be absent. */
export function clampDate(date: CivilDate, min: CivilDate | null, max: CivilDate | null): CivilDate {
	if (min && compareDates(date, min) < 0) return min;
	if (max && compareDates(date, max) > 0) return max;
	return date;
}

/**
 * The wall-clock date *right now* in a timezone — the one place an instant is read. Defaults to the
 * host's zone, so "today" is the user's today, not UTC's (which is a day off for a third of the
 * planet at any given moment). Pass an IANA zone to pin it.
 */
export function todayIn(timeZone?: string): CivilDate {
	const now = new Date();
	if (!timeZone) return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).formatToParts(now);
	const part = (type: string): number => Number(parts.find((p) => p.type === type)?.value ?? "0");
	return { year: part("year"), month: part("month"), day: part("day") };
}

interface LocaleWeekInfo {
	firstDay?: number;
	weekend?: number[];
	minimalDays?: number;
}

/** ISO-8601 numbering (1 = Monday … 7 = Sunday) → the JS convention (0 = Sunday … 6 = Saturday). */
const fromIsoWeekday = (day: number): number => day % 7;

/**
 * The week shape for a locale, straight from `Intl.Locale`'s `weekInfo` — no bundled locale table.
 * Engines that don't expose it (or a locale it can't resolve) fall back to ISO-8601: weeks start
 * Monday, the weekend is Saturday/Sunday, and a week belongs to the year holding at least four of
 * its days. A consumer who knows better overrides `firstDay` on the component.
 */
export function resolveWeekInfo(locale?: string): WeekInfo {
	const fallback: WeekInfo = { firstDay: 1, weekendDays: [6, 0], minimalDays: 4 };
	try {
		const resolved = new Intl.Locale(locale ?? new Intl.DateTimeFormat().resolvedOptions().locale) as Intl.Locale & {
			weekInfo?: LocaleWeekInfo;
			getWeekInfo?: () => LocaleWeekInfo;
		};
		const info = resolved.getWeekInfo?.() ?? resolved.weekInfo;
		if (!info) return fallback;
		return {
			firstDay: typeof info.firstDay === "number" ? fromIsoWeekday(info.firstDay) : fallback.firstDay,
			weekendDays: Array.isArray(info.weekend) && info.weekend.length > 0
				? info.weekend.map(fromIsoWeekday)
				: fallback.weekendDays,
			minimalDays: typeof info.minimalDays === "number" ? info.minimalDays : fallback.minimalDays,
		};
	} catch {
		return fallback;
	}
}

/** The first day of the week containing `date`, given the locale's week start. */
export function startOfWeek(date: CivilDate, firstDay: number): CivilDate {
	const offset = (weekdayOf(date) - firstDay + 7) % 7;
	return addDays(date, -offset);
}

function dayOfYear(date: CivilDate): number {
	const start = civilToDate({ year: date.year, month: 1, day: 1 }).getTime();
	return Math.round((civilToDate(date).getTime() - start) / 86400000) + 1;
}

/**
 * The week-of-year number, generalized from ISO-8601 over the locale's `firstDay` / `minimalDays`
 * (which reduce to Monday / 4 for ISO). The week belongs to the year holding its *defining day* —
 * the `minimalDays`-th day of the week — so the turn of the year lands in exactly one week number.
 */
export function weekNumber(date: CivilDate, firstDay: number, minimalDays: number): number {
	const defining = addDays(startOfWeek(date, firstDay), minimalDays - 1);
	return Math.floor((dayOfYear(defining) - 1) / 7) + 1;
}

/** The weekday names for a locale, rotated to start on `firstDay`. Pure `Intl`, no table. */
export function weekdayNames(
	locale: string | undefined,
	firstDay: number,
	format: "narrow" | "short" = "short",
): Array<{ short: string; long: string }> {
	const shortFmt = new Intl.DateTimeFormat(locale, { weekday: format, timeZone: "UTC" });
	const longFmt = new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" });
	// 2024-01-07 is a Sunday, so `+ index` walks Sunday..Saturday off a known anchor.
	const sunday: CivilDate = { year: 2024, month: 1, day: 7 };
	const names: Array<{ short: string; long: string }> = [];
	for (let i = 0; i < 7; i++) {
		const carrier = civilToDate(addDays(sunday, (firstDay + i) % 7));
		names.push({ short: shortFmt.format(carrier), long: longFmt.format(carrier) });
	}
	return names;
}

/** "July 2026" — the month heading, localized. */
export function monthTitle(locale: string | undefined, date: CivilDate): string {
	return new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", timeZone: "UTC" }).format(
		civilToDate(date),
	);
}

/** The day-of-month numeral in the locale's numbering system (Arabic-Indic digits where that's the norm). */
export function dayNumeral(locale: string | undefined, date: CivilDate): string {
	const parts = new Intl.DateTimeFormat(locale, { day: "numeric", timeZone: "UTC" }).formatToParts(
		civilToDate(date),
	);
	return parts.find((p) => p.type === "day")?.value ?? String(date.day);
}

/** "Wednesday, July 1, 2026" — a day's full accessible name, localized. */
export function fullDateLabel(locale: string | undefined, date: CivilDate): string {
	return new Intl.DateTimeFormat(locale, { dateStyle: "full", timeZone: "UTC" }).format(civilToDate(date));
}

/**
 * The selected dates, parsed off the `value` string: a comma-separated list of ISO dates in every
 * mode. `single` keeps the first, `range` keeps up to two (start, end), `multiple` keeps them all,
 * de-duplicated and sorted. Junk entries are dropped rather than thrown.
 */
export function parseCalendarValue(value: string | null | undefined, mode: CalendarMode): string[] {
	const dates = (value ?? "")
		.split(",")
		.map((part) => parseIso(part))
		.filter((date): date is CivilDate => date !== null)
		.map(toIso);
	const unique = [...new Set(dates)].sort();
	if (mode === "single") return unique.slice(0, 1);
	if (mode === "range") return unique.slice(0, 2);
	return unique;
}

/** The `value` string for a selection — the inverse of `parseCalendarValue`. */
export function formatCalendarValue(dates: readonly string[]): string {
	return dates.join(",");
}

function between(iso: string, start: string, end: string): boolean {
	return iso >= start && iso <= end;
}

/** A day the calendar refuses: outside `[min, max]`, named in `disabledDates`, or the predicate's call. */
export interface CalendarLimits {
	min?: string | null;
	max?: string | null;
	disabledDates?: readonly string[];
	isDateDisabled?: (iso: string) => boolean;
}

export function isDayDisabled(iso: string, limits: CalendarLimits): boolean {
	if (limits.min && iso < limits.min) return true;
	if (limits.max && iso > limits.max) return true;
	if (limits.disabledDates?.includes(iso)) return true;
	return limits.isDateDisabled?.(iso) === true;
}

export interface CalendarDayBinding {
	date: string;
	day: string;
	label: string;
	outside?: boolean;
	blank?: boolean;
	today?: boolean;
	weekend?: boolean;
	selected?: boolean;
	/** Draw the day as a filled pill: a single/multiple pick, or a range's two ends — never its middle. */
	filled?: boolean;
	start?: boolean;
	end?: boolean;
	inRange?: boolean;
	preview?: boolean;
	previewStart?: boolean;
	previewEnd?: boolean;
	previewEdge?: boolean;
	disabled?: boolean;
	focused?: boolean;
	dots?: string[];
	busy?: boolean;
}

export interface CalendarWeekBinding {
	number?: string;
	days: CalendarDayBinding[];
}

export interface CalendarBindings {
	uid: string;
	mode: CalendarMode;
	size: string;
	tone: string;
	title: string;
	label?: string | null;
	labelledby?: string | null;
	weekdays: Array<{ short: string; long: string }>;
	weeks: CalendarWeekBinding[];
	weekNumbers: boolean;
	weekLabel: string;
	hideNav: boolean;
	prevLabel: string;
	nextLabel: string;
	prevDisabled: boolean;
	nextDisabled: boolean;
	disabled: boolean;
	readonly: boolean;
	[key: string]: unknown;
}

/** Everything the binding builder needs; the element and the Astro binding each resolve it their own way. */
export interface CalendarBindingProps extends CalendarLimits {
	uid: string;
	/** The displayed month, `YYYY-MM`. */
	month: string;
	mode?: CalendarMode;
	/** Selected days as ISO dates. In `range`, `[start]` while pending and `[start, end]` once closed. */
	selected?: readonly string[];
	/** The roving tab stop / keyboard cursor. */
	focusDate?: string | null;
	/** The day under the pointer, which previews the pending half of a range. */
	hoverDate?: string | null;
	/** Today, as a wall-clock date. Defaults to the host's. */
	today?: string;
	locale?: string;
	firstDay?: number;
	weekendDays?: readonly number[];
	minimalDays?: number;
	weekdayFormat?: "narrow" | "short";
	weekNumbers?: boolean;
	fixedWeeks?: boolean;
	outsideDays?: boolean;
	size?: string;
	tone?: string;
	label?: string | null;
	labelledby?: string | null;
	hideNav?: boolean;
	prevLabel?: string;
	nextLabel?: string;
	weekLabel?: string;
	disabled?: boolean;
	readonly?: boolean;
	decorations?: CalendarDecorations;
}

/**
 * The whole render, resolved: six weeks of civil dates with every piece of state a cell needs already
 * decided (selected, in-range, previewing, disabled, today, focused) plus the localized strings. The
 * fill draws exactly this and does no date math, no locale work, and no policy — which is what lets a
 * mod restructure the grid without reimplementing a calendar.
 */
export function calendarBindings(props: CalendarBindingProps): CalendarBindings {
	const mode = props.mode ?? "single";
	const anchor = parseMonth(props.month) ?? { ...todayIn(), day: 1 };
	const firstDay = props.firstDay ?? resolveWeekInfo(props.locale).firstDay;
	const info = resolveWeekInfo(props.locale);
	const weekendDays = props.weekendDays ?? info.weekendDays;
	const minimalDays = props.minimalDays ?? info.minimalDays;
	const today = props.today ?? toIso(todayIn());
	const selected = [...(props.selected ?? [])];
	const decorations = props.decorations ?? {};
	const limits: CalendarLimits = {
		min: props.min ?? null,
		max: props.max ?? null,
		disabledDates: props.disabledDates,
		isDateDisabled: props.isDateDisabled,
	};

	const rangeStart = mode === "range" ? (selected[0] ?? null) : null;
	const rangeEnd = mode === "range" ? (selected[1] ?? null) : null;
	const edge = mode === "range" && rangeStart && !rangeEnd ? (props.hoverDate ?? props.focusDate ?? null) : null;
	// A zero-length band (the cursor still resting on the anchor) is not a preview of anything, so the
	// pending range only paints once the other end has actually moved off the day that opened it.
	const pendingEdge = edge && edge !== rangeStart ? edge : null;
	const previewLo = pendingEdge && rangeStart ? (pendingEdge < rangeStart ? pendingEdge : rangeStart) : null;
	const previewHi = pendingEdge && rangeStart ? (pendingEdge < rangeStart ? rangeStart : pendingEdge) : null;

	const gridStart = startOfWeek(anchor, firstDay);
	const monthEnd: CivilDate = { ...anchor, day: daysInMonth(anchor.year, anchor.month) };
	const naturalWeeks = Math.ceil(
		(Math.round((civilToDate(monthEnd).getTime() - civilToDate(gridStart).getTime()) / 86400000) + 1) / 7,
	);
	const rows = props.fixedWeeks ? 6 : naturalWeeks;
	const showOutside = props.outsideDays !== false;

	const weeks: CalendarWeekBinding[] = [];
	for (let row = 0; row < rows; row++) {
		const weekStart = addDays(gridStart, row * 7);
		const days: CalendarDayBinding[] = [];
		for (let column = 0; column < 7; column++) {
			const date = addDays(weekStart, column);
			const iso = toIso(date);
			const outside = date.month !== anchor.month || date.year !== anchor.year;
			if (outside && !showOutside) {
				days.push({ date: iso, day: "", label: "", blank: true });
				continue;
			}
			const decoration = decorations[iso];
			const isSelected =
				mode === "range"
					? !!rangeStart && (rangeEnd ? between(iso, rangeStart, rangeEnd) : iso === rangeStart)
					: selected.includes(iso);
			const day: CalendarDayBinding = {
				date: iso,
				day: dayNumeral(props.locale, date),
				label: decoration?.label ? `${fullDateLabel(props.locale, date)}, ${decoration.label}` : fullDateLabel(props.locale, date),
			};
			if (outside) day.outside = true;
			if (iso === today) day.today = true;
			if (weekendDays.includes(weekdayOf(date))) day.weekend = true;
			// The whole range is `aria-selected` — it is all picked — but only its two ends are *filled*;
			// the days between carry the band instead, so the selection reads as one span rather than a
			// row of identical pills.
			if (isSelected) day.selected = true;
			if (mode === "range" && rangeStart) {
				if (iso === rangeStart) day.start = true;
				if (rangeEnd && iso === rangeEnd) day.end = true;
				if (rangeEnd && between(iso, rangeStart, rangeEnd)) day.inRange = true;
				if (day.start || day.end) day.filled = true;
			} else if (isSelected) {
				day.filled = true;
			}
			if (previewLo && previewHi && between(iso, previewLo, previewHi)) {
				day.preview = true;
				if (iso === previewLo) day.previewStart = true;
				if (iso === previewHi) day.previewEnd = true;
				if (iso === pendingEdge) day.previewEdge = true;
			}
			if (props.disabled || isDayDisabled(iso, limits)) day.disabled = true;
			if (iso === props.focusDate) day.focused = true;
			if (decoration?.dots?.length) day.dots = [...decoration.dots];
			if (decoration?.busy) day.busy = true;
			days.push(day);
		}
		const week: CalendarWeekBinding = { days };
		if (props.weekNumbers) week.number = String(weekNumber(weekStart, firstDay, minimalDays));
		weeks.push(week);
	}

	const prevMonthEnd = addDays(anchor, -1);
	const nextMonthStart = addMonths(anchor, 1);
	const min = parseIso(limits.min ?? undefined);
	const max = parseIso(limits.max ?? undefined);

	return {
		uid: props.uid,
		mode,
		size: props.size ?? "md",
		tone: props.tone ?? "accent",
		title: monthTitle(props.locale, anchor),
		label: props.label ?? null,
		labelledby: props.labelledby ?? null,
		weekdays: weekdayNames(props.locale, firstDay, props.weekdayFormat ?? "short"),
		weeks,
		weekNumbers: props.weekNumbers === true,
		weekLabel: props.weekLabel ?? "Wk",
		hideNav: props.hideNav === true,
		prevLabel: props.prevLabel ?? "Previous month",
		nextLabel: props.nextLabel ?? "Next month",
		prevDisabled: props.disabled === true || (!!min && compareDates(prevMonthEnd, min) < 0),
		nextDisabled: props.disabled === true || (!!max && compareDates(nextMonthStart, max) > 0),
		disabled: props.disabled === true,
		readonly: props.readonly === true,
	};
}

/**
 * Apply a click on `iso` to the current selection and hand back the next one. Pure, so the same
 * transition drives the pointer, the keyboard, and a test: `single` replaces (picking the selected
 * day again is a no-op, never a surprise clear), `multiple` toggles, and `range` opens on the first
 * pick, closes (ordered) on the second, and reopens on the third.
 */
export function selectDate(selected: readonly string[], iso: string, mode: CalendarMode): string[] {
	if (mode === "single") return [iso];
	if (mode === "multiple") {
		return selected.includes(iso) ? selected.filter((d) => d !== iso) : [...selected, iso].sort();
	}
	const [start, end] = selected;
	if (!start || end) return [iso];
	return start <= iso ? [start, iso] : [iso, start];
}

/** Whether a range selection is closed — both ends picked. A `single`/`multiple` pick is always complete. */
export function isSelectionComplete(selected: readonly string[], mode: CalendarMode): boolean {
	if (mode !== "range") return true;
	return selected.length === 2;
}

/** The host-layout rule — the one `:host` rule, shared by the element and the SSR shadow. */
export const calendarHostCss = ":host { display: block; }";
