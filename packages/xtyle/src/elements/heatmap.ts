import { XtyleElement, define, type StyleMode } from "./base.js";
import { heatmapHostCss, type HeatmapScheme } from "../markup/index.js";
import {
	rampColor,
	glowFilter,
	categoricalHeatColors,
	categoricalLegend,
	matrixCeiling,
	GLOW_MAX_BLUR,
	PALETTE_TOKENS,
	type Palette,
} from "../series.js";
import { FragmentHost } from "./fragment-host.js";
import { readLiveRegister } from "./live-register.js";
import { manifest, fragmentSources } from "./fragments/heatmap/source.generated.js";

export type { HeatmapScheme };

function parseJson<T>(raw: string | null): T | null {
	if (!raw) return null;
	try {
		return JSON.parse(raw) as T;
	} catch {
		return null;
	}
}

export class XtyleHeatmap extends XtyleElement {
	protected override get styleMode(): StyleMode {
		return "auto";
	}

	protected override get resolvesThemeAtRuntime(): boolean {
		return true;
	}

	private valuesProp: number[][] | null = null;
	private glowProp: number[][] | null = null;
	private rowsProp: string[] | null = null;
	private colsProp: string[] | null = null;
	private currentProp: number[][] | null = null;
	private titlesProp: string[][] | null = null;
	private schemeProp: HeatmapScheme | null = null;
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "heatmap", {
		applyIntent: () => {},
		afterApply: () => this.wireInteraction(),
	});

	static get observedAttributes(): string[] {
		return ["values", "glow", "rows", "cols", "current", "current-tone", "current-pulse", "titles", "scheme", "reverse", "max", "glow-max", "glow-blur", "glow-label", "scale", "show-values", "selectable", "categorical", "category-axis", "label"];
	}

	get values(): number[][] {
		return this.valuesProp ?? parseJson<number[][]>(this.getAttribute("values")) ?? [];
	}
	set values(value: number[][]) {
		this.valuesProp = value;
		if (this.root.firstChild) this.render();
	}

	get glow(): number[][] {
		return this.glowProp ?? parseJson<number[][]>(this.getAttribute("glow")) ?? [];
	}
	set glow(value: number[][]) {
		this.glowProp = value;
		if (this.root.firstChild) this.render();
	}

	get rows(): string[] {
		return this.rowsProp ?? parseJson<string[]>(this.getAttribute("rows")) ?? [];
	}
	set rows(value: string[]) {
		this.rowsProp = value;
		if (this.root.firstChild) this.render();
	}

	get cols(): string[] {
		return this.colsProp ?? parseJson<string[]>(this.getAttribute("cols")) ?? [];
	}
	set cols(value: string[]) {
		this.colsProp = value;
		if (this.root.firstChild) this.render();
	}

	get current(): number[][] {
		return this.currentProp ?? parseJson<number[][]>(this.getAttribute("current")) ?? [];
	}
	set current(value: number[][]) {
		this.currentProp = value;
		if (this.root.firstChild) this.render();
	}

	get titles(): string[][] {
		return this.titlesProp ?? parseJson<string[][]>(this.getAttribute("titles")) ?? [];
	}
	set titles(value: string[][]) {
		this.titlesProp = value;
		if (this.root.firstChild) this.render();
	}

	get scheme(): HeatmapScheme {
		if (this.schemeProp) return this.schemeProp;
		const fallback: Palette = this.categorical ? "accents" : "intensity";
		const raw = this.getAttribute("scheme");
		if (!raw) return fallback;
		if (raw.startsWith("[")) return parseJson<string[]>(raw) ?? fallback;
		return raw as Palette;
	}
	set scheme(value: HeatmapScheme) {
		this.schemeProp = value;
		if (this.root.firstChild) this.render();
	}

	get reverse(): boolean {
		return this.hasAttribute("reverse");
	}
	set reverse(value: boolean) {
		this.reflectBoolean("reverse", value);
	}

	get selectable(): boolean {
		return this.hasAttribute("selectable");
	}
	set selectable(value: boolean) {
		this.reflectBoolean("selectable", value);
	}

	get scale(): boolean {
		return this.hasAttribute("scale");
	}
	set scale(value: boolean) {
		this.reflectBoolean("scale", value);
	}

	get categorical(): boolean {
		return this.hasAttribute("categorical");
	}
	set categorical(value: boolean) {
		this.reflectBoolean("categorical", value);
	}

	get categoryAxis(): "col" | "row" {
		return this.getAttribute("category-axis") === "row" ? "row" : "col";
	}
	set categoryAxis(value: "col" | "row") {
		this.setAttribute("category-axis", value);
	}

	attributeChangedCallback(name: string): void {
		if (name === "values") this.valuesProp = null;
		if (name === "glow") this.glowProp = null;
		if (name === "rows") this.rowsProp = null;
		if (name === "cols") this.colsProp = null;
		if (name === "current") this.currentProp = null;
		if (name === "titles") this.titlesProp = null;
		if (name === "scheme") this.schemeProp = null;
		if (this.root.firstChild) this.render();
	}

	/** Reads the palette stop tokens off the live cascade, so the scale tracks the theme. */
	private paletteRegister(): Record<string, string> {
		return readLiveRegister(this, PALETTE_TOKENS, () => {
			if (this.root.firstChild) this.render();
		});
	}

	private ceiling(attr: string, matrix: number[][]): number {
		const raw = this.getAttribute(attr);
		const explicit = raw ? Number(raw) : NaN;
		return matrixCeiling(matrix, Number.isFinite(explicit) ? explicit : undefined);
	}

	/** A categorical grid's per-category hues plus each cell's fill (surface → its category hue by
	 * value); the intensity-ramp sibling is {@link rampCellColors}. */
	private categoricalPalette(values: number[][]): { cellColors: string[][]; hues: string[] } {
		return categoricalHeatColors(this.scheme, values, this.paletteRegister(), {
			axis: this.categoryAxis,
			reverse: this.reverse,
			max: this.ceiling("max", values),
		});
	}

	private rampCellColors(values: number[][]): string[][] {
		const register = this.paletteRegister();
		const scheme = this.scheme;
		const reverse = this.reverse;
		const max = this.ceiling("max", values);
		return values.map((row) => row.map((v) => rampColor(scheme, (Number.isFinite(v) ? v : 0) / max, register, { reverse })));
	}

	/** The per-cell drop-shadow for the optional second (glow) intensity channel; each entry is a
	 * `filter` value or null. The halo takes the ramp's hot end, or (categorical) its cell's own
	 * category hue, so the second channel stays color-coherent with the fill. */
	private cellGlows(glow: number[][], hues: string[] | null): (string | null)[][] {
		if (!glow.length) return [];
		const max = this.ceiling("glow-max", glow);
		const rawBlur = Number(this.getAttribute("glow-blur"));
		const maxBlur = Number.isFinite(rawBlur) && rawBlur > 0 ? rawBlur : GLOW_MAX_BLUR;
		if (hues) {
			const axis = this.categoryAxis;
			return glow.map((row, r) =>
				row.map((v, c) => glowFilter((Number.isFinite(v) ? v : 0) / max, hues[axis === "col" ? c : r] ?? "currentColor", maxBlur)),
			);
		}
		const color = rampColor(this.scheme, 1, this.paletteRegister(), { reverse: this.reverse });
		return glow.map((row) => row.map((v) => glowFilter((Number.isFinite(v) ? v : 0) / max, color, maxBlur)));
	}

	/** The noun naming the glow metric, so its value reaches the accessible name and readout; only
	 * present when there's a glow channel, defaulting to "glow" when the consumer doesn't name it. */
	private glowLabel(glow: number[][]): string | null {
		return glow.length ? this.getAttribute("glow-label") || "glow" : null;
	}

	/** Resolves off the live cascade (vs the SSR-baked `resolveHeatmapScale`), so the key color-matches
	 * the cells when a custom palette is active. */
	private scaleKey(values: number[][]): { scaleColors: string[]; scaleLow: number; scaleHigh: number } {
		const register = this.paletteRegister();
		const reverse = this.reverse;
		const scheme = this.scheme;
		const scaleColors = [0, 0.25, 0.5, 0.75, 1].map((t) => rampColor(scheme, t, register, { reverse }));
		return { scaleColors, scaleLow: 0, scaleHigh: this.ceiling("max", values) };
	}

	/** The categorical key: one swatch per category hue, labeled off the category axis. */
	private legendKey(hues: string[]): { legend: { color: string; label: string }[] } {
		return { legend: categoricalLegend(hues, this.categoryAxis === "row" ? this.rows : this.cols) };
	}

	private get bindings(): Record<string, unknown> {
		const values = this.values;
		const glow = this.glow;
		const scale = this.scale;
		const palette = this.categorical ? this.categoricalPalette(values) : null;
		const key = scale ? (palette ? this.legendKey(palette.hues) : this.scaleKey(values)) : {};
		return {
			values,
			rows: this.rows,
			cols: this.cols,
			cellColors: palette ? palette.cellColors : this.rampCellColors(values),
			cellGlows: this.cellGlows(glow, palette?.hues ?? null),
			glowValues: glow,
			glowLabel: this.glowLabel(glow),
			current: this.current,
			currentTone: this.getAttribute("current-tone"),
			currentPulse: this.hasAttribute("current-pulse"),
			titles: this.titles,
			scale,
			...key,
			showValues: this.hasAttribute("show-values"),
			selectable: this.selectable,
			title: this.getAttribute("label"),
			ariaLabel: this.getAttribute("label"),
		};
	}

	private wireInteraction(): void {
		const chart = this.root.querySelector<HTMLElement>(".xtyle-heatmap");
		const tooltip = this.root.querySelector<HTMLElement>(".xtyle-heatmap__tooltip");
		if (!chart || !tooltip) return;
		const cells = [...this.root.querySelectorAll<SVGRectElement>(".xtyle-heatmap__cell")];
		const tipRows = [...tooltip.querySelectorAll<HTMLElement>("[data-tip-row]")];
		const values = this.values;
		const rows = this.rows;
		const cols = this.cols;

		/** The readout is the fill's markup: the host reveals the hovered cell's row and places the box
		 * against the cell's own drawn geometry, and writes nothing into it. */
		const show = (cell: SVGRectElement): void => {
			const key = `${cell.dataset.r}-${cell.dataset.c}`;
			for (const row of tipRows) row.hidden = row.dataset.tipRow !== key;
			const chartRect = chart.getBoundingClientRect();
			const cellRect = cell.getBoundingClientRect();
			tooltip.style.left = `${cellRect.left + cellRect.width / 2 - chartRect.left}px`;
			tooltip.style.top = `${cellRect.top - chartRect.top}px`;
			tooltip.hidden = false;
			chart.classList.add("xtyle-heatmap--hovering");
			for (const other of cells) other.classList.toggle("is-active", other === cell);
		};
		const hide = (): void => {
			tooltip.hidden = true;
			chart.classList.remove("xtyle-heatmap--hovering");
			for (const other of cells) other.classList.remove("is-active");
		};

		for (const cell of cells) {
			cell.addEventListener("pointerenter", () => show(cell));
			cell.addEventListener("focus", () => show(cell));
			cell.addEventListener("pointerleave", hide);
			cell.addEventListener("blur", hide);
		}

		if (!this.selectable) return;
		const emitSelect = (cell: SVGRectElement): void => {
			const r = Number(cell.dataset.r);
			const c = Number(cell.dataset.c);
			this.dispatchEvent(
				new CustomEvent("select", {
					bubbles: true,
					composed: true,
					detail: {
						row: rows[r] ?? "",
						col: cols[c] ?? "",
						value: values[r]?.[c] ?? 0,
						rowIndex: r,
						colIndex: c,
					},
				}),
			);
		};
		for (const cell of cells) {
			cell.addEventListener("click", () => emitSelect(cell));
			cell.addEventListener("keydown", (event) => {
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					emitSelect(cell);
				}
			});
		}
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(heatmapHostCss);
		this.fragment.update(this.bindings);
	}
}

define("xtyle-heatmap", XtyleHeatmap);
