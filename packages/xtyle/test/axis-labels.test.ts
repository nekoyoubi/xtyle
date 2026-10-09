import { describe, expect, it } from "vitest";
import { axisLabel, fitSideLabels, layoutAxisLabels } from "../src/elements/fragments/axis-labels.js";
import { parseLabelAngle } from "../src/markup/axis.js";

const REGIONS = ["North America", "South America", "Western Europe", "Eastern Europe", "Middle East", "Southeast Asia", "Oceania"];

describe("axis label layout", () => {
	it("keeps short labels upright in the old 30-unit gutter", () => {
		const layout = layoutAxisLabels(["Q1", "Q2", "Q3", "Q4"], 140, "auto", 104);
		expect(layout).toEqual({ angle: 0, space: 30, labels: ["Q1", "Q2", "Q3", "Q4"] });
	});

	it("tilts colliding labels and makes room under the plot", () => {
		const layout = layoutAxisLabels(REGIONS, 83, "auto", 104);
		expect(layout.angle).toBe(-45);
		expect(layout.space).toBeGreaterThan(30);
		expect(layout.space).toBeLessThanOrEqual(104);
	});

	it("goes vertical when the slots are too narrow to tilt into", () => {
		expect(layoutAxisLabels(REGIONS, 12, "auto", 104).angle).toBe(-90);
	});

	it("shortens a label too long for the room it is allowed", () => {
		const layout = layoutAxisLabels(["An extraordinarily long category name for one bar"], 40, -90, 80);
		expect(layout.labels[0]).toMatch(/…$/);
		expect(layout.space).toBeLessThanOrEqual(80);
	});

	it("honors a fixed angle, clamped to upright through vertical", () => {
		expect(layoutAxisLabels(["Q1"], 140, -30, 104).angle).toBe(-30);
		expect(layoutAxisLabels(["Q1"], 140, 45, 104).angle).toBe(0);
		expect(layoutAxisLabels(["Q1"], 140, -180, 104).angle).toBe(-90);
	});

	it("rotates a tilted label about its own anchor", () => {
		expect(axisLabel(`class="t"`, 100, 200, "North America", -45)).toBe(
			`<text class="t" x="100.0" y="210.0" dy="0.32em" text-anchor="end" transform="rotate(-45 100.0 210.0)">North America</text>`,
		);
	});

	it("widens a side gutter to fit long labels, within its cap", () => {
		expect(fitSideLabels(["Rust", "CSS"], 76, 256).pad).toBe(76);
		const wide = fitSideLabels(REGIONS, 76, 256);
		expect(wide.pad).toBeGreaterThan(76);
		expect(wide.pad).toBeLessThanOrEqual(256);
	});

	it("reads the label-angle attribute", () => {
		expect(parseLabelAngle(null)).toBe("auto");
		expect(parseLabelAngle("auto")).toBe("auto");
		expect(parseLabelAngle("-45")).toBe(-45);
		expect(parseLabelAngle("30")).toBe(0);
		expect(parseLabelAngle(-120)).toBe(-90);
	});
});
