// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import "../src/elements/slider.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { manifest, fragmentSources } from "../src/elements/fragments/slider/source.generated.js";

type Slider = HTMLElement & { value: number; format: ((value: number) => string) | null };

beforeAll(async () => {
	await loadFill(manifest, fragmentSources);
});

afterEach(() => {
	document.body.innerHTML = "";
});

function make(attrs: Record<string, string> = {}): Slider {
	const el = document.createElement("xtyle-slider") as Slider;
	el.setAttribute("label", "Zoom");
	for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
	document.body.appendChild(el);
	return el;
}

function root(el: HTMLElement): ShadowRoot | HTMLElement {
	return el.shadowRoot ?? el;
}

const valueSpan = (el: HTMLElement): HTMLElement =>
	root(el).querySelector<HTMLElement>(".xtyle-slider__value") as HTMLElement;
const editor = (el: HTMLElement): HTMLInputElement | null =>
	root(el).querySelector<HTMLInputElement>(".xtyle-slider__value-input");

function press(target: HTMLElement, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
	const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init });
	target.dispatchEvent(event);
	return event;
}

/** The value editor is the fill's chrome, opened by the `editing` binding rather than conjured by the
 * element — so it carries the fill's part name, and everything the element still owns (the parse, the
 * commit, the keys) has to keep working through it. */
describe("slider value editor", () => {
	it("draws the field through the fill, with the fill's own part name", () => {
		const el = make({ "show-value": "", value: "40" });
		expect(editor(el)).toBeNull();

		valueSpan(el).click();
		const input = editor(el);
		expect(input).not.toBeNull();
		expect(input!.value).toBe("40");
		expect(input!.getAttribute("part")).toBe("value-input");
		expect(valueSpan(el).hasAttribute("aria-hidden")).toBe(false);
	});

	it("commits a typed value on Enter and puts the readout back", () => {
		const el = make({ "show-value": "", value: "40" });
		valueSpan(el).click();
		const input = editor(el)!;
		input.value = "63";
		press(input, "Enter");

		expect(el.value).toBe(63);
		expect(editor(el)).toBeNull();
		expect(valueSpan(el).textContent).toBe("63");
		expect(valueSpan(el).getAttribute("aria-hidden")).toBe("true");
	});

	it("commits on blur", () => {
		const el = make({ "show-value": "", value: "40" });
		valueSpan(el).click();
		const input = editor(el)!;
		input.value = "12";
		input.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));

		expect(el.value).toBe(12);
		expect(editor(el)).toBeNull();
	});

	it("abandons the edit on Escape", () => {
		const el = make({ "show-value": "", value: "40" });
		valueSpan(el).click();
		const input = editor(el)!;
		input.value = "99";
		press(input, "Escape");

		expect(el.value).toBe(40);
		expect(editor(el)).toBeNull();
	});

	it("steps on the arrow and page keys without tearing the field down", () => {
		const el = make({ "show-value": "", value: "40", step: "1", "alt-step": "10" });
		valueSpan(el).click();
		const input = editor(el)!;

		press(input, "ArrowUp");
		press(input, "ArrowUp");
		expect(editor(el)).toBe(input);
		expect(input.value).toBe("42");
		expect(el.value).toBe(42);

		press(input, "PageUp");
		expect(input.value).toBe("52");
		press(input, "ArrowDown");
		expect(input.value).toBe("51");
		expect(el.value).toBe(51);
	});

	it("tracks the thumb live while the field stays open", () => {
		const el = make({ "show-value": "", value: "40", step: "5" });
		valueSpan(el).click();
		const input = editor(el)!;
		press(input, "ArrowUp");

		expect(editor(el)).toBe(input);
		expect(root(el).querySelector(".xtyle-slider__thumb")!.getAttribute("aria-valuenow")).toBe("45");
	});

	it("lets a typed value pass the rail under overflow, pinning the thumb at the edge", () => {
		const el = make({ "show-value": "", value: "40", max: "100", overflow: "" });
		valueSpan(el).click();
		const input = editor(el)!;
		input.value = "180";
		press(input, "Enter");

		expect(el.value).toBe(180);
		const thumb = root(el).querySelector(".xtyle-slider__thumb")!;
		expect(thumb.getAttribute("aria-valuenow")).toBe("180");
		expect(thumb.getAttribute("aria-valuemax")).toBe("180");
		expect((thumb as HTMLElement).getAttribute("style")).toContain("100.000%");
	});

	it("stays a plain readout under static-value, and when disabled", () => {
		const stat = make({ "show-value": "", "static-value": "", value: "40" });
		valueSpan(stat).click();
		expect(editor(stat)).toBeNull();

		const off = make({ "show-value": "", disabled: "", value: "40" });
		valueSpan(off).click();
		expect(editor(off)).toBeNull();
	});

	it("escapes a hostile formatted readout instead of parsing it as markup", () => {
		const el = make({ "show-value": "", value: "40" });
		el.format = () => '<img src=x onerror="alert(1)">';

		expect(root(el).querySelector("img")).toBeNull();
		expect(valueSpan(el).textContent).toBe('<img src=x onerror="alert(1)">');
	});
});
