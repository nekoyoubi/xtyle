import { XtyleElement, define, escapeHtml, type StyleMode } from "./base.js";
import { barHostCss, type BarSeries, type BarScheme } from "../markup/index.js";
import { seriesPalette, seriesColorsFor, SERIES_SCHEMES, SERIES_TOKENS, type SeriesScheme } from "../series.js";
import { FragmentHost } from "./fragment-host.js";
import { readLiveRegister } from "./live-register.js";
import { manifest, fragmentSources } from "./fragments/bar/source.generated.js";

export type { BarSeries, BarScheme };

function parseJson<T>(raw: string | null): T | null {
	if (!raw) return null;
	try {
		return JSON.parse(raw) as T;
	} catch {
		return null;
	}
}

export class XtyleBar extends XtyleElement {
	protected override get styleMode(): StyleMode {
		return "auto";
	}

	private seriesProp: BarSeries[] | null = null;
	private categoriesProp: string[] | null = null;
	private schemeProp: BarScheme | null = null;
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "bar", {
		applyIntent: () => {},
		afterApply: () => this.wireInteraction(),
	});

	static get observedAttributes(): string[] {
		return ["series", "categories", "scheme", "reverse", "color-by", "orientation", "stacked", "show-values", "legend", "height", "label", "selectable"];
	}

	/** Which axis drives the palette. `auto` (default) colors by category for a single series so the
	 * scheme still varies, and by series once there's more than one. */
	private resolvedColorBy(): "series" | "category" {
		const raw = this.getAttribute("color-by");
		if (raw === "series" || raw === "category") return raw;
		return this.series.length <= 1 ? "category" : "series";
	}

	get series(): BarSeries[] {
		return this.seriesProp ?? parseJson<BarSeries[]>(this.getAttribute("series")) ?? [];
	}
	set series(value: BarSeries[]) {
		this.seriesProp = value;
		if (this.root.firstChild) this.render();
	}

	get categories(): string[] {
		return this.categoriesProp ?? parseJson<string[]>(this.getAttribute("categories")) ?? [];
	}
	set categories(value: string[]) {
		this.categoriesProp = value;
		if (this.root.firstChild) this.render();
	}

	get scheme(): BarScheme {
		if (this.schemeProp) return this.schemeProp;
		const raw = this.getAttribute("scheme");
		if (!raw) return "accents";
		if (raw.startsWith("[")) return parseJson<string[]>(raw) ?? "accents";
		return raw as SeriesScheme;
	}
	set scheme(value: BarScheme) {
		this.schemeProp = value;
		if (this.root.firstChild) this.render();
	}

	get reverse(): boolean {
		return this.hasAttribute("reverse");
	}
	set reverse(value: boolean) {
		this.reflectBoolean("reverse", value);
	}

	get stacked(): boolean {
		return this.hasAttribute("stacked");
	}
	set stacked(value: boolean) {
		this.reflectBoolean("stacked", value);
	}

	get selectable(): boolean {
		return this.hasAttribute("selectable");
	}
	set selectable(value: boolean) {
		this.reflectBoolean("selectable", value);
	}

	attributeChangedCallback(name: string): void {
		if (name === "series") this.seriesProp = null;
		if (name === "categories") this.categoriesProp = null;
		if (name === "scheme") this.schemeProp = null;
		if (this.root.firstChild) this.render();
	}

	/** Reads the schemes' tokens off the live cascade, so the palette tracks the applied theme. */
	private paletteRegister(): Record<string, string> {
		return readLiveRegister(this, SERIES_TOKENS, () => {
			if (this.root.firstChild) this.render();
		});
	}

	private colors(items: readonly { tone?: string }[]): string[] {
		const scheme = this.scheme;
		if (Array.isArray(scheme)) return seriesPalette(scheme, items.length, {}, { reverse: this.reverse });
		const resolved = SERIES_SCHEMES.includes(scheme) ? scheme : "accents";
		return seriesColorsFor(resolved, items, this.paletteRegister(), { reverse: this.reverse });
	}

	private get bindings(): Record<string, unknown> {
		const series = this.series;
		const colorBy = this.resolvedColorBy();
		const colorItems = colorBy === "category" ? this.categories.map(() => ({})) : series;
		return {
			series,
			categories: this.categories,
			colors: this.colors(colorItems),
			colorBy,
			orientation: this.getAttribute("orientation") === "horizontal" ? "horizontal" : "vertical",
			stacked: this.stacked,
			showValues: this.hasAttribute("show-values"),
			legend: this.getAttribute("legend") !== "false",
			height: this.getAttribute("height") ? Number(this.getAttribute("height")) : 320,
			title: this.getAttribute("label"),
			ariaLabel: this.getAttribute("label"),
			selectable: this.selectable,
		};
	}

	private wireInteraction(): void {
		const chart = this.root.querySelector<HTMLElement>(".xtyle-bar");
		const tooltip = this.root.querySelector<HTMLElement>(".xtyle-bar__tooltip");
		if (!chart || !tooltip) return;
		const bars = [...this.root.querySelectorAll<SVGRectElement>(".xtyle-bar__bar")];
		const series = this.series;
		const categories = this.categories;

		const show = (bar: SVGRectElement): void => {
			const si = Number(bar.dataset.si);
			const ci = Number(bar.dataset.ci);
			const name = series[si]?.name ?? "";
			const value = series[si]?.values[ci] ?? 0;
			const category = categories[ci] ?? "";
			tooltip.innerHTML = `<span class="xtyle-bar__tooltip-name">${escapeHtml(category)}${name ? ` · ${escapeHtml(name)}` : ""}</span> <span class="xtyle-bar__tooltip-value">${escapeHtml(String(value))}</span>`;
			const chartRect = chart.getBoundingClientRect();
			const barRect = bar.getBoundingClientRect();
			tooltip.style.left = `${barRect.left + barRect.width / 2 - chartRect.left}px`;
			tooltip.style.top = `${barRect.top - chartRect.top}px`;
			tooltip.hidden = false;
			chart.classList.add("xtyle-bar--hovering");
			for (const b of bars) b.classList.toggle("is-active", b === bar);
		};
		const hide = (): void => {
			tooltip.hidden = true;
			chart.classList.remove("xtyle-bar--hovering");
			for (const b of bars) b.classList.remove("is-active");
		};

		for (const bar of bars) {
			bar.addEventListener("pointerenter", () => show(bar));
			bar.addEventListener("focus", () => show(bar));
			bar.addEventListener("pointerleave", hide);
			bar.addEventListener("blur", hide);
		}

		if (!this.selectable) return;
		const emitSelect = (bar: SVGRectElement): void => {
			const si = Number(bar.dataset.si);
			const ci = Number(bar.dataset.ci);
			this.dispatchEvent(
				new CustomEvent("select", {
					bubbles: true,
					composed: true,
					detail: {
						series: series[si]?.name ?? "",
						category: categories[ci] ?? "",
						value: series[si]?.values[ci] ?? 0,
						seriesIndex: si,
						categoryIndex: ci,
					},
				}),
			);
		};
		for (const bar of bars) {
			bar.addEventListener("click", () => emitSelect(bar));
			bar.addEventListener("keydown", (event) => {
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					emitSelect(bar);
				}
			});
		}
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(barHostCss);
		this.fragment.update(this.bindings);
	}
}

define("xtyle-bar", XtyleBar);
