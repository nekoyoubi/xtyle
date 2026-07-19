import { XtyleElement, define, type StyleMode } from "./base.js";
import { GRID_ALIGNS } from "../vocab.js";
import { gridHostCss, type GridAlign } from "../markup/index.js";
import { FragmentHost } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/grid/source.generated.js";

const ALIGNS: readonly GridAlign[] = GRID_ALIGNS;

function clampGap(raw: string | null): number | null {
	if (raw === null) return null;
	const n = Math.trunc(Number(raw));
	if (!Number.isFinite(n) || n < 0 || n > 8) return null;
	return n;
}

function clampColumns(raw: string | null): number | null {
	if (raw === null) return null;
	const n = Math.trunc(Number(raw));
	if (!Number.isFinite(n) || n < 1 || n > 12) return null;
	return n;
}

export class XtyleGrid extends XtyleElement {
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "grid", {
		applyIntent: () => {},
	});

	protected override get styleMode(): StyleMode {
		return "auto";
	}

	static get observedAttributes(): string[] {
		return ["gap", "columns", "min-col-width", "align", "justify", "inline"];
	}

	get gap(): number {
		return clampGap(this.getAttribute("gap")) ?? 4;
	}
	set gap(value: number) {
		this.setAttribute("gap", String(value));
	}

	get columns(): number | null {
		return clampColumns(this.getAttribute("columns"));
	}
	set columns(value: number) {
		this.setAttribute("columns", String(value));
	}

	get minColWidth(): string | null {
		return this.getAttribute("min-col-width");
	}
	set minColWidth(value: string | null | undefined) {
		this.reflectString("min-col-width", value);
	}

	get align(): GridAlign | null {
		const raw = this.getAttribute("align") as GridAlign | null;
		return raw && ALIGNS.includes(raw) ? raw : null;
	}
	set align(value: GridAlign) {
		this.setAttribute("align", value);
	}

	get justify(): GridAlign | null {
		const raw = this.getAttribute("justify") as GridAlign | null;
		return raw && ALIGNS.includes(raw) ? raw : null;
	}
	set justify(value: GridAlign) {
		this.setAttribute("justify", value);
	}

	get inline(): boolean {
		return this.hasAttribute("inline");
	}
	set inline(value: boolean) {
		this.reflectBoolean("inline", value);
	}

	attributeChangedCallback(): void {
		if (this.root.firstChild) this.render();
	}

	private get bindings(): Record<string, unknown> {
		return {
			gap: this.gap,
			columns: this.columns,
			minColWidth: this.minColWidth,
			align: this.align,
			justify: this.justify,
			inline: this.inline,
		};
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(gridHostCss);
		this.fragment.update(this.bindings);
	}
}

define("xtyle-grid", XtyleGrid);
