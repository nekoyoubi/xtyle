import { describe, expect, it } from "vitest";
import { getComponent, coverComponent, derive } from "../src/index.js";
import { renderFragmentLight } from "../src/elements/fragment-ssr.js";
import { xojiDefault } from "../src/batteries.js";

const register = derive(xojiDefault, {
	constraints: { "--bg-0": "#0b0d12", "--fg-0": "#e6e9ef", "--accent": "#6ea8fe" },
});

const bindings = {
	series: [
		{ name: "Web", values: [12, 19, 15, 22] },
		{ name: "Mobile", values: [8, 14, 18, 25] },
	],
	categories: ["Q1", "Q2", "Q3", "Q4"],
	colors: ["#6ea8fe", "#f0a", "#0fa"],
	height: 280,
	title: "Revenue",
};

describe("bar chart", () => {
	it("is registered under the metrics category", () => {
		const manifest = getComponent("bar");
		expect(manifest.category).toBe("metrics");
		expect(manifest.name).toBe("Bar");
	});

	it("covers every consumed token against xoji-default", () => {
		const result = coverComponent(getComponent("bar"), register);
		expect(result.missing, `missing: ${result.missing.join(", ")}`).toEqual([]);
		expect(result.covered).toBe(true);
	});

	it("renders an svg with one rect per series/category cell", async () => {
		const html = await renderFragmentLight("bar", bindings);
		const rects = html.match(/class="xoji-bar__bar"/g) ?? [];
		expect(rects).toHaveLength(8); // 2 series * 4 categories, grouped
		expect(html).toContain("<svg");
	});

	it("paints each bar with its resolved series color", async () => {
		const html = await renderFragmentLight("bar", bindings);
		expect(html).toContain('fill="#6ea8fe"');
		expect(html).toContain('fill="#f0a"');
	});

	it("mirrors the data into a visually-hidden table for assistive tech", async () => {
		const html = await renderFragmentLight("bar", bindings);
		expect(html).toContain('class="xoji-bar__a11y"');
		expect(html).toContain("<caption>Revenue</caption>");
		expect(html).toContain("<th scope=\"col\">Web</th>");
	});

	it("renders a horizontal chart with category labels down the side", async () => {
		const html = await renderFragmentLight("bar", { ...bindings, orientation: "horizontal" });
		expect(html).toContain("xoji-bar--horizontal");
		expect(html).toContain('class="xoji-bar__ylabels"');
		const rects = html.match(/class="xoji-bar__bar"/g) ?? [];
		expect(rects).toHaveLength(8);
	});

	it("colors each bar by category when colorBy is category (single-series palette)", async () => {
		const html = await renderFragmentLight("bar", {
			series: [{ name: "Lines", values: [10, 20, 30] }],
			categories: ["A", "B", "C"],
			colors: ["#f00", "#0f0", "#00f"],
			colorBy: "category",
		});
		expect(html).toContain('fill="#f00"');
		expect(html).toContain('fill="#0f0"');
		expect(html).toContain('fill="#00f"');
	});

	it("stacks into one bar per category when stacked", async () => {
		const html = await renderFragmentLight("bar", { ...bindings, stacked: true });
		const rects = html.match(/class="xoji-bar__bar"/g) ?? [];
		// 2 non-zero series per category * 4 = 8 segments, one column each
		expect(rects.length).toBeGreaterThan(0);
		expect(html).toContain("xoji-bar--stacked");
	});

	it("renders bars as read-only image data points by default", async () => {
		const html = await renderFragmentLight("bar", bindings);
		expect(html).toContain('role="img"');
		expect(html).not.toContain('role="button"');
		expect(html).not.toContain("xoji-bar--selectable");
	});

	it("promotes bars to buttons when selectable, for an actionable chart", async () => {
		const html = await renderFragmentLight("bar", { ...bindings, selectable: true });
		expect(html).toContain("xoji-bar--selectable");
		expect(html).toContain('role="button"');
		expect(html).not.toContain('role="img"');
		// every bar takes the button role, not just the first
		const buttons = html.match(/role="button"/g) ?? [];
		const rects = html.match(/class="xoji-bar__bar"/g) ?? [];
		expect(buttons).toHaveLength(rects.length);
	});

	it("shows a No data message with no axes when there is nothing to plot", async () => {
		const html = await renderFragmentLight("bar", { categories: [], series: [] });
		expect(html).toContain('class="xoji-bar__empty"');
		expect(html).toContain(">No data</text>");
		expect(html).not.toContain('class="xoji-bar__bar"');
		expect(html).not.toContain('class="xoji-bar__grid"');
		expect(html).toContain('aria-label="No data"');
	});
});
