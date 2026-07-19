import { XtyleElement, define, type StyleMode } from "./base.js";
import type { Size } from "../index.js";
import {
	addDays,
	addMonths,
	clampCivilValue,
	compareDates,
	datePickerHostCss,
	datePlaceholder,
	effectiveTimeBounds,
	formatDateDisplay,
	toIso,
	formatIsoTime,
	formatIsoValue,
	formatTimeDisplay,
	isWithinBounds,
	nudgeTime,
	parseDateText,
	parseDisabledDays,
	parseIsoValue,
	parseTimeText,
	resolveHour12,
	snapTimeToStep,
	stepShowsSeconds,
	timeListOptions,
	todayIn,
	weekdayOf,
	type CivilDate,
	type CivilTime,
	type CivilValue,
	type DatePickerMode,
	type HourCyclePosture,
} from "../markup/index.js";
import { FragmentHost, type FragmentIntent } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/date-picker/source.generated.js";
import { resolveVocab, SIZES } from "../vocab.js";

export type { DatePickerMode, HourCyclePosture, CivilDate, CivilTime, CivilValue } from "../markup/index.js";

/** A predicate the grid and the typed field both honour: return `true` to make a date unpickable.
 * The same shape `Calendar` takes on its own `isDateDisabled`, so one predicate serves both. */
export type DisabledDatePredicate = (isoDate: string) => boolean;

/** The window in which a trigger click is really the tail of the light-dismiss that just closed the panel. */
const REOPEN_GUARD_MS = 250;

let pickerSeq = 0;

type Part = "date" | "time";

/**
 * A typable date/time field with a calendar (and clock) popup.
 *
 * **The value is a wall-clock reading, not an instant.** `mode="date"` produces `YYYY-MM-DD`,
 * `mode="time"` produces `HH:mm[:ss]`, and `mode="datetime"` produces `YYYY-MM-DDTHH:mm[:ss]` with
 * no `Z` and no offset — the same contract as the native `date` / `time` / `datetime-local` inputs.
 * Nothing here is ever converted to an instant, so no value can be shifted across a DST boundary; a
 * caller that needs an instant applies a timezone at the edge, where the zone is actually known. An
 * offset-bearing string handed to `value` is rejected rather than reinterpreted.
 *
 * Typing is a first-class path, not a fallback: the field parses the locale's numeric date order,
 * ISO, and the compact forms, and the arrow keys step the value. The popup is a convenience on top.
 */
export class XtyleDatePicker extends XtyleElement {
	protected override get styleMode(): StyleMode {
		return "auto";
	}

	static formAssociated = true;

	private internals: ElementInternals | null = null;
	private uid = `xtyle-datepicker-${++pickerSeq}`;
	/** The value the fields currently show. Only promoted to `value` once the mode's parts are all present. */
	private draft: CivilValue = { date: null, time: null };
	/** Parts whose typed text did not parse (or fell outside the bounds); their text is left alone so the
	 * user can fix it rather than having it silently reverted out from under them. */
	private badParts = new Set<Part>();
	private predicate: DisabledDatePredicate | null = null;
	private applyingValue = false;
	private dismissedAt = 0;
	private announcer: HTMLElement | null = null;
	private wiredPopover: HTMLElement | null = null;
	private wiredCalendar: HTMLElement | null = null;

	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "date-picker", {
		applyIntent: (intent, event) => this.applyIntent(intent, event),
		afterApply: () => this.afterApply(),
	});

	constructor() {
		super();
		if ("attachInternals" in this) {
			try {
				this.internals = this.attachInternals();
			} catch {
				this.internals = null;
			}
		}
	}

	static get observedAttributes(): string[] {
		return [
			"value",
			"mode",
			"min",
			"max",
			"step",
			"list-step",
			"locale",
			"timezone",
			"hour-cycle",
			"first-day-of-week",
			"disabled-weekdays",
			"disabled",
			"readonly",
			"required",
			"invalid",
			"no-clear",
			"size",
			"name",
			"label",
			"labelledby",
			"date-label",
			"time-label",
			"clear-label",
			"open-label",
			"panel-label",
		];
	}

	/** The canonical wall-clock value: `YYYY-MM-DD`, `HH:mm[:ss]`, or `YYYY-MM-DDTHH:mm[:ss]`. Empty when unset. */
	get value(): string {
		return this.getAttribute("value") ?? "";
	}
	set value(next: string | null | undefined) {
		const text = (next ?? "").trim();
		if (text === "") {
			this.removeAttribute("value");
			return;
		}
		const parsed = parseIsoValue(text, this.mode);
		if (!parsed) {
			console.warn(
				`xtyle-date-picker: "${text}" is not a valid ${this.mode} value. Expected a wall-clock string ` +
					`(${this.mode === "time" ? "HH:mm" : this.mode === "date" ? "YYYY-MM-DD" : "YYYY-MM-DDTHH:mm"}) ` +
					`with no timezone or offset.`,
			);
			return;
		}
		this.setAttribute("value", formatIsoValue(parsed, this.mode, this.showSeconds));
	}

	/** What the field edits: a date, a clock time, or both. */
	get mode(): DatePickerMode {
		const raw = this.getAttribute("mode");
		return raw === "time" || raw === "datetime" ? raw : "date";
	}
	set mode(value: DatePickerMode) {
		this.reflectString("mode", value);
	}

	/** Lower bound, in the same shape as `value`. Typed and picked values clamp to it. */
	get min(): string | null {
		return this.getAttribute("min");
	}
	set min(value: string | null | undefined) {
		this.reflectString("min", value);
	}

	/** Upper bound, in the same shape as `value`. */
	get max(): string | null {
		return this.getAttribute("max");
	}
	set max(value: string | null | undefined) {
		this.reflectString("max", value);
	}

	/** Time granularity in **seconds** — the native `<input type="time">` contract. Defaults to `60`.
	 * A sub-minute step shows the seconds field; the arrow keys step by exactly this. */
	get step(): number {
		const raw = Number(this.getAttribute("step"));
		return Number.isFinite(raw) && raw > 0 ? raw : 60;
	}
	set step(value: number) {
		this.reflectString("step", String(value));
	}

	/** The granularity the popup's time list is generated at. Defaults to `step`, floored at a quarter
	 * hour so the default 60s step does not render 1440 options; typing and the arrows still resolve to `step`. */
	get listStep(): number | undefined {
		const raw = Number(this.getAttribute("list-step"));
		return Number.isFinite(raw) && raw > 0 ? raw : undefined;
	}
	set listStep(value: number | undefined) {
		this.reflectString("list-step", value == null ? null : String(value));
	}

	/** The BCP-47 tag driving the field order, the clock, and the grid. Defaults to the runtime's locale. */
	get locale(): string | undefined {
		return this.getAttribute("locale") ?? undefined;
	}
	set locale(value: string | null | undefined) {
		this.reflectString("locale", value);
	}

	/** An IANA zone that pins what "today" means — for the grid's `today` ring and for the reference a bare
	 * `22` or a two-digit year resolves against. Defaults to the host's zone; it shifts no value, because
	 * the value is wall-clock. Passed straight through to the grid. */
	get timezone(): string | undefined {
		return this.getAttribute("timezone") ?? undefined;
	}
	set timezone(value: string | null | undefined) {
		this.reflectString("timezone", value);
	}

	/** The week's first day in the grid, 0 = Sunday … 6 = Saturday. Passed through to `Calendar`, which
	 * falls back to the locale's own first day when it is unset. */
	get firstDayOfWeek(): number | undefined {
		const raw = this.getAttribute("first-day-of-week");
		const parsed = raw === null ? Number.NaN : Number(raw);
		return Number.isInteger(parsed) && parsed >= 0 && parsed <= 6 ? parsed : undefined;
	}
	set firstDayOfWeek(value: number | null | undefined) {
		this.reflectString("first-day-of-week", value == null ? null : String(value));
	}

	/** `auto` (the default) takes the 12/24-hour posture from the locale; `12` / `24` force it. */
	get hourCycle(): HourCyclePosture {
		const raw = this.getAttribute("hour-cycle");
		return raw === "12" || raw === "24" ? raw : "auto";
	}
	set hourCycle(value: HourCyclePosture) {
		this.reflectString("hour-cycle", value);
	}

	/** Weekdays that can never be picked, as a list of indices with `0` = Sunday (`"0,6"` → weekends).
	 * Distinct from `Calendar`'s `disabledDates`, which names individual days. */
	get disabledWeekdays(): number[] {
		return parseDisabledDays(this.getAttribute("disabled-weekdays"));
	}
	set disabledWeekdays(value: string | number[] | null | undefined) {
		this.reflectString("disabled-weekdays", Array.isArray(value) ? value.join(",") : value);
	}

	/**
	 * A predicate that rules individual dates out — a holiday list, a booked day, an odd cadence. It is
	 * consulted by the grid *and* by the typed field, so a date that cannot be clicked cannot be typed
	 * in behind the grid's back either. Set the JS property; there is no attribute form. The same name
	 * and the same shape as `Calendar`'s own `isDateDisabled`, so one predicate serves both.
	 */
	get isDateDisabled(): DisabledDatePredicate | null {
		return this.predicate;
	}
	set isDateDisabled(predicate: DisabledDatePredicate | null | undefined) {
		this.predicate = typeof predicate === "function" ? predicate : null;
		if (this.root.firstChild) this.render();
	}

	get disabled(): boolean {
		return this.hasAttribute("disabled");
	}
	set disabled(value: boolean) {
		this.reflectBoolean("disabled", value);
	}

	get readonly(): boolean {
		return this.hasAttribute("readonly");
	}
	set readonly(value: boolean) {
		this.reflectBoolean("readonly", value);
	}

	get required(): boolean {
		return this.hasAttribute("required");
	}
	set required(value: boolean) {
		this.reflectBoolean("required", value);
	}

	/** Consumer-forced error styling. The field also flags itself invalid on unparseable or out-of-range input. */
	get invalid(): boolean {
		return this.hasAttribute("invalid") || this.badParts.size > 0;
	}
	set invalid(value: boolean) {
		this.reflectBoolean("invalid", value);
	}

	/** Drop the clear button. It is shown by default whenever the field holds a value and is editable. */
	get noClear(): boolean {
		return this.hasAttribute("no-clear");
	}
	set noClear(value: boolean) {
		this.reflectBoolean("no-clear", value);
	}

	get size(): Size {
		return resolveVocab(this.getAttribute("size"), SIZES, "md", "date-picker size");
	}
	set size(value: Size) {
		this.setAttribute("size", value);
	}

	get name(): string | null {
		return this.getAttribute("name");
	}
	set name(value: string | null | undefined) {
		this.reflectString("name", value);
	}

	/** Whether the popup is showing. */
	get open(): boolean {
		return this.popoverEl?.hasAttribute("open") ?? false;
	}
	set open(value: boolean) {
		if (value) this.show();
		else this.hide();
	}

	private get showSeconds(): boolean {
		return stepShowsSeconds(this.step);
	}

	private get hour12(): boolean {
		return resolveHour12(this.hourCycle, this.locale);
	}

	private get minValue(): CivilValue | null {
		return parseIsoValue(this.min, this.mode);
	}

	private get maxValue(): CivilValue | null {
		return parseIsoValue(this.max, this.mode);
	}

	/** Not `popover` — that name is taken by the native `HTMLElement.popover` property. */
	private get popoverEl(): (HTMLElement & { openFrom(el: HTMLElement, opts?: unknown): void; hide(reason?: string): void }) | null {
		return this.root.querySelector("[data-popover]");
	}

	private get control(): HTMLElement | null {
		return this.root.querySelector("[data-control]");
	}

	private get calendar(): (HTMLElement & { value?: string; isDateDisabled?: DisabledDatePredicate }) | null {
		return this.root.querySelector("[data-calendar]");
	}

	private input(part: Part): HTMLInputElement | null {
		return this.root.querySelector(`.xtyle-datepicker__input--${part}`);
	}

	private get timeOptionEls(): HTMLButtonElement[] {
		return [...this.root.querySelectorAll<HTMLButtonElement>(".xtyle-datepicker__time-option")];
	}

	/** Today, read off the wall clock in `timezone` (the host's zone by default) — the reference a bare `22`
	 * or a two-digit year resolves against, and the same day the grid rings. */
	private today(): CivilDate {
		return todayIn(this.timezone);
	}

	/**
	 * Whether a date is *unavailable* — ruled out by the weekday list or the predicate. Deliberately
	 * excludes the bounds, because the two are different questions with different answers: an
	 * out-of-range date is **clamped** into range (the user meant a real date, just too early), while an
	 * unavailable one is **refused** (there is no nearby date they can be said to have meant). Folding
	 * the bounds in here would turn every under-`min` entry into a rejection.
	 */
	private isDateUnavailable(date: CivilDate): boolean {
		const weekdays = this.disabledWeekdays;
		if (weekdays.length > 0 && weekdays.includes(weekdayOf(date))) return true;
		return this.predicate?.(toIso(date)) === true;
	}

	/** What the *grid* greys out: the unavailable days plus everything outside the bounds. */
	private isDisabled(date: CivilDate): boolean {
		if (this.isDateUnavailable(date)) return true;
		const min = this.minValue;
		const max = this.maxValue;
		if (min?.date && compareDates(date, min.date) < 0) return true;
		if (max?.date && compareDates(date, max.date) > 0) return true;
		return false;
	}

	attributeChangedCallback(name: string): void {
		if (name === "value" && !this.applyingValue) {
			this.draft = parseIsoValue(this.getAttribute("value"), this.mode) ?? { date: null, time: null };
			this.badParts.clear();
		}
		if (name === "mode") {
			this.draft = parseIsoValue(this.getAttribute("value"), this.mode) ?? { date: null, time: null };
			this.badParts.clear();
			this.fragment.remount();
		}
		if (!this.root.firstChild) return;
		this.render();
	}

	override connectedCallback(): void {
		if (!this.draft.date && !this.draft.time) {
			this.draft = parseIsoValue(this.getAttribute("value"), this.mode) ?? { date: null, time: null };
		}
		super.connectedCallback();
	}

	/** The display text for a part: the field's own formatting, unless the user's unparseable text is
	 * still sitting there waiting to be fixed. */
	private displayText(part: Part): string {
		if (this.badParts.has(part)) return this.input(part)?.value ?? "";
		if (part === "date") return this.draft.date ? formatDateDisplay(this.draft.date, this.locale) : "";
		return this.draft.time
			? formatTimeDisplay(this.draft.time, { locale: this.locale, hour12: this.hour12, withSeconds: this.showSeconds })
			: "";
	}

	private timeOptions(): { iso: string; label: string; selected: boolean; disabled: boolean }[] {
		if (this.mode === "date") return [];
		const bounds = effectiveTimeBounds(this.draft.date, this.mode, this.minValue, this.maxValue);
		const selected = this.draft.time ? formatIsoTime(this.draft.time, this.showSeconds) : null;
		return timeListOptions({
			stepSeconds: this.step,
			listStep: this.listStep,
			min: bounds.min,
			max: bounds.max,
		}).map((time) => {
			const iso = formatIsoTime(time, this.showSeconds);
			return {
				iso,
				label: formatTimeDisplay(time, { locale: this.locale, hour12: this.hour12, withSeconds: this.showSeconds }),
				selected: iso === selected,
				disabled: false,
			};
		});
	}

	private get bindings(): Record<string, unknown> {
		const options = this.timeOptions();
		const min = this.minValue;
		const max = this.maxValue;
		return {
			mode: this.mode,
			size: this.size,
			disabled: this.disabled,
			readonly: this.readonly,
			required: this.required,
			invalid: this.invalid,
			open: this.open,
			label: this.getAttribute("label"),
			labelledby: this.getAttribute("labelledby"),
			ariaLabel: this.getAttribute("aria-label"),
			dateLabel: this.getAttribute("date-label") ?? "Date",
			timeLabel: this.getAttribute("time-label") ?? "Time",
			clearLabel: this.getAttribute("clear-label") ?? "Clear",
			openLabel: this.getAttribute("open-label") ?? (this.mode === "time" ? "Open time list" : "Open calendar"),
			panelLabel: this.getAttribute("panel-label") ?? this.defaultPanelLabel(),
			timeListLabel: this.getAttribute("time-label") ?? "Time",
			dateText: this.displayText("date"),
			timeText: this.displayText("time"),
			datePlaceholder: datePlaceholder(this.locale),
			timePlaceholder: this.timePlaceholderText(),
			hasValue: this.value.length > 0 || !!this.draft.date || !!this.draft.time,
			clearable: !this.noClear,
			uid: this.uid,
			panelId: `${this.uid}-panel`,
			labelId: `${this.uid}-label`,
			calendar:
				this.mode === "time"
					? null
					: {
							value: this.draft.date ? toIso(this.draft.date) : "",
							min: min?.date ? toIso(min.date) : "",
							max: max?.date ? toIso(max.date) : "",
							locale: this.locale ?? "",
							timezone: this.timezone ?? "",
							size: this.size,
							label: this.getAttribute("date-label") ?? "Date",
							firstDayOfWeek: this.firstDayOfWeek == null ? "" : String(this.firstDayOfWeek),
						},
			timeOptions: options,
		};
	}

	private defaultPanelLabel(): string {
		if (this.mode === "time") return "Choose a time";
		if (this.mode === "datetime") return "Choose a date and time";
		return "Choose a date";
	}

	private timePlaceholderText(): string {
		const core = this.showSeconds ? "HH:MM:SS" : "HH:MM";
		return this.hour12 ? `${core} AM` : core;
	}

	/** Structure the patch ops cannot express: the mode's field count, the boolean attrs, the membership of
	 * the time list (its selection moves by patch, but its contents need a rebuild), and every input the
	 * grid is handed as an attribute — the update ops patch only the grid's `value`, so a change to a
	 * bound, the locale, the zone, or the week's first day reaches it by rebuilding the panel. */
	private shapeSignature(): string {
		const options = this.timeOptions()
			.map((option) => option.iso)
			.join(",");
		return [
			this.mode,
			this.disabled,
			this.readonly,
			this.required,
			this.getAttribute("label") != null,
			this.getAttribute("labelledby") != null,
			this.noClear,
			this.min ?? "",
			this.max ?? "",
			this.locale ?? "",
			this.timezone ?? "",
			this.firstDayOfWeek ?? "",
			options,
		].join("|");
	}

	// ---- committing -------------------------------------------------------------------------

	/** Promote the draft to the reflected value when the mode's parts are all present, and post it to
	 * the form. An incomplete datetime (a date with no time yet) holds an empty value rather than
	 * inventing the missing half. */
	private syncValue(): void {
		const complete =
			this.mode === "date"
				? !!this.draft.date
				: this.mode === "time"
					? !!this.draft.time
					: !!this.draft.date && !!this.draft.time;
		const next = complete && this.badParts.size === 0 ? formatIsoValue(this.draft, this.mode, this.showSeconds) : "";
		this.applyingValue = true;
		if (next === "") this.removeAttribute("value");
		else this.setAttribute("value", next);
		this.applyingValue = false;
		this.syncFormValue();
	}

	private syncFormValue(): void {
		if (!this.internals) return;
		this.internals.setFormValue(this.value);
		const anchor = this.input("date") ?? this.input("time") ?? undefined;
		if (this.badParts.size > 0) {
			this.internals.setValidity({ badInput: true }, "Enter a valid value.", anchor);
		} else if (this.hasAttribute("invalid")) {
			this.internals.setValidity({ customError: true }, "Invalid value.", anchor);
		} else if (this.required && this.value === "") {
			this.internals.setValidity({ valueMissing: true }, "Please fill out this field.", anchor);
		} else {
			this.internals.setValidity({});
		}
	}

	private announce(message: string): void {
		if (this.announcer) this.announcer.textContent = message;
	}

	private emit(type: "input" | "change"): void {
		this.dispatchEvent(new Event(type, { bubbles: true, composed: true }));
	}

	/** Take a part's typed text: parse it, bound it, and either commit it or leave it flagged for repair. */
	private commitText(part: Part, raw: string): void {
		if (this.disabled || this.readonly) return;
		const text = raw.trim();
		if (text === "") {
			this.badParts.delete(part);
			this.draft = part === "date" ? { ...this.draft, date: null } : { ...this.draft, time: null };
			this.finishCommit();
			return;
		}
		const parsed =
			part === "date"
				? parseDateText(text, { locale: this.locale, today: this.today() })
				: parseTimeText(text, { locale: this.locale });
		if (!parsed) {
			this.badParts.add(part);
			this.announce(part === "date" ? "Not a valid date." : "Not a valid time.");
			this.finishCommit();
			return;
		}
		if (part === "date" && this.isDateUnavailable(parsed as CivilDate)) {
			this.badParts.add(part);
			this.announce("That date is unavailable.");
			this.finishCommit();
			return;
		}
		this.badParts.delete(part);
		this.draft =
			part === "date"
				? { ...this.draft, date: parsed as CivilDate }
				: { ...this.draft, time: snapTimeToStep(parsed as CivilTime, this.step) };
		this.clampDraft();
		this.finishCommit();
	}

	/** Pull the draft back inside the bounds. Only a complete value is clamped as a whole; a lone date in
	 * `datetime` mode is bounded by the date halves so a later time can still land it in range. */
	private clampDraft(): void {
		const min = this.minValue;
		const max = this.maxValue;
		if (!min && !max) return;
		if (this.mode === "datetime" && (!this.draft.date || !this.draft.time)) {
			let date = this.draft.date;
			if (!date) return;
			if (min?.date && compareDates(date, min.date) < 0) date = min.date;
			if (max?.date && compareDates(date, max.date) > 0) date = max.date;
			this.draft = { ...this.draft, date: this.settleOnAvailable(date, min, max) ?? date };
			return;
		}
		if (!isWithinBounds(this.draft, this.mode, min, max)) {
			this.draft = clampCivilValue(this.draft, this.mode, min, max);
			this.announce("Adjusted to the nearest allowed value.");
		}
		const date = this.draft.date;
		if (!date || !this.isDateUnavailable(date)) return;
		// A clamp lands *on* a bound, and a bound is free to fall on a day the rules refuse — a `min` of
		// Sunday under `disabled-weekdays="0,6"`. Committing it would hand back a date the grid itself greys
		// out: a value the user could never have picked or typed. Walk to the nearest one that is really
		// available instead.
		const settled = this.settleOnAvailable(date, min, max);
		if (settled) {
			this.draft = { ...this.draft, date: settled };
			this.announce("Adjusted to the nearest allowed value.");
			return;
		}
		this.badParts.add("date");
		this.announce("No available date in that range.");
	}

	/**
	 * The nearest date to `from` that is both inside the bounds and not ruled out. Searches away from
	 * whichever bound `from` is sitting on — the only direction with room — and gives up after a year
	 * rather than spinning on a range where every day is refused.
	 */
	private settleOnAvailable(from: CivilDate, min: CivilValue | null, max: CivilValue | null): CivilDate | null {
		if (!this.isDateUnavailable(from)) return from;
		const atMax = !!max?.date && compareDates(from, max.date) === 0;
		const direction = atMax && !(min?.date && compareDates(from, min.date) === 0) ? -1 : 1;
		let cursor = from;
		for (let step = 0; step < 366; step++) {
			cursor = addDays(cursor, direction);
			if (!this.isDisabled(cursor)) return cursor;
		}
		return null;
	}

	private finishCommit(): void {
		this.syncValue();
		this.render();
		this.emit("input");
		this.emit("change");
	}

	private clearValue(focusInput: boolean): void {
		if (this.disabled || this.readonly) return;
		this.draft = { date: null, time: null };
		this.badParts.clear();
		const date = this.input("date");
		const time = this.input("time");
		if (date) date.value = "";
		if (time) time.value = "";
		this.finishCommit();
		if (focusInput) (this.input("date") ?? this.input("time"))?.focus();
	}

	/** Step the value from the keyboard: a day (or, held with the alternate key, a month) on the date
	 * field, and one `step` (or an hour) on the time field. Starting from empty steps off today / now. */
	private nudge(part: Part, direction: 1 | -1, coarse: boolean): void {
		if (this.disabled || this.readonly) return;
		if (part === "date") {
			const base = this.draft.date ?? this.today();
			const stepped = this.draft.date
				? coarse
					? addMonths(base, direction)
					: addDays(base, direction)
				: base;
			if (this.isDateUnavailable(stepped)) return;
			this.badParts.delete("date");
			this.draft = { ...this.draft, date: stepped };
		} else {
			const base = this.draft.time ?? snapTimeToStep({ hour: 9, minute: 0, second: 0 }, this.step);
			const stepped = this.draft.time
				? nudgeTime(base, direction, coarse ? 3600 : this.step)
				: base;
			this.badParts.delete("time");
			this.draft = { ...this.draft, time: stepped };
		}
		this.clampDraft();
		this.finishCommit();
	}

	// ---- the popup --------------------------------------------------------------------------

	/** Open the panel against the whole control, so the grid lines up with the field rather than with
	 * whichever button happened to open it. Focus lands where the user is going: the grid in a date
	 * mode, the time list in `time` mode. */
	show(): void {
		if (this.disabled || this.readonly || this.open) return;
		const popover = this.popoverEl;
		const control = this.control;
		if (!popover || !control) return;
		popover.openFrom(control, { focus: "none" });
		this.focusPanel();
		this.render();
	}

	hide(): void {
		this.popoverEl?.hide("api");
	}

	toggle(): void {
		if (this.open) this.hide();
		else this.show();
	}

	private focusPanel(): void {
		const calendar = this.calendar;
		if (this.mode !== "time" && calendar) {
			// The grid takes focus in a date mode, but the time list still has to *show* its selection:
			// left alone it opens scrolled to midnight with the chosen time far below the fold.
			this.revealSelectedTimeOption();
			const cell = calendar.querySelector<HTMLElement>('[tabindex="0"]');
			(cell ?? (calendar as HTMLElement)).focus?.();
			return;
		}
		this.focusSelectedTimeOption();
	}

	/** The chosen (or first) time option, and the list it lives in. */
	private selectedTimeOption(): HTMLButtonElement | null {
		const options = this.timeOptionEls;
		if (options.length === 0) return null;
		return options.find((option) => option.getAttribute("aria-selected") === "true") ?? options[0]!;
	}

	/** Scroll the time list to its selection without taking focus off wherever it belongs. */
	private revealSelectedTimeOption(): void {
		this.selectedTimeOption()?.scrollIntoView({ block: "center" });
	}

	private focusSelectedTimeOption(): void {
		const target = this.selectedTimeOption();
		if (!target) return;
		target.focus();
		target.scrollIntoView({ block: "center" });
	}

	/** Move the roving tab stop through the time list. The listbox keeps exactly one tab stop, so Tab
	 * leaves the list rather than walking every option. */
	private rovingFocus(from: HTMLElement, to: "next" | "prev" | "first" | "last"): void {
		const options = this.timeOptionEls;
		if (options.length === 0) return;
		const index = options.indexOf(from as HTMLButtonElement);
		const next =
			to === "first"
				? 0
				: to === "last"
					? options.length - 1
					: Math.min(Math.max(index + (to === "next" ? 1 : -1), 0), options.length - 1);
		const target = options[next]!;
		for (const option of options) option.tabIndex = option === target ? 0 : -1;
		target.focus();
		target.scrollIntoView({ block: "nearest" });
	}

	private pickTime(iso: string): void {
		const time = parseTimeText(iso, { locale: this.locale });
		if (!time) return;
		this.badParts.delete("time");
		this.draft = { ...this.draft, time };
		this.clampDraft();
		this.finishCommit();
		if (this.mode === "time" || this.draft.date) this.hide();
	}

	/** The grid's pick. In `datetime` mode it does not close the panel — the time half is still unset, and
	 * dropping the user back into the field with an incomplete value would be a dead end — so focus moves
	 * on to the time list instead. */
	private pickDate(iso: string): void {
		const date = parseIsoValue(iso, "date")?.date;
		if (!date || this.isDisabled(date)) return;
		this.badParts.delete("date");
		this.draft = { ...this.draft, date };
		this.clampDraft();
		this.finishCommit();
		if (this.mode === "date") {
			this.hide();
			return;
		}
		this.focusSelectedTimeOption();
	}

	private onPopoverClose = (event: Event): void => {
		const reason = (event as CustomEvent<{ reason?: string }>).detail?.reason;
		if (reason === "dismiss") this.dismissedAt = this.now();
		this.render();
	};

	private onPopoverOpen = (): void => {
		this.render();
	};

	/** The grid's `change`: `detail.value` is the ISO day it settled on (the grid runs in `single` mode
	 * here, so the comma-separated list it can carry in other modes is always one date). */
	private onCalendarPick = (event: Event): void => {
		const detail = (event as CustomEvent<{ value?: string }>).detail;
		const iso = detail?.value ?? this.calendar?.value;
		if (typeof iso === "string" && iso.length > 0) this.pickDate(iso);
	};

	private now(): number {
		return typeof performance !== "undefined" ? performance.now() : Date.now();
	}

	// ---- fragment intents -------------------------------------------------------------------

	/** Which control the sandbox handler fired from. The serialized payload carries no modifier keys and
	 * no identity, so the source is resolved from the live event — which also lets one `nudge` intent mean
	 * "step the value" from an input and "move the roving focus" from the time list. */
	private sourceOf(event: Event): { part: Part | null; option: HTMLElement | null } {
		let part: Part | null = null;
		let option: HTMLElement | null = null;
		for (const node of event.composedPath()) {
			if (!(node instanceof HTMLElement)) continue;
			if (!option && node.classList.contains("xtyle-datepicker__time-option")) option = node;
			if (!part && node.classList.contains("xtyle-datepicker__input")) {
				part = node.dataset.part === "time" ? "time" : "date";
			}
			if ((node as Node) === (this as Node)) break;
		}
		return { part, option };
	}

	private applyIntent(intent: FragmentIntent, event: Event): void {
		const { part, option } = this.sourceOf(event);
		const keyboard = event as KeyboardEvent;

		if (intent.preventDefault) event.preventDefault();
		if (intent.stopPropagation) event.stopPropagation();

		if (intent.toggleOpen) {
			// the pointer that light-dismissed the panel a moment ago is the same one landing on the
			// trigger; without this the panel would close and instantly reopen
			if (!this.open && this.now() - this.dismissedAt < REOPEN_GUARD_MS) return;
			this.toggle();
			return;
		}

		if (intent.clearValue) {
			this.clearValue(intent.focusInput === true);
			return;
		}

		if (intent.activateValue !== undefined) {
			this.pickTime(intent.activateValue);
			return;
		}

		if (intent.closeMenu) {
			if (this.open) this.hide();
			return;
		}

		if (intent.openMenu && option) {
			this.rovingFocus(option, intent.openMenu === "first" ? "first" : "last");
			return;
		}

		if (intent.nudge) {
			if (option) {
				this.rovingFocus(option, intent.nudge > 0 ? "next" : "prev");
				return;
			}
			if (!part) return;
			// Alt+Arrow is the disclosure gesture on a field with a popup, not a value step
			if (keyboard.altKey) {
				if (intent.nudge > 0) this.hide();
				else this.show();
				return;
			}
			this.nudge(part, intent.nudge > 0 ? 1 : -1, intent.forceAlt === true);
			return;
		}

		if (intent.commit !== undefined && part) {
			// The inner input fires its own bubbling, composed `change`, which would reach a consumer
			// listening on the host *alongside* the one emitted below — every typed commit read as two.
			// Swallow the native event at the boundary and let the element's own emit be the single truth
			// (it is also the only one that fires for a grid pick, a clear, or an arrow step).
			if (event.type === "change") event.stopImmediatePropagation();
			this.commitText(part, intent.commit);
		}
	}

	// ---- rendering --------------------------------------------------------------------------

	/** Push the canonical display text back onto the live inputs. The op buffer can set the `value`
	 * *attribute*, but a user-typed input is dirty and no longer tracks it, so a programmatic change
	 * (a grid pick, a clear, a form reset) reaches the field only by assigning the property. A part the
	 * user is still repairing is left exactly as they typed it. */
	private syncDisplay(): void {
		for (const part of ["date", "time"] as Part[]) {
			if (this.badParts.has(part)) continue;
			const input = this.input(part);
			if (!input) continue;
			const text = this.displayText(part);
			if (input.value !== text) input.value = text;
		}
	}

	/** The live region that announces a rejected or clamped value. It renders nothing a mod could
	 * reshape, so it is plumbing and stays in the element rather than riding in the fragment. */
	private ensureAnnouncer(): void {
		if (this.announcer?.isConnected) return;
		const existing = this.root.querySelector<HTMLElement>(".xtyle-datepicker__announcer");
		if (existing) {
			this.announcer = existing;
			return;
		}
		const node = document.createElement("span");
		node.className = "xtyle-datepicker__announcer";
		node.setAttribute("role", "status");
		node.setAttribute("aria-live", "polite");
		this.root.appendChild(node);
		this.announcer = node;
	}

	private wire(): void {
		const popover = this.popoverEl;
		if (popover && popover !== this.wiredPopover) {
			this.wiredPopover?.removeEventListener("close", this.onPopoverClose);
			this.wiredPopover?.removeEventListener("open", this.onPopoverOpen);
			this.wiredPopover = popover;
			popover.addEventListener("close", this.onPopoverClose);
			popover.addEventListener("open", this.onPopoverOpen);
		}
		const calendar = this.calendar;
		if (calendar !== this.wiredCalendar) {
			this.wiredCalendar?.removeEventListener("change", this.onCalendarPick);
			this.wiredCalendar = calendar;
			calendar?.addEventListener("change", this.onCalendarPick);
		}
		// The grid takes the *same* predicate the typed field enforces, so a date that cannot be clicked
		// cannot be typed in behind the grid's back either. The weekday list and the bounds fold into it.
		if (calendar) {
			calendar.isDateDisabled = (iso: string) => {
				const date = parseIsoValue(iso, "date")?.date;
				return date ? this.isDisabled(date) : false;
			};
		}
	}

	private warnIfUnnamed(): void {
		if (this.getAttribute("label") || this.getAttribute("labelledby") || this.getAttribute("aria-label")) return;
		console.warn(
			"xtyle-date-picker: no accessible name. Provide a `label`, a `labelledby`, or an `aria-label` so the field is announced.",
		);
	}

	private afterApply(): void {
		this.ensureAnnouncer();
		this.wire();
		this.syncDisplay();
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(datePickerHostCss);
		this.fragment.reshapeIfChanged(this.shapeSignature());
		this.fragment.update(this.bindings);
		this.warnIfUnnamed();
		this.syncFormValue();
	}

	formDisabledCallback(disabled: boolean): void {
		this.disabled = disabled;
	}

	formResetCallback(): void {
		this.badParts.clear();
		this.draft = parseIsoValue(this.getAttribute("value"), this.mode) ?? { date: null, time: null };
		this.render();
	}
}

define("xtyle-date-picker", XtyleDatePicker);
