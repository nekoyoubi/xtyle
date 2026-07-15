// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { loadFill } from "../src/elements/fragment-host.js";
import { manifest as chartManifest, fragmentSources as chartSources } from "../src/elements/fragments/chart/source.generated.js";

const START = Date.UTC(2026, 0, 1, 12, 0, 0);
const at = (i: number): number => START + i * 60_000;

const series = [
	{ name: "Edge", points: [10, 20, 30, 40].map((value, i) => ({ at: at(i), value })) },
	{ name: "Origin", points: [5, 8, 12, 16].map((value, i) => ({ at: at(i), value })) },
];

/**
 * A third-party mod filling the chart's host slot: the payoff of putting the axes, the gridlines, the
 * legend, the crosshair, and the readout in the fragment rather than drawing them in the element. This
 * fill restructures the furniture wholesale — a bare plot with its own axis marks and a differently
 * shaped readout — while the element keeps the domain shaping, the cursor, and the `select` contract,
 * which is what the assertions below hold it to. Its handlers are appended to the built-in fill's and
 * its ops apply last, so its `replaceChildren` is what the DOM ends up with.
 */
const moddedChart = {
	manifest: {
		$schema: "https://xript.dev/schema/mod/v0.7.json",
		xript: "0.7",
		name: "test-chart-reskin",
		version: "0.0.1",
		title: "test-chart-reskin",
		description: "A test mod restructuring the chart's axes, crosshair, and readout.",
		capabilities: ["xtyle.component.chart"],
		entry: { script: "mod.js", format: "script" },
		fills: {
			"component.chart": [{ id: "chart", format: "text/html+jsml", source: "chart.html" }],
		},
	},
	fragmentSources: {
		"mod.js": `"use strict";
(() => {
	function draw(b, ops) {
		var series = b.series || [];
		var colors = b.colors || [];
		var marks = "";
		var lines = "";
		var dots = "";
		for (var t = 0; t <= 3; t++) {
			marks += '<text class="modded-axis-mark" x="' + (40 + t * 180) + '" y="290">' + t + '</text>';
		}
		for (var si = 0; si < series.length; si++) {
			var pts = series[si].points || [];
			var d = "";
			for (var i = 0; i < pts.length; i++) {
				var cx = 40 + pts[i].x * 560;
				var cy = 260 - pts[i].value * 4;
				d += (i ? " L" : "M") + cx + " " + cy;
				dots += '<circle class="xtyle-chart__point" data-si="' + si + '" data-i="' + i + '"' +
					' cx="' + cx + '" cy="' + cy + '" r="3" data-x-label="t' + i + '"' +
					' data-value="' + pts[i].value + '"></circle>';
			}
			lines += '<path class="xtyle-chart__line modded-line" d="' + d + '" stroke="' + (colors[si] || "currentColor") + '" fill="none"></path>';
		}
		var rows = "";
		for (var r = 0; r < series.length; r++) {
			rows += '<li class="modded-row" data-tip-row="' + r + '" hidden><b data-tip-value="' + r + '"></b></li>';
		}
		ops.replaceChildren("[data-chart]",
			'<figure class="xtyle-chart modded-chart">' +
			'<div class="xtyle-chart__plot" tabindex="0" role="img" aria-label="' + (b.title || "") + '">' +
			'<svg class="xtyle-chart__svg" viewBox="0 0 640 320">' +
			'<g class="modded-axis">' + marks + '</g>' + lines + dots +
			'<line class="xtyle-chart__guide" x1="0" y1="0" x2="0" y2="300" hidden></line>' +
			'</svg>' +
			'<div class="xtyle-chart__tooltip modded-tooltip" role="status" hidden>' +
			'<span data-tip-x></span><ul>' + rows + '</ul></div>' +
			'</div></figure>');
	}
	hooks.fragment.mount("chart", draw);
	hooks.fragment.update("chart", draw);
})();
`,
		"chart.html": "<div data-root data-chart></div>",
	},
};

type Chart = HTMLElement & { series: typeof series; selectable: boolean };

beforeAll(async () => {
	await import("../src/elements/chart.js");
	await loadFill(chartManifest, chartSources);
});

afterEach(() => {
	document.body.innerHTML = "";
});

function make(attrs: Record<string, string> = {}): Chart {
	const el = document.createElement("xtyle-chart") as Chart;
	for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
	document.body.appendChild(el);
	el.series = series;
	return el;
}

function shadow(el: HTMLElement): ShadowRoot | HTMLElement {
	return el.shadowRoot ?? el;
}

function plotOf(el: HTMLElement): HTMLElement {
	const plot = shadow(el).querySelector<HTMLElement>(".xtyle-chart__plot");
	if (!plot) throw new Error("chart has no plot");
	return plot;
}

function key(el: HTMLElement, k: string): void {
	plotOf(el).dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
}

function readout(el: HTMLElement): { x: string; values: string[] } {
	const tip = shadow(el).querySelector<HTMLElement>(".xtyle-chart__tooltip");
	const values = [...(tip?.querySelectorAll<HTMLElement>("[data-tip-value]") ?? [])]
		.filter((cell) => !cell.closest("[data-tip-row]")?.hasAttribute("hidden"))
		.map((cell) => cell.textContent ?? "");
	return { x: tip?.querySelector<HTMLElement>("[data-tip-x]")?.textContent ?? "", values };
}

describe("chart element", () => {
	it("renders a plot from the series property alone", () => {
		const el = make({ label: "Requests" });
		expect(shadow(el).querySelectorAll(".xtyle-chart__line")).toHaveLength(2);
		expect(shadow(el).querySelectorAll(".xtyle-chart__point")).toHaveLength(8);
	});

	it("walks the cursor along the axis with the arrow keys, reading every series at once", () => {
		const el = make({ label: "Requests" });
		const plot = plotOf(el);
		plot.dispatchEvent(new FocusEvent("focus"));
		expect(readout(el).values).toEqual(["10", "5"]);

		key(el, "ArrowRight");
		expect(readout(el).values).toEqual(["20", "8"]);

		key(el, "ArrowRight");
		key(el, "ArrowRight");
		expect(readout(el).values).toEqual(["40", "16"]);

		key(el, "ArrowRight");
		expect(readout(el).values).toEqual(["40", "16"]);

		key(el, "Home");
		expect(readout(el).values).toEqual(["10", "5"]);

		key(el, "End");
		expect(readout(el).values).toEqual(["40", "16"]);
	});

	it("marks the samples under the cursor and snaps the crosshair to them", () => {
		const el = make({ label: "Requests" });
		plotOf(el).dispatchEvent(new FocusEvent("focus"));
		key(el, "ArrowRight");
		const active = shadow(el).querySelectorAll(".xtyle-chart__point.is-active");
		expect(active).toHaveLength(2);
		const guide = shadow(el).querySelector(".xtyle-chart__guide")!;
		expect(guide.hasAttribute("hidden")).toBe(false);
		expect(guide.getAttribute("x1")).toBe(
			shadow(el).querySelector('.xtyle-chart__point[data-si="0"][data-i="1"]')!.getAttribute("cx"),
		);
	});

	it("dismisses the readout on Escape and on blur", () => {
		const el = make({ label: "Requests" });
		const plot = plotOf(el);
		plot.dispatchEvent(new FocusEvent("focus"));
		expect(shadow(el).querySelector<HTMLElement>(".xtyle-chart__tooltip")!.hidden).toBe(false);

		key(el, "Escape");
		expect(shadow(el).querySelector<HTMLElement>(".xtyle-chart__tooltip")!.hidden).toBe(true);
		expect(shadow(el).querySelectorAll(".xtyle-chart__point.is-active")).toHaveLength(0);

		plot.dispatchEvent(new FocusEvent("focus"));
		plot.dispatchEvent(new FocusEvent("blur"));
		expect(shadow(el).querySelector<HTMLElement>(".xtyle-chart__tooltip")!.hidden).toBe(true);
	});

	it("stays silent about a series whose samples don't reach the cursor", () => {
		const el = make({ label: "Ragged" });
		el.series = [
			{ name: "Long", points: [1, 2, 3, 4].map((value, i) => ({ at: at(i), value })) },
			{ name: "Short", points: [9].map((value) => ({ value, at: at(0) })) },
		];
		plotOf(el).dispatchEvent(new FocusEvent("focus"));
		expect(readout(el).values).toEqual(["1", "9"]);

		key(el, "End");
		expect(readout(el).values).toEqual(["4"]);
	});

	it("fires select only when selectable, carrying the x and every series' value there", () => {
		const quiet = make({ label: "Requests" });
		let fired = 0;
		quiet.addEventListener("select", () => fired++);
		plotOf(quiet).dispatchEvent(new FocusEvent("focus"));
		key(quiet, "Enter");
		expect(fired).toBe(0);

		const el = make({ label: "Requests", selectable: "" });
		const seen: { x: number; label: string; index: number; points: { series: string; value: number }[] }[] = [];
		el.addEventListener("select", (e) => seen.push((e as CustomEvent).detail));
		plotOf(el).dispatchEvent(new FocusEvent("focus"));
		key(el, "ArrowRight");
		key(el, "Enter");

		expect(seen).toHaveLength(1);
		expect(seen[0]!.index).toBe(1);
		expect(seen[0]!.x).toBe(at(1));
		expect(seen[0]!.points).toEqual([
			{ series: "Edge", value: 20 },
			{ series: "Origin", value: 8 },
		]);
		expect(seen[0]!.label).toBeTruthy();
	});

	it("keeps the domain shaping honest: a window drops samples that fall outside it", () => {
		const el = make({ label: "Requests", window: String(2 * 60_000), domain: JSON.stringify([at(1), at(3)]) });
		plotOf(el).dispatchEvent(new FocusEvent("focus"));
		expect(readout(el).values).toEqual(["20", "8"]);
		expect(shadow(el).querySelectorAll(".xtyle-chart__point")).toHaveLength(6);
	});

	it("shows an empty state and no cursor when there is nothing to plot", () => {
		const el = document.createElement("xtyle-chart") as Chart;
		document.body.appendChild(el);
		expect(shadow(el).querySelector(".xtyle-chart__empty")).not.toBeNull();
		expect(shadow(el).querySelector(".xtyle-chart__tooltip")).toBeNull();
	});
});

describe("a mod reshapes the chart's axes, crosshair, and readout", () => {
	beforeAll(async () => {
		await loadFill(moddedChart.manifest, moddedChart.fragmentSources);
	});

	it("restructures the chrome wholesale: its own axis marks, line, and readout rows", () => {
		const el = make({ label: "Requests" });
		expect(shadow(el).querySelector(".modded-chart")).not.toBeNull();
		expect(shadow(el).querySelectorAll(".modded-axis-mark")).toHaveLength(4);
		expect(shadow(el).querySelectorAll(".modded-line")).toHaveLength(2);
		expect(shadow(el).querySelector(".modded-tooltip")).not.toBeNull();
		expect(shadow(el).querySelector(".xtyle-chart__grid")).toBeNull();
		expect(shadow(el).querySelector(".xtyle-chart__legend")).toBeNull();
	});

	it("keeps the keyboard cursor and the readout working against the mod's own markup", () => {
		const el = make({ label: "Requests" });
		plotOf(el).dispatchEvent(new FocusEvent("focus"));
		key(el, "ArrowRight");
		expect(readout(el).values).toEqual(["20", "8"]);
		expect(readout(el).x).toBe("t1");
		expect(shadow(el).querySelectorAll(".xtyle-chart__point.is-active")).toHaveLength(2);
	});

	it("snaps the crosshair to the coordinates the mod itself drew, not the built-in geometry", () => {
		const el = make({ label: "Requests" });
		plotOf(el).dispatchEvent(new FocusEvent("focus"));
		key(el, "End");
		const guide = shadow(el).querySelector(".xtyle-chart__guide")!;
		expect(guide.getAttribute("x1")).toBe("600");
	});

	it("keeps the select contract under the reskin", () => {
		const el = make({ label: "Requests", selectable: "" });
		const seen: { points: { series: string; value: number }[] }[] = [];
		el.addEventListener("select", (e) => seen.push((e as CustomEvent).detail));
		plotOf(el).dispatchEvent(new FocusEvent("focus"));
		key(el, "Enter");
		expect(seen[0]!.points).toEqual([
			{ series: "Edge", value: 10 },
			{ series: "Origin", value: 5 },
		]);
	});
});
