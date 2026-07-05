interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
}

interface HeatmapBindings {
	values?: number[][];
	rows?: string[];
	cols?: string[];
	cellColors?: string[][];
	cellGlows?: (string | null)[][];
	glowValues?: number[][];
	glowLabel?: string | null;
	current?: number[][];
	currentTone?: string | null;
	currentPulse?: boolean;
	titles?: string[][];
	scale?: boolean;
	scaleColors?: string[];
	scaleLow?: number;
	scaleHigh?: number;
	showValues?: boolean;
	selectable?: boolean;
	title?: string | null;
	ariaLabel?: string | null;
}

const CURRENT_TONES = new Set(["success", "danger", "warn", "info", "neutral"]);

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: HeatmapBindings, ops: OpsBuilder) => void) => void };
};

const AMP = /&/g;
const LT = /</g;
const GT = />/g;
const QUOT = /"/g;

function esc(value: string): string {
	return value.replace(AMP, "&amp;").replace(LT, "&lt;").replace(GT, "&gt;").replace(QUOT, "&quot;");
}

const CELL = 34;
const GAP = 2;

function matrix(b: HeatmapBindings): number[][] {
	return (b.values ?? []).map((row) => (Array.isArray(row) ? row.map((v) => (Number.isFinite(v) ? v : 0)) : []));
}

function formatValue(value: number): string {
	if (value >= 1000) return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
	return Number.isInteger(value) ? String(value) : String(Math.round(value * 100) / 100);
}

function tableHtml(values: number[][], rows: string[], cols: string[], caption: string): string {
	const head = `<tr><th scope="col"></th>${cols.map((c) => `<th scope="col">${esc(c)}</th>`).join("")}</tr>`;
	const body = values
		.map(
			(row, r) =>
				`<tr><th scope="row">${esc(rows[r] ?? String(r))}</th>${row
					.map((v) => `<td>${esc(formatValue(v))}</td>`)
					.join("")}</tr>`,
		)
		.join("");
	const cap = caption ? `<caption>${esc(caption)}</caption>` : "";
	return `<table class="xoji-heatmap__a11y">${cap}<thead>${head}</thead><tbody>${body}</tbody></table>`;
}

function heatmapHtml(b: HeatmapBindings): string {
	const values = matrix(b);
	const rows = b.rows ?? [];
	const cols = b.cols ?? [];
	const colors = b.cellColors ?? [];
	const glows = b.cellGlows ?? [];
	const glowValues = b.glowValues ?? [];
	const glowLabel = b.glowLabel ?? null;
	const titles = b.titles ?? [];
	const currentSet = new Set((b.current ?? []).map(([r, c]) => `${r},${c}`));
	const currentPulse = !!b.currentPulse;
	const selectable = !!b.selectable;

	const nRows = values.length;
	const nCols = values.reduce((max, row) => Math.max(max, row.length), 0);

	if (nRows === 0 || nCols === 0) {
		const label = b.title ?? b.ariaLabel ?? "";
		return `<figure part="chart" class="xoji-heatmap"><div class="xoji-heatmap__empty" part="empty" role="img" aria-label="${label ? esc(label) : "No data"}">No data</div></figure>`;
	}

	const hasRowLabels = rows.some(Boolean);
	const hasColLabels = cols.some(Boolean);

	const leftPad = hasRowLabels ? 64 : 2;
	const bottomPad = hasColLabels ? 22 : 2;
	const topPad = 2;
	const rightPad = 2;
	const gridW = nCols * CELL;
	const gridH = nRows * CELL;
	const width = leftPad + gridW + rightPad;
	const height = topPad + gridH + bottomPad;

	const role = selectable ? "button" : "img";
	const cells: string[] = [];
	const valueLabels: string[] = [];
	for (let r = 0; r < nRows; r++) {
		for (let c = 0; c < (values[r]?.length ?? 0); c++) {
			const v = values[r]?.[c] ?? 0;
			const x = leftPad + c * CELL;
			const y = topPad + r * CELL;
			const fill = colors[r]?.[c] ?? "currentColor";
			const glow = glows[r]?.[c] ?? null;
			const style = glow ? ` style="filter:${esc(glow)}"` : "";
			const gv = glowValues[r]?.[c];
			const glowText = glowLabel && Number.isFinite(gv) ? `, ${glowLabel} ${gv}` : "";
			const title = titles[r]?.[c];
			const label = title || `${rows[r] ?? String(r)}, ${cols[c] ?? String(c)}: ${v}${glowText}`;
			const isCurrent = currentSet.has(`${r},${c}`);
			const cellCls =
				"xoji-heatmap__cell" +
				(isCurrent ? " xoji-heatmap__cell--current" : "") +
				(isCurrent && currentPulse ? " xoji-heatmap__cell--pulse" : "");
			cells.push(
				`<rect class="${cellCls}" part="cell" x="${(x + GAP / 2).toFixed(1)}" y="${(y + GAP / 2).toFixed(1)}" width="${(CELL - GAP).toFixed(1)}" height="${(CELL - GAP).toFixed(1)}" rx="2" fill="${esc(fill)}"${style} data-r="${r}" data-c="${c}" tabindex="0" role="${role}" aria-label="${esc(label)}"></rect>`,
			);
			if (b.showValues) {
				valueLabels.push(
					`<text class="xoji-heatmap__value" x="${(x + CELL / 2).toFixed(1)}" y="${(y + CELL / 2).toFixed(1)}" dy="0.32em" text-anchor="middle">${esc(formatValue(v))}</text>`,
				);
			}
		}
	}

	const rowLabels = hasRowLabels
		? rows
				.slice(0, nRows)
				.map(
					(labelText, r) =>
						`<text class="xoji-heatmap__rowlabel" x="${(leftPad - 8).toFixed(1)}" y="${(topPad + r * CELL + CELL / 2).toFixed(1)}" dy="0.32em" text-anchor="end">${esc(labelText ?? "")}</text>`,
				)
				.join("")
		: "";
	const colLabels = hasColLabels
		? cols
				.slice(0, nCols)
				.map(
					(labelText, c) =>
						`<text class="xoji-heatmap__collabel" x="${(leftPad + c * CELL + CELL / 2).toFixed(1)}" y="${(topPad + gridH + 15).toFixed(1)}" text-anchor="middle">${esc(labelText ?? "")}</text>`,
				)
				.join("")
		: "";

	const toneMod = b.currentTone && CURRENT_TONES.has(b.currentTone) ? `xoji-heatmap--now-${b.currentTone}` : "";
	const cls = ["xoji-heatmap", selectable && "xoji-heatmap--selectable", toneMod].filter(Boolean).join(" ");
	const svg =
		`<svg class="xoji-heatmap__svg" viewBox="0 0 ${width} ${height}" style="max-width:${width}px" preserveAspectRatio="xMidYMid meet" aria-hidden="true">` +
		`<g class="xoji-heatmap__cells">${cells.join("")}</g>` +
		`<g class="xoji-heatmap__values">${valueLabels.join("")}</g>` +
		`<g class="xoji-heatmap__rowlabels">${rowLabels}</g>` +
		`<g class="xoji-heatmap__collabels">${colLabels}</g>` +
		`</svg>`;
	const tooltip = `<div class="xoji-heatmap__tooltip" part="tooltip" role="status" aria-hidden="true" hidden></div>`;
	const table = tableHtml(values, rows, cols, b.title ?? b.ariaLabel ?? "");

	const scaleColors = b.scaleColors ?? [];
	const scaleHtml =
		b.scale && scaleColors.length
			? `<div class="xoji-heatmap__scale" part="scale" aria-hidden="true">` +
				`<span class="xoji-heatmap__scale-end">${esc(formatValue(b.scaleLow ?? 0))}</span>` +
				`<span class="xoji-heatmap__scale-ramp">${scaleColors
					.map((color) => `<span class="xoji-heatmap__scale-swatch" style="background:${esc(color)}"></span>`)
					.join("")}</span>` +
				`<span class="xoji-heatmap__scale-end">${esc(formatValue(b.scaleHigh ?? 0))}</span>` +
				`</div>`
			: "";

	return `<figure part="chart" class="${cls}">${svg}${scaleHtml}${tooltip}${table}</figure>`;
}

hooks.fragment.mount("heatmap", (bindings, ops) => {
	ops.replaceChildren("[data-heatmap]", heatmapHtml(bindings));
});

hooks.fragment.update("heatmap", (bindings, ops) => {
	ops.replaceChildren("[data-heatmap]", heatmapHtml(bindings));
});
