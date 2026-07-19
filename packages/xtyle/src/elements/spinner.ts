import { XtyleElement, define, type StyleMode } from "./base.js";
import type { Size, FullTone } from "../index.js";
import { spinnerHostCss } from "../markup/index.js";
import { FragmentHost } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/spinner/source.generated.js";
import { resolveTone, resolveVocab, SIZES } from "../vocab.js";

export class XtyleSpinner extends XtyleElement {
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "spinner", {
		applyIntent: () => {},
	});

	protected override get styleMode(): StyleMode {
		return "auto";
	}

	static get observedAttributes(): string[] {
		return ["tone", "size", "aria-label"];
	}

	get tone(): FullTone {
		return resolveTone(this.getAttribute("tone"), "accent");
	}
	set tone(value: FullTone) {
		this.setAttribute("tone", value);
	}

	get size(): Size {
		return resolveVocab(this.getAttribute("size"), SIZES, "md", "spinner size");
	}
	set size(value: Size) {
		this.setAttribute("size", value);
	}

	private get label(): string {
		return this.getAttribute("aria-label") ?? "Loading";
	}

	attributeChangedCallback(): void {
		if (this.root.firstChild) this.render();
	}

	private get bindings(): Record<string, unknown> {
		return {
			tone: this.tone,
			size: this.size,
			label: this.label,
		};
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(spinnerHostCss);
		this.fragment.update(this.bindings);
	}
}

define("xtyle-spinner", XtyleSpinner);
