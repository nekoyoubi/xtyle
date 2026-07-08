import { XtyleElement, define, type StyleMode } from "./base.js";
import {
	sparklineHostCss,
	resolveSparklineBounds,
	type SparklineVariant,
	type SparklineTone,
	type SparklineBounds,
} from "../markup/index.js";
import { FragmentHost } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/sparkline/source.generated.js";
import { windowedPlot, type TimeSample } from "../timeseries.js";

export type { SparklineVariant, SparklineTone, SparklineBounds };

const VW = 100;
const PAD = 3;

function parseValues(raw: string | null): number[] {
	if (!raw) return [];
	try {
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed.map(Number) : [];
	} catch {
		return raw
			.split(",")
			.map((s) => Number(s.trim()))
			.filter((n) => Number.isFinite(n));
	}
}

function parseJson<T>(raw: string | null): T | null {
	if (!raw) return null;
	try {
		return JSON.parse(raw) as T;
	} catch {
		return null;
	}
}

export class XtyleSparkline extends XtyleElement {
	protected override get styleMode(): StyleMode {
		return "auto";
	}

	private valuesProp: number[] | null = null;
	private pointsProp: TimeSample[] | null = null;
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "sparkline", {
		applyIntent: () => {},
		afterApply: () => this.wireInteraction(),
	});

	static get observedAttributes(): string[] {
		return ["values", "points", "window", "domain", "step", "variant", "tone", "show-end", "min", "max", "bounds", "label"];
	}

	get values(): number[] {
		return this.valuesProp ?? parseValues(this.getAttribute("values"));
	}
	set values(value: number[]) {
		this.valuesProp = value;
		if (this.root.firstChild) this.render();
	}

	get points(): TimeSample[] {
		return this.pointsProp ?? parseJson<TimeSample[]>(this.getAttribute("points")) ?? [];
	}
	set points(value: TimeSample[]) {
		this.pointsProp = value;
		if (this.root.firstChild) this.render();
	}

	get variant(): SparklineVariant {
		return (this.getAttribute("variant") as SparklineVariant) ?? "line";
	}
	set variant(value: SparklineVariant) {
		this.setAttribute("variant", value);
	}

	get tone(): SparklineTone {
		return (this.getAttribute("tone") as SparklineTone) ?? "accent";
	}
	set tone(value: SparklineTone) {
		this.setAttribute("tone", value);
	}

	get bounds(): SparklineBounds | undefined {
		const raw = this.getAttribute("bounds");
		return raw === "percent" || raw === "unit" || raw === "duration" ? raw : undefined;
	}
	set bounds(value: SparklineBounds | undefined) {
		if (value) this.setAttribute("bounds", value);
		else this.removeAttribute("bounds");
	}

	attributeChangedCallback(name: string): void {
		if (name === "values") this.valuesProp = null;
		if (name === "points") this.pointsProp = null;
		if (this.root.firstChild) this.render();
	}

	private num(attr: string): number | undefined {
		const raw = this.getAttribute(attr);
		return raw !== null && raw !== "" ? Number(raw) : undefined;
	}

	/** The time-windowed plot for `points` mode (samples placed by time against the live clock), or
	 * `null` in plain `values` mode. Delegates the window math to the shared `windowedPlot` primitive. */
	private plot(): { x: number; value: number }[] | null {
		const points = this.points;
		if (points.length === 0) return null;
		return windowedPlot(points, {
			window: this.num("window"),
			domain: parseJson<[number | string, number | string]>(this.getAttribute("domain")),
			now: Date.now(),
		});
	}

	/** Effective `{ min, max }` for the current data: an explicit `min`/`max` attribute wins, else the
	 * `bounds` kind picks a range. Computed once and shared by the render bindings and the marker math
	 * so the plotted shape and the hover guide read the same scale. */
	private resolvedBounds(values: number[]): { min?: number; max?: number } {
		return resolveSparklineBounds(values, { bounds: this.bounds, min: this.num("min"), max: this.num("max") });
	}

	private get bindings(): Record<string, unknown> {
		const plot = this.plot();
		const values = plot ? plot.map((p) => p.value) : this.values;
		const bounds = this.resolvedBounds(values);
		return {
			...(plot ? { plot } : { values }),
			variant: this.variant,
			tone: this.tone,
			showEnd: this.getAttribute("show-end") !== "false",
			step: this.hasAttribute("step"),
			min: bounds.min,
			max: bounds.max,
			label: this.getAttribute("label"),
		};
	}

	private wireInteraction(): void {
		const spark = this.root.querySelector<HTMLElement>(".xtyle-sparkline");
		const svg = this.root.querySelector<SVGSVGElement>(".xtyle-sparkline__svg");
		const marker = this.root.querySelector<SVGGElement>(".xtyle-sparkline__marker");
		const tooltip = this.root.querySelector<HTMLElement>(".xtyle-sparkline__tooltip");
		if (!spark || !svg || !marker || !tooltip) return;
		const plot = this.plot();
		const values = plot ? plot.map((p) => p.value) : this.values;
		if (values.length === 0) return;
		const xs = plot ? plot.map((p) => p.x) : null;
		const guide = marker.querySelector<SVGLineElement>(".xtyle-sparkline__guide");
		const dot = marker.querySelector<SVGCircleElement>(".xtyle-sparkline__dot");
		const bounds = this.resolvedBounds(values);
		const lo = bounds.min ?? Math.min(...values);
		const hi = bounds.max ?? Math.max(...values);
		const span = hi - lo || 1;
		const innerW = VW - PAD * 2;

		const move = (event: PointerEvent): void => {
			const box = svg.getBoundingClientRect();
			const frac = box.width > 0 ? (event.clientX - box.left) / box.width : 0;
			let i: number;
			if (xs) {
				const target = Math.max(0, Math.min(1, frac));
				i = 0;
				let best = Infinity;
				for (let k = 0; k < xs.length; k++) {
					const d = Math.abs((xs[k] as number) - target);
					if (d < best) {
						best = d;
						i = k;
					}
				}
			} else {
				i = Math.max(0, Math.min(values.length - 1, Math.round(frac * (values.length - 1))));
			}
			const nx = xs ? (xs[i] as number) : values.length <= 1 ? 0.5 : i / (values.length - 1);
			const vx = PAD + nx * innerW;
			const vy = PAD + (1 - ((values[i] as number) - lo) / span) * (32 - PAD * 2);
			guide?.setAttribute("x1", String(vx));
			guide?.setAttribute("x2", String(vx));
			dot?.setAttribute("cx", String(vx));
			dot?.setAttribute("cy", String(vy));
			marker.removeAttribute("hidden");
			tooltip.textContent = String(values[i]);
			const sparkBox = spark.getBoundingClientRect();
			tooltip.style.left = `${(vx / VW) * sparkBox.width}px`;
			tooltip.style.top = `${(vy / 32) * sparkBox.height}px`;
			tooltip.hidden = false;
		};
		const leave = (): void => {
			marker.setAttribute("hidden", "hidden");
			tooltip.hidden = true;
		};
		svg.addEventListener("pointermove", move);
		svg.addEventListener("pointerleave", leave);
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(sparklineHostCss);
		this.fragment.update(this.bindings);
	}
}

define("xtyle-sparkline", XtyleSparkline);
