import { escapeHtml } from "./escape.js";

/**
 * BBCode → HTML, over a closed tag vocabulary.
 *
 * The security story is the same one `markup/markdown.ts` tells, and BBCode tells it more easily:
 * there is no raw-HTML passthrough in the format at all, so there is no `allowHtml` counterpart and
 * nothing to lift. Everything in the source that is not a *registered tag* is escaped to text, and
 * every tag emits markup this module wrote from its own template. What reaches the DOM is therefore
 * always markup a renderer generated itself, from a bounded set — which is the property that makes
 * the general "sanitize arbitrary HTML" problem never arise, rather than get solved.
 *
 * Two places still need a real check, because they are the two places a *value* the author wrote
 * lands inside an attribute:
 *
 * - **URLs** (`[url]`, `[img]`, `[email]`) go through the shared `safeUrl`, the same allowlist
 *   markdown uses. One implementation, so the two can't drift.
 * - **Style values** (`[color]`, `[size]`, `[font]`, `[bg]`) are matched against narrow patterns
 *   rather than escaped. Escaping is not enough here: `red;background:url(…)` survives attribute
 *   escaping intact and is still a second declaration. A value that does not match its pattern is
 *   dropped and the tag renders unstyled.
 *
 * ## Vocabularies
 *
 * A tag being *registered* does not make it reachable. A **vocabulary** is a named subset, and every
 * render names one; a tag outside it is inert and renders as its literal text. That is what lets one
 * app accept `[choice]` in a story body and refuse it in an author bio without running two renderers
 * or filtering afterward — the bio simply has no such tag, so refusal is structural rather than a
 * check somebody has to remember to write.
 *
 * DOM-free and environment-neutral, so the SSR binding and the browser element render identically.
 */

/** What a tag handler receives. `content` is already rendered HTML unless the tag asked for `raw`. */
export interface BbcodeTagContext {
	/** The `=value` form: `[url=https://x]` gives `https://x`. Null when the tag was opened bare. */
	value: string | null;
	/** The named-attribute form: `[quote author="ada" post="3"]`. Empty when none were written. */
	attrs: Readonly<Record<string, string>>;
	/** The tag's body. HTML, already rendered from the inner tags — or the untouched source text,
	 * escaped, when the tag declared `raw`. */
	content: string;
}

export interface BbcodeTag {
	/** Lowercase tag name, without brackets. */
	name: string;
	/** Emit the markup. Everything returned is trusted, so a handler must escape whatever it
	 * interpolates that did not come from `content`. */
	render(context: BbcodeTagContext): string;
	/**
	 * Take the body as literal text rather than parsing tags inside it. `[code]` and `[noparse]`
	 * need this; nothing else should. The body still gets escaped before it reaches the handler.
	 */
	raw?: boolean;
	/** No closing tag: `[hr]`, `[br]`. */
	void?: boolean;
	/**
	 * The tag emits block-level markup. Only consequential when composed into markdown, where a
	 * placeholder standing alone in a paragraph is unwrapped so a `<blockquote>` does not end up
	 * inside a `<p>` — which is markup no browser will keep.
	 */
	block?: boolean;
	/** One line, for the docs and the reference table. */
	description?: string;
}

const registry = new Map<string, BbcodeTag>();
const vocabularies = new Map<string, Set<string>>();

/** The vocabulary a render uses when it doesn't name one: every built-in tag. */
export const DEFAULT_VOCABULARY = "default";

/**
 * Add tags to the registry.
 *
 * Registration is app-wide and additive; composing them into something reachable is
 * `defineBbcodeVocabulary`'s job. Re-registering a name replaces it, which is how an app or a mod
 * reskins a built-in rather than having to fork the roster.
 */
export function registerBbcodeTags(tags: readonly BbcodeTag[]): void {
	for (const tag of tags) registry.set(tag.name.toLowerCase(), tag);
	announce();
}

/** Things to tell when the registry or the vocabularies change. */
const watchers = new Set<() => void>();

/**
 * Be told when the roster changes, so anything already painted can paint again.
 *
 * Registration is app configuration and element upgrade is a script-order accident, so requiring the
 * first to happen before the second is a race an app cannot reliably win — and the failure is quiet
 * and confusing: the server-rendered markup is right, and a tick later the hydrated element paints a
 * custom tag back to literal text. Repainting on change makes the order stop mattering.
 */
export function onBbcodeRegistryChanged(watcher: () => void): () => void {
	watchers.add(watcher);
	return () => watchers.delete(watcher);
}

function announce(): void {
	for (const watcher of watchers) watcher();
}

/**
 * Name a subset of the registry.
 *
 * The names are resolved at render time rather than here, so a vocabulary may be declared before the
 * tags it lists — which is what lets an app describe its own surfaces up front and let mods fill them
 * in as they load.
 */
export function defineBbcodeVocabulary(name: string, tagNames: readonly string[]): void {
	vocabularies.set(name, new Set(tagNames.map((t) => t.toLowerCase())));
	announce();
}

/** The tag names a vocabulary admits, resolved against what is currently registered. */
export function bbcodeVocabulary(name: string = DEFAULT_VOCABULARY): string[] {
	const set = vocabularies.get(name);
	const names = set ? [...set].filter((t) => registry.has(t)) : [...registry.keys()];
	return names.sort();
}

/** Every vocabulary an app has declared, plus the built-in default. */
export function bbcodeVocabularies(): string[] {
	return [...new Set([DEFAULT_VOCABULARY, ...vocabularies.keys()])].sort();
}

/** Every registered tag, for the reference table and the MCP surface. */
export function bbcodeTags(): BbcodeTag[] {
	return [...registry.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function resolve(vocabulary: string | undefined, inline = false): (name: string) => BbcodeTag | undefined {
	const declared = vocabularies.get(vocabulary ?? DEFAULT_VOCABULARY);
	const admits = declared ? (name: string): boolean => declared.has(name) : (): boolean => true;
	return (name) => {
		if (!admits(name)) return undefined;
		const tag = registry.get(name);
		if (inline && tag?.block) return undefined;
		return tag;
	};
}

export interface BbcodeOptions {
	/** Which vocabulary this render may reach. Defaults to the whole registry. */
	vocabulary?: string;
	/**
	 * How a run of plain text between tags becomes HTML. Defaults to escaping it, which is what keeps
	 * the output a closed vocabulary.
	 *
	 * The composed render passes markdown's inline renderer here, which is the whole of how the two
	 * languages mix: `[quote]some **bold** text[/quote]` gets the quote from BBCode and the emphasis
	 * from markdown, without either renderer having to know about the other. A replacement must still
	 * escape — it is the last thing standing between author text and the DOM.
	 */
	text?: (raw: string) => string;
	/**
	 * Treat a newline in the source as a line break, which is what every forum dialect does and what
	 * an author typing into a textarea expects. Defaults on.
	 *
	 * Off when markdown is composing the render, because there blank lines are already paragraphs and
	 * a second opinion about line handling would double every break.
	 */
	breaks?: boolean;
	/**
	 * Render as a label: block tags are inert and render as their literal text.
	 *
	 * The same promise markdown's inline render makes, and for the same reason. A label is often a
	 * string somebody *else* authored — a forum thread title dropped into a tab strip — and without
	 * this a `[h1]` in it erupts a heading into a row of tabs. Making the tag inert rather than
	 * unwrapping it keeps the author's text visible instead of silently eating it.
	 */
	inline?: boolean;
}

/**
 * An opening or closing tag. Deliberately narrow: a name, an optional `=value`, optional
 * `key="value"` pairs. Anything that doesn't fit — a stray `[`, a smiley, an array index in prose —
 * fails the match and is emitted as text, which is the behavior an author expects from BBCode.
 */
const TAG = /\[(\/)?([a-z*][a-z0-9*-]*)((?:=[^\]]*)?(?:\s+[a-z][a-z0-9-]*="[^"]*")*)\]/gi;

/** Everything below the printable range except tab, newline, and carriage return. */
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g;

interface OpenTag {
	name: string;
	value: string | null;
	attrs: Record<string, string>;
	/** Where this tag's body starts in the source, for `raw` tags that re-read it verbatim. */
	bodyStart: number;
	/** Rendered children accumulated so far. */
	parts: string[];
	/** The literal `[tag]` as written, which is what an unclosed tag renders as. */
	raw: string;
}

function parseArgs(raw: string): { value: string | null; attrs: Record<string, string> } {
	const attrs: Record<string, string> = {};
	let value: string | null = null;
	const named = /([a-z][a-z0-9-]*)="([^"]*)"/gi;
	let rest = raw;
	let match: RegExpExecArray | null;
	while ((match = named.exec(raw)) !== null) {
		attrs[(match[1] as string).toLowerCase()] = match[2] as string;
		rest = rest.replace(match[0], "");
	}
	const eq = rest.indexOf("=");
	if (eq === 0) value = rest.slice(1).trim();
	return { value, attrs };
}

/**
 * Render BBCode to HTML.
 *
 * A single pass with an explicit stack rather than a recursive regex sweep: BBCode nests, and the
 * unclosed and mis-nested cases are the common ones in real author text. An unclosed tag renders as
 * its literal source rather than swallowing the rest of the document, and a stray `[/b]` with no
 * opener is text.
 */
export function renderBbcode(input: string, options?: BbcodeOptions): string {
	if (!input) return "";
	const source = input.replace(CONTROL_CHARS, "");
	const lookup = resolve(options?.vocabulary, options?.inline === true);
	const breaks = options?.breaks ?? true;
	const render = options?.text ?? escapeHtml;
	const text = breaks ? (raw: string): string => render(raw).replace(/\r?\n/g, "<br>") : render;
	const stack: OpenTag[] = [];
	const root: string[] = [];
	const top = (): string[] => (stack.length ? (stack[stack.length - 1] as OpenTag).parts : root);

	let cursor = 0;
	TAG.lastIndex = 0;
	let match: RegExpExecArray | null;

	while ((match = TAG.exec(source)) !== null) {
		const [raw, closing, rawName, rawArgs] = match as unknown as [string, string | undefined, string, string | undefined];
		const name = rawName.toLowerCase();
		const tag = lookup(name);
		if (!tag) continue;

		const openTag = stack.length ? (stack[stack.length - 1] as OpenTag) : null;
		if (openTag && registry.get(openTag.name)?.raw && !(closing && name === openTag.name)) continue;

		top().push(text(source.slice(cursor, match.index)));
		cursor = match.index + raw.length;

		if (closing) {
			let depth = -1;
			for (let i = stack.length - 1; i >= 0; i--) {
				if ((stack[i] as { name: string }).name === name) {
					depth = i;
					break;
				}
			}
			if (depth === -1) {
				top().push(escapeHtml(raw));
				continue;
			}
			while (stack.length - 1 > depth) {
				const orphan = stack.pop() as OpenTag;
				const parent = stack.length ? (stack[stack.length - 1] as OpenTag).parts : root;
				parent.push(escapeHtml(orphan.raw), ...orphan.parts);
			}
			const entry = stack.pop() as OpenTag;
			const current = registry.get(name) as BbcodeTag;
			const content = current.raw
				? escapeHtml(source.slice(entry.bodyStart, match.index))
				: entry.parts.join("");
			top().push(current.render({ value: entry.value, attrs: entry.attrs, content }));
			continue;
		}

		const { value, attrs } = parseArgs(rawArgs ?? "");
		if (tag.void) {
			top().push(tag.render({ value, attrs, content: "" }));
			continue;
		}
		stack.push({ name, value, attrs, bodyStart: cursor, parts: [], raw });
	}

	top().push(text(source.slice(cursor)));
	while (stack.length) {
		const orphan = stack.pop() as OpenTag;
		const parent = stack.length ? (stack[stack.length - 1] as OpenTag).parts : root;
		parent.push(escapeHtml(orphan.raw), ...orphan.parts);
	}
	return breaks ? tidyBreaks(root.join("")) : root.join("");
}

/**
 * Elements that already own their vertical space. A `<br>` pressed against one of these is the
 * newline the author typed to *separate* blocks rather than to break a line inside one, and keeping
 * it stacks a blank line on top of the margin the block already has.
 */
const BLOCKS = "blockquote|ul|ol|li|table|thead|tbody|tr|td|th|details|summary|div|hr|h[1-6]|xtyle-code";

const BREAK_BEFORE_BLOCK = new RegExp(`(?:<br>\\s*)+(?=<(?:${BLOCKS})[\\s>])`, "g");
const BREAK_AFTER_BLOCK = new RegExp(`(?<=</(?:${BLOCKS})>|<hr[^>]*>)(?:\\s*<br>)+`, "g");

/** Drop the breaks that landed on a block seam, where the block's own margin already says "new line". */
function tidyBreaks(html: string): string {
	return html.replace(BREAK_BEFORE_BLOCK, "").replace(BREAK_AFTER_BLOCK, "");
}

/** Whether a tag reachable in this vocabulary emits block-level markup. */
export function isBbcodeBlockTag(name: string, vocabulary?: string): boolean {
	return resolve(vocabulary)(name.toLowerCase())?.block === true;
}

/** An outermost BBCode construct in a source string, and whether it renders as a block. */
export interface BbcodeRegion {
	start: number;
	end: number;
	block: boolean;
}

/**
 * Locate the outermost BBCode constructs in a source, so a composing renderer can lift them out
 * before running a second language over what's left.
 *
 * Only balanced constructs count. An unclosed `[b]` is not a region, because it isn't BBCode — it's
 * text that happens to contain a bracket, and lifting it would hide it from the other renderer.
 *
 * `skip` marks ranges the scan must not look inside — markdown's code spans and fences, where a `[b]`
 * is a thing the author is *writing about* rather than using.
 */
export function scanBbcodeRegions(
	input: string,
	options?: BbcodeOptions & { skip?: readonly (readonly [number, number])[] },
): BbcodeRegion[] {
	const source = input.replace(CONTROL_CHARS, "");
	const lookup = resolve(options?.vocabulary);
	const skip = options?.skip ?? [];
	const guarded = (index: number): boolean => skip.some(([from, to]) => index >= from && index < to);

	const regions: BbcodeRegion[] = [];
	const stack: { name: string; start: number }[] = [];
	TAG.lastIndex = 0;
	let match: RegExpExecArray | null;

	while ((match = TAG.exec(source)) !== null) {
		const [raw, closing, rawName] = match as unknown as [string, string | undefined, string];
		const name = rawName.toLowerCase();
		const tag = lookup(name);
		if (!tag || guarded(match.index)) continue;

		if (stack.length) {
			const open = stack[stack.length - 1] as { name: string; start: number };
			if (registry.get(open.name)?.raw && !(closing && name === open.name)) continue;
		}

		if (closing) {
			let depth = -1;
			for (let i = stack.length - 1; i >= 0; i--) {
				if ((stack[i] as { name: string }).name === name) {
					depth = i;
					break;
				}
			}
			if (depth === -1) continue;
			const opened = stack[depth] as { name: string; start: number };
			stack.length = depth;
			if (depth === 0) {
				regions.push({ start: opened.start, end: match.index + raw.length, block: tag.block === true });
			}
			continue;
		}

		if (tag.void) {
			if (!stack.length) regions.push({ start: match.index, end: match.index + raw.length, block: tag.block === true });
			continue;
		}
		stack.push({ name, start: match.index });
	}
	return regions;
}

/** `inline` flows with the text around it; the block render owns its box. Shared by the element's
 * fragment scaffold and the SSR declarative shadow root. */
export const bbcodeHostCss = ":host { display: block; } :host([inline]) { display: inline; }";
