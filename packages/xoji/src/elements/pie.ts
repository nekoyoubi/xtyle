import { XojiElement, define, escapeHtml, type StyleMode } from "./base.js";
import { pieHostCss, type PieDatum, type PieScheme, type PieVariant } from "../markup/index.js";
import { seriesPalette, seriesColorsFor, SERIES_SCHEMES, SERIES_TOKENS, type SeriesScheme } from "../series.js";
import { FragmentHost } from "./fragment-host.js";
import { readLiveRegister } from "./live-register.js";
import { manifest, fragmentSources } from "./fragments/pie/source.generated.js";

export type { PieDatum, PieScheme, PieVariant };

function parseJson<T>(raw: string | null): T | null {
	if (!raw) return null;
	try {
		return JSON.parse(raw) as T;
	} catch {
		return null;
	}
}

export class XojiPie extends XojiElement {
	protected override get styleMode(): StyleMode {
		return "auto";
	}

	private dataProp: PieDatum[] | null = null;
	private schemeProp: PieScheme | null = null;
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "pie", {
		applyIntent: () => {},
		afterApply: () => this.wireInteraction(),
	});

	static get observedAttributes(): string[] {
		return ["data", "scheme", "reverse", "variant", "show-values", "legend", "size", "label"];
	}

	get data(): PieDatum[] {
		return this.dataProp ?? parseJson<PieDatum[]>(this.getAttribute("data")) ?? [];
	}
	set data(value: PieDatum[]) {
		this.dataProp = value;
		if (this.root.firstChild) this.render();
	}

	get scheme(): PieScheme {
		if (this.schemeProp) return this.schemeProp;
		const raw = this.getAttribute("scheme");
		if (!raw) return "skittles";
		if (raw.startsWith("[")) return parseJson<string[]>(raw) ?? "skittles";
		return raw as SeriesScheme;
	}
	set scheme(value: PieScheme) {
		this.schemeProp = value;
		if (this.root.firstChild) this.render();
	}

	get variant(): PieVariant {
		return this.getAttribute("variant") === "donut" ? "donut" : "pie";
	}
	set variant(value: PieVariant) {
		this.setAttribute("variant", value);
	}

	get reverse(): boolean {
		return this.hasAttribute("reverse");
	}
	set reverse(value: boolean) {
		this.reflectBoolean("reverse", value);
	}

	attributeChangedCallback(name: string): void {
		if (name === "data") this.dataProp = null;
		if (name === "scheme") this.schemeProp = null;
		if (this.root.firstChild) this.render();
	}

	private paletteRegister(): Record<string, string> {
		return readLiveRegister(this, SERIES_TOKENS, () => {
			if (this.root.firstChild) this.render();
		});
	}

	private colors(items: readonly PieDatum[]): string[] {
		const scheme = this.scheme;
		if (Array.isArray(scheme)) return seriesPalette(scheme, items.length, {}, { reverse: this.reverse });
		const resolved = SERIES_SCHEMES.includes(scheme) ? scheme : "skittles";
		return seriesColorsFor(resolved, items, this.paletteRegister(), { reverse: this.reverse });
	}

	private get bindings(): Record<string, unknown> {
		const data = this.data.filter((d) => Number(d.value) > 0);
		return {
			data,
			colors: this.colors(data),
			variant: this.variant,
			showValues: this.hasAttribute("show-values"),
			legend: this.getAttribute("legend") !== "false",
			size: this.getAttribute("size") ? Number(this.getAttribute("size")) : 200,
			title: this.getAttribute("label"),
			ariaLabel: this.getAttribute("label"),
		};
	}

	private wireInteraction(): void {
		const chart = this.root.querySelector<HTMLElement>(".xoji-pie");
		const tooltip = this.root.querySelector<HTMLElement>(".xoji-pie__tooltip");
		if (!chart || !tooltip) return;
		const slices = [...this.root.querySelectorAll<SVGElement>(".xoji-pie__slice")];
		const data = this.data.filter((d) => Number(d.value) > 0);
		const total = data.reduce((sum, d) => sum + Number(d.value), 0) || 1;

		const show = (slice: SVGElement): void => {
			const i = Number(slice.dataset.i);
			const d = data[i];
			if (!d) return;
			const percent = Math.round((Number(d.value) / total) * 100);
			tooltip.innerHTML = `<span class="xoji-pie__tooltip-name">${escapeHtml(d.label)}</span> <span class="xoji-pie__tooltip-value">${escapeHtml(String(d.value))} · ${percent}%</span>`;
			const chartRect = chart.getBoundingClientRect();
			const sliceRect = slice.getBoundingClientRect();
			tooltip.style.left = `${sliceRect.left + sliceRect.width / 2 - chartRect.left}px`;
			tooltip.style.top = `${sliceRect.top - chartRect.top}px`;
			tooltip.hidden = false;
			chart.classList.add("xoji-pie--hovering");
			for (const s of slices) s.classList.toggle("is-active", s === slice);
		};
		const hide = (): void => {
			tooltip.hidden = true;
			chart.classList.remove("xoji-pie--hovering");
			for (const s of slices) s.classList.remove("is-active");
		};

		for (const slice of slices) {
			slice.addEventListener("pointerenter", () => show(slice));
			slice.addEventListener("focus", () => show(slice));
			slice.addEventListener("pointerleave", hide);
			slice.addEventListener("blur", hide);
		}
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(pieHostCss);
		this.fragment.update(this.bindings);
	}
}

define("xoji-pie", XojiPie);
