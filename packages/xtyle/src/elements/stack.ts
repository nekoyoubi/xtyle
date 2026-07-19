import { XtyleElement, define, type StyleMode } from "./base.js";
import { STACK_ALIGNS, STACK_JUSTIFIES } from "../vocab.js";
import { stackHostCss } from "../markup/index.js";
import { FragmentHost } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/stack/source.generated.js";

type StackAlign = (typeof STACK_ALIGNS)[number];
type StackJustify = (typeof STACK_JUSTIFIES)[number];

const ALIGNS: readonly StackAlign[] = STACK_ALIGNS;
const JUSTIFIES: readonly StackJustify[] = STACK_JUSTIFIES;

function clampGap(raw: string | null): number | null {
	if (raw === null) return null;
	const n = Math.trunc(Number(raw));
	if (!Number.isFinite(n) || n < 0 || n > 8) return null;
	return n;
}

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
		return clampGap(this.getAttribute("gap")) ?? 4;
	}
	set gap(value: number) {
		this.setAttribute("gap", String(value));
	}

	get align(): StackAlign | null {
		const raw = this.getAttribute("align") as StackAlign | null;
		return raw && ALIGNS.includes(raw) ? raw : null;
	}
	set align(value: StackAlign) {
		this.setAttribute("align", value);
	}

	get justify(): StackJustify | null {
		const raw = this.getAttribute("justify") as StackJustify | null;
		return raw && JUSTIFIES.includes(raw) ? raw : null;
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
