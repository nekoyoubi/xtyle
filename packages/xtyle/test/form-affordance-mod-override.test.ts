// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { loadFill, loadedFillNames } from "../src/elements/fragment-host.js";
import { manifest as radioManifest } from "../src/elements/fragments/radio/source.generated.js";
import { manifest as sliderManifest } from "../src/elements/fragments/slider/source.generated.js";

/**
 * The payoff of moving the dot and the groove out of CSS: a third-party mod filling the same host
 * slot can restructure them. A mod's fragment handlers are appended to the ones the built-in fill
 * registered and its ops apply last, so its `replaceChildren` is what the DOM ends up with — the
 * exact surface a reskin uses. These fills only redraw the affordance; the element keeps the
 * behavior and the fill's declared handlers, which is what the assertions below hold it to.
 */
function modFill(name: string, capability: string, fragmentId: string, scaffold: string, source: string) {
	return {
		manifest: {
			$schema: "https://xript.dev/schema/mod/v0.7.json",
			xript: "0.7",
			name,
			version: "0.0.1",
			title: name,
			description: `A test mod reskinning the ${fragmentId} affordance.`,
			capabilities: [capability],
			entry: { script: "mod.js", format: "script" },
			fills: {
				[`component.${fragmentId}`]: [
					{ id: fragmentId, format: "text/html+jsml", source: `${fragmentId}.html` },
				],
			},
		},
		fragmentSources: { "mod.js": source, [`${fragmentId}.html`]: scaffold },
	};
}

const checkmarkRadio = modFill(
	"test-radio-checkmark",
	"xtyle.component.radio",
	"radio",
	'<label part="radio" class="xtyle-radio" data-root data-radio></label>\n',
	`"use strict";
(() => {
	hooks.fragment.mount("radio", (b, ops) => {
		var name = b.name ? ' name="' + b.name + '"' : "";
		var checked = b.checked ? " checked" : "";
		var disabled = b.disabled ? " disabled" : "";
		ops.replaceChildren("[data-radio]",
			'<input part="control" class="xtyle-radio__control" type="radio"' + name + ' value="' + (b.value || "on") + '"' + checked + disabled + ' aria-label="' + (b.label || "") + '" />' +
			'<span part="indicator" class="xtyle-radio__indicator" aria-hidden="true">' +
			'<svg class="modded-check" viewBox="0 0 16 16"><path d="M3 8l3.2 3.2L13 4.5"></path></svg>' +
			'</span>' +
			'<span class="xtyle-radio__text"><span part="label" class="xtyle-radio__label"><slot></slot></span></span>');
	});
})();
`,
);

const tickedSlider = modFill(
	"test-slider-ticks",
	"xtyle.component.slider",
	"slider",
	'<span class="xtyle-slider" part="slider" data-root data-slider></span>\n',
	`"use strict";
(() => {
	hooks.fragment.mount("slider", (b, ops) => {
		var min = b.min === undefined ? 0 : b.min;
		var max = b.max === undefined ? 100 : b.max;
		var value = b.value === undefined ? min : b.value;
		var pct = (max === min ? 0 : ((value - min) / (max - min)) * 100).toFixed(3) + "%";
		var ticks = "";
		for (var i = 0; i <= 4; i++) ticks += '<i class="modded-tick" style="inset-inline-start: ' + i * 25 + '%"></i>';
		ops.replaceChildren("[data-slider]",
			'<span class="xtyle-slider__rail" part="rail">' +
			'<span class="xtyle-slider__groove" part="groove">' + ticks + '</span>' +
			'<span class="xtyle-slider__fill" part="fill" style="width: ' + pct + '"></span>' +
			'<span class="xtyle-slider__thumb" part="thumb" role="slider" tabindex="' + (b.disabled ? "-1" : "0") + '"' +
			' aria-valuemin="' + min + '" aria-valuemax="' + max + '" aria-valuenow="' + value + '"' +
			' aria-label="' + (b.label || "") + '" style="inset-inline-start: ' + pct + '"></span>' +
			'</span>');
	});
})();
`,
);

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
	await Promise.all([
		loadFill(checkmarkRadio.manifest, checkmarkRadio.fragmentSources),
		loadFill(tickedSlider.manifest, tickedSlider.fragmentSources),
	]);
	await import("../src/elements/radio.js");
	await import("../src/elements/slider.js");
});

afterEach(() => {
	document.body.innerHTML = "";
});

type Radio = HTMLElement & { checked: boolean; invalid: boolean; control: HTMLInputElement | null };
type Slider = HTMLElement & { value: number };

function make<T extends HTMLElement>(tag: string, attrs: Record<string, string> = {}): T {
	const el = document.createElement(tag) as T;
	for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
	document.body.appendChild(el);
	return el;
}

function shadow(el: HTMLElement): ShadowRoot {
	const root = el.shadowRoot;
	if (!root) throw new Error(`${el.tagName} has no shadow root`);
	return root;
}

describe("mods install at boot, ahead of any element painting", () => {
	it("registers both mods behind the xtyle fills the app never had to load", () => {
		const names = loadedFillNames();
		for (const [builtIn, mod] of [
			[radioManifest.name, checkmarkRadio.manifest.name],
			[sliderManifest.name, tickedSlider.manifest.name],
		]) {
			expect(names.indexOf(builtIn)).toBeGreaterThanOrEqual(0);
			expect(names.indexOf(builtIn)).toBeLessThan(names.indexOf(mod));
		}
	});
});

describe("a mod reshapes the radio's checked glyph", () => {
	it("swaps the dot node for a checkmark, with no stray dot left behind", () => {
		const el = make<Radio>("xtyle-radio", { name: "plan", value: "pro", label: "Pro", checked: "" });
		const indicator = shadow(el).querySelector(".xtyle-radio__indicator")!;
		expect(indicator.querySelector(".modded-check")).not.toBeNull();
		expect(indicator.querySelector(".xtyle-radio__dot")).toBeNull();
		expect(shadow(el).querySelector(".xtyle-radio__dot")).toBeNull();
	});

	it("keeps the native control, its :checked state, and its submitted value under the reskin", () => {
		const el = make<Radio>("xtyle-radio", { name: "plan", value: "pro", label: "Pro" });
		const input = el.control!;
		expect(input.getAttribute("type")).toBe("radio");
		expect(input.getAttribute("name")).toBe("plan");
		expect(formValue(el)).toBeNull();

		input.checked = true;
		input.dispatchEvent(new Event("change", { bubbles: true }));
		expect(el.checked).toBe(true);
		expect(el.control!.checked).toBe(true);
		expect(formValue(el)).toBe("pro");
	});

	it("still announces itself: the glyph stays behind aria-hidden and the control keeps its name", () => {
		const el = make<Radio>("xtyle-radio", { name: "plan", value: "pro", label: "Pro" });
		expect(shadow(el).querySelector(".xtyle-radio__indicator")!.getAttribute("aria-hidden")).toBe("true");
		expect(el.control!.getAttribute("aria-label")).toBe("Pro");
	});
});

describe("a mod reshapes the slider's rail groove", () => {
	it("restructures the groove into a ticked track", () => {
		const el = make<Slider>("xtyle-slider", { label: "Volume", value: "60" });
		const groove = shadow(el).querySelector(".xtyle-slider__groove")!;
		expect(groove.querySelectorAll(".modded-tick")).toHaveLength(5);
	});

	it("keeps the thumb's slider role, its keyboard stepping, and its submitted value under the reskin", () => {
		const el = make<Slider>("xtyle-slider", { label: "Volume", value: "60", step: "5", name: "volume" });
		const thumb = shadow(el).querySelector(".xtyle-slider__thumb") as HTMLElement;
		expect(thumb.getAttribute("role")).toBe("slider");
		expect(formValue(el)).toBe("60");

		thumb.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }));
		expect(el.value).toBe(65);
		expect(formValue(el)).toBe("65");
		expect(shadow(el).querySelector(".xtyle-slider__thumb")!.getAttribute("aria-valuenow")).toBe("65");
	});
});
