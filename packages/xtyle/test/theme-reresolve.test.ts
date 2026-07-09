// @vitest-environment happy-dom
import { describe, expect, it, afterEach } from "vitest";
import { derive } from "../src/index.js";
import { xtyleDefault } from "../src/batteries.js";
import { apply, THEME_APPLY_EVENT } from "../src/dom.js";

const themeA = derive(xtyleDefault, { constraints: { "--bg-0": "#0b0d12", "--accent": "#6ea8fe" } });
const themeB = derive(xtyleDefault, { constraints: { "--bg-0": "#ffffff", "--accent": "#c026d3" } });

afterEach(() => {
	document.body.innerHTML = "";
});

/**
 * The engine half of the live re-theming contract: `apply()` announces every theme change so the
 * baking elements (which subscribe via the base's `resolvesThemeAtRuntime` opt-in) can re-resolve
 * instead of freezing on the palette they read at mount. The other half — a mounted chart actually
 * recoloring on that event — needs the fragment runtime to paint an SVG, which happy-dom can't do;
 * that end-to-end recolor is verified in a real browser against the theme bench.
 */
describe("theme re-resolution wiring", () => {
	it("apply() announces a theme change on the document", () => {
		let fired = 0;
		const onApply = (): void => {
			fired += 1;
		};
		document.addEventListener(THEME_APPLY_EVENT, onApply);
		apply(themeA);
		apply(themeB, { target: document.createElement("div") });
		document.removeEventListener(THEME_APPLY_EVENT, onApply);
		expect(fired, "fires for both a root apply and a scoped apply").toBe(2);
	});
});
