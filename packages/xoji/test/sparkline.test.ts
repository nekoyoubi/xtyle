import { describe, expect, it } from "vitest";
import { getComponent, coverComponent, derive } from "../src/index.js";
import { renderFragmentLight } from "../src/elements/fragment-ssr.js";
import { xojiDefault } from "../src/batteries.js";

const register = derive(xojiDefault, {
	constraints: { "--bg-0": "#0b0d12", "--fg-0": "#e6e9ef", "--accent": "#6ea8fe" },
});

describe("sparkline", () => {
	it("is registered under the metrics category", () => {
		const manifest = getComponent("sparkline");
		expect(manifest.category).toBe("metrics");
		expect(manifest.name).toBe("Sparkline");
	});

	it("covers every consumed token against xoji-default", () => {
		const result = coverComponent(getComponent("sparkline"), register);
		expect(result.missing, `missing: ${result.missing.join(", ")}`).toEqual([]);
		expect(result.covered).toBe(true);
	});

	it("draws a polyline through every value with an end dot", async () => {
		const html = await renderFragmentLight("sparkline", { values: [1, 3, 2, 5, 4], label: "Trend" });
		expect(html).toContain('class="xoji-sparkline__line"');
		const points = (html.match(/points="([^"]*)"/) ?? [])[1] ?? "";
		expect(points.trim().split(/\s+/)).toHaveLength(5);
		expect(html).toContain('class="xoji-sparkline__end"');
		expect(html).toContain('aria-label="Trend"');
	});

	it("fills an area path when variant is area", async () => {
		const html = await renderFragmentLight("sparkline", { values: [1, 3, 2], variant: "area" });
		expect(html).toContain('class="xoji-sparkline__area"');
		expect(html).toContain("xoji-sparkline--area");
	});

	it("draws one rect per value when variant is bar and no end dot", async () => {
		const html = await renderFragmentLight("sparkline", { values: [1, 3, 2, 5], variant: "bar" });
		const rects = html.match(/class="xoji-sparkline__bar"/g) ?? [];
		expect(rects).toHaveLength(4);
		expect(html).not.toContain("xoji-sparkline__end");
	});

	it("applies the tone class for its single color", async () => {
		const html = await renderFragmentLight("sparkline", { values: [1, 2], tone: "success" });
		expect(html).toContain("xoji-sparkline--success");
	});
});
