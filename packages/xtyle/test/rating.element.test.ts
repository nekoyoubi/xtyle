// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
// side effect: defines the <xtyle-rating> custom element on the happy-dom registry
import "../src/elements/rating.js";

type RatingEl = HTMLElement & { value: number; max: number };

function make(attrs: Record<string, string> = {}): RatingEl {
	const el = document.createElement("xtyle-rating") as RatingEl;
	for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
	document.body.appendChild(el);
	return el;
}

/** Give the element a real box so `valueAt` can map a pointer x to a value (happy-dom has no layout). */
function withBox(el: HTMLElement, width = 100): void {
	el.getBoundingClientRect = () =>
		({ left: 0, top: 0, right: width, bottom: 20, width, height: 20, x: 0, y: 0, toJSON() {} }) as DOMRect;
	// pointer capture is a layout API happy-dom doesn't implement; the handlers only need it to not throw
	el.setPointerCapture = () => {};
	el.releasePointerCapture = () => {};
}

function press(el: HTMLElement, key: string): KeyboardEvent {
	const ev = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
	el.dispatchEvent(ev);
	return ev;
}

function pointer(el: HTMLElement, type: string, clientX: number): void {
	el.dispatchEvent(new MouseEvent(type, { clientX, bubbles: true }));
}

function events(el: HTMLElement): { input: number[]; change: number[] } {
	const log = { input: [] as number[], change: [] as number[] };
	el.addEventListener("input", (e) => log.input.push((e as CustomEvent).detail.value));
	el.addEventListener("change", (e) => log.change.push((e as CustomEvent).detail.value));
	return log;
}

afterEach(() => {
	document.body.innerHTML = "";
});

describe("<xtyle-rating> rendering", () => {
	it("draws one glyph per unit in both the empty and filled rows", () => {
		const el = make({ value: "3", max: "5" });
		const empty = el.querySelector(".xtyle-rating__row--empty")!;
		const filled = el.querySelector(".xtyle-rating__row--filled")!;
		expect(empty.querySelectorAll("svg")).toHaveLength(5);
		expect(filled.querySelectorAll("svg")).toHaveLength(5);
	});

	it("clips the filled row to value / max as a width percentage", () => {
		expect((make({ value: "3", max: "5" }).querySelector(".xtyle-rating__row--filled") as HTMLElement).style.width).toBe("60%");
		expect((make({ value: "1", max: "4" }).querySelector(".xtyle-rating__row--filled") as HTMLElement).style.width).toBe("25%");
	});

	it("carries the root class, the interactive modifier, and size modifiers", () => {
		expect(make().classList.contains("xtyle-rating")).toBe(true);
		expect(make().classList.contains("xtyle-rating--interactive")).toBe(true);
		expect(make({ readonly: "" }).classList.contains("xtyle-rating--interactive")).toBe(false);
		expect(make({ size: "sm" }).classList.contains("xtyle-rating--sm")).toBe(true);
		expect(make({ size: "lg" }).classList.contains("xtyle-rating--lg")).toBe(true);
	});

	it("re-renders when the value attribute reflects through the setter", () => {
		const el = make({ value: "2", max: "5" });
		el.value = 4;
		expect(el.getAttribute("value")).toBe("4");
		expect((el.querySelector(".xtyle-rating__row--filled") as HTMLElement).style.width).toBe("80%");
	});
});

describe("<xtyle-rating> accessibility", () => {
	it("is a slider with full value semantics when interactive", () => {
		const el = make({ value: "3", max: "5" });
		expect(el.getAttribute("role")).toBe("slider");
		expect(el.getAttribute("tabindex")).toBe("0");
		expect(el.getAttribute("aria-valuemin")).toBe("0");
		expect(el.getAttribute("aria-valuemax")).toBe("5");
		expect(el.getAttribute("aria-valuenow")).toBe("3");
		expect(el.getAttribute("aria-valuetext")).toBe("3 out of 5");
		expect(el.getAttribute("aria-label")).toBe("3 out of 5 stars");
	});

	it("is a labelled image with no slider semantics when readonly", () => {
		const el = make({ value: "3", max: "5", readonly: "" });
		expect(el.getAttribute("role")).toBe("img");
		expect(el.hasAttribute("tabindex")).toBe(false);
		expect(el.hasAttribute("aria-valuenow")).toBe(false);
		expect(el.getAttribute("aria-label")).toBe("3 out of 5 stars");
	});

	it("prefers an explicit label attribute over the default", () => {
		expect(make({ value: "4", max: "5", label: "Quality" }).getAttribute("aria-label")).toBe("Quality");
	});
});

describe("<xtyle-rating> keyboard", () => {
	it("increments and decrements by one step, updating value and aria", () => {
		const el = make({ value: "2", max: "5" });
		const log = events(el);
		const ev = press(el, "ArrowRight");
		expect(el.value).toBe(3);
		expect(el.getAttribute("aria-valuenow")).toBe("3");
		expect(ev.defaultPrevented).toBe(true);
		expect(log.input).toEqual([3]);
		expect(log.change).toEqual([3]);
		press(el, "ArrowLeft");
		expect(el.value).toBe(2);
	});

	it("treats ArrowUp/ArrowDown as ArrowRight/ArrowLeft", () => {
		const el = make({ value: "2", max: "5" });
		press(el, "ArrowUp");
		expect(el.value).toBe(3);
		press(el, "ArrowDown");
		expect(el.value).toBe(2);
	});

	it("jumps to the bounds with Home and End", () => {
		const el = make({ value: "2", max: "5" });
		press(el, "End");
		expect(el.value).toBe(5);
		press(el, "Home");
		expect(el.value).toBe(0);
	});

	it("clamps at the bounds instead of overshooting", () => {
		const hi = make({ value: "5", max: "5" });
		press(hi, "ArrowRight");
		expect(hi.value).toBe(5);
		const lo = make({ value: "0", max: "5" });
		press(lo, "ArrowLeft");
		expect(lo.value).toBe(0);
	});

	it("steps by a half when allowhalf is set", () => {
		const el = make({ value: "2", max: "5", allowhalf: "" });
		press(el, "ArrowRight");
		expect(el.value).toBe(2.5);
	});

	it("ignores keys entirely when readonly", () => {
		const el = make({ value: "2", max: "5", readonly: "" });
		const ev = press(el, "ArrowRight");
		expect(el.value).toBe(2);
		expect(ev.defaultPrevented).toBe(false);
	});
});

describe("<xtyle-rating> pointer", () => {
	it("snaps a click up to the whole unit it lands in (ceil, not round)", () => {
		const el = make({ value: "0", max: "5" });
		withBox(el, 100);
		const log = events(el);
		pointer(el, "pointerdown", 50); // ratio 0.5 → raw 2.5 → ceil → 3
		expect(el.value).toBe(3);
		expect(log.input).toEqual([3]);
		expect(log.change).toEqual([3]);
	});

	it("counts the whole first icon from its left edge", () => {
		const el = make({ value: "0", max: "5" });
		withBox(el, 100);
		pointer(el, "pointerdown", 1); // ratio 0.01 → raw 0.05 → ceil → 1
		expect(el.value).toBe(1);
	});

	it("does not commit a value on a readonly control", () => {
		const el = make({ value: "2", max: "5", readonly: "" });
		withBox(el, 100);
		pointer(el, "pointerdown", 80);
		expect(el.value).toBe(2);
	});
});

describe("<xtyle-rating> hidden input", () => {
	it("mirrors the value into a named hidden input for form submission", () => {
		const el = make({ value: "3", max: "5", name: "rating" });
		const input = el.querySelector('input[type="hidden"]') as HTMLInputElement;
		expect(input).not.toBeNull();
		expect(input.name).toBe("rating");
		expect(input.value).toBe("3");
		press(el, "ArrowRight");
		expect((el.querySelector('input[type="hidden"]') as HTMLInputElement).value).toBe("4");
	});

	it("carries no hidden input without a name, or when readonly", () => {
		expect(make({ value: "3", max: "5" }).querySelector('input[type="hidden"]')).toBeNull();
		expect(make({ value: "3", max: "5", name: "r", readonly: "" }).querySelector('input[type="hidden"]')).toBeNull();
	});
});
