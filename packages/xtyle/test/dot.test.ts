import { describe, expect, it } from "vitest";
import { dotClass, dotHostCss } from "../src/markup/dot.js";
import { dotCss } from "../src/css/components/dot.js";

describe("dot host layout", () => {
	// INFO: a dot's row is usually a flex container, and flex items ignore vertical-align, so centering
	// needs align-items: center; vertical-align only covers the plain inline case.
	it("collapses the host to the dot: no line-height strut can inflate it", () => {
		expect(dotHostCss).toContain("line-height: 0");
	});

	it("centres the dot inside the host, so a stretched host cannot push it off the line", () => {
		expect(dotHostCss).toContain("align-items: center");
	});

	it("still aligns to the middle of a plain inline run of text", () => {
		expect(dotHostCss).toContain("vertical-align: middle");
	});
});

describe("dot size ramp", () => {
	it("starts at a dot you can actually see, not a pinhead", () => {
		expect(dotCss).not.toContain("width: var(--space-1)");
		expect(dotCss).toContain("width: var(--space-2)");
		expect(dotCss).toContain("width: var(--space-3)");
		expect(dotCss).toContain("width: var(--space-4)");
	});
});

describe("dot as the one shared primitive", () => {
	it("is the class Badge and Avatar retint, rather than each re-implementing a circle", () => {
		expect(dotCss).toContain(".xtyle-dot {");
		expect(dotCss).toContain("--dot-color");
		expect(dotClass({ tone: "success" })).toContain("xtyle-dot--success");
		expect(dotClass({ size: "sm" })).toContain("xtyle-dot--sm");
		expect(dotClass({ pulse: "fast" })).toContain("xtyle-dot--pulse-fast");
	});

	it("owns the pulse keyframes both of them now animate on", () => {
		expect(dotCss).toContain("@keyframes xtyle-dot-pulse");
		expect(dotCss).toContain("prefers-reduced-motion");
	});
});
