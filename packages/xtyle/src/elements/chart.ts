import { XtyleElement, define, type StyleMode } from "./base.js";
import {
	chartHostCss,
	resolveChartPlot,
	type ChartSeries,
	type ChartScheme,
	type ChartVariant,
	type ChartCurve,
	type ChartXScale,
	type ChartPlot,
} from "../markup/chart.js";
import { seriesPalette, seriesColorsFor, resolvePalette, PALETTE_TOKENS, type Palette } from "../series.js";
import { FragmentHost } from "./fragment-host.js";
import { readLiveRegister } from "./live-register.js";
import { manifest, fragmentSources } from "./fragments/chart/source.generated.js";

export type { ChartSeries, ChartScheme, ChartVariant, ChartCurve, ChartXScale };

/** One series' readout at the cursor: the series name and the value of its nearest sample. */
export interface ChartSelectionPoint {
	series: string;
	value: number;
}

/** The `detail` of a `select` event: where the cursor sat, and what every series read there. */
export interface ChartSelection {
	/** The cursor's position in domain units: epoch ms on a time axis, the plain number on a linear one. */
	x: number;
	/** The cursor's position as the chart labels it. */
	label: string;
	/** The cursor's index along the chart's merged x positions. */
	index: number;
	points: ChartSelectionPoint[];
}

function parseJson<T>(raw: string | null): T | null {
	if (!raw) return null;
	try {
		return JSON.parse(raw) as T;
	} catch {
		return null;
	}
}

export class XtyleChart extends XtyleElement {
	protected override get styleMode(): StyleMode {
		return "auto";
	}

	protected override get resolvesThemeAtRuntime(): boolean {
		return true;
	}

	private seriesProp: ChartSeries[] | null = null;
	private schemeProp: ChartScheme | null = null;
	private cursor: number | null = null;
	private plotCache: ChartPlot | null = null;
	private clientX: { si: number; i: number; cx: number }[] = [];
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "chart", {
		applyIntent: () => {},
		afterApply: () => this.wireInteraction(),
	});

	static get observedAttributes(): string[] {
		return [
			"series",
			"scheme",
			"reverse",
			"variant",
			"curve",
			"markers",
			"x-scale",
			"window",
			"domain",
			"y-min",
			"y-max",
			"x-ticks",
			"y-ticks",
			"x-label",
			"y-label",
			"legend",
			"height",
			"label",
			"selectable",
		];
	}

	get series(): ChartSeries[] {
		return this.seriesProp ?? parseJson<ChartSeries[]>(this.getAttribute("series")) ?? [];
	}
	set series(value: ChartSeries[]) {
		this.seriesProp = value;
		if (this.root.firstChild) this.render();
	}

	get scheme(): ChartScheme {
		if (this.schemeProp) return this.schemeProp;
		const raw = this.getAttribute("scheme");
		if (!raw) return "accents";
		if (raw.startsWith("[")) return parseJson<string[]>(raw) ?? "accents";
		return raw as Palette;
	}
	set scheme(value: ChartScheme) {
		this.schemeProp = value;
		if (this.root.firstChild) this.render();
	}

	get variant(): ChartVariant {
		return this.getAttribute("variant") === "area" ? "area" : "line";
	}
	set variant(value: ChartVariant) {
		this.setAttribute("variant", value);
	}

	get curve(): ChartCurve {
		const raw = this.getAttribute("curve");
		return raw === "smooth" || raw === "step" ? raw : "linear";
	}
	set curve(value: ChartCurve) {
		this.setAttribute("curve", value);
	}

	get reverse(): boolean {
		return this.hasAttribute("reverse");
	}
	set reverse(value: boolean) {
		this.reflectBoolean("reverse", value);
	}

	get markers(): boolean {
		return this.hasAttribute("markers");
	}
	set markers(value: boolean) {
		this.reflectBoolean("markers", value);
	}

	get selectable(): boolean {
		return this.hasAttribute("selectable");
	}
	set selectable(value: boolean) {
		this.reflectBoolean("selectable", value);
	}

	attributeChangedCallback(name: string): void {
		if (name === "series") this.seriesProp = null;
		if (name === "scheme") this.schemeProp = null;
		this.cursor = null;
		if (this.root.firstChild) this.render();
	}

	private num(attr: string): number | undefined {
		const raw = this.getAttribute(attr);
		return raw !== null && raw !== "" && Number.isFinite(Number(raw)) ? Number(raw) : undefined;
	}

	/** Reads the palette's tokens off the live cascade, so the series colors track the applied theme. */
	private paletteRegister(): Record<string, string> {
		return readLiveRegister(this, PALETTE_TOKENS, () => {
			if (this.root.firstChild) this.render();
		});
	}

	private colors(items: readonly { tone?: string }[]): string[] {
		const scheme = this.scheme;
		if (Array.isArray(scheme)) return seriesPalette(scheme, items.length, {}, { reverse: this.reverse });
		const resolved = resolvePalette(scheme) ?? "accents";
		return seriesColorsFor(resolved, items, this.paletteRegister(), { reverse: this.reverse });
	}

	/** The series shaped onto the shared x domain. Recomputed per render and cached for the hover and
	 * keyboard paths, so the readout reads the same numbers the plot drew. */
	private plot(): ChartPlot {
		const xScaleRaw = this.getAttribute("x-scale");
		const xScale: ChartXScale = xScaleRaw === "time" || xScaleRaw === "linear" ? xScaleRaw : "auto";
		return resolveChartPlot(this.series, {
			xScale,
			window: this.num("window"),
			domain: parseJson<[number | string, number | string]>(this.getAttribute("domain")),
			now: Date.now(),
		});
	}

	private get bindings(): Record<string, unknown> {
		const plot = this.plot();
		this.plotCache = plot;
		const label = this.getAttribute("label");
		return {
			series: plot.series,
			colors: this.colors(this.series),
			variant: this.variant,
			curve: this.curve,
			markers: this.markers,
			xScale: plot.xScale,
			domainStart: plot.domainStart,
			domainEnd: plot.domainEnd,
			yMin: this.num("y-min"),
			yMax: this.num("y-max"),
			xTicks: this.num("x-ticks"),
			yTicks: this.num("y-ticks"),
			xLabel: this.getAttribute("x-label"),
			yLabel: this.getAttribute("y-label"),
			legend: this.getAttribute("legend") !== "false",
			height: this.num("height") ?? 320,
			title: label,
			ariaLabel: label,
			selectable: this.selectable,
		};
	}

	/** Every distinct x across all series, ascending: the positions the cursor can rest on. */
	private anchors(): number[] {
		const seen = new Set<number>();
		for (const s of this.plotCache?.series ?? []) for (const p of s.points) seen.add(p.x);
		return [...seen].sort((a, b) => a - b);
	}

	/** The chart's typical gap between cursor positions, for a series too sparse to have a cadence of its
	 * own (a lone sample). Without it, a one-point series would answer at every position on the axis. */
	private fallbackSpacing(anchors: number[]): number {
		if (anchors.length < 2) return 1;
		return ((anchors[anchors.length - 1] as number) - (anchors[0] as number)) / (anchors.length - 1);
	}

	/** The index of the sample each series reads at `anchor`, or -1 when its nearest sample is too far
	 * away to speak for that position — so a series that doesn't span the cursor stays silent rather than
	 * pinning its endpoint value to a moment it never covered. */
	private readAt(anchor: number, anchors: number[]): number[] {
		const fallback = this.fallbackSpacing(anchors);
		return (this.plotCache?.series ?? []).map((s) => {
			if (s.points.length === 0) return -1;
			let best = -1;
			let dist = Infinity;
			for (let i = 0; i < s.points.length; i++) {
				const d = Math.abs((s.points[i] as { x: number }).x - anchor);
				if (d < dist) {
					dist = d;
					best = i;
				}
			}
			const first = s.points[0] as { x: number };
			const last = s.points[s.points.length - 1] as { x: number };
			const spacing = s.points.length > 1 ? (last.x - first.x) / (s.points.length - 1) : fallback;
			return dist <= spacing * 0.75 ? best : -1;
		});
	}

	private wireInteraction(): void {
		const plotEl = this.root.querySelector<HTMLElement>(".xtyle-chart__plot");
		const svg = this.root.querySelector<SVGSVGElement>(".xtyle-chart__svg");
		const tooltip = this.root.querySelector<HTMLElement>(".xtyle-chart__tooltip");
		const guide = this.root.querySelector<SVGLineElement>(".xtyle-chart__guide");
		if (!plotEl || !svg || !tooltip) return;
		const anchors = this.anchors();
		if (anchors.length === 0) return;
		this.cursor = null;
		this.clientX = [];

		const dot = (si: number, i: number): SVGCircleElement | null =>
			this.root.querySelector<SVGCircleElement>(`.xtyle-chart__point[data-si="${si}"][data-i="${i}"]`);

		const clear = (): void => {
			for (const c of this.root.querySelectorAll<SVGCircleElement>(".xtyle-chart__point.is-active")) {
				c.classList.remove("is-active");
			}
		};

		const show = (index: number): void => {
			const anchor = anchors[index];
			if (anchor === undefined) return;
			this.cursor = index;
			const reads = this.readAt(anchor, anchors);
			clear();
			tooltip.hidden = false;
			let lead: SVGCircleElement | null = null;
			for (let si = 0; si < reads.length; si++) {
				const i = reads[si] as number;
				const row = tooltip.querySelector<HTMLElement>(`[data-tip-row="${si}"]`);
				const cell = tooltip.querySelector<HTMLElement>(`[data-tip-value="${si}"]`);
				const circle = i >= 0 ? dot(si, i) : null;
				if (row) row.hidden = i < 0;
				if (i < 0) continue;
				circle?.classList.add("is-active");
				if (cell) cell.textContent = circle?.dataset.value ?? String(this.plotCache?.series[si]?.points[i]?.value ?? "");
				lead ??= circle;
			}
			const xLabel = tooltip.querySelector<HTMLElement>("[data-tip-x]");
			if (xLabel) xLabel.textContent = lead?.dataset.xLabel ?? "";
			if (guide && lead) {
				const cx = lead.getAttribute("cx") ?? "0";
				guide.setAttribute("x1", cx);
				guide.setAttribute("x2", cx);
				guide.removeAttribute("hidden");
			}
			if (!lead) return;
			const plotBox = plotEl.getBoundingClientRect();
			const dotBox = lead.getBoundingClientRect();
			const left = dotBox.left + dotBox.width / 2 - plotBox.left;
			tooltip.style.left = `${Math.max(0, Math.min(plotBox.width, left))}px`;
			tooltip.style.top = `${dotBox.top - plotBox.top}px`;
		};

		const hide = (): void => {
			this.cursor = null;
			clear();
			tooltip.hidden = true;
			guide?.setAttribute("hidden", "hidden");
		};

		/** The client-space center of every drawn point, measured once per pointer entry: hit-testing reads
		 * the fill's own coordinates, so a mod that re-lays-out the plot keeps an accurate cursor. */
		const measure = (): void => {
			this.clientX = [];
			for (const c of this.root.querySelectorAll<SVGCircleElement>(".xtyle-chart__point")) {
				const box = c.getBoundingClientRect();
				this.clientX.push({
					si: Number(c.dataset.si),
					i: Number(c.dataset.i),
					cx: box.left + box.width / 2,
				});
			}
		};

		const nearest = (clientX: number): number => {
			let best = -1;
			let dist = Infinity;
			for (const entry of this.clientX) {
				const d = Math.abs(entry.cx - clientX);
				if (d < dist) {
					dist = d;
					best = anchors.indexOf(this.plotCache?.series[entry.si]?.points[entry.i]?.x ?? NaN);
				}
			}
			return best;
		};

		plotEl.addEventListener("pointerenter", measure);
		plotEl.addEventListener("pointermove", (event: PointerEvent) => {
			if (this.clientX.length === 0) measure();
			const index = nearest(event.clientX);
			if (index >= 0 && index !== this.cursor) show(index);
		});
		plotEl.addEventListener("pointerleave", hide);
		plotEl.addEventListener("focus", () => show(this.cursor ?? 0));
		plotEl.addEventListener("blur", hide);

		plotEl.addEventListener("keydown", (event: KeyboardEvent) => {
			const at = this.cursor ?? 0;
			switch (event.key) {
				case "ArrowRight":
					event.preventDefault();
					show(Math.min(anchors.length - 1, at + 1));
					return;
				case "ArrowLeft":
					event.preventDefault();
					show(Math.max(0, at - 1));
					return;
				case "Home":
					event.preventDefault();
					show(0);
					return;
				case "End":
					event.preventDefault();
					show(anchors.length - 1);
					return;
				case "Escape":
					hide();
					return;
				case "Enter":
				case " ":
					if (!this.selectable) return;
					event.preventDefault();
					this.emitSelect(anchors, this.cursor ?? 0);
					return;
				default:
			}
		});

		if (this.selectable) {
			plotEl.addEventListener("click", (event: MouseEvent) => {
				if (this.clientX.length === 0) measure();
				const index = nearest(event.clientX);
				if (index >= 0) this.emitSelect(anchors, index);
			});
		}
	}

	private emitSelect(anchors: number[], index: number): void {
		const anchor = anchors[index];
		const plot = this.plotCache;
		if (anchor === undefined || !plot) return;
		const reads = this.readAt(anchor, anchors);
		const points: ChartSelectionPoint[] = [];
		let lead: SVGCircleElement | null = null;
		for (let si = 0; si < reads.length; si++) {
			const i = reads[si] as number;
			if (i < 0) continue;
			const series = plot.series[si];
			const point = series?.points[i];
			if (!series || !point) continue;
			points.push({ series: series.name, value: point.value });
			lead ??= this.root.querySelector<SVGCircleElement>(`.xtyle-chart__point[data-si="${si}"][data-i="${i}"]`);
		}
		const detail: ChartSelection = {
			x: plot.domainStart + anchor * (plot.domainEnd - plot.domainStart),
			label: lead?.dataset.xLabel ?? "",
			index,
			points,
		};
		this.dispatchEvent(new CustomEvent("select", { bubbles: true, composed: true, detail }));
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(chartHostCss);
		this.fragment.update(this.bindings);
	}
}

define("xtyle-chart", XtyleChart);
