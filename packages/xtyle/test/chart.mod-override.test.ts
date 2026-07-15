// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
// side effect: defines the <xtyle-chart> custom element on the happy-dom registry
import "../src/elements/chart.js";
import { loadFill, loadedFillNames } from "../src/elements/fragment-host.js";
import { manifest } from "../src/elements/fragments/chart/source.generated.js";

const START = Date.UTC(2026, 0, 1, 12, 0, 0);
const at = (i: number): number => START + i * 60_000;

const SERIES = [
	{ name: "Edge", points: [10, 20, 30, 40].map((value, i) => ({ at: at(i), value })) },
	{ name: "Origin", points: [5, 8, 12, 16].map((value, i) => ({ at: at(i), value })) },
];

/**
 * The payoff of putting the chart's axes, gridlines, legend, crosshair and readout in a fragment: a
 * third-party fill for `component.chart` can draw a completely different plot. This one keeps a bar per
 * sample instead of a line, invents its own axis marks, and rebuilds the readout — while the element
 * keeps everything that makes a chart usable (the domain shaping, the keyboard cursor, the crosshair
 * snap, `select`), which is what the assertions below hold it to.
 *
 * Loaded in the order an app really has: the mod goes in at boot, before a single chart has painted, and
 * xtyle's own fill for the slot is pulled in ahead of it by the host — the app never imports it, and the
 * mod's ops still land last.
 */
const barsMod = {
	manifest: {
		$schema: "https://xript.dev/schema/mod/v0.7.json",
		xript: "0.7",
		name: "test-chart-bars",
		version: "0.0.1",
		title: "test-chart-bars",
		description: "A test mod redrawing the chart as bars with its own axis and readout.",
		capabilities: ["xtyle.component.chart"],
		entry: { script: "mod.js", format: "script" },
		fills: {
			"component.chart": [{ id: "chart", format: "text/html+jsml", source: "chart.html" }],
		},
	},
	fragmentSources: {
		"chart.html": '<div data-root data-chart></div>\n',
		"mod.js": `"use strict";
(() => {
	function draw(b, ops) {
		var series = b.series || [];
		var colors = b.colors || [];
		var marks = "";
		var bars = "";
		var dots = "";
		for (var t = 0; t < 4; t++) {
			marks += '<text class="modded-tick" x="' + (40 + t * 180) + '" y="290">' + t + '</text>';
		}
		for (var si = 0; si < series.length; si++) {
			var pts = series[si].points || [];
			for (var i = 0; i < pts.length; i++) {
				var cx = 40 + pts[i].x * 540;
				var cy = 260 - pts[i].value * 4;
				bars += '<rect class="modded-bar" x="' + (cx - 6) + '" y="' + cy + '" width="12" height="' + (260 - cy) +
					'" fill="' + (colors[si] || "currentColor") + '"></rect>';
				dots += '<circle class="xtyle-chart__point" data-si="' + si + '" data-i="' + i + '"' +
					' cx="' + cx + '" cy="' + cy + '" r="2" data-x-label="step ' + i + '"' +
					' data-value="' + pts[i].value + '"></circle>';
			}
		}
		var rows = "";
		for (var r = 0; r < series.length; r++) {
			rows += '<li class="modded-readout-row" data-tip-row="' + r + '" hidden><b data-tip-value="' + r + '"></b></li>';
		}
		ops.replaceChildren("[data-chart]",
			'<figure class="xtyle-chart modded-chart">' +
			'<div class="xtyle-chart__plot" tabindex="0" role="img" aria-label="' + (b.title || "") + '">' +
			'<svg class="xtyle-chart__svg" viewBox="0 0 640 320">' +
			'<g class="modded-axis">' + marks + '</g>' + bars + dots +
			'<line class="xtyle-chart__guide" x1="0" y1="0" x2="0" y2="300" hidden></line>' +
			'</svg>' +
			'<div class="xtyle-chart__tooltip modded-readout" role="status" hidden>' +
			'<span data-tip-x></span><ul>' + rows + '</ul></div>' +
			'</div></figure>');
	}
	hooks.fragment.mount("chart", draw);
	hooks.fragment.update("chart", draw);
})();
`,
	},
};

type ChartEl = HTMLElement & { series: typeof SERIES; selectable: boolean };

beforeAll(async () => {
	await loadFill(barsMod.manifest, barsMod.fragmentSources);
});

afterEach(() => {
	document.body.innerHTML = "";
});

function make(attrs: Record<string, string> = {}): ChartEl {
	const el = document.createElement("xtyle-chart") as ChartEl;
	for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
	document.body.appendChild(el);
	el.series = SERIES;
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

describe("a mod installed at boot redraws the chart", () => {
	it("registers behind xtyle's own fill, which the app never had to load", () => {
		const names = loadedFillNames();
		expect(names.indexOf(manifest.name)).toBeGreaterThanOrEqual(0);
		expect(names.indexOf(manifest.name)).toBeLessThan(names.indexOf(barsMod.manifest.name));
	});

	it("wins on a chart that paints for the first time after the mod was installed", () => {
		const el = make({ label: "Requests" });
		expect(shadow(el).querySelector(".modded-chart")).not.toBeNull();
		expect(shadow(el).querySelectorAll(".modded-bar")).toHaveLength(8);
		expect(shadow(el).querySelectorAll(".modded-tick")).toHaveLength(4);
		expect(shadow(el).querySelector(".xtyle-chart__grid")).toBeNull();
		expect(shadow(el).querySelector(".xtyle-chart__line")).toBeNull();
		expect(shadow(el).querySelector(".xtyle-chart__legend")).toBeNull();
	});

	it("keeps the keyboard cursor and the readout driving the mod's own markup", () => {
		const el = make({ label: "Requests" });
		plotOf(el).dispatchEvent(new FocusEvent("focus"));
		expect(readout(el).values).toEqual(["10", "5"]);

		key(el, "ArrowRight");
		expect(readout(el).values).toEqual(["20", "8"]);
		expect(readout(el).x).toBe("step 1");
		expect(shadow(el).querySelectorAll(".xtyle-chart__point.is-active")).toHaveLength(2);
	});

	it("snaps the crosshair to the coordinates the mod itself drew", () => {
		const el = make({ label: "Requests" });
		plotOf(el).dispatchEvent(new FocusEvent("focus"));
		key(el, "End");
		expect(shadow(el).querySelector(".xtyle-chart__guide")!.getAttribute("x1")).toBe("580");
	});

	it("keeps the select contract under the redraw", () => {
		const el = make({ label: "Requests", selectable: "" });
		const seen: { points: { series: string; value: number }[] }[] = [];
		el.addEventListener("select", (event) => seen.push((event as CustomEvent).detail));
		plotOf(el).dispatchEvent(new FocusEvent("focus"));
		key(el, "Enter");
		expect(seen[0]!.points).toEqual([
			{ series: "Edge", value: 10 },
			{ series: "Origin", value: 5 },
		]);
	});
});
