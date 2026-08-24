import { escapeAttr, escapeHtml } from "./escape.js";
import { allowedSchemes, safeUrl } from "./uri.js";
import { registerBbcodeTags, type BbcodeTag, type BbcodeTagContext } from "./bbcode.js";

/**
 * The built-in tag roster.
 *
 * There is no BBCode standard — no RFC, no spec body — so the baseline here is **phpBB's core set**,
 * which is the closest thing to a common denominator and the one most authors already have in their
 * fingers. Everything beyond it is a declared extension, marked as such below, drawn from where the
 * major dialects agree (vBulletin, XenForo, SMF) rather than from any one of them.
 *
 * Two rules hold across every handler:
 *
 * - `content` arrives already rendered and already escaped. Anything *else* a handler interpolates —
 *   a value, an attribute — it escapes itself.
 * - A value that lands in an attribute is **validated against a pattern, not escaped**. Escaping
 *   `red;background:url(…)` produces a string that is still two CSS declarations. A value that fails
 *   its pattern is dropped and the tag renders unstyled rather than rendering something else.
 */

/**
 * The sentinel `[*]` leaves behind for `[list]` to split on.
 *
 * A NUL rather than a word, and that is the whole security of it: `renderBbcode` strips C0 controls
 * out of the source before parsing, so this is a byte an author *cannot* put into their own text. A
 * readable sentinel would be forgeable: type it inside a `[list]` and get an item nobody wrote. It
 * never reaches the output either way, since `[list]` consumes every one of them.
 */
export const LIST_ITEM_SENTINEL = "\u0000";

/**
 * A color: a hex literal, a bare CSS color keyword, or one of the theme's own token names.
 *
 * Bare-word-or-hex is the whole allowance, and that is what makes it safe — a `;` or a `(` cannot
 * survive the pattern, so the value cannot open a second declaration however it is spelled.
 */
const COLOR = /^(?:#[0-9a-f]{3,8}|[a-z]{3,20})$/i;

/** Theme token names an author may reach by name, so BBCode can ride the derived palette rather than
 * only literal colors. Anything else matching `COLOR` is passed through as a CSS keyword. */
const COLOR_TOKENS = new Set(["accent", "fg", "muted", "positive", "negative", "warning", "info", "neutral"]);

function colorValue(raw: string | null): string | null {
	if (!raw || !COLOR.test(raw)) return null;
	const name = raw.toLowerCase();
	if (COLOR_TOKENS.has(name)) return `var(--${name === "fg" ? "fg-0" : name})`;
	return raw;
}

/** A size: phpBB's 1–7 scale, or an explicit `px`/`%`. Clamped rather than refused, since an author
 * writing `[size=200]` meant "big" and dropping the tag would lose the emphasis entirely. */
const SIZE = /^(\d{1,3})(px|%)?$/;

const SIZE_SCALE = ["--text-xs", "--text-sm", "--text-body", "--text-body", "--text-lg", "--text-xl", "--text-2xl"];

function sizeValue(raw: string | null): string | null {
	if (!raw) return null;
	const match = SIZE.exec(raw.trim());
	if (!match) return null;
	const n = Number(match[1]);
	if (!match[2]) {
		if (n < 1 || n > 7) return null;
		return `var(${SIZE_SCALE[n - 1]})`;
	}
	if (match[2] === "px") return `${Math.min(Math.max(n, 8), 96)}px`;
	return `${Math.min(Math.max(n, 50), 300)}%`;
}

/** Families resolve to the theme's own stacks rather than to arbitrary names: a font an author names
 * is a font the reader probably does not have, and the token is the one that themes. */
const FONTS: Record<string, string> = {
	sans: "var(--font-sans)",
	serif: "var(--font-serif, Georgia, serif)",
	mono: "var(--font-mono)",
};

function styleAttr(declarations: readonly (string | null)[]): string {
	const kept = declarations.filter(Boolean);
	return kept.length ? ` style="${escapeAttr(kept.join(";"))}"` : "";
}

function wrap(tag: string, className: string): (c: BbcodeTagContext) => string {
	return (c) => `<${tag} class="${className}">${c.content}</${tag}>`;
}

/** `[url]` with no value points at its own body, which is then the URL *and* the label. */
function linkHref(c: BbcodeTagContext): { href: string | null; label: string } {
	const bare = c.value === null;
	const target = bare ? stripTags(c.content) : c.value;
	return { href: safeUrl(target, allowedSchemes()), label: c.content };
}

/** A `[url]`'s own body is the URL when none was given, and it has already been rendered — so read
 * the text back out rather than trusting markup to be a href. */
function stripTags(html: string): string {
	return html
		.replace(/<[^>]*>/g, "")
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.trim();
}

const CORE: BbcodeTag[] = [
	{ name: "b", render: wrap("strong", "xtyle-bbcode__b"), description: "Bold." },
	{ name: "i", render: wrap("em", "xtyle-bbcode__i"), description: "Italic." },
	{ name: "u", render: wrap("u", "xtyle-bbcode__u"), description: "Underline." },
	{
		name: "url",
		description: "A link. `[url=https://x]label[/url]`, or `[url]https://x[/url]`.",
		render(c) {
			const { href, label } = linkHref(c);
			if (!href) return label;
			return `<xtyle-link href="${escapeAttr(href)}">${label}</xtyle-link>`;
		},
	},
	{
		name: "img",
		description: "An image. The body is the source; `[img alt=\"…\"]` names it.",
		render(c) {
			const src = safeUrl(stripTags(c.content), allowedSchemes(), true);
			const alt = escapeAttr(c.attrs.alt ?? "");
			if (!src) return "";
			return `<xtyle-image src="${escapeAttr(src)}" alt="${alt}" loading="lazy"></xtyle-image>`;
		},
	},
	{
		name: "email",
		description: "A `mailto:` link.",
		render(c) {
			const address = c.value ?? stripTags(c.content);
			const href = safeUrl(`mailto:${address}`, allowedSchemes());
			if (!href) return c.content;
			return `<xtyle-link href="${escapeAttr(href)}">${c.content}</xtyle-link>`;
		},
	},
	{
		name: "quote",
		block: true,
		description: "A block quote, optionally attributed: `[quote=ada]` or `[quote author=\"ada\"]`.",
		render(c) {
			const who = c.value ?? c.attrs.author ?? null;
			const cite = who ? `<cite class="xtyle-bbcode__cite">${escapeHtml(who)}</cite>` : "";
			return `<blockquote class="xtyle-bbcode__quote">${cite}${c.content}</blockquote>`;
		},
	},
	{
		name: "code",
		raw: true,
		block: true,
		description: "A code block. Delegates to the Code component, so it highlights and themes like one.",
		render(c) {
			const lang = c.value ?? c.attrs.lang ?? null;
			const attr = lang && /^[a-z0-9+#-]{1,20}$/i.test(lang) ? ` language="${escapeAttr(lang)}"` : "";
			return `<xtyle-code${attr}>${c.content}</xtyle-code>`;
		},
	},
	{
		name: "list",
		block: true,
		description: "A list. `[list=1]` numbers it; items are separated by `[*]`.",
		render(c) {
			const ordered = c.value !== null && c.value !== "";
			const items = c.content
				.split(LIST_ITEM_SENTINEL)
				.slice(1)
				.map((item) => `<li class="xtyle-bbcode__li">${item.replace(/^(?:\s|<br>)+|(?:\s|<br>)+$/g, "")}</li>`)
				.join("");
			const tag = ordered ? "ol" : "ul";
			const type = ordered && /^[aAiI1]$/.test(c.value as string) ? ` type="${escapeAttr(c.value as string)}"` : "";
			return `<${tag} class="xtyle-bbcode__list"${type}>${items}</${tag}>`;
		},
	},
	{ name: "*", void: true, render: () => LIST_ITEM_SENTINEL, description: "A list item marker." },
	{
		name: "color",
		description: "Text color: a hex literal, a CSS color keyword, or a theme token such as `accent`.",
		render(c) {
			const color = colorValue(c.value);
			return `<span class="xtyle-bbcode__color"${styleAttr([color && `color:${color}`])}>${c.content}</span>`;
		},
	},
	{
		name: "size",
		description: "Text size: `1`–`7` on the type scale, or an explicit `px` / `%`.",
		render(c) {
			const size = sizeValue(c.value);
			return `<span class="xtyle-bbcode__size"${styleAttr([size && `font-size:${size}`])}>${c.content}</span>`;
		},
	},
];

const EXTENSIONS: BbcodeTag[] = [
	{ name: "s", render: wrap("s", "xtyle-bbcode__s"), description: "Strikethrough." },
	{ name: "strike", render: wrap("s", "xtyle-bbcode__s"), description: "Strikethrough, spelt out." },
	{ name: "sub", render: wrap("sub", "xtyle-bbcode__sub"), description: "Subscript." },
	{ name: "sup", render: wrap("sup", "xtyle-bbcode__sup"), description: "Superscript." },
	{ name: "mark", render: wrap("mark", "xtyle-bbcode__mark"), description: "Highlighted text." },
	{
		name: "font",
		description: "Font family: `sans`, `serif`, or `mono` — the theme's own stacks.",
		render(c) {
			const family = FONTS[(c.value ?? "").toLowerCase()] ?? null;
			return `<span class="xtyle-bbcode__font"${styleAttr([family && `font-family:${family}`])}>${c.content}</span>`;
		},
	},
	{
		name: "bg",
		description: "Background color, same value grammar as `[color]`.",
		render(c) {
			const color = colorValue(c.value);
			return `<span class="xtyle-bbcode__bg"${styleAttr([color && `background-color:${color}`])}>${c.content}</span>`;
		},
	},
	{
		name: "spoiler",
		block: true,
		description: "Click-to-reveal, rendered as a one-section Accordion.",
		render(c) {
			const label = escapeHtml(c.value ?? c.attrs.label ?? "Spoiler");
			return (
				`<xtyle-accordion>` +
				`<span slot="header">${label}</span>` +
				`<div slot="panel">${c.content}</div>` +
				`</xtyle-accordion>`
			);
		},
	},
	{
		name: "noparse",
		raw: true,
		description: "Everything inside stays literal text.",
		render: (c) => c.content,
	},
	{ name: "hr", void: true, block: true, render: () => `<xtyle-separator></xtyle-separator>`, description: "A rule." },
	{ name: "br", void: true, render: () => "<br>", description: "A line break." },
	{
		name: "table",
		block: true,
		description: "A table. Rows are `[tr]`, cells `[td]`, headers `[th]`. `[table=Sales by region]` captions it, which is also how it is announced; a table opened bare is named `Table`.",
		render(c) {
			const caption = c.value ?? c.attrs.caption ?? null;
			return caption
				? `<xtyle-table><table><caption>${escapeHtml(caption)}</caption>${c.content}</table></xtyle-table>`
				: `<xtyle-table><table aria-label="Table">${c.content}</table></xtyle-table>`;
		},
	},
	{ name: "tr", render: (c) => `<tr>${c.content}</tr>`, description: "A table row." },
	{ name: "td", render: (c) => `<td>${c.content}</td>`, description: "A table cell." },
	{ name: "th", render: (c) => `<th>${c.content}</th>`, description: "A header cell." },
];

const ALIGNMENTS = ["left", "center", "right", "justify"] as const;

const ALIGNMENT_TAGS: BbcodeTag[] = ALIGNMENTS.map((how) => ({
	name: how,
	block: true,
	description: `Align a block ${how}.`,
	render: (c: BbcodeTagContext) =>
		`<div class="xtyle-bbcode__align xtyle-bbcode__align--${how}">${c.content}</div>`,
}));

const HEADING_TAGS: BbcodeTag[] = [1, 2, 3, 4, 5, 6].map((level) => ({
	name: `h${level}`,
	block: true,
	description: `A level-${level} heading.`,
	render: (c: BbcodeTagContext) => `<xtyle-heading level="${level}">${c.content}</xtyle-heading>`,
}));

/** phpBB's core set — the tag names an author can assume anywhere. */
export const BBCODE_CORE = CORE.map((t) => t.name);

/** Everything xtyle adds on top, where the major dialects agree. */
export const BBCODE_EXTENSIONS = [...EXTENSIONS, ...ALIGNMENT_TAGS, ...HEADING_TAGS].map((t) => t.name);

registerBbcodeTags([...CORE, ...EXTENSIONS, ...ALIGNMENT_TAGS, ...HEADING_TAGS]);
