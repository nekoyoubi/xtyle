// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import "../src/elements/bar.js";
import "../src/elements/pie.js";
import "../src/elements/heatmap.js";
import { loadFill, loadedFillNames } from "../src/elements/fragment-host.js";
import { manifest as barManifest } from "../src/elements/fragments/bar/source.generated.js";
import { manifest as pieManifest } from "../src/elements/fragments/pie/source.generated.js";
import { manifest as heatmapManifest } from "../src/elements/fragments/heatmap/source.generated.js";

/**
 * The payoff of putting the readout rows in the fill: a mod can reshape a row — a color swatch, a unit
 * suffix, the value ahead of the name — and the element never writes over it, because all it does on a
 * hover is unhide the row the pointer is on. Each of these three fills reshapes its readout that way; the
 * assertions hold that markup up through repeated hovers, which is exactly where an element that wrote the
 * readout itself would have flattened it on the very next pointer move.
 */
function mod(id: string, capability: string, script: string) {
	return {
		manifest: {
			$schema: "https://xript.dev/schema/mod/v0.7.json",
			xript: "0.7",
			name: `test-${id}-readout`,
			version: "0.0.1",
			title: `test-${id}-readout`,
			description: `A test mod reshaping the ${id} readout rows.`,
			capabilities: [capability],
			entry: { script: "mod.js", format: "script" },
			fills: {
				[`component.${id}`]: [{ id, format: "text/html+jsml", source: `${id}.html` }],
			},
		},
		fragmentSources: {
			[`${id}.html`]: `<div data-root data-${id}></div>`,
			"mod.js": script,
		},
	};
}

const barMod = mod(
	"bar",
	"xtyle.component.bar",
	`"use strict";
(() => {
	function draw(b, ops) {
		var series = b.series || [];
		var cats = b.categories || [];
		var colors = b.colors || [];
		var bars = "";
		var rows = "";
		for (var ci = 0; ci < cats.length; ci++) {
			for (var si = 0; si < series.length; si++) {
				var v = (series[si].values || [])[ci];
				bars += '<rect class="xtyle-bar__bar modded-bar" data-si="' + si + '" data-ci="' + ci + '"' +
					' x="' + (ci * 40 + si * 12) + '" y="0" width="10" height="' + v + '" tabindex="0"></rect>';
				rows += '<li class="xtyle-bar__tooltip-row modded-row" data-tip-row="' + si + '-' + ci + '" hidden>' +
					'<b class="modded-value">' + v + 'ms</b>' +
					'<i class="modded-swatch" style="background:' + (colors[si] || "currentColor") + '"></i>' +
					'<span class="modded-name">' + cats[ci] + '/' + series[si].name + '</span></li>';
			}
		}
		ops.replaceChildren("[data-bar]",
			'<figure class="xtyle-bar modded-chart"><svg class="xtyle-bar__svg">' + bars + '</svg>' +
			'<ul class="xtyle-bar__tooltip modded-tooltip" role="status" hidden>' + rows + '</ul></figure>');
	}
	hooks.fragment.mount("bar", draw);
	hooks.fragment.update("bar", draw);
})();
`,
);

const pieMod = mod(
	"pie",
	"xtyle.component.pie",
	`"use strict";
(() => {
	function draw(b, ops) {
		var data = b.data || [];
		var slices = "";
		var rows = "";
		for (var i = 0; i < data.length; i++) {
			slices += '<circle class="xtyle-pie__slice modded-slice" data-i="' + i + '" r="10" tabindex="0"></circle>';
			rows += '<li class="xtyle-pie__tooltip-row modded-row" data-tip-row="' + i + '" hidden>' +
				'<b class="modded-value">' + data[i].value + ' hits</b>' +
				'<i class="modded-swatch"></i>' +
				'<span class="modded-name">' + data[i].label + '</span></li>';
		}
		ops.replaceChildren("[data-pie]",
			'<figure class="xtyle-pie modded-chart"><svg class="xtyle-pie__svg">' + slices + '</svg>' +
			'<ul class="xtyle-pie__tooltip modded-tooltip" role="status" hidden>' + rows + '</ul></figure>');
	}
	hooks.fragment.mount("pie", draw);
	hooks.fragment.update("pie", draw);
})();
`,
);

const heatmapMod = mod(
	"heatmap",
	"xtyle.component.heatmap",
	`"use strict";
(() => {
	function draw(b, ops) {
		var values = b.values || [];
		var rowNames = b.rows || [];
		var colNames = b.cols || [];
		var cells = "";
		var rows = "";
		for (var r = 0; r < values.length; r++) {
			for (var c = 0; c < (values[r] || []).length; c++) {
				cells += '<rect class="xtyle-heatmap__cell modded-cell" data-r="' + r + '" data-c="' + c + '"' +
					' x="' + (c * 20) + '" y="' + (r * 20) + '" width="18" height="18" tabindex="0"></rect>';
				rows += '<li class="xtyle-heatmap__tooltip-row modded-row" data-tip-row="' + r + '-' + c + '" hidden>' +
					'<b class="modded-value">' + values[r][c] + ' rpm</b>' +
					'<i class="modded-swatch"></i>' +
					'<span class="modded-name">' + (rowNames[r] || "") + '/' + (colNames[c] || "") + '</span></li>';
			}
		}
		ops.replaceChildren("[data-heatmap]",
			'<figure class="xtyle-heatmap modded-chart"><svg class="xtyle-heatmap__svg">' + cells + '</svg>' +
			'<ul class="xtyle-heatmap__tooltip modded-tooltip" role="status" hidden>' + rows + '</ul></figure>');
	}
	hooks.fragment.mount("heatmap", draw);
	hooks.fragment.update("heatmap", draw);
})();
`,
);

beforeAll(async () => {
	await Promise.all([
		loadFill(barMod.manifest, barMod.fragmentSources),
		loadFill(pieMod.manifest, pieMod.fragmentSources),
		loadFill(heatmapMod.manifest, heatmapMod.fragmentSources),
	]);
});

afterEach(() => {
	document.body.innerHTML = "";
});

function root(el: HTMLElement): ShadowRoot | HTMLElement {
	return el.shadowRoot ?? el;
}

function hover(node: Element): void {
	node.dispatchEvent(new Event("pointerenter", { bubbles: false }));
}

function shown(el: HTMLElement): HTMLElement | null {
	return [...root(el).querySelectorAll<HTMLElement>(".modded-row")].filter((row) => !row.hidden)[0] ?? null;
}

/** The mod's row, still whole: its swatch, its unit, and its own order (value first, name last). */
function intact(row: HTMLElement | null): boolean {
	if (!row) return false;
	const parts = [...row.children].map((child) => child.className);
	return (
		parts.join(",") === "modded-value,modded-swatch,modded-name" &&
		/(ms|hits|rpm)$/.test(row.querySelector(".modded-value")?.textContent ?? "")
	);
}

describe("the readout mods install at boot, ahead of any chart painting", () => {
	it("registers each behind the xtyle fill the app never had to load", () => {
		const names = loadedFillNames();
		for (const [builtIn, mod] of [
			[barManifest.name, barMod.manifest.name],
			[pieManifest.name, pieMod.manifest.name],
			[heatmapManifest.name, heatmapMod.manifest.name],
		]) {
			expect(names.indexOf(builtIn)).toBeGreaterThanOrEqual(0);
			expect(names.indexOf(builtIn)).toBeLessThan(names.indexOf(mod));
		}
	});
});

describe("a mod reshapes the bar readout", () => {
	type Bar = HTMLElement & { series: { name: string; values: number[] }[]; categories: string[] };

	function make(attrs: Record<string, string> = {}): Bar {
		const el = document.createElement("xtyle-bar") as Bar;
		for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
		document.body.appendChild(el);
		el.categories = ["Q1", "Q2"];
		el.series = [{ name: "Web", values: [12, 19] }];
		return el;
	}

	it("keeps the mod's rows whole across successive hovers", () => {
		const el = make({ label: "Latency" });
		const first = root(el).querySelector('.xtyle-bar__bar[data-si="0"][data-ci="0"]')!;
		const second = root(el).querySelector('.xtyle-bar__bar[data-si="0"][data-ci="1"]')!;

		hover(first);
		expect(shown(el)!.dataset.tipRow).toBe("0-0");
		expect(intact(shown(el))).toBe(true);
		expect(shown(el)!.querySelector(".modded-value")!.textContent).toBe("12ms");

		hover(second);
		expect(shown(el)!.dataset.tipRow).toBe("0-1");
		expect(intact(shown(el))).toBe(true);
		expect(shown(el)!.querySelector(".modded-value")!.textContent).toBe("19ms");
		expect(root(el).querySelectorAll(".modded-swatch")).toHaveLength(2);
	});

	it("still fires select off the mod's own bars", () => {
		const el = make({ selectable: "" });
		const seen: unknown[] = [];
		el.addEventListener("select", (event) => seen.push((event as CustomEvent).detail));

		(root(el).querySelector('.xtyle-bar__bar[data-si="0"][data-ci="1"]') as HTMLElement).dispatchEvent(
			new Event("click", { bubbles: true }),
		);
		expect(seen).toEqual([{ series: "Web", category: "Q2", value: 19, seriesIndex: 0, categoryIndex: 1 }]);
	});
});

describe("a mod reshapes the pie readout", () => {
	type Pie = HTMLElement & { data: { label: string; value: number }[] };

	function make(): Pie {
		const el = document.createElement("xtyle-pie") as Pie;
		document.body.appendChild(el);
		el.data = [
			{ label: "Direct", value: 70 },
			{ label: "Search", value: 30 },
		];
		return el;
	}

	it("keeps the mod's rows whole across successive hovers", () => {
		const el = make();
		hover(root(el).querySelector('.xtyle-pie__slice[data-i="0"]')!);
		expect(shown(el)!.dataset.tipRow).toBe("0");
		expect(intact(shown(el))).toBe(true);

		hover(root(el).querySelector('.xtyle-pie__slice[data-i="1"]')!);
		expect(shown(el)!.dataset.tipRow).toBe("1");
		expect(intact(shown(el))).toBe(true);
		expect(shown(el)!.querySelector(".modded-value")!.textContent).toBe("30 hits");
		expect(shown(el)!.querySelector(".modded-name")!.textContent).toBe("Search");
	});
});

describe("a mod reshapes the heatmap readout", () => {
	type Heatmap = HTMLElement & { values: number[][]; rows: string[]; cols: string[] };

	function make(attrs: Record<string, string> = {}): Heatmap {
		const el = document.createElement("xtyle-heatmap") as Heatmap;
		for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
		document.body.appendChild(el);
		el.rows = ["Mon", "Tue"];
		el.cols = ["AM", "PM"];
		el.values = [
			[1, 2],
			[3, 4],
		];
		return el;
	}

	it("keeps the mod's rows whole across successive hovers", () => {
		const el = make();
		hover(root(el).querySelector('.xtyle-heatmap__cell[data-r="0"][data-c="1"]')!);
		expect(shown(el)!.dataset.tipRow).toBe("0-1");
		expect(intact(shown(el))).toBe(true);
		expect(shown(el)!.querySelector(".modded-name")!.textContent).toBe("Mon/PM");

		hover(root(el).querySelector('.xtyle-heatmap__cell[data-r="1"][data-c="0"]')!);
		expect(shown(el)!.dataset.tipRow).toBe("1-0");
		expect(intact(shown(el))).toBe(true);
		expect(shown(el)!.querySelector(".modded-value")!.textContent).toBe("3 rpm");
		expect(root(el).querySelectorAll(".modded-swatch")).toHaveLength(4);
	});

	it("still fires select off the mod's own cells", () => {
		const el = make({ selectable: "" });
		const seen: unknown[] = [];
		el.addEventListener("select", (event) => seen.push((event as CustomEvent).detail));

		(root(el).querySelector('.xtyle-heatmap__cell[data-r="1"][data-c="1"]') as HTMLElement).dispatchEvent(
			new Event("click", { bubbles: true }),
		);
		expect(seen).toEqual([{ row: "Tue", col: "PM", value: 4, rowIndex: 1, colIndex: 1 }]);
	});
});
