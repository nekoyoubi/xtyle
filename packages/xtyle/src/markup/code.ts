import { escapeHtml } from "./escape.js";

export interface CodeMarkupProps {
	/** The canonical language id the markup was tokenized for, or `null` for the plain fallback. */
	language?: string | null;
	/** Pre-rendered inner HTML: `.token.*` spans when highlighted, escaped text for the plain fallback. */
	html: string;
}

/**
 * The host-layout rule for a code block — `block` so it owns its line, like a `<pre>`, and a
 * positioning context so the copy button can anchor to the block's top-right corner.
 */
export const codeHostCss = ":host { display: block; position: relative; }";

export function codeClass(props: CodeMarkupProps): string {
	const lang = props.language ?? "none";
	return `language-${lang}`;
}

/**
 * The single source of a code block's shadow markup. The custom element renders it
 * into its shadow root at runtime; the `@xtyle/astro` binding emits the same string
 * into a declarative shadow root at build (pre-tokenized). The `language-*` class on
 * both `pre` and `code` is what the Prism-mapping CSS keys its container rules off,
 * so the `--code-*` colors apply. `html` is already escaped/tokenized HTML — never
 * raw user text — so it is interpolated verbatim. Pure and DOM-free, safe to import
 * in any environment (SSR included).
 */
export function codeMarkup(props: CodeMarkupProps): string {
	const cls = codeClass(props);
	return (
		`<pre part="pre" class="xtyle-code ${cls}"><code part="code" class="${cls}">${props.html}</code></pre>` +
		`<button part="copy" class="xtyle-code-copy" type="button" data-copy aria-label="Copy code" hidden>` +
		`<span class="xtyle-code-copy-label" data-copy-label>Copy</span></button>`
	);
}

/** Escape raw source for the plain-but-themed first paint, before any grammar resolves. */
export function plainCodeHtml(code: string): string {
	return escapeHtml(code);
}

function closeTagFor(openTag: string): string {
	const name = /^<\s*([a-z0-9-]+)/i.exec(openTag)?.[1] ?? "span";
	return `</${name}>`;
}

/**
 * Wrap each logical line of already-tokenized (or escaped-plain) code HTML in a
 * `.xtyle-code-line` row so a CSS counter can number it and a `highlight` set can tint
 * chosen lines. Tag-aware: a token span that straddles a newline (a block comment, a
 * multi-line string) is closed at the line end and re-opened on the next line, so each
 * row's markup is well-formed. The line's content is nested in a `__text` cell — the flex
 * sibling of the counter gutter — so it wraps cleanly under soft-wrap while the gutter
 * stays put. Any 1-based line number in `highlight` gets a `data-line-highlight` attribute
 * the CSS tints. A single trailing newline is dropped so a file ending in `\n` reads as N
 * lines, not N+1; an empty line keeps a zero-width space so its row still has height. Pure
 * and DOM-free — safe on the SSR path. `html` is already escaped/tokenized, never raw user text.
 */
export function splitCodeLines(html: string, highlight?: ReadonlySet<number>): { html: string; lines: number } {
	const open: string[] = [];
	const rows: string[] = [];
	let row = "";
	for (const part of html.split(/(<[^>]+>)/g)) {
		if (!part) continue;
		if (part[0] === "<") {
			row += part;
			if (part[1] === "/") open.pop();
			else if (part[part.length - 2] !== "/") open.push(part);
			continue;
		}
		const segments = part.split("\n");
		for (let i = 0; i < segments.length; i++) {
			row += segments[i];
			if (i < segments.length - 1) {
				row += open.map(closeTagFor).reverse().join("");
				rows.push(row);
				row = open.join("");
			}
		}
	}
	rows.push(row);
	if (rows.length > 1 && rows[rows.length - 1] === "") rows.pop();
	return {
		html: rows
			.map((r, i) => `<span class="xtyle-code-line"${highlight?.has(i + 1) ? " data-line-highlight" : ""}><span class="xtyle-code-line__text">${r || "\u200b"}</span></span>`)
			.join(""),
		lines: rows.length,
	};
}

/** The gutter width that fits a block's largest line number, with a little breathing room. */
export function codeGutterWidth(lines: number): string {
	return `${Math.max(2, String(lines).length) + 0.5}ch`;
}

/**
 * Parse a line-highlight spec (`"2"`, `"2,4"`, `"4-6"`, `"1,3-5,8"`) into a set of 1-based
 * line numbers. Whitespace is ignored, a reversed range (`6-4`) reads either way, and any
 * non-numeric or zero/negative entry is skipped rather than thrown — a hand-typed spec
 * degrades to whatever lines it could name. Pure and DOM-free.
 */
export function parseLineSpec(spec: string): Set<number> {
	const lines = new Set<number>();
	for (const part of spec.split(",")) {
		const trimmed = part.trim();
		if (!trimmed) continue;
		const range = /^(\d+)\s*-\s*(\d+)$/.exec(trimmed);
		if (range) {
			const lo = Math.min(Number(range[1]), Number(range[2]));
			const hi = Math.max(Number(range[1]), Number(range[2]));
			for (let n = lo; n <= hi; n++) if (n > 0) lines.add(n);
			continue;
		}
		const single = Number(trimmed);
		if (Number.isInteger(single) && single > 0) lines.add(single);
	}
	return lines;
}
