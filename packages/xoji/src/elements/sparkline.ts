import { XojiElement, define, type StyleMode } from "./base.js";
import { sparklineHostCss, type SparklineVariant, type SparklineTone } from "../markup/index.js";
import { FragmentHost } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/sparkline/source.generated.js";

export type { SparklineVariant, SparklineTone };

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

export class XojiSparkline extends XojiElement {
	protected override get styleMode(): StyleMode {
		return "auto";
	}

	private valuesProp: number[] | null = null;
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "sparkline", {
		applyIntent: () => {},
		afterApply: () => this.wireInteraction(),
	});

	static get observedAttributes(): string[] {
		return ["values", "variant", "tone", "show-end", "min", "max", "label"];
	}

	get values(): number[] {
		return this.valuesProp ?? parseValues(this.getAttribute("values"));
	}
	set values(value: number[]) {
		this.valuesProp = value;
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

	attributeChangedCallback(name: string): void {
		if (name === "values") this.valuesProp = null;
		if (this.root.firstChild) this.render();
	}

	private num(attr: string): number | undefined {
		const raw = this.getAttribute(attr);
		return raw !== null && raw !== "" ? Number(raw) : undefined;
	}

	private get bindings(): Record<string, unknown> {
		return {
			values: this.values,
			variant: this.variant,
			tone: this.tone,
			showEnd: this.getAttribute("show-end") !== "false",
			min: this.num("min"),
			max: this.num("max"),
			label: this.getAttribute("label"),
		};
	}

	private wireInteraction(): void {
		const spark = this.root.querySelector<HTMLElement>(".xoji-sparkline");
		const svg = this.root.querySelector<SVGSVGElement>(".xoji-sparkline__svg");
		const marker = this.root.querySelector<SVGGElement>(".xoji-sparkline__marker");
		const tooltip = this.root.querySelector<HTMLElement>(".xoji-sparkline__tooltip");
		if (!spark || !svg || !marker || !tooltip) return;
		const values = this.values;
		if (values.length === 0) return;
		const guide = marker.querySelector<SVGLineElement>(".xoji-sparkline__guide");
		const dot = marker.querySelector<SVGCircleElement>(".xoji-sparkline__dot");
		const lo = this.num("min") ?? Math.min(...values);
		const hi = this.num("max") ?? Math.max(...values);
		const span = hi - lo || 1;
		const innerW = VW - PAD * 2;

		const move = (event: PointerEvent): void => {
			const box = svg.getBoundingClientRect();
			const frac = box.width > 0 ? (event.clientX - box.left) / box.width : 0;
			const i = Math.max(0, Math.min(values.length - 1, Math.round(frac * (values.length - 1))));
			const vx = PAD + (values.length <= 1 ? innerW / 2 : (i / (values.length - 1)) * innerW);
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

define("xoji-sparkline", XojiSparkline);
