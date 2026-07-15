import type { ComponentManifest } from "./types.js";
import { FULL_TONES } from "../vocab.js";

const htmlExample = `<!-- a single day, with the locale deciding where the week starts -->
<xtyle-calendar id="cal" mode="single" value="2026-07-14" locale="en-GB"></xtyle-calendar>

<!-- a range, six fixed rows so the grid never jumps, weekends and events marked -->
<xtyle-calendar id="trip" mode="range" fixed-weeks week-numbers min="2026-07-01" max="2026-08-31"></xtyle-calendar>

<script>
	const trip = document.getElementById("trip");

	// a predicate says which days are refused — here, every Monday
	trip.isDateDisabled = (iso) => new Date(iso + "T00:00:00Z").getUTCDay() === 1;

	// decorations mark days: dots for events, a bar for a full day, text for the announcement
	trip.decorations = {
		"2026-07-16": { dots: ["accent", "success"], label: "2 events" },
		"2026-07-17": { busy: true, label: "fully booked" },
	};

	trip.addEventListener("change", (e) => {
		const { start, end, complete } = e.detail;
		if (complete) console.log(\`\${start} → \${end}\`);
	});
</script>`;

const svelteExample = `<script lang="ts">
	import { Calendar } from "@xtyle/svelte";

	let value = $state("2026-07-14");
	let month = $state("2026-07");
</script>

<Calendar
	mode="single"
	{value}
	{month}
	min="2026-07-01"
	decorations={{ "2026-07-16": { dots: ["success"], label: "1 event" } }}
	isDateDisabled={(iso) => iso.endsWith("-25")}
	onchange={(e) => (value = e.detail.value)}
	onmonthchange={(e) => (month = e.detail.month)}
/>

<p>Picked: {value || "nothing yet"}</p>`;

const astroExample = `---
import Calendar from "@xtyle/astro/Calendar.astro";
---

<!-- server-rendered to real markup: the month grid is there before any JS loads -->
<Calendar
	mode="range"
	value="2026-07-14,2026-07-19"
	month="2026-07"
	locale="fr-FR"
	weekNumbers
	fixedWeeks
	label="Dates du séjour"
/>`;

export const calendarManifest: ComponentManifest = {
	id: "calendar",
	name: "Calendar",
	category: "form",
	since: "0.8.0",
	keywords: ["date", "month grid", "datepicker", "day picker", "range", "schedule", "agenda", "availability"],
	seeAlso: ["date-picker", "field", "popover", "timeline"],
	summary: "A month grid that selects a day, a set of days, or a range — locale-aware, keyboard-complete, and popup-free.",
	description:
		'Calendar is the month grid itself: a controlled `role="grid"` of day cells with no opinion about being inside a popup (that is `DatePicker`\'s job, and it consumes this). Three modes: `single` picks one day, `multiple` toggles a set, and `range` opens on the first pick and closes on the second, previewing the pending half as the pointer — or the keyboard cursor — sweeps across the grid. **Every date is a wall-clock date**, an ISO `YYYY-MM-DD` civil day rather than an instant, so nothing here can shift a selection across a DST boundary; `today` is read in the host\'s timezone, or whichever IANA zone `timezone` names. The locale drives the month and weekday names, the numbering system, and the first day of the week, all through `Intl` (`Intl.Locale`\'s `weekInfo` where the engine has it, ISO-8601 otherwise) — no bundled locale table and no date library — and `firstDayOfWeek` overrides it outright. `min` / `max`, a `disabledDates` list, and an `isDateDisabled` predicate compose into which days are refused, and `decorations` hangs event dots, a busy bar, and extra announced text on any day. The keyboard is the full WAI-ARIA date grid: arrows walk days and weeks straight across month boundaries, `Home` / `End` snap to the week\'s edges, `PageUp` / `PageDown` step months (`Shift` for years), and `Escape` cancels a half-drawn range.',
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "calendar",
			description: "The root; carries the tone, the size, and the mode. Becomes a labelled `group` when given a `label`.",
			selector: ".xtyle-calendar",
			tokens: ["--font-sans", "--text-sm", "--leading-normal", "--fg-1"],
		},
		{
			name: "header",
			description: "The month bar: the previous / next steps around the month heading.",
			selector: ".xtyle-calendar__header",
			tokens: ["--space-1"],
		},
		{
			name: "title",
			description: 'The month and year, localized. An `aria-live="polite"` region, so stepping the month announces the new one.',
			selector: ".xtyle-calendar__title",
			tokens: ["--fg-0", "--text-body", "--weight-medium"],
		},
		{
			name: "nav",
			description: "A month step. Marked `aria-disabled` and made inert when the next month is entirely past `min` / `max`.",
			selector: ".xtyle-calendar__nav",
			tokens: ["--fg-1", "--fg-disabled", "--state-hover", "--radius-sm", "--ring"],
		},
		{
			name: "weekday",
			description: "A column header, rotated to the locale's first day. Carries the full weekday name in `abbr`.",
			selector: ".xtyle-calendar__weekday",
			tokens: ["--fg-3", "--text-xs", "--weight-medium"],
		},
		{
			name: "weeknum",
			description: "The optional week-of-year row header, generalized from ISO-8601 over the locale's week rules.",
			selector: ".xtyle-calendar__weeknum",
			tokens: ["--fg-3", "--text-xs"],
		},
		{
			name: "cell",
			description: "A day: the `gridcell` that carries the roving tab stop, the selection state, and the range band.",
			selector: ".xtyle-calendar__cell",
			tokens: ["--radius-sm"],
		},
		{
			name: "day",
			description: "The pill inside a cell — the box that fills when the day is selected and rings when it is today.",
			selector: ".xtyle-calendar__day",
			tokens: ["--radius-sm", "--border-thin", "--state-hover", "--duration-fast", "--ease-standard"],
		},
		{
			name: "dot",
			description: "A decoration dot under the day number, one per event, colored by tone. A real element, so a mod can reshape it.",
			selector: ".xtyle-calendar__dot",
			tokens: ["--radius-full"],
		},
		{
			name: "busy",
			description: "The bar marking a fully-booked day.",
			selector: ".xtyle-calendar__busy",
			tokens: ["--fg-2", "--border-thick", "--radius-full"],
		},
		{
			name: "cue",
			description:
				"The non-color selection cue. Drawn only when the theme's `--selection-cue` resolves to `marker` (a high-contrast or redundant-cues algorithm), so a selected day never rests on color alone.",
			selector: ".xtyle-calendar__cue",
			tokens: ["--selection-cue", "--border-thick", "--radius-full"],
		},
	],
	props: [
		{
			name: "mode",
			type: '"single" | "multiple" | "range"',
			default: "single",
			description: "What a click does: replace the selection, toggle a day in a set, or draw a range.",
			bindings: ["html", "svelte", "astro"],
			options: ["single", "multiple", "range"],
		},
		{
			name: "value",
			type: "string",
			description:
				"The selection as a comma-separated ISO list. `single` holds one date, `multiple` holds N, `range` holds `start` while pending and `start,end` once closed.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "month",
			type: "string",
			description:
				"The displayed month, `YYYY-MM`. Uncontrolled by default (seeded from the selection, else today) and reflected as it steps; set it to drive the month from outside.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "min",
			type: "string",
			description: "The earliest selectable day, ISO. Earlier days are disabled and the previous-month step goes inert.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "max",
			type: "string",
			description: "The latest selectable day, ISO.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "locale",
			type: "string",
			description:
				"A BCP-47 tag driving the month and weekday names, the numbering system, and the first day of the week. Defaults to the host's.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "timezone",
			type: "string",
			description:
				'An IANA zone that pins what "today" means (a venue\'s zone rather than the visitor\'s). It shifts nothing else: dates are wall-clock, not instants.',
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "firstDayOfWeek",
			type: "number",
			description: "Override the week's first day, 0 = Sunday … 6 = Saturday. Defaults to the locale's, via `Intl`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "weekdayFormat",
			type: '"short" | "narrow"',
			default: "short",
			description: "How the weekday headers are abbreviated. The full name always rides in `abbr` for assistive tech.",
			bindings: ["html", "svelte", "astro"],
			options: ["short", "narrow"],
		},
		{
			name: "weekNumbers",
			type: "boolean",
			default: "false",
			description: "Add the week-of-year row header.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "fixedWeeks",
			type: "boolean",
			default: "false",
			description: "Always draw six rows, so the grid's height never jumps between months.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "hideOutsideDays",
			type: "boolean",
			default: "false",
			description: "Blank the adjacent-month days instead of rendering them (they are selectable when shown).",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "hideNav",
			type: "boolean",
			default: "false",
			description: "Drop the previous / next steps, leaving the month heading — for a picker that drives the month itself.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "disabledDates",
			type: "string[]",
			description:
				"Days to refuse, as ISO dates. Composes with `min` / `max` and `isDateDisabled`. On the HTML element the attribute takes a comma-separated list.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "isDateDisabled",
			type: "(iso: string) => boolean",
			description:
				"A predicate, set as a property, run once per rendered day. The seam for a rule a list can't express (no Mondays, no past weekends, no blackout window).",
			bindings: ["html", "svelte"],
		},
		{
			name: "decorations",
			type: "Record<string, { dots?: string[]; busy?: boolean; label?: string }>",
			description:
				"Per-day marks, keyed by ISO date: `dots` (one per event, each a tone name), `busy` (a bar), and `label` (appended to the day's announcement, so a mark is never visual-only). A property, or a JSON string on the attribute.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "tone",
			type: "FullTone",
			default: "accent",
			description: "Color of the selected day and the range band, any of the 21 tones.",
			bindings: ["html", "svelte", "astro"],
			options: [...FULL_TONES],
		},
		{
			name: "size",
			type: "Size",
			default: "md",
			description: "Type scale and cell size.",
			bindings: ["html", "svelte", "astro"],
			options: ["sm", "md", "lg"],
		},
		{
			name: "readonly",
			type: "boolean",
			default: "false",
			description: "The grid navigates but never changes: a published schedule you can read and walk, not edit.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "disabled",
			type: "boolean",
			default: "false",
			description: "Inert: every day refused, both month steps disabled, and no tab stop in the grid.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "label",
			type: "string",
			description: 'The accessible name of the calendar as a whole ("Departure date"). The grid itself is named by the month.',
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "labelledby",
			type: "string",
			description: "The id of an existing element naming the calendar, instead of `label`.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [
		{
			name: "single",
			description: "One day at a time; a second pick replaces the first.",
			className: "xtyle-calendar--single",
			tokens: ["--accent", "--accent-fg"],
		},
		{
			name: "multiple",
			description: "A set of days, each click toggling one in or out.",
			className: "xtyle-calendar--multiple",
			tokens: ["--accent", "--accent-fg"],
		},
		{
			name: "range",
			description: "Two ends and the band between them, with the pending half previewed under the pointer.",
			className: "xtyle-calendar--range",
			tokens: ["--accent-bg"],
		},
	],
	sizes: [
		{ name: "sm", description: "Compact — for a dense sidebar or a popup.", className: "xtyle-calendar--sm" },
		{ name: "md", description: "Default.", className: "xtyle-calendar", isDefault: true },
		{ name: "lg", description: "Large — a page-level scheduler.", className: "xtyle-calendar--lg" },
	],
	states: [
		{
			name: "selected",
			description:
				'A picked day: a filled pill in the tone. The whole of a range is `aria-selected="true"` — it is all picked — but only its two ends fill; the days between carry the band, so the selection reads as one span rather than a row of identical pills.',
			selector: ".xtyle-calendar__cell[data-filled]",
			tokens: ["--accent", "--accent-fg", "--weight-medium"],
		},
		{
			name: "in-range",
			description: "A day inside a closed range: the soft band, edge-to-edge across the row.",
			selector: ".xtyle-calendar__cell[data-in-range]",
			tokens: ["--accent-bg"],
		},
		{
			name: "preview",
			description:
				"The pending half of a range, following the pointer (or the keyboard cursor, so the preview is not mouse-only).",
			selector: ".xtyle-calendar__cell[data-preview]",
			tokens: ["--accent-bg"],
		},
		{
			name: "today",
			description: 'Today, ringed rather than filled, and marked `aria-current="date"`.',
			selector: ".xtyle-calendar__cell[data-today]",
			tokens: ["--accent", "--border-thin", "--weight-semibold"],
		},
		{
			name: "outside",
			description: "An adjacent-month day: dimmed, still selectable, and picking one steps the grid onto its month.",
			selector: ".xtyle-calendar__cell[data-outside]",
			tokens: ["--fg-3"],
		},
		{
			name: "disabled",
			description: "A refused day — outside `min`/`max`, listed, or caught by the predicate. Still focusable, never selectable.",
			selector: '.xtyle-calendar__cell[aria-disabled="true"]',
			tokens: ["--fg-disabled"],
		},
		{
			name: "focus-visible",
			description: "The keyboard cursor: a token-colored ring, plus a transparent outline promoted to a real one in forced-colors mode.",
			selector: ".xtyle-calendar__cell:focus-visible",
			tokens: ["--ring", "--border-thick", "--border-normal"],
		},
	],
	slots: [],
	consumedTokens: [
		"--border-normal",
		"--border-thick",
		"--border-thin",
		"--duration-fast",
		"--ease-standard",
		"--fg-0",
		"--fg-1",
		"--fg-2",
		"--fg-3",
		"--fg-disabled",
		"--font-sans",
		"--leading-normal",
		"--radius-full",
		"--radius-sm",
		"--ring",
		"--selection-cue",
		"--space-0",
		"--space-1",
		"--state-hover",
		"--text-body",
		"--text-sm",
		"--text-xs",
		"--weight-medium",
		"--weight-semibold",
		...FULL_TONES.flatMap((t) => [`--${t}`, `--${t}-bg`, `--${t}-fg`]),
	],
	composition: [
		"Drop it inside a `Popover` (or reach for `DatePicker`, which already does) — the calendar has no opinion about being in one.",
		"Feed `decorations` from your event store to mark busy days; give every mark a `label` so the dot is announced, not just seen.",
		"Pair `mode=\"range\"` with `fixedWeeks` so the grid does not resize under the pointer mid-sweep.",
		"Use `readonly` for a published schedule: the grid still navigates and announces, but nothing can be picked.",
	],
	a11y: [
		'The month is a `role="grid"` named by its heading, with each day a `gridcell` carrying its full localized date as the accessible name — so a screen reader announces "Wednesday, July 1, 2026", never a bare "1".',
		"The full WAI-ARIA date-grid keyboard: arrows move by day and by week (straight across week, month, and year boundaries), `Home` / `End` snap to the week's edges, `PageUp` / `PageDown` step months and `Shift` + either steps years, `Enter` / `Space` select, and `Escape` cancels a half-drawn range.",
		"One roving tab stop: the grid is a single stop in the tab order, and the cursor is re-seated onto the equivalent cell after every repaint, so a month step never drops focus to the body.",
		'The month heading is an `aria-live="polite"` region, so stepping the month announces it even though focus stays on the step button.',
		'Selection state rides `aria-selected`, today rides `aria-current="date"`, and a refused day rides `aria-disabled` — still focusable (so the keyboard can pass over it) but never selectable.',
		"Under a theme whose `--selection-cue` is `marker`, the selected day gains a non-color cue, so selection never rests on color alone.",
		"A decoration's `label` is appended to its day's accessible name, so an event dot or a busy bar is announced rather than being a visual-only mark.",
	],
	examples: [
		{
			id: "modes-limits-decorations",
			title: "Modes, limits, and day decorations",
			description:
				"A single-day grid and a bounded range with week numbers, a disabled-day predicate, and dots and busy bars hung on days.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
	],
};
