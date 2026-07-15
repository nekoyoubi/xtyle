import { renderIcon } from "../../../icons";

interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
	setText(selector: string, text: string): void;
}

interface DayBinding {
	date: string;
	day: string;
	label: string;
	filled?: boolean;
	outside?: boolean;
	blank?: boolean;
	today?: boolean;
	weekend?: boolean;
	selected?: boolean;
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

interface WeekBinding {
	number?: string;
	days: DayBinding[];
}

interface CalendarBindings {
	uid?: string;
	mode?: string;
	size?: string;
	tone?: string;
	title?: string;
	label?: string | null;
	labelledby?: string | null;
	weekdays?: Array<{ short: string; long: string }>;
	weeks?: WeekBinding[];
	weekNumbers?: boolean;
	weekLabel?: string;
	hideNav?: boolean;
	prevLabel?: string;
	nextLabel?: string;
	prevDisabled?: boolean;
	nextDisabled?: boolean;
	readonly?: boolean;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: CalendarBindings, ops: OpsBuilder) => void) => void };
};

function escapeAttr(value: string): string {
	return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeHtml(value: string): string {
	return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function calendarClass(bindings: CalendarBindings): string {
	const size = bindings.size ?? "md";
	return [
		"xtyle-calendar",
		`xtyle-calendar--${bindings.tone ?? "accent"}`,
		`xtyle-calendar--${bindings.mode ?? "single"}`,
		size !== "md" ? `xtyle-calendar--${size}` : "",
	]
		.filter(Boolean)
		.join(" ");
}

// The inline glyph is the zero-JS fallback: `<xtyle-icon>` only paints once the custom element
// upgrades, and the `static` render never loads the runtime. Once it does upgrade, the icon's
// shadow root has no `<slot>`, so this light child stops rendering and the fragment-backed glyph
// takes over.
function chevron(name: "chevron-left" | "chevron-right"): string {
	return `<xtyle-icon class="xtyle-calendar__chevron" part="chevron" name="${name}" aria-hidden="true">${renderIcon(name)}</xtyle-icon>`;
}

function navButton(rel: "prev" | "next", label: string, disabled: boolean): string {
	const glyph = chevron(rel === "prev" ? "chevron-left" : "chevron-right");
	const dis = disabled ? ' aria-disabled="true"' : "";
	return `<button type="button" class="xtyle-calendar__nav xtyle-calendar__nav--${rel}" part="nav" data-nav="${rel}" aria-label="${escapeAttr(label)}"${dis}>${glyph}</button>`;
}

function header(bindings: CalendarBindings): string {
	const uid = bindings.uid ?? "xtyle-calendar";
	const title = `<div class="xtyle-calendar__title" part="title" data-title id="${escapeAttr(uid)}-title" aria-live="polite">${escapeHtml(bindings.title ?? "")}</div>`;
	if (bindings.hideNav) return `<div class="xtyle-calendar__header" part="header">${title}</div>`;
	const prev = navButton("prev", bindings.prevLabel ?? "Previous month", bindings.prevDisabled === true);
	const next = navButton("next", bindings.nextLabel ?? "Next month", bindings.nextDisabled === true);
	return `<div class="xtyle-calendar__header" part="header">${prev}${title}${next}</div>`;
}

function marks(day: DayBinding): string {
	const dots = (day.dots ?? [])
		.map((tone) => `<span class="xtyle-calendar__dot" part="dot" data-tone="${escapeAttr(tone)}"></span>`)
		.join("");
	const row = dots ? `<span class="xtyle-calendar__marks" part="marks">${dots}</span>` : "";
	const busy = day.busy ? `<span class="xtyle-calendar__busy" part="busy"></span>` : "";
	const cue = day.filled ? `<span class="xtyle-calendar__cue" part="cue"></span>` : "";
	return `${row}${busy}${cue}`;
}

function flags(day: DayBinding): string {
	const on: string[] = [];
	if (day.filled) on.push("data-filled");
	if (day.outside) on.push("data-outside");
	if (day.today) on.push('aria-current="date"', "data-today");
	if (day.weekend) on.push("data-weekend");
	if (day.inRange) on.push("data-in-range");
	if (day.start) on.push("data-range-start");
	if (day.end) on.push("data-range-end");
	if (day.preview) on.push("data-preview");
	if (day.previewStart) on.push("data-preview-start");
	if (day.previewEnd) on.push("data-preview-end");
	if (day.previewEdge) on.push("data-preview-edge");
	if (day.busy) on.push("data-busy");
	return on.length ? ` ${on.join(" ")}` : "";
}

function cell(day: DayBinding, mode: string): string {
	if (day.blank) {
		return `<td class="xtyle-calendar__cell xtyle-calendar__cell--blank" part="cell" role="gridcell" aria-disabled="true"></td>`;
	}
	const selectable = mode === "multiple" || mode === "range" || mode === "single";
	const selected = selectable ? ` aria-selected="${day.selected ? "true" : "false"}"` : "";
	const disabled = day.disabled ? ' aria-disabled="true"' : "";
	const tabindex = day.focused ? "0" : "-1";
	const body = `<span class="xtyle-calendar__day" part="day"><span class="xtyle-calendar__num" part="num">${escapeHtml(day.day)}</span>${marks(day)}</span>`;
	return (
		`<td class="xtyle-calendar__cell" part="cell" role="gridcell" tabindex="${tabindex}" data-date="${escapeAttr(day.date)}"` +
		` aria-label="${escapeAttr(day.label)}"${selected}${disabled}${flags(day)}>${body}</td>`
	);
}

function weekRow(week: WeekBinding, bindings: CalendarBindings): string {
	const mode = bindings.mode ?? "single";
	const number = bindings.weekNumbers
		? `<th class="xtyle-calendar__weeknum" part="weeknum" scope="row" role="rowheader">${escapeHtml(week.number ?? "")}</th>`
		: "";
	const days = week.days.map((day) => cell(day, mode)).join("");
	return `<tr class="xtyle-calendar__week" part="week">${number}${days}</tr>`;
}

function head(bindings: CalendarBindings): string {
	const spacer = bindings.weekNumbers
		? `<th class="xtyle-calendar__weeknum" part="weeknum" scope="col" abbr="${escapeAttr(bindings.weekLabel ?? "Wk")}">${escapeHtml(bindings.weekLabel ?? "Wk")}</th>`
		: "";
	const days = (bindings.weekdays ?? [])
		.map(
			(weekday) =>
				`<th class="xtyle-calendar__weekday" part="weekday" scope="col" abbr="${escapeAttr(weekday.long)}">${escapeHtml(weekday.short)}</th>`,
		)
		.join("");
	return `<thead><tr>${spacer}${days}</tr></thead>`;
}

function rows(bindings: CalendarBindings): string {
	return (bindings.weeks ?? []).map((week) => weekRow(week, bindings)).join("");
}

function grid(bindings: CalendarBindings): string {
	const uid = bindings.uid ?? "xtyle-calendar";
	const readonly = bindings.readonly ? ' aria-readonly="true"' : "";
	return (
		`<table class="xtyle-calendar__grid" part="grid" role="grid" aria-labelledby="${escapeAttr(uid)}-title"${readonly}>` +
		`${head(bindings)}<tbody data-body>${rows(bindings)}</tbody></table>`
	);
}

function shell(bindings: CalendarBindings, ops: OpsBuilder): void {
	ops.setAttr(".xtyle-calendar", "class", calendarClass(bindings));
	const label = bindings.label ?? "";
	const labelledby = bindings.labelledby ?? "";
	ops.setAttr("[data-root]", "role", label || labelledby ? "group" : "");
	ops.setAttr("[data-root]", "aria-label", labelledby ? "" : label);
	ops.setAttr("[data-root]", "aria-labelledby", labelledby);
}

hooks.fragment.mount("calendar", (bindings, ops) => {
	shell(bindings, ops);
	ops.replaceChildren("[data-calendar]", `${header(bindings)}${grid(bindings)}`);
});

// The month, the selection, and the range preview all live in the day cells, so an update rebuilds
// the row body and patches the header in place — never the whole calendar. Re-creating the title
// would re-create the `aria-live` region with it, and a live region that appears already populated
// is not announced, so a month change would go silent for a screen reader on the nav buttons.
hooks.fragment.update("calendar", (bindings, ops) => {
	shell(bindings, ops);
	ops.setText("[data-title]", bindings.title ?? "");
	ops.setAttr('[data-nav="prev"]', "aria-disabled", bindings.prevDisabled ? "true" : "");
	ops.setAttr('[data-nav="next"]', "aria-disabled", bindings.nextDisabled ? "true" : "");
	ops.replaceChildren("[data-body]", rows(bindings));
});
