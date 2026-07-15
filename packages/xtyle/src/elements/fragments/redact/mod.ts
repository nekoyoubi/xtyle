interface OpsBuilder {
	setAttr(selector: string, attr: string, value: string): void;
	setText(selector: string, text: string): void;
}

interface RedactBindings {
	mode?: string;
	reveal?: string;
	revealed?: boolean;
	/** Whether a reveal trigger is wired — false only for `never`, whose cover is inert. */
	interactive?: boolean;
	/** The blur radius, already in px (`8px`); null leaves the CSS default that scales with the text. */
	blur?: string | null;
	/** Custom hint text for the cover; null keeps the default eye glyph the markup ships. */
	cue?: string | null;
	showCue?: boolean;
	/** The cover's accessible name, phrased for the current state (`Reveal SSN` / `Hide SSN`). */
	coverLabel?: string;
	/** Whether the obscured content is hidden from assistive tech until it is revealed. */
	contentHidden?: boolean;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: RedactBindings, ops: OpsBuilder) => void) => void };
};

function rootClass(b: RedactBindings): string {
	const mode = b.mode ?? "blur";
	const reveal = b.reveal ?? "hover";
	return ["xtyle-redact", `xtyle-redact--${mode}`, `xtyle-redact--reveal-${reveal}`, b.revealed && "xtyle-redact--revealed"]
		.filter(Boolean)
		.join(" ");
}

function paint(b: RedactBindings, ops: OpsBuilder): void {
	const interactive = b.interactive !== false;
	ops.setAttr(".xtyle-redact", "class", rootClass(b));

	ops.setAttr("[data-rd-content]", "style", b.blur != null ? `--redact-blur: ${b.blur}` : "");
	ops.setAttr("[data-rd-content]", "aria-hidden", b.contentHidden === true ? "true" : "");

	ops.setAttr("[data-rd-cover]", "aria-label", b.coverLabel ?? "");
	ops.setAttr("[data-rd-cover]", "disabled", interactive ? "" : "disabled");
	ops.setAttr("[data-rd-cover]", "tabindex", interactive ? "" : "-1");
	ops.setAttr("[data-rd-cover]", "aria-hidden", interactive ? "" : "true");

	// only overwrite the default eye glyph when a cue text is actually named
	if (b.cue != null) ops.setText("[data-rd-cue]", b.cue);
	ops.setAttr("[data-rd-cue]", "hidden", b.showCue === true ? "" : "hidden");
}

hooks.fragment.mount("redact", (bindings, ops) => {
	paint(bindings, ops);
});

hooks.fragment.update("redact", (bindings, ops) => {
	paint(bindings, ops);
});
