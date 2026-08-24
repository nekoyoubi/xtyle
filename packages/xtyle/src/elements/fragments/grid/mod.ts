import { escapeAttr } from "../escape.js";

interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
}

interface GridBindings {
	gap?: number;
	columns?: number | null;
	minColWidth?: string | null;
	sidebar?: string | null;
	side?: string | null;
	align?: string | null;
	justify?: string | null;
	inline?: boolean;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: GridBindings, ops: OpsBuilder) => void) => void };
};

function clampGap(value: number | null | undefined): number {
	if (value === null || value === undefined) return 4;
	const n = Math.trunc(value);
	if (!Number.isFinite(n) || n < 0 || n > 8) return 4;
	return n;
}

function clampColumns(value: number | null | undefined): number | null {
	if (value === null || value === undefined) return null;
	const n = Math.trunc(value);
	if (!Number.isFinite(n) || n < 1 || n > 12) return null;
	return n;
}

function railWidth(b: GridBindings): string | null {
	const raw = b.sidebar ?? null;
	return raw !== null && raw.trim() !== "" ? raw : null;
}

function gridClass(b: GridBindings): string {
	const gap = clampGap(b.gap);
	const columns = clampColumns(b.columns);
	const min = b.minColWidth ?? null;
	const rail = railWidth(b);
	const usesColumns = rail === null && min === null && columns !== null;
	return [
		"xtyle-grid",
		`xtyle-grid--gap-${gap}`,
		usesColumns && `xtyle-grid--cols-${columns}`,
		rail !== null && "xtyle-grid--sidebar",
		rail !== null && `xtyle-grid--sidebar-${b.side === "start" ? "start" : "end"}`,
		b.align && `xtyle-grid--align-${b.align}`,
		b.justify && `xtyle-grid--justify-${b.justify}`,
		b.inline && "xtyle-grid--inline",
	]
		.filter(Boolean)
		.join(" ");
}

function gridStyle(b: GridBindings): string {
	const min = b.minColWidth ?? null;
	const rail = railWidth(b);
	if (rail !== null) {
		const floor = min === null ? "" : ` --xtyle-grid-main: ${min};`;
		return `--xtyle-grid-rail: ${rail};${floor}`;
	}
	return min === null ? "" : `grid-template-columns: repeat(auto-fit, minmax(${min}, 1fr))`;
}

function gridHtml(b: GridBindings): string {
	const style = gridStyle(b);
	const styleAttr = style === "" ? "" : ` style="${escapeAttr(style)}"`;
	return `<div part="grid" class="${escapeAttr(gridClass(b))}"${styleAttr}><slot></slot></div>`;
}

hooks.fragment.mount("grid", (bindings, ops) => {
	ops.replaceChildren("[data-grid]", gridHtml(bindings));
});

hooks.fragment.update("grid", (bindings, ops) => {
	ops.setAttr(".xtyle-grid", "class", gridClass(bindings));
	ops.setAttr('[part="grid"]', "style", gridStyle(bindings));
});
