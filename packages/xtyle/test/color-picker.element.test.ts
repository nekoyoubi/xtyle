// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
// side effect: defines the <xtyle-color-picker> custom element on the happy-dom registry
import "../src/elements/color-picker.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { manifest, fragmentSources } from "../src/elements/fragments/color-picker/source.generated.js";

type PickerEl = HTMLElement & { value: string };

beforeAll(async () => {
	await loadFill(manifest, fragmentSources);
});

afterEach(() => {
	document.body.innerHTML = "";
	vi.restoreAllMocks();
});

function picker(attrs: Record<string, string> = {}): PickerEl {
	const el = document.createElement("xtyle-color-picker") as PickerEl;
	el.setAttribute("label", "Brand");
	el.setAttribute("value", "#5b8cff");
	for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
	document.body.appendChild(el);
	return el;
}

function chips(el: PickerEl): HTMLElement[] {
	return [...(el.shadowRoot?.querySelectorAll<HTMLElement>(".xtyle-color-picker__harmony-chip") ?? [])];
}

function hexes(el: PickerEl): string[] {
	return chips(el).map((chip) => chip.dataset.hex ?? "");
}

describe("<xtyle-color-picker> harmony chips", () => {
	it("draws no harmony row without a scheme", () => {
		expect(picker().shadowRoot?.querySelector(".xtyle-color-picker__harmony")).toBeNull();
	});

	it("gets its chips from the fill, one per related color in the scheme", () => {
		expect(chips(picker({ harmony: "triadic" }))).toHaveLength(2);
		expect(chips(picker({ harmony: "complementary" }))).toHaveLength(1);
		expect(chips(picker({ harmony: "tetradic" }))).toHaveLength(3);
		const chip = chips(picker({ harmony: "triadic" }))[0];
		expect(chip?.getAttribute("part")).toBe("harmony-chip");
		expect(chip?.dataset.hex).toMatch(/^#[0-9a-f]{6}$/i);
		expect(chip?.style.getPropertyValue("--cp-chip")).toBe(chip?.dataset.hex);
	});

	it("recolors the very same chip nodes as the color moves, instead of rebuilding them", () => {
		const el = picker({ harmony: "triadic" });
		const before = chips(el);
		const beforeHexes = hexes(el);

		el.value = "#ff3366";

		const after = chips(el);
		expect(after[0]).toBe(before[0]);
		expect(after[1]).toBe(before[1]);
		expect(hexes(el)).not.toEqual(beforeHexes);
		expect(after[0]?.style.getPropertyValue("--cp-chip")).toBe(after[0]?.dataset.hex);
		expect(after[0]?.getAttribute("aria-label")).toBe(after[0]?.dataset.hex);
	});

	it("adopts a chip's color when it is clicked", () => {
		const el = picker({ harmony: "triadic" });
		const changed = vi.fn();
		el.addEventListener("change", changed);
		const target = chips(el)[0]!;
		const hex = target.dataset.hex!;

		target.click();

		expect(el.value.toLowerCase()).toBe(hex.toLowerCase());
		expect(changed).toHaveBeenCalledTimes(1);
	});

	it("rebuilds the row when the scheme itself changes", () => {
		const el = picker({ harmony: "complementary" });
		expect(chips(el)).toHaveLength(1);
		el.setAttribute("harmony", "tetradic");
		expect(chips(el)).toHaveLength(3);
	});

	it("disables the chips with the picker", () => {
		const el = picker({ harmony: "triadic", disabled: "" });
		expect(chips(el).every((chip) => (chip as HTMLButtonElement).disabled)).toBe(true);
		const before = el.value;
		chips(el)[0]?.click();
		expect(el.value).toBe(before);
	});
});

// Last: the override registers hooks on the shared runtime for the rest of the file.
describe("a component.color-picker override", () => {
	it("survives a color change — the chips are the fill's, and the element only recolors them", async () => {
		await loadFill(
			{
				xript: "0.7",
				name: "test-color-picker-override",
				version: "0.0.1",
				capabilities: ["xtyle.component.color-picker"],
				entry: { script: "mod.js", format: "script" },
				fills: {
					"component.color-picker": [
						{ id: "color-picker", format: "text/html+jsml", source: "color-picker.html" },
					],
				},
			},
			{
				"mod.js": `hooks.fragment.mount("color-picker", function (b, ops) {
					if (!b.harmonyScheme) return;
					var chips = (b.harmonyChips || []).map(function (c) {
						return '<button class="xtyle-color-picker__preset xtyle-color-picker__harmony-chip modded-chip"' +
							' type="button" data-color="' + c.hex + '" data-hex="' + c.hex + '"' +
							' style="--cp-chip: ' + c.hex + '"><span class="modded-mark">*</span></button>';
					}).join("");
					ops.replaceChildren(".xtyle-color-picker__harmony", chips);
				});`,
				"color-picker.html": "",
			},
		);

		const el = picker({ harmony: "triadic" });
		expect(chips(el)).toHaveLength(2);
		expect(chips(el).every((chip) => chip.classList.contains("modded-chip"))).toBe(true);
		expect(el.shadowRoot?.querySelectorAll(".modded-mark")).toHaveLength(2);
		const before = chips(el)[0]!;

		el.value = "#22aa55";

		// the modded chip is still the modded chip, and it took the new color
		const after = chips(el)[0]!;
		expect(after).toBe(before);
		expect(after.classList.contains("modded-chip")).toBe(true);
		expect(after.querySelector(".modded-mark")).not.toBeNull();
		expect(after.style.getPropertyValue("--cp-chip")).toBe(after.dataset.hex);

		// and it still adopts its color on click
		const adopted = after.dataset.hex!;
		after.click();
		expect(el.value.toLowerCase()).toBe(adopted.toLowerCase());
	});
});
