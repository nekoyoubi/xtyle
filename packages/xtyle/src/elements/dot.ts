import { XtyleElement, define, type StyleMode } from "./base.js";
import type { FullTone } from "../index.js";
import { dotHostCss, type DotSize, type DotPulse } from "../markup/index.js";
import { FragmentHost } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/dot/source.generated.js";

/**
 * A standalone status dot — a bare indicator for "presence without a full chip": a
 * connection light, a per-row streaming pip, an online/offline marker. It carries the
 * same surface as the `.xtyle-dot` utility class (tone, size, `ping`, `glow`, `pulse`,
 * and a `color` escape hatch) but as a first-class element that self-styles in its own
 * shadow root, so a shadow-DOM consumer with no global stylesheet can still reach it.
 */
export class XtyleDot extends XtyleElement {
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "dot", {
		applyIntent: () => {},
	});

	protected override get styleMode(): StyleMode {
		return "auto";
	}

	static get observedAttributes(): string[] {
		return ["tone", "size", "pulse", "ping", "glow", "color", "label"];
	}

	get tone(): FullTone {
		return (this.getAttribute("tone") as FullTone) ?? "neutral";
	}
	set tone(value: FullTone) {
		this.setAttribute("tone", value);
	}

	get size(): DotSize {
		return (this.getAttribute("size") as DotSize) ?? "md";
	}
	set size(value: DotSize) {
		this.setAttribute("size", value);
	}

	get pulse(): DotPulse | null {
		return this.getAttribute("pulse") as DotPulse | null;
	}
	set pulse(value: DotPulse | null | undefined) {
		this.reflectString("pulse", value);
	}

	get ping(): boolean {
		return this.hasAttribute("ping");
	}
	set ping(value: boolean) {
		this.reflectBoolean("ping", value);
	}

	get glow(): boolean {
		return this.hasAttribute("glow");
	}
	set glow(value: boolean) {
		this.reflectBoolean("glow", value);
	}

	get color(): string | null {
		return this.getAttribute("color");
	}
	set color(value: string | null | undefined) {
		this.reflectString("color", value);
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
			tone: this.tone,
			size: this.size,
			pulse: this.pulse ?? undefined,
			ping: this.ping,
			glow: this.glow,
			color: this.color ?? undefined,
		};
	}

	/** A labelled dot is meaningful content (`role="img"` + name); an unlabelled one is decorative,
	 * so it's hidden from assistive tech rather than announced as an unnamed image. */
	private applyHostA11y(): void {
		const label = this.label;
		if (label) {
			this.setAttribute("role", "img");
			this.setAttribute("aria-label", label);
			this.removeAttribute("aria-hidden");
		} else {
			this.removeAttribute("role");
			this.removeAttribute("aria-label");
			this.setAttribute("aria-hidden", "true");
		}
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(dotHostCss);
		this.fragment.update(this.bindings);
		this.applyHostA11y();
	}
}

define("xtyle-dot", XtyleDot);
