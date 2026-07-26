import { describe, expect, it } from "vitest";
import { swatchCss } from "../src/css/components/swatch.js";

describe("swatch selection cue", () => {
	it("adds a non-color marker ring under --selection-cue: marker", () => {
		const cue = swatchCss.slice(swatchCss.indexOf("@container style(--selection-cue: marker)"));
		expect(cue).toContain(".xtyle-swatch--selected .xtyle-swatch__dot::after");
		expect(cue).toContain("var(--fg-0)");
	});
});
