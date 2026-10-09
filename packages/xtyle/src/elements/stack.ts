import { XtyleElement, define, type StyleMode } from "./base.js";
import { STACK_ALIGNS, STACK_JUSTIFIES, SPACE_STEP_EXPECTS, resolveIntegerIn, resolveOptionalVocab } from "../vocab.js";
import { stackHostCss } from "../markup/index.js";
import { FragmentHost } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/stack/source.generated.js";

type StackAlign = (typeof STACK_ALIGNS)[number];
type StackJustify = (typeof STACK_JUSTIFIES)[number];

const ALIGNS: readonly StackAlign[] = STACK_ALIGNS;
const JUSTIFIES: readonly StackJustify[] = STACK_JUSTIFIES;

export class XtyleStack extends XtyleElement {
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "stack", {
		applyIntent: () => {},
	});

	protected override get styleMode(): StyleMode {
		return "auto";
	}

	static get observedAttributes(): string[] {
		return ["gap", "align", "justify", "inline"];
	}

	get gap(): number {
		return resolveIntegerIn(this.getAttribute("gap"), 0, 8, "stack gap", SPACE_STEP_EXPECTS) ?? 4;
	}
	set gap(value: number) {
		this.setAttribute("gap", String(value));
	}

	get align(): StackAlign | null {
		return resolveOptionalVocab(this.getAttribute("align"), ALIGNS, "stack align");
	}
	set align(value: StackAlign) {
		this.setAttribute("align", value);
	}

	get justify(): StackJustify | null {
		return resolveOptionalVocab(this.getAttribute("justify"), JUSTIFIES, "stack justify");
	}
	set justify(value: StackJustify) {
		this.setAttribute("justify", value);
	}

	get inline(): boolean {
		return this.hasAttribute("inline");
	}
	set inline(value: boolean) {
		this.reflectBoolean("inline", value);
	}

	attributeChangedCallback(): void {
		if (this.root.firstChild) this.render();
	}

	private get bindings(): Record<string, unknown> {
		return {
			gap: this.gap,
			align: this.align,
			justify: this.justify,
			inline: this.inline,
		};
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(stackHostCss);
		this.fragment.update(this.bindings);
	}
}

define("xtyle-stack", XtyleStack);
