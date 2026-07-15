import { XtyleElement, define, type StyleMode } from "./base.js";
import type { FullTone, Size } from "../index.js";
import {
	addDays,
	addMonths,
	calendarBindings,
	calendarHostCss,
	clampDate,
	compareDates,
	formatCalendarValue,
	isDayDisabled,
	isSelectionComplete,
	parseCalendarValue,
	parseIso,
	parseMonth,
	resolveWeekInfo,
	selectDate,
	startOfWeek,
	todayIn,
	toIso,
	toMonthKey,
	type CalendarDecorations,
	type CalendarMode,
	type CivilDate,
} from "../markup/calendar.js";
import { FragmentHost } from "./fragment-host.js";
import { escapeSelectorValue } from "./fragments/selector-escape.js";
import { manifest, fragmentSources } from "./fragments/calendar/source.generated.js";

let calendarSeq = 0;

/**
 * A month grid: a controlled, popup-free calendar that selects a day, a set of days, or a range.
 *
 * **Dates are wall-clock, never instants.** Every value in and out is an ISO `YYYY-MM-DD` civil date
 * — a square on a calendar, not a moment — so nothing here can shift a date across a DST boundary.
 * `today` is resolved in the host's timezone (or the one `timezone` names), and every other date is
 * pure arithmetic on the triple.
 *
 * The element owns behavior: the keyboard grid (arrows across weeks and months, `PageUp`/`PageDown`
 * for months, `Home`/`End` for the week's edges), focus management, the range state machine, and the
 * hover preview of a pending range. The fill owns every pixel of chrome — the header, the weekday
 * row, each day cell, the event dots and busy bars — through `component.calendar`, so a mod can
 * restructure the grid without reimplementing a calendar. The behavior binds to two markers the fill
 * carries: `data-date` on a day cell and `data-nav` on a month step.
 */
export class XtyleCalendar extends XtyleElement {
	/** The grid is the element's own content — it projects nothing of the consumer's — so it always
	 * renders into light DOM: one structure whether the markup came from the server or was built
	 * client-side, and an app's stylesheet (and a mod's) can reach the cells it decorates. */
	protected override get styleMode(): StyleMode {
		return "scoped";
	}

	private uid = `xtyle-calendar-${calendarSeq++}`;
	private monthState: string | null = null;
	private focusState: string | null = null;
	private hoverState: string | null = null;
	private decorationsProp: CalendarDecorations | null = null;
	private wired = false;
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "calendar", {
		applyIntent: () => {},
	});

	private predicate?: (iso: string) => boolean;

	/** A day the calendar refuses. Set the property to a predicate; it runs once per rendered cell. */
	get isDateDisabled(): ((iso: string) => boolean) | undefined {
		return this.predicate;
	}
	set isDateDisabled(value: ((iso: string) => boolean) | undefined) {
		this.predicate = value;
		if (this.root.firstChild) this.render();
	}

	static get observedAttributes(): string[] {
		return [
			"mode",
			"value",
			"month",
			"min",
			"max",
			"locale",
			"timezone",
			"first-day-of-week",
			"weekday-format",
			"week-numbers",
			"fixed-weeks",
			"hide-outside-days",
			"hide-nav",
			"size",
			"tone",
			"readonly",
			"disabled",
			"label",
			"labelledby",
			"prev-label",
			"next-label",
			"week-label",
			"disabled-dates",
			"decorations",
		];
	}

	get mode(): CalendarMode {
		const mode = this.getAttribute("mode");
		return mode === "multiple" || mode === "range" ? mode : "single";
	}
	set mode(value: CalendarMode) {
		this.setAttribute("mode", value);
	}

	/** The selection as a comma-separated ISO list: one day, N days, or `start,end`. */
	get value(): string {
		return formatCalendarValue(this.dates);
	}
	set value(value: string | null | undefined) {
		this.reflectString("value", value);
	}

	/** The selection as ISO dates. In `range` mode it is `[start]` while pending and `[start, end]` once closed. */
	get dates(): string[] {
		return parseCalendarValue(this.getAttribute("value"), this.mode);
	}
	set dates(value: readonly string[]) {
		this.value = formatCalendarValue(parseCalendarValue(value.join(","), this.mode));
	}

	/** The displayed month, `YYYY-MM`. Uncontrolled by default: seeded from the selection, else today. */
	get month(): string {
		const attr = parseMonth(this.getAttribute("month"));
		if (attr) return toMonthKey(attr);
		if (this.monthState) return this.monthState;
		const anchor = parseIso(this.dates[0]) ?? this.today;
		return toMonthKey(anchor);
	}
	set month(value: string) {
		this.setAttribute("month", value);
	}

	get min(): string | null {
		return this.getAttribute("min");
	}
	set min(value: string | null | undefined) {
		this.reflectString("min", value);
	}

	get max(): string | null {
		return this.getAttribute("max");
	}
	set max(value: string | null | undefined) {
		this.reflectString("max", value);
	}

	get locale(): string | undefined {
		return this.getAttribute("locale") ?? undefined;
	}
	set locale(value: string | null | undefined) {
		this.reflectString("locale", value);
	}

	/** An IANA zone that pins what "today" means. Defaults to the host's zone; it shifts nothing else. */
	get timezone(): string | undefined {
		return this.getAttribute("timezone") ?? undefined;
	}
	set timezone(value: string | null | undefined) {
		this.reflectString("timezone", value);
	}

	/** The week's first day, 0 = Sunday … 6 = Saturday. Defaults to the locale's, via `Intl`. */
	get firstDayOfWeek(): number {
		const raw = this.getAttribute("first-day-of-week");
		const parsed = raw === null ? Number.NaN : Number(raw);
		if (Number.isInteger(parsed) && parsed >= 0 && parsed <= 6) return parsed;
		return resolveWeekInfo(this.locale).firstDay;
	}
	set firstDayOfWeek(value: number | null | undefined) {
		this.reflectString("first-day-of-week", value == null ? null : String(value));
	}

	get size(): Size {
		return (this.getAttribute("size") as Size) ?? "md";
	}
	set size(value: Size) {
		this.setAttribute("size", value);
	}

	get tone(): FullTone {
		return (this.getAttribute("tone") as FullTone) ?? "accent";
	}
	set tone(value: FullTone) {
		this.setAttribute("tone", value);
	}

	get readonly(): boolean {
		return this.hasAttribute("readonly");
	}
	set readonly(value: boolean) {
		this.reflectBoolean("readonly", value);
	}

	get disabled(): boolean {
		return this.hasAttribute("disabled");
	}
	set disabled(value: boolean) {
		this.reflectBoolean("disabled", value);
	}

	get weekNumbers(): boolean {
		return this.hasAttribute("week-numbers");
	}
	set weekNumbers(value: boolean) {
		this.reflectBoolean("week-numbers", value);
	}

	/** Always draw six rows, so the grid's height never jumps between months. */
	get fixedWeeks(): boolean {
		return this.hasAttribute("fixed-weeks");
	}
	set fixedWeeks(value: boolean) {
		this.reflectBoolean("fixed-weeks", value);
	}

	get hideOutsideDays(): boolean {
		return this.hasAttribute("hide-outside-days");
	}
	set hideOutsideDays(value: boolean) {
		this.reflectBoolean("hide-outside-days", value);
	}

	get hideNav(): boolean {
		return this.hasAttribute("hide-nav");
	}
	set hideNav(value: boolean) {
		this.reflectBoolean("hide-nav", value);
	}

	/** Days the calendar refuses, as an ISO list. Composes with `min`/`max` and `isDateDisabled`. */
	get disabledDates(): string[] {
		return (this.getAttribute("disabled-dates") ?? "")
			.split(",")
			.map((part) => part.trim())
			.filter(Boolean);
	}
	set disabledDates(value: readonly string[] | null | undefined) {
		this.reflectString("disabled-dates", value?.length ? value.join(",") : null);
	}

	/** Per-day marks, keyed by ISO date: event dots, a busy bar, extra text for the day's announcement. */
	get decorations(): CalendarDecorations {
		if (this.decorationsProp) return this.decorationsProp;
		const raw = this.getAttribute("decorations");
		if (!raw) return {};
		try {
			const parsed: unknown = JSON.parse(raw);
			return parsed && typeof parsed === "object" ? (parsed as CalendarDecorations) : {};
		} catch {
			return {};
		}
	}
	set decorations(value: CalendarDecorations | null | undefined) {
		this.decorationsProp = value ?? null;
		if (this.root.firstChild) this.render();
	}

	private get today(): CivilDate {
		return todayIn(this.timezone);
	}

	private get minDate(): CivilDate | null {
		return parseIso(this.min);
	}

	private get maxDate(): CivilDate | null {
		return parseIso(this.max);
	}

	attributeChangedCallback(name: string): void {
		if (name === "month") this.monthState = null;
		if (name === "value" || name === "mode") this.hoverState = null;
		if (this.root.firstChild) this.render();
	}

	/**
	 * The roving tab stop: the keyboard cursor while it's still inside the displayed month, else the
	 * first selected day of that month, else today when today is in view, else the first of the month —
	 * each clamped into `[min, max]`. Resolving it here (rather than trusting a stale cursor) is what
	 * keeps the grid reachable by Tab after a month step.
	 */
	private resolveFocus(): string {
		const month = parseMonth(this.month) ?? { ...this.today, day: 1 };
		const inMonth = (iso: string | null): boolean => !!iso && iso.slice(0, 7) === this.month;
		const candidate =
			(inMonth(this.focusState) ? this.focusState : null) ??
			this.dates.find((date) => inMonth(date)) ??
			(inMonth(toIso(this.today)) ? toIso(this.today) : null) ??
			toIso(month);
		const clamped = clampDate(parseIso(candidate) ?? month, this.minDate, this.maxDate);
		// A clamp can push the cursor out of the displayed month (min lands in a later one); keep it
		// on a visible square so the grid always has exactly one tab stop.
		return clamped.year === month.year && clamped.month === month.month ? toIso(clamped) : toIso(month);
	}

	private get bindings(): Record<string, unknown> {
		return calendarBindings({
			uid: this.uid,
			mode: this.mode,
			month: this.month,
			selected: this.dates,
			focusDate: this.disabled ? null : this.resolveFocus(),
			hoverDate: this.hoverState,
			today: toIso(this.today),
			locale: this.locale,
			firstDay: this.firstDayOfWeek,
			weekdayFormat: this.getAttribute("weekday-format") === "narrow" ? "narrow" : "short",
			weekNumbers: this.weekNumbers,
			fixedWeeks: this.fixedWeeks,
			outsideDays: !this.hideOutsideDays,
			size: this.size,
			tone: this.tone,
			label: this.getAttribute("label"),
			labelledby: this.getAttribute("labelledby"),
			hideNav: this.hideNav,
			prevLabel: this.getAttribute("prev-label") ?? undefined,
			nextLabel: this.getAttribute("next-label") ?? undefined,
			weekLabel: this.getAttribute("week-label") ?? undefined,
			readonly: this.readonly,
			disabled: this.disabled,
			min: this.min,
			max: this.max,
			disabledDates: this.disabledDates,
			isDateDisabled: this.isDateDisabled,
			decorations: this.decorations,
		}) as unknown as Record<string, unknown>;
	}

	/** Inputs that change the header/weekday structure the update ops can't patch; a diff here remounts. */
	private shapeSignature(): string {
		return JSON.stringify({
			hideNav: this.hideNav,
			weekNumbers: this.weekNumbers,
			locale: this.locale,
			firstDay: this.firstDayOfWeek,
			weekdayFormat: this.getAttribute("weekday-format"),
			label: this.getAttribute("label"),
			labelledby: this.getAttribute("labelledby"),
		});
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(calendarHostCss);
		const hadFocus = this.holdsFocus();
		this.fragment.reshapeIfChanged(this.shapeSignature());
		this.fragment.update(this.bindings);
		this.wire();
		if (hadFocus) this.focusCell(this.resolveFocus());
	}

	/** Whether the keyboard cursor is currently inside the grid — the cue to re-seat focus after a repaint. */
	private holdsFocus(): boolean {
		const scope = this.root as unknown as { activeElement?: Element | null };
		const active = scope.activeElement ?? (this.contains(document.activeElement) ? document.activeElement : null);
		return active instanceof HTMLElement && !!active.closest("[data-date]");
	}

	/** `CSS.escape` is for identifiers, not quoted attribute values: it escapes an ISO date's leading
	 * digit (`2026-…` → `\32 026-…`), which matches nothing inside `[data-date="…"]`. */
	private cell(iso: string): HTMLElement | null {
		return this.root.querySelector<HTMLElement>(`[data-date="${escapeSelectorValue(iso)}"]`);
	}

	private focusCell(iso: string): void {
		this.cell(iso)?.focus();
	}

	/** Move the keyboard cursor to a day, stepping the month when it lands outside the one on screen. */
	focusDay(iso?: string): void {
		const target = parseIso(iso ?? null) ?? parseIso(this.resolveFocus());
		if (!target) return;
		this.moveTo(target);
		this.focusCell(this.resolveFocus());
	}

	private moveTo(date: CivilDate): void {
		const clamped = clampDate(date, this.minDate, this.maxDate);
		const iso = toIso(clamped);
		this.focusState = iso;
		const monthKey = toMonthKey(clamped);
		if (monthKey !== this.month) this.setMonth(monthKey);
		else this.render();
	}

	private setMonth(monthKey: string): void {
		if (this.hasAttribute("month")) this.setAttribute("month", monthKey);
		else {
			this.monthState = monthKey;
			this.render();
		}
		this.dispatchEvent(new CustomEvent("month-change", { bubbles: true, composed: true, detail: { month: monthKey } }));
	}

	private stepMonth(delta: number): void {
		const anchor = parseMonth(this.month) ?? { ...this.today, day: 1 };
		this.setMonth(toMonthKey(addMonths(anchor, delta)));
	}

	private isDisabled(iso: string): boolean {
		return (
			this.disabled ||
			isDayDisabled(iso, {
				min: this.min,
				max: this.max,
				disabledDates: this.disabledDates,
				isDateDisabled: this.isDateDisabled,
			})
		);
	}

	private select(iso: string): void {
		if (this.readonly || this.isDisabled(iso)) return;
		const before = this.value;
		const next = selectDate(this.dates, iso, this.mode);
		const value = formatCalendarValue(next);
		this.focusState = iso;
		this.hoverState = null;
		this.value = value;
		// An outside-month day is a real target: picking one steps the grid onto its month.
		if (iso.slice(0, 7) !== this.month) this.setMonth(iso.slice(0, 7));
		else this.render();
		if (value !== before) this.emitChange(next);
	}

	private emitChange(dates: string[]): void {
		const mode = this.mode;
		this.dispatchEvent(
			new CustomEvent("change", {
				bubbles: true,
				composed: true,
				detail: {
					mode,
					value: formatCalendarValue(dates),
					dates,
					start: mode === "range" ? (dates[0] ?? null) : null,
					end: mode === "range" ? (dates[1] ?? null) : null,
					complete: dates.length > 0 && isSelectionComplete(dates, mode),
				},
			}),
		);
	}

	private wire(): void {
		if (this.wired) return;
		this.wired = true;
		this.root.addEventListener("click", (event) => this.onClick(event));
		this.root.addEventListener("keydown", (event) => this.onKeydown(event as KeyboardEvent));
		this.root.addEventListener("pointerover", (event) => this.onPointerOver(event));
		this.addEventListener("pointerleave", () => this.clearHover());
	}

	private onClick(event: Event): void {
		const target = event.target as HTMLElement | null;
		const nav = target?.closest<HTMLElement>("[data-nav]");
		if (nav) {
			if (nav.getAttribute("aria-disabled") === "true") return;
			this.stepMonth(nav.getAttribute("data-nav") === "prev" ? -1 : 1);
			return;
		}
		const cell = target?.closest<HTMLElement>("[data-date]");
		const iso = cell?.getAttribute("data-date");
		if (iso) this.select(iso);
	}

	/** Is the pending half of a range live — the state a hover or a keyboard move previews. */
	private get pendingRange(): boolean {
		return this.mode === "range" && this.dates.length === 1;
	}

	private onPointerOver(event: Event): void {
		if (!this.pendingRange || this.readonly || this.disabled) return;
		const iso = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-date]")?.getAttribute("data-date");
		if (!iso || iso === this.hoverState || this.isDisabled(iso)) return;
		this.hoverState = iso;
		this.render();
	}

	private clearHover(): void {
		if (this.hoverState === null) return;
		this.hoverState = null;
		if (this.root.firstChild) this.render();
	}

	private onKeydown(event: KeyboardEvent): void {
		const cell = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-date]");
		const iso = cell?.getAttribute("data-date");
		const from = parseIso(iso ?? null);
		if (!from) return;
		const step = this.keyStep(event, from);
		if (step) {
			event.preventDefault();
			this.hoverState = null;
			this.moveTo(step);
			this.focusCell(this.resolveFocus());
			return;
		}
		if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
			event.preventDefault();
			this.select(toIso(from));
			this.focusCell(this.resolveFocus());
			return;
		}
		if (event.key === "Escape" && this.pendingRange) {
			event.preventDefault();
			this.value = "";
			this.render();
			this.emitChange([]);
			this.focusCell(this.resolveFocus());
		}
	}

	/** The WAI-ARIA date-grid keymap: days, weeks, week edges, months, years. Returns null for anything else. */
	private keyStep(event: KeyboardEvent, from: CivilDate): CivilDate | null {
		const firstDay = this.firstDayOfWeek;
		switch (event.key) {
			case "ArrowLeft":
				return addDays(from, -1);
			case "ArrowRight":
				return addDays(from, 1);
			case "ArrowUp":
				return addDays(from, -7);
			case "ArrowDown":
				return addDays(from, 7);
			case "Home":
				return startOfWeek(from, firstDay);
			case "End":
				return addDays(startOfWeek(from, firstDay), 6);
			case "PageUp":
				return addMonths(from, event.shiftKey ? -12 : -1);
			case "PageDown":
				return addMonths(from, event.shiftKey ? 12 : 1);
			default:
				return null;
		}
	}

	/** Warn once when the range is open-ended in a way that makes the grid unreachable. */
	private warnIfInverted(): void {
		const min = this.minDate;
		const max = this.maxDate;
		if (min && max && compareDates(min, max) > 0) {
			console.warn(`xtyle-calendar: min (${this.min}) is after max (${this.max}); every day is disabled.`);
		}
	}

	connectedCallback(): void {
		super.connectedCallback();
		this.warnIfInverted();
	}
}

define("xtyle-calendar", XtyleCalendar);
