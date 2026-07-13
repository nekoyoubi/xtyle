import { describe, expect, it } from "vitest";
import { getComponent, coverComponent, derive, windowedPlot, resolveSparklineBounds, formatSparklineValue } from "../src/index.js";
import { renderFragmentLight } from "../src/elements/fragment-ssr.js";
import { xtyleDefault } from "../src/batteries.js";

const register = derive(xtyleDefault, {
	constraints: { "--bg-0": "#0b0d12", "--fg-0": "#e6e9ef", "--accent": "#6ea8fe" },
});

describe("sparkline", () => {
	it("is registered under the metrics category", () => {
		const manifest = getComponent("sparkline");
		expect(manifest.category).toBe("metrics");
		expect(manifest.name).toBe("Sparkline");
	});

	it("covers every consumed token against xtyle-default", () => {
		const result = coverComponent(getComponent("sparkline"), register);
		expect(result.missing, `missing: ${result.missing.join(", ")}`).toEqual([]);
		expect(result.covered).toBe(true);
	});

	it("draws a polyline through every value with an end dot", async () => {
		const html = await renderFragmentLight("sparkline", { values: [1, 3, 2, 5, 4], label: "Trend" });
		expect(html).toContain('class="xtyle-sparkline__line"');
		const points = (html.match(/points="([^"]*)"/) ?? [])[1] ?? "";
		expect(points.trim().split(/\s+/)).toHaveLength(5);
		expect(html).toContain('class="xtyle-sparkline__end"');
		expect(html).toContain('aria-label="Trend"');
	});

	it("fills an area path when variant is area", async () => {
		const html = await renderFragmentLight("sparkline", { values: [1, 3, 2], variant: "area" });
		expect(html).toContain('class="xtyle-sparkline__area"');
		expect(html).toContain("xtyle-sparkline--area");
	});

	it("draws one rect per value when variant is bar and no end dot", async () => {
		const html = await renderFragmentLight("sparkline", { values: [1, 3, 2, 5], variant: "bar" });
		const rects = html.match(/class="xtyle-sparkline__bar"/g) ?? [];
		expect(rects).toHaveLength(4);
		expect(html).not.toContain("xtyle-sparkline__end");
	});

	it("applies the tone class for its single color", async () => {
		const html = await renderFragmentLight("sparkline", { values: [1, 2], tone: "success" });
		expect(html).toContain("xtyle-sparkline--success");
	});

	it("fills a block per on-sample over a track for the occupancy variant, no end dot", async () => {
		const html = await renderFragmentLight("sparkline", {
			values: [1, 1, 0, 1, 0],
			variant: "occupancy",
			min: 0,
			max: 1,
		});
		expect(html).toContain('class="xtyle-sparkline__track"');
		const blocks = html.match(/class="xtyle-sparkline__block"/g) ?? [];
		expect(blocks).toHaveLength(3); // three on-samples, the two off-samples leave gaps
		expect(html).not.toContain("xtyle-sparkline__end");
	});

	it("leaves an all-off occupancy strip empty instead of a solid block", async () => {
		const html = await renderFragmentLight("sparkline", {
			values: [0, 0, 0],
			variant: "occupancy",
			min: 0,
			max: 1,
		});
		expect(html).not.toContain("xtyle-sparkline__block");
		expect(html).toContain("xtyle-sparkline__track");
	});

	it("places points-mode samples at their time position, not even spacing", async () => {
		const html = await renderFragmentLight("sparkline", {
			plot: [
				{ x: 0, value: 1 },
				{ x: 0.25, value: 3 },
				{ x: 1, value: 2 },
			],
		});
		const coords = (html.match(/points="([^"]*)"/) ?? [])[1] ?? "";
		const xs = coords
			.trim()
			.split(/\s+/)
			.map((p) => Number(p.split(",")[0]));
		// PAD = 3, innerW = 100 - 6 = 94, so x = 3 + nx * 94
		expect(xs[0]).toBeCloseTo(3, 1);
		expect(xs[1]).toBeCloseTo(3 + 0.25 * 94, 1);
		expect(xs[2]).toBeCloseTo(97, 1);
	});

	it("renders a sample-and-hold step line when step is set", async () => {
		const plot = [
			{ x: 0, value: 0 },
			{ x: 0.5, value: 1 },
			{ x: 1, value: 0 },
		];
		const straight = await renderFragmentLight("sparkline", { plot });
		const stepped = await renderFragmentLight("sparkline", { plot, step: true });
		const count = (h: string): number =>
			((h.match(/points="([^"]*)"/) ?? [])[1] ?? "").trim().split(/\s+/).length;
		expect(count(straight)).toBe(3);
		expect(count(stepped)).toBe(5); // 2n - 1: a hold segment between each pair
	});
});

describe("windowedPlot", () => {
	it("maps timestamps to a normalized x across a sliding window and drops aged-off samples", () => {
		const now = 1_000_000;
		const plot = windowedPlot(
			[
				{ at: now, value: 3 },
				{ at: now - 50_000, value: 2 },
				{ at: now - 200_000, value: 9 }, // older than the 100s window, dropped
			],
			{ window: 100_000, now },
		);
		expect(plot).toHaveLength(2);
		expect(plot[0]?.x).toBeCloseTo(0.5, 5);
		expect(plot[1]?.x).toBeCloseTo(1, 5);
		expect(plot.map((p) => p.value)).toEqual([2, 3]); // sorted by time, not input order
	});

	it("honors an explicit domain over the sliding window", () => {
		const plot = windowedPlot(
			[
				{ at: 100, value: 1 },
				{ at: 150, value: 2 },
				{ at: 200, value: 3 },
			],
			{ domain: [100, 200], now: 9_999_999 },
		);
		expect(plot).toHaveLength(3);
		expect(plot[0]?.x).toBeCloseTo(0, 5);
		expect(plot[2]?.x).toBeCloseTo(1, 5);
	});

	it("parses date-string timestamps", () => {
		const start = Date.parse("2026-07-02T12:00:00Z");
		const plot = windowedPlot(
			[
				{ at: "2026-07-02T12:00:00Z", value: 1 },
				{ at: "2026-07-02T12:05:00Z", value: 2 },
			],
			{ domain: [start, start + 300_000], now: 0 },
		);
		expect(plot).toHaveLength(2);
		expect(plot[0]?.x).toBeCloseTo(0, 5);
		expect(plot[1]?.x).toBeCloseTo(1, 5);
	});

	it("shows a No data label for an empty series instead of a blank box", async () => {
		const html = await renderFragmentLight("sparkline", { values: [] });
		expect(html).toContain('class="xtyle-sparkline__empty"');
		expect(html).toContain(">No data</span>");
		expect(html).toContain('aria-label="No data"');
		expect(html).not.toContain("<svg");
	});
});

describe("resolveSparklineBounds", () => {
	it("pins a percent series to [0, 100] and a unit series to [0, 1]", () => {
		expect(resolveSparklineBounds([38, 71], { bounds: "percent" })).toEqual({ min: 0, max: 100 });
		expect(resolveSparklineBounds([0, 1, 0], { bounds: "unit" })).toEqual({ min: 0, max: 1 });
	});

	it("caps a duration series at a rolling power of two above the peak", () => {
		expect(resolveSparklineBounds([120, 90, 760, 150], { bounds: "duration" })).toEqual({ min: 0, max: 1024 });
		// a low, flat series still gets a sane floor of 1
		expect(resolveSparklineBounds([0.2, 0.3], { bounds: "duration" })).toEqual({ min: 0, max: 1 });
	});

	it("lets an explicit min/max override the kind, and passes through with no bounds", () => {
		expect(resolveSparklineBounds([1, 2], { bounds: "percent", max: 50 })).toEqual({ min: 0, max: 50 });
		expect(resolveSparklineBounds([1, 2], { min: 5, max: 9 })).toEqual({ min: 5, max: 9 });
		expect(resolveSparklineBounds([1, 2], {})).toEqual({ min: undefined, max: undefined });
	});
});

describe("formatSparklineValue", () => {
	it("reads a duration in seconds as s / m / h", () => {
		expect(formatSparklineValue(42, "duration")).toBe("42s");
		expect(formatSparklineValue(90, "duration")).toBe("1.5m");
		expect(formatSparklineValue(3600, "duration")).toBe("1h");
	});

	it("appends a percent sign and steps bytes by 1024", () => {
		expect(formatSparklineValue(87, "percent")).toBe("87%");
		expect(formatSparklineValue(512, "bytes")).toBe("512 B");
		expect(formatSparklineValue(2048, "bytes")).toBe("2 KB");
		expect(formatSparklineValue(1_572_864, "bytes")).toBe("1.5 MB");
	});

	it("trims a unit value and passes the raw value through with no format", () => {
		expect(formatSparklineValue(0.33333, "unit")).toBe("0.33");
		expect(formatSparklineValue(1.23456)).toBe("1.23456");
	});
});
