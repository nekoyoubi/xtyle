import { XtyleElement, define, type StyleMode } from "./base.js";
import { markdownHostCss, renderMarkdown, renderMarkdownInline, type MarkdownOptions } from "../markup/index.js";
import { onBbcodeRegistryChanged } from "../markup/bbcode.js";
import { FragmentHost, type FragmentIntent } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/markdown/source.generated.js";

/**
 * Render markdown into themed HTML.
 *
 * The source is the element's text content (or a `source` attribute). `inline` switches to a
 * label-shaped render — emphasis, code, links, no blocks — which is what a tab title or a chip
 * wants: a generated label that opens with `# ` stays text instead of erupting an `<h1>` in a tab
 * strip. `editable` adds a source view, which the fill draws.
 *
 * **There is no sanitizer, and that is the design.** `renderMarkdown` escapes raw HTML to text and
 * writes URLs from an allowlist, so what lands in `[data-body]` is only ever markup marked generated
 * itself. The `html` binding is therefore never author HTML — see `markup/markdown.ts`, which is
 * where the whole security surface lives and where it stays.
 *
 * `allow-html` lifts the escaping for a source whose origin the app controls. It is not a hole: the
 * body still reaches the DOM through the fragment op, so the format declared in `component-host.json`
 * has the last word and refuses scripts, handlers, and undeclared elements regardless. What it buys
 * is standard HTML and xtyle's own components inside a document. The attribute is spelt out in the
 * markup because it is not a mode the element can infer, and the body carries `data-allow-html` so
 * the choice is visible where the markup landed.
 *
 * Fragment-backed: the body lands as an `html` binding, exactly as the code component takes Prism's
 * output, and the edit/view chrome renders through `component.markdown` so a mod owns it.
 */

/**
 * Every connected instance, so a later registry change can repaint them.
 *
 * App configuration and custom-element upgrade race by nature: a page that registers its tags in one
 * module script and loads the components in another has no way to guarantee which runs first, and
 * losing that race is quiet — the server-rendered markup is right, and the hydrated element paints a
 * custom tag back to literal text a tick later. Repainting on change makes the order stop mattering.
 */
const live = new Set<XtyleMarkdown>();

onBbcodeRegistryChanged(() => {
	for (const el of live) {
		if (el.isConnected && el.processBbcode !== false) el.repaint();
	}
});

export class XtyleMarkdown extends XtyleElement {
	protected override get styleMode(): StyleMode {
		return "auto";
	}

	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "markdown", {
		applyIntent: (intent) => this.applyIntent(intent),
		afterApply: () => this.syncEditor(),
	});

	/** The live source while editing: the textarea owns the text, and this mirrors it so a re-render
	 * doesn't reach back into the DOM for it. Null until an edit happens, so the authored source wins
	 * until the user actually changes something. */
	private draft: string | null = null;
	private captured: string | null = null;

	static get observedAttributes(): string[] {
		return ["source", "inline", "editable", "editing", "allow-html", "process-bbcode"];
	}

	/** The markdown to render. Falls back to the element's own text content. */
	get source(): string {
		const attr = this.getAttribute("source");
		if (attr !== null) return attr;
		if (this.draft !== null) return this.draft;
		if (this.captured !== null) return this.captured;
		const slotted = this.fragment.slottedNodes("");
		if (slotted.length) {
			this.captured = slotted.map((node) => node.textContent ?? "").join("");
			return this.captured;
		}
		return this.textContent ?? "";
	}
	set source(value: string) {
		this.draft = null;
		this.reflectString("source", value);
	}

	/** Render as a label rather than a document: no blocks, no paragraph wrapper. */
	get inline(): boolean {
		return this.hasAttribute("inline");
	}
	set inline(value: boolean) {
		this.reflectBoolean("inline", value);
	}

	/** Offer a source view the reader can switch to. */
	get editable(): boolean {
		return this.hasAttribute("editable");
	}
	set editable(value: boolean) {
		this.reflectBoolean("editable", value);
	}

	/** Whether the source view is showing. Only meaningful while `editable`. */
	get editing(): boolean {
		return this.hasAttribute("editing");
	}
	set editing(value: boolean) {
		this.reflectBoolean("editing", value);
	}

	/**
	 * Render the source's HTML instead of escaping it to text.
	 *
	 * For markdown whose origin the app controls — bundled release notes, a document the app wrote.
	 * The fragment format still has the last word, so `<script>`, event handlers, and elements outside
	 * xtyle's declared vocabulary are refused either way; what this admits is standard HTML and xtyle's
	 * own components, which is what makes a document able to carry an `<xtyle-badge>`.
	 */
	get allowHtml(): boolean {
		return this.hasAttribute("allow-html");
	}
	set allowHtml(value: boolean) {
		this.reflectBoolean("allow-html", value);
	}

	/**
	 * Also process BBCode, so one document can carry both languages.
	 *
	 * Valueless (`process-bbcode`) reaches the whole BBCode registry; a value names a vocabulary,
	 * which is how one surface accepts a tag another refuses. The two renders compose by staying out
	 * of each other's way — see `markup/markdown.ts` — so this widens what renders without widening
	 * what is reachable: BBCode has no raw-HTML passthrough, and every tag it emits came from a
	 * closed registry.
	 */
	get processBbcode(): boolean | string {
		const value = this.getAttribute("process-bbcode");
		if (value === null) return false;
		return value === "" ? true : value;
	}
	set processBbcode(value: boolean | string) {
		if (value === false) this.removeAttribute("process-bbcode");
		else this.setAttribute("process-bbcode", value === true ? "" : value);
	}

	override connectedCallback(): void {
		live.add(this);
		super.connectedCallback();
	}

	override disconnectedCallback(): void {
		live.delete(this);
		super.disconnectedCallback();
	}

	/** Re-run the paint from outside, for a registry change the element has no other way to notice. */
	repaint(): void {
		if (this.root.firstChild) this.render();
	}

	attributeChangedCallback(name: string): void {
		if (name === "source") this.draft = null;
		if (this.root.firstChild) this.render();
	}

	/** The rendered body. `inline` picks the renderer; both refuse to emit author HTML unless the
	 * element was told, in its own markup, to let it through. */
	private get html(): string {
		const options: MarkdownOptions = { allowHtml: this.allowHtml, processBbcode: this.processBbcode };
		return this.inline ? renderMarkdownInline(this.source, options) : renderMarkdown(this.source, options);
	}

	private get bindings(): Record<string, unknown> {
		return {
			html: this.html,
			inline: this.inline,
			editable: this.editable,
			editing: this.editable && this.editing,
			allowHtml: this.allowHtml,
		};
	}

	private applyIntent(intent: FragmentIntent): void {
		if (intent.toggleEditing) this.editing = !this.editing;
		if (typeof intent.value === "string" && intent.value !== this.source) {
			this.draft = intent.value;
			if (this.hasAttribute("source")) this.setAttribute("source", intent.value);
			else this.render();
			this.dispatchEvent(new CustomEvent("input", { bubbles: true, detail: { source: intent.value } }));
		}
	}

	/**
	 * A textarea's text is a property, not an attribute, so no fill op can set it — `value` is what the
	 * user typed and the markup's child text is only its default. The element seeds it instead, and
	 * only when it differs, because assigning to a focused textarea drops the caret to the end.
	 */
	private syncEditor(): void {
		const editor = this.root.querySelector<HTMLTextAreaElement>("[data-editor]");
		if (!editor) return;
		const source = this.source;
		if (editor.value !== source) editor.value = source;
	}

	protected template(): string {
		return "";
	}

	/** Whether the edit chrome exists at all — the one thing the patch ops can't express, since the
	 * fill *builds* the source box rather than hiding it. Flipping `editable` rebuilds; everything
	 * else patches, which is what keeps a live textarea (and the caret in it) intact while typing. */
	private shapeSignature(): string {
		return String(this.editable);
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(markdownHostCss);
		this.fragment.reshapeIfChanged(this.shapeSignature());
		this.seedBody();
		this.fragment.update(this.bindings);
		this.syncEditor();
	}

	/**
	 * Paint the body synchronously on first render, before the async fragment runtime warms — so a
	 * client-created element shows its content immediately rather than an empty box. The fill's mount
	 * then replaces this wholesale, so a mod's structure is what survives, not this seed.
	 *
	 * **It skips the paint entirely while `allow-html` is set.** This assignment is the one path that
	 * never meets the fragment format's vocabulary, and `innerHTML` is enough to fire an `<img onerror>`,
	 * so the fill replacing it a tick later would be a tick too late.
	 */
	private seedBody(): void {
		const body = this.root.querySelector("[data-body]");
		if (!(body instanceof HTMLElement) || body.firstChild || this.allowHtml) return;
		body.innerHTML = this.html;
	}
}

define("xtyle-markdown", XtyleMarkdown);
