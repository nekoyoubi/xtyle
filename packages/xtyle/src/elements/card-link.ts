import { XtyleElement, define, type StyleMode } from "./base.js";
import { cardLinkHostCss } from "../markup/index.js";
import { FragmentHost } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/card-link/source.generated.js";

export class XtyleCardLink extends XtyleElement {
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "card-link", {
		applyIntent: () => {},
	});

	protected override get styleMode(): StyleMode {
		return "auto";
	}

	static get observedAttributes(): string[] {
		return ["href", "target", "rel", "interactive", "overlay", "compact"];
	}

	get href(): string | null {
		return this.getAttribute("href");
	}
	set href(value: string | null | undefined) {
		this.reflectString("href", value);
	}

	get interactive(): boolean {
		return !this.hasAttribute("interactive") || this.getAttribute("interactive") !== "false";
	}
	set interactive(value: boolean) {
		this.setAttribute("interactive", value ? "true" : "false");
	}

	get overlay(): boolean {
		return this.hasAttribute("overlay");
	}
	set overlay(value: boolean) {
		this.reflectBoolean("overlay", value);
	}

	get compact(): boolean {
		return this.hasAttribute("compact");
	}
	set compact(value: boolean) {
		this.reflectBoolean("compact", value);
	}

	attributeChangedCallback(): void {
		if (this.root.firstChild) this.render();
	}

	private get bindings(): Record<string, unknown> {
		return {
			href: this.href,
			target: this.getAttribute("target"),
			rel: this.getAttribute("rel"),
			interactive: this.interactive,
			overlay: this.overlay,
			compact: this.compact,
		};
	}

	/** A signature of the state ops can't express incrementally — the optional `target` / `rel`
	 * attributes, which a `setAttr` can add but never remove. When either value changes — added,
	 * removed, or swapped for a different value — the anchor is rebuilt rather than patched. */
	private shapeSignature(): string {
		return `${this.getAttribute("target")}|${this.getAttribute("rel")}`;
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(cardLinkHostCss);
		this.fragment.reshapeIfChanged(this.shapeSignature());
		this.fragment.update(this.bindings);
	}
}

define("xtyle-card-link", XtyleCardLink);
