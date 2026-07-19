import { Marked } from "marked";
import { escapeAttr, escapeHtml } from "./escape.js";

/**
 * Markdown → HTML, rendered so there is nothing to sanitize.
 *
 * A markdown renderer turns untrusted text into markup, which is normally where a sanitizer goes.
 * This one doesn't have one, on purpose: **it never emits author HTML in the first place.** Raw HTML
 * in the source is escaped into text, and the only URL-bearing attributes are written from an
 * allowlist. What reaches the DOM is therefore always markup `marked` generated itself, from a closed
 * token set — so the general "make arbitrary HTML safe" problem, which is genuinely hard and the
 * reason DOMPurify is the size it is, never arises. The residue is a protocol check, which isn't.
 *
 * The two overrides below are the whole security surface. Both are load-bearing:
 *
 * - **`html`** — marked's default is to pass raw HTML straight through. Escaping the token is what
 *   turns `<script>` and `<img onerror>` into inert text. Delete this and the component is an XSS
 *   hole with no other guard behind it.
 * - **`link` / `image`** — a URL is the one place an author still writes into an attribute, and
 *   `[x](javascript:...)` is markdown, not HTML, so escaping doesn't touch it.
 *
 * DOM-free and environment-neutral, so the SSR binding and the browser element render identically.
 */

/** Anything shaped like `scheme:`. A URL that names no scheme cannot reach a new origin, so it is
 * the *presence* of one that has to be justified. */
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

/** The schemes an author may point a link or image at. */
const SAFE_SCHEME = /^(?:https?|mailto|tel):/i;

/** `//host` names no scheme but still leaves the origin, so it cannot ride the relative allowance. */
const PROTOCOL_RELATIVE = /^\/\//;

/** An image may additionally carry an inline payload, which cannot navigate. Matching the media type
 * rather than bare `data:` is the point — `data:text/html;base64,...` is not an image and stays out. */
const SAFE_IMAGE_DATA = /^data:image\/(?:png|jpe?g|gif|webp|avif)[;,]/i;

/** Characters a URL parser discards but a literal comparison does not: tabs, newlines, and the C0
 * controls. `java\tscript:` resolves as `javascript:` in a browser while matching neither. */
const URL_NOISE = /[\x00-\x20]/g;

/**
 * Decide whether a URL may keep its attribute.
 *
 * Positive, not negative: a relative URL passes, a named scheme must be one we allow, and anything
 * else loses the attribute and keeps its text. A blocklist would have to enumerate `javascript:`,
 * `vbscript:`, `data:text/html`, and every casing and obfuscation of each; this only has to
 * enumerate the three schemes that are fine.
 *
 * The scheme is tested against a *normalized copy*, and the **original** is what gets returned:
 * stripping characters out of a legitimate URL would silently rewrite where it points. That is safe
 * in this direction because normalization only ever removes characters — a probe reading `https:`
 * cannot have come from a raw value whose real scheme was something else, since the browser performs
 * the very same removal before resolving it.
 */
function safeUrl(href: string | null | undefined, allowInlineImage = false): string | null {
	if (!href) return null;
	const raw = href.trim();
	if (!raw) return null;
	const probe = raw.replace(URL_NOISE, "");
	if (!probe || PROTOCOL_RELATIVE.test(probe)) return null;
	if (!HAS_SCHEME.test(probe)) return raw;
	if (SAFE_SCHEME.test(probe)) return raw;
	if (allowInlineImage && SAFE_IMAGE_DATA.test(probe)) return raw;
	return null;
}

/**
 * A configured `Marked`, scoped rather than the shared singleton.
 *
 * `marked.use()` mutates module-global state. A consumer who also uses marked would inherit our
 * renderer, and — the half that matters — we would inherit theirs, silently replacing the `html`
 * override that is the only thing standing between author input and the DOM. An instance can't be
 * reached from outside this module, so the guarantee holds no matter who else is on the page.
 */
function build(): Marked {
	const instance = new Marked({ gfm: true, breaks: false });
	instance.use({
		renderer: {
			// the escape hatch that isn't: raw HTML becomes text, never markup
			html(token): string {
				return escapeHtml(typeof token === "string" ? token : token.raw);
			},
			link(token): string {
				const href = safeUrl(token.href);
				const text = this.parser.parseInline(token.tokens ?? []);
				const title = token.title ? ` title="${escapeAttr(token.title)}"` : "";
				return href ? `<a href="${escapeAttr(href)}"${title}>${text}</a>` : `<a${title}>${text}</a>`;
			},
			image(token): string {
				const src = safeUrl(token.href, true);
				const alt = escapeAttr(token.text ?? "");
				const title = token.title ? ` title="${escapeAttr(token.title)}"` : "";
				if (!src) return `<img alt="${alt}"${title}>`;
				return `<img src="${escapeAttr(src)}" alt="${alt}"${title} loading="lazy">`;
			},
		},
	});
	return instance;
}

const renderer = build();

/** The full block render: headings, lists, tables, task lists, code fences, quotes — GFM throughout. */
export function renderMarkdown(source: string): string {
	if (!source.trim()) return "";
	return renderer.parse(source, { async: false }) as string;
}

/**
 * The label render: emphasis, code, links, strikethrough — and **no blocks**.
 *
 * This is what a tab title or a chip wants. Block syntax stays literal rather than erupting: a
 * generated label that opens with `# ` renders the text `# Title`, not an `<h1>` inside a tab strip.
 * There is no `<p>` wrapper either, so it drops into a span-shaped slot and inherits its type.
 */
export function renderMarkdownInline(source: string): string {
	if (!source.trim()) return "";
	return renderer.parseInline(source, { async: false }) as string;
}

/** `inline` flows with the text around it; the block render owns its box. Shared by the element's
 * fragment scaffold and the SSR declarative shadow root. */
export const markdownHostCss = ":host { display: block; } :host([inline]) { display: inline; }";
