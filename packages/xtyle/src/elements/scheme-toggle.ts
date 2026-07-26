import { XtyleElement, define, type StyleMode } from "./base.js";
import "./button.js";
import "./icon.js";
import { schemeToggleGlyphs, schemeToggleHostClass } from "../markup/index.js";
import { escapeAttr } from "./fragments/escape.js";

type Scheme = "light" | "dark";

/** A theme scope the toggle can drive instead of the document — any ancestor exposing this shape. */
interface SchemeHost extends HTMLElement {
	scheme: Scheme;
	toggleScheme(): void;
}

function isSchemeHost(el: Element | null): el is SchemeHost {
	return !!el && typeof (el as Partial<SchemeHost>).toggleScheme === "function";
}

/** Fired on the toggle (bubbling, composed) whenever the scheme flips, so a standalone page can react
 * without a theme scope. `detail.scheme` is the scheme now in effect. */
export const SCHEME_CHANGE_EVENT = "xtyle:scheme-change";

/**
 * A dark/light toggle. It *is* an `<xtyle-button>` (icon-only, ghost) — it reaches for the button
 * rather than reinventing a control — that swaps a sun/moon glyph and flips the scheme on click.
 * Inside an `<xtyle-theme-scope>` it drives the scope (which re-derives the active theme through the
 * engine's inversion); standalone it flips `:root[data-scheme]`, persists the choice, and fires
 * {@link SCHEME_CHANGE_EVENT}. `light-icon` / `dark-icon` swap the glyphs for any named xtyle icon,
 * and `reverse` shows the mode you're *in* rather than the one you'd switch to.
 */
export class XtyleSchemeToggle extends XtyleElement {
	private wired = false;

	protected override get styleMode(): StyleMode {
		return "inherit";
	}

	static get observedAttributes(): string[] {
		return ["scheme", "label", "light-icon", "dark-icon", "icon-size", "reverse", "variant", "size"];
	}

	get scheme(): Scheme {
		return this.pinnedScheme() ?? this.documentScheme();
	}
	set scheme(value: Scheme) {
		this.setAttribute("scheme", value);
	}

	get reverse(): boolean {
		return this.hasAttribute("reverse");
	}
	set reverse(value: boolean) {
		this.reflectBoolean("reverse", value);
	}

	get lightIcon(): string | null {
		return this.getAttribute("light-icon");
	}
	set lightIcon(value: string | null | undefined) {
		this.reflectString("light-icon", value);
	}

	/** The glyph's size, independent of the control's own. A toolbar often wants a large glyph in a
	 * small chrome-free control, which the button's `size` cannot express on its own. */
	get iconSize(): string | null {
		return this.getAttribute("icon-size");
	}
	set iconSize(value: string | null | undefined) {
		this.reflectString("icon-size", value);
	}

	get darkIcon(): string | null {
		return this.getAttribute("dark-icon");
	}
	set darkIcon(value: string | null | undefined) {
		this.reflectString("dark-icon", value);
	}

	get label(): string | null {
		return this.getAttribute("label");
	}
	set label(value: string | null | undefined) {
		this.reflectString("label", value);
	}

	private get storageKey(): string {
		return this.getAttribute("storage-key") ?? "xtyle.scheme";
	}

	private get scopeHost(): SchemeHost | null {
		const host = this.closest("xtyle-theme-scope");
		return isSchemeHost(host) ? host : null;
	}

	/** The scheme something authoritative decided for this toggle: an explicit `scheme`, or the scope
	 * that owns it. `null` when neither applies, which is the case the glyph resolves from the
	 * document instead. */
	private pinnedScheme(): Scheme | null {
		const pinned = this.getAttribute("scheme");
		if (pinned === "light" || pinned === "dark") return pinned;
		return this.scopeHost?.scheme ?? null;
	}

	/**
	 * What the document is rendering. `data-effective-scheme` wins over `data-scheme` because the two
	 * answer different questions: `data-scheme` is what the visitor asked this toggle for, while an
	 * applied theme carries its own scheme regardless of that preference. Reading the request would
	 * leave a light theme under a "dark" preference offering to switch to light.
	 */
	private documentScheme(): Scheme {
		if (typeof document === "undefined") return "dark";
		const root = document.documentElement;
		const effective = root.getAttribute("data-effective-scheme");
		if (effective === "light" || effective === "dark") return effective;
		return root.getAttribute("data-scheme") === "light" ? "light" : "dark";
	}

	attributeChangedCallback(name: string): void {
		if (!this.wired) return;
		if (name === "scheme" || name === "reverse") {
			this.updateHostClass();
			return;
		}
		this.innerHTML = this.template();
		this.updateHostClass();
	}

	/**
	 * Stamp a scheme class only for an explicitly pinned `scheme`. Everything else stays `--auto` and
	 * resolves in CSS from the nearest `data-effective-scheme` — the owning scope's, or the document's.
	 *
	 * A scope's scheme is deliberately *not* stamped here even though it is authoritative. Stamping it
	 * takes a snapshot, and a scope re-derives whenever its invocation changes, so the class would go
	 * stale the moment a picker swapped a light theme for a dark one and the glyph would keep offering
	 * the mode it already had. Reading it through the cascade costs nothing and never goes stale.
	 */
	private updateHostClass(): void {
		const attr = this.getAttribute("scheme");
		const pinned = attr === "light" || attr === "dark" ? attr : null;
		this.classList.add("xtyle-scheme-toggle");
		this.classList.toggle("xtyle-scheme-toggle--auto", pinned === null);
		this.classList.toggle("xtyle-scheme-toggle--light", pinned === "light");
		this.classList.toggle("xtyle-scheme-toggle--dark", pinned === "dark");
		this.classList.toggle("xtyle-scheme-toggle--reverse", this.reverse);
	}

	private flip(): void {
		const scope = this.scopeHost;
		if (scope) {
			scope.toggleScheme();
			this.updateHostClass();
			return;
		}
		this.setStandaloneScheme(this.scheme === "light" ? "dark" : "light");
	}

	/** Standalone (no scope): drive `:root[data-scheme]`, persist, and announce the change. Publishes
	 * `data-effective-scheme` too — with no theme layer to say otherwise, what was asked for is what
	 * renders, and a listener that applies a theme with its own scheme corrects it afterwards. */
	private setStandaloneScheme(next: Scheme): void {
		if (typeof document !== "undefined") {
			const root = document.documentElement;
			if (next === "light") root.setAttribute("data-scheme", "light");
			else root.removeAttribute("data-scheme");
			root.setAttribute("data-effective-scheme", next);
		}
		try {
			localStorage.setItem(this.storageKey, next);
		} catch {
			/* private mode / quota — best-effort persistence */
		}
		this.updateHostClass();
		this.dispatchEvent(
			new CustomEvent(SCHEME_CHANGE_EVENT, { detail: { scheme: next }, bubbles: true, composed: true }),
		);
	}

	protected template(): string {
		const variant = this.getAttribute("variant") ?? "ghost";
		const size = this.getAttribute("size");
		const label = this.label ?? "Toggle light and dark mode";
		const sizeAttr = size ? ` size="${escapeAttr(size)}"` : "";
		const name = escapeAttr(label);
		return (
			`<xtyle-button icon-only variant="${escapeAttr(variant)}"${sizeAttr} aria-label="${name}" title="${name}">` +
			schemeToggleGlyphs({ lightIcon: this.lightIcon, darkIcon: this.darkIcon, iconSize: this.iconSize }) +
			`</xtyle-button>`
		);
	}

	private hasComposedButton(): boolean {
		return [...this.children].some((child) => child.tagName === "XTYLE-BUTTON");
	}

	protected override render(): void {
		if (!this.hasComposedButton()) this.innerHTML = this.template();
		this.updateHostClass();
		if (!this.wired) {
			this.wired = true;
			this.addEventListener("click", () => this.flip());
		}
	}
}

define("xtyle-scheme-toggle", XtyleSchemeToggle);
