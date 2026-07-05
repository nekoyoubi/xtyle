import { XtyleElement, define, type StyleMode } from "./base.js";
import { clusterHostCss } from "../markup/index.js";
import { FragmentHost } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/cluster/source.generated.js";

type ClusterAlign = "start" | "center" | "end" | "stretch" | "baseline";
type ClusterJustify = "start" | "center" | "end" | "between" | "around" | "evenly";

const ALIGNS: readonly ClusterAlign[] = ["start", "center", "end", "stretch", "baseline"];
const JUSTIFIES: readonly ClusterJustify[] = ["start", "center", "end", "between", "around", "evenly"];

function clampGap(raw: string | null): number | null {
	if (raw === null) return null;
	const n = Math.trunc(Number(raw));
	if (!Number.isFinite(n) || n < 0 || n > 8) return null;
	return n;
}

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
		return clampGap(this.getAttribute("gap")) ?? 2;
	}
	set gap(value: number) {
		this.setAttribute("gap", String(value));
	}

	get align(): ClusterAlign | null {
		const raw = this.getAttribute("align") as ClusterAlign | null;
		return raw && ALIGNS.includes(raw) ? raw : null;
	}
	set align(value: ClusterAlign) {
		this.setAttribute("align", value);
	}

	get justify(): ClusterJustify | null {
		const raw = this.getAttribute("justify") as ClusterJustify | null;
		return raw && JUSTIFIES.includes(raw) ? raw : null;
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
