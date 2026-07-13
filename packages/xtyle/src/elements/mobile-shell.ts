import { XtyleElement, define, type StyleMode } from "./base.js";
import { mobileShellHostCss } from "../markup/index.js";
import { FragmentHost } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/mobile-shell/source.generated.js";

/**
 * The touch-app counterpart to `app-shell`: a sticky app bar, one scrollable content column, and a
 * bottom nav within thumb reach. Deliberately a separate frame rather than `app-shell` made
 * responsive — desktop-IDE chrome (a resizable left/main/right body) and touch-app chrome are
 * different interaction models, not one layout at two widths.
 *
 * Fragment-backed like its desktop sibling: the shell renders its own chrome, so a mod can reshape
 * the frame the same way it can reshape `app-shell`.
 */
export class XtyleMobileShell extends XtyleElement {
	protected override get styleMode(): StyleMode {
		return "auto";
	}

	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "mobile-shell", {
		applyIntent: () => {},
	});

	static get observedAttributes(): string[] {
		return ["heading", "main-id"];
	}

	/** The bar's title. Named `heading` rather than `title`, which `HTMLElement` already owns (the
	 * native tooltip), so setting one could never quietly mean the other. */
	get heading(): string {
		return this.getAttribute("heading") ?? "";
	}
	set heading(value: string) {
		if (value) this.setAttribute("heading", value);
		else this.removeAttribute("heading");
	}

	get mainId(): string {
		const explicit = this.getAttribute("main-id");
		return explicit && explicit.length > 0 ? explicit : "main";
	}

	attributeChangedCallback(): void {
		if (this.root.firstChild) this.render();
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(mobileShellHostCss);
		this.fragment.update({ heading: this.heading, mainId: this.mainId });
	}
}

define("xtyle-mobile-shell", XtyleMobileShell);
