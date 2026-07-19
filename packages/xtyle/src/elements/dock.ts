import { XtyleElement, define, type StyleMode } from "./base.js";
import type { Size } from "../index.js";
import { dockHostCss, type DockSide } from "../markup/index.js";
import { FragmentHost } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/dock/source.generated.js";
import { resolveOptionalTone, resolveVocab, DOCK_SIDES, SIZES, resolveOptionalVocab, DOCK_EDGE_WIDTHS } from "../vocab.js";

export class XtyleDock extends XtyleElement {
	protected override get styleMode(): StyleMode {
		return "auto";
	}

	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "dock", {
		applyIntent: () => {},
	});

	static get observedAttributes(): string[] {
		return ["side", "size", "tone", "reverse-edge", "edge-width", "nav", "label", "hide-header"];
	}

	get tone(): string | null {
		return resolveOptionalTone(this.getAttribute("tone"));
	}
	set tone(value: string | null | undefined) {
		this.reflectString("tone", value);
	}

	get side(): DockSide {
		return resolveVocab(this.getAttribute("side"), DOCK_SIDES, "left", "dock side");
	}
	set side(value: DockSide) {
		this.setAttribute("side", value);
	}

	get size(): Size {
		return resolveVocab(this.getAttribute("size"), SIZES, "md", "dock size");
	}
	set size(value: Size) {
		this.setAttribute("size", value);
	}

	/** Move the tone / divider edge to the rail's outer side instead of the inner divider side. */
	get reverseEdge(): boolean {
		return this.hasAttribute("reverse-edge");
	}
	set reverseEdge(value: boolean) {
		this.reflectBoolean("reverse-edge", value);
	}

	get edgeWidth(): "thin" | "thick" | "bold" | null {
		return resolveOptionalVocab(this.getAttribute("edge-width"), DOCK_EDGE_WIDTHS, "dock edge-width");
	}
	set edgeWidth(value: "thin" | "thick" | "bold" | null | undefined) {
		this.reflectString("edge-width", value);
	}

	get nav(): boolean {
		return this.hasAttribute("nav");
	}
	set nav(value: boolean) {
		this.reflectBoolean("nav", value);
	}

	get label(): string | null {
		return this.getAttribute("label");
	}
	set label(value: string | null | undefined) {
		this.reflectString("label", value);
	}

	get hideHeader(): boolean {
		return this.hasAttribute("hide-header");
	}
	set hideHeader(value: boolean) {
		this.reflectBoolean("hide-header", value);
	}

	attributeChangedCallback(): void {
		if (this.root.firstChild) this.render();
	}

	private get bindings(): Record<string, unknown> {
		return {
			side: this.side,
			size: this.size,
			tone: this.tone,
			reverseEdge: this.reverseEdge,
			edgeWidth: this.edgeWidth,
			nav: this.nav,
			label: this.getAttribute("label"),
			hasAriaLabel: this.hasAttribute("aria-label"),
			hideHeader: this.hasAttribute("hide-header"),
		};
	}

	/** A signature of the state ops can't express incrementally — the tag (`nav`), whether a
	 * header renders, and whether an `aria-label` attribute is present (a `setAttr` can't
	 * remove it). When it changes, the structure is rebuilt rather than patched. */
	private shapeSignature(): string {
		const hasHeader = !!this.getAttribute("label") && !this.hasAttribute("hide-header");
		const labelAttr = !!this.getAttribute("label") && !this.hasAttribute("aria-label");
		return `${this.nav}|${hasHeader}|${labelAttr}`;
	}

	private warnIfUnnamed(): void {
		if (!this.getAttribute("label") && !this.getAttribute("aria-label") && !this.getAttribute("aria-labelledby")) {
			console.warn(
				"xtyle-dock: a dock has no accessible name. Provide a `label` or `aria-label` so multiple docks are distinguishable.",
			);
		}
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(dockHostCss);
		this.fragment.reshapeIfChanged(this.shapeSignature());
		this.fragment.update(this.bindings);
		this.warnIfUnnamed();
	}
}

define("xtyle-dock", XtyleDock);
