/** Server-side markup surgery over a rendered slot string. The decorator elements reach for the DOM
 * — `querySelectorAll`, `classList.add`, relocating authored nodes — which is exactly what a zero-JS
 * render has no access to. These helpers reproduce the same decoration against the HTML string Astro
 * hands back from `Astro.slots.render()`, so a `static` component emits the markup the upgraded
 * element would have produced. Deliberately small: it recognizes tags, not a document, and it makes
 * the same assumptions the elements do (no nested-table awareness, well-formed closing tags). */

interface Tag {
	name: string;
	close: boolean;
	selfClosing: boolean;
	start: number;
	end: number;
	attrs: string;
}

interface Found {
	attrs: string;
	inner: string;
	start: number;
	end: number;
}

const TAG_START = /^<(\/?)([a-zA-Z][a-zA-Z0-9-]*)/;

/** Walk every tag in the string, skipping comments, doctypes, and any `<` that isn't a tag. Attribute
 * values are quote-aware so a `>` inside one doesn't end the tag early. */
function* scanTags(html: string): Generator<Tag> {
	let i = 0;
	while (i < html.length) {
		const lt = html.indexOf("<", i);
		if (lt === -1) return;
		if (html.startsWith("<!--", lt)) {
			const close = html.indexOf("-->", lt + 4);
			i = close === -1 ? html.length : close + 3;
			continue;
		}
		if (html.startsWith("<!", lt)) {
			const close = html.indexOf(">", lt);
			i = close === -1 ? html.length : close + 1;
			continue;
		}
		const head = TAG_START.exec(html.slice(lt, lt + 64));
		if (!head) {
			i = lt + 1;
			continue;
		}
		let j = lt + head[0].length;
		let quote = "";
		while (j < html.length) {
			const ch = html[j] as string;
			if (quote) {
				if (ch === quote) quote = "";
			} else if (ch === '"' || ch === "'") quote = ch;
			else if (ch === ">") break;
			j++;
		}
		if (j >= html.length) return;
		const attrs = html.slice(lt + head[0].length, j);
		yield {
			name: (head[2] ?? "").toLowerCase(),
			close: head[1] === "/",
			selfClosing: attrs.trimEnd().endsWith("/"),
			start: lt,
			end: j + 1,
			attrs,
		};
		i = j + 1;
	}
}

/** Every element of the given names that isn't already inside one of them, with its inner HTML.
 * Same-name nesting is depth-counted, so a list inside a list item resolves to the outer list. */
function elements(html: string, names: readonly string[]): Found[] {
	const out: Found[] = [];
	let open: Tag | null = null;
	let depth = 0;
	for (const tag of scanTags(html)) {
		if (open) {
			if (tag.name !== open.name) continue;
			if (tag.close) {
				depth--;
				if (depth === 0) {
					out.push({ attrs: open.attrs, inner: html.slice(open.end, tag.start), start: open.start, end: tag.end });
					open = null;
				}
			} else if (!tag.selfClosing) depth++;
		} else if (!tag.close && !tag.selfClosing && names.includes(tag.name)) {
			open = tag;
			depth = 1;
		}
	}
	return out;
}

const ATTR = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", apos: "'" };

function decodeEntities(value: string): string {
	return value.replace(/&(#39|amp|lt|gt|quot|apos);/g, (_, name: string) => ENTITIES[name] ?? _);
}

/** The attributes on a tag, as the element would read them off the DOM node. */
export function parseAttrs(raw: string): Record<string, string> {
	const out: Record<string, string> = {};
	ATTR.lastIndex = 0;
	let match: RegExpExecArray | null;
	while ((match = ATTR.exec(raw)) !== null) {
		const name = (match[1] ?? "").toLowerCase();
		if (name === "/" || name === "") continue;
		out[name] = decodeEntities(match[2] ?? match[3] ?? match[4] ?? "");
	}
	return out;
}

/** The authored `<li>`s of the first top-level `<ol>`/`<ul>` in a slot string — the same list the
 * `timeline` and `steps` elements adopt, split into the attributes and content each event contributes. */
export function listItems(html: string): { attrs: Record<string, string>; html: string }[] {
	const list = elements(html, ["ol", "ul"]).find((found) => !/(^|\s)data-root(\s|=|$)/.test(found.attrs));
	if (!list) return [];
	return elements(list.inner, ["li"]).map((item) => ({ attrs: parseAttrs(item.attrs), html: item.inner }));
}

function withClass(attrs: string, className: string): string {
	const existing = /(\sclass\s*=\s*)("([^"]*)"|'([^']*)')/i.exec(attrs);
	if (!existing) return `${attrs} class="${className}"`;
	const current = existing[3] ?? existing[4] ?? "";
	const merged = current ? `${current} ${className}` : className;
	return attrs.slice(0, existing.index) + `${existing[1]}"${merged}"` + attrs.slice(existing.index + existing[0].length);
}

/** Add a class to every opening tag of the given names, at any depth. */
function addClass(html: string, names: readonly string[], className: string): string {
	const edits: Tag[] = [];
	for (const tag of scanTags(html)) {
		if (!tag.close && names.includes(tag.name)) edits.push(tag);
	}
	let out = html;
	for (let i = edits.length - 1; i >= 0; i--) {
		const tag = edits[i] as Tag;
		const rebuilt = `<${tag.name}${withClass(tag.attrs, className)}>`;
		out = out.slice(0, tag.start) + rebuilt + out.slice(tag.end);
	}
	return out;
}

/** Put a region's content into the empty `data-slot="…"` element a fill rendered for it. The browser
 * path relocates the authored nodes into these same regions after mount; server-side there are no
 * nodes to move, so the content is spliced into the scaffold instead. */
export function fillRegion(html: string, key: string, content: string): string {
	const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const region = new RegExp(`(<([a-zA-Z][\\w-]*)[^>]*\\sdata-slot="${escaped}"[^>]*>)(</\\2>)`);
	return html.replace(region, (_match, open: string, _tag: string, close: string) => `${open}${content}${close}`);
}

const FOOT_TOKEN = "<!--xtyle-tfoot-->";

export interface TableParts {
	table: string;
	head: string;
	body: string;
	row: string;
	cell: string;
	headerCell: string;
	caption: string;
	footerCell: string;
}

/** Apply the part classes `<xtyle-table>` writes onto the authored `<table>` at upgrade. Without this
 * a zero-JS table renders as bare unstyled HTML: every rule in the table stylesheet keys off these
 * classes, and nothing in the markup carries them until the decorator runs. */
export function decorateTable(html: string, parts: TableParts, tableClasses: readonly string[], ariaLabel?: string): string {
	const table = elements(html, ["table"])[0];
	if (!table) return html;

	// The footer's cells take `footerCell` *instead of* `cell` / `headerCell`, so it is lifted out
	// behind a placeholder, decorated on its own terms, and put back once the body has been classed.
	const foot = elements(table.inner, ["tfoot"])[0];
	let working = table.inner;
	let footHtml = "";
	if (foot) {
		footHtml = `<tfoot${foot.attrs}>${addClass(addClass(foot.inner, ["tr"], parts.row), ["td", "th"], parts.footerCell)}</tfoot>`;
		working = table.inner.slice(0, foot.start) + FOOT_TOKEN + table.inner.slice(foot.end);
	}

	working = addClass(working, ["thead"], parts.head);
	working = addClass(working, ["tbody"], parts.body);
	working = addClass(working, ["tr"], parts.row);
	working = addClass(working, ["td"], parts.cell);
	working = addClass(working, ["th"], parts.headerCell);
	working = addClass(working, ["caption"], parts.caption);

	const inner = foot ? working.replace(FOOT_TOKEN, () => footHtml) : working;

	let attrs = table.attrs;
	for (const cls of tableClasses) attrs = withClass(attrs, cls);
	if (ariaLabel && !/\saria-label\s*=/i.test(attrs)) attrs += ` aria-label="${ariaLabel}"`;
	attrs += ' part="table"';

	return html.slice(0, table.start) + `<table${attrs}>${inner}</table>` + html.slice(table.end);
}
