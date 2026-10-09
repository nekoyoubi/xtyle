import { XtyleElement, define, type StyleMode } from "./base.js";
import { CLUSTER_ALIGNS, CLUSTER_JUSTIFIES, SPACE_STEP_EXPECTS, resolveIntegerIn, resolveOptionalVocab } from "../vocab.js";
import { clusterHostCss } from "../markup/index.js";
import { FragmentHost } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/cluster/source.generated.js";

type ClusterAlign = (typeof CLUSTER_ALIGNS)[number];
type ClusterJustify = (typeof CLUSTER_JUSTIFIES)[number];

const ALIGNS: readonly ClusterAlign[] = CLUSTER_ALIGNS;
const JUSTIFIES: readonly ClusterJustify[] = CLUSTER_JUSTIFIES;

export class XtyleCluster extends XtyleElement {
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "cluster", {
		applyIntent: () => {},
	});

	protected override get styleMode(): StyleMode {
		return "auto";
	}

	static get observedAttributes(): string[] {
		return ["gap", "align", "justify", "nowrap", "inline"];
	}

	get gap(): number {
		return resolveIntegerIn(this.getAttribute("gap"), 0, 8, "cluster gap", SPACE_STEP_EXPECTS) ?? 2;
	}
	set gap(value: number) {
		this.setAttribute("gap", String(value));
	}

	get align(): ClusterAlign | null {
		return resolveOptionalVocab(this.getAttribute("align"), ALIGNS, "cluster align");
	}
	set align(value: ClusterAlign) {
		this.setAttribute("align", value);
	}

	get justify(): ClusterJustify | null {
		return resolveOptionalVocab(this.getAttribute("justify"), JUSTIFIES, "cluster justify");
	}
	set justify(value: ClusterJustify) {
		this.setAttribute("justify", value);
	}

	get nowrap(): boolean {
		return this.hasAttribute("nowrap");
	}
	set nowrap(value: boolean) {
		this.reflectBoolean("nowrap", value);
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
			nowrap: this.nowrap,
			inline: this.inline,
		};
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(clusterHostCss);
		this.fragment.update(this.bindings);
	}
}

define("xtyle-cluster", XtyleCluster);
