interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
	toggle(selector: string, condition: boolean): void;
	setText(selector: string, text: string): void;
	addClass(selector: string, className: string): void;
	removeClass(selector: string, className: string): void;
}

interface MarkdownBindings {
	/** The rendered body, already HTML. Built by the element from the author's markdown — raw author
	 * HTML is escaped to text before it ever gets here, unless the element was told otherwise. */
	html?: string;
	inline?: boolean;
	editable?: boolean;
	editing?: boolean;
	/** Whether that body carries the author's own HTML — the `allow-html` case. Marks the body rather
	 * than changing it: what landed there came from the source rather than from the renderer's closed
	 * token set, and a fill that reshapes the body should carry the mark with it. */
	allowHtml?: boolean;
}

interface EventPayload {
	value?: string;
}

interface Intent {
	toggleEditing?: boolean;
	value?: string;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: MarkdownBindings, ops: OpsBuilder) => void) => void };
};
declare const xript: { exports: { register(name: string, fn: (...args: unknown[]) => unknown): void } };

/**
 * The edit chrome is chrome this component invents: nothing in the author's markup corresponds to the
 * source box or the switch, so a mod is the only way to change them and they have to be real nodes
 * here rather than something the element conjures.
 *
 * They are also **built only when `editable`**, not merely hidden. A hidden textarea per label is dead
 * weight where the inline mode is used in bulk — a tab strip of forty labels would carry forty of
 * them — and it puts the toggle's text into the host's `textContent`, so reading a label back gives
 * you "…Edit". Nothing to hide if nothing is built.
 *
 * That is why this renders from `mount` rather than `update`: `replaceChildren` on a live textarea
 * would destroy it, taking the caret and the focus with it on the very keystroke that triggered the
 * paint. The element re-mounts on the `editable` flip via `reshapeIfChanged`, so the structure
 * changes exactly when the structure changes and every other update patches around it.
 *
 * The rendered body arrives as an `html` binding and lands with `replaceChildren`, the same way the
 * code component takes Prism's output: the body is the author's content transformed, not furniture,
 * so there is nothing here to enumerate — and no fill could enumerate arbitrary markdown anyway.
 */
function chrome(b: MarkdownBindings): string {
	if (!b.editable) return "";
	const pressed = String(!!b.editing);
	return (
		`<xtyle-textarea class="xtyle-markdown__editor" part="editor" data-editor label="Markdown source" mono rows="8" spellcheck="false"${b.editing ? "" : " hidden"}></xtyle-textarea>` +
		`<span class="xtyle-markdown__controls" part="controls" data-controls>` +
		`<xtyle-button class="xtyle-markdown__toggle" part="toggle" variant="subtle" size="xs" data-toggle aria-pressed="${pressed}">${b.editing ? "Done" : "Edit"}</xtyle-button>` +
		`</span>`
	);
}

/** The cheap half: everything a running component changes without changing its shape. */
function patch(b: MarkdownBindings, ops: OpsBuilder): void {
	if (b.inline) ops.addClass("[data-root]", "xtyle-markdown--inline");
	else ops.removeClass("[data-root]", "xtyle-markdown--inline");
	ops.replaceChildren("[data-body]", b.html ?? "");
	ops.setAttr("[data-body]", "data-allow-html", b.allowHtml ? "true" : "");
	ops.toggle("[data-body]", !b.editing);
	ops.toggle("[data-editor]", !!b.editing);
	ops.setAttr("[data-toggle]", "aria-pressed", String(!!b.editing));
	ops.setText("[data-toggle]", b.editing ? "Done" : "Edit");
}

hooks.fragment.mount("markdown", (b, ops) => {
	ops.replaceChildren("[data-chrome]", chrome(b));
	patch(b, ops);
});

hooks.fragment.update("markdown", patch);

xript.exports.register("toggleEdit", (): Intent => ({ toggleEditing: true }));

/** The textarea is the source of truth while editing; hand each keystroke back so the element can
 * re-render and emit. The value is author *markdown*, not HTML — it goes back through the renderer. */
xript.exports.register("editInput", (payload: unknown): Intent => {
	const e = payload as EventPayload;
	return { value: e.value ?? "" };
});
