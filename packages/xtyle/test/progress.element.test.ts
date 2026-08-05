// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import "../src/elements/progress.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { manifest, fragmentSources } from "../src/elements/fragments/progress/source.generated.js";

beforeAll(async () => {
	await loadFill(manifest, fragmentSources);
});

afterEach(() => {
	document.body.innerHTML = "";
});

function meter(ramp: string): Element {
	document.body.innerHTML = `<xtyle-progress ramp="${ramp}" value="50" max="100" meter aria-label="Temper"></xtyle-progress>`;
	return document.body.firstElementChild as Element;
}

describe("xtyle-progress ramps", () => {
	it("takes a stop list written as CSS tokens, the form its own docs promise", () => {
		const bar = meter("var(--success),var(--warn),var(--danger)");
		expect(bar.shadowRoot?.querySelector('[part="indicator"]') ?? bar.querySelector('[part="indicator"]')).toBeTruthy();
	});

	it("leaves the flat tone in charge rather than vanishing when no stop resolves", () => {
		const bar = meter("var(--nothing-here),var(--nor-this)");
		const root = bar.shadowRoot ?? bar;
		expect(root.querySelector('[part="indicator"]'), "a slightly-wrong meter beats a missing one").toBeTruthy();
		expect(root.querySelector('[part="indicator"]')?.getAttribute("style") ?? "").not.toContain("currentColor");
	});

	it("still reads a built-in palette and an explicit stop array", () => {
		for (const ramp of ["thermal", '[&quot;#0000ff&quot;,&quot;#ff0000&quot;]']) {
			const root = meter(ramp).shadowRoot ?? document.body.firstElementChild!;
			expect(root.querySelector('[part="indicator"]'), ramp).toBeTruthy();
		}
	});
});
