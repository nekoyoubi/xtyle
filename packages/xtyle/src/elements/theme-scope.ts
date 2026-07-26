import { XtyleElement, define, type StyleMode } from "./base.js";
import type { DeriveOptions, TokenRegister } from "../types.js";

type Scheme = "light" | "dark";
type ScopeTarget = "self" | "root";

/** Fired on the scope (bubbling, composed) once a derivation lands, so a surrounding page can mirror
 * the scope's state. `detail.scheme` is the scheme now rendering and `detail.register` the applied
 * tokens; `detail.error` carries the message instead when the invocation could not be derived. */
export const THEME_SCOPE_EVENT = "xtyle:theme-scope";

function parseJson(raw: string | null): Record<string, unknown> | undefined {
	if (!raw) return undefined;
	try {
		const parsed: unknown = JSON.parse(raw);
		return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : undefined;
	} catch {
		return undefined;
	}
}

/**
 * A theme provider: it materializes an *invocation* — a named algorithm plus its knobs and
 * token constraints — and applies the resulting register to a target, so everything beneath it renders
 * on that theme. It draws nothing of its own; the author's children are the content.
 *
 * `target` picks what the derived tokens land on. The default `self` scopes the theme to this
 * element's subtree, which is what makes a themed card or a side-by-side comparison possible;
 * `target="root"` drives `:root` instead, for the one scope that themes a whole page.
 *
 * The scope owns the scheme. It derives the algorithm natively, and when the requested `scheme` is
 * not the one that derivation produced it re-derives with `invert`, so one set of inputs yields
 * both modes through the engine rather than a hand-mirrored guess. An `<xtyle-scheme-toggle>` nested
 * anywhere inside drives the scope through {@link toggleScheme} instead of the document.
 */
export class XtyleThemeScope extends XtyleElement {
	private applied: TokenRegister | null = null;
	private resolvedScheme: Scheme | null = null;
	private pending = 0;

	protected override get styleMode(): StyleMode {
		return "inherit";
	}

	static get observedAttributes(): string[] {
		return ["algorithm", "knobs", "constraints", "scheme", "target"];
	}

	get algorithm(): string {
		return this.getAttribute("algorithm") ?? "xtyle-default";
	}
	set algorithm(value: string) {
		this.setAttribute("algorithm", value);
	}

	get target(): ScopeTarget {
		return this.getAttribute("target") === "root" ? "root" : "self";
	}
	set target(value: ScopeTarget) {
		this.setAttribute("target", value);
	}

	/** The scheme this scope renders. Reads the pinned attribute first, then the scheme the last
	 * derivation actually produced, so a scope with no `scheme` set reports its algorithm's native
	 * mode rather than a guess. */
	get scheme(): Scheme {
		const pinned = this.getAttribute("scheme");
		if (pinned === "light" || pinned === "dark") return pinned;
		return this.resolvedScheme ?? "dark";
	}
	set scheme(value: Scheme) {
		this.setAttribute("scheme", value);
	}

	/** The register applied by the last successful derivation, or `null` before one lands. */
	get register(): TokenRegister | null {
		return this.applied;
	}

	/** Flip between light and dark, re-deriving through the algorithm. */
	toggleScheme(): void {
		this.scheme = this.scheme === "light" ? "dark" : "light";
	}

	private get options(): DeriveOptions {
		return {
			knobs: parseJson(this.getAttribute("knobs")),
			constraints: parseJson(this.getAttribute("constraints")),
		} as DeriveOptions;
	}

	private get applyTarget(): HTMLElement {
		return this.target === "root" ? document.documentElement : this;
	}

	attributeChangedCallback(name: string, previous: string | null, next: string | null): void {
		if (previous === next) return;
		if (name === "target") this.releaseApplied();
		void this.derive();
	}

	private releaseApplied(): void {
		if (!this.applied) return;
		const target = this.applyTarget;
		for (const key of Object.keys(this.applied)) {
			target.style.removeProperty(key.startsWith("--") ? key : `--${key}`);
		}
		target.style.colorScheme = "";
		this.applied = null;
	}

	private announce(detail: Record<string, unknown>): void {
		this.dispatchEvent(new CustomEvent(THEME_SCOPE_EVENT, { detail, bubbles: true, composed: true }));
	}

	/** Derive the invocation and apply it. Re-entrant: a newer call supersedes an in-flight one, so a
	 * burst of attribute changes settles on the last one rather than whichever import resolved last. */
	private async derive(): Promise<void> {
		if (typeof document === "undefined") return;
		const ticket = ++this.pending;
		const requested = this.getAttribute("scheme");
		const wanted = requested === "light" || requested === "dark" ? requested : null;

		try {
			const [{ derive }, { getAlgorithm }, { apply }, { schemeOf }] = await Promise.all([
				import("../index.js"),
				import("@xtyle/core/algorithms"),
				import("../dom.js"),
				import("../color.js"),
			]);
			if (ticket !== this.pending) return;

			const algorithm = getAlgorithm(this.algorithm);
			const opts = this.options;
			let register = derive(algorithm, opts);
			let scheme = (register["--scheme"] as Scheme | undefined) ?? schemeOf(register["--bg-0"] ?? "");
			if (wanted && scheme !== wanted) {
				register = derive(algorithm, { ...opts, invert: true });
				scheme = (register["--scheme"] as Scheme | undefined) ?? schemeOf(register["--bg-0"] ?? "");
			}
			if (ticket !== this.pending) return;

			this.releaseApplied();
			apply(register, { target: this.applyTarget });
			this.applied = register;
			this.resolvedScheme = scheme === "light" ? "light" : "dark";
			this.setAttribute("data-effective-scheme", this.resolvedScheme);
			this.announce({ scheme: this.resolvedScheme, register });
		} catch (error) {
			if (ticket !== this.pending) return;
			this.removeAttribute("data-effective-scheme");
			this.announce({ error: error instanceof Error ? error.message : String(error) });
		}
	}

	protected template(): string {
		return "";
	}

	/** The author's children are the content, so nothing is written into the render root. */
	protected override render(): void {
		void this.derive();
	}

	override disconnectedCallback(): void {
		super.disconnectedCallback();
		this.pending++;
		this.releaseApplied();
	}
}

define("xtyle-theme-scope", XtyleThemeScope);
