interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
	toggle(selector: string, condition: boolean): void;
	setText(selector: string, text: string): void;
	addClass(selector: string, className: string): void;
	removeClass(selector: string, className: string): void;
}

interface BbcodeBindings {
	/** The rendered body, already HTML. Built by the element from the author's BBCode — every tag
	 * came out of a closed registry, and everything else was escaped, before it ever got here. */
	html?: string;
	inline?: boolean;
	editable?: boolean;
	editing?: boolean;
	/** Which vocabulary rendered this body. Marks the body rather than changing it: the same source
	 * renders differently under a narrower vocabulary, and a fill that reshapes the body should be
	 * able to see which one it got. */
	vocabulary?: string;
}

interface EventPayload {
	value?: string;
}

interface Intent {
	toggleEditing?: boolean;
	value?: string;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: BbcodeBindings, ops: OpsBuilder) => void) => void };
};
declare const xript: { exports: { register(name: string, fn: (...args: unknown[]) => unknown): void } };

/**
 * The edit chrome is chrome this component invents: nothing in the author's markup corresponds to the
 * source box or the switch, so a mod is the only way to change them and they have to be real nodes
 * here rather than something the element conjures.
 *
 * Built only when `editable`, and from `mount` rather than `update`, for the same two reasons the
 * markdown fill gives: a hidden textarea per label is dead weight in bulk and leaks "…Edit" into the
 * host's `textContent`, and `replaceChildren` on a live textarea would destroy it mid-keystroke.
 *
 * The rendered body arrives as an `html` binding and lands with `replaceChildren`, the same way the
 * markdown and code fills take theirs: the body is the author's content transformed, not furniture,
 * so there is nothing here to enumerate.
 */
function chrome(b: BbcodeBindings): string {
	if (!b.editable) return "";
	const pressed = String(!!b.editing);
	return (
		`<xtyle-textarea class="xtyle-bbcode__editor" part="editor" data-editor label="BBCode source" mono rows="8" spellcheck="false"${b.editing ? "" : " hidden"}></xtyle-textarea>` +
		`<span class="xtyle-bbcode__controls" part="controls" data-controls>` +
		`<xtyle-button class="xtyle-bbcode__toggle" part="toggle" variant="subtle" size="xs" data-toggle aria-pressed="${pressed}">${b.editing ? "Done" : "Edit"}</xtyle-button>` +
		`</span>`
	);
}

/** The cheap half: everything a running component changes without changing its shape. */
function patch(b: BbcodeBindings, ops: OpsBuilder): void {
	if (b.inline) ops.addClass("[data-root]", "xtyle-bbcode--inline");
	else ops.removeClass("[data-root]", "xtyle-bbcode--inline");
	ops.replaceChildren("[data-body]", b.html ?? "");
	ops.setAttr("[data-body]", "data-vocabulary", b.vocabulary ?? "");
	ops.toggle("[data-body]", !b.editing);
	ops.toggle("[data-editor]", !!b.editing);
	ops.setAttr("[data-toggle]", "aria-pressed", String(!!b.editing));
	ops.setText("[data-toggle]", b.editing ? "Done" : "Edit");
}

hooks.fragment.mount("bbcode", (b, ops) => {
	ops.replaceChildren("[data-chrome]", chrome(b));
	patch(b, ops);
});

hooks.fragment.update("bbcode", patch);

xript.exports.register("toggleEdit", (): Intent => ({ toggleEditing: true }));

/** The textarea is the source of truth while editing; hand each keystroke back so the element can
 * re-render and emit. The value is author *BBCode*, not HTML — it goes back through the renderer. */
xript.exports.register("editInput", (payload: unknown): Intent => {
	const e = payload as EventPayload;
	return { value: e.value ?? "" };
});
