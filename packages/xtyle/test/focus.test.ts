// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import { focusableIn, activeLeaf } from "../src/dom.js";

afterEach(() => {
	document.body.innerHTML = "";
});

function host(tag: string, shadow: string): HTMLElement {
	const el = document.createElement(tag);
	el.attachShadow({ mode: "open" }).innerHTML = shadow;
	return el;
}

describe("focusableIn", () => {
	it("reaches the native control inside a shadow root, in tab order", () => {
		const panel = document.createElement("div");
		const field = host("x-field", `<label>Name</label><input id="inner-input" />`);
		const before = document.createElement("button");
		before.id = "before";
		const after = document.createElement("a");
		after.href = "#";
		after.id = "after";
		panel.append(before, field, after);
		document.body.append(panel);
		expect(focusableIn(panel).map((el) => el.id)).toEqual(["before", "inner-input", "after"]);
	});

	it("leaves out what Tab skips", () => {
		const panel = document.createElement("div");
		panel.innerHTML = `
			<button id="ok"></button>
			<button disabled></button>
			<input type="hidden" />
			<a>no href</a>
			<span tabindex="-1"></span>
			<div inert><button></button></div>
			<span tabindex="0" id="stop"></span>`;
		document.body.append(panel);
		expect(focusableIn(panel).map((el) => el.id)).toEqual(["ok", "stop"]);
	});

	it("follows a slot to the content it projects", () => {
		const shell = host("x-shell", `<button id="chrome"></button><slot></slot>`);
		const slotted = document.createElement("input");
		slotted.id = "slotted";
		shell.append(slotted);
		document.body.append(shell);
		expect(focusableIn(shell.shadowRoot!).map((el) => el.id)).toEqual(["chrome", "slotted"]);
	});
});

describe("activeLeaf", () => {
	it("descends past the host to the control that holds focus", () => {
		const field = host("x-field", `<input id="inner-input" />`);
		document.body.append(field);
		const input = field.shadowRoot!.querySelector("input")!;
		input.focus();
		expect(document.activeElement).toBe(field);
		expect(activeLeaf()).toBe(input);
	});
});
