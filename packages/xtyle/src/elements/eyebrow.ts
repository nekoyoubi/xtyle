import { XtyleElement, define, type StyleMode } from "./base.js";
import type { FullTone } from "../vocab.js";
import { eyebrowHostCss } from "../markup/index.js";
import { FragmentHost } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/eyebrow/source.generated.js";

type EyebrowTag = "p" | "span" | "div";
type EyebrowTone = "muted" | "subtle" | FullTone;
type EyebrowTracking = "normal" | "wide";

export class XtyleEyebrow extends XtyleElement {
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "eyebrow", {
		applyIntent: () => {},
	});

	protected override get styleMode(): StyleMode {
		return "auto";
	}

	static get observedAttributes(): string[] {
		return ["as", "tone", "tracking"];
	}

	get as(): EyebrowTag {
		return (this.getAttribute("as") as EyebrowTag) ?? "p";
	}
	set as(value: EyebrowTag) {
		this.setAttribute("as", value);
	}

	get tone(): EyebrowTone {
		return (this.getAttribute("tone") as EyebrowTone) ?? "accent";
	}
	set tone(value: EyebrowTone) {
		this.setAttribute("tone", value);
	}

	get tracking(): EyebrowTracking {
		return (this.getAttribute("tracking") as EyebrowTracking) ?? "normal";
	}
	set tracking(value: EyebrowTracking) {
		this.setAttribute("tracking", value);
	}

	attributeChangedCallback(): void {
		if (this.root.firstChild) this.render();
	}

	private get bindings(): Record<string, unknown> {
		return { as: this.as, tone: this.tone, tracking: this.tracking };
	}

	/** A signature of the state ops can't express incrementally — the rendered tag (`as`).
	 * A `setAttr` can't switch `<p>` for `<span>`, so when it changes the structure is
	 * rebuilt rather than patched. */
	private shapeSignature(): string {
		return this.as;
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(eyebrowHostCss);
		this.fragment.reshapeIfChanged(this.shapeSignature());
		this.fragment.update(this.bindings);
	}
}

define("xtyle-eyebrow", XtyleEyebrow);
