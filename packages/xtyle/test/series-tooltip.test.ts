// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import "../src/elements/bar.js";
import "../src/elements/pie.js";
import "../src/elements/heatmap.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { manifest as barManifest, fragmentSources as barSources } from "../src/elements/fragments/bar/source.generated.js";
import { manifest as pieManifest, fragmentSources as pieSources } from "../src/elements/fragments/pie/source.generated.js";
import { manifest as heatmapManifest, fragmentSources as heatmapSources } from "../src/elements/fragments/heatmap/source.generated.js";

/**
 * The hover readout is the fill's markup: every row is drawn up front and the element only reveals the one
 * under the cursor. These hold the built-in fill to the shape that makes that possible — a row per datum,
 * all hidden until a hover, addressed by `data-tip-row` — and to escaping the consumer's strings on the way
 * in, which is where the readout used to be written (as `innerHTML`) by the element on every hover.
 */
beforeAll(async () => {
	await Promise.all([
		loadFill(barManifest, barSources),
		loadFill(pieManifest, pieSources),
		loadFill(heatmapManifest, heatmapSources),
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

function leave(node: Element): void {
	node.dispatchEvent(new Event("pointerleave", { bubbles: false }));
}

function tooltip(el: HTMLElement, id: string): HTMLElement {
	return root(el).querySelector<HTMLElement>(`.xtyle-${id}__tooltip`) as HTMLElement;
}

function shownRow(el: HTMLElement, id: string): HTMLElement | null {
	return [...tooltip(el, id).querySelectorAll<HTMLElement>("[data-tip-row]")].filter((row) => !row.hidden)[0] ?? null;
}

const text = (node: Element | null): string => (node?.textContent ?? "").replace(/\s+/g, " ").trim();

describe("bar readout", () => {
	type Bar = HTMLElement & { series: { name: string; values: number[] }[]; categories: string[] };

	function make(attrs: Record<string, string> = {}): Bar {
		const el = document.createElement("xtyle-bar") as Bar;
		for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
		document.body.appendChild(el);
		el.categories = ["Q1", "Q2", "Q3"];
		el.series = [
			{ name: "Web", values: [12, 19, 15] },
			{ name: "Mobile", values: [8, 14, 18] },
		];
		return el;
	}

	it("draws one hidden row per bar, and reveals only the hovered one", () => {
		const el = make({ label: "Revenue" });
		const rows = tooltip(el, "bar").querySelectorAll<HTMLElement>("[data-tip-row]");
		expect(rows).toHaveLength(6);
		expect([...rows].every((row) => row.hidden)).toBe(true);
		expect(tooltip(el, "bar").hidden).toBe(true);

		const bar = root(el).querySelector('.xtyle-bar__bar[data-si="1"][data-ci="2"]')!;
		hover(bar);
		expect(tooltip(el, "bar").hidden).toBe(false);
		expect(shownRow(el, "bar")!.dataset.tipRow).toBe("1-2");
		expect(text(shownRow(el, "bar"))).toBe("Q3 · Mobile 18");
	});

	it("swaps the revealed row on the next hover, and hides them all on leave", () => {
		const el = make();
		const first = root(el).querySelector('.xtyle-bar__bar[data-si="0"][data-ci="0"]')!;
		const second = root(el).querySelector('.xtyle-bar__bar[data-si="0"][data-ci="1"]')!;

		hover(first);
		expect(text(shownRow(el, "bar"))).toBe("Q1 · Web 12");
		hover(second);
		expect(shownRow(el, "bar")!.dataset.tipRow).toBe("0-1");
		expect(text(shownRow(el, "bar"))).toBe("Q2 · Web 19");

		leave(second);
		expect(tooltip(el, "bar").hidden).toBe(true);
	});

	it("escapes a hostile category instead of parsing it as markup", () => {
		const el = make();
		el.categories = ['<img src=x onerror="alert(1)">', "Q2", "Q3"];
		const bar = root(el).querySelector('.xtyle-bar__bar[data-si="0"][data-ci="0"]')!;
		hover(bar);

		expect(tooltip(el, "bar").querySelector("img")).toBeNull();
		expect(text(shownRow(el, "bar"))).toContain('<img src=x onerror="alert(1)">');
	});
});

describe("pie readout", () => {
	type Pie = HTMLElement & { data: { label: string; value: number }[] };

	function make(attrs: Record<string, string> = {}): Pie {
		const el = document.createElement("xtyle-pie") as Pie;
		for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
		document.body.appendChild(el);
		el.data = [
			{ label: "Direct", value: 70 },
			{ label: "Search", value: 30 },
		];
		return el;
	}

	it("draws one hidden row per slice, and reveals only the hovered one", () => {
		const el = make({ label: "Traffic" });
		expect(tooltip(el, "pie").querySelectorAll("[data-tip-row]")).toHaveLength(2);
		expect(shownRow(el, "pie")).toBeNull();

		const slice = root(el).querySelector('.xtyle-pie__slice[data-i="1"]')!;
		hover(slice);
		expect(tooltip(el, "pie").hidden).toBe(false);
		expect(text(shownRow(el, "pie"))).toBe("Search 30 · 30%");

		leave(slice);
		expect(tooltip(el, "pie").hidden).toBe(true);
	});

	it("escapes a hostile slice label instead of parsing it as markup", () => {
		const el = make();
		el.data = [{ label: '<img src=x onerror="alert(1)">', value: 5 }];
		hover(root(el).querySelector('.xtyle-pie__slice[data-i="0"]')!);

		expect(tooltip(el, "pie").querySelector("img")).toBeNull();
		expect(text(shownRow(el, "pie"))).toContain('<img src=x onerror="alert(1)">');
	});
});

describe("heatmap readout", () => {
	type Heatmap = HTMLElement & {
		values: number[][];
		rows: string[];
		cols: string[];
		glow: number[][];
		titles: string[][];
	};

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

	it("draws one hidden row per cell, and reveals only the hovered one", () => {
		const el = make({ label: "Load" });
		expect(tooltip(el, "heatmap").querySelectorAll("[data-tip-row]")).toHaveLength(4);
		expect(shownRow(el, "heatmap")).toBeNull();

		const cell = root(el).querySelector('.xtyle-heatmap__cell[data-r="1"][data-c="0"]')!;
		hover(cell);
		expect(shownRow(el, "heatmap")!.dataset.tipRow).toBe("1-0");
		expect(text(shownRow(el, "heatmap"))).toBe("Tue · AM 3");

		leave(cell);
		expect(tooltip(el, "heatmap").hidden).toBe(true);
	});

	it("carries the glow channel and a cell's own title into the row", () => {
		const el = make({ "glow-label": "hits" });
		el.glow = [
			[5, 6],
			[7, 8],
		];
		hover(root(el).querySelector('.xtyle-heatmap__cell[data-r="1"][data-c="1"]')!);
		expect(text(shownRow(el, "heatmap"))).toBe("Tue · PM 4 · hits 8");

		el.titles = [
			["", ""],
			["", "everything, all at once"],
		];
		hover(root(el).querySelector('.xtyle-heatmap__cell[data-r="1"][data-c="1"]')!);
		expect(text(shownRow(el, "heatmap"))).toBe("everything, all at once");
	});

	it("escapes a hostile row label instead of parsing it as markup", () => {
		const el = make();
		el.rows = ['<img src=x onerror="alert(1)">', "Tue"];
		hover(root(el).querySelector('.xtyle-heatmap__cell[data-r="0"][data-c="0"]')!);

		expect(tooltip(el, "heatmap").querySelector("img")).toBeNull();
		expect(text(shownRow(el, "heatmap"))).toContain('<img src=x onerror="alert(1)">');
	});
});
