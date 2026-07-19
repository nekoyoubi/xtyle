import { XtyleElement, define, type StyleMode } from "./base.js";
import { headingSizeForLevel } from "../index.js";
import type { HeadingLevel, HeadingSize, HeadingTone } from "../index.js";
import { headingHostCss } from "../markup/index.js";
import { FragmentHost } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/heading/source.generated.js";
import { resolveTone, resolveVocab, EMPHASIS_TONES, HEADING_SIZES } from "../vocab.js";

export class XtyleHeading extends XtyleElement {
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "heading", {
		applyIntent: () => {},
	});

	protected override get styleMode(): StyleMode {
		return "auto";
	}

	static get observedAttributes(): string[] {
		return ["level", "size", "tone"];
	}

	get level(): HeadingLevel {
		const raw = Number(this.getAttribute("level"));
		return (raw >= 1 && raw <= 6 ? raw : 2) as HeadingLevel;
	}
	set level(value: HeadingLevel) {
		this.setAttribute("level", String(value));
	}

	get size(): HeadingSize {
		return resolveVocab(this.getAttribute("size"), HEADING_SIZES, headingSizeForLevel(this.level), "heading size");
	}
	set size(value: HeadingSize) {
		this.setAttribute("size", value);
	}

	get tone(): HeadingTone {
		return resolveTone(this.getAttribute("tone"), "default", EMPHASIS_TONES);
	}
	set tone(value: HeadingTone) {
		this.setAttribute("tone", value);
	}

	attributeChangedCallback(): void {
		if (this.root.firstChild) this.render();
	}

	private get bindings(): Record<string, unknown> {
		return {
			level: this.level,
			size: this.size,
			tone: this.tone,
		};
	}

	/** A signature of the state ops can't express incrementally — the heading's level switches the
	 * tag (`<h1>`–`<h6>`), which no `setAttr` can do. When it changes, the structure is rebuilt. */
	private shapeSignature(): string {
		return String(this.level);
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(headingHostCss);
		this.fragment.reshapeIfChanged(this.shapeSignature());
		this.fragment.update(this.bindings);
	}
}

define("xtyle-heading", XtyleHeading);
