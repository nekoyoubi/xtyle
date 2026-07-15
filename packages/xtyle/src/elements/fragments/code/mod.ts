import { splitCodeLines, codeGutterWidth, parseLineSpec } from "../../../markup/code";

interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
}

interface CodeBindings {
	html?: string;
	language?: string | null;
	caption?: string | null;
	lineNumbers?: boolean;
	highlight?: string | null;
}

function escapeCaption(value: string): string {
	return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: CodeBindings, ops: OpsBuilder) => void) => void };
};

// the `language-x` half is Prism's contract, not a name for the node — so the node carries a chrome name of
// its own for the paint to key by, and a mod that renames it owns its own highlighting
function codeClass(b: CodeBindings): string {
	const lang = b.language ?? "none";
	return `xtyle-code__code language-${lang}`;
}

function preClass(b: CodeBindings): string {
	return `xtyle-code ${codeClass(b)}`;
}

function preLabel(b: CodeBindings): string {
	const lang = b.language ?? "none";
	return lang !== "none" ? `${lang} code` : "Code";
}

interface Rendered {
	html: string;
	gutter: string;
}

/**
 * The line gutter is drawn here, not in the element: numbering (and the highlight tint) is chrome
 * the component invents over the author's source, so it renders as real nodes inside the fill — a
 * `.xtyle-code-line__number` per row — which a mod can restyle, relocate, or grow a fold column
 * beside. The row-splitting itself is the shared `splitCodeLines`, so the SSR and browser paints
 * stay byte-identical. Without numbering or a highlight spec the source passes through untouched.
 */
function rendered(b: CodeBindings): Rendered {
	const html = b.html ?? "";
	const spec = b.highlight ? parseLineSpec(b.highlight) : undefined;
	if (!b.lineNumbers && !spec) return { html, gutter: "" };
	const split = splitCodeLines(html, spec, b.lineNumbers === true);
	return { html: split.html, gutter: b.lineNumbers ? `--xtyle-code-gutter: ${codeGutterWidth(split.lines)}` : "" };
}

function paint(bindings: CodeBindings, ops: OpsBuilder): void {
	const out = rendered(bindings);
	ops.setAttr(".xtyle-code", "class", preClass(bindings));
	ops.setAttr("[data-root]", "aria-label", preLabel(bindings));
	ops.setAttr("[data-root]", "style", out.gutter);
	ops.setAttr(".xtyle-code__code", "class", codeClass(bindings));
	ops.replaceChildren("[data-code]", out.html);
	ops.replaceChildren("[data-caption]", bindings.caption ? escapeCaption(bindings.caption) : "");
}

hooks.fragment.mount("code", (bindings, ops) => {
	ops.setAttr("[data-root]", "tabindex", "0");
	paint(bindings, ops);
});

hooks.fragment.update("code", paint);
