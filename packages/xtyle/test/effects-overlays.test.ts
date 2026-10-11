import { describe, expect, it } from "vitest";
import { effectsCss, fxStyle, getEffect, registerEffect, unknownSpecs } from "../src/index.js";

const ruleFor = (css: string, selector: string, declarations: string): boolean =>
	css.split("\n").some((rule) => rule.includes(selector) && rule.endsWith(`{${declarations}}`));

describe("glare as a glint", () => {
	it("takes width, repeat, and rest", () => {
		expect(unknownSpecs("glare?width:6%,repeat:infinite,rest:3")).toEqual([]);
		expect(fxStyle("glare?width:6,repeat:infinite,rest:3")).toEqual({
			"--fx-glare-width": "6%",
			"--fx-glare-repeat": "infinite",
			"--fx-glare-rest": "3",
		});
	});

	it("narrows the band around its midpoint and defaults to the old 30% band", () => {
		const glare = getEffect("glare");
		expect(glare?.baseAfter).toContain("transparent calc(50% - var(--fx-glare-width, 15%))");
		expect(glare?.baseAfter).toContain("transparent calc(50% + var(--fx-glare-width, 15%))");
	});

	it("takes a wash amount, defaulting to the old 55%", () => {
		expect(fxStyle("glare?amount:20")).toEqual({ "--fx-glare-amount": "20%" });
		expect(getEffect("glare")?.baseAfter).toContain("color-mix(in oklab, var(--fx-glare-color, var(--fx-color, currentColor)) calc(var(--fx-glare-amount, 55%) * var(--fx-intensity, 1)), transparent)");
	});

	it("repeats by iteration count, once by default", () => {
		expect(getEffect("glare")?.activeAfter).toMatch(/var\(--fx-glare-repeat, 1\)$/);
	});

	it("rests by travelling further off the box, so a zero rest is the old sweep", () => {
		expect(getEffect("glare")?.extra).toContain("translateX(calc(120% + 240% * var(--fx-glare-rest, 0)))");
	});
});

describe("holo", () => {
	it("paints on ::before so it stacks under glare's ::after", () => {
		const holo = getEffect("holo");
		expect(holo?.baseAfter).toBeUndefined();
		expect(holo?.baseBefore).toContain("mix-blend-mode:color-dodge");
		const css = effectsCss();
		expect(ruleFor(css, '[data-fx~="holo"]::before', holo?.baseBefore ?? "")).toBe(true);
		expect(ruleFor(css, '[data-fx~="holo"]::before', holo?.activeBefore ?? "")).toBe(true);
	});

	it("draws its foil from the theme's named hues, scaled by intensity", () => {
		const before = getEffect("holo")?.baseBefore ?? "";
		for (const hue of ["red", "yellow", "green", "cyan", "blue", "purple", "pink"]) expect(before).toContain(`var(--${hue})`);
		expect(before).toContain("var(--fx-intensity, 1)");
	});

	it("holds its ::before still under reduced motion", () => {
		const reduced = effectsCss().split("@media (prefers-reduced-motion:reduce)")[1] ?? "";
		expect(reduced).toContain('[data-fx~="holo"]::before');
	});
});

describe("the ::before channel", () => {
	it("is open to a registered effect, not only the built-ins", () => {
		registerEffect({ name: "test-underlay", tags: ["test"], baseBefore: "content:\"\"", activeBefore: "opacity:1" });
		const css = effectsCss();
		expect(ruleFor(css, '[data-fx~="test-underlay"]::before', 'content:""')).toBe(true);
		expect(ruleFor(css, '[data-fx~="test-underlay@hover"]:hover::before', "opacity:1")).toBe(true);
	});
});
