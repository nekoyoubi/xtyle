import { describe, expect, it } from "vitest";
import { swatchCss } from "../src/css/components/swatch.js";

describe("swatch selection cue", () => {
	it("adds a non-color marker ring under --selection-cue: marker", () => {
		// A container-query override survives neither type-checking nor a snapshot diff, so pin its shape:
		// marker mode must *add* a neutral --fg-0 ring (an ::after), staying additive like the sibling cues
		// rather than recoloring the accent ring away.
		const cue = swatchCss.slice(swatchCss.indexOf("@container style(--selection-cue: marker)"));
		expect(cue).toContain(".xtyle-swatch--selected .xtyle-swatch__dot::after");
		expect(cue).toContain("var(--fg-0)");
	});
});
