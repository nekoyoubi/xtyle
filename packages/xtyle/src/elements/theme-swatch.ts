import { XtyleElement, define, type StyleMode } from "./base.js";
import "./swatch.js";
import { FragmentHost } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/theme-swatch/source.generated.js";
import { themeSwatchHostCss } from "../markup/index.js";
import type { DeriveOptions, TokenRegister } from "../types.js";

type Scheme = "light" | "dark";

/** The tokens a theme reads by, when the author names none: the two accents, the surface and text
 * the theme sits on, and the four status hues. */
const DEFAULT_TOKENS = [
	"--accent",
	"--accent-2",
	"--bg-0",
	"--fg-0",
	"--success",
	"--warn",
	"--danger",
	"--info",
];

function parseJson(raw: string | null): Record<string, unknown> | undefined {
	if (!raw) return undefined;
	try {
		const parsed: unknown = JSON.parse(raw);
		return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : undefined;
	} catch {
		return undefined;
	}
}

function labelFor(token: string): string {
	return token.replace(/^--/, "").replace(/-/g, " ");
}

/**
 * A theme's palette as a row of chips. It derives an invocation the way `<xtyle-theme-scope>` does
 * and paints the result instead of applying it, so a palette can be shown without the page wearing
 * the theme.
 *
 * It composes `<xtyle-swatch>` for each chip rather than reinventing one, so the chip's dot, label,
 * value readout, and colour-model details all come from that component and a Swatch mod restyles
 * these with it. `tokens` picks which of the derived tokens to show; the row itself renders through
 * this component's own fill, so a mod can restructure it without touching the element.
 */
export class XtyleThemeSwatch extends XtyleElement {
	private derived: TokenRegister | null = null;
	private failure: string | null = null;
	private pending = 0;

	protected override get styleMode(): StyleMode {
		return "auto";
	}

	static get observedAttributes(): string[] {
		return ["algorithm", "knobs", "constraints", "scheme", "tokens", "size", "labels", "details"];
	}

	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "theme-swatch", {
		applyIntent: () => {},
	});

	get algorithm(): string {
		return this.getAttribute("algorithm") ?? "xtyle-default";
	}
	set algorithm(value: string) {
		this.setAttribute("algorithm", value);
	}

	/** The tokens shown, as a comma-separated list. Omit for the default palette read. */
	get tokens(): string[] {
		const raw = this.getAttribute("tokens");
		if (!raw) return DEFAULT_TOKENS;
		const named = raw
			.split(",")
			.map((name) => name.trim())
			.filter(Boolean)
			.map((name) => (name.startsWith("--") ? name : `--${name}`));
		return named.length > 0 ? named : DEFAULT_TOKENS;
	}
	set tokens(value: string[] | string | null | undefined) {
		this.reflectString("tokens", Array.isArray(value) ? value.join(",") : value);
	}

	get size(): string {
		return this.getAttribute("size") ?? "md";
	}
	set size(value: string) {
		this.setAttribute("size", value);
	}

	get labels(): boolean {
		return this.getAttribute("labels") !== "false";
	}
	set labels(value: boolean) {
		this.setAttribute("labels", String(value));
	}

	get details(): boolean {
		return this.hasAttribute("details");
	}
	set details(value: boolean) {
		this.reflectBoolean("details", value);
	}

	/** The register this row was read from, or `null` before a derivation lands or after one fails. */
	get register(): TokenRegister | null {
		return this.derived;
	}

	private get options(): DeriveOptions {
		return {
			knobs: parseJson(this.getAttribute("knobs")),
			constraints: parseJson(this.getAttribute("constraints")),
		} as DeriveOptions;
	}

	attributeChangedCallback(name: string): void {
		if (!this.root.firstChild) return;
		if (name === "tokens" || name === "size" || name === "labels" || name === "details") {
			this.paint();
			return;
		}
		void this.derive();
	}

	private get bindings(): Record<string, unknown> {
		const register = this.derived ?? {};
		const chips = this.tokens
			.map((token) => ({ token, label: labelFor(token), color: register[token] ?? "" }))
			.filter((chip) => chip.color !== "");
		return {
			chips,
			size: this.size,
			labels: this.labels,
			details: this.details,
			error: this.failure,
		};
	}

	private shapeSignature(): string {
		return `${this.tokens.join(",")}|${this.size}|${this.labels}|${this.details}|${!!this.failure}`;
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
			if (wanted) {
				const scheme = (register["--scheme"] as Scheme | undefined) ?? schemeOf(register["--bg-0"] ?? "");
				if (scheme !== wanted) register = derive(algorithm, { ...opts, invert: true });
			}
			if (ticket !== this.pending) return;

			this.derived = register;
			this.failure = null;
		} catch (error) {
			if (ticket !== this.pending) return;
			this.derived = null;
			this.failure = error instanceof Error ? error.message : String(error);
		}
		this.paint();
		this.dispatchEvent(
			new CustomEvent("xtyle:theme-swatch", {
				detail: { register: this.derived, error: this.failure },
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
		this.fragment.ensureScaffold(themeSwatchHostCss);
		this.paint();
		void this.derive();
	}
}

define("xtyle-theme-swatch", XtyleThemeSwatch);
