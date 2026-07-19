import { XtyleElement, define, type StyleMode } from "./base.js";
import type { Size } from "../index.js";
import { statHostCss } from "../markup/index.js";
import { FragmentHost } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/stat/source.generated.js";
import { resolveVocab, STAT_SENTIMENTS, STAT_TRENDS, SIZES, STAT_ALIGNS } from "../vocab.js";

type StatTrend = (typeof STAT_TRENDS)[number];
type StatSentiment = (typeof STAT_SENTIMENTS)[number];
type StatAlign = "start" | "center";

export class XtyleStat extends XtyleElement {
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "stat", {
		applyIntent: () => {},
	});

	protected override get styleMode(): StyleMode {
		return "auto";
	}

	static get observedAttributes(): string[] {
		return ["label", "delta", "trend", "sentiment", "caption", "size", "align", "inline"];
	}

	get label(): string | null {
		return this.getAttribute("label");
	}
	set label(value: string | null | undefined) {
		this.reflectString("label", value);
	}

	get delta(): string | null {
		return this.getAttribute("delta");
	}
	set delta(value: string | null | undefined) {
		this.reflectString("delta", value);
	}

	get trend(): StatTrend {
		return resolveVocab(this.getAttribute("trend"), STAT_TRENDS, "flat", "trend");
	}
	set trend(value: StatTrend) {
		this.setAttribute("trend", value);
	}

	/** The color reading of the delta. Omit to derive it from `trend` (up→positive, down→negative, flat→neutral). */
	get sentiment(): StatSentiment | null {
		const raw = this.getAttribute("sentiment");
		if (raw === null || raw === "") return null;
		return resolveVocab(raw, STAT_SENTIMENTS, "neutral", "sentiment");
	}
	set sentiment(value: StatSentiment | null | undefined) {
		this.reflectString("sentiment", value);
	}

	get caption(): string | null {
		return this.getAttribute("caption");
	}
	set caption(value: string | null | undefined) {
		this.reflectString("caption", value);
	}

	get size(): Size {
		return resolveVocab(this.getAttribute("size"), SIZES, "md", "stat size");
	}
	set size(value: Size) {
		this.setAttribute("size", value);
	}

	get align(): StatAlign {
		return resolveVocab(this.getAttribute("align"), STAT_ALIGNS, "start", "stat align");
	}
	set align(value: StatAlign) {
		this.setAttribute("align", value);
	}

	get inline(): boolean {
		return this.hasAttribute("inline");
	}
	set inline(value: boolean) {
		this.toggleAttribute("inline", !!value);
	}

	attributeChangedCallback(): void {
		if (this.root.firstChild) this.render();
	}

	private get bindings(): Record<string, unknown> {
		return {
			label: this.label,
			delta: this.delta,
			trend: this.trend,
			sentiment: this.sentiment ?? undefined,
			caption: this.caption,
			size: this.size,
			align: this.align,
			inline: this.inline,
		};
	}

	/** A signature of the state ops can't express incrementally: the label, delta, and caption
	 * text (each rendered into a shadow span, not patched on update), the trend (which swaps the
	 * delta's icon and is the default color signal), and the sentiment (which swaps the delta's
	 * color modifier class). Keying on the text values, not just presence, means a content-only
	 * edit forces a rebuild rather than going stale; size/align stay cheap class patches. */
	private shapeSignature(): string {
		return `${this.label}|${this.delta}|${this.caption}|${this.trend}|${this.sentiment}`;
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(statHostCss);
		this.fragment.reshapeIfChanged(this.shapeSignature());
		this.fragment.update(this.bindings);
	}
}

define("xtyle-stat", XtyleStat);
