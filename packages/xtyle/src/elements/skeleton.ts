import { XtyleElement, define, type StyleMode } from "./base.js";
import type { Size } from "../index.js";
import { skeletonHostCss, type SkeletonShape } from "../markup/index.js";
import { FragmentHost } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/skeleton/source.generated.js";
import { resolveVocab, SKELETON_SHAPES, SIZES } from "../vocab.js";

export type { SkeletonShape };

export class XtyleSkeleton extends XtyleElement {
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "skeleton", {
		applyIntent: () => {},
	});

	protected override get styleMode(): StyleMode {
		return "auto";
	}

	static get observedAttributes(): string[] {
		return ["shape", "size"];
	}

	get shape(): SkeletonShape {
		return resolveVocab(this.getAttribute("shape"), SKELETON_SHAPES, "text", "skeleton shape");
	}
	set shape(value: SkeletonShape) {
		this.setAttribute("shape", value);
	}

	get size(): Size {
		return resolveVocab(this.getAttribute("size"), SIZES, "md", "skeleton size");
	}
	set size(value: Size) {
		this.setAttribute("size", value);
	}

	attributeChangedCallback(): void {
		if (this.root.firstChild) this.render();
	}

	private get bindings(): Record<string, unknown> {
		return { shape: this.shape, size: this.size };
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(skeletonHostCss);
		this.fragment.update(this.bindings);
	}
}

define("xtyle-skeleton", XtyleSkeleton);
