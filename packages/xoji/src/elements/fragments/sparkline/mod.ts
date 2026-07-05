interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
}

interface SparkBindings {
	values?: number[];
	/** Time-windowed mode: each point's normalized x (0..1 across the window) paired with its value.
	 * When present it drives the x-axis instead of even index spacing. The element computes it from
	 * timestamped `points` against a sliding window or explicit domain. */
	plot?: { x: number; value: number }[];
	variant?: string;
	tone?: string;
	showEnd?: boolean;
	step?: boolean;
	min?: number;
	max?: number;
	label?: string | null;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: SparkBindings, ops: OpsBuilder) => void) => void };
};

const AMP = /&/g;
const LT = /</g;
const GT = />/g;
const QUOT = /"/g;

function esc(value: string): string {
	return value.replace(AMP, "&amp;").replace(LT, "&lt;").replace(GT, "&gt;").replace(QUOT, "&quot;");
}

const VW = 100;
const VH = 32;
const PAD = 3;

function valuesOf(b: SparkBindings): number[] {
	return (b.values ?? []).map((v) => (Number.isFinite(v) ? v : 0));
}

function sparkClass(b: SparkBindings): string {
	const variant = b.variant ?? "line";
	const tone = b.tone ?? "accent";
	return ["xoji-sparkline", `xoji-sparkline--${variant}`, `xoji-sparkline--${tone}`].join(" ");
}

/** Screen coordinates for each value, y inverted, padded so the stroke and end cap don't clip. `xs`
 * supplies a normalized x (0..1) per point for time-windowed mode; without it the x is even index spacing. */
function points(values: number[], lo: number, hi: number, xs?: number[]): { x: number; y: number }[] {
	const n = values.length;
	const span = hi - lo || 1;
	const innerW = VW - PAD * 2;
	const innerH = VH - PAD * 2;
	return values.map((v, i) => {
		const nx = xs ? (xs[i] ?? 0) : n <= 1 ? 0.5 : i / (n - 1);
		return {
			x: PAD + nx * innerW,
			y: PAD + (1 - (v - lo) / span) * innerH,
		};
	});
}

/** Step (sample-and-hold) polyline coords. */
function stepCoords(pts: { x: number; y: number }[]): string {
	const out: string[] = [];
	pts.forEach((p, i) => {
		if (i > 0) out.push(`${p.x.toFixed(2)},${pts[i - 1]!.y.toFixed(2)}`);
		out.push(`${p.x.toFixed(2)},${p.y.toFixed(2)}`);
	});
	return out.join(" ");
}

function sparkHtml(b: SparkBindings): string {
	const plot = b.plot;
	const values = plot ? plot.map((p) => (Number.isFinite(p.value) ? p.value : 0)) : valuesOf(b);
	const xs = plot ? plot.map((p) => p.x) : undefined;
	const variant = b.variant ?? "line";
	const label = b.label ?? "";

	if (values.length === 0) {
		return `<span class="${sparkClass(b)}" role="img" aria-label="${label ? esc(label) : "No data"}"><span class="xoji-sparkline__empty">No data</span></span>`;
	}

	const a11y = label
		? ` role="img" aria-label="${esc(label)}"`
		: ` role="img" aria-label="Sparkline of ${values.length} values"`;

	const lo = b.min ?? Math.min(...values);
	const hi = b.max ?? Math.max(...values);
	const pts = points(values, lo, hi, xs);
	const lineCoords =
		b.step === true ? stepCoords(pts) : pts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");

	let shape = "";
	if (variant === "bar") {
		const bandW = (VW - PAD * 2) / values.length;
		const barW = bandW * 0.7;
		const span = hi - lo || 1;
		const base = VH - PAD;
		shape = values
			.map((v, i) => {
				const x = (pts[i] as { x: number }).x - barW / 2;
				const h = ((v - lo) / span) * (VH - PAD * 2);
				const y = base - h;
				return `<rect class="xoji-sparkline__bar" x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${barW.toFixed(2)}" height="${Math.max(0.5, h).toFixed(2)}"></rect>`;
			})
			.join("");
	} else if (variant === "area") {
		const base = VH - PAD;
		const first = pts[0] as { x: number; y: number };
		const last = pts[pts.length - 1] as { x: number; y: number };
		const path = `M ${first.x.toFixed(2)},${base} L ${lineCoords.replace(/ /g, " L ")} L ${last.x.toFixed(2)},${base} Z`;
		shape = `<path class="xoji-sparkline__area" d="${path}"></path><polyline class="xoji-sparkline__line" points="${lineCoords}" vector-effect="non-scaling-stroke"></polyline>`;
	} else {
		shape = `<polyline class="xoji-sparkline__line" points="${lineCoords}" vector-effect="non-scaling-stroke"></polyline>`;
	}

	const end = b.showEnd !== false && variant !== "bar" && pts.length > 0
		? `<circle class="xoji-sparkline__end" cx="${(pts[pts.length - 1] as { x: number }).x.toFixed(2)}" cy="${(pts[pts.length - 1] as { y: number }).y.toFixed(2)}" r="2" vector-effect="non-scaling-stroke"></circle>`
		: "";
	const marker = `<g class="xoji-sparkline__marker" hidden><line class="xoji-sparkline__guide" y1="0" y2="${VH}" vector-effect="non-scaling-stroke"></line><circle class="xoji-sparkline__dot" r="2.5" vector-effect="non-scaling-stroke"></circle></g>`;
	const tooltip = `<span class="xoji-sparkline__tooltip" role="status" aria-hidden="true" hidden></span>`;

	return `<span class="${sparkClass(b)}"><svg class="xoji-sparkline__svg" viewBox="0 0 ${VW} ${VH}" preserveAspectRatio="none"${a11y}>${shape}${end}${marker}</svg>${tooltip}</span>`;
}

hooks.fragment.mount("sparkline", (bindings, ops) => {
	ops.replaceChildren("[data-sparkline]", sparkHtml(bindings));
});

hooks.fragment.update("sparkline", (bindings, ops) => {
	ops.replaceChildren("[data-sparkline]", sparkHtml(bindings));
});
