import { XtyleElement, define, type StyleMode } from "./base.js";
import { separatorHostCss } from "../markup/index.js";
import { FragmentHost } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/separator/source.generated.js";
import { resolveVocab, ORIENTATIONS, SEPARATOR_VARIANTS, SEPARATOR_SIZES } from "../vocab.js";

import type { Orientation, SeparatorVariant, SeparatorSize } from "../markup/separator.js";
export type { Orientation, SeparatorVariant, SeparatorSize };

export class XtyleSeparator extends XtyleElement {
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "separator", {
		applyIntent: () => {},
	});

	protected override get styleMode(): StyleMode {
		return "auto";
	}

	static get observedAttributes(): string[] {
		return ["orientation", "variant", "size"];
	}

	get orientation(): Orientation {
		return resolveVocab(this.getAttribute("orientation"), ORIENTATIONS, "horizontal", "separator orientation");
	}
	set orientation(value: Orientation) {
		this.setAttribute("orientation", value);
	}

	get variant(): SeparatorVariant {
		return resolveVocab(this.getAttribute("variant"), SEPARATOR_VARIANTS, "default", "separator variant");
	}
	set variant(value: SeparatorVariant) {
		this.setAttribute("variant", value);
	}

	get size(): SeparatorSize {
		return resolveVocab(this.getAttribute("size"), SEPARATOR_SIZES, "normal", "separator size");
	}
	set size(value: SeparatorSize) {
		this.setAttribute("size", value);
	}

	attributeChangedCallback(): void {
		if (this.root.firstChild) this.render();
	}

	private get bindings(): Record<string, unknown> {
		return {
			orientation: this.orientation,
			variant: this.variant,
			size: this.size,
		};
	}

	/** A signature of the state ops can't express incrementally — the `with-label` variant (different
	 * children and `role`/`aria-hidden`) and the orientation (which adds or drops `aria-orientation`,
	 * a boolean-shaped attr a `setAttr` can't remove). When it changes, the structure is rebuilt
	 * rather than patched. */
	private shapeSignature(): string {
		return `${this.variant}|${this.orientation}`;
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(separatorHostCss);
		this.fragment.reshapeIfChanged(this.shapeSignature());
		this.fragment.update(this.bindings);
	}
}

define("xtyle-separator", XtyleSeparator);
