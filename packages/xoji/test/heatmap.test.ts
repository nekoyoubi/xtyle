import { describe, expect, it } from "vitest";
import { getComponent, coverComponent, derive, rampColor, glowFilter, GLOW_MAX_BLUR } from "../src/index.js";
import { renderFragmentLight } from "../src/elements/fragment-ssr.js";
import { xojiDefault } from "../src/batteries.js";

const register = derive(xojiDefault, {
	constraints: { "--bg-0": "#0b0d12", "--fg-0": "#e6e9ef", "--accent": "#6ea8fe" },
});

const bindings = {
	values: [
		[0, 5, 10],
		[3, 8, 1],
	],
	rows: ["A", "B"],
	cols: ["x", "y", "z"],
	cellColors: [
		["#111111", "#555555", "#999999"],
		["#333333", "#777777", "#222222"],
	],
	title: "Grid",
};

describe("heatmap", () => {
	it("is registered under the metrics category", () => {
		const manifest = getComponent("heatmap");
		expect(manifest.category).toBe("metrics");
		expect(manifest.name).toBe("Heatmap");
	});

	it("covers every consumed token against xoji-default", () => {
		const result = coverComponent(getComponent("heatmap"), register);
		expect(result.missing, `missing: ${result.missing.join(", ")}`).toEqual([]);
		expect(result.covered).toBe(true);
	});

	it("renders an svg grid with one cell rect per matrix entry", async () => {
		const html = await renderFragmentLight("heatmap", bindings);
		const cells = html.match(/class="xoji-heatmap__cell"/g) ?? [];
		expect(cells).toHaveLength(6); // 2 rows * 3 cols
		expect(html).toContain("<svg");
		expect(html).toContain('fill="#555555"');
	});

	it("renders row and column labels", async () => {
		const html = await renderFragmentLight("heatmap", bindings);
		expect(html).toContain('class="xoji-heatmap__rowlabel"');
		expect(html).toContain('class="xoji-heatmap__collabel"');
	});

	it("mirrors the matrix into a visually-hidden table for assistive tech", async () => {
		const html = await renderFragmentLight("heatmap", bindings);
		expect(html).toContain('class="xoji-heatmap__a11y"');
		expect(html).toContain("<caption>Grid</caption>");
		expect(html).toContain('<th scope="row">A</th>');
	});

	it("renders cells as read-only image data points by default", async () => {
		const html = await renderFragmentLight("heatmap", bindings);
		expect(html).toContain('role="img"');
		expect(html).not.toContain('role="button"');
		expect(html).not.toContain("xoji-heatmap--selectable");
	});

	it("promotes cells to buttons when selectable, for an actionable grid", async () => {
		const html = await renderFragmentLight("heatmap", { ...bindings, selectable: true });
		expect(html).toContain("xoji-heatmap--selectable");
		expect(html).toContain('role="button"');
		expect(html).not.toContain('role="img"');
		const buttons = html.match(/role="button"/g) ?? [];
		expect(buttons).toHaveLength(6);
	});

	it("prints each cell's value when showValues is set", async () => {
		const plain = await renderFragmentLight("heatmap", bindings);
		expect(plain).not.toContain('class="xoji-heatmap__value"');
		const withValues = await renderFragmentLight("heatmap", { ...bindings, showValues: true });
		expect(withValues).toContain('class="xoji-heatmap__value"');
	});

	it("renders no glow filter without a cellGlows channel", async () => {
		const html = await renderFragmentLight("heatmap", bindings);
		expect(html).not.toContain("filter:");
	});

	it("applies a per-cell drop-shadow for the glow channel, and none for a null cell", async () => {
		const cellGlows = [
			["drop-shadow(0 0 4.0px #6ea8fe)", null, "drop-shadow(0 0 7.0px #6ea8fe)"],
			[null, "drop-shadow(0 0 2.0px #6ea8fe)", null],
		];
		const html = await renderFragmentLight("heatmap", { ...bindings, cellGlows });
		const filters = html.match(/filter:drop-shadow/g) ?? [];
		expect(filters).toHaveLength(3); // one per non-null glow cell
		expect(html).toContain('style="filter:drop-shadow(0 0 7.0px #6ea8fe)"');
	});

	it("renders no scale key by default, and a swatch ramp with value endpoints when scale is set", async () => {
		const plain = await renderFragmentLight("heatmap", bindings);
		expect(plain).not.toContain("xoji-heatmap__scale");
		const scaled = await renderFragmentLight("heatmap", {
			...bindings,
			scale: true,
			scaleColors: ["#111", "#333", "#555", "#777", "#999"],
			scaleLow: 0,
			scaleHigh: 10,
		});
		expect(scaled).toContain('class="xoji-heatmap__scale"');
		const swatches = scaled.match(/xoji-heatmap__scale-swatch/g) ?? [];
		expect(swatches).toHaveLength(5);
		expect(scaled).toContain("background:#999");
		expect(scaled).toContain('class="xoji-heatmap__scale-end">0</span>');
		expect(scaled).toContain('class="xoji-heatmap__scale-end">10</span>');
	});

	it("folds the glow value into a cell's accessible name so the second metric has a text path", async () => {
		const glowValues = [
			[40, 12, 90],
			[8, 30, 0],
		];
		const withGlow = await renderFragmentLight("heatmap", { ...bindings, glowValues, glowLabel: "runtime" });
		expect(withGlow).toContain('aria-label="A, x: 0, runtime 40"');
		expect(withGlow).toContain('aria-label="B, y: 8, runtime 30"');
		const noLabel = await renderFragmentLight("heatmap", { ...bindings, glowValues });
		expect(noLabel).toContain('aria-label="A, x: 0"'); // no glow text without a label
		expect(noLabel).not.toContain("runtime");
	});

	it("rings the current cells and pulses them only when currentPulse is set", async () => {
		const marked = await renderFragmentLight("heatmap", { ...bindings, current: [[0, 1]] });
		const current = marked.match(/xoji-heatmap__cell--current/g) ?? [];
		expect(current).toHaveLength(1); // exactly the one flagged cell
		expect(marked).not.toContain("xoji-heatmap__cell--pulse");
		const pulsing = await renderFragmentLight("heatmap", { ...bindings, current: [[0, 1]], currentPulse: true });
		expect(pulsing).toContain("xoji-heatmap__cell--pulse");
	});

	it("tints the current ring with a known tone modifier, ignoring an unknown one", async () => {
		const toned = await renderFragmentLight("heatmap", { ...bindings, current: [[0, 1]], currentTone: "danger" });
		expect(toned).toContain("xoji-heatmap--now-danger");
		const bogus = await renderFragmentLight("heatmap", { ...bindings, current: [[0, 1]], currentTone: "chartreuse" });
		expect(bogus).not.toContain("xoji-heatmap--now-");
	});

	it("uses a per-cell title as the cell's accessible name, falling back to the default", async () => {
		const titles = [
			["", "custom hover for x,B", ""],
			["", "", ""],
		];
		const html = await renderFragmentLight("heatmap", { ...bindings, titles });
		expect(html).toContain('aria-label="custom hover for x,B"');
		expect(html).toContain('aria-label="A, x: 0"'); // untitled cell keeps the default readout
	});

	it("shows a No data message with no grid for an empty matrix", async () => {
		const html = await renderFragmentLight("heatmap", { values: [] });
		expect(html).toContain('class="xoji-heatmap__empty"');
		expect(html).toContain(">No data</div>");
		expect(html).not.toContain('class="xoji-heatmap__cell"');
		expect(html).not.toContain("<svg");
		expect(html).toContain('aria-label="No data"');
	});
});

describe("glowFilter", () => {
	it("scales blur with intensity and returns null at or below zero", () => {
		expect(glowFilter(0, "#fff")).toBeNull();
		expect(glowFilter(-1, "#fff")).toBeNull();
		expect(glowFilter(1, "#abc")).toBe(`drop-shadow(0 0 ${GLOW_MAX_BLUR.toFixed(1)}px #abc)`);
		expect(glowFilter(0.5, "#abc")).toBe(`drop-shadow(0 0 ${(GLOW_MAX_BLUR / 2).toFixed(1)}px #abc)`);
	});

	it("clamps intensity above one to the full-strength blur", () => {
		expect(glowFilter(5, "#abc")).toBe(glowFilter(1, "#abc"));
	});
});

describe("rampColor", () => {
	it("maps the ends of a ramp to distinct colors", () => {
		const low = rampColor("accent", 0, register);
		const high = rampColor("accent", 1, register);
		expect(low).not.toBe(high);
		expect(low).toMatch(/^#[0-9a-f]{6}$/i);
		expect(high).toMatch(/^#[0-9a-f]{6}$/i);
	});

	it("clamps out-of-range intensities to the ramp ends", () => {
		expect(rampColor("accent", -5, register)).toBe(rampColor("accent", 0, register));
		expect(rampColor("accent", 5, register)).toBe(rampColor("accent", 1, register));
	});

	it("reverse swaps the ends", () => {
		expect(rampColor("accent", 0, register, { reverse: true })).toBe(rampColor("accent", 1, register));
	});

	it("interpolates an explicit stop array in OKLCH", () => {
		const mid = rampColor(["#000000", "#ffffff"], 0.5, register);
		expect(mid).toMatch(/^#[0-9a-f]{6}$/i);
		expect(mid).not.toBe("#000000");
		expect(mid).not.toBe("#ffffff");
	});
});
