import { XtyleElement, define, type StyleMode } from "./base.js";
import { codeHostCss, plainCodeHtml, splitCodeLines, codeGutterWidth, parseLineSpec } from "../markup/index.js";
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
	});

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

	/** Number each line in a counter gutter that stays put under horizontal scroll. */
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

	/**
	 * Wrap each line into rows when numbering or highlighting is on — tagging the highlighted
	 * ones and, when numbering, sizing the gutter to the block's largest line number so it never
	 * clips or floats; otherwise pass the source through and drop the gutter override. Both the
	 * wrapped markup and the line count come from one `splitCodeLines` call, so the gutter width
	 * can never drift from the rows it labels.
	 */
	private withLines(html: string): string {
		const spec = this.highlight ? parseLineSpec(this.highlight) : undefined;
		if (!this.lineNumbers && !spec) {
			this.style.removeProperty("--xtyle-code-gutter");
			return html;
		}
		const split = splitCodeLines(html, spec);
		if (this.lineNumbers) this.style.setProperty("--xtyle-code-gutter", codeGutterWidth(split.lines));
		else this.style.removeProperty("--xtyle-code-gutter");
		return split.html;
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(codeHostCss);
		const language = resolveLanguage(this.lang);
		const html = this.withLines(plainCodeHtml(this.source));
		this.seedScaffold(html, language);
		this.seedCaption();
		this.fragment.update({ html, language, caption: this.caption });
		if (this.preload && this.lang) void warmLanguages([this.lang]);
		this.recolor();
		wireHostControls(
			this.root,
			manifest,
			{ "copy-source": { enabled: this.copy, run: () => this.copySource() } },
			this.wiredControls,
		);
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
	 * an empty box until the async fragment runtime warms and the mount hook fills it. The
	 * async `update` then upgrades an already-populated block.
	 */
	private seedScaffold(html: string, language: string | null): void {
		const code = this.root.querySelector("[data-code]");
		if (!(code instanceof HTMLElement) || code.firstChild) return;
		const languageClass = `language-${language ?? "none"}`;
		code.className = languageClass;
		code.innerHTML = html;
		const pre = this.root.querySelector("[data-root]");
		if (pre instanceof HTMLElement) pre.className = `xtyle-code ${languageClass}`;
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
			this.fragment.update({ html: this.withLines(result.html), language: result.language, caption: this.caption });
		});
	}

	/** Fill the caption header synchronously on first paint, before the async fragment runtime warms. */
	private seedCaption(): void {
		const caption = this.root.querySelector("[data-caption]");
		if (caption instanceof HTMLElement) caption.textContent = this.caption ?? "";
	}
}

define("xtyle-code", XtyleCode);
