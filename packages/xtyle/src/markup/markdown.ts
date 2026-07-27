import { Marked, type RendererObject } from "marked";
import { escapeAttr, escapeHtml } from "./escape.js";
import { allowedSchemes, onUriSchemesChanged, safeUrl } from "./uri.js";
import { renderBbcode, scanBbcodeRegions } from "./bbcode.js";
import "./bbcode-tags.js";

/**
 * Markdown → HTML, rendered so that by default there is nothing to sanitize.
 *
 * A markdown renderer turns untrusted text into markup, which is normally where a sanitizer goes.
 * This one doesn't have one, on purpose: **out of the box it never emits author HTML in the first
 * place.** Raw HTML in the source is escaped into text, and the only URL-bearing attributes are
 * written from an allowlist. What reaches the DOM is therefore always markup `marked` generated
 * itself, from a closed token set — so the general "make arbitrary HTML safe" problem, which is
 * genuinely hard and the reason DOMPurify is the size it is, never arises. The residue is a protocol
 * check, which isn't.
 *
 * The two overrides below are the whole security surface. Both are load-bearing:
 *
 * - **`html`** — marked's default is to pass raw HTML straight through. Escaping the token is what
 *   turns `<script>` and `<img onerror>` into inert text. Lose this and the render is an XSS hole
 *   with no other guard behind it.
 * - **`link` / `image`** — a URL is the one place an author still writes into an attribute, and
 *   `[x](javascript:...)` is markdown, not HTML, so escaping doesn't touch it.
 *
 * ## The two guards are not one decision
 *
 * `allowHtml` lifts the first: the source's HTML is rendered as HTML rather than escaped. It is not
 * the XSS hatch it sounds like, because it is not the last word — a component's body reaches the DOM
 * through a fragment op, and the fragment format declared in `component-host.json` sanitizes it
 * against xtyle's own vocabulary. Script elements, event handlers, and elements nobody declared are
 * refused there no matter what this renderer emits. What survives is standard HTML and xtyle's own
 * components, which is what makes the option worth having.
 *
 * The second guard, the scheme allowlist, is **not** a per-render option, and that is deliberate:
 * this renderer's list and the fragment format's list are two different lists, and the narrower one
 * runs last, in host code, silently. A per-call option here could widen one without the other, which
 * is precisely how `tel:` came to be documented, tested at this layer, and still stripped in the
 * paint. `allowUriSchemes` (from `@xtyle/core/elements`) widens both at once, and nothing widens
 * either without an app asking by name.
 *
 * DOM-free and environment-neutral, so the SSR binding and the browser element render identically.
 */

/** How a render may depart from the safe default. Absent, HTML in the source stays text. */
export interface MarkdownOptions {
	/**
	 * Render the source's HTML instead of escaping it to text.
	 *
	 * For markdown whose origin the app controls — bundled release notes, a document the app wrote,
	 * a local file the user opened. It is still floored by the fragment format's vocabulary when the
	 * result is painted by a component, but this function has no such floor on its own: a caller
	 * putting the returned string into `innerHTML` themselves owns that decision entirely.
	 */
	allowHtml?: boolean;
	/**
	 * Also process BBCode, so one document can carry both languages.
	 *
	 * `true` uses the whole BBCode registry; a string names a vocabulary, which is how one surface
	 * accepts a tag another refuses. See `composeBbcode` below for how the two renders compose —
	 * briefly: BBCode constructs are lifted out before markdown parses, so neither renderer ever
	 * reads the other's output, and prose *inside* a BBCode tag still gets markdown's inline render.
	 */
	processBbcode?: boolean | string;
}

onUriSchemesChanged(() => renderers.clear());

/**
 * Markdown's own code syntax, whose contents are things the author is *writing about*.
 *
 * A `[b]` inside a fence is documentation, not markup, so the BBCode scan has to be blind to these
 * ranges. Fences and inline spans are the realistic cases and the ones markdown itself resolves
 * first; an indented code block is not covered, and an author writing BBCode into one gets it
 * rendered.
 */
const CODE_FENCE = /^([ \t]*)(`{3,}|~{3,})[^\n]*\n[\s\S]*?(?:^\1\2[^\n]*$|$)/gm;
const CODE_SPAN = /(`+)(?:[\s\S]*?[^`])?\1(?!`)/g;

function protectedRanges(source: string): [number, number][] {
	const ranges: [number, number][] = [];
	for (const re of [CODE_FENCE, CODE_SPAN]) {
		re.lastIndex = 0;
		let match: RegExpExecArray | null;
		while ((match = re.exec(source)) !== null) ranges.push([match.index, match.index + match[0].length]);
	}
	return ranges;
}

/**
 * A sentinel no author can forge.
 *
 * The placeholder has to survive markdown untouched, so it is a bare alphanumeric run — anything with
 * punctuation risks being read as emphasis or a link. That makes it *legible*, which makes a fixed
 * one guessable: type it into your own document and get someone else's BBCode rendered where your
 * text was. A per-render GUID closes that, and it never reaches the output, so two renders of the
 * same source still agree byte for byte.
 */
function renderNonce(): string {
	const bytes = new Uint8Array(16);
	if (typeof globalThis.crypto?.getRandomValues === "function") globalThis.crypto.getRandomValues(bytes);
	else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
	return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Render a document that is markdown *and* BBCode.
 *
 * The two languages compose by staying out of each other's way rather than by one learning the
 * other. BBCode's balanced constructs are lifted out and replaced with an opaque placeholder, so
 * markdown never sees a `[quote]` and never gets the chance to escape or reformat it; the BBCode is
 * rendered separately and dropped back in afterward. Prose *inside* a construct is handed markdown's
 * inline renderer through `text`, so `[quote]some **bold** text[/quote]` gets both.
 *
 * Neither renderer ever reads the other's output, which is the property that matters: each still
 * emits only markup it generated itself from its own closed set, so the security posture is exactly
 * the sum of the two and not something new that has to be argued about.
 */
function composeBbcode(
	source: string,
	vocabulary: string | undefined,
	options: MarkdownOptions,
	parse: (markdown: string) => string,
): string {
	const regions = scanBbcodeRegions(source, { vocabulary, skip: protectedRanges(source) });
	if (!regions.length) return parse(source);

	const nonce = renderNonce();
	const key = (i: number): string => `xbb${nonce}x${i}x`;
	const rendered = new Map<string, { html: string; block: boolean }>();

	let out = "";
	let cursor = 0;
	regions.forEach((region, i) => {
		out += source.slice(cursor, region.start);
		const token = key(i);
		rendered.set(token, {
			html: renderBbcode(source.slice(region.start, region.end), {
				vocabulary,
				text: (raw) => renderMarkdownInline(raw, options),
				breaks: false,
			}),
			block: region.block,
		});
		out += token;
		cursor = region.end;
	});
	out += source.slice(cursor);

	let html = parse(out);
	for (const [token, { html: replacement, block }] of rendered) {
		if (block) html = html.replace(new RegExp(`<p>\\s*${token}\\s*</p>`, "g"), () => replacement);
		html = html.replace(token, () => replacement);
	}
	return html;
}

/** The vocabulary a `processBbcode` option names, or undefined when it just says "yes". */
function bbcodeVocabularyFor(option: boolean | string | undefined): string | undefined {
	return typeof option === "string" ? option : undefined;
}

/**
 * A configured `Marked`, scoped rather than the shared singleton.
 *
 * `marked.use()` mutates module-global state. A consumer who also uses marked would inherit our
 * renderer, and — the half that matters — we would inherit theirs, silently replacing the `html`
 * override that is the only thing standing between author input and the DOM. An instance can't be
 * reached from outside this module, so the guarantee holds no matter who else is on the page.
 */
function build(allowHtml: boolean): Marked {
	const allowed = allowedSchemes();
	const renderer: RendererObject = {
		link(token): string {
			const href = safeUrl(token.href, allowed);
			const text = this.parser.parseInline(token.tokens ?? []);
			const title = token.title ? ` title="${escapeAttr(token.title)}"` : "";
			return href ? `<a href="${escapeAttr(href)}"${title}>${text}</a>` : `<a${title}>${text}</a>`;
		},
		image(token): string {
			const src = safeUrl(token.href, allowed, true);
			const alt = escapeAttr(token.text ?? "");
			const title = token.title ? ` title="${escapeAttr(token.title)}"` : "";
			if (!src) return `<img alt="${alt}"${title}>`;
			return `<img src="${escapeAttr(src)}" alt="${alt}"${title} loading="lazy">`;
		},
	};
	if (!allowHtml) {
		renderer.html = (token): string => escapeHtml(typeof token === "string" ? token : token.raw);
	}
	const instance = new Marked({ gfm: true, breaks: false });
	instance.use({ renderer });
	return instance;
}

/**
 * One `Marked` per mode, since building one per render would pay for the renderer override on every
 * paint of every element. Cleared when the scheme registry changes, which is the only other input.
 */
const renderers = new Map<string, Marked>();

function rendererFor(options: MarkdownOptions | undefined): Marked {
	const key = options?.allowHtml === true ? "html" : "escaped";
	let instance = renderers.get(key);
	if (!instance) {
		instance = build(options?.allowHtml === true);
		renderers.set(key, instance);
	}
	return instance;
}

/** The full block render: headings, lists, tables, task lists, code fences, quotes — GFM throughout. */
export function renderMarkdown(source: string, options?: MarkdownOptions): string {
	if (!source.trim()) return "";
	const parse = (markdown: string): string => rendererFor(options).parse(markdown, { async: false }) as string;
	if (!options?.processBbcode) return parse(source);
	const inner: MarkdownOptions = { ...options, processBbcode: undefined };
	return composeBbcode(source, bbcodeVocabularyFor(options.processBbcode), inner, parse);
}

/**
 * The label render: emphasis, code, links, strikethrough — and **no blocks**.
 *
 * This is what a tab title or a chip wants. Block syntax stays literal rather than erupting: a
 * generated label that opens with `# ` renders the text `# Title`, not an `<h1>` inside a tab strip.
 * There is no `<p>` wrapper either, so it drops into a span-shaped slot and inherits its type.
 */
export function renderMarkdownInline(source: string, options?: MarkdownOptions): string {
	if (!source.trim()) return "";
	const parse = (markdown: string): string => rendererFor(options).parseInline(markdown, { async: false }) as string;
	if (!options?.processBbcode) return parse(source);
	const inner: MarkdownOptions = { ...options, processBbcode: undefined };
	return composeBbcode(source, bbcodeVocabularyFor(options.processBbcode), inner, parse);
}

/** `inline` flows with the text around it; the block render owns its box. Shared by the element's
 * fragment scaffold and the SSR declarative shadow root. */
export const markdownHostCss = ":host { display: block; } :host([inline]) { display: inline; }";
