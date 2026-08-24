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

export interface MarkedChild {
	/** Which marker attribute the child carried, without the `data-xtyle-` prefix. */
	marker: string;
	/** The child's lowercased tag name. */
	name: string;
	attrs: Record<string, string>;
	/** The child's inner HTML — already-rendered content, nested components included. */
	html: string;
}

/** Elements with no end tag. Written without the self-closing slash they are indistinguishable from
 * an opening tag, so a child scan has to know them by name or it waits forever for a close that never
 * comes and swallows every sibling after it. */
const VOID = new Set([
	"area",
	"base",
	"br",
	"col",
	"embed",
	"hr",
	"img",
	"input",
	"link",
	"meta",
	"source",
	"track",
	"wbr",
]);

/** Every top-level child of a slot string carrying one of the given `data-xtyle-*` markers, in
 * document order. This is the server-side counterpart of the pairing the collection elements do over
 * live child nodes: the marked children are the author's own, so their content is spliced into the
 * fill's named slots rather than re-rendered. Unmarked children are dropped, matching the element's
 * behavior of only adopting what it can pair. */
export function markedChildren(html: string, markers: readonly string[]): MarkedChild[] {
	const attrNames = markers.map((m) => `data-xtyle-${m}`);
	const out: MarkedChild[] = [];
	let open: Tag | null = null;
	let marker = "";
	let depth = 0;
	for (const tag of scanTags(html)) {
		if (open) {
			if (tag.name !== open.name) continue;
			if (tag.close) {
				depth--;
				if (depth === 0) {
					out.push({ marker, name: open.name, attrs: parseAttrs(open.attrs), html: html.slice(open.end, tag.start) });
					open = null;
				}
			} else if (!tag.selfClosing) depth++;
			continue;
		}
		if (tag.close || tag.selfClosing) continue;
		const attrs = parseAttrs(tag.attrs);
		const hit = attrNames.findIndex((name) => name in attrs);
		if (hit === -1) continue;
		if (VOID.has(tag.name)) {
			out.push({ marker: markers[hit] as string, name: tag.name, attrs, html: "" });
			continue;
		}
		open = tag;
		marker = markers[hit] as string;
		depth = 1;
	}
	return out;
}

/** Elements that carry no rendered surface, so they are never one of a slot's authored children. A
 * framework hoisting a nested component's `<script>` leaves it inline in the slot string it hands
 * back, and callers pair these children positionally. */
const NON_RENDERING = new Set(["script", "style", "link", "meta", "base"]);

/** Every top-level authored element of a slot string, with its inner HTML. Used for the legacy
 * named-slot authoring shape, where the framework has already grouped the children into one slot per
 * role and the marker attributes were consumed on the way.
 *
 * Non-rendering elements are skipped: a nested component's hoisted `<script>` is emitted inline here
 * by a dev server (a production build bundles it out of the markup), and counting it as a child would
 * shift every positional pairing by one and drop the last authored child. A void element yields a
 * childless entry, so an authored `<img>` counts as one child rather than consuming its siblings. */
export function topLevelElements(html: string): MarkedChild[] {
	const out: MarkedChild[] = [];
	let open: Tag | null = null;
	let depth = 0;
	for (const tag of scanTags(html)) {
		if (open) {
			if (tag.name !== open.name) continue;
			if (tag.close) {
				depth--;
				if (depth === 0) {
					if (!NON_RENDERING.has(open.name)) {
						out.push({ marker: "", name: open.name, attrs: parseAttrs(open.attrs), html: html.slice(open.end, tag.start) });
					}
					open = null;
				}
			} else if (!tag.selfClosing) depth++;
		} else if (!tag.close && !tag.selfClosing) {
			if (VOID.has(tag.name)) {
				if (!NON_RENDERING.has(tag.name)) {
					out.push({ marker: "", name: tag.name, attrs: parseAttrs(tag.attrs), html: "" });
				}
				continue;
			}
			open = tag;
			depth = 1;
		}
	}
	return out;
}

/**
 * Pair marked children into `{ lead, body }` records — a header with its panel, a tab with its panel.
 * A lead with no body still yields a pair, so a malformed authoring run degrades to an empty section
 * rather than silently dropping it.
 *
 * Two authoring orders are legitimate and both appear in this repo's own examples: **interleaved**
 * (`tab, panel, tab, panel`, which the manifest samples use) and **grouped** (`tab, tab, panel, panel`,
 * which reads better in a template and is what the site demos use). They need different rules, so the
 * order is detected rather than assumed: every lead preceding every body is grouped and pairs by index;
 * anything else is interleaved and pairs by the body that follows each lead, which is what lets a
 * surplus panel be discarded instead of stealing the next lead's slot.
 *
 * Assuming interleaving is what made the grouped shape fail silently: each lead but the last took a
 * `null` body and the surplus bodies were dropped, so a three-tab set rendered two empty panels and one
 * holding the wrong content — with no error anywhere.
 */
export function markedPairs(
	html: string,
	leadMarker: string,
	bodyMarker: string,
): { lead: MarkedChild; body: MarkedChild | null }[] {
	const children = markedChildren(html, [leadMarker, bodyMarker]);
	let lastLead = -1;
	for (let i = 0; i < children.length; i++) if (children[i]!.marker === leadMarker) lastLead = i;
	const firstBody = children.findIndex((child) => child.marker !== leadMarker);
	const grouped = firstBody === -1 || lastLead < firstBody;
	if (grouped) {
		const leads = children.filter((child) => child.marker === leadMarker);
		const bodies = children.filter((child) => child.marker !== leadMarker);
		return leads.map((lead, i) => ({ lead, body: bodies[i] ?? null }));
	}
	const pairs: { lead: MarkedChild; body: MarkedChild | null }[] = [];
	for (const child of children) {
		if (child.marker === leadMarker) pairs.push({ lead: child, body: null });
		else {
			const last = pairs[pairs.length - 1];
			if (last && last.body === null) last.body = child;
		}
	}
	return pairs;
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

	// INFO: footer cells take footerCell instead of cell/headerCell, so tfoot is lifted out behind a
	// placeholder, decorated separately, and restored after the body is classed
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
