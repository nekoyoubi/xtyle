import { XtyleElement, define, type StyleMode } from "./base.js";
import { GRID_ALIGNS, GRID_SIDES, SPACE_STEP_EXPECTS, resolveIntegerIn, resolveOptionalVocab } from "../vocab.js";
import { gridHostCss, type GridAlign, type GridSide } from "../markup/index.js";
import { FragmentHost } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/grid/source.generated.js";

const ALIGNS: readonly GridAlign[] = GRID_ALIGNS;
const SIDES: readonly GridSide[] = GRID_SIDES;

export class XtyleGrid extends XtyleElement {
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "grid", {
		applyIntent: () => {},
	});

	protected override get styleMode(): StyleMode {
		return "auto";
	}

	static get observedAttributes(): string[] {
		return ["gap", "columns", "min-col-width", "sidebar", "side", "align", "justify", "inline"];
	}

	get gap(): number {
		return resolveIntegerIn(this.getAttribute("gap"), 0, 8, "grid gap", SPACE_STEP_EXPECTS) ?? 4;
	}
	set gap(value: number) {
		this.setAttribute("gap", String(value));
	}

	get columns(): number | null {
		return resolveIntegerIn(this.getAttribute("columns"), 1, 12, "grid columns", "a whole column count");
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

	get sidebar(): string | null {
		const raw = this.getAttribute("sidebar");
		return raw !== null && raw.trim() !== "" ? raw : null;
	}
	set sidebar(value: string | null | undefined) {
		this.reflectString("sidebar", value);
	}

	get side(): GridSide | null {
		return resolveOptionalVocab(this.getAttribute("side"), SIDES, "grid side");
	}
	set side(value: GridSide) {
		this.setAttribute("side", value);
	}

	get align(): GridAlign | null {
		return resolveOptionalVocab(this.getAttribute("align"), ALIGNS, "grid align");
	}
	set align(value: GridAlign) {
		this.setAttribute("align", value);
	}

	get justify(): GridAlign | null {
		return resolveOptionalVocab(this.getAttribute("justify"), ALIGNS, "grid justify");
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
			sidebar: this.sidebar,
			side: this.side,
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
