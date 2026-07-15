<script lang="ts">
	import "@xtyle/core/elements/date-picker.js";
	import type { Size } from "@xtyle/core";
	import type { DatePickerMode, HourCyclePosture, DisabledDatePredicate } from "@xtyle/core/elements";

	interface Props {
		/** The canonical wall-clock value: `YYYY-MM-DD`, `HH:mm[:ss]`, or `YYYY-MM-DDTHH:mm[:ss]`. No timezone, no offset. */
		value?: string;
		mode?: DatePickerMode;
		min?: string;
		max?: string;
		/** Time granularity in **seconds** (the native `<input type="time">` contract). Defaults to `60`. */
		step?: number;
		/** Granularity of the popup's time list. Defaults to `step`, floored at a quarter hour. */
		listStep?: number;
		locale?: string;
		/** An IANA zone that pins what "today" means. It shifts no value; the value is wall-clock. */
		timezone?: string;
		hourCycle?: HourCyclePosture;
		/** Weekdays that can never be picked, `0` = Sunday (`[0, 6]` → weekends). */
		disabledWeekdays?: string | number[];
		/** Rules out individual dates. Enforced on the grid *and* on typed input — the same predicate `Calendar` takes. */
		isDateDisabled?: DisabledDatePredicate;
		/** The week's first day in the grid, `0` = Sunday. Defaults to the locale's. */
		firstDayOfWeek?: number;
		disabled?: boolean;
		readonly?: boolean;
		required?: boolean;
		invalid?: boolean;
		/** Drop the clear button, otherwise shown whenever the field holds a value and is editable. */
		noClear?: boolean;
		size?: Size;
		name?: string;
		label?: string;
		labelledby?: string;
		dateLabel?: string;
		timeLabel?: string;
		clearLabel?: string;
		openLabel?: string;
		panelLabel?: string;
		oninput?: (event: Event) => void;
		onchange?: (event: Event) => void;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		value = $bindable(""),
		mode = "date",
		min,
		max,
		step,
		listStep,
		locale,
		timezone,
		hourCycle,
		disabledWeekdays,
		isDateDisabled,
		firstDayOfWeek,
		disabled = false,
		readonly = false,
		required = false,
		invalid = false,
		noClear = false,
		size = "md",
		name,
		label,
		labelledby,
		dateLabel,
		timeLabel,
		clearLabel,
		openLabel,
		panelLabel,
		oninput,
		onchange,
		...rest
	}: Props = $props();

	type DatePickerElement = HTMLElement & {
		value: string;
		isDateDisabled: DisabledDatePredicate | null;
		show(): void;
		hide(): void;
		toggle(): void;
	};

	let el: DatePickerElement | undefined = $state();

	/** Open the popup. */
	export function show(): void {
		el?.show();
	}

	/** Close the popup. */
	export function hide(): void {
		el?.hide();
	}

	// the predicate is a function, so it can only reach the element as a property — never an attribute
	$effect(() => {
		if (el) el.isDateDisabled = isDateDisabled ?? null;
	});

	function sync(event: Event) {
		const host = event.currentTarget as DatePickerElement;
		value = host.value;
	}
	function handleInput(event: Event) {
		sync(event);
		oninput?.(event);
	}
	function handleChange(event: Event) {
		sync(event);
		onchange?.(event);
	}
</script>

<xtyle-date-picker
	{...rest}
	bind:this={el}
	value={value === "" ? undefined : value}
	{mode}
	{min}
	{max}
	step={step != null ? String(step) : undefined}
	list-step={listStep != null ? String(listStep) : undefined}
	{locale}
	{timezone}
	hour-cycle={hourCycle}
	disabled-weekdays={Array.isArray(disabledWeekdays) ? disabledWeekdays.join(",") : disabledWeekdays}
	first-day-of-week={firstDayOfWeek != null ? String(firstDayOfWeek) : undefined}
	disabled={disabled || undefined}
	readonly={readonly || undefined}
	required={required || undefined}
	invalid={invalid || undefined}
	no-clear={noClear || undefined}
	{size}
	{name}
	{label}
	labelledby={labelledby || undefined}
	date-label={dateLabel}
	time-label={timeLabel}
	clear-label={clearLabel}
	open-label={openLabel}
	panel-label={panelLabel}
	oninput={handleInput}
	onchange={handleChange}
></xtyle-date-picker>
