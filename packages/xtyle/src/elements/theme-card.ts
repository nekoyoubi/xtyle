import { XtyleElement, define, type StyleMode } from "./base.js";
import { FragmentHost, type FragmentIntent } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/theme-card/source.generated.js";
import { themeCardHostCss } from "../markup/index.js";
import type { DeriveOptions, TokenRegister } from "../types.js";

type Scheme = "light" | "dark";

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
 * A preview of a theme: it derives an invocation the same way `<xtyle-theme-scope>` does, but paints
 * the result instead of applying it, so a theme can be shown without the page wearing it.
 *
 * What it draws is a *fake* — a small simulated UI in the theme's own colors, which reads a palette
 * faster than a row of chips does. That drawing lives entirely in the component's fill, so a mod can
 * redraw the fake into whatever preview its app wants without touching the element.
 *
 * `interactive` makes it a real button that emits `select`, which is what a picker listens to.
 */
export class XtyleThemeCard extends XtyleElement {
	private applied: TokenRegister | null = null;
	private resolvedScheme: Scheme | null = null;
	private failure: string | null = null;
	private pending = 0;

	protected override get styleMode(): StyleMode {
		return "auto";
	}

	static get observedAttributes(): string[] {
		return ["algorithm", "knobs", "constraints", "scheme", "name", "interactive", "selected"];
	}

	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "theme-card", {
		context: (handler) => (handler === "select" ? this.selectContext() : undefined),
		applyIntent: (intent) => this.applyIntent(intent),
	});

	get algorithm(): string {
		return this.getAttribute("algorithm") ?? "xtyle-default";
	}
	set algorithm(value: string) {
		this.setAttribute("algorithm", value);
	}

	get name(): string | null {
		return this.getAttribute("name");
	}
	set name(value: string | null | undefined) {
		this.reflectString("name", value);
	}

	get scheme(): Scheme | null {
		const pinned = this.getAttribute("scheme");
		if (pinned === "light" || pinned === "dark") return pinned;
		return this.resolvedScheme;
	}
	set scheme(value: Scheme | null | undefined) {
		this.reflectString("scheme", value);
	}

	get interactive(): boolean {
		return this.hasAttribute("interactive");
	}
	set interactive(value: boolean) {
		this.reflectBoolean("interactive", value);
	}

	get selected(): boolean {
		return this.hasAttribute("selected");
	}
	set selected(value: boolean) {
		this.reflectBoolean("selected", value);
	}

	/** The register this card previewed, or `null` before a derivation lands or after one fails. */
	get register(): TokenRegister | null {
		return this.applied;
	}

	private get options(): DeriveOptions {
		return {
			knobs: parseJson(this.getAttribute("knobs")),
			constraints: parseJson(this.getAttribute("constraints")),
		} as DeriveOptions;
	}

	attributeChangedCallback(name: string): void {
		if (!this.root.firstChild) return;
		if (name === "interactive" || name === "selected" || name === "name") {
			this.paint();
			return;
		}
		void this.derive();
	}

	private selectContext(): { name: string | null; algorithm: string; scheme: Scheme | null } {
		return { name: this.name, algorithm: this.algorithm, scheme: this.scheme };
	}

	private applyIntent(intent: FragmentIntent): void {
		if (!intent.emit) return;
		this.dispatchEvent(
			new CustomEvent(intent.emit.type, { bubbles: true, composed: true, detail: intent.emit.detail }),
		);
	}

	private get bindings(): Record<string, unknown> {
		return {
			name: this.name,
			algorithm: this.algorithm,
			scheme: this.resolvedScheme,
			register: this.applied,
			selected: this.selected,
			interactive: this.interactive,
			error: this.failure,
		};
	}

	private shapeSignature(): string {
		return `${this.interactive}|${!!this.name}|${!!this.failure}`;
	}

	private paint(): void {
		this.fragment.reshapeIfChanged(this.shapeSignature());
		this.fragment.update(this.bindings);
	}

	private async derive(): Promise<void> {
		const ticket = ++this.pending;
		const requested = this.getAttribute("scheme");
		const wanted = requested === "light" || requested === "dark" ? requested : null;
		try {
			const [{ derive }, { getAlgorithm }, { schemeOf }] = await Promise.all([
				import("../index.js"),
				import("@xtyle/core/algorithms"),
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

			this.applied = register;
			this.resolvedScheme = scheme === "light" ? "light" : "dark";
			this.failure = null;
		} catch (error) {
			if (ticket !== this.pending) return;
			this.applied = null;
			this.resolvedScheme = null;
			this.failure = error instanceof Error ? error.message : String(error);
		}
		this.paint();
		this.dispatchEvent(
			new CustomEvent("xtyle:theme-card", {
				detail: { scheme: this.resolvedScheme, register: this.applied, error: this.failure },
				bubbles: true,
				composed: true,
			}),
		);
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(themeCardHostCss);
		this.paint();
		void this.derive();
	}
}

define("xtyle-theme-card", XtyleThemeCard);
