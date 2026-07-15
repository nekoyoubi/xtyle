<script lang="ts">
	import "@xtyle/core/elements/calendar.js";
	import type { FullTone, Size } from "@xtyle/core";

	type CalendarMode = "single" | "multiple" | "range";
	type CalendarDecorations = Record<string, { dots?: string[]; busy?: boolean; label?: string }>;
	type ChangeEvent = CustomEvent<{
		mode: CalendarMode;
		value: string;
		dates: string[];
		start: string | null;
		end: string | null;
		complete: boolean;
	}>;
	type MonthChangeEvent = CustomEvent<{ month: string }>;

	interface Props {
		/** What a click does: replace the selection, toggle a day in a set, or draw a range. */
		mode?: CalendarMode;
		/** The selection as a comma-separated ISO list (`range`: `start` while pending, `start,end` once closed). */
		value?: string;
		/** The displayed month, `YYYY-MM`. Omit to let the calendar seed and step it itself. */
		month?: string;
		/** The earliest selectable day, ISO. */
		min?: string;
		/** The latest selectable day, ISO. */
		max?: string;
		/** A BCP-47 tag driving month/weekday names, numerals, and the first day of the week. */
		locale?: string;
		/** An IANA zone that pins what "today" means; it shifts nothing else. */
		timezone?: string;
		/** Override the week's first day, 0 = Sunday … 6 = Saturday. */
		firstDayOfWeek?: number;
		/** How the weekday headers are abbreviated. */
		weekdayFormat?: "short" | "narrow";
		/** Add the week-of-year row header. */
		weekNumbers?: boolean;
		/** Always draw six rows, so the grid's height never jumps between months. */
		fixedWeeks?: boolean;
		/** Blank the adjacent-month days instead of rendering them. */
		hideOutsideDays?: boolean;
		/** Drop the previous / next month steps. */
		hideNav?: boolean;
		/** Days to refuse, as ISO dates. Composes with `min` / `max` and `isDateDisabled`. */
		disabledDates?: string[];
		/** A predicate for days to refuse — the rule a list can't express. */
		isDateDisabled?: (iso: string) => boolean;
		/** Per-day marks keyed by ISO date: event dots, a busy bar, and text for the day's announcement. */
		decorations?: CalendarDecorations;
		tone?: FullTone;
		size?: Size;
		/** Navigable and announced, but nothing can be picked. */
		readonly?: boolean;
		/** Inert: every day refused, both steps disabled, no tab stop. */
		disabled?: boolean;
		/** The accessible name of the calendar as a whole. */
		label?: string;
		labelledby?: string;
		/** Fires when the selection changes (`detail: { mode, value, dates, start, end, complete }`). */
		onchange?: (event: ChangeEvent) => void;
		/** Fires when the displayed month steps (`detail: { month }`). */
		onmonthchange?: (event: MonthChangeEvent) => void;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		mode = "single",
		value,
		month,
		min,
		max,
		locale,
		timezone,
		firstDayOfWeek,
		weekdayFormat,
		weekNumbers,
		fixedWeeks,
		hideOutsideDays,
		hideNav,
		disabledDates,
		isDateDisabled,
		decorations,
		tone = "accent",
		size = "md",
		readonly,
		disabled,
		label,
		labelledby,
		onchange,
		onmonthchange,
		...rest
	}: Props = $props();

	type CalendarElement = HTMLElement & {
		decorations?: CalendarDecorations;
		isDateDisabled?: (iso: string) => boolean;
	};

	let el: CalendarElement | undefined = $state();

	// `decorations` and `isDateDisabled` are an object and a function: neither survives an attribute,
	// so they are assigned as live properties.
	$effect(() => {
		if (el) el.decorations = decorations ?? {};
	});

	$effect(() => {
		if (el) el.isDateDisabled = isDateDisabled;
	});

	// `month-change` is a hyphenated custom event, so it can't ride a Svelte `on…` prop; attach it
	// directly and re-dispatch to the current handler, kept live across swaps.
	$effect(() => {
		const node = el;
		if (!node) return;
		const handler = (event: Event): void => onmonthchange?.(event as MonthChangeEvent);
		node.addEventListener("month-change", handler);
		return () => node.removeEventListener("month-change", handler);
	});
</script>

<xtyle-calendar
	{...rest}
	bind:this={el}
	{mode}
	{tone}
	{size}
	value={value}
	month={month}
	min={min}
	max={max}
	locale={locale}
	timezone={timezone}
	first-day-of-week={firstDayOfWeek === undefined ? undefined : String(firstDayOfWeek)}
	weekday-format={weekdayFormat}
	disabled-dates={disabledDates?.length ? disabledDates.join(",") : undefined}
	label={label}
	labelledby={labelledby}
	week-numbers={weekNumbers || undefined}
	fixed-weeks={fixedWeeks || undefined}
	hide-outside-days={hideOutsideDays || undefined}
	hide-nav={hideNav || undefined}
	readonly={readonly || undefined}
	disabled={disabled || undefined}
	onchange={onchange as ((event: Event) => void) | undefined}
></xtyle-calendar>
