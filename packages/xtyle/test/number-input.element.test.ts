// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import "../src/elements/number-input.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { manifest, fragmentSources } from "../src/elements/fragments/number-input/source.generated.js";

type NumberInput = HTMLElement & { value: string };

beforeAll(async () => {
	await loadFill(manifest, fragmentSources);
});

afterEach(() => {
	document.body.innerHTML = "";
});

function make(attrs: Record<string, string> = {}): NumberInput {
	const el = document.createElement("xtyle-number-input") as NumberInput;
	el.setAttribute("label", "Copies");
	for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
	document.body.appendChild(el);
	return el;
}

const field = (el: HTMLElement): HTMLInputElement =>
	(el.shadowRoot ?? el).querySelector<HTMLInputElement>(".xtyle-number__input") as HTMLInputElement;

function typeAndCommit(el: HTMLElement, text: string, how: "change" | "enter"): HTMLInputElement {
	const input = field(el);
	input.focus();
	input.value = text;
	input.dispatchEvent(new Event("input", { bubbles: true }));
	if (how === "change") input.dispatchEvent(new Event("change", { bubbles: true }));
	else input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
	return input;
}

describe("number-input commit rewrites the field it was typed into", () => {
	it("shows the clamped value after a change commit, while the field still has focus", () => {
		const el = make({ value: "5", min: "0", max: "100" });
		const input = typeAndCommit(el, "500", "change");
		expect(el.value).toBe("100");
		expect(input.value).toBe("100");
	});

	it("shows the clamped value after an Enter commit", () => {
		const el = make({ value: "5", min: "0", max: "100" });
		const input = typeAndCommit(el, "-40", "enter");
		expect(el.value).toBe("0");
		expect(input.value).toBe("0");
	});

	it("rewrites the field even when the clamped value equals the one it already held", () => {
		const el = make({ value: "100", min: "0", max: "100" });
		const input = typeAndCommit(el, "9000", "change");
		expect(el.value).toBe("100");
		expect(input.value).toBe("100");
	});

	it("puts the last good value back over text that is not a number", () => {
		const el = make({ value: "12", min: "0", max: "100" });
		const input = typeAndCommit(el, "twelve", "change");
		expect(el.value).toBe("12");
		expect(input.value).toBe("12");
	});

	it("leaves an in-progress value alone while typing", () => {
		const el = make({ value: "5", min: "0", max: "100" });
		const input = field(el);
		input.focus();
		input.value = "50";
		input.dispatchEvent(new Event("input", { bubbles: true }));
		el.setAttribute("max", "100");
		expect(input.value).toBe("50");
	});
});
