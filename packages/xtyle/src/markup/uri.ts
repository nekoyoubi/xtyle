/**
 * The URL allowlist, shared by every markup renderer xtyle ships.
 *
 * A renderer that turns author text into markup has exactly one place where the author still writes
 * into an attribute, and that is a URL. Markdown gets there through `[x](…)`, BBCode through
 * `[url=…]` and `[img]`; the syntax differs and the decision does not. Keeping one implementation is
 * the point — two copies of a security check drift, and the copy that drifts is the one nobody
 * remembered was a copy.
 *
 * DOM-free and environment-neutral, so the SSR binding and the browser element decide identically.
 */

/**
 * Schemes an app has declared beyond the built-ins, via `allowUriSchemes`.
 *
 * Module state rather than a parameter, because the *other* half of the widening lives in the
 * fragment format's profile and has to stay in step with this one. One registry, set once by the app,
 * read by every renderer.
 */
const appSchemes = new Set<string>();

/** Caches that close over the allowlist and go stale when it widens. */
const invalidators = new Set<() => void>();

/** Register a cache to drop whenever the allowlist changes. A renderer that memoizes anything derived
 * from the scheme set has to say so here, or it will keep refusing what was just allowed. */
export function onUriSchemesChanged(invalidate: () => void): void {
	invalidators.add(invalidate);
}

/**
 * Widen the allowlist. **Not the public entry point** — call `allowUriSchemes` from
 * `@xtyle/core/elements`, which sets this *and* the fragment format that has the last word. Widening
 * only this one produces a URL the renderer emits and the sanitizer then quietly strips.
 */
export function registerUriSchemes(schemes: readonly string[]): void {
	for (const scheme of parseSchemeList(schemes)) appSchemes.add(scheme);
	for (const invalidate of invalidators) invalidate();
}

/** The leading `scheme` of a URL that names one. A URL that names no scheme cannot reach a new
 * origin, so it is the *presence* of one that has to be justified. */
const SCHEME_NAME = /^([a-z][a-z0-9+.-]*):/i;

/** The schemes an author may point a link or image at without saying so. */
export const SAFE_SCHEMES: readonly string[] = ["http", "https", "mailto", "tel"];

/** `//host` names no scheme but still leaves the origin, so it cannot ride the relative allowance. */
const PROTOCOL_RELATIVE = /^\/\//;

/** An image may additionally carry an inline payload, which cannot navigate. Matching the media type
 * rather than bare `data:` is the point — `data:text/html;base64,...` is not an image and stays out. */
const SAFE_IMAGE_DATA = /^data:image\/(?:png|jpe?g|gif|webp|avif)[;,]/i;

/** Characters a URL parser discards but a literal comparison does not: tabs, newlines, and the C0
 * controls. `java\tscript:` resolves as `javascript:` in a browser while matching neither. */
const URL_NOISE = /[\x00-\x20]/g;

/** Every scheme currently permitted: the built-ins plus whatever the app declared. */
export function allowedSchemes(): ReadonlySet<string> {
	return new Set([...SAFE_SCHEMES, ...appSchemes]);
}

/**
 * Decide whether a URL may keep its attribute.
 *
 * Positive, not negative: a relative URL passes, a named scheme must be one we allow, and anything
 * else loses the attribute and keeps its text. A blocklist would have to enumerate `javascript:`,
 * `vbscript:`, `data:text/html`, and every casing and obfuscation of each; this only has to
 * enumerate the schemes that are fine.
 *
 * The scheme is tested against a *normalized copy*, and the **original** is what gets returned:
 * stripping characters out of a legitimate URL would silently rewrite where it points. That is safe
 * in this direction because normalization only ever removes characters — a probe reading `https:`
 * cannot have come from a raw value whose real scheme was something else, since the browser performs
 * the very same removal before resolving it.
 */
export function safeUrl(
	href: string | null | undefined,
	allowed: ReadonlySet<string>,
	allowInlineImage = false,
): string | null {
	if (!href) return null;
	const raw = href.trim();
	if (!raw) return null;
	const probe = raw.replace(URL_NOISE, "");
	if (!probe || PROTOCOL_RELATIVE.test(probe)) return null;
	const scheme = SCHEME_NAME.exec(probe)?.[1];
	if (!scheme) return raw;
	if (allowed.has(scheme.toLowerCase())) return raw;
	if (allowInlineImage && SAFE_IMAGE_DATA.test(probe)) return raw;
	return null;
}

/**
 * A caller's scheme list, normalized to bare lowercase names: `"Asset:"` and `" asset "` are the same
 * decision written two ways, and a set membership test only honors one of them. Sorted so that two
 * spellings of one configuration also share a renderer rather than building a second identical one.
 */
export function parseSchemeList(value: string | readonly string[] | null | undefined): string[] {
	if (!value) return [];
	const list = typeof value === "string" ? value.split(/[,\s]+/) : value;
	const names = list.map((name) => name.trim().replace(/:$/, "").toLowerCase()).filter(Boolean);
	return [...new Set(names)].sort();
}
