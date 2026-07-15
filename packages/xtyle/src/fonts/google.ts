/**
 * The font-family gate: the one control between an icon name (which can arrive from a shared spec, a mod,
 * or an MCP call) and a URL xtyle hands a user to paste into their own page.
 *
 * The control is a **character-set gate**, not a cleanup pass. A name that survives {@link safeFontFamily}
 * is drawn from `[A-Za-z0-9 ]` and capped at {@link MAX_FONT_FAMILY_LENGTH}, so a URL or an attribute built
 * from it cannot carry a quote to break out of a CSS `url('…')`, a double-quote to break out of an
 * `href="…"`, a `)` to close a `url()` early, a `;` to start a new declaration, an angle bracket to open a
 * tag, or a newline to reach a second line. The gate runs on the name **as written**: collapsing whitespace
 * before validating would launder a newline into a space and admit exactly the name the gate exists to
 * reject.
 *
 * The 1,900-name Google catalogue is deliberately *not* here. Exactness — canonical casing, an honest "no
 * such font", a did-you-mean — is a someone-is-typing-a-name concern, and shipping the list costs every
 * consumer of `@xtyle/core` ~10 KB gzipped on the icon parse path, where it cannot be tree-shaken. Install
 * one with {@link useGoogleFontCatalogue} at the surface where a human types (xtyle.dev's icon builder
 * does) and every function below sharpens; with none installed, the gate still carries the whole security
 * property on its own, and a family it admits that Google does not serve simply yields a stylesheet URL
 * that loads nothing.
 */

/** The longest a family name may be. Google's own longest is under 30 characters. */
export const MAX_FONT_FAMILY_LENGTH = 64;

/**
 * The canonical shape of a family name: `[A-Za-z0-9]` words, single-spaced, no leading or trailing space.
 * Asserted against the live catalogue by `scripts/refresh-google-fonts.mjs`, which refuses to regenerate if
 * Google ever ships a name outside it — so the URL-safety argument above cannot rot silently, which matters
 * more now that the gate, rather than an exact list, is what stands between a name and a URL.
 */
export const SAFE_GOOGLE_FAMILY = /^[A-Za-z0-9]+(?: [A-Za-z0-9]+)*$/;

/** The gate, applied to the raw name before any normalization touches it. */
const SAFE_FAMILY_CHARS = /^[A-Za-z0-9 ]+$/;

/**
 * The gate: a family name reduced to its canonical spacing, or `null` if it carries anything a family name
 * may not.
 *
 * The character check runs on `name` exactly as it arrived; only once it has passed are runs of spaces
 * collapsed. Validating a normalized string instead would let `"Sigmar\nOne"` become the perfectly
 * legitimate `"Sigmar One"`.
 *
 * @param name - A family name, however it was typed.
 * @returns The name with its spacing normalized, or `null` when it is not a legal family name.
 */
export function safeFontFamily(name: string): string | null {
	if (name.length === 0 || name.length > MAX_FONT_FAMILY_LENGTH) return null;
	if (!SAFE_FAMILY_CHARS.test(name)) return null;
	const collapsed = name.replace(/ +/g, " ").trim();
	return SAFE_GOOGLE_FAMILY.test(collapsed) ? collapsed : null;
}

/**
 * The Google Fonts family list, as a surface xtyle can consult when one is installed. Not shipped with the
 * engine; see the module note.
 */
export interface GoogleFontCatalogue {
	/** Every family Google serves, canonically cased. */
	families: readonly string[];
	/** The catalogue's own spelling of a family, or `null` when Google does not serve it. */
	canonical(name: string): string | null;
	/** The families closest to a name that missed — a "did you mean" for a typo. */
	suggest(name: string, limit?: number): string[];
}

let installed: GoogleFontCatalogue | null = null;

/**
 * Install (or, with `null`, remove) the Google Fonts catalogue.
 *
 * With one installed, {@link googleFontFamily} answers exactly — canonical casing, `null` for a family
 * Google does not serve — and {@link suggestGoogleFonts} can offer a near miss. Without one, the gate alone
 * decides, and a legal-but-unknown family resolves to itself.
 */
export function useGoogleFontCatalogue(catalogue: GoogleFontCatalogue | null): void {
	installed = catalogue;
}

/** The installed catalogue, or `null` when the engine is running on the gate alone. */
export function googleFontCatalogue(): GoogleFontCatalogue | null {
	return installed;
}

/**
 * The family a Google Fonts URL will be built for, or `null` when the name cannot have one.
 *
 * With a catalogue installed this is an exact answer: the catalogue's own spelling, so a hand-typed
 * `ibm plex mono` resolves to the real `IBM Plex Mono` (Google's `family=` param is case-sensitive, and
 * capitalizing each word gets `Ibm Plex Mono`, which 404s and silently renders in a fallback face the author
 * never chose), and a family Google does not serve is `null`.
 *
 * With no catalogue it is the {@link safeFontFamily} gate's answer: a legal name resolves to itself, casing
 * and all. The result is URL-safe either way; it is only *correct* — in the sense of actually loading — when
 * the caller spelled a real family the way Google spells it.
 *
 * @param name - A family name, however the user typed it.
 */
export function googleFontFamily(name: string): string | null {
	const safe = safeFontFamily(name);
	if (!safe) return null;
	return installed ? installed.canonical(safe) : safe;
}

/**
 * Whether a family is one Google Fonts serves.
 *
 * Only an installed catalogue can answer this honestly; with none, it degrades to "could a Google URL be
 * built for this name", which is true of any legal name.
 */
export function isGoogleFont(name: string): boolean {
	return googleFontFamily(name) !== null;
}

/**
 * The catalogue families closest to a name that missed, for a "did you mean" — so a typo reads as a typo
 * instead of rendering in a silent fallback face.
 *
 * Returns `[]` when no catalogue is installed; there is nothing to be near.
 *
 * @param name - The family name that failed to match.
 * @param limit - How many suggestions to return.
 */
export function suggestGoogleFonts(name: string, limit = 5): string[] {
	return installed?.suggest(name, limit) ?? [];
}

/**
 * Percent-encodes every byte that is not `[A-Za-z0-9]`.
 *
 * `encodeURIComponent` deliberately leaves `!'()*-._~` untouched — including the single quote and the
 * closing paren, the two characters that break a CSS `url('…')`. A `letter` layer's glyph is an arbitrary
 * character from the icon name, so it reaches the `&text=` param unfiltered; this is what makes it inert.
 */
function strictEncode(value: string): string {
	let out = "";
	for (const byte of new TextEncoder().encode(value)) {
		const ch = String.fromCharCode(byte);
		out += /[A-Za-z0-9]/.test(ch) ? ch : `%${byte.toString(16).toUpperCase().padStart(2, "0")}`;
	}
	return out;
}

/** How a Google Fonts stylesheet URL should be cut. */
export interface GoogleFontUrlOptions {
	/**
	 * Restrict the face to the glyphs actually drawn. Google returns a subset containing only these
	 * characters, which is the difference between a 2 KB embedded font and a 200 KB one — a `letter` layer
	 * draws exactly one glyph.
	 */
	text?: string;
	/** The `display` descriptor. Defaults to `swap`. */
	display?: string;
}

/**
 * The `fonts.googleapis.com/css2` stylesheet URL for a family.
 *
 * Every segment is either one of our own literals, a gate-passed family, or strictly percent-encoded, so the
 * result is provably free of the characters that would let it escape a `url()`, an `href`, or a `<style>`
 * body.
 *
 * @param family - A family name; gated by {@link safeFontFamily}, and canonicalized against the catalogue
 * when one is installed.
 * @throws If the family cannot pass the gate, or an installed catalogue says Google does not serve it.
 */
export function googleFontCssUrl(family: string, opts: GoogleFontUrlOptions = {}): string {
	const canonical = googleFontFamily(family);
	if (!canonical) throw new Error(`not a Google Fonts family: ${JSON.stringify(family)}`);
	const params = [`family=${canonical.split(" ").map(strictEncode).join("+")}`];
	if (opts.text) params.push(`text=${strictEncode(opts.text)}`);
	params.push(`display=${strictEncode(opts.display ?? "swap")}`);
	return `https://fonts.googleapis.com/css2?${params.join("&")}`;
}
