// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import "../src/elements/slider.js";
import { loadFill, loadedFillNames } from "../src/elements/fragment-host.js";
import { manifest } from "../src/elements/fragments/slider/source.generated.js";

/**
 * The inline value editor is chrome: the fill draws it whenever the slider reports it is `editing`, and the
 * element only parses and commits what was typed. This mod reshapes the value display into something a
 * host that built the field itself would destroy on the first click — a unit suffix and a wrapper around
 * the readout, both of which have to still be standing while the field is open and after it closes.
 */
const unitMod = {
	manifest: {
		$schema: "https://xript.dev/schema/mod/v0.7.json",
		xript: "0.7",
		name: "test-slider-units",
		version: "0.0.1",
		title: "test-slider-units",
		description: "A test mod giving the slider's readout a unit suffix and its own editor markup.",
		capabilities: ["xtyle.component.slider"],
		entry: { script: "mod.js", format: "script" },
		fills: {
			"component.slider": [{ id: "slider", format: "text/html+jsml", source: "slider.html" }],
		},
	},
	fragmentSources: {
		"slider.html": '<div class="xtyle-slider" data-root data-slider></div>\n',
		"mod.js": `"use strict";
(() => {
	function pct(b) {
		var min = b.min || 0;
		var max = b.max === undefined ? 100 : b.max;
		var v = Math.min(max, Math.max(min, b.value || 0));
		return max === min ? 0 : ((v - min) / (max - min)) * 100;
	}
	function display(b) {
		if (!b.showValue) return "";
		var body = b.editing
			? '<input class="xtyle-slider__value-input" type="text" value="' + b.value + '" aria-label="Edit value">'
			: '<b class="modded-readout">' + (b.valueText || b.value) + "</b>";
		return '<span class="xtyle-slider__value">' + body + '<i class="modded-unit">px</i></span>';
	}
	function inner(b) {
		return (
			'<span class="modded-header">' + display(b) + "</span>" +
			'<span class="xtyle-slider__rail">' +
			'<span class="xtyle-slider__fill" style="width: ' + pct(b) + '%"></span>' +
			'<span class="xtyle-slider__thumb" role="slider" tabindex="0" aria-valuenow="' + b.value + '"></span>' +
			"</span>"
		);
	}
	hooks.fragment.mount("slider", (b, ops) => {
		ops.replaceChildren("[data-slider]", inner(b));
	});
	hooks.fragment.update("slider", (b, ops) => {
		ops.setAttr(".xtyle-slider__thumb", "aria-valuenow", String(b.value));
		ops.setAttr(".xtyle-slider__fill", "style", "width: " + pct(b) + "%");
		if (b.showValue && !b.editing) ops.setText(".modded-readout", String(b.valueText === undefined ? b.value : b.valueText));
	});
})();
`,
	},
};

type Slider = HTMLElement & { value: number };

beforeAll(async () => {
	await loadFill(unitMod.manifest, unitMod.fragmentSources);
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

function press(target: HTMLElement, key: string): KeyboardEvent {
	const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
	target.dispatchEvent(event);
	return event;
}

describe("a mod reshapes the value display", () => {
	it("registers behind xtyle's own fill, which the app never had to load", () => {
		const names = loadedFillNames();
		expect(names.indexOf(manifest.name)).toBeGreaterThanOrEqual(0);
		expect(names.indexOf(manifest.name)).toBeLessThan(names.indexOf(unitMod.manifest.name));
	});

	it("draws its own value markup, with no readout the element conjured", () => {
		const el = make({ "show-value": "", value: "40" });
		expect(root(el).querySelector(".modded-readout")!.textContent).toBe("40");
		expect(root(el).querySelector(".modded-unit")!.textContent).toBe("px");
		expect(root(el).querySelector(".xtyle-slider__value-text")).toBeNull();
	});

	it("keeps the mod's markup standing through an edit, and commits the typed value", () => {
		const el = make({ "show-value": "", value: "40" });
		valueSpan(el).click();

		const input = editor(el)!;
		expect(input.closest(".xtyle-slider__value")).not.toBeNull();
		expect(root(el).querySelector(".modded-unit")).not.toBeNull();

		input.value = "58";
		press(input, "Enter");
		expect(el.value).toBe(58);
		expect(root(el).querySelector(".modded-unit")).not.toBeNull();
		expect(root(el).querySelector(".modded-readout")!.textContent).toBe("58");
	});

	it("keeps the mod's field alive across a step, with the thumb tracking it", () => {
		const el = make({ "show-value": "", value: "40", step: "5" });
		valueSpan(el).click();
		const input = editor(el)!;

		press(input, "ArrowUp");
		expect(editor(el)).toBe(input);
		expect(input.value).toBe("45");
		expect(root(el).querySelector(".modded-unit")).not.toBeNull();
		expect(root(el).querySelector(".xtyle-slider__thumb")!.getAttribute("aria-valuenow")).toBe("45");
	});

	it("leaves the mod's readout intact when the value moves off the rail", () => {
		const el = make({ "show-value": "", value: "40", step: "10" });
		const thumb = root(el).querySelector<HTMLElement>(".xtyle-slider__thumb")!;
		press(thumb, "ArrowRight");

		expect(el.value).toBe(50);
		expect(root(el).querySelector(".modded-readout")!.textContent).toBe("50");
		expect(root(el).querySelector(".modded-unit")!.textContent).toBe("px");
	});
});
