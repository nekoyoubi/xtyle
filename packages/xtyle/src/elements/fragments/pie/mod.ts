import { escapeAttr } from "../escape.js";

interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
}

interface PieDatum {
	label?: string;
	value?: number;
}

interface PieBindings {
	data?: PieDatum[];
	colors?: string[];
	variant?: string;
	showValues?: boolean;
	legend?: boolean;
	size?: number;
	title?: string | null;
	ariaLabel?: string | null;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: PieBindings, ops: OpsBuilder) => void) => void };
};

const SZ = 200;
const PAD = 4;
const CX = SZ / 2;
const CY = SZ / 2;
const R_OUT = SZ / 2 - PAD;
const R_IN_RATIO = 0.58;

function dataOf(b: PieBindings): { label: string; value: number }[] {
	return (b.data ?? [])
		.map((d) => ({ label: d.label ?? "", value: Math.max(0, Number.isFinite(d.value as number) ? (d.value as number) : 0) }))
		.filter((d) => d.value > 0);
}

function polar(r: number, angle: number): { x: number; y: number } {
	const a = ((angle - 90) * Math.PI) / 180;
	return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
}

function slicePath(rOut: number, rIn: number, start: number, end: number): string {
	const large = end - start > 180 ? 1 : 0;
	const oS = polar(rOut, start);
	const oE = polar(rOut, end);
	if (rIn <= 0) {
		return `M ${CX} ${CY} L ${oS.x.toFixed(2)} ${oS.y.toFixed(2)} A ${rOut} ${rOut} 0 ${large} 1 ${oE.x.toFixed(2)} ${oE.y.toFixed(2)} Z`;
	}
	const iS = polar(rIn, start);
	const iE = polar(rIn, end);
	return `M ${oS.x.toFixed(2)} ${oS.y.toFixed(2)} A ${rOut} ${rOut} 0 ${large} 1 ${oE.x.toFixed(2)} ${oE.y.toFixed(2)} L ${iE.x.toFixed(2)} ${iE.y.toFixed(2)} A ${rIn} ${rIn} 0 ${large} 0 ${iS.x.toFixed(2)} ${iS.y.toFixed(2)} Z`;
}

function pieClass(b: PieBindings): string {
	return ["xtyle-pie", b.variant === "donut" && "xtyle-pie--donut"].filter(Boolean).join(" ");
}

function legendHtml(data: { label: string }[], colors: string[]): string {
	const items = data
		.map(
			(d, i) =>
				`<span class="xtyle-pie__legend-item" part="legend-item"><span class="xtyle-pie__legend-dot" style="background:${escapeAttr(colors[i] ?? "currentColor")}"></span>${escapeAttr(d.label)}</span>`,
		)
		.join("");
	return `<div class="xtyle-pie__legend" part="legend">${items}</div>`;
}

/** The hover readout, one row per slice, drawn up front and revealed by index. The rows are the fill's
 * markup rather than something the host writes on each hover, so a mod that reshapes a row (a swatch, a
 * unit, a different order) survives every hover; the host only unhides the row the pointer is on. */
function tooltipHtml(data: { label: string; value: number }[], total: number): string {
	const rows = data
		.map((d, i) => {
			const percent = Math.round((d.value / total) * 100);
			return (
				`<span class="xtyle-pie__tooltip-row" part="tooltip-row" data-tip-row="${i}" hidden>` +
				`<span class="xtyle-pie__tooltip-name">${escapeAttr(d.label)}</span> ` +
				`<span class="xtyle-pie__tooltip-value">${escapeAttr(String(d.value))} · ${percent}%</span></span>`
			);
		})
		.join("");
	return `<div class="xtyle-pie__tooltip" part="tooltip" role="status" aria-hidden="true" hidden>${rows}</div>`;
}

function tableHtml(data: { label: string; value: number }[], total: number, caption: string): string {
	const rows = data
		.map(
			(d) =>
				`<tr><th scope="row">${escapeAttr(d.label)}</th><td>${escapeAttr(String(d.value))}</td><td>${escapeAttr(`${Math.round((d.value / total) * 100)}%`)}</td></tr>`,
		)
		.join("");
	const cap = caption ? `<caption>${escapeAttr(caption)}</caption>` : "";
	return `<table class="xtyle-pie__a11y">${cap}<thead><tr><th scope="col">Slice</th><th scope="col">Value</th><th scope="col">Share</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function pieHtml(b: PieBindings): string {
	const data = dataOf(b);
	const colors = b.colors ?? [];
	const donut = b.variant === "donut";
	const rIn = donut ? R_OUT * R_IN_RATIO : 0;
	const total = data.reduce((sum, d) => sum + d.value, 0);
	const label = b.title ?? b.ariaLabel ?? "";

	let slices = "";
	let labels = "";
	if (total > 0) {
		let acc = 0;
		for (let i = 0; i < data.length; i++) {
			const d = data[i] as { label: string; value: number };
			const sweep = (d.value / total) * 360;
			const start = acc;
			const end = acc + sweep;
			acc = end;
			const percent = Math.round((d.value / total) * 100);
			const fill = colors[i] ?? "currentColor";
			// A lone full-circle slice can't be drawn as an arc (start == end); use a ring/disc.
			if (sweep >= 359.999) {
				slices += donut
					? `<circle class="xtyle-pie__slice" part="slice" cx="${CX}" cy="${CY}" r="${((R_OUT + rIn) / 2).toFixed(2)}" fill="none" stroke="${escapeAttr(fill)}" stroke-width="${(R_OUT - rIn).toFixed(2)}" data-i="${i}" tabindex="0" role="img" aria-label="${escapeAttr(`${d.label}: ${d.value} (${percent}%)`)}"></circle>`
					: `<circle class="xtyle-pie__slice" part="slice" cx="${CX}" cy="${CY}" r="${R_OUT}" fill="${escapeAttr(fill)}" data-i="${i}" tabindex="0" role="img" aria-label="${escapeAttr(`${d.label}: ${d.value} (${percent}%)`)}"></circle>`;
			} else {
				slices += `<path class="xtyle-pie__slice" part="slice" d="${slicePath(R_OUT, rIn, start, end)}" fill="${escapeAttr(fill)}" data-i="${i}" tabindex="0" role="img" aria-label="${escapeAttr(`${d.label}: ${d.value} (${percent}%)`)}"></path>`;
			}
			if (b.showValues && percent >= 5) {
				const mid = polar((R_OUT + rIn) / 2 || R_OUT * 0.6, (start + end) / 2);
				labels += `<text class="xtyle-pie__value" x="${mid.x.toFixed(2)}" y="${mid.y.toFixed(2)}" text-anchor="middle" dy="0.32em">${percent}%</text>`;
			}
		}
	}

	const center =
		donut && total > 0
			? `<text class="xtyle-pie__center" x="${CX}" y="${CY}" text-anchor="middle" dy="0.32em">${escapeAttr(formatTotal(total))}</text>`
			: "";
	const a11y = label
		? ` aria-label="${escapeAttr(label)}"`
		: ` aria-label="${total > 0 ? `Pie chart of ${data.length} slices` : "No data"}"`;
	const empty =
		total > 0 ? "" : `<text class="xtyle-pie__empty" x="${CX}" y="${CY}" text-anchor="middle" dy="0.32em">No data</text>`;

	const svg =
		`<svg class="xtyle-pie__svg" viewBox="0 0 ${SZ} ${SZ}" role="img"${a11y}>` +
		`<g class="xtyle-pie__slices">${slices}</g><g class="xtyle-pie__labels">${labels}</g>${empty}${center}` +
		`</svg>`;
	const legend = b.legend !== false ? legendHtml(data, colors) : "";
	const tooltip = tooltipHtml(data, total || 1);
	const table = tableHtml(data, total || 1, label);

	return `<figure part="chart" class="${pieClass(b)}" style="--pie-size:${Math.max(80, b.size ?? 200)}px">${svg}${legend}${tooltip}${table}</figure>`;
}

function formatTotal(value: number): string {
	if (value >= 1000) return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
	return String(Math.round(value * 100) / 100);
}

hooks.fragment.mount("pie", (bindings, ops) => {
	ops.replaceChildren("[data-pie]", pieHtml(bindings));
});

hooks.fragment.update("pie", (bindings, ops) => {
	ops.replaceChildren("[data-pie]", pieHtml(bindings));
});
