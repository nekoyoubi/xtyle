import { XtyleElement, define, type StyleMode } from "./base.js";
import { placeOverlay } from "./overlay-position.js";
import { formatColor, parseColor, type ColorFormat } from "../index.js";
import { swatchHostCss, type SwatchSize } from "../markup/index.js";
import { FragmentHost, type FragmentIntent } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/swatch/source.generated.js";

const DETAIL_FORMATS: ColorFormat[] = ["hex", "rgb", "hsl", "oklch"];

export class XtyleSwatch extends XtyleElement {
	protected override get styleMode(): StyleMode {
		return "auto";
	}

	static get observedAttributes(): string[] {
		return ["color", "label", "value", "size", "interactive", "selected", "details"];
	}

	private detailsId = `xtyle-swatch-details-${Math.random().toString(36).slice(2, 8)}`;
	private detailsWired = false;
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "swatch", {
		context: (handler) => (handler === "select" ? this.selectContext() : undefined),
		applyIntent: (intent) => this.applyIntent(intent),
	});

	get color(): string | null {
		return this.getAttribute("color");
	}
	set color(value: string | null | undefined) {
		this.reflectString("color", value);
	}

	get label(): string | null {
		return this.getAttribute("label");
	}
	set label(value: string | null | undefined) {
		this.reflectString("label", value);
	}

	get value(): string | null {
		return this.getAttribute("value");
	}
	set value(value: string | null | undefined) {
		this.reflectString("value", value);
	}

	get size(): SwatchSize {
		return (this.getAttribute("size") as SwatchSize) ?? "md";
	}
	set size(value: SwatchSize) {
		this.setAttribute("size", value);
	}

	get interactive(): boolean {
		return this.hasAttribute("interactive");
	}
	set interactive(value: boolean) {
		this.reflectBoolean("interactive", value);
	}

	get selected(): boolean {
		return this.hasAttribute("selected");
	}
	set selected(value: boolean) {
		this.reflectBoolean("selected", value);
	}

	get details(): boolean {
		return this.hasAttribute("details");
	}
	set details(value: boolean) {
		this.reflectBoolean("details", value);
	}

	attributeChangedCallback(): void {
		if (this.root.firstChild) this.render();
	}

	private showsDetails(): boolean {
		return this.details && parseColor(this.color ?? "") !== null;
	}

	/** Flip the details popover below the chip when there's no room above (it defaults above),
	 * and clamp it horizontally so a chip near the right edge doesn't push the panel off-screen.
	 * No arrow to keep aligned, so the cross-axis is a plain inline-`left` offset from `placeOverlay`. */
	private repositionDetails = (): void => {
		if (!this.showsDetails()) return;
		const swatch = this.root.querySelector<HTMLElement>(".xtyle-swatch");
		const details = this.root.querySelector<HTMLElement>(".xtyle-swatch__details");
		if (!swatch || !details) return;
		const rect = swatch.getBoundingClientRect();
		const { placement, left } = placeOverlay({
			anchor: rect,
			content: { width: details.offsetWidth, height: details.offsetHeight },
			viewport: { width: window.innerWidth, height: window.innerHeight },
			preferred: "top",
			align: "start",
			gap: 8,
		});
		swatch.toggleAttribute("data-details-below", placement === "bottom");
		details.style.left = `${Math.round(left - rect.left)}px`;
	};

	private detailRows(): { model: string; value: string }[] {
		if (!this.details || !this.color) return [];
		const rgb = parseColor(this.color);
		if (!rgb) return [];
		return DETAIL_FORMATS.map((format) => ({ model: format, value: formatColor(rgb, format) }));
	}

	private get bindings(): Record<string, unknown> {
		return {
			color: this.color,
			label: this.label,
			value: this.value,
			size: this.size,
			interactive: this.interactive,
			selected: this.selected,
			showsDetails: this.showsDetails(),
			detailRows: this.detailRows(),
			detailsId: this.detailsId,
		};
	}

	/** Structural state ops can't patch incrementally: the tag (`interactive` → `<button>` vs `<span>`),
	 * whether the label / value / details spans exist, and the parsed detail rows (built only on mount).
	 * A change here rebuilds; a `selected` toggle or a `color` repaint is a cheap patch. */
	private shapeSignature(): string {
		const rows = this.showsDetails() ? this.detailRows().map((row) => row.value).join("|") : "";
		return `${this.interactive}|${!!this.label}|${!!this.value}|${this.showsDetails()}|${rows}`;
	}

	private selectContext(): { color: string | null; label: string | null; value: string | null } {
		return { color: this.color, label: this.label, value: this.value };
	}

	private applyIntent(intent: FragmentIntent): void {
		if (!intent.emit) return;
		this.dispatchEvent(
			new CustomEvent(intent.emit.type, { bubbles: true, composed: true, detail: intent.emit.detail }),
		);
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(swatchHostCss);
		this.fragment.reshapeIfChanged(this.shapeSignature());
		this.fragment.update(this.bindings);
		if (!this.detailsWired) {
			this.detailsWired = true;
			this.addEventListener("pointerenter", this.repositionDetails);
			this.addEventListener("focusin", this.repositionDetails);
		}
	}
}

define("xtyle-swatch", XtyleSwatch);
