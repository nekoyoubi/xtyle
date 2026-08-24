import { XtyleElement, define, type StyleMode } from "./base.js";
import { bbcodeHostCss, onBbcodeRegistryChanged, renderBbcode, type BbcodeOptions } from "../markup/bbcode.js";
import { renderMarkdownInline } from "../markup/markdown.js";
import "../markup/bbcode-tags.js";
import { FragmentHost, type FragmentIntent } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/bbcode/source.generated.js";

/**
 * Render BBCode into themed HTML.
 *
 * The source is the element's text content (or a `source` attribute). `inline` switches to a
 * label-shaped render — no block construct wraps a box around it — which is what a chip or a tab
 * title wants. `editable` adds a source view, which the fill draws.
 *
 * **There is no sanitizer, and unlike markdown there is no `allow-html` either.** BBCode has no
 * raw-HTML passthrough to lift: everything that is not a registered tag is escaped to text, and every
 * tag emits markup the renderer wrote itself. See `markup/bbcode.ts`, which is where the whole
 * security surface lives and where it stays.
 *
 * `vocabulary` names which tags this instance may reach. That is the interesting attribute: the same
 * registry backs every instance, and a vocabulary is a named subset of it, so a story body can admit
 * `[choice]` while an author bio beside it cannot — refusal by construction rather than by filtering
 * afterward. An app declares its vocabularies once with `defineBbcodeVocabulary`; an instance picks
 * one by name.
 *
 * `markdown` additionally runs markdown's inline renderer over the prose *between* tags, so a body
 * can carry `**bold**` and `[color=accent]` at once. The composed block render is the markdown
 * component's `process-bbcode` instead — this is the label-shaped half of the same seam.
 *
 * Fragment-backed: the body lands as an `html` binding, exactly as the markdown component takes its
 * own, and the edit/view chrome renders through `component.bbcode` so a mod owns it.
 */

/**
 * Every connected instance, so a later registry change can repaint them.
 *
 * App configuration and custom-element upgrade race by nature: a page that registers its tags in one
 * module script and loads the components in another has no way to guarantee which runs first, and
 * losing that race is quiet — the server-rendered markup is right, and the hydrated element paints a
 * custom tag back to literal text a tick later. Repainting on change makes the order stop mattering.
 */
const live = new Set<XtyleBbcode>();

onBbcodeRegistryChanged(() => {
	for (const el of live) {
		if (el.isConnected) el.repaint();
	}
});

export class XtyleBbcode extends XtyleElement {
	protected override get styleMode(): StyleMode {
		return "auto";
	}

	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "bbcode", {
		applyIntent: (intent, event) => this.applying(event, () => this.applyIntent(intent)),
		afterApply: () => this.syncEditor(),
	});

	/** The live source while editing: the textarea owns the text, and this mirrors it so a re-render
	 * doesn't reach back into the DOM for it. Null until an edit happens, so the authored source wins
	 * until the user actually changes something. */
	private draft: string | null = null;
	private captured: string | null = null;

	static get observedAttributes(): string[] {
		return ["source", "inline", "editable", "editing", "vocabulary", "markdown"];
	}

	/** The BBCode to render. Falls back to the element's own text content. */
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

	/** Render as a label rather than a document. */
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
	 * Which vocabulary this instance may reach, by name.
	 *
	 * Absent, the whole registry is in play. A name nobody declared also falls back to the whole
	 * registry rather than rendering nothing, so a typo degrades to permissive-and-visible instead of
	 * silently blanking a body — a vocabulary that refuses everything looks exactly like a bug.
	 */
	get vocabulary(): string | null {
		return this.getAttribute("vocabulary");
	}
	set vocabulary(value: string | null) {
		this.reflectString("vocabulary", value ?? "");
	}

	/** Also run markdown's inline render over the prose between tags. */
	get markdown(): boolean {
		return this.hasAttribute("markdown");
	}
	set markdown(value: boolean) {
		this.reflectBoolean("markdown", value);
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

	/** The rendered body. Both modes emit only markup the renderer generated from the registry. */
	private get html(): string {
		const options: BbcodeOptions = { vocabulary: this.vocabulary ?? undefined, inline: this.inline };
		if (this.markdown) options.text = (raw) => renderMarkdownInline(raw);
		return renderBbcode(this.source, options);
	}

	private get bindings(): Record<string, unknown> {
		return {
			html: this.html,
			inline: this.inline,
			editable: this.editable,
			editing: this.editable && this.editing,
			vocabulary: this.vocabulary ?? "",
		};
	}

	private applyIntent(intent: FragmentIntent): void {
		if (intent.toggleEditing) this.editing = !this.editing;
		if (typeof intent.value === "string" && intent.value !== this.source) {
			this.draft = intent.value;
			if (this.hasAttribute("source")) this.setAttribute("source", intent.value);
			else this.render();
			this.emitOwn("input", null, { source: intent.value });
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
	 * fill *builds* the source box rather than hiding it. */
	private shapeSignature(): string {
		return String(this.editable);
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(bbcodeHostCss);
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
	 * Unlike markdown there is no case to skip here: BBCode has no `allow-html`, so this body is
	 * always the renderer's own closed-vocabulary output and never the author's markup.
	 */
	private seedBody(): void {
		const body = this.root.querySelector("[data-body]");
		if (!(body instanceof HTMLElement) || body.firstChild) return;
		body.innerHTML = this.html;
	}
}

define("xtyle-bbcode", XtyleBbcode);
