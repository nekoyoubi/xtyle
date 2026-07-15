import { afterEach, describe, expect, it } from "vitest";
import {
	MAX_FONT_FAMILY_LENGTH,
	SAFE_GOOGLE_FAMILY,
	googleFontCatalogue,
	googleFontCssUrl,
	googleFontFamily,
	isGoogleFont,
	safeFontFamily,
	suggestGoogleFonts,
	useGoogleFontCatalogue,
	type GoogleFontCatalogue,
} from "../src/fonts/google.js";
import { composeIcon, iconFontImports, resolveFontSpec, resolveIconMark } from "../src/icon-builder.js";
import { escapeAttr, escapeCssUrl } from "../src/markup/escape.js";

/** Every shape that would break out of a CSS `url('…')`, an HTML `href="…"`, or a `<style>` body. */
const HOSTILE = [
	`Sigmar'`,
	`Sigmar"`,
	`Sigmar;`,
	`Sigmar)`,
	`Sigmar');`,
	`Sigmar'); }`,
	`Sigmar');}</style><script>alert(1)</script>`,
	`Sigmar" onload="alert(1)`,
	`Sigmar"><script>alert(1)</script>`,
	`<script>alert(1)</script>`,
	`Sigmar\\`,
	`Sigmar(x)`,
	`Sigmar&family=Evil`,
	`Sigmar\nEvil`,
	`Sigmar\tEvil`,
	`Sigmar\rEvil`,
	`javascript:alert(1)`,
	`Sigmar');@import url('//evil.example/x.css`,
	`Sigmar%27`,
	`Sigmar{}`,
	`Sigmar,serif`,
	`Sigmar/*`,
];

/**
 * The names that *would* launder into a real family if the gate ran after normalization instead of before
 * it. `"Sigmar\nOne"` collapses to `"Sigmar One"`, which Google really does serve — so a sanitize-then-
 * validate pass would hand back a legitimate-looking family for a string carrying a newline.
 */
const LAUNDERABLE = [`Sigmar\nOne`, `Sigmar\tOne`, `Sigmar\rOne`, `SigmarOne`, `Sigmar\fOne`];

/** A stand-in for the real 1,900-name list the site installs; enough to prove the hook, not to ship. */
const STUB: GoogleFontCatalogue = (() => {
	const families = ["IBM Plex Mono", "Noto Sans", "Noto Sans Symbols", "Press Start 2P", "Roboto", "Sigmar", "Sigmar One"];
	const byKey = new Map(families.map((f) => [f.toLowerCase(), f]));
	return {
		families,
		canonical: (name) => (SAFE_GOOGLE_FAMILY.test(name) ? (byKey.get(name.toLowerCase()) ?? null) : null),
		suggest: (name, limit = 5) => {
			if (!SAFE_GOOGLE_FAMILY.test(name)) return [];
			const needle = name.toLowerCase();
			return families.filter((f) => f.toLowerCase().startsWith(needle)).slice(0, limit);
		},
	};
})();

afterEach(() => useGoogleFontCatalogue(null));

describe("the font-family gate", () => {
	it("carries the whole security property on its own: no catalogue, no exceptions", () => {
		expect(googleFontCatalogue()).toBeNull();
		for (const family of HOSTILE) {
			expect(safeFontFamily(family), `expected ${JSON.stringify(family)} to be gated out`).toBeNull();
			expect(googleFontFamily(family)).toBeNull();
			expect(isGoogleFont(family)).toBe(false);
			expect(() => googleFontCssUrl(family)).toThrow(/not a Google Fonts family/);
		}
	});

	it("rejects on the name AS WRITTEN, so a newline cannot launder into a space", () => {
		// the bug this pins: collapse-then-validate turns `Sigmar\nEvil` into the valid `Sigmar Evil`, and
		// `Sigmar\nOne` into a family Google genuinely serves.
		for (const family of LAUNDERABLE) {
			expect(safeFontFamily(family), `expected ${JSON.stringify(family)} to be gated out`).toBeNull();
			expect(resolveFontSpec(family)).toBeNull();
			expect(() => googleFontCssUrl(family)).toThrow();
		}
		// and it stays rejected with the real catalogue behind it, which knows "Sigmar One"
		useGoogleFontCatalogue(STUB);
		for (const family of LAUNDERABLE) {
			expect(googleFontFamily(family)).toBeNull();
			expect(resolveFontSpec(family)).toBeNull();
		}
	});

	it("caps the length, so no name can be long enough to matter", () => {
		const long = "A".repeat(MAX_FONT_FAMILY_LENGTH + 1);
		expect(safeFontFamily(long)).toBeNull();
		expect(safeFontFamily("A".repeat(MAX_FONT_FAMILY_LENGTH))).toBe("A".repeat(MAX_FONT_FAMILY_LENGTH));
		expect(safeFontFamily("")).toBeNull();
		expect(safeFontFamily("   ")).toBeNull();
	});

	it("normalizes spacing only once the name has already passed", () => {
		expect(safeFontFamily("  Noto   Sans  ")).toBe("Noto Sans");
		expect(safeFontFamily("Sigmar")).toBe("Sigmar");
		expect(safeFontFamily("Press Start 2P")).toBe("Press Start 2P");
		// a hyphen is a family-name character, but never a Google one
		expect(safeFontFamily("my-brand-sans")).toBeNull();
	});
});

describe("google fonts URL construction", () => {
	it("builds a css2 URL from gated parts only", () => {
		expect(googleFontCssUrl("Noto Sans Symbols")).toBe("https://fonts.googleapis.com/css2?family=Noto+Sans+Symbols&display=swap");
		expect(googleFontCssUrl("Sigmar", { text: "N" })).toBe("https://fonts.googleapis.com/css2?family=Sigmar&text=N&display=swap");
	});

	it("percent-encodes a hostile glyph in `&text=`, which `encodeURIComponent` would leave armed", () => {
		// a `letter` layer's glyph is one arbitrary character straight out of the icon name, and
		// `encodeURIComponent` leaves `'` and `)` untouched — the two that break a `url('…')`.
		const url = googleFontCssUrl("Sigmar", { text: `');<>"&` });
		expect(url).toContain("text=%27%29%3B%3C%3E%22%26");
		expect(url).not.toMatch(/['")(<>]/);
	});

	it("never lets a hostile family reach a URL at all", () => {
		for (const family of [...HOSTILE, ...LAUNDERABLE]) expect(() => googleFontCssUrl(family)).toThrow(/not a Google Fonts family/);
	});
});

describe("font-family injection", () => {
	it("rejects every hostile family at `resolveFontSpec` — the gate, not a cleanup pass", () => {
		for (const family of [...HOSTILE, ...LAUNDERABLE]) {
			expect(resolveFontSpec(family), `expected ${JSON.stringify(family)} to be rejected`).toBeNull();
		}
	});

	it("still resolves the legitimate shapes it always did", () => {
		expect(resolveFontSpec("sigmar")).toBe("Sigmar");
		expect(resolveFontSpec("noto+sans+symbols")).toBe("Noto Sans Symbols");
		expect(resolveFontSpec("display")).toBe("var(--font-display)");
		// a self-hosted family the engine has never heard of is still a legal literal — it just gets no snippet
		expect(resolveFontSpec("my+brand+sans")).toBe("My Brand Sans");
		expect(resolveFontSpec("my-brand-sans")).toBe("My-brand-sans");
	});

	it("drops a hostile `---f` flag at parse, falling back to the theme font", () => {
		const attack = resolveIconMark(`--letter-N---f-sigmar');}</style><script>alert(1)</script>`);
		expect(attack).not.toBeNull();
		expect(attack!.composition.fonts).toBeUndefined();
		const svg = composeIcon(attack!.composition);
		expect(svg).not.toContain("<script");
		expect(svg).not.toContain("alert(1)");
		expect(svg).toContain('font-family="var(--font-sans)"');
	});

	it("escapes the snippets even for a family forced past the gate, so nothing rides a `fonts` map", () => {
		// `resolveFontSpec` cannot produce these, but `IconComposition.fonts` is a public field a caller
		// could populate directly — the gate must not be the only thing standing.
		for (const family of [...HOSTILE, ...LAUNDERABLE]) {
			const reqs = iconFontImports({ layers: [{ primitive: "letter", glyph: "N" }], fonts: { 0: family } });
			expect(reqs[0]!.google).toBe(false);
			expect(reqs[0]!.googleImport).toBeNull();
			expect(reqs[0]!.googleLink).toBeNull();
		}
	});

	it("escapes a hostile URL for the context each snippet lands in", () => {
		const hostile = `https://fonts.googleapis.com/css2?family=X');}</style><script>alert(1)</script>`;
		expect(escapeCssUrl(hostile)).not.toMatch(/['")(<>;]/);
		expect(escapeAttr(`${hostile}" onload="alert(1)`)).not.toContain('"');
	});

	it("reports the glyphs each family draws, so an export can subset to them", () => {
		const reqs = iconFontImports(resolveIconMark("--letter-N---f-sigmar")!.composition);
		expect(reqs).toHaveLength(1);
		expect(reqs[0]!.family).toBe("Sigmar");
		expect(reqs[0]!.glyphs).toBe("N");
		expect(reqs[0]!.google).toBe(true);
		expect(reqs[0]!.googleImport).toBe("@import url('https://fonts.googleapis.com/css2?family=Sigmar&display=swap');");
		expect(reqs[0]!.googleLink).toBe('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sigmar&amp;display=swap">');
	});
});

describe("an installed catalogue sharpens the gate without loosening it", () => {
	it("canonicalizes casing off the list rather than guessing it", () => {
		// the guess is what the engine has on its own: `ibm plex mono` capitalizes to `Ibm Plex Mono`, which
		// Google's case-sensitive `family=` 404s on, and the mark then renders in a silent fallback face.
		expect(resolveFontSpec("ibm+plex+mono")).toBe("Ibm Plex Mono");
		useGoogleFontCatalogue(STUB);
		expect(resolveFontSpec("ibm+plex+mono")).toBe("IBM Plex Mono");
		expect(googleFontFamily("  NOTO   sans  ")).toBe("Noto Sans");
		expect(isGoogleFont("press start 2p")).toBe(true);
	});

	it("turns a family Google does not serve into an honest miss instead of a dead snippet", () => {
		// with no catalogue the engine cannot tell an invented family from a real one, and says so
		expect(iconFontImports({ layers: [{ primitive: "letter", glyph: "N" }], fonts: { 0: "My Brand Sans" } })[0]!.google).toBe(true);

		useGoogleFontCatalogue(STUB);
		const reqs = iconFontImports({ layers: [{ primitive: "letter", glyph: "N" }], fonts: { 0: "My Brand Sans" } });
		expect(reqs).toHaveLength(1);
		expect(reqs[0]!.google).toBe(false);
		expect(reqs[0]!.googleImport).toBeNull();
		expect(reqs[0]!.googleLink).toBeNull();
		expect(googleFontFamily("Helvetica")).toBeNull();
		expect(() => googleFontCssUrl("Helvetica")).toThrow(/not a Google Fonts family/);
	});

	it("offers a did-you-mean, which the engine alone has nothing to draw from", () => {
		expect(suggestGoogleFonts("Robot")).toEqual([]);
		useGoogleFontCatalogue(STUB);
		expect(suggestGoogleFonts("Robot")).toContain("Roboto");
		expect(suggestGoogleFonts("")).toEqual([]);
	});

	it("cannot be used to smuggle a hostile family in through the back door", () => {
		useGoogleFontCatalogue(STUB);
		for (const family of [...HOSTILE, ...LAUNDERABLE]) {
			expect(googleFontFamily(family)).toBeNull();
			expect(resolveFontSpec(family)).toBeNull();
			expect(() => googleFontCssUrl(family)).toThrow();
		}
	});
});

describe("embedding a font into an export", () => {
	const WOFF2 = new Uint8Array([0x77, 0x4f, 0x46, 0x32, 1, 2, 3, 4]);

	/** Stands in for Google: a css2 stylesheet, then the gstatic binary it points at. */
	function stubGoogle(): { calls: string[]; restore: () => void } {
		const calls: string[] = [];
		const real = globalThis.fetch;
		globalThis.fetch = (async (input: string | URL) => {
			const url = String(input);
			calls.push(url);
			if (url.startsWith("https://fonts.googleapis.com/")) {
				// a subsetted face is served from `/l/font?kit=…` with no extension, so only `format()` says what it is
				return new Response(
					`@font-face {\n  font-family: 'Sigmar';\n  font-style: normal;\n  font-weight: 400;\n  src: url(https://fonts.gstatic.com/l/font?kit=abc&skey=def) format('woff2');\n}`,
					{ status: 200 },
				);
			}
			if (url.startsWith("https://fonts.gstatic.com/")) return new Response(WOFF2, { status: 200 });
			throw new Error(`unexpected fetch: ${url}`);
		}) as typeof fetch;
		return { calls, restore: () => (globalThis.fetch = real) };
	}

	it("inlines a subsetted face as a data URI, and asks Google only for the glyphs drawn", async () => {
		const { embedFontsInSvg } = await import("../src/fonts/embed.js");
		const google = stubGoogle();
		try {
			const svg = await embedFontsInSvg(`<svg viewBox="0 0 24 24"><text>S</text></svg>`, [{ family: "Sigmar", text: "S" }]);
			expect(google.calls[0]).toBe("https://fonts.googleapis.com/css2?family=Sigmar&text=S&display=swap");
			expect(google.calls[1]).toBe("https://fonts.gstatic.com/l/font?kit=abc&skey=def");
			expect(svg).toContain("<defs><style>@font-face{font-family:'Sigmar'");
			expect(svg).toContain("src:url(data:font/woff2;base64,d09GMgECAwQ=) format('woff2');");
			// the face lands inside the document, ahead of the content that uses it
			expect(svg.indexOf("<defs>")).toBeLessThan(svg.indexOf("<text>"));
			expect(svg).not.toContain("fonts.gstatic.com/l/font");
		} finally {
			google.restore();
		}
	});

	it("never fetches a URL it cannot build, catalogue or no catalogue", async () => {
		const { embedFontsInSvg } = await import("../src/fonts/embed.js");
		const google = stubGoogle();
		try {
			const source = `<svg viewBox="0 0 24 24"><text>S</text></svg>`;
			const requests = [...HOSTILE, ...LAUNDERABLE].map((family) => ({ family, text: "S" }));
			expect(await embedFontsInSvg(source, requests)).toBe(source);
			expect(google.calls).toEqual([]);

			// and with the catalogue in, a family Google does not serve is skipped rather than fetched blind
			useGoogleFontCatalogue(STUB);
			expect(await embedFontsInSvg(source, [{ family: "My Brand Sans", text: "S" }, ...requests])).toBe(source);
			expect(google.calls).toEqual([]);
		} finally {
			google.restore();
		}
	});
});
