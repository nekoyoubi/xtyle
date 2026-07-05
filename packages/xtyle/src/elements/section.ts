import { XtyleElement, define, type StyleMode } from "./base.js";
import { sectionHostCss } from "../markup/index.js";
import { FragmentHost } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/section/source.generated.js";
import type { FullTone } from "../vocab.js";

type SectionTag = "section" | "div" | "header" | "footer";
type SectionVariant = "band" | "stage";
type SectionTone = "plain" | "quiet" | FullTone;
type SectionPadding = "none" | "sm" | "md" | "lg";

export class XtyleSection extends XtyleElement {
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "section", {
		applyIntent: () => {},
	});

	protected override get styleMode(): StyleMode {
		return "auto";
	}

	static get observedAttributes(): string[] {
		return ["as", "variant", "tone", "bordered", "padding", "label"];
	}

	get as(): SectionTag {
		return (this.getAttribute("as") as SectionTag) ?? "section";
	}
	set as(value: SectionTag) {
		this.setAttribute("as", value);
	}

	get variant(): SectionVariant {
		return (this.getAttribute("variant") as SectionVariant) ?? "band";
	}
	set variant(value: SectionVariant) {
		this.setAttribute("variant", value);
	}

	get tone(): SectionTone {
		return (this.getAttribute("tone") as SectionTone) ?? "plain";
	}
	set tone(value: SectionTone) {
		this.setAttribute("tone", value);
	}

	get bordered(): boolean {
		return this.hasAttribute("bordered");
	}
	set bordered(value: boolean) {
		this.reflectBoolean("bordered", value);
	}

	get padding(): SectionPadding {
		return (this.getAttribute("padding") as SectionPadding) ?? "lg";
	}
	set padding(value: SectionPadding) {
		this.setAttribute("padding", value);
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
			as: this.as,
			variant: this.variant,
			tone: this.tone,
			bordered: this.bordered,
			padding: this.padding,
			label: this.label,
		};
	}

	/** A signature of the state ops can't express incrementally — the tag (`as`) and whether the
	 * stage label node exists (a `<span>` a `setAttr`/`setText` can't add or remove). When it
	 * changes, the structure is rebuilt rather than patched. */
	private shapeSignature(): string {
		const hasLabel = this.variant === "stage" && this.label != null && this.label !== "";
		return `${this.as}|${hasLabel}`;
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(sectionHostCss);
		this.fragment.reshapeIfChanged(this.shapeSignature());
		this.fragment.update(this.bindings);
	}
}

define("xtyle-section", XtyleSection);
