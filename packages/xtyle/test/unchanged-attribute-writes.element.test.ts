// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import "../src/elements/icon.js";
import "../src/elements/progress.js";
import "../src/elements/nine-patch.js";
import { loadFill } from "../src/elements/fragment-host.js";
import * as icon from "../src/elements/fragments/icon/source.generated.js";
import * as progress from "../src/elements/fragments/progress/source.generated.js";

beforeAll(async () => {
	await loadFill(icon.manifest, icon.fragmentSources);
	await loadFill(progress.manifest, progress.fragmentSources);
});

afterEach(() => {
	document.body.innerHTML = "";
});

function mount(markup: string): HTMLElement {
	document.body.innerHTML = markup;
	return document.body.firstElementChild as HTMLElement;
}

const CASES = [
	{ tag: "xtyle-icon", markup: `<xtyle-icon name="check" colors="accents"></xtyle-icon>`, attr: "name", other: "close", redraw: "render" },
	{ tag: "xtyle-progress", markup: `<xtyle-progress value="40" max="100" aria-label="Load"></xtyle-progress>`, attr: "value", other: "60", redraw: "render" },
	{ tag: "xtyle-nine-patch", markup: `<xtyle-nine-patch src="frame.png" slice="8"></xtyle-nine-patch>`, attr: "slice", other: "12", redraw: "paint" },
] as const;

describe("an attribute write that changes nothing", () => {
	for (const { tag, markup, attr, other, redraw } of CASES) {
		it(`does not redraw ${tag}`, () => {
			const el = mount(markup);
			const spy = vi.spyOn(el as unknown as Record<string, () => void>, redraw);
			el.setAttribute(attr, el.getAttribute(attr) ?? "");
			expect(spy).not.toHaveBeenCalled();
		});

		it(`still redraws ${tag} when the value moves`, () => {
			const el = mount(markup);
			const spy = vi.spyOn(el as unknown as Record<string, () => void>, redraw);
			el.setAttribute(attr, other);
			expect(spy).toHaveBeenCalled();
		});
	}

	it("skips a same-value write delivered with the namespace argument a real engine passes", () => {
		const el = mount(CASES[1].markup) as HTMLElement & { attributeChangedCallback(...args: unknown[]): void };
		const spy = vi.spyOn(el as unknown as Record<string, () => void>, "render");
		el.attributeChangedCallback("value", "40", "40", null);
		expect(spy).not.toHaveBeenCalled();
		el.attributeChangedCallback("value", "40", "60", null);
		expect(spy).toHaveBeenCalled();
	});

	it("passes a direct call with no arguments through to the element", () => {
		const el = mount(CASES[0].markup) as HTMLElement & { attributeChangedCallback(): void };
		const spy = vi.spyOn(el as unknown as Record<string, () => void>, "render");
		el.attributeChangedCallback();
		expect(spy).toHaveBeenCalled();
	});
});
