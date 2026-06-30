import { XojiElement, define, type StyleMode } from "./base.js";
import type { FullTone } from "../vocab.js";
import { textHostCss } from "../markup/index.js";
import { FragmentHost } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/text/source.generated.js";

export type TextAs = "p" | "span";
export type TextSize = "xs" | "sm" | "body" | "lg";
export type TextWeight = "normal" | "medium" | "semibold" | "bold";
export type TextLeading = "tight" | "snug" | "loose";
export type TextTone = "default" | "muted" | "subtle" | FullTone;

export class XojiText extends XojiElement {
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
		return (this.getAttribute("as") as TextAs) ?? "p";
	}
	set as(value: TextAs) {
		this.setAttribute("as", value);
	}

	get size(): TextSize {
		return (this.getAttribute("size") as TextSize) ?? "body";
	}
	set size(value: TextSize) {
		this.setAttribute("size", value);
	}

	get weight(): TextWeight {
		return (this.getAttribute("weight") as TextWeight) ?? "normal";
	}
	set weight(value: TextWeight) {
		this.setAttribute("weight", value);
	}

	get leading(): TextLeading {
		return (this.getAttribute("leading") as TextLeading) ?? "snug";
	}
	set leading(value: TextLeading) {
		this.setAttribute("leading", value);
	}

	get tone(): TextTone {
		return (this.getAttribute("tone") as TextTone) ?? "default";
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

define("xoji-text", XojiText);
