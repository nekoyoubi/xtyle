import { XtyleElement, define, type StyleMode } from "./base.js";
import { markdownHostCss, renderMarkdown, renderMarkdownInline } from "../markup/index.js";
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
 * Fragment-backed: the body lands as an `html` binding, exactly as the code component takes Prism's
 * output, and the edit/view chrome renders through `component.markdown` so a mod owns it.
 */
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
		return ["source", "inline", "editable", "editing"];
	}

	/** The markdown to render. Falls back to the element's own text content. */
	get source(): string {
		const attr = this.getAttribute("source");
		if (attr !== null) return attr;
		if (this.draft !== null) return this.draft;
		// light DOM: the element's `textContent` is the rendered output by now, so read what the host
		// captured out of the light DOM before the scaffold painted — same shape as `code`.
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

	attributeChangedCallback(name: string): void {
		// an authored `source` supersedes whatever was being edited
		if (name === "source") this.draft = null;
		if (this.root.firstChild) this.render();
	}

	/** The rendered body. `inline` picks the renderer, and both refuse to emit author HTML. */
	private get html(): string {
		return this.inline ? renderMarkdownInline(this.source) : renderMarkdown(this.source);
	}

	private get bindings(): Record<string, unknown> {
		return {
			html: this.html,
			inline: this.inline,
			editable: this.editable,
			editing: this.editable && this.editing,
		};
	}

	private applyIntent(intent: FragmentIntent): void {
		if (intent.toggleEditing) this.editing = !this.editing;
		if (typeof intent.value === "string" && intent.value !== this.source) {
			this.draft = intent.value;
			// the authored attribute would otherwise keep winning over what is being typed
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
	 */
	private seedBody(): void {
		const body = this.root.querySelector("[data-body]");
		if (!(body instanceof HTMLElement) || body.firstChild) return;
		body.innerHTML = this.html;
	}
}

define("xtyle-markdown", XtyleMarkdown);
