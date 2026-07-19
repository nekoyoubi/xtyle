import { XtyleElement, define, type StyleMode } from "./base.js";
import type { FullTone } from "../vocab.js";
import { textHostCss } from "../markup/index.js";
import { FragmentHost } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/text/source.generated.js";
import { resolveTone, EMPHASIS_TONES, resolveVocab, TEXT_TAGS, TEXT_SIZES, TEXT_WEIGHTS, TEXT_LEADINGS } from "../vocab.js";

export type TextAs = "p" | "span";
export type TextSize = "xs" | "sm" | "body" | "lg";
export type TextWeight = "normal" | "medium" | "semibold" | "bold";
export type TextLeading = "tight" | "snug" | "loose";
export type TextTone = "default" | "muted" | "subtle" | FullTone;

export class XtyleText extends XtyleElement {
	protected override get styleMode(): StyleMode {
		return "auto";
	}

	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "text", {
		applyIntent: () => {},
	});

	static get observedAttributes(): string[] {
		return ["as", "size", "weight", "leading", "tone", "mono"];
	}

	get as(): TextAs {
		return resolveVocab(this.getAttribute("as"), TEXT_TAGS, "p", "text tag");
	}
	set as(value: TextAs) {
		this.setAttribute("as", value);
	}

	get size(): TextSize {
		return resolveVocab(this.getAttribute("size"), TEXT_SIZES, "body", "text size");
	}
	set size(value: TextSize) {
		this.setAttribute("size", value);
	}

	get weight(): TextWeight {
		return resolveVocab(this.getAttribute("weight"), TEXT_WEIGHTS, "normal", "text weight");
	}
	set weight(value: TextWeight) {
		this.setAttribute("weight", value);
	}

	get leading(): TextLeading {
		return resolveVocab(this.getAttribute("leading"), TEXT_LEADINGS, "snug", "text leading");
	}
	set leading(value: TextLeading) {
		this.setAttribute("leading", value);
	}

	get tone(): TextTone {
		return resolveTone(this.getAttribute("tone"), "default", EMPHASIS_TONES);
	}
	set tone(value: TextTone) {
		this.setAttribute("tone", value);
	}

	get mono(): boolean {
		return this.hasAttribute("mono");
	}
	set mono(value: boolean) {
		this.reflectBoolean("mono", value);
	}

	attributeChangedCallback(): void {
		if (this.root.firstChild) this.render();
	}

	private get bindings(): Record<string, unknown> {
		return {
			as: this.as,
			size: this.size,
			weight: this.weight,
			leading: this.leading,
			tone: this.tone,
			mono: this.mono,
		};
	}

	/** A signature of the state ops can't express incrementally — the element tag (`as`), which a
	 * `setAttr` class patch can't switch. When it changes, the structure is rebuilt rather than patched. */
	private shapeSignature(): string {
		return this.as;
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(textHostCss);
		this.fragment.reshapeIfChanged(this.shapeSignature());
		this.fragment.update(this.bindings);
	}
}

define("xtyle-text", XtyleText);
