import { XtyleElement, define, type StyleMode } from "./base.js";
import { linkHostCss, type LinkVariant } from "../markup/index.js";
import { FragmentHost } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/link/source.generated.js";

export type { LinkVariant };

export class XtyleLink extends XtyleElement {
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "link", {
		applyIntent: () => {},
	});

	protected override get styleMode(): StyleMode {
		return "auto";
	}

	static get observedAttributes(): string[] {
		return ["variant", "href", "target", "rel", "external-icon"];
	}

	get variant(): LinkVariant {
		return (this.getAttribute("variant") as LinkVariant) ?? "default";
	}
	set variant(value: LinkVariant) {
		this.setAttribute("variant", value);
	}

	get href(): string | null {
		return this.getAttribute("href");
	}
	set href(value: string | null | undefined) {
		this.reflectString("href", value);
	}

	get target(): string | null {
		return this.getAttribute("target");
	}
	set target(value: string | null | undefined) {
		this.reflectString("target", value);
	}

	get external(): boolean {
		return this.target === "_blank";
	}

	private get showExternalIcon(): boolean {
		const attr = this.getAttribute("external-icon");
		if (attr === "false") return false;
		if (attr === "true" || attr === "") return true;
		return this.external;
	}

	attributeChangedCallback(): void {
		if (this.root.firstChild) this.render();
	}

	private warnIfHrefless(): void {
		if (this.href === null) {
			console.warn(
				"xtyle-link: no `href` provided. Rendering inert text — set an `href` so it behaves and announces as a link.",
			);
		}
	}

	private get bindings(): Record<string, unknown> {
		return {
			variant: this.variant,
			href: this.href,
			target: this.target,
			rel: this.getAttribute("rel"),
			showExternalIcon: this.showExternalIcon,
		};
	}

	/** A signature of the state ops can't express incrementally — the tag (`href` → `<a>` vs `<span>`),
	 * the presence of structural children (the external icon and the new-tab screen-reader hint), and the
	 * `target`/`rel` values (the update hook can only set attributes, never remove them, so a dropped
	 * `target`/`rel` must rebuild). When it changes, the structure is rebuilt rather than patched. */
	private shapeSignature(): string {
		return `${this.href != null}|${this.showExternalIcon}|${this.external}|${this.target}|${this.getAttribute("rel")}`;
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(linkHostCss);
		this.fragment.reshapeIfChanged(this.shapeSignature());
		this.fragment.update(this.bindings);
		this.warnIfHrefless();
	}
}

define("xtyle-link", XtyleLink);
