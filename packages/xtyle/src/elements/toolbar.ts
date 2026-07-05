import { XtyleElement, define, type StyleMode } from "./base.js";
import type { Size } from "../index.js";
import { toolbarHostCss } from "../markup/index.js";
import { FragmentHost } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/toolbar/source.generated.js";

export class XtyleToolbar extends XtyleElement {
	protected override get styleMode(): StyleMode {
		return "auto";
	}

	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "toolbar", {
		applyIntent: () => {},
	});

	static get observedAttributes(): string[] {
		return ["heading", "href", "size", "landmark", "sticky", "bare"];
	}

	get heading(): string | null {
		return this.getAttribute("heading");
	}
	set heading(value: string | null | undefined) {
		this.reflectString("heading", value);
	}

	get href(): string | null {
		return this.getAttribute("href");
	}

	get size(): Size {
		return (this.getAttribute("size") as Size) ?? "md";
	}
	set size(value: Size) {
		this.setAttribute("size", value);
	}

	get landmark(): boolean {
		return this.hasAttribute("landmark");
	}
	set landmark(value: boolean) {
		this.reflectBoolean("landmark", value);
	}

	get sticky(): boolean {
		return this.hasAttribute("sticky");
	}
	set sticky(value: boolean) {
		this.reflectBoolean("sticky", value);
	}

	get bare(): boolean {
		return this.hasAttribute("bare");
	}
	set bare(value: boolean) {
		this.reflectBoolean("bare", value);
	}

	attributeChangedCallback(): void {
		if (this.root.firstChild) this.render();
	}

	private get bindings(): Record<string, unknown> {
		return {
			heading: this.heading,
			href: this.href,
			size: this.size,
			landmark: this.landmark,
			sticky: this.sticky,
			bare: this.bare,
		};
	}

	/** A signature of the state ops can't express incrementally — the landmark tag (`header` vs `div`)
	 * and the title mode (absent / `<span>` / `<a>`). When it changes, the structure is rebuilt rather
	 * than patched. */
	private shapeSignature(): string {
		return `${this.landmark}|${this.heading !== null}|${this.heading !== null && this.href !== null}`;
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(toolbarHostCss);
		this.fragment.reshapeIfChanged(this.shapeSignature());
		this.fragment.update(this.bindings);
	}
}

define("xtyle-toolbar", XtyleToolbar);
