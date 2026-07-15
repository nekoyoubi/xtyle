/**
 * The Google Fonts catalogue, installed into `@xtyle/core`.
 *
 * The engine ships only a character-set gate (`[A-Za-z0-9 ]` and a length cap), which is what carries the
 * URL-safety property: a name that cannot hold a quote, a paren, a semicolon, an angle bracket, or a newline
 * cannot break out of a CSS `url()` or an HTML attribute. The 1,900-name list adds a second thing on top of
 * that — exactness — and exactness is only worth its ~10 KB where a *human is typing a family name*. That is
 * here, in the icon builder, and not in a library consumer's bundle.
 *
 * Installed, it gives the engine three things the gate cannot: an autocomplete, the catalogue's own casing
 * (Google's `family=` param is case-sensitive, so a guessed `Ibm Plex Mono` 404s where `IBM Plex Mono`
 * loads), and an honest "Google Fonts has no such family" instead of a snippet that quietly does nothing.
 */

import { SAFE_GOOGLE_FAMILY, useGoogleFontCatalogue, type GoogleFontCatalogue } from "@xtyle/core";
import { GOOGLE_FONT_COUNT, GOOGLE_FONT_FAMILIES } from "./google-fonts.generated";

export { GOOGLE_FONT_COUNT, GOOGLE_FONT_FAMILIES };

const CANONICAL: ReadonlyMap<string, string> = new Map(GOOGLE_FONT_FAMILIES.map((f) => [f.toLowerCase(), f]));

/**
 * A name in the shape the catalogue can be keyed by, or `null`.
 *
 * The engine gates before it ever calls in here, but the catalogue is a public object a caller can hold
 * directly — so it re-runs the same check rather than trusting its caller, and it runs it on the name **as
 * written**. Lowercasing a validated name is safe; validating a *normalized* name is not, because collapsing
 * whitespace first would launder `"Sigmar\nOne"` into the perfectly legitimate `"Sigmar One"`.
 */
function keyable(name: string): string | null {
	return SAFE_GOOGLE_FAMILY.test(name) ? name.toLowerCase() : null;
}

export const googleFonts: GoogleFontCatalogue = {
	families: GOOGLE_FONT_FAMILIES,

	canonical(name: string): string | null {
		const key = keyable(name);
		return key ? (CANONICAL.get(key) ?? null) : null;
	},

	/** Ranked by prefix match, then substring match, then shared-word overlap. */
	suggest(name: string, limit = 5): string[] {
		const needle = keyable(name.replace(/ +/g, " ").replace(/^ | $/g, ""));
		if (!needle) return [];
		const words = new Set(needle.split(" "));
		const scored: { family: string; score: number }[] = [];
		for (const family of GOOGLE_FONT_FAMILIES) {
			const hay = family.toLowerCase();
			let score = 0;
			if (hay.startsWith(needle)) score = 1000 - family.length;
			else if (hay.includes(needle)) score = 500 - family.length;
			else {
				const shared = hay.split(" ").filter((w) => words.has(w)).length;
				if (shared) score = shared * 100 - family.length;
			}
			if (score > 0) scored.push({ family, score });
		}
		return scored
			.sort((a, b) => b.score - a.score || a.family.localeCompare(b.family, "en"))
			.slice(0, limit)
			.map((s) => s.family);
	},
};

/**
 * Hand the catalogue to the engine. Call once, at the top of any surface where a family name is typed;
 * `resolveFontSpec`, `iconFontImports`, `googleFontFamily`, and `suggestGoogleFonts` all sharpen from that
 * point on.
 */
export function installGoogleFonts(): void {
	useGoogleFontCatalogue(googleFonts);
}
