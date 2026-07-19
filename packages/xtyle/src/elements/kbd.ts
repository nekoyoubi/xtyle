import { XtyleElement, define, type StyleMode } from "./base.js";
import { kbdHostCss, type KbdSize, type KbdTone } from "../markup/index.js";
import { FragmentHost } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/kbd/source.generated.js";
import { resolveOptionalTone, resolveVocab, KBD_SIZES } from "../vocab.js";

export class XtyleKbd extends XtyleElement {
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "kbd", {
		applyIntent: () => {},
	});

	protected override get styleMode(): StyleMode {
		return "auto";
	}

	static get observedAttributes(): string[] {
		return ["size", "tone"];
	}

	get size(): KbdSize {
		return resolveVocab(this.getAttribute("size"), KBD_SIZES, "md", "kbd size");
	}
	set size(value: KbdSize) {
		this.setAttribute("size", value);
	}

	get tone(): KbdTone | null {
		return resolveOptionalTone<KbdTone>(this.getAttribute("tone"));
	}
	set tone(value: KbdTone | null) {
		if (value) this.setAttribute("tone", value);
		else this.removeAttribute("tone");
	}

	attributeChangedCallback(): void {
		if (this.root.firstChild) this.render();
	}

	private get bindings(): Record<string, unknown> {
		return { size: this.size, tone: this.tone };
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(kbdHostCss);
		this.fragment.update(this.bindings);
	}
}

define("xtyle-kbd", XtyleKbd);
