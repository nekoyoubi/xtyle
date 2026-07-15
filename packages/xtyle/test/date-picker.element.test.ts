// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import "../src/elements/date-picker.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { renderFragmentLight } from "../src/elements/fragment-ssr.js";
import { manifest, fragmentSources } from "../src/elements/fragments/date-picker/source.generated.js";

type PickerEl = HTMLElement & {
	value: string;
	mode: "date" | "time" | "datetime";
	isDateDisabled: ((iso: string) => boolean) | null;
	open: boolean;
	show(): void;
	hide(): void;
};

const submitted = new WeakMap<HTMLElement, (string | null)[]>();
const validity = new WeakMap<HTMLElement, Record<string, boolean>[]>();

/** happy-dom ships neither `ElementInternals` nor the Popover API. Stand both in: the internals stub
 * records what the element would post to a form, and the popover stub tracks open state so the panel's
 * own `toggle` wiring is exercised rather than skipped. */
beforeAll(async () => {
	const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
	proto.attachInternals = function attachInternals(this: HTMLElement) {
		const values: (string | null)[] = [];
		const flags: Record<string, boolean>[] = [];
		submitted.set(this, values);
		validity.set(this, flags);
		return {
			setFormValue(value: string | null) {
				values.push(value);
			},
			setValidity(flagsIn: Record<string, boolean>) {
				flags.push(flagsIn);
			},
		};
	};
	const OPEN_FLAG = "data-test-popover-open";
	const nativeMatches = HTMLElement.prototype.matches;
	proto.matches = function matches(this: HTMLElement, selector: string): boolean {
		if (selector === ":popover-open") return this.hasAttribute(OPEN_FLAG);
		return nativeMatches.call(this, selector);
	};
	const fire = (el: HTMLElement, newState: "open" | "closed"): void => {
		el.dispatchEvent(Object.assign(new Event("toggle"), { newState }));
	};
	proto.showPopover = function showPopover(this: HTMLElement): void {
		if (this.hasAttribute(OPEN_FLAG)) return;
		this.setAttribute(OPEN_FLAG, "");
		fire(this, "open");
	};
	proto.hidePopover = function hidePopover(this: HTMLElement): void {
		if (!this.hasAttribute(OPEN_FLAG)) return;
		this.removeAttribute(OPEN_FLAG);
		fire(this, "closed");
	};
	proto.scrollIntoView = function scrollIntoView(): void {};
	await import("../src/elements/popover.js");
	await loadFill(manifest, fragmentSources);
});

afterEach(() => {
	document.body.innerHTML = "";
	vi.restoreAllMocks();
});

function make(attrs: Record<string, string> = {}): PickerEl {
	const el = document.createElement("xtyle-date-picker") as PickerEl;
	for (const [name, value] of Object.entries({ label: "When", locale: "en-US", ...attrs })) {
		el.setAttribute(name, value);
	}
	document.body.appendChild(el);
	return el;
}

/** Created bare, the element resolves `styleMode: "auto"` to a shadow root; SSR-composed it stays
 * light. Every query goes through whichever root this instance actually painted into. */
function root(el: PickerEl): ShadowRoot | PickerEl {
	return el.shadowRoot ?? el;
}

function q<T extends Element>(el: PickerEl, selector: string): T | null {
	return root(el).querySelector<T>(selector);
}

function all(el: PickerEl, selector: string): Element[] {
	return [...root(el).querySelectorAll(selector)];
}

/** The class-carrying scaffold node — the host in light DOM, `[data-root]` inside the shadow. */
function rootClasses(el: PickerEl): DOMTokenList {
	return q<HTMLElement>(el, "[data-root]")!.classList;
}

function focused(el: PickerEl): Element | null {
	return el.shadowRoot ? el.shadowRoot.activeElement : document.activeElement;
}

function input(el: PickerEl, part: "date" | "time"): HTMLInputElement {
	return q<HTMLInputElement>(el, `.xtyle-datepicker__input--${part}`)!;
}

/** Type into a part and commit it, the way a blur or an Enter does. */
function type(el: PickerEl, part: "date" | "time", text: string): void {
	const field = input(el, part);
	field.value = text;
	field.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
}

function press(el: HTMLElement, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
	const ev = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, composed: true, ...init });
	el.dispatchEvent(ev);
	return ev;
}

function formValue(el: HTMLElement): string | null | undefined {
	const log = submitted.get(el);
	return log?.[log.length - 1];
}

function lastValidity(el: HTMLElement): Record<string, boolean> | undefined {
	const log = validity.get(el);
	return log?.[log.length - 1];
}

describe("typing is a first-class path", () => {
	it("parses the locale's own date order and reformats it", () => {
		const el = make();
		type(el, "date", "3/8/2026");
		expect(el.value).toBe("2026-03-08");
		expect(input(el, "date").value).toBe("03/08/2026");
	});

	it("reads the same digits the other way round in a day-first locale", () => {
		const el = make({ locale: "en-GB" });
		type(el, "date", "3/8/2026");
		expect(el.value).toBe("2026-08-03");
	});

	it("accepts ISO and the compact forms", () => {
		const el = make();
		type(el, "date", "2026-03-08");
		expect(el.value).toBe("2026-03-08");
		type(el, "date", "20260308");
		expect(el.value).toBe("2026-03-08");
	});

	it("parses a typed time, snapping it to the step", () => {
		const el = make({ mode: "time", step: "900" });
		type(el, "time", "9:37 pm");
		expect(el.value).toBe("21:30");
	});

	it("completes a datetime only once both halves are present", () => {
		const el = make({ mode: "datetime" });
		type(el, "date", "3/8/2026");
		expect(el.value).toBe("");
		type(el, "time", "9:30 am");
		expect(el.value).toBe("2026-03-08T09:30");
	});

	it("emits input and change on a commit", () => {
		const el = make();
		const seen: string[] = [];
		el.addEventListener("input", () => seen.push("input"));
		el.addEventListener("change", () => seen.push("change"));
		type(el, "date", "3/8/2026");
		expect(seen).toEqual(["input", "change"]);
	});
});

describe("bad input is flagged in place, not silently reverted", () => {
	it("keeps the user's text, flags the field, and holds the value back", () => {
		const el = make({ value: "2026-03-08" });
		type(el, "date", "2/31/2026");
		expect(input(el, "date").value).toBe("2/31/2026");
		expect(rootClasses(el).contains("xtyle-datepicker--invalid")).toBe(true);
		expect(input(el, "date").getAttribute("aria-invalid")).toBe("true");
		expect(el.value).toBe("");
	});

	it("announces why, in a polite live region", () => {
		const el = make();
		type(el, "date", "nonsense");
		const announcer = q(el, ".xtyle-datepicker__announcer")!;
		expect(announcer.getAttribute("aria-live")).toBe("polite");
		expect(announcer.textContent).toBe("Not a valid date.");
	});

	it("recovers once the text parses", () => {
		const el = make();
		type(el, "date", "2/31/2026");
		expect(rootClasses(el).contains("xtyle-datepicker--invalid")).toBe(true);
		type(el, "date", "3/8/2026");
		expect(rootClasses(el).contains("xtyle-datepicker--invalid")).toBe(false);
		expect(el.value).toBe("2026-03-08");
	});

	it("blocks form submission while the input is unparseable", () => {
		const el = make();
		type(el, "date", "nonsense");
		expect(lastValidity(el)?.badInput).toBe(true);
	});
});

describe("bounds and disabled dates are enforced on typed input too", () => {
	it("clamps a typed date into range and says so", () => {
		const el = make({ min: "2026-03-08", max: "2026-03-20" });
		type(el, "date", "1/1/2026");
		expect(el.value).toBe("2026-03-08");
		expect(q(el, ".xtyle-datepicker__announcer")!.textContent).toContain("Adjusted");
	});

	it("refuses a typed date the weekday rule rules out", () => {
		// 2026-03-08 is a Sunday
		const el = make({ "disabled-weekdays": "0,6" });
		type(el, "date", "3/8/2026");
		expect(el.value).toBe("");
		expect(q(el, ".xtyle-datepicker__announcer")!.textContent).toBe("That date is unavailable.");
	});

	it("refuses a typed date the predicate rules out — the grid's rule cannot be typed around", () => {
		const el = make();
		el.isDateDisabled = (iso) => iso === "2026-03-08";
		type(el, "date", "3/8/2026");
		expect(el.value).toBe("");
		type(el, "date", "3/9/2026");
		expect(el.value).toBe("2026-03-09");
	});

	it("hands the same predicate to the grid it enforces on the field", () => {
		const el = make();
		el.isDateDisabled = (iso) => iso === "2026-03-08";
		const calendar = q(el, ".xtyle-datepicker__calendar") as HTMLElement & {
			isDateDisabled?: (iso: string) => boolean;
		};
		expect(calendar.isDateDisabled?.("2026-03-08")).toBe(true);
		expect(calendar.isDateDisabled?.("2026-03-09")).toBe(false);
	});

	it("never clamps onto a date the grid itself refuses", () => {
		// 2026-03-08 is a Sunday, so the `min` bound falls on a day the weekday rule rules out. Clamping
		// straight to it would hand back a value the user could neither click nor type.
		const el = make({ min: "2026-03-08", max: "2026-03-20", "disabled-weekdays": "0,6" });
		type(el, "date", "1/1/2026");
		expect(el.value).toBe("2026-03-09");
		expect(rootClasses(el).contains("xtyle-datepicker--invalid")).toBe(false);
	});

	it("settles backwards when the max bound is the refused one", () => {
		// 2026-03-21 is a Saturday
		const el = make({ min: "2026-03-02", max: "2026-03-21", "disabled-weekdays": "0,6" });
		type(el, "date", "12/1/2026");
		expect(el.value).toBe("2026-03-20");
	});

	it("gives up honestly when the whole range is ruled out", () => {
		const el = make({ min: "2026-03-07", max: "2026-03-08", "disabled-weekdays": "0,6" });
		type(el, "date", "1/1/2026");
		expect(el.value).toBe("");
		expect(rootClasses(el).contains("xtyle-datepicker--invalid")).toBe(true);
	});

	it("clamps a time into a business-hours window", () => {
		const el = make({ mode: "time", min: "09:00", max: "17:00", step: "1800" });
		type(el, "time", "7:00 am");
		expect(el.value).toBe("09:00");
		type(el, "time", "11:00 pm");
		expect(el.value).toBe("17:00");
	});
});

describe("the keyboard steps the value without ever opening the popup", () => {
	it("steps a day on the arrows and a month on PageUp/PageDown", () => {
		const el = make({ value: "2026-03-08" });
		const field = input(el, "date");
		const ev = press(field, "ArrowUp");
		expect(ev.defaultPrevented).toBe(true);
		expect(el.value).toBe("2026-03-09");
		press(field, "ArrowDown");
		expect(el.value).toBe("2026-03-08");
		press(field, "PageUp");
		expect(el.value).toBe("2026-04-08");
		press(field, "PageDown");
		expect(el.value).toBe("2026-03-08");
	});

	it("steps across a spring-forward day without losing it", () => {
		const el = make({ value: "2026-03-07" });
		press(input(el, "date"), "ArrowUp");
		expect(el.value).toBe("2026-03-08");
	});

	it("steps the clock by exactly one step, saturating at the end of the day", () => {
		const el = make({ mode: "time", value: "23:45", step: "900" });
		const field = input(el, "time");
		press(field, "ArrowUp");
		// saturates rather than wrapping into the next day, which would move a datetime's date half
		expect(el.value).toBe("23:59:59");
	});

	it("commits on Enter", () => {
		const el = make();
		const field = input(el, "date");
		field.value = "3/8/2026";
		press(field, "Enter");
		expect(el.value).toBe("2026-03-08");
	});

	it("opens the popup on Alt+ArrowDown rather than stepping the value", () => {
		const el = make({ value: "2026-03-08" });
		press(input(el, "date"), "ArrowDown", { altKey: true });
		expect(el.open).toBe(true);
		expect(el.value).toBe("2026-03-08");
	});

	it("closes the popup on Escape from the field", () => {
		const el = make();
		el.show();
		expect(el.open).toBe(true);
		press(input(el, "date"), "Escape");
		expect(el.open).toBe(false);
	});
});

describe("the clear affordance", () => {
	it("shows only when the field holds a value and is editable", () => {
		const empty = make();
		expect((q<HTMLElement>(empty, ".xtyle-datepicker__clear")!).hidden).toBe(true);
		const filled = make({ value: "2026-03-08" });
		expect((q<HTMLElement>(filled, ".xtyle-datepicker__clear")!).hidden).toBe(false);
		const locked = make({ value: "2026-03-08", readonly: "" });
		expect((q<HTMLElement>(locked, ".xtyle-datepicker__clear")!).hidden).toBe(true);
	});

	it("empties the value and hands focus back to the field", () => {
		const el = make({ value: "2026-03-08" });
		(q<HTMLButtonElement>(el, ".xtyle-datepicker__clear")!).click();
		expect(el.value).toBe("");
		expect(input(el, "date").value).toBe("");
		expect(focused(el)).toBe(input(el, "date"));
	});

	it("is dropped by no-clear", () => {
		const el = make({ value: "2026-03-08", "no-clear": "" });
		expect((q<HTMLElement>(el, ".xtyle-datepicker__clear")!).hidden).toBe(true);
	});
});

describe("the popup", () => {
	it("opens from the trigger and reflects the state on it", () => {
		const el = make();
		const trigger = q<HTMLButtonElement>(el, ".xtyle-datepicker__trigger")!;
		expect(trigger.getAttribute("aria-haspopup")).toBe("dialog");
		expect(trigger.getAttribute("aria-expanded")).toBe("false");
		trigger.click();
		expect(el.open).toBe(true);
		expect(q(el, ".xtyle-datepicker__trigger")!.getAttribute("aria-expanded")).toBe("true");
	});

	it("hosts the calendar rather than growing a second grid of its own", () => {
		const el = make({ value: "2026-03-08" });
		const calendar = q(el, ".xtyle-datepicker__calendar")!;
		expect(calendar.tagName.toLowerCase()).toBe("xtyle-calendar");
		expect(calendar.getAttribute("value")).toBe("2026-03-08");
		expect(all(el, "xtyle-calendar")).toHaveLength(1);
	});

	it("passes the bounds through to the grid", () => {
		const el = make({ min: "2026-03-08", max: "2026-03-20" });
		const calendar = q(el, ".xtyle-datepicker__calendar")!;
		expect(calendar.getAttribute("min")).toBe("2026-03-08");
		expect(calendar.getAttribute("max")).toBe("2026-03-20");
	});

	it("takes the grid's pick and closes in date mode", () => {
		const el = make();
		el.show();
		const calendar = q(el, ".xtyle-datepicker__calendar")!;
		calendar.dispatchEvent(
			new CustomEvent("change", { bubbles: true, composed: true, detail: { value: "2026-03-08" } }),
		);
		expect(el.value).toBe("2026-03-08");
		expect(el.open).toBe(false);
	});

	it("keeps the panel open after a date pick in datetime mode — the time half is still unset", () => {
		const el = make({ mode: "datetime" });
		el.show();
		q(el, ".xtyle-datepicker__calendar")!.dispatchEvent(
			new CustomEvent("change", { bubbles: true, composed: true, detail: { value: "2026-03-08" } }),
		);
		expect(el.value).toBe("");
		expect(el.open).toBe(true);
	});

	it("renders no grid at all in time mode", () => {
		const el = make({ mode: "time" });
		expect(q(el, "xtyle-calendar")).toBeNull();
	});
});

describe("the compose seam with Calendar", () => {
	it("hands the grid every input it shares, under the grid's own attribute names", () => {
		const el = make({
			value: "2026-03-08",
			min: "2026-03-01",
			max: "2026-03-31",
			locale: "en-GB",
			timezone: "Asia/Tokyo",
			"first-day-of-week": "1",
			"date-label": "Delivery",
		});
		const calendar = q(el, ".xtyle-datepicker__calendar")!;
		expect(calendar.getAttribute("value")).toBe("2026-03-08");
		expect(calendar.getAttribute("min")).toBe("2026-03-01");
		expect(calendar.getAttribute("max")).toBe("2026-03-31");
		expect(calendar.getAttribute("locale")).toBe("en-GB");
		expect(calendar.getAttribute("timezone")).toBe("Asia/Tokyo");
		expect(calendar.getAttribute("first-day-of-week")).toBe("1");
		expect(calendar.getAttribute("label")).toBe("Delivery");
		expect(calendar.getAttribute("mode")).toBe("single");
	});

	it("repaints the grid when a shared input changes after mount", () => {
		const el = make({ min: "2026-03-08" });
		expect(q(el, ".xtyle-datepicker__calendar")!.getAttribute("min")).toBe("2026-03-08");
		el.setAttribute("min", "2026-04-01");
		expect(q(el, ".xtyle-datepicker__calendar")!.getAttribute("min")).toBe("2026-04-01");
		el.setAttribute("first-day-of-week", "1");
		expect(q(el, ".xtyle-datepicker__calendar")!.getAttribute("first-day-of-week")).toBe("1");
	});

	it("names the predicate the same thing the grid does, and hands it straight over", () => {
		const el = make();
		const predicate = (iso: string): boolean => iso === "2026-03-17";
		el.isDateDisabled = predicate;
		expect(el.isDateDisabled).toBe(predicate);
		const calendar = q(el, ".xtyle-datepicker__calendar") as HTMLElement & {
			isDateDisabled?: (iso: string) => boolean;
		};
		expect(calendar.isDateDisabled?.("2026-03-17")).toBe(true);
	});

	it("folds the weekday rule and the bounds into the predicate the grid is handed", () => {
		const el = make({ min: "2026-03-02", max: "2026-03-20", "disabled-weekdays": "0,6" });
		const calendar = q(el, ".xtyle-datepicker__calendar") as HTMLElement & {
			isDateDisabled?: (iso: string) => boolean;
		};
		// 2026-03-08 is a Sunday; 2026-03-01 is before `min`; 2026-03-09 is a Monday in range
		expect(calendar.isDateDisabled?.("2026-03-08")).toBe(true);
		expect(calendar.isDateDisabled?.("2026-03-01")).toBe(true);
		expect(calendar.isDateDisabled?.("2026-03-09")).toBe(false);
	});
});

describe("the time listbox", () => {
	it("is a listbox of options, quantized to the list step", () => {
		const el = make({ mode: "time", step: "3600" });
		const list = q(el, ".xtyle-datepicker__times")!;
		expect(list.getAttribute("role")).toBe("listbox");
		expect(list.querySelectorAll('[role="option"]')).toHaveLength(24);
	});

	it("floors a 60s step at a quarter hour rather than rendering 1440 options", () => {
		const el = make({ mode: "time" });
		expect(all(el, ".xtyle-datepicker__time-option")).toHaveLength(96);
	});

	it("keeps one tab stop and walks it with the arrows", () => {
		const el = make({ mode: "time", step: "3600" });
		const options = [...all(el, ".xtyle-datepicker__time-option") as HTMLButtonElement[]];
		expect(options.filter((o) => o.tabIndex === 0)).toHaveLength(1);
		press(options[0]!, "ArrowDown");
		expect(focused(el)).toBe(options[1]);
		expect(options.filter((o) => o.tabIndex === 0)).toHaveLength(1);
		press(options[1]!, "End");
		expect(focused(el)).toBe(options[23]);
	});

	it("commits the chosen time and closes", () => {
		const el = make({ mode: "time", step: "3600" });
		el.show();
		const nine = q<HTMLButtonElement>(el, '.xtyle-datepicker__time-option[data-iso="09:00"]')!;
		nine.click();
		expect(el.value).toBe("09:00");
		expect(nine.getAttribute("aria-selected")).toBe("true");
		expect(el.open).toBe(false);
	});

	it("only offers times inside the bounds", () => {
		const el = make({ mode: "time", step: "3600", min: "09:00", max: "12:00" });
		const isos = [...all(el, ".xtyle-datepicker__time-option")].map((o) => o.getAttribute("data-iso"));
		expect(isos).toEqual(["09:00", "10:00", "11:00", "12:00"]);
	});

	it("scrolls the list to its selection on open, even when the grid takes focus", () => {
		// datetime opens with focus in the grid, but a list left sitting at midnight hides the chosen
		// time far below the fold — it has to be scrolled to whether or not it is focused
		const el = make({ mode: "datetime", value: "2026-03-08T09:30", step: "900" });
		const scrolled: Element[] = [];
		for (const option of all(el, ".xtyle-datepicker__time-option")) {
			(option as HTMLElement).scrollIntoView = () => scrolled.push(option);
		}
		el.show();
		expect(scrolled).toHaveLength(1);
		expect(scrolled[0]!.getAttribute("data-iso")).toBe("09:30");
		expect(scrolled[0]!.getAttribute("aria-selected")).toBe("true");
	});

	it("applies a datetime's time floor only on the bounding day", () => {
		const el = make({ mode: "datetime", step: "3600", min: "2026-03-08T09:00", max: "2026-03-20T17:00" });
		type(el, "date", "3/8/2026");
		const onBound = [...all(el, ".xtyle-datepicker__time-option")].map((o) => o.getAttribute("data-iso"));
		expect(onBound[0]).toBe("09:00");
		type(el, "date", "3/9/2026");
		const openDay = [...all(el, ".xtyle-datepicker__time-option")].map((o) => o.getAttribute("data-iso"));
		expect(openDay[0]).toBe("00:00");
	});
});

describe("locale drives the clock, nothing is hardcoded", () => {
	it("shows a 12-hour clock in a 12-hour locale and 24 in a 24-hour one", () => {
		const us = make({ mode: "time", value: "21:30", locale: "en-US" });
		expect(input(us, "time").value).toMatch(/9:30/);
		const gb = make({ mode: "time", value: "21:30", locale: "en-GB" });
		expect(input(gb, "time").value).toMatch(/21:30/);
	});

	it("lets hour-cycle force the posture against the locale", () => {
		const el = make({ mode: "time", value: "21:30", locale: "en-US", "hour-cycle": "24" });
		expect(input(el, "time").value).toMatch(/21:30/);
	});

	it("shows the locale's field order in the placeholder", () => {
		expect(input(make({ locale: "en-US" }), "date").placeholder).toBe("MM/DD/YYYY");
		expect(input(make({ locale: "en-GB" }), "date").placeholder).toBe("DD/MM/YYYY");
	});
});

describe("the value is a wall-clock reading, never an instant", () => {
	it("refuses an offset-bearing value rather than reinterpreting it", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		const el = make({ mode: "datetime" });
		el.value = "2026-03-08T02:30Z";
		expect(el.value).toBe("");
		expect(warn).toHaveBeenCalled();
	});

	it("holds a datetime inside the DST gap exactly as written", () => {
		const el = make({ mode: "datetime", value: "2026-03-08T02:30" });
		expect(el.value).toBe("2026-03-08T02:30");
		expect(input(el, "date").value).toBe("03/08/2026");
		expect(input(el, "time").value).toMatch(/2:30/);
	});

	it("resolves a bare day against the day it is in `timezone`, not the visitor's", () => {
		// 20:00Z on the 31st is already the 1st of the next month in Tokyo
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-03-31T20:00:00Z"));
		try {
			const utc = make({ timezone: "UTC" });
			type(utc, "date", "5");
			expect(utc.value).toBe("2026-03-05");

			const tokyo = make({ timezone: "Asia/Tokyo" });
			type(tokyo, "date", "5");
			expect(tokyo.value).toBe("2026-04-05");
		} finally {
			vi.useRealTimers();
		}
	});
});

describe("form participation", () => {
	it("posts the canonical value, not the display text", () => {
		const el = make({ name: "when", value: "2026-03-08" });
		expect(formValue(el)).toBe("2026-03-08");
		type(el, "date", "3/9/2026");
		expect(formValue(el)).toBe("2026-03-09");
	});

	it("reports valueMissing while a required field is empty", () => {
		const el = make({ name: "when", required: "" });
		expect(lastValidity(el)?.valueMissing).toBe(true);
	});

	it("restores the reflected value on a form reset", () => {
		const el = make({ name: "when", value: "2026-03-08" });
		type(el, "date", "3/9/2026");
		(el as unknown as { formResetCallback(): void }).formResetCallback();
		expect(input(el, "date").value).toBe("03/09/2026");
	});
});

describe("accessibility", () => {
	it("names the group and each field inside it", () => {
		const el = make({ mode: "datetime", label: "Appointment" });
		const group = q(el, '[role="group"]')!;
		const labelId = q(el, ".xtyle-datepicker__label")!.id;
		expect(group.getAttribute("aria-labelledby")).toBe(labelId);
		expect(input(el, "date").getAttribute("aria-label")).toBe("Date");
		expect(input(el, "time").getAttribute("aria-label")).toBe("Time");
	});

	it("takes overridden field names", () => {
		const el = make({ mode: "datetime", "date-label": "Day", "time-label": "Hour" });
		expect(input(el, "date").getAttribute("aria-label")).toBe("Day");
		expect(input(el, "time").getAttribute("aria-label")).toBe("Hour");
	});

	it("warns when the field has no accessible name", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		const el = document.createElement("xtyle-date-picker");
		document.body.appendChild(el);
		expect(warn).toHaveBeenCalledWith(expect.stringContaining("no accessible name"));
	});

	it("wires the trigger to the panel it controls", () => {
		const el = make();
		const trigger = q(el, ".xtyle-datepicker__trigger")!;
		expect(trigger.getAttribute("aria-controls")).toBeTruthy();
		expect(q(el, ".xtyle-datepicker__popover")!.getAttribute("panel-role")).toBe("dialog");
	});

	it("blocks typing and the popup when readonly or disabled", () => {
		const readonly = make({ value: "2026-03-08", readonly: "" });
		type(readonly, "date", "3/9/2026");
		expect(readonly.value).toBe("2026-03-08");
		readonly.show();
		expect(readonly.open).toBe(false);

		const disabled = make({ value: "2026-03-08", disabled: "" });
		expect(input(disabled, "date").disabled).toBe(true);
		disabled.show();
		expect(disabled.open).toBe(false);
	});
});

describe("server-rendered markup matches what the client paints", () => {
	it("renders the control, the inputs, and the popup with no runtime", async () => {
		const html = await renderFragmentLight("date-picker", {
			mode: "datetime",
			size: "md",
			label: "Appointment",
			dateLabel: "Date",
			timeLabel: "Time",
			dateText: "03/08/2026",
			timeText: "9:30 AM",
			datePlaceholder: "MM/DD/YYYY",
			timePlaceholder: "HH:MM AM",
			hasValue: true,
			clearable: true,
			uid: "dp",
			panelId: "dp-panel",
			labelId: "dp-label",
			calendar: { value: "2026-03-08", locale: "en-US" },
			timeOptions: [{ iso: "09:30", label: "9:30 AM", selected: true }],
		});
		expect(html).toContain('role="group"');
		expect(html).toContain('value="03/08/2026"');
		expect(html).toContain("<xtyle-calendar");
		expect(html).toContain('role="listbox"');
		expect(html).toContain('aria-selected="true"');
		expect(html).toContain("<xtyle-popover");
	});
});
