import { XtyleElement, define, type StyleMode } from "./base.js";
import type { FullTone } from "../index.js";
import { ribbonHostCss, type RibbonCorner, type RibbonSize, type RibbonVariant } from "../markup/index.js";
import { FragmentHost } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/ribbon/source.generated.js";
import { resolveTone, resolveVocab, RIBBON_CORNERS, RIBBON_SIZES, RIBBON_VARIANTS } from "../vocab.js";

/**
 * A corner ribbon: a diagonal banner pinned to a corner of its positioned container (a card, a tile,
 * an image) for a short label like "New", "Beta", or "Sale". `tone` skins it across the semantic roles
 * and named hues, `variant` picks a solid fill or a soft tint, `corner` chooses which corner it hugs,
 * and a `color` escape hatch paints any raw value. It ships as a first-class element that self-styles in
 * its own shadow root, so a shadow-DOM consumer with no global stylesheet gets it for free; the
 * `.xtyle-ribbon` utility class stays available for global-CSS pages. The container must be
 * `position: relative` (and usually `overflow: hidden`) for the ribbon to pin and clip.
 */
export class XtyleRibbon extends XtyleElement {
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "ribbon", {
		applyIntent: () => {},
	});

	protected override get styleMode(): StyleMode {
		return "auto";
	}

	static get observedAttributes(): string[] {
		return ["tone", "corner", "size", "variant", "color", "text-color", "label"];
	}

	get tone(): FullTone {
		return resolveTone(this.getAttribute("tone"), "accent");
	}
	set tone(value: FullTone) {
		this.setAttribute("tone", value);
	}

	get corner(): RibbonCorner {
		return resolveVocab(this.getAttribute("corner"), RIBBON_CORNERS, "top-right", "ribbon corner");
	}
	set corner(value: RibbonCorner) {
		this.setAttribute("corner", value);
	}

	get size(): RibbonSize {
		return resolveVocab(this.getAttribute("size"), RIBBON_SIZES, "md", "ribbon size");
	}
	set size(value: RibbonSize) {
		this.setAttribute("size", value);
	}

	get variant(): RibbonVariant {
		return resolveVocab(this.getAttribute("variant"), RIBBON_VARIANTS, "solid", "ribbon variant");
	}
	set variant(value: RibbonVariant) {
		this.setAttribute("variant", value);
	}

	get color(): string | null {
		return this.getAttribute("color");
	}
	set color(value: string | null | undefined) {
		this.reflectString("color", value);
	}

	get textColor(): string | null {
		return this.getAttribute("text-color");
	}
	set textColor(value: string | null | undefined) {
		this.reflectString("text-color", value);
	}

	get label(): string | null {
		return this.getAttribute("label");
	}
	set label(value: string | null | undefined) {
		this.reflectString("label", value);
	}

	attributeChangedCallback(): void {
		if (this.root.firstChild) this.render();
	}

	private get bindings(): Record<string, unknown> {
		return {
			tone: this.tone,
			corner: this.corner,
			size: this.size,
			variant: this.variant,
			color: this.color ?? undefined,
			textColor: this.textColor ?? undefined,
			label: this.label ?? undefined,
		};
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(ribbonHostCss);
		this.fragment.update(this.bindings);
	}
}

define("xtyle-ribbon", XtyleRibbon);
