import { XtyleElement, define, type StyleMode } from "./base.js";
import { codeHostCss, plainCodeHtml, splitCodeLines, parseLineSpec } from "../markup/index.js";
import {
	highlight,
	registerLanguage as registerGrammar,
	resolveLanguage,
	warmLanguages,
} from "./code-highlight.js";
import { FragmentHost } from "./fragment-host.js";
import { wireHostControls } from "./host-controls.js";
import { manifest, fragmentSources } from "./fragments/code/source.generated.js";

/**
 * A read-only, syntax-highlighted code block that colors itself entirely from the
 * `--code-*` token family, so it re-themes live as the theme changes. The source is
 * the element's text content (or a `code` attribute); the language comes from `lang`
 * (aliases resolved, `ts` → `typescript`). At runtime the block paints immediately as
 * plain-but-themed text, then recolors in place once the grammar resolves — same
 * characters, spans just gain color, so there is no layout shift. An unknown language
 * stays at the plain-but-themed render rather than erroring.
 *
 * Grammar loading is fully lazy and per-language; `preload` warms this block's grammar
 * eagerly (and the binding emits a `modulepreload` hint). The `preload` attribute and
 * the static `warm()` share one internal warm path.
 */
export class XtyleCode extends XtyleElement {
	protected override get styleMode(): StyleMode {
		return "auto";
	}

	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "code", {
		applyIntent: () => {},
		afterApply: () => this.armScrollAffordance(),
	});

	private overflowObserver: ResizeObserver | null = null;

	static get observedAttributes(): string[] {
		return ["language", "code", "preload", "copy", "line-numbers", "highlight", "caption"];
	}

	private renderToken = 0;
	private wiredControls = new Set<string>();
	private copyTimer: ReturnType<typeof setTimeout> | undefined;

	/** Page-level warm: eagerly load these languages' grammars now. Shares the `preload` warm path. */
	static warm(langs: string[]): Promise<void> {
		return warmLanguages(langs);
	}

	/** Register a grammar Prism does not ship, making `name` resolvable like any built-in language. */
	static registerLanguage(name: string, grammar: Record<string, unknown>): void {
		registerGrammar(name, grammar);
	}

	get lang(): string {
		return this.getAttribute("language") ?? "";
	}
	set lang(value: string) {
		this.reflectString("language", value);
	}

	get code(): string | null {
		return this.getAttribute("code");
	}
	set code(value: string | null | undefined) {
		this.reflectString("code", value);
	}

	get preload(): boolean {
		return this.hasAttribute("preload");
	}
	set preload(value: boolean) {
		this.reflectBoolean("preload", value);
	}

	/** The copy-to-clipboard button is on by default; set `copy="false"` to drop it. */
	get copy(): boolean {
		return this.getAttribute("copy") !== "false";
	}
	set copy(value: boolean) {
		if (value) this.removeAttribute("copy");
		else this.setAttribute("copy", "false");
	}

	/** Number each line in a gutter that stays put under horizontal scroll. */
	get lineNumbers(): boolean {
		return this.hasAttribute("line-numbers");
	}
	set lineNumbers(value: boolean) {
		this.reflectBoolean("line-numbers", value);
	}

	/** Tint chosen lines with `--code-line-highlight`; a 1-based spec like `2`, `2,4`, or `4-6`. */
	get highlight(): string | null {
		return this.getAttribute("highlight");
	}
	set highlight(value: string | null | undefined) {
		this.reflectString("highlight", value);
	}

	/** A caption header above the block, e.g. a filename; left empty, no header renders. */
	get caption(): string | null {
		return this.getAttribute("caption");
	}
	set caption(value: string | null | undefined) {
		this.reflectString("caption", value);
	}

	attributeChangedCallback(): void {
		if (this.root.firstChild) this.render();
	}

	private get source(): string {
		const fromAttr = this.code;
		if (fromAttr !== null) return fromAttr;
		// light DOM: the element's own `textContent` is now the rendered chrome, so read the raw
		// source the host captured out of the light DOM before the scaffold painted (untrimmed, to
		// preserve the text-content API exactly); fall back to `textContent` before the first paint.
		const captured = this.fragment.slottedNodes("");
		if (captured.length) return captured.map((node) => node.textContent ?? "").join("");
		return this.textContent ?? "";
	}

	/** The line rows, the numbers in their gutter, and the highlight tint are all drawn by the
	 * fragment fill, so the element hands it the raw tokenized source plus the two flags and lets
	 * the fill compose the structure — a mod that restructures the gutter then owns every paint. */
	private get bindings(): Record<string, unknown> {
		return { language: resolveLanguage(this.lang), caption: this.caption, lineNumbers: this.lineNumbers, highlight: this.highlight };
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(codeHostCss);
		const language = resolveLanguage(this.lang);
		const html = plainCodeHtml(this.source);
		this.seedScaffold(html, language);
		this.seedCaption();
		this.fragment.update({ ...this.bindings, html });
		if (this.preload && this.lang) void warmLanguages([this.lang]);
		this.recolor();
		wireHostControls(
			this.root,
			manifest,
			{ "copy-source": { enabled: this.copy, run: () => this.copySource() } },
			this.wiredControls,
		);
		this.armScrollAffordance();
	}

	/** Write the raw source to the clipboard and flash a `Copied` state, reverting after a beat. */
	private async copySource(): Promise<void> {
		const button = this.root.querySelector<HTMLButtonElement>("[data-copy]");
		const label = this.root.querySelector<HTMLElement>("[data-copy-label]");
		if (!button) return;
		try {
			await navigator.clipboard.writeText(this.source);
		} catch {
			return;
		}
		button.dataset.copied = "";
		button.setAttribute("aria-label", "Copied");
		if (label) label.textContent = "Copied";
		if (this.copyTimer) clearTimeout(this.copyTimer);
		this.copyTimer = setTimeout(() => {
			delete button.dataset.copied;
			button.setAttribute("aria-label", "Copy code");
			if (label) label.textContent = "Copy";
		}, 2000);
	}

	/**
	 * Seed the freshly-painted scaffold with themed plain-text source synchronously, so a
	 * client-only (no-DSD) first paint shows fully-populated source immediately rather than
	 * an empty box until the async fragment runtime warms and the mount hook fills it. It runs
	 * the same `splitCodeLines` the fill does, so the placeholder rows sit in the same gutter the
	 * fill's mount will draw and the block doesn't reflow when the runtime lands; the fill's mount
	 * then replaces this wholesale, so a mod's structure — not this seed — is what survives.
	 */
	private seedScaffold(html: string, language: string | null): void {
		const code = this.root.querySelector("[data-code]");
		if (!(code instanceof HTMLElement) || code.firstChild) return;
		// add the highlighter's `language-x` contract class, never assign the whole class attribute: the names
		// on these nodes belong to whichever fill drew them, and writing them from here overwrites a mod's
		const languageClass = `language-${language ?? "none"}`;
		code.classList.add(languageClass);
		const spec = this.highlight ? parseLineSpec(this.highlight) : undefined;
		code.innerHTML = this.lineNumbers || spec ? splitCodeLines(html, spec, this.lineNumbers).html : html;
	}

	/**
	 * Paint the highlighted source once its grammar resolves. The result is driven back
	 * through the same fragment `update` as the plain first paint — so it becomes the
	 * fill's latest applied state and a deferred first-load paint cannot wipe it — rather
	 * than written straight to the DOM where the two paths would race.
	 */
	private recolor(): void {
		const lang = this.lang;
		if (!resolveLanguage(lang)) return;
		const source = this.source;
		const token = ++this.renderToken;
		void highlight(source, lang).then((result) => {
			if (token !== this.renderToken) return;
			if (result.language === null) return;
			this.fragment.update({ ...this.bindings, html: result.html, language: result.language });
		});
	}

	/** Fill the caption header synchronously on first paint, before the async fragment runtime warms. */
	private seedCaption(): void {
		const caption = this.root.querySelector("[data-caption]");
		if (caption instanceof HTMLElement) caption.textContent = this.caption ?? "";
	}

	/** A long line makes the block scroll horizontally, so make it keyboard-reachable only when it
	 * actually overflows. Runs synchronously from `render()` for the first paint, and again from
	 * `afterApply` for a free recheck after each later content update (a recolor, a re-render). */
	private armScrollAffordance(): void {
		const pre = this.root.querySelector<HTMLElement>(".xtyle-code");
		if (!pre) return;
		this.updateScrollAffordance(pre);
		if (typeof ResizeObserver !== "undefined" && !this.overflowObserver) {
			this.overflowObserver = new ResizeObserver(() => this.updateScrollAffordance(pre));
			this.overflowObserver.observe(pre);
		}
	}

	private updateScrollAffordance(pre: HTMLElement): void {
		// A `wrap` block soft-wraps rather than scrolls sideways, so it is never a horizontal scroll region.
		const scrolls = !this.hasAttribute("wrap") && pre.scrollWidth > pre.clientWidth + 1;
		if (scrolls) {
			if (!pre.hasAttribute("tabindex")) pre.setAttribute("tabindex", "0");
		} else if (pre.getAttribute("tabindex") === "0") {
			pre.removeAttribute("tabindex");
		}
	}

	override disconnectedCallback(): void {
		super.disconnectedCallback();
		this.overflowObserver?.disconnect();
		this.overflowObserver = null;
	}
}

define("xtyle-code", XtyleCode);
