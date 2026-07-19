import { AnchorTracker } from "./anchor-tracker.js";
import { XtyleElement, define, type StyleMode } from "./base.js";
import { placeOverlay } from "./overlay-position.js";
import { formatColor, parseColor, type ColorFormat } from "../index.js";
import { swatchHostCss, type SwatchSize } from "../markup/index.js";
import { FragmentHost, type FragmentIntent } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/swatch/source.generated.js";
import { resolveVocab, SWATCH_SIZES } from "../vocab.js";

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
	private tracker = new AnchorTracker(() => this.placeDetails());
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
		return resolveVocab(this.getAttribute("size"), SWATCH_SIZES, "md", "swatch size");
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

	private get detailsEl(): HTMLElement | null {
		return this.root.querySelector<HTMLElement>(".xtyle-swatch__details");
	}

	/**
	 * Show the readout and place it. Both halves are script's now: a popover only opens from script,
	 * which is what buys the escape from a clipping ancestor, so the CSS hover reveal this replaced
	 * couldn't have come along.
	 *
	 * Flips below the chip when there's no room above (it defaults above) and clamps horizontally so
	 * a chip near an edge doesn't push the panel off-screen. No arrow to keep aligned, so the whole
	 * placement is `placeOverlay`'s coordinates written onto the element.
	 */
	private showDetails = (): void => {
		if (!this.showsDetails()) return;
		const details = this.detailsEl;
		const swatch = this.root.querySelector<HTMLElement>(".xtyle-swatch");
		if (!details || !swatch) return;
		try {
			if (!details.matches(":popover-open")) details.showPopover();
		} catch {
			return;
		}
		this.placeDetails();
		// The readout is placed from viewport coordinates, so it only stays on its chip while something
		// keeps it there — and a swatch's home is a scrolling palette. Escape reaches the document for
		// the reason below: raised by hover, the key never lands anywhere inside this element.
		this.tracker.start(swatch, details);
		document.addEventListener("keydown", this.onKeydown, { capture: true });
	};

	private placeDetails = (): void => {
		const details = this.detailsEl;
		const swatch = this.root.querySelector<HTMLElement>(".xtyle-swatch");
		if (!details || !swatch || !details.matches(":popover-open")) return;
		const { placement, left, top } = placeOverlay({
			anchor: swatch.getBoundingClientRect(),
			content: { width: details.offsetWidth, height: details.offsetHeight },
			viewport: { width: window.innerWidth, height: window.innerHeight },
			preferred: "top",
			align: "start",
			gap: 8,
		});
		swatch.toggleAttribute("data-details-below", placement === "bottom");
		details.style.left = `${Math.round(left)}px`;
		details.style.top = `${Math.round(top)}px`;
	};

	private hideDetails = (): void => {
		this.tracker.stop();
		document.removeEventListener("keydown", this.onKeydown, { capture: true });
		const details = this.detailsEl;
		if (!details) return;
		try {
			if (details.matches(":popover-open")) details.hidePopover();
		} catch {
			/* already gone */
		}
	};

	override disconnectedCallback(): void {
		super.disconnectedCallback();
		this.hideDetails();
	}

	/** WCAG 1.4.13 dismissible: the readout appears on hover, so Escape has to take it away without
	 * moving the pointer or the focus. The platform gives that to a `popover=auto` for free and to a
	 * `manual` one not at all, and `manual` is the right door here — so it's wired by hand. */
	private onKeydown = (event: KeyboardEvent): void => {
		if (event.key !== "Escape") return;
		if (!this.detailsEl?.matches(":popover-open")) return;
		event.stopPropagation();
		this.hideDetails();
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
			this.addEventListener("pointerenter", this.showDetails);
			this.addEventListener("pointerleave", this.hideDetails);
			this.addEventListener("focusin", this.showDetails);
			this.addEventListener("focusout", this.hideDetails);
		}
	}
}

define("xtyle-swatch", XtyleSwatch);
