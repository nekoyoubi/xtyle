import { describe, expect, it } from "vitest";
import { getComponent, coverComponent, derive } from "../src/index.js";
import { renderFragmentLight } from "../src/elements/fragment-ssr.js";
import { xojiDefault } from "../src/batteries.js";

const register = derive(xojiDefault, {
	constraints: { "--bg-0": "#0b0d12", "--fg-0": "#e6e9ef", "--accent": "#6ea8fe" },
});

const bindings = {
	data: [
		{ label: "Direct", value: 42 },
		{ label: "Search", value: 30 },
		{ label: "Social", value: 18 },
		{ label: "Referral", value: 10 },
	],
	colors: ["#f00", "#0f0", "#00f", "#ff0"],
	title: "Traffic",
};

describe("pie chart", () => {
	it("is registered under the metrics category", () => {
		const manifest = getComponent("pie");
		expect(manifest.category).toBe("metrics");
		expect(manifest.name).toBe("Pie");
	});

	it("covers every consumed token against xoji-default", () => {
		const result = coverComponent(getComponent("pie"), register);
		expect(result.missing, `missing: ${result.missing.join(", ")}`).toEqual([]);
		expect(result.covered).toBe(true);
	});

	it("renders one arc slice per non-zero datum", async () => {
		const html = await renderFragmentLight("pie", bindings);
		const slices = html.match(/class="xoji-pie__slice"/g) ?? [];
		expect(slices).toHaveLength(4);
		expect(html).toContain('fill="#f00"');
		expect(html).toContain('aria-label="Direct: 42 (42%)"');
	});

	it("drops zero and negative values", async () => {
		const html = await renderFragmentLight("pie", {
			...bindings,
			data: [
				{ label: "A", value: 10 },
				{ label: "B", value: 0 },
				{ label: "C", value: -5 },
			],
			colors: ["#f00"],
		});
		const slices = html.match(/class="xoji-pie__slice"/g) ?? [];
		expect(slices).toHaveLength(1);
	});

	it("opens a center total for the donut variant", async () => {
		const html = await renderFragmentLight("pie", { ...bindings, variant: "donut" });
		expect(html).toContain("xoji-pie--donut");
		expect(html).toContain('class="xoji-pie__center"');
		expect(html).toContain(">100<"); // 42+30+18+10
	});

	it("mirrors slices into a visually-hidden table with shares", async () => {
		const html = await renderFragmentLight("pie", bindings);
		expect(html).toContain('class="xoji-pie__a11y"');
		expect(html).toContain("<caption>Traffic</caption>");
		expect(html).toContain("42%");
	});

	it("shows a No data message for an empty or all-zero chart, with no slices", async () => {
		const empty = await renderFragmentLight("pie", { data: [] });
		expect(empty).toContain('class="xoji-pie__empty"');
		expect(empty).toContain(">No data</text>");
		expect(empty).not.toContain('class="xoji-pie__slice"');
		expect(empty).toContain('aria-label="No data"');
		const zeros = await renderFragmentLight("pie", { data: [{ label: "a", value: 0 }, { label: "b", value: 0 }] });
		expect(zeros).toContain('class="xoji-pie__empty"');
		expect(zeros).not.toContain('class="xoji-pie__slice"');
		const donut = await renderFragmentLight("pie", { data: [], variant: "donut" });
		expect(donut).toContain('class="xoji-pie__empty"');
		expect(donut).not.toContain('class="xoji-pie__center"');
	});
});
