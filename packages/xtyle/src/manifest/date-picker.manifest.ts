import type { ComponentManifest } from "./types.js";

const htmlExample = `<xtyle-date-picker label="Start date" value="2026-03-08"></xtyle-date-picker>

<xtyle-date-picker label="Appointment" mode="datetime" value="2026-03-08T09:30" step="900"></xtyle-date-picker>

<xtyle-date-picker label="Opens at" mode="time" value="09:00" min="08:00" max="18:00" step="1800"></xtyle-date-picker>`;

const svelteExample = `<script lang="ts">
	import { DatePicker } from "@xtyle/svelte";

	let start = $state("2026-03-08");
	let appointment = $state("2026-03-08T09:30");
</script>

<DatePicker label="Start date" bind:value={start} />

<DatePicker label="Appointment" mode="datetime" bind:value={appointment} step={900} />

<DatePicker label="Opens at" mode="time" value="09:00" min="08:00" max="18:00" step={1800} />`;

const astroExample = `---
import { DatePicker } from "@xtyle/astro";
---

<DatePicker label="Start date" value="2026-03-08" />

<DatePicker label="Appointment" mode="datetime" value="2026-03-08T09:30" step={900} />

<DatePicker label="Opens at" mode="time" value="09:00" min="08:00" max="18:00" step={1800} />`;

const boundsHtmlExample = `<xtyle-date-picker
	label="Delivery date"
	min="2026-03-08"
	max="2026-04-30"
	disabled-weekdays="0,6"
	name="delivery"
	required
></xtyle-date-picker>

<script type="module">
	// the same predicate Calendar takes: it rules out individual days on the grid and on typed input alike
	const holidays = new Set(["2026-03-17", "2026-04-03"]);
	document.querySelector("xtyle-date-picker").isDateDisabled = (iso) => holidays.has(iso);
</script>`;

const boundsSvelteExample = `<script lang="ts">
	import { DatePicker } from "@xtyle/svelte";

	const holidays = new Set(["2026-03-17", "2026-04-03"]);
	let delivery = $state("");
</script>

<DatePicker
	label="Delivery date"
	bind:value={delivery}
	min="2026-03-08"
	max="2026-04-30"
	disabledWeekdays={[0, 6]}
	isDateDisabled={(iso) => holidays.has(iso)}
	name="delivery"
	required
/>`;

const boundsAstroExample = `---
import { DatePicker } from "@xtyle/astro";
---

<DatePicker
	label="Delivery date"
	min="2026-03-08"
	max="2026-04-30"
	disabledWeekdays={[0, 6]}
	name="delivery"
	required
/>`;

const localeHtmlExample = `<xtyle-date-picker label="Date (US)" locale="en-US" value="2026-03-08"></xtyle-date-picker>

<xtyle-date-picker label="Date (GB)" locale="en-GB" value="2026-03-08"></xtyle-date-picker>

<xtyle-date-picker label="Forced 24-hour" mode="time" locale="en-US" hour-cycle="24" value="21:30"></xtyle-date-picker>

<!-- "today" is the venue's day, not the visitor's — the grid rings it and a typed "22" resolves against it -->
<xtyle-date-picker label="Doors open" timezone="Asia/Tokyo" first-day-of-week="1"></xtyle-date-picker>`;

const localeSvelteExample = `<DatePicker label="Date (US)" locale="en-US" value="2026-03-08" />

<DatePicker label="Date (GB)" locale="en-GB" value="2026-03-08" />

<DatePicker label="Forced 24-hour" mode="time" locale="en-US" hourCycle="24" value="21:30" />

<DatePicker label="Doors open" timezone="Asia/Tokyo" firstDayOfWeek={1} />`;

const localeAstroExample = `<DatePicker label="Date (US)" locale="en-US" value="2026-03-08" />

<DatePicker label="Date (GB)" locale="en-GB" value="2026-03-08" />

<DatePicker label="Forced 24-hour" mode="time" locale="en-US" hourCycle="24" value="21:30" />

<DatePicker label="Doors open" timezone="Asia/Tokyo" firstDayOfWeek={1} />`;

export const datePickerManifest: ComponentManifest = {
	id: "date-picker",
	name: "Date Picker",
	category: "form",
	since: "0.8.0",
	keywords: ["calendar input", "date field", "time field", "datetime", "scheduling", "appointment", "day"],
	seeAlso: ["calendar", "field", "popover", "select"],
	summary: "A typable date and time field with a calendar and clock popup, parsed against the locale.",
	description:
		"Date Picker edits a date, a clock time, or both. A text field holds the value and **parses what the user types** — the locale's own numeric order (`3/8/2026` in `en-US`, `08/03/2026` in `en-GB`), ISO `YYYY-MM-DD` whatever the locale, the compact runs (`38`, `20260308`, `930`, `9:30 pm`), and a bare day number against the current month. Typing is the fast path and the accessible one; the popup is a convenience on top of it, not a substitute. The arrow keys step the value (a day, or a month with `PageUp`/`PageDown`; one `step` on the clock), and `Alt`+`↓` opens the popup. The popup hosts Calendar for the grid and a step-quantized listbox for the clock.\n\n**The value is a wall-clock reading, not an instant.** `mode=\"date\"` produces `YYYY-MM-DD`, `mode=\"time\"` produces `HH:mm[:ss]`, and `mode=\"datetime\"` produces `YYYY-MM-DDTHH:mm[:ss]` — no `Z`, no offset, exactly the native `date` / `time` / `datetime-local` contract. Nothing is ever converted to an instant, so no value can be shifted across a DST boundary: stepping onto a spring-forward day gives that day, and `01:30` + one hour gives `02:30` even where that hour does not exist locally. A string carrying an offset is rejected rather than silently reinterpreted; a caller that needs an instant applies a timezone at the edge, where the zone is actually known.\n\n`min`/`max` clamp, `disabledWeekdays` rules out weekdays, and an `isDateDisabled` predicate rules out individual days — all three are honoured by the grid *and* by the typed field, so a date that cannot be clicked cannot be typed in behind the grid's back. The predicate is the same name and the same shape Calendar takes, so one function serves the field and the grid it hosts. Unparseable or unavailable input is flagged in place (and announced) rather than silently reverted, so the user can fix what they wrote. It is form-associated: give it a `name` and the canonical value submits. `step` is in seconds, the native contract, defaulting to `60`; a sub-minute step shows the seconds field. The 12/24-hour posture follows the locale unless `hour-cycle` forces it.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "datepicker",
			description: "The wrapper carrying the size, mode, and state classes and stacking the label over the control.",
			selector: ".xtyle-datepicker",
			tokens: ["--font-sans", "--fg-0", "--space-2"],
		},
		{
			name: "label",
			description: "The optional visible label; it names the control group, and each input inside it is named in turn.",
			selector: ".xtyle-datepicker__label",
			tokens: ["--fg-1", "--text-sm"],
		},
		{
			name: "control",
			description: "The bordered `role=\"group\"` row holding the input(s), the clear button, and the popup trigger.",
			selector: ".xtyle-datepicker__control",
			tokens: ["--border-thin", "--line-2", "--radius-md", "--bg-0", "--accent", "--border-thick", "--ring"],
		},
		{
			name: "input",
			description: "The typable field. `datetime` mode renders two — a date and a time — each separately named.",
			selector: ".xtyle-datepicker__input",
			tokens: ["--fg-0", "--fg-2", "--text-body", "--space-2", "--space-3"],
		},
		{
			name: "clear",
			description: "Empties the field and returns focus to it. Shown whenever the field holds a value and is editable.",
			selector: ".xtyle-datepicker__clear",
			tokens: ["--fg-1", "--state-hover", "--state-press", "--space-6"],
		},
		{
			name: "trigger",
			description: "Opens the popup. Carries `aria-haspopup=\"dialog\"`, `aria-expanded`, and `aria-controls`.",
			selector: ".xtyle-datepicker__trigger",
			tokens: ["--neutral-bg", "--fg-1", "--state-hover", "--state-press", "--space-6"],
		},
		{
			name: "panel",
			description: "The popup body inside Popover: the calendar grid, the time listbox, or both side by side.",
			selector: ".xtyle-datepicker__panel",
			tokens: ["--space-3"],
		},
		{
			name: "times",
			description: "The `role=\"listbox\"` of step-quantized times, scrolled to the selection when the popup opens.",
			selector: ".xtyle-datepicker__times",
			tokens: ["--space-1", "--space-3", "--border-thin", "--line-2"],
		},
		{
			name: "time-option",
			description: "One `role=\"option\"` time. The list keeps a single tab stop; the arrows walk it.",
			selector: ".xtyle-datepicker__time-option",
			tokens: ["--radius-sm", "--fg-1", "--text-sm", "--state-hover", "--accent", "--accent-fg"],
		},
	],
	props: [
		{ name: "value", type: "string", description: "The canonical wall-clock value: `YYYY-MM-DD`, `HH:mm[:ss]`, or `YYYY-MM-DDTHH:mm[:ss]`. No timezone, no offset — an offset-bearing string is rejected. Reflected and form-submitted.", bindings: ["html", "svelte", "astro"] },
		{ name: "mode", type: "\"date\" | \"time\" | \"datetime\"", default: "date", description: "What the field edits. `datetime` renders a date input and a time input in one control, and the popup shows the grid beside the clock.", bindings: ["html", "svelte", "astro"], options: ["date", "time", "datetime"] },
		{ name: "min", type: "string", description: "Lower bound, in the same shape as `value`. In `datetime` mode the time half only floors the clock *on the bounding day*.", bindings: ["html", "svelte", "astro"] },
		{ name: "max", type: "string", description: "Upper bound, in the same shape as `value`.", bindings: ["html", "svelte", "astro"] },
		{ name: "step", type: "number", default: "60", description: "Time granularity in **seconds** — the native `<input type=\"time\">` contract. The arrow keys step by exactly this, typed times snap to it, and a sub-minute step shows the seconds field.", bindings: ["html", "svelte", "astro"] },
		{ name: "listStep", type: "number", description: "The granularity the popup's time list is generated at. Defaults to `step`, floored at a quarter hour so the default 60s step does not render 1440 options; typing and the arrows still resolve to `step`.", bindings: ["html", "svelte", "astro"] },
		{ name: "locale", type: "string", description: "BCP-47 tag driving the field order, the clock, and the grid. Defaults to the runtime's locale.", bindings: ["html", "svelte", "astro"] },
		{ name: "hourCycle", type: "\"auto\" | \"12\" | \"24\"", default: "auto", description: "`auto` takes the 12/24-hour posture from the locale rather than hardcoding one; `12` / `24` force it.", bindings: ["html", "svelte", "astro"], options: ["auto", "12", "24"] },
		{ name: "timezone", type: "string", description: "An IANA zone that pins what \"today\" means — the day the grid rings, and the reference a bare `22` or a two-digit year is typed against. Passed through to Calendar. It shifts no value: the value is wall-clock, not an instant.", bindings: ["html", "svelte", "astro"] },
		{ name: "disabledWeekdays", type: "number[]", description: "Weekdays that can never be picked, as indices with `0` = Sunday (`[0, 6]` → weekends; the attribute takes `\"0,6\"`). Honoured by the grid and the typed field alike. Distinct from Calendar's `disabledDates`, which names individual days.", bindings: ["html", "svelte", "astro"] },
		{ name: "isDateDisabled", type: "(iso: string) => boolean", description: "A predicate ruling out individual dates — a holiday list, a booked day. JS property only; it is handed straight to Calendar (whose own predicate has the same name and shape) and enforced on typed input too.", bindings: ["html", "svelte"] },
		{ name: "firstDayOfWeek", type: "number", description: "Which weekday the grid starts on, `0` = Sunday. Passed through to Calendar; defaults to the locale's.", bindings: ["html", "svelte", "astro"] },
		{ name: "disabled", type: "boolean", default: "false", description: "Disables typing, the popup, and the clear button; mutes the control.", bindings: ["html", "svelte", "astro"] },
		{ name: "readonly", type: "boolean", default: "false", description: "Shows the value but refuses edits: no typing, no popup, no clear.", bindings: ["html", "svelte", "astro"] },
		{ name: "required", type: "boolean", default: "false", description: "Blocks form submission while empty.", bindings: ["html", "svelte", "astro"] },
		{ name: "invalid", type: "boolean", default: "false", description: "Forces the error styling. The field also flags itself on unparseable or out-of-range input.", bindings: ["html", "svelte", "astro"] },
		{ name: "noClear", type: "boolean", default: "false", description: "Drops the clear button, which is otherwise shown whenever the field holds a value and is editable.", bindings: ["html", "svelte", "astro"] },
		{ name: "size", type: "Size", default: "md", description: "Control size: `sm`, `md`, or `lg`.", bindings: ["html", "svelte", "astro"], options: ["sm", "md", "lg"] },
		{ name: "name", type: "string", description: "Form field name; the canonical value submits with the form.", bindings: ["html", "svelte", "astro"] },
		{ name: "label", type: "string", description: "Visible label. It names the control group; the date and time inputs are named individually.", bindings: ["html", "svelte", "astro"] },
		{ name: "labelledby", type: "string", description: "ID of an external element that names the control. Takes precedence over `label`.", bindings: ["html", "svelte", "astro"] },
		{ name: "dateLabel", type: "string", default: "Date", description: "Accessible name for the date input (and the grid).", bindings: ["html", "svelte", "astro"] },
		{ name: "timeLabel", type: "string", default: "Time", description: "Accessible name for the time input and the time listbox.", bindings: ["html", "svelte", "astro"] },
		{ name: "clearLabel", type: "string", default: "Clear", description: "Accessible name for the clear button.", bindings: ["html", "svelte", "astro"] },
		{ name: "openLabel", type: "string", description: "Accessible name for the popup trigger. Defaults to \"Open calendar\" (or \"Open time list\" in `time` mode).", bindings: ["html", "svelte", "astro"] },
		{ name: "panelLabel", type: "string", description: "Accessible name for the popup itself. Defaults to \"Choose a date\" / \"a time\" / \"a date and time\".", bindings: ["html", "svelte", "astro"] },
	],
	variants: [],
	sizes: [
		{ name: "sm", description: "Compact.", className: "xtyle-datepicker--sm" },
		{ name: "md", description: "Default.", className: "xtyle-datepicker", isDefault: true },
		{ name: "lg", description: "Large.", className: "xtyle-datepicker--lg" },
	],
	states: [
		{
			name: "focus-within",
			description: "An input is focused. The control border takes the accent and a token ring appears.",
			selector: ".xtyle-datepicker__control:focus-within",
			tokens: ["--accent", "--border-thick", "--ring"],
		},
		{
			name: "invalid",
			description: "Unparseable, unavailable, or consumer-flagged input. The border takes the danger token and the text is left in place to be fixed.",
			selector: ".xtyle-datepicker--invalid",
			tokens: ["--danger"],
		},
		{
			name: "readonly",
			description: "Shown but not editable: a muted field with no popup and no clear.",
			selector: ".xtyle-datepicker--readonly",
			tokens: ["--bg-1"],
		},
		{
			name: "disabled",
			description: "The whole field disabled: muted control, no typing, popup, or clearing.",
			selector: ".xtyle-datepicker--disabled",
			tokens: ["--fg-disabled", "--state-disabled"],
		},
		{
			name: "time-selected",
			description: "The chosen time in the popup's listbox.",
			selector: ".xtyle-datepicker__time-option[aria-selected=\"true\"]",
			tokens: ["--accent", "--accent-fg"],
		},
	],
	slots: [],
	consumedTokens: [
		"--accent",
		"--accent-fg",
		"--bg-0",
		"--bg-1",
		"--border-thick",
		"--border-thin",
		"--danger",
		"--duration-fast",
		"--ease-standard",
		"--fg-0",
		"--fg-1",
		"--fg-2",
		"--fg-disabled",
		"--font-sans",
		"--line-2",
		"--neutral-bg",
		"--radius-md",
		"--radius-sm",
		"--ring",
		"--space-1",
		"--space-2",
		"--space-3",
		"--space-4",
		"--space-5",
		"--space-6",
		"--space-7",
		"--state-disabled",
		"--state-hover",
		"--state-press",
		"--text-body",
		"--text-sm",
	],
	composition: [
		"Reach for Calendar directly when the grid is the whole surface (a booking page, a dashboard); Date Picker is the *field* shape, for a form.",
		"Give it a `name` inside a `<form>`: the canonical wall-clock string submits, and `required` blocks an empty submit.",
		"Bound a scheduling field with `min`/`max` and rule out weekends with `disabled-weekdays=\"0,6\"`; add an `isDateDisabled` predicate for holidays — the same predicate Calendar takes, so the grid and the field never disagree.",
		"Use `mode=\"time\"` with a `step` of `1800` and `min`/`max` for a business-hours slot picker.",
		"Convert to an instant at the edge, where the timezone is known — the value here is deliberately zone-free.",
	],
	a11y: [
		"Typing is a first-class path: the value can always be entered from the keyboard without ever opening the popup, which is both the fast path and the one that works without a pointer.",
		"The control is a `role=\"group\"` named by the label; the date and time inputs carry their own names (`dateLabel` / `timeLabel`), so `datetime` mode announces both fields distinctly.",
		"The trigger carries `aria-haspopup=\"dialog\"`, `aria-expanded`, and `aria-controls`; the popup is a labelled dialog, and Escape closes it and returns focus to the field.",
		"`↑`/`↓` step the value by a day (or one `step` on the clock), `PageUp`/`PageDown` by a month (or an hour), and `Alt`+`↓` opens the popup.",
		"The time list is a `role=\"listbox\"` of `role=\"option\"` buttons with a single roving tab stop: the arrows walk it, Home/End jump, Enter picks, and Tab leaves the list rather than walking all 96 options.",
		"Unparseable or unavailable input is not silently reverted: the text stays for the user to fix, the field goes `aria-invalid`, and a polite live region announces why.",
		"A clamped value is announced too, so a silent correction never goes unnoticed.",
		"Requires an accessible name: `labelledby` wins, then `label`, then `aria-label`; the element warns at runtime when none is present.",
	],
	examples: [
		{
			id: "modes",
			title: "Date, datetime, and time",
			description: "The three modes. Every one of them is typable — the popup is a convenience, not the only way in.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
		{
			id: "bounds-and-disabled-dates",
			title: "Bounds, weekends, and holidays",
			description: "A range, a weekday rule-out, and a per-date predicate — all three enforced on the grid *and* on typed input, plus form association.",
			source: { html: boundsHtmlExample, svelte: boundsSvelteExample, astro: boundsAstroExample },
		},
		{
			id: "locale-and-clock",
			title: "Locale, zone, and the 12/24-hour clock",
			description:
				"The same value read and typed three ways. The clock posture follows the locale unless `hour-cycle` forces it, and `timezone` pins what \"today\" means without shifting the value.",
			source: { html: localeHtmlExample, svelte: localeSvelteExample, astro: localeAstroExample },
		},
	],
};
