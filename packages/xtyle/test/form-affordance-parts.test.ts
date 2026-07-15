// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { radioCss } from "../src/css/components/radio.js";
import { switchCss } from "../src/css/components/switch.js";
import { sliderCss } from "../src/css/components/slider.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { manifest as radioManifest, fragmentSources as radioSources } from "../src/elements/fragments/radio/source.generated.js";
import { manifest as switchManifest, fragmentSources as switchSources } from "../src/elements/fragments/switch/source.generated.js";
import { manifest as sliderManifest, fragmentSources as sliderSources } from "../src/elements/fragments/slider/source.generated.js";

/** happy-dom ships no `ElementInternals`, so the three controls' `attachInternals()` returns
 * nothing and their form value never lands anywhere a test can read. Stand one in that records
 * every `setFormValue` call, which is the whole of what a form-associated element contributes to
 * `FormData` — so a broken affordance shows up as a wrong (or missing) submitted value. */
const submitted = new WeakMap<HTMLElement, (string | null)[]>();

function formValue(el: HTMLElement): string | null | undefined {
	const log = submitted.get(el);
	return log?.[log.length - 1];
}

beforeAll(async () => {
	const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
	proto.attachInternals = function attachInternals(this: HTMLElement) {
		const log: (string | null)[] = [];
		submitted.set(this, log);
		return {
			setFormValue(value: string | null) {
				log.push(value);
			},
		};
	};
	// side effect: defines the custom elements. Imported after the stub so the constructors,
	// which call `attachInternals()`, see it on first construction.
	await import("../src/elements/radio.js");
	await import("../src/elements/switch.js");
	await import("../src/elements/slider.js");
	await Promise.all([
		loadFill(radioManifest, radioSources),
		loadFill(switchManifest, switchSources),
		loadFill(sliderManifest, sliderSources),
	]);
});

afterEach(() => {
	document.body.innerHTML = "";
});

type Radio = HTMLElement & { checked: boolean; disabled: boolean; value: string; control: HTMLInputElement | null };
type Switch = HTMLElement & { checked: boolean; disabled: boolean; value: string };
type Slider = HTMLElement & { value: number; disabled: boolean };

function make<T extends HTMLElement>(tag: string, attrs: Record<string, string> = {}, parent: Element = document.body): T {
	const el = document.createElement(tag) as T;
	for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
	parent.appendChild(el);
	return el;
}

function shadow(el: HTMLElement): ShadowRoot {
	const root = el.shadowRoot;
	if (!root) throw new Error(`${el.tagName} has no shadow root`);
	return root;
}

function press(el: HTMLElement, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
	const event = new KeyboardEvent("keydown", { key, bubbles: true, composed: true, cancelable: true, ...init });
	el.dispatchEvent(event);
	return event;
}

describe("radio: the checked glyph is a node, not a pseudo-element", () => {
	it("renders the dot as a real child of the indicator, exposed as its own part", () => {
		const el = make<Radio>("xtyle-radio", { name: "plan", value: "pro", label: "Pro" });
		const indicator = shadow(el).querySelector(".xtyle-radio__indicator")!;
		const dot = indicator.querySelector(".xtyle-radio__dot");
		expect(dot).not.toBeNull();
		expect(dot!.getAttribute("part")).toBe("dot");
	});

	it("paints the checked glyph only through the dot node, so a fill that swaps in a glyph leaves no stray dot", () => {
		expect(radioCss).toContain(".xtyle-radio__dot");
		expect(radioCss).not.toContain(".xtyle-radio__indicator::after");
		expect(radioCss).not.toContain(".xtyle-radio__indicator::before");
		expect(radioCss).toContain(".xtyle-radio__control:checked ~ .xtyle-radio__indicator .xtyle-radio__dot");
	});

	it("keeps the glyph out of the accessibility tree behind the indicator's aria-hidden", () => {
		const el = make<Radio>("xtyle-radio", { name: "plan", value: "pro", label: "Pro" });
		expect(shadow(el).querySelector(".xtyle-radio__indicator")!.getAttribute("aria-hidden")).toBe("true");
	});
});

describe("radio: form participation and a11y survive the move", () => {
	it("keeps the native input with its type, name, and value", () => {
		const el = make<Radio>("xtyle-radio", { name: "plan", value: "pro", label: "Pro" });
		const input = el.control!;
		expect(input.tagName).toBe("INPUT");
		expect(input.getAttribute("type")).toBe("radio");
		expect(input.getAttribute("name")).toBe("plan");
		expect(input.getAttribute("value")).toBe("pro");
	});

	it("submits its value only while checked", () => {
		const el = make<Radio>("xtyle-radio", { name: "plan", value: "pro", label: "Pro" });
		expect(formValue(el)).toBeNull();
		el.checked = true;
		expect(formValue(el)).toBe("pro");
		el.checked = false;
		expect(formValue(el)).toBeNull();
	});

	it("selects on a click of the control, mirrors :checked, fires change, and submits the value", () => {
		const el = make<Radio>("xtyle-radio", { name: "plan", value: "team", label: "Team" });
		let changes = 0;
		el.addEventListener("change", () => changes++);
		const input = el.control!;
		input.checked = true;
		// a native `change` bubbles but is not composed, so it never leaves the shadow root — the
		// fill's handler is what turns it into a selection
		input.dispatchEvent(new Event("change", { bubbles: true }));
		expect(el.checked).toBe(true);
		expect(el.control!.checked).toBe(true);
		expect(changes).toBe(1);
		expect(formValue(el)).toBe("team");
	});

	it("ignores a change on a disabled radio and submits nothing", () => {
		const el = make<Radio>("xtyle-radio", { name: "plan", value: "free", label: "Free", disabled: "" });
		expect(el.control!.disabled).toBe(true);
		el.control!.dispatchEvent(new Event("change", { bubbles: true }));
		expect(el.checked).toBe(false);
		expect(formValue(el)).toBeNull();
	});

	it("moves selection, focus, and the submitted value with the arrow keys inside a group", async () => {
		const group = make<HTMLElement>("xtyle-radio-group", { label: "Plan" });
		const free = make<Radio>("xtyle-radio", { name: "plan", value: "free", label: "Free" }, group);
		const pro = make<Radio>("xtyle-radio", { name: "plan", value: "pro", label: "Pro", checked: "" }, group);
		const team = make<Radio>("xtyle-radio", { name: "plan", value: "team", label: "Team" }, group);
		await Promise.resolve();

		// roving tabindex parks on the checked option
		expect(pro.control!.tabIndex).toBe(0);
		expect(free.control!.tabIndex).toBe(-1);

		press(pro, "ArrowDown");
		expect(team.checked).toBe(true);
		expect(pro.checked).toBe(false);
		expect(formValue(team)).toBe("team");
		expect(formValue(pro)).toBeNull();
		expect(shadow(team).activeElement ?? document.activeElement).toBeTruthy();

		press(team, "ArrowUp");
		expect(pro.checked).toBe(true);
		expect(team.checked).toBe(false);
		expect(formValue(pro)).toBe("pro");
		expect(free.checked).toBe(false);
	});
});

describe("slider: the rail groove is a node, not a pseudo-element", () => {
	it("renders the groove inside the rail, under the fill, exposed as its own part", () => {
		const el = make<Slider>("xtyle-slider", { label: "Volume", value: "60" });
		const rail = shadow(el).querySelector(".xtyle-slider__rail")!;
		const groove = rail.querySelector(".xtyle-slider__groove");
		expect(groove).not.toBeNull();
		expect(groove!.getAttribute("part")).toBe("groove");
		// paint order: the groove is the first positioned child, so the fill and thumb sit on top of it
		// exactly as they did over the pseudo-element
		const children = [...rail.children].map((c) => c.className);
		expect(children).toEqual(["xtyle-slider__groove", "xtyle-slider__fill", "xtyle-slider__thumb"]);
	});

	it("paints the groove only through the groove node", () => {
		expect(sliderCss).toContain(".xtyle-slider__groove");
		expect(sliderCss).not.toContain(".xtyle-slider__rail::before");
		expect(sliderCss).not.toContain(".xtyle-slider__rail::after");
	});
});

describe("slider: form participation, a11y, and pointer survive the move", () => {
	function box(el: Slider, width = 100): void {
		const rail = shadow(el).querySelector(".xtyle-slider__rail") as HTMLElement;
		rail.getBoundingClientRect = () =>
			({ left: 0, top: 0, right: width, bottom: 20, width, height: 20, x: 0, y: 0, toJSON() {} }) as DOMRect;
	}

	it("keeps the thumb's slider role and its value range in sync", () => {
		const el = make<Slider>("xtyle-slider", { label: "Volume", value: "60", min: "0", max: "100" });
		const thumb = shadow(el).querySelector(".xtyle-slider__thumb")!;
		expect(thumb.getAttribute("role")).toBe("slider");
		expect(thumb.getAttribute("aria-valuenow")).toBe("60");
		expect(thumb.getAttribute("aria-valuemin")).toBe("0");
		expect(thumb.getAttribute("aria-valuemax")).toBe("100");
		expect(thumb.getAttribute("aria-labelledby")).toBeTruthy();
	});

	it("submits the current value and keeps it live as the value moves", () => {
		const el = make<Slider>("xtyle-slider", { label: "Volume", value: "60", name: "volume" });
		expect(formValue(el)).toBe("60");
		el.value = 75;
		expect(formValue(el)).toBe("75");
	});

	it("steps on the keyboard, announcing and submitting each move", () => {
		const el = make<Slider>("xtyle-slider", { label: "Volume", value: "60", step: "5", name: "volume" });
		const thumb = shadow(el).querySelector(".xtyle-slider__thumb") as HTMLElement;
		const changes: number[] = [];
		el.addEventListener("change", () => changes.push(el.value));

		expect(press(thumb, "ArrowRight").defaultPrevented).toBe(true);
		expect(el.value).toBe(65);
		press(thumb, "ArrowLeft");
		expect(el.value).toBe(60);
		press(thumb, "Home");
		expect(el.value).toBe(0);
		press(thumb, "End");
		expect(el.value).toBe(100);
		expect(changes).toEqual([65, 60, 0, 100]);
		expect(formValue(el)).toBe("100");
		expect(shadow(el).querySelector(".xtyle-slider__thumb")!.getAttribute("aria-valuenow")).toBe("100");
	});

	it("commits a value from a pointer press that lands on the groove node", () => {
		const el = make<Slider>("xtyle-slider", { label: "Volume", value: "0", min: "0", max: "100", step: "1" });
		box(el);
		const groove = shadow(el).querySelector(".xtyle-slider__groove") as HTMLElement;
		groove.dispatchEvent(new MouseEvent("pointerdown", { clientX: 40, bubbles: true, composed: true }));
		expect(el.value).toBe(40);
	});

	it("pulls the thumb out of the tab order and refuses keys when disabled", () => {
		const el = make<Slider>("xtyle-slider", { label: "Locked", value: "50", disabled: "" });
		const thumb = shadow(el).querySelector(".xtyle-slider__thumb") as HTMLElement;
		expect(thumb.getAttribute("tabindex")).toBe("-1");
		expect(thumb.getAttribute("aria-disabled")).toBe("true");
		press(thumb, "ArrowRight");
		expect(el.value).toBe(50);
	});
});

describe("switch: the thumb is already a node in the fill, and stays one", () => {
	it("renders the thumb as a real child of the track, exposed as its own part", () => {
		const el = make<Switch>("xtyle-switch", { label: "Notifications" });
		const track = shadow(el).querySelector(".xtyle-switch__track")!;
		const thumb = track.querySelector(".xtyle-switch__thumb");
		expect(thumb).not.toBeNull();
		expect(thumb!.getAttribute("part")).toBe("thumb");
		expect(thumb!.getAttribute("aria-hidden")).toBe("true");
	});

	it("never conjures the knob from a pseudo-element", () => {
		expect(switchCss).toContain(".xtyle-switch__thumb {");
		expect(switchCss).not.toContain(".xtyle-switch__thumb::after");
		expect(switchCss).not.toContain(".xtyle-switch__thumb::before");
	});
});

describe("switch: form participation and a11y", () => {
	it("keeps the switch role and its checked state on the track", () => {
		const el = make<Switch>("xtyle-switch", { label: "Notifications", checked: "" });
		const track = shadow(el).querySelector(".xtyle-switch__track")!;
		expect(track.getAttribute("role")).toBe("switch");
		expect(track.getAttribute("aria-checked")).toBe("true");
		expect(track.getAttribute("aria-labelledby")).toBeTruthy();
	});

	it("toggles on a click, mirrors aria-checked, fires change, and submits its value", () => {
		const el = make<Switch>("xtyle-switch", { label: "Notifications", value: "yes", name: "notify" });
		let changes = 0;
		el.addEventListener("change", () => changes++);
		expect(formValue(el)).toBeNull();

		(shadow(el).querySelector(".xtyle-switch__track") as HTMLElement).click();
		expect(el.checked).toBe(true);
		expect(shadow(el).querySelector(".xtyle-switch__track")!.getAttribute("aria-checked")).toBe("true");
		expect(changes).toBe(1);
		expect(formValue(el)).toBe("yes");

		(shadow(el).querySelector(".xtyle-switch__track") as HTMLElement).click();
		expect(el.checked).toBe(false);
		expect(formValue(el)).toBeNull();
	});

	it("toggles on Space and Enter", () => {
		const el = make<Switch>("xtyle-switch", { label: "Notifications" });
		const track = () => shadow(el).querySelector(".xtyle-switch__track") as HTMLElement;
		expect(press(track(), " ").defaultPrevented).toBe(true);
		expect(el.checked).toBe(true);
		press(track(), "Enter");
		expect(el.checked).toBe(false);
	});

	it("refuses interaction when disabled", () => {
		const el = make<Switch>("xtyle-switch", { label: "Locked", checked: "", disabled: "" });
		const track = shadow(el).querySelector(".xtyle-switch__track") as HTMLElement;
		expect(track.getAttribute("aria-disabled")).toBe("true");
		track.click();
		press(track, " ");
		expect(el.checked).toBe(true);
	});
});
