/**
 * Loading a Google font into the page for preview, and baking one into an exported SVG.
 *
 * Both paths are gated on {@link googleFontFamily} — the character-set gate, sharpened to an exact
 * catalogue answer wherever one is installed — and neither ever builds markup from a string: the preview
 * link is a `document.createElement("link")` with an assigned `.href`, and the embedded `@font-face` is
 * rebuilt from validated parts rather than by echoing Google's CSS back out. A string that is never parsed
 * as markup is a string with nothing to escape out of.
 *
 * Nothing here runs on page load. Every function is an explicit call, because reaching
 * `fonts.googleapis.com` discloses the visitor's IP address to Google, and that has to be the visitor's
 * choice.
 */

import { googleFontCssUrl, googleFontFamily } from "./google.js";

/** A woff2 the exporter fetched, base64'd, and can inline. */
export interface EmbeddedFontFace {
	/** The canonical Google family. */
	family: string;
	/** A complete `@font-face` rule whose `src` is a `data:` URI — no external reference left. */
	css: string;
	/** The decoded font's byte length, before base64. */
	bytes: number;
}

/** A family to bake into an export, and the glyphs it actually draws. */
export interface FontEmbedRequest {
	family: string;
	/** The characters to subset to. A `letter` layer draws one glyph; subsetting keeps the export tiny. */
	text?: string;
}

const GSTATIC = "https://fonts.gstatic.com/";
const FACE_BLOCK = /@font-face\s*\{([^}]*)\}/g;
const SRC_URL = /url\(\s*(["']?)(https:\/\/fonts\.gstatic\.com\/[^)"'\s]+)\1\s*\)/;
const SRC_FORMAT = /format\(\s*["']([a-z0-9-]+)["']\s*\)/;
const STYLE = /font-style:\s*([a-z]+)/;
const WEIGHT = /font-weight:\s*([0-9]{3})/;

/** A subsetted face is served from `/l/font?kit=…` with no extension, so the URL cannot say what it is —
 * only the stylesheet's own `format()` can. A browser's `User-Agent` earns woff2; anything else may get a
 * truetype, and mislabeling it would produce an `@font-face` no browser will use. */
const MIME: Record<string, string> = {
	woff2: "font/woff2",
	woff: "font/woff",
	truetype: "font/ttf",
	opentype: "font/otf",
};

const faceCache = new Map<string, Promise<EmbeddedFontFace>>();
const linkCache = new Map<string, Promise<string>>();
const loadedFamilies = new Set<string>();

function base64(bytes: Uint8Array): string {
	let binary = "";
	const chunk = 0x8000;
	for (let i = 0; i < bytes.length; i += chunk) {
		binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
	}
	return btoa(binary);
}

/**
 * Loads a Google font into the document so the preview repaints in the real face.
 *
 * Resolves once `document.fonts` reports the family usable, so a caller can re-render against a loaded
 * face instead of a stale fallback. Repeat calls for the same family/subset reuse the in-flight promise.
 *
 * @param family - A family name; gated by `safeFontFamily`, and required to be one Google serves wherever a
 * catalogue is installed.
 * @param opts - Optionally restrict the fetch to the glyphs drawn.
 * @returns The canonical family name, once loaded.
 * @throws If the family is not a Google font, or the stylesheet fails to load.
 */
export function loadGoogleFont(family: string, opts: { text?: string } = {}): Promise<string> {
	const canonical = googleFontFamily(family);
	if (!canonical) return Promise.reject(new Error(`not a Google Fonts family: ${JSON.stringify(family)}`));
	// A subsetted preview would render only the glyphs asked for, and the builder's glyph changes under the
	// user's hands — so the preview always loads the whole face and lets the subset ride the export instead.
	void opts;
	const cached = linkCache.get(canonical);
	if (cached) return cached;

	const pending = new Promise<string>((resolve, reject) => {
		const link = document.createElement("link");
		link.rel = "stylesheet";
		link.href = googleFontCssUrl(canonical);
		link.dataset.xtyleFont = canonical;
		link.onload = () => resolve(canonical);
		link.onerror = () => reject(new Error(`Google Fonts stylesheet failed to load: ${canonical}`));
		document.head.appendChild(link);
	}).then(async (name) => {
		await document.fonts.load(`16px "${name}"`).catch(() => undefined);
		await document.fonts.ready;
		loadedFamilies.add(name);
		return name;
	});

	pending.catch(() => linkCache.delete(canonical));
	linkCache.set(canonical, pending);
	return pending;
}

/**
 * Whether {@link loadGoogleFont} has already pulled a family into this document.
 *
 * Deliberately *not* `document.fonts.check()`: that answers "would text render with everything it needs
 * loaded", and an unregistered family renders fine in a fallback — so it reports `true` for a font the page
 * has never heard of. Answering "did we load it" needs a record of having loaded it.
 */
export function isFontLoaded(family: string): boolean {
	const canonical = googleFontFamily(family);
	return canonical !== null && loadedFamilies.has(canonical);
}

/**
 * Fetches a family's woff2 and returns it as a self-contained `@font-face` with a `data:` URI `src`.
 *
 * `fonts.gstatic.com` answers with `Access-Control-Allow-Origin: *`, so the binary is reachable from the
 * browser with no proxy — which matters, because the site is a static build with no server to proxy
 * through. The woff2 URL is not knowable up front; it comes from parsing the `css2` stylesheet, which is
 * why that fetch happens first. A browser's own `User-Agent` already earns a woff2 back rather than a ttf.
 *
 * The returned rule is **built, not echoed**: the family is the gate-passed canonical name, the style and
 * weight are re-validated out of Google's response, and the payload is base64 (`[A-Za-z0-9+/=]`). No span
 * of Google's CSS text reaches the output, so there is no `</style>` or `url(` to escape.
 *
 * @param family - A family name; gated by `safeFontFamily`, and required to be one Google serves wherever a
 * catalogue is installed.
 * @param opts - `text` subsets the face to just those glyphs, via Google's `&text=` param.
 * @throws If the family is not a Google font, or the stylesheet carries no woff2 source.
 */
export function googleFontFace(family: string, opts: { text?: string } = {}): Promise<EmbeddedFontFace> {
	const canonical = googleFontFamily(family);
	if (!canonical) return Promise.reject(new Error(`not a Google Fonts family: ${JSON.stringify(family)}`));

	const key = `${canonical}\u0000${opts.text ?? ""}`;
	const cached = faceCache.get(key);
	if (cached) return cached;

	const pending = (async (): Promise<EmbeddedFontFace> => {
		const cssResponse = await fetch(googleFontCssUrl(canonical, { text: opts.text }));
		if (!cssResponse.ok) throw new Error(`Google Fonts stylesheet failed: ${cssResponse.status} for ${canonical}`);
		const css = await cssResponse.text();

		FACE_BLOCK.lastIndex = 0;
		let block: RegExpExecArray | null;
		while ((block = FACE_BLOCK.exec(css))) {
			const body = block[1] as string;
			const src = SRC_URL.exec(body)?.[2];
			if (!src || !src.startsWith(GSTATIC)) continue;

			const fontResponse = await fetch(src);
			if (!fontResponse.ok) throw new Error(`font binary failed: ${fontResponse.status} for ${canonical}`);
			const bytes = new Uint8Array(await fontResponse.arrayBuffer());

			const style = STYLE.exec(body)?.[1] === "italic" ? "italic" : "normal";
			const weight = WEIGHT.exec(body)?.[1] ?? "400";
			const declared = SRC_FORMAT.exec(body)?.[1] ?? "";
			const format = declared in MIME ? declared : "woff2";
			const mime = MIME[format] as string;
			return {
				family: canonical,
				bytes: bytes.length,
				css: `@font-face{font-family:'${canonical}';font-style:${style};font-weight:${weight};src:url(data:${mime};base64,${base64(bytes)}) format('${format}');}`,
			};
		}
		throw new Error(`no embeddable font source found for ${canonical}`);
	})();

	pending.catch(() => faceCache.delete(key));
	faceCache.set(key, pending);
	return pending;
}

/**
 * Bakes the requested families into an SVG string as `data:`-URI `@font-face` rules.
 *
 * Without this, an exported SVG with a `letter` layer in a named font renders in whatever the *viewer's*
 * machine happens to substitute — so the export is only correct on the machine that authored it. An
 * external `@import` does not fix that: an SVG loaded as an image (which is how a PNG rasterizer sees it)
 * refuses external resources outright. An inlined face is the only version that travels, and it is what
 * makes the PNG export show the right face too.
 *
 * Requests for families that are not in the Google catalogue, and any face that fails to fetch, are
 * skipped — an export that renders in a fallback beats an export that does not happen.
 *
 * @param svg - A serialized SVG document.
 * @param requests - The families to bake in, each with the glyphs it draws.
 * @returns The SVG with a `<defs><style>` carrying every face that resolved.
 */
export async function embedFontsInSvg(svg: string, requests: FontEmbedRequest[]): Promise<string> {
	const wanted = requests.filter((r) => googleFontFamily(r.family));
	if (!wanted.length) return svg;

	const faces = await Promise.all(
		wanted.map((r) =>
			googleFontFace(r.family, { text: r.text }).then(
				(face) => face.css,
				() => null,
			),
		),
	);
	const resolved = faces.filter((css): css is string => css !== null);
	if (!resolved.length) return svg;

	const open = /<svg\b[^>]*>/.exec(svg);
	if (!open) return svg;
	const at = open.index + open[0].length;
	return `${svg.slice(0, at)}<defs><style>${resolved.join("")}</style></defs>${svg.slice(at)}`;
}
