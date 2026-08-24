/**
 * The icon builder: a terse name grammar, a tokenizer that parses a name into a
 * layered composition, and a `composeIcon` renderer that assembles the SVG from
 * named primitives, the same way an algorithm assembles a token register from
 * anchors. The composition is the cheap, materialized artifact; the primitive
 * library, the grammar, and the compose engine are the durable, reusable asset.
 *
 * A composition is a back-to-front list of layers. Each layer places a primitive
 * (a shape, a frame, a band, or a symbol) at a grid position, sized and rotated,
 * painted in a color or subtracted from the art beneath it. Colors resolve three
 * ways: a literal, a theme token (`--accent`), or a series slot (`series:2`) off a
 * scheme. With a derived register the token and series colors bake to concrete
 * values (a static export); without one they emit `var(--…)` so the mark
 * re-colors live with the theme.
 *
 * The full name grammar is documented in `docs/icon-name-grammar.md`.
 */

import { resolveIconPoints } from "./icon-shapes.js";
import { announceIconRegistry, hasRosterIcon } from "./icon-registry.js";
import { escapeAttr, escapeCssUrl } from "./markup/escape.js";
import { flattenBody, regionCovers, type IconBox, type IconRegion } from "./icon-measure.js";
import { MAX_FONT_FAMILY_LENGTH, googleFontCatalogue, googleFontCssUrl, googleFontFamily, suggestGoogleFonts } from "./fonts/google.js";
import { seriesPalette, resolvePalette, type Palette } from "./series.js";
import type { TokenRegister } from "./types.js";
import { ICONS } from "./icons.js";

const GRID = 24;
const CENTER = GRID / 2;
const CELL = GRID / 6;

/** A primitive: inner SVG markup on the 24×24 grid, authored centered so a layer's scale, rotation, and position transform it uniformly. */
export interface IconPrimitive {
	body: string;
	/** The version this primitive first shipped in; drives a "new" marker in authoring surfaces (the Bench palette). */
	since?: string;
	/** Plain-language taxonomy for search / filter / organize — descriptive terms, not the internal key. */
	tags?: string[];
	/** A one-line summary of what the primitive draws, surfaced by authoring tools and the MCP roster. */
	description?: string;
}

/** A layer's outline: a stroke size step (1 thin, 2 medium, 3 thick) and its color. */
export interface IconOutline {
	size: number;
	color: string;
}

/** One placement in a composition: a primitive, a color, a transform, and optional outline / flip / knockout. */
export interface IconLayer {
	/** The primitive name, a key into `ICON_PRIMITIVES` (or a short keyword resolved through `PRIMITIVE_KEYWORDS`). */
	primitive: string;
	/** For the `letter` primitive: the glyph to typeset, centered on the grid. Set, it renders a `<text>`
	 * in the layer's font slot instead of a library path, riding the same fill / outline / transform. */
	glyph?: string;
	/** For a `letter`: the font slot (`0`+) whose family typesets the glyph; default `0`. Slots 0–2 are
	 * the theme's sans / display / mono; a `---f{n}` finish overrides any slot. */
	font?: number;
	/** For a `poly` / `polyline`: a flat run of `x,y` pairs in a 0–100 space, mapped onto the grid.
	 * Set, it draws that shape instead of a library path, riding the same fill / outline / transform. */
	points?: number[];
	/** For a `polyline`: leave the run open and stroke it rather than closing and filling it. */
	openPath?: boolean;
	/** A literal color, `currentColor`, `transparent`, a token (`--accent`), or a series slot (`series:2`). Omit to inherit `currentColor`. */
	fill?: string;
	/** Uniform scale about the center (default 1). The grammar's `s{%}` maps here as a fraction of the full grid. */
	scale?: number;
	/** Horizontal stretch about the center, multiplied onto {@link scale} rather than replacing it (the
	 * grammar's `sx{%}`). Stretches a primitive out of its authored proportion — a squashed `circle` is a
	 * disc, a stretched `pill` a wide capsule — so no second primitive is needed for every ratio. */
	scaleX?: number;
	/** Vertical stretch about the center, multiplied onto {@link scale} (the grammar's `sy{%}`). */
	scaleY?: number;
	/** Rotation in degrees about the object's own center. */
	rotate?: number;
	/** Translate on the grid (24-unit space); the grammar folds the grid position and any fine offset into this. */
	x?: number;
	y?: number;
	/** Layer opacity (0–1). */
	opacity?: number;
	/** A stroke around the shape. */
	outline?: IconOutline;
	/** Mirror horizontally about the center. */
	flipH?: boolean;
	/** Mirror vertically about the center. */
	flipV?: boolean;
	/** Subtract this shape from the art beneath it (a hole to the page); a later layer paints over the hole. */
	knockout?: boolean;
	/** Invert the shape's coverage region — the layer covers everything *except* the shape. Paired with
	 * `knockout` (`-i-ko`) it clips the accumulated art to the shape's silhouette (a `circle` → circular
	 * clip, a `heart` → heart clip); painted alone (`-i`) it fills the complement, a field with a shape-hole. */
	invert?: boolean;
}

/** A whole-icon drop shadow (a `---` finish): a colored, offset, blurred copy cast behind the mark. */
export interface IconDropShadow {
	/** Shadow color spec (resolved through `resolveColor`, so a ladder slot / token / literal all work). */
	color: string;
	/** Offset from the mark, in 24-grid units. */
	dx: number;
	dy: number;
	/** Gaussian blur radius, in 24-grid units. */
	blur: number;
}

/** A whole-mark transform (a `---` finish): the composite moved and scaled inside its own canvas. */
export interface IconTransform {
	/** Horizontal scale about the canvas center (1 = unchanged). */
	scaleX: number;
	/** Vertical scale about the canvas center (1 = unchanged). */
	scaleY: number;
	/** Translate in 24-grid units, applied before the scale. */
	dx: number;
	dy: number;
}

/** A layered icon composition, back to front. */
export interface IconComposition {
	layers: IconLayer[];
	/** An accessible name; when set the SVG is `role="img"`, otherwise it is decorative. */
	label?: string;
	/** A whole-icon drop shadow declared in the `---` finish (`d{color}p{dir}s{size}t{soft}`). */
	dropShadow?: IconDropShadow;
	/** Palette overrides from a `---pc` finish: a nibble key repaints that one slot, `*` silhouettes
	 * every painting slot. Values are literal colors, applied as a `slot:{n}` resolves. */
	palette?: Record<string, string>;
	/** Font-slot overrides from a `---f` finish, keyed by slot index. A slot a `letter` uses without an
	 * override falls back to `FONT_SLOT_TABLE`. Values are a resolved `font-family`: a `var(--font-*)`
	 * theme token (portable) or a literal family name (renders only where that font is loaded). */
	fonts?: Record<number, string>;
	/** The palette this mark pins for itself, from a `---ps-{palette}` finish. Set, it wins over the
	 * host's `ComposeIconOptions.scheme`, so a mark carries its own palette in its name instead of taking
	 * whatever the control hands it; unset, the mark inherits the host's palette. */
	scheme?: Palette;
	/** Canvas expansion from a `---e{n}` finish: pads the viewBox by `n`% of the grid on every side while
	 * the rendered box stays `1em`, so the art maps a little smaller inside the same footprint, gaining a
	 * margin. Its reason to exist is edge-hugging art under a drop shadow: Firefox clips a filter at the SVG
	 * viewport edge, so content flush against the box casts a hard streak; the margin moves it off the edge. */
	expand?: number;
	/** A whole-mark outline from a `---o{1-3}[c{0-f}]` finish: a single stroke hugging the union silhouette
	 * of everything the mark paints, drawn behind the art and *before* any drop shadow (so the shadow wraps
	 * the outlined shape). Unlike a layer's `o`, which strokes one shape, this rings the composite. */
	outline?: IconOutline;
	/** A whole-mark transform from the `---s`/`---sx`/`---sy`/`---mx`/`---my` finish flags: the composite is
	 * moved, then scaled about the canvas center, *outside* the outline and shadow filters, so the mark and
	 * its finish move as one piece rather than the art sliding around inside its own rim. */
	transform?: IconTransform;
	/** A `---center` finish: re-center the composite on the canvas by its own measured bounding box, so a
	 * mark assembled from off-center layers sits optically centered without hand-tuning every `x`/`y`.
	 * Measured statically off the primitive library, then folded into {@link transform}'s translate. */
	center?: boolean;
}

export interface ComposeIconOptions {
	/** A derived register: when present, token and series colors bake to concrete values; without it they emit `var(--…)`. */
	register?: TokenRegister;
	/** The palette a `series:N` slot draws from (default `accents`). A composition that names its own
	 * palette (a `---ps` finish) overrides this. */
	scheme?: Palette | string[];
	/** A class on the root `<svg>`, so a host can size / spin / tone the mark like a functional glyph. */
	className?: string;
	/** A `part` on the root `<svg>`, for `::part()` styling from a consumer. */
	part?: string;
	/** Palette overrides (from the composition's `---pc` finish), keyed by nibble or `*`; a `slot:{n}`
	 * spec consults this before falling back to the canonical `SLOT_TABLE`. */
	palette?: Record<string, string>;
	/** The mark's accessible name and `<title>`, overriding the one its composition carries. A generated
	 * mark's own label is derived from its name — a spec string identifying the mark, not describing it —
	 * so a caller with a real description passes it here. Absent, the composition's label stands. */
	label?: string;
}

const bare = (body: string, tags: string[] = [], since = "0.4.0"): IconPrimitive => ({ body, since, tags });

/** A point run mapped from its 0–100 space onto the 24-unit grid, closed and filled or left open and stroked. */
function polyBody(points: number[], open = false): string {
	const coords: string[] = [];
	for (let i = 0; i + 1 < points.length; i += 2) {
		coords.push(`${n(((points[i] as number) / 100) * GRID)},${n(((points[i + 1] as number) / 100) * GRID)}`);
	}
	const list = coords.join(" ");
	if (open) return `<polyline points="${list}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
	return `<polygon points="${list}" fill="currentColor"/>`;
}

/** Plain-language tags for the functional glyphs (reachable as `symbol-<name>` primitives), so the
 * palette can search and filter them by meaning rather than by glyph name alone. */
const GLYPH_TAGS: Record<string, string[]> = {
	"chevron-up": ["chevron", "caret", "arrow", "direction", "up"],
	"chevron-down": ["chevron", "caret", "arrow", "direction", "down"],
	"chevron-left": ["chevron", "caret", "arrow", "direction", "left"],
	"chevron-right": ["chevron", "caret", "arrow", "direction", "right"],
	"chevron-expand": ["chevron", "expand", "arrow", "direction"],
	"arrow-up": ["arrow", "direction", "up"],
	"arrow-down": ["arrow", "direction", "down"],
	"arrow-left": ["arrow", "direction", "left"],
	"arrow-right": ["arrow", "direction", "right"],
	close: ["close", "x", "cancel", "dismiss"],
	check: ["check", "tick", "done", "confirm"],
	plus: ["plus", "add", "new", "math"],
	minus: ["minus", "remove", "subtract", "math"],
	menu: ["menu", "hamburger", "nav", "list"],
	"more-vertical": ["more", "overflow", "menu", "kebab", "dots"],
	"more-horizontal": ["more", "overflow", "menu", "dots"],
	search: ["search", "find", "magnify", "lookup"],
	info: ["info", "information", "status", "alert"],
	warning: ["warning", "alert", "caution", "status"],
	error: ["error", "alert", "danger", "status"],
	success: ["success", "check", "done", "status"],
	"external-link": ["link", "external", "open", "out"],
	maximize: ["zoom", "expand", "enlarge", "fullscreen"],
	dot: ["dot", "point", "circle", "bullet"],
	loader: ["loader", "spinner", "loading", "progress"],
	play: ["play", "media", "playback", "control"],
	pause: ["pause", "media", "playback", "control"],
	stop: ["stop", "media", "playback", "control"],
	"skip-forward": ["skip", "forward", "next", "media", "control"],
	"skip-back": ["skip", "back", "previous", "media", "control"],
	volume: ["volume", "sound", "audio", "speaker", "unmute", "media"],
	"volume-off": ["volume", "mute", "muted", "silent", "sound", "audio", "speaker", "media"],
	gear: ["gear", "settings", "cog", "config", "options"],
	folder: ["folder", "directory", "files"],
	pencil: ["pencil", "edit", "write", "draw"],
	trash: ["trash", "delete", "remove", "bin"],
	eye: ["eye", "view", "visible", "show", "preview"],
	copy: ["copy", "duplicate", "clone", "clipboard"],
	palette: ["palette", "paint", "colors", "art", "swatches"],
	bookmark: ["bookmark", "save", "flag", "mark"],
	download: ["download", "save", "import", "arrow"],
};

/**
 * The theme's font families, indexed like color slots so a `letter` picks one by number and a `---f{n}`
 * finish overrides it the same way `---pc{nibble}` overrides a color. Slot 0 is the body sans, 1 the
 * display face, 2 the mono — the three `--font-*` tokens the register always carries. A slot with no
 * default (3+) falls back to slot 0 unless a `---f{n}` finish supplies one.
 */
export const FONT_SLOT_TABLE: Record<number, string> = {
	0: "var(--font-sans)",
	1: "var(--font-display)",
	2: "var(--font-mono)",
};

/** Theme-font aliases a `---f` value may name to bind a slot to a `--font-*` token — theme-reactive, and
 * as portable as the page it lands on — instead of a literal family. */
const THEME_FONT_ALIASES: Record<string, string> = {
	sans: "var(--font-sans)",
	body: "var(--font-sans)",
	display: "var(--font-display)",
	mono: "var(--font-mono)",
};

/**
 * The characters a literal family name may use. An icon name is untrusted input — it can arrive from a
 * shared spec, a mod, or an MCP call — and its family lands in a CSS `url()`, an HTML `href`, and an SVG
 * attribute. Admitting only letters, digits, spaces, and hyphens means a name carrying a quote, a `)`, a
 * `;`, an angle bracket, or a newline has nothing to break out of, because it never becomes a family at all.
 * Hyphens are legal here and not in {@link SAFE_GOOGLE_FAMILY}: a self-hosted `my-brand-sans` is a real
 * family a page may already load, and no Google family carries one.
 */
const SAFE_LITERAL_FAMILY = /^[A-Za-z0-9][A-Za-z0-9 -]*$/;

/**
 * Resolve a `---f` finish value to a `font-family`. `+` reads as a space (so a Google-style
 * `noto+sans+symbols` is one family), a bare theme alias (`sans` / `display` / `mono`) binds to that
 * `--font-*` token, and anything else is a literal family name. A literal family only renders where the
 * font is actually loaded; `iconFontImports` surfaces the loading snippets for the ones that need it.
 *
 * With a Google Fonts catalogue installed ({@link useGoogleFontCatalogue}), a family Google serves resolves
 * to the catalogue's own spelling, so a hand-typed `ibm+plex+mono` becomes the real `IBM Plex Mono` rather
 * than the `Ibm Plex Mono` that a capitalize-each-word guess produces — which 404s and silently renders in a
 * fallback face the author never chose. With none, the guess is all the engine has, and a caller who spells
 * the family the way Google spells it gets a working URL regardless.
 *
 * @returns The `font-family`, or `null` when the value carries characters a family name may not
 * ({@link SAFE_LITERAL_FAMILY}); the caller drops the slot, and it falls back to the theme font.
 */
export function resolveFontSpec(raw: string): string | null {
	const name = raw.replace(/\+/g, " ").trim();
	const alias = THEME_FONT_ALIASES[name.toLowerCase()];
	if (alias) return alias;
	// INFO: the gate must run before spaces are collapsed; collapsing first would launder a newline or
	// tab into a space and admit a name the gate rejects
	if (name.length > MAX_FONT_FAMILY_LENGTH || !SAFE_LITERAL_FAMILY.test(name)) return null;
	const collapsed = name.replace(/ +/g, " ");
	const catalogued = googleFontCatalogue()?.canonical(collapsed);
	if (catalogued) return catalogued;
	return collapsed
		.split(" ")
		.map((w) => (w ? (w[0] as string).toUpperCase() + w.slice(1) : w))
		.join(" ");
}

/** The resolved `font-family` for a layer's font slot: a `---f` override, else the theme default, else slot 0. */
function fontForSlot(slot: number | undefined, composition: IconComposition): string {
	const index = slot ?? 0;
	return (
		composition.fonts?.[index] ?? FONT_SLOT_TABLE[index] ?? FONT_SLOT_TABLE[0] ?? "var(--font-sans)"
	);
}

/** The `<text>` body for a `letter` layer: the glyph centered on the 24-grid in the slot's font, with no
 * fill of its own so the paint group's fill / color / stroke (nibble colors, `currentColor`, outlines,
 * knockout) and the layer transform all apply exactly as they do to a path primitive. `paint-order="stroke"`
 * draws any outline *behind* the fill, so an outlined letter reads as a solid glyph with a border hugging
 * its silhouette rather than a centered stroke that eats into and doubles every stem. */
function letterBody(glyph: string, fontFamily: string): string {
	return `<text x="${CENTER}" y="${CENTER}" text-anchor="middle" dominant-baseline="central" paint-order="stroke" stroke-linejoin="round" font-size="20" font-family="${escapeAttr(fontFamily)}">${escapeAttr(glyph)}</text>`;
}

/** The seed primitive library: shapes, frames, bars, symbols, and the functional glyphs. Each carries
 * plain-language `tags` for search and filter; the keys are internal identifiers, not a taxonomy. */
export const ICON_PRIMITIVES: Record<string, IconPrimitive> = {
	letter: { body: letterBody("A", FONT_SLOT_TABLE[1] as string), since: "0.7.0", tags: ["letter", "text", "glyph", "type", "character", "monogram", "initial"] },
	"shape-circle": bare(`<circle cx="12" cy="12" r="11"/>`, ["circle", "round", "shape", "solid"]),
	"shape-square": bare(`<rect x="1.5" y="1.5" width="21" height="21"/>`, ["square", "box", "shape", "solid"]),
	"shape-square-1": bare(`<rect x="1.5" y="1.5" width="21" height="21" rx="2"/>`, ["square", "box", "rounded", "shape"]),
	"shape-square-2": bare(`<rect x="1.5" y="1.5" width="21" height="21" rx="4"/>`, ["square", "box", "rounded", "shape"]),
	"shape-square-3": bare(`<rect x="1.5" y="1.5" width="21" height="21" rx="6"/>`, ["square", "box", "rounded", "shape"]),
	"shape-shield": bare(`<path d="M12 1.5 L21 4.5 V12 C21 18 17.2 21 12 22.5 C6.8 21 3 18 3 12 V4.5 Z"/>`, ["shield", "badge", "crest", "game", "shape"]),
	"shape-hex": bare(`<path d="M12 1.5 L21 6.75 V17.25 L12 22.5 L3 17.25 V6.75 Z"/>`, ["hexagon", "hex", "game", "shape"]),
	"shape-diamond": bare(`<path d="M12 1 L23 12 L12 23 L1 12 Z"/>`, ["diamond", "rhombus", "shape"]),
	"shape-triangle": bare(`<path d="M12 2.5 L21.5 21.5 H2.5 Z"/>`, ["triangle", "angular", "shape"]),
	"shape-pentagon": bare(`<path d="M12 1 L22.5 8.6 L18.5 20.9 L5.5 20.9 L1.5 8.6 Z"/>`, ["pentagon", "polygon", "five", "shape"], "0.6.0"),
	"shape-half": bare(`<path d="M1 12 A11 11 0 0 1 23 12 Z"/>`, ["half", "semicircle", "dome", "round", "shape"], "0.6.0"),
	"shape-quarter": bare(`<path d="M12 12 V1 A11 11 0 0 1 23 12 Z"/>`, ["quarter", "quadrant", "corner", "round", "shape"], "0.6.0"),
	"shape-wedge": bare(`<path d="M12 12 L6.5 2.47 A11 11 0 0 1 17.5 2.47 Z"/>`, ["wedge", "sector", "slice", "pie", "gauge"], "0.6.0"),
	"shape-oval": bare(`<ellipse cx="12" cy="12" rx="11" ry="7.5"/>`, ["oval", "ellipse", "round", "shape"], "0.6.0"),
	"shape-pill": bare(`<rect x="2" y="7.5" width="20" height="9" rx="4.5"/>`, ["pill", "capsule", "bar", "rounded", "shape"], "0.6.0"),
	"shape-drop": bare(`<path d="M12 2 C16 9 19 12 19 15.5 A7 7 0 1 1 5 15.5 C5 12 8 9 12 2 Z"/>`, ["drop", "teardrop", "droplet", "pin", "water"], "0.6.0"),
	"shape-wave": bare(`<path d="M0 10 C3 4.5 9 4.5 12 10 C15 15.5 21 15.5 24 10 L24 16.5 C21 22 15 22 12 16.5 C9 11 3 11 0 16.5 Z"/>`, ["wave", "water", "sea", "ocean", "ripple", "swish", "curve"], "0.10.0"),
	"shape-water": bare(`<path d="M0 9 C4 5 8 13 12 9 C16 5 20 13 24 9 L24 24 L0 24 Z"/>`, ["water", "liquid", "fill", "level", "sea", "flood", "wave"], "0.10.0"),
	"shape-swish": bare(`<path d="M1 21.5 C2.5 11 9 3 23 2.5 C11.5 9 7 15 7.5 22 Z"/>`, ["swish", "swoosh", "comma", "sweep", "curve", "brush", "flick"], "0.10.0"),
	"shape-blob": bare(`<path d="M15.5 2.1 C20.4 3.8 23.6 9.1 21.6 13.6 C19.9 17.4 14.9 16.9 12.1 19.6 C9.1 22.5 4.3 22.8 2.4 18.9 C0.6 15.2 3.9 11.6 4.6 7.9 C5.4 3.6 10.8 0.5 15.5 2.1 Z"/>`, ["blob", "organic", "splat", "amoeba", "shape"], "0.10.0"),
	"shape-lens": bare(`<path d="M12 1.5 A14 14 0 0 1 12 22.5 A14 14 0 0 1 12 1.5 Z"/>`, ["lens", "vesica", "petal", "eye", "pointed", "shape"], "0.10.0"),
	"shape-leaf": bare(`<path d="M3 21 C3 11 10 3 21 3 C21 14 14 21 3 21 Z"/>`, ["leaf", "nature", "plant", "eco", "petal", "curve"], "0.10.0"),
	"shape-cloud": bare(`<path d="M7 19 C3.7 19 1 16.4 1 13.2 C1 10.4 3 8.1 5.7 7.5 C6.5 4.3 9.4 2 12.8 2 C16.5 2 19.6 4.8 20 8.4 C21.8 9.2 23 11 23 13.1 C23 16.3 20.4 19 17.2 19 Z"/>`, ["cloud", "weather", "sky", "storage", "curve"], "0.10.0"),
	"shape-mountain": bare(`<path d="M1 21 L8.5 7 L13 14 L16 9.5 L23 21 Z"/>`, ["mountain", "peak", "hill", "range", "terrain", "landscape"], "0.10.0"),
	"shape-disc": bare(`<ellipse cx="12" cy="12" rx="11" ry="4"/>`, ["disc", "cap", "lid", "flat", "ellipse", "platter", "database"], "0.10.0"),
	"shape-cylinder": bare(`<path d="M3 6 A9 4 0 0 1 21 6 L21 18 A9 4 0 0 1 3 18 Z"/>`, ["cylinder", "drum", "barrel", "can", "database", "disc", "volume", "stack"], "0.10.0"),
	"shape-cone": bare(`<path d="M12 2 L21 18 A9 4 0 0 1 3 18 Z"/>`, ["cone", "funnel", "volume", "hopper", "spike"], "0.10.0"),
	"shape-octagon": bare(`<path d="M7.65 1.5 H16.35 L22.5 7.65 V16.35 L16.35 22.5 H7.65 L1.5 16.35 V7.65 Z"/>`, ["octagon", "polygon", "eight", "stop", "shape"], "0.10.0"),
	"shape-trapezoid": bare(`<path d="M6 3 H18 L22.5 21 H1.5 Z"/>`, ["trapezoid", "trapezium", "polygon", "taper", "shape"], "0.10.0"),
	"shape-ramp": bare(`<path d="M2.5 21.5 H21.5 V2.5 Z"/>`, ["ramp", "right", "triangle", "slope", "wedge", "corner"], "0.10.0"),
	"shape-arch": bare(`<path d="M2.5 22 V10.5 A9.5 9.5 0 0 1 21.5 10.5 V22 Z"/>`, ["arch", "door", "window", "tombstone", "dome", "shape"], "0.10.0"),
	"shape-squircle": bare(`<path d="M12 1.5 C19.5 1.5 22.5 4.5 22.5 12 C22.5 19.5 19.5 22.5 12 22.5 C4.5 22.5 1.5 19.5 1.5 12 C1.5 4.5 4.5 1.5 12 1.5 Z"/>`, ["squircle", "superellipse", "rounded", "square", "app", "shape"], "0.10.0"),
	"shape-egg": bare(`<path d="M12 1.5 C16.8 1.5 20.5 8.6 20.5 14 C20.5 18.8 16.7 22.5 12 22.5 C7.3 22.5 3.5 18.8 3.5 14 C3.5 8.6 7.2 1.5 12 1.5 Z"/>`, ["egg", "oval", "ovoid", "seed", "shape"], "0.10.0"),
	"shape-gem": bare(`<path d="M7 2.5 H17 L22 9 L12 22 L2 9 Z"/>`, ["gem", "jewel", "diamond", "crystal", "facet", "treasure"], "0.10.0"),
	"shape-chevron": bare(`<path d="M3.5 6 L12 13.2 L20.5 6 L23 9 L12 18.5 L1 9 Z"/>`, ["chevron", "caret", "arrow", "direction", "band", "solid"], "0.10.0"),
	"shape-arrow": bare(`<path d="M2 9.5 H13 V4 L22.5 12 L13 20 V14.5 H2 Z"/>`, ["arrow", "direction", "pointer", "next", "solid"], "0.10.0"),
	"shape-bubble": bare(`<path d="M5 3 H19 A4 4 0 0 1 23 7 V14 A4 4 0 0 1 19 18 H9 L4 22.5 L5 18 A4 4 0 0 1 1 14 V7 A4 4 0 0 1 5 3 Z"/>`, ["bubble", "speech", "comment", "chat", "message", "balloon"], "0.10.0"),
	"shape-flame": bare(`<path d="M12 1.5 C13.6 6.8 18.8 8.8 18.8 14.4 A6.8 6.8 0 1 1 5.2 14.4 C5.2 10 8.4 8.6 9.6 5.6 C10.6 8.4 10.6 11 9.6 13 C11 11.2 12.4 7.4 12 1.5 Z"/>`, ["flame", "fire", "burn", "hot", "energy", "streak"], "0.10.0"),
	"shape-sun": bare(`<circle cx="12" cy="12" r="6.4"/><path d="M10.73 5.73 L12 0.5 L13.27 5.73 Z M15.54 6.67 L20.13 3.87 L17.33 8.46 Z M18.27 10.73 L23.5 12 L18.27 13.27 Z M17.33 15.54 L20.13 20.13 L15.54 17.33 Z M13.27 18.27 L12 23.5 L10.73 18.27 Z M8.46 17.33 L3.87 20.13 L6.67 15.54 Z M5.73 13.27 L0.5 12 L5.73 10.73 Z M6.67 8.46 L3.87 3.87 L8.46 6.67 Z"/>`, ["sun", "sunny", "weather", "day", "light", "bright", "rays"], "0.10.0"),
	"shape-banner": bare(`<path d="M4 2 H20 V22 L12 17 L4 22 Z"/>`, ["banner", "ribbon", "flag", "bookmark", "pennant"], "0.10.0"),
	"shape-tag": bare(`<path d="M2 12 L9 4 H22 V20 H9 Z"/>`, ["tag", "label", "ticket", "price", "chip"], "0.10.0"),
	"divider-rule": bare(`<rect x="2" y="11" width="20" height="2" rx="1"/>`, ["divider", "line", "separator", "rule"]),
	"frame-ring": bare(`<circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" stroke-width="1.5"/>`, ["ring", "circle", "frame", "outline", "round"]),
	"frame-border": bare(`<rect x="2.25" y="2.25" width="19.5" height="19.5" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/>`, ["border", "square", "frame", "outline"]),
	"stroke-line": bare(`<line x1="2" y1="12" x2="22" y2="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`, ["line", "stroke", "segment", "rule", "draw"], "0.6.0"),
	"stroke-arc": bare(`<path d="M2 12 A10 10 0 0 1 22 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`, ["arc", "curve", "semicircle", "smile", "draw"], "0.6.0"),
	"stroke-corner": bare(`<path d="M5 5 V19 H19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`, ["corner", "bracket", "ell", "angle", "draw"], "0.6.0"),
	"stroke-vee": bare(`<path d="M5 8 L12 16 L19 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`, ["vee", "chevron", "angle", "caret", "draw"], "0.6.0"),
	"bar-top": bare(`<rect x="2" y="2" width="20" height="5"/>`, ["bar", "band", "stripe", "top", "chief"]),
	"bar-row": bare(`<rect x="2" y="9.5" width="20" height="5"/>`, ["bar", "band", "stripe", "row", "horizontal", "fess"]),
	"bar-column": bare(`<rect x="9.5" y="2" width="5" height="20"/>`, ["bar", "band", "stripe", "column", "vertical", "pale"]),
	"bar-diagonal": bare(`<path d="M2 7 L17 22 L22 17 L7 2 Z"/>`, ["diagonal", "stripe", "slash", "band", "bend"]),
	"bar-cross": bare(`<path d="M9.5 2 h5 v7.5 h7.5 v5 h-7.5 v7.5 h-5 v-7.5 h-7.5 v-5 h7.5 Z"/>`, ["cross", "plus", "symbol"]),
	"symbol-star": bare(`<path d="M12 2 l2.9 6.2 6.8 0.7 -5.1 4.6 1.5 6.7 -6.1 -3.6 -6.1 3.6 1.5 -6.7 -5.1 -4.6 6.8 -0.7 Z"/>`, ["star", "favorite", "rating", "symbol"]),
	"symbol-star-4": bare(`<path d="M12 1 C13.2 7.6 16.4 10.8 23 12 C16.4 13.2 13.2 16.4 12 23 C10.8 16.4 7.6 13.2 1 12 C7.6 10.8 10.8 7.6 12 1 Z"/>`, ["star", "sparkle", "twinkle", "shine", "four", "magic", "ai"], "0.10.0"),
	"symbol-star-6": bare(`<path d="M12 1 L14.75 7.24 L21.53 6.5 L17.5 12 L21.53 17.5 L14.75 16.76 L12 23 L9.25 16.76 L2.47 17.5 L6.5 12 L2.47 6.5 L9.25 7.24 Z"/>`, ["star", "six", "hexagram", "sheriff", "shine"], "0.10.0"),
	"symbol-star-8": bare(`<path d="M12 1 L13.99 7.2 L19.78 4.22 L16.8 10.01 L23 12 L16.8 13.99 L19.78 19.78 L13.99 16.8 L12 23 L10.01 16.8 L4.22 19.78 L7.2 13.99 L1 12 L7.2 10.01 L4.22 4.22 L10.01 7.2 Z"/>`, ["star", "eight", "compass", "shine", "burst"], "0.10.0"),
	"symbol-burst": bare(`<path d="M12 1 L14.07 4.27 L17.5 2.47 L17.66 6.34 L21.53 6.5 L19.73 9.93 L23 12 L19.73 14.07 L21.53 17.5 L17.66 17.66 L17.5 21.53 L14.07 19.73 L12 23 L9.93 19.73 L6.5 21.53 L6.34 17.66 L2.47 17.5 L4.27 14.07 L1 12 L4.27 9.93 L2.47 6.5 L6.34 6.34 L6.5 2.47 L9.93 4.27 Z"/>`, ["burst", "starburst", "seal", "sunburst", "sticker", "spiky", "sale"], "0.10.0"),
	"symbol-seal": bare(`<path d="M12 2.5 A2.6 2.6 0 0 1 16.75 3.77 A2.6 2.6 0 0 1 20.23 7.25 A2.6 2.6 0 0 1 21.5 12 A2.6 2.6 0 0 1 20.23 16.75 A2.6 2.6 0 0 1 16.75 20.23 A2.6 2.6 0 0 1 12 21.5 A2.6 2.6 0 0 1 7.25 20.23 A2.6 2.6 0 0 1 3.77 16.75 A2.6 2.6 0 0 1 2.5 12 A2.6 2.6 0 0 1 3.77 7.25 A2.6 2.6 0 0 1 7.25 3.77 A2.6 2.6 0 0 1 12 2.5 Z"/>`, ["seal", "rosette", "scallop", "badge", "award", "stamp", "flower"], "0.10.0"),
	"symbol-heart": bare(`<path d="M12 21 C5.5 16.5 2 12.5 2 8.5 C2 5.4 4.3 3 7.1 3 C9.4 3 11 4.6 12 6.6 C13 4.6 14.6 3 16.9 3 C19.7 3 22 5.4 22 8.5 C22 12.5 18.5 16.5 12 21 Z"/>`, ["heart", "love", "favorite", "symbol"]),
	"symbol-crescent": bare(`<path d="M12 3 a6 6 0 0 0 9 9 9 9 0 1 1 -9 -9 Z"/>`, ["crescent", "moon", "symbol"]),
	"symbol-bolt": bare(`<path d="M13 2 L4 14 h6 l-1 8 l9 -13 h-6 Z"/>`, ["bolt", "lightning", "energy", "flash", "symbol"]),
	...Object.fromEntries(Object.entries(ICONS).map(([name, body]) => [`symbol-${name}`, bare(body, GLYPH_TAGS[name] ?? [])])),
};

/** The single-token functional glyphs, reachable in the grammar by their bare name as a symbol
 * (`badge--circle-c2--check-s55-cf`). Multi-token glyph names (`chevron-right`) have no keyword; a
 * spec reaches those through a full library name only, which the tokenizer's single-token keyword
 * rule doesn't parse, so they stay glyph-only. `dot` is deliberately a shape, not the glyph. */
const glyphKeywords: Record<string, string> = Object.fromEntries(
	Object.keys(ICONS)
		.filter((name) => !name.includes("-") && name !== "dot")
		.map((name) => [name, `symbol-${name}`]),
);

/** Short grammar keywords → primitive-library names. A keyword the map doesn't cover is used as-is (so `shape-shield` also works verbatim). */
export const PRIMITIVE_KEYWORDS: Record<string, string> = {
	...glyphKeywords,
	circle: "shape-circle",
	square: "shape-square",
	square1: "shape-square-1",
	square2: "shape-square-2",
	square3: "shape-square-3",
	shield: "shape-shield",
	hex: "shape-hex",
	diamond: "shape-diamond",
	triangle: "shape-triangle",
	pentagon: "shape-pentagon",
	half: "shape-half",
	quarter: "shape-quarter",
	wedge: "shape-wedge",
	oval: "shape-oval",
	pill: "shape-pill",
	drop: "shape-drop",
	wave: "shape-wave",
	water: "shape-water",
	swish: "shape-swish",
	blob: "shape-blob",
	lens: "shape-lens",
	leaf: "shape-leaf",
	cloud: "shape-cloud",
	mountain: "shape-mountain",
	disc: "shape-disc",
	cylinder: "shape-cylinder",
	drum: "shape-cylinder",
	cone: "shape-cone",
	octagon: "shape-octagon",
	trapezoid: "shape-trapezoid",
	ramp: "shape-ramp",
	arch: "shape-arch",
	squircle: "shape-squircle",
	egg: "shape-egg",
	gem: "shape-gem",
	banner: "shape-banner",
	tag: "shape-tag",
	chevron: "shape-chevron",
	arrow: "shape-arrow",
	bubble: "shape-bubble",
	flame: "shape-flame",
	sun: "shape-sun",
	divider: "divider-rule",
	dot: "shape-circle",
	ring: "frame-ring",
	border: "frame-border",
	line: "stroke-line",
	arc: "stroke-arc",
	corner: "stroke-corner",
	vee: "stroke-vee",
	top: "bar-top",
	row: "bar-row",
	column: "bar-column",
	diagonal: "bar-diagonal",
	cross: "bar-cross",
	chief: "bar-top",
	fess: "bar-row",
	pale: "bar-column",
	bend: "bar-diagonal",
	star: "symbol-star",
	star4: "symbol-star-4",
	star6: "symbol-star-6",
	star8: "symbol-star-8",
	sparkle: "symbol-star-4",
	burst: "symbol-burst",
	seal: "symbol-seal",
	heart: "symbol-heart",
	crescent: "symbol-crescent",
	bolt: "symbol-bolt",
};

/**
 * Whether `name` will draw something, answering the whole resolution cascade in one call: a roster glyph
 * (built-in or contributed) or a composable mark spec.
 *
 * The element already knows this, because it owns the cascade — but knowing it required a consumer to
 * import from two modules and restate the order, and a restatement is one release from disagreeing with
 * what the element does. The false-negative direction is the expensive one: a guard that says no about a
 * name that would have rendered silently degrades a working icon.
 */
export function canRenderIcon(name: string | null | undefined): boolean {
	if (!name) return false;
	return hasRosterIcon(name) || resolveIconMark(name) !== null;
}

/** The slot a mod fills to contribute primitives, declared in its own manifest rather than run as code. */
export const ICON_PRIMITIVE_SLOT = "xtyle.icon-primitives";

/**
 * One contributed primitive. `pts` is the ordinary route — a coordinate run, or the name of a list
 * registered through `xtyle.icon-points`, so a point list worth reusing becomes a primitive by naming it
 * rather than by restating it. `body` takes raw SVG for a shape no point run can describe (a curve, an
 * arc, an ellipse), which is how the built-in library is written.
 */
export interface IconPrimitiveDef {
	pts?: string | number[];
	/** Leave a `pts` run open and stroke it, the way `polyline` does, rather than closing and filling it. */
	open?: boolean;
	body?: string;
	tags?: string[];
	description?: string;
	since?: string;
}

/** One mod's contribution: primitive definitions keyed by the name the grammar reaches them under. */
export interface IconPrimitiveFill {
	primitives: Record<string, IconPrimitiveDef>;
}

const contributedPrimitives = new Map<string, IconPrimitive>();

const PRIMITIVE_NAME = /^[a-z][a-z0-9]*$/;

function warnPrimitive(message: string): void {
	if (typeof console !== "undefined") console.warn(`xtyle: ${message}`);
}

/**
 * Add or replace primitives, last-wins on the name, the way the icon roster takes glyphs.
 *
 * A contributed name is reachable everywhere a built-in is — in a composition segment, in the roster, in
 * the tag search — and it outranks a grammar keyword, so registering `heart` overrides the built-in
 * `symbol-heart` the keyword used to reach. Names are lowercase alphanumeric with no hyphen, because a
 * hyphen is how the grammar separates flags; that also means a contribution can never collide with a
 * built-in *library* key (`shape-circle`), only shadow the keyword that reaches it.
 */
export function registerIconPrimitives(defs: Record<string, IconPrimitiveDef>): void {
	for (const [name, def] of Object.entries(defs)) {
		if (!PRIMITIVE_NAME.test(name)) {
			warnPrimitive(`"${name}" is not a usable primitive name. Use lowercase letters and digits, with no hyphen.`);
			continue;
		}
		const body = primitiveBodyFrom(name, def);
		if (body === null) continue;
		const primitive: IconPrimitive = { body };
		if (def.since !== undefined) primitive.since = def.since;
		if (def.tags !== undefined) primitive.tags = def.tags;
		if (def.description !== undefined) primitive.description = def.description;
		contributedPrimitives.set(name, primitive);
	}
	announceIconRegistry();
}

/** Resolve a definition to an SVG body, or null (having said why) when it describes nothing drawable. */
function primitiveBodyFrom(name: string, def: IconPrimitiveDef): string | null {
	if (def.pts !== undefined) {
		const points = resolveIconPoints(typeof def.pts === "string" ? def.pts : def.pts.join(","));
		if (!points) {
			warnPrimitive(`"${name}" needs at least three x,y pairs of finite numbers, or the name of a registered point list. Ignoring it.`);
			return null;
		}
		return polyBody(points, def.open === true);
	}
	if (typeof def.body === "string" && def.body.trim() !== "") return def.body;
	warnPrimitive(`"${name}" carries neither a "pts" run nor an SVG "body". Ignoring it.`);
	return null;
}

/** Drop every contributed primitive, leaving the built-in library. For tests and for a host teardown. */
export function resetIconPrimitives(): void {
	contributedPrimitives.clear();
	announceIconRegistry();
}

/** The primitive `name` addresses, contributed or built-in, or undefined when nothing claims it. */
export function iconPrimitive(name: string): IconPrimitive | undefined {
	return contributedPrimitives.get(name) ?? ICON_PRIMITIVES[name];
}

/** Resolve a grammar keyword (`star`) or a bare library name (`symbol-star`) to its library name. */
export function resolvePrimitiveName(nameOrKeyword: string): string {
	if (contributedPrimitives.has(nameOrKeyword)) return nameOrKeyword;
	return PRIMITIVE_KEYWORDS[nameOrKeyword] ?? nameOrKeyword;
}

/** The version a primitive first shipped in, addressed by keyword or library name (undefined if unknown). */
export function primitiveSince(nameOrKeyword: string): string | undefined {
	return iconPrimitive(resolvePrimitiveName(nameOrKeyword))?.since;
}

/** A primitive's plain-language tags, addressed by keyword or library name (empty when unknown). */
export function primitiveTags(nameOrKeyword: string): string[] {
	return iconPrimitive(resolvePrimitiveName(nameOrKeyword))?.tags ?? [];
}

/** True when `name` resolves to a primitive, contributed or built-in. */
export function hasPrimitive(name: string): boolean {
	return contributedPrimitives.has(name) || Object.prototype.hasOwnProperty.call(ICON_PRIMITIVES, name);
}

/** Every primitive name that ships in the library. A snapshot of the built-in set, so a figure measured
 * against it (the site's primitive count) means "what xtyle ships" rather than "what this page happened
 * to register"; {@link iconPrimitiveNames} is the live roster. */
export const ICON_PRIMITIVE_NAMES: string[] = Object.keys(ICON_PRIMITIVES);

/** Every primitive name currently reachable, built-in and contributed alike. */
export function iconPrimitiveNames(): string[] {
	return [...ICON_PRIMITIVE_NAMES, ...contributedPrimitives.keys()];
}

/** Pull the primitive blocks out of a mod manifest's `xtyle.icon-primitives` fills, if it declares any. */
export function iconPrimitiveFillsFrom(modManifest: unknown): IconPrimitiveFill[] {
	const fills = (modManifest as { fills?: Record<string, unknown> } | null | undefined)?.fills;
	const declared = fills?.[ICON_PRIMITIVE_SLOT];
	if (!declared) return [];
	return (Array.isArray(declared) ? declared : [declared]).filter(isIconPrimitiveFill);
}

function isIconPrimitiveFill(value: unknown): value is IconPrimitiveFill {
	const primitives = (value as Partial<IconPrimitiveFill> | null | undefined)?.primitives;
	if (!primitives || typeof primitives !== "object") return false;
	return Object.values(primitives).every((def) => def !== null && typeof def === "object");
}

/** Register every primitive a mod manifest contributes, in declaration order. */
export function registerIconPrimitiveFills(modManifest: unknown): number {
	let added = 0;
	for (const fill of iconPrimitiveFillsFrom(modManifest)) {
		registerIconPrimitives(fill.primitives);
		added += Object.keys(fill.primitives).length;
	}
	return added;
}

/**
 * One-line summaries for the compositional draw-with primitives — the ones an author stacks a mark out
 * of. The functional glyphs (`symbol-check`, …) are left without one on purpose: their name is their
 * meaning and {@link primitiveDescription} humanizes it, so only the shapes an author has to be *told*
 * about carry prose. Assigned onto the library below so a primitive answers with its own description.
 */
const PRIMITIVE_DESCRIPTIONS: Record<string, string> = {
	letter: "typesets a single character as a mark (`letter-A`); an optional `-f{n}` picks a font slot",
	"shape-circle": "a full disc",
	"shape-square": "a sharp square",
	"shape-square-1": "a square with small rounded corners",
	"shape-square-2": "a square with medium rounded corners",
	"shape-square-3": "a square with large rounded corners",
	"shape-shield": "a heraldic shield / crest",
	"shape-hex": "a hexagon",
	"shape-diamond": "a diamond (rhombus)",
	"shape-triangle": "an upward triangle",
	"shape-pentagon": "a pentagon",
	"shape-half": "a half-disc dome (semicircle)",
	"shape-quarter": "a quarter disc (quadrant)",
	"shape-wedge": "a pie sector; spin copies around to build a full pie",
	"shape-oval": "an ellipse; `sx`/`sy` reach any ratio from this one shape",
	"shape-pill": "a horizontal capsule",
	"shape-drop": "a teardrop",
	"shape-wave": "a water band",
	"shape-water": "a wavy fill level",
	"shape-swish": "a tapered swoosh",
	"shape-blob": "an organic blob",
	"shape-lens": "a vesica petal (a pointed oval)",
	"shape-leaf": "a leaf",
	"shape-cloud": "a cloud",
	"shape-mountain": "a mountain range",
	"shape-disc": "a flat cap (a thin ellipse); stack on a `cylinder` for a database drum",
	"shape-cylinder": "a square-edged oval drum (the database body)",
	"shape-cone": "a cone / funnel",
	"shape-octagon": "an octagon",
	"shape-trapezoid": "a trapezoid",
	"shape-ramp": "a right triangle (a slope)",
	"shape-arch": "an arch / doorway",
	"shape-squircle": "a squircle (a superellipse app tile)",
	"shape-egg": "an egg / ovoid",
	"shape-gem": "a faceted gem",
	"shape-chevron": "a solid chevron band",
	"shape-arrow": "a solid arrow",
	"shape-bubble": "a speech balloon",
	"shape-flame": "a flame",
	"shape-sun": "a sun with rays",
	"shape-banner": "a banner / ribbon",
	"shape-tag": "a price tag / label",
	"divider-rule": "a horizontal rule; `r90` stands it vertical",
	"frame-ring": "a thin circular ring (outline only)",
	"frame-border": "a square frame (outline only)",
	"stroke-line": "a straight rule; `r45` for a diagonal",
	"stroke-arc": "a semicircle curve (a smile)",
	"stroke-corner": "an L-bracket",
	"stroke-vee": "a chevron / caret pen-stroke",
	"bar-top": "a band across the top (chief)",
	"bar-row": "a horizontal band (fess)",
	"bar-column": "a vertical band (pale)",
	"bar-diagonal": "a diagonal band (bend)",
	"bar-cross": "a plus / cross",
	"symbol-star": "a 5-point star",
	"symbol-star-4": "a 4-point sparkle",
	"symbol-star-6": "a 6-point star",
	"symbol-star-8": "an 8-point star / compass",
	"symbol-burst": "a spiky starburst seal",
	"symbol-seal": "a scalloped rosette seal",
	"symbol-heart": "a heart",
	"symbol-crescent": "a crescent moon",
	"symbol-bolt": "a lightning bolt",
};

for (const [name, description] of Object.entries(PRIMITIVE_DESCRIPTIONS)) {
	const primitive = ICON_PRIMITIVES[name];
	if (primitive) primitive.description = description;
}

/** A primitive's one-line description, addressed by keyword or library name: its own if it carries one,
 * else a humanized fall-back for the functional glyphs (`symbol-check` → "a check glyph"). */
export function primitiveDescription(nameOrKeyword: string): string | undefined {
	const library = resolvePrimitiveName(nameOrKeyword);
	const primitive = iconPrimitive(library);
	if (!primitive) return undefined;
	if (primitive.description) return primitive.description;
	if (library.startsWith("symbol-")) return `a ${library.slice("symbol-".length).replace(/-/g, " ")} glyph`;
	return undefined;
}

/** One primitive in the roster: its library name, the grammar keywords that reach it, its family, and
 * its human-facing metadata — everything an agent needs to pick a primitive and name it. */
export interface IconPrimitiveEntry {
	library: string;
	family: string;
	keywords: string[];
	description?: string;
	tags: string[];
	since?: string;
}

/** The full primitive roster, each library entry paired with the grammar keywords that reach it (so an
 * agent learns both `cylinder` and its `drum` alias), its family, description, tags, and `since`. */
export function iconPrimitiveRoster(): IconPrimitiveEntry[] {
	const keywordsByLibrary = new Map<string, string[]>();
	for (const [keyword, library] of Object.entries(PRIMITIVE_KEYWORDS)) {
		const list = keywordsByLibrary.get(library) ?? [];
		list.push(keyword);
		keywordsByLibrary.set(library, list);
	}
	return iconPrimitiveNames().map((library) => {
		const primitive = iconPrimitive(library);
		return {
			library,
			family: library.includes("-") ? library.slice(0, library.indexOf("-")) : library,
			keywords: (keywordsByLibrary.get(library) ?? []).sort(),
			description: primitiveDescription(library),
			tags: primitive?.tags ?? [],
			since: primitive?.since,
		};
	});
}

const STROKE_WIDTH = [0, 0.75, 1.25, 1.75];

/**
 * A layer's effective per-axis scale. The two dials **layer** rather than compete: `s` sets the overall
 * size and `sx`/`sy` then stretch that result on one axis, so `s50-sx200` is "half size, then twice as
 * wide" and reads as a modifier on the size above it instead of silently discarding it.
 */
function layerScale(layer: IconLayer): { x: number; y: number } {
	const uniform = layer.scale ?? 1;
	return { x: uniform * (layer.scaleX ?? 1), y: uniform * (layer.scaleY ?? 1) };
}

/**
 * The stroke width for an outline size step, pre-divided by the layer's own scale so the drawn
 * thickness stays constant per icon rather than tracking the shape. A layer's scale rides on the
 * same group the stroke does, so SVG would otherwise scale the stroke with the shape (an `s50` shape
 * outlining at half thickness, an `s150` at 1.5×); dividing here cancels that, leaving the semantic
 * thickness a property of the icon, not the shape's size. A non-uniform scale cancels against the
 * geometric mean of the two axes — a single `stroke-width` cannot follow both, and the mean keeps a
 * uniform scale exactly where it was while landing a stretched shape's rim between the extremes.
 */
function outlineWidth(size: number, layer: IconLayer | undefined): number {
	const base = STROKE_WIDTH[size] ?? STROKE_WIDTH[1] ?? 0.75;
	if (!layer) return base;
	const { x, y } = layerScale(layer);
	return base / (Math.sqrt(Math.abs(x * y)) || 1);
}

/** Trims float noise from a computed coordinate. */
function n(value: number): string {
	return String(Math.round(value * 1000) / 1000);
}

/** The number of series slots the palette exposes (`1`..`9` → `series:0`..`series:8`). Every scheme
 * resolves to this many evenly-spread colors, so all nine slots are full and stable across schemes:
 * a nine-hue scheme (`skittles`) fills them with the whole crayon box, a smaller one cycles its own. */
export const ICON_SERIES_COUNT = 9;

/** The palette-nibble map, addressed `0`–`f`: `0` transparent, `1`–`9` the nine series colors, and the
 * semantic chrome slots that keep their meaning regardless of the series scheme, each with a one-letter
 * mnemonic — `a` `currentColor` (Active ink), `b` `--bg-0` (Background), `c` transparent (Clear), `e`
 * `--neutral-bg` (Empty: the neutral track an unfilled Rating mark or a Progress groove shows), `f`
 * `--fg-0` (Foreground); `d` reserved (inert). Use them as a layer color like any nibble (`ce` fills the
 * track color, as `cb`/`cf` fill the surface/ink). Every color flag (`c{n}`, an outline's `c{n}`, a drop
 * shadow's color) is a nibble into this. */
export const SLOT_TABLE: Record<number, string> = {
	0: "transparent",
	1: "series:0",
	2: "series:1",
	3: "series:2",
	4: "series:3",
	5: "series:4",
	6: "series:5",
	7: "series:6",
	8: "series:7",
	9: "series:8",
	10: "currentColor",
	11: "--bg-0",
	12: "transparent",
	13: "transparent",
	14: "--neutral-bg",
	15: "--fg-0",
};

/** True for a nibble that actually paints (every slot but transparent/reserved), so a `---pc-{hex}`
 * silhouette knows which slots to repaint and which to leave clear. */
function slotPaints(slot: number): boolean {
	return (slot >= 1 && slot <= 11) || slot === 14 || slot === 15;
}

/** Resolve a palette nibble to its color spec: a per-slot `---pc{n}` override wins, then a
 * whole-palette `---pc-{hex}` silhouette on a painting slot, then the canonical nibble map. */
function resolveSlot(slot: number, palette: Record<string, string> | undefined): string {
	const override = palette?.[slot] ?? (slotPaints(slot) ? palette?.["*"] : undefined);
	return override ?? SLOT_TABLE[slot] ?? "transparent";
}

/** Wraps a palette nibble as a deferred `slot:{n}` spec, resolved at compose time so a `---pc`
 * override (a single slot, or a whole-palette silhouette) can rewrite it before it lands. */
export function colorSlot(slot: number): string {
	return `slot:${slot}`;
}

/** The `xtyle-icon` root class for a glyph or mark, shared by the element and the Astro binding so
 * the size / tone / spin chrome stays in one place. (The fragment sandbox keeps its own copy: that
 * module must stay import-free to bundle whole.) */
export function iconClass(opts: { size?: string; tone?: string | null; spin?: boolean; extra?: string }): string {
	return [
		"xtyle-icon",
		opts.size && opts.size !== "md" && `xtyle-icon--${opts.size}`,
		opts.tone && `xtyle-icon--${opts.tone}`,
		opts.spin && "xtyle-icon--spin",
		opts.extra,
	]
		.filter(Boolean)
		.join(" ");
}

function resolveColor(spec: string | undefined, opts: ComposeIconOptions): string {
	if (!spec || spec === "currentColor") {
		const star = opts.palette?.["*"];
		return star && star !== "currentColor" ? resolveColor(star, opts) : "currentColor";
	}
	if (spec.startsWith("slot:")) {
		return resolveColor(resolveSlot(Number(spec.slice(5)), opts.palette), opts);
	}
	if (spec === "transparent" || spec === "none") return spec;
	if (spec.startsWith("series:")) {
		const index = Number(spec.slice(7));
		if (!Number.isInteger(index) || index < 0) return "currentColor";
		if (!opts.register) return "currentColor";
		const count = Math.max(ICON_SERIES_COUNT, index + 1);
		const palette = seriesPalette(opts.scheme ?? "accents", count, opts.register);
		return palette[index] ?? "currentColor";
	}
	if (spec.startsWith("--")) {
		return opts.register?.[spec] ?? `var(${spec})`;
	}
	return spec;
}

/** The center of grid cell `p` (1–9, phone-keypad: 1 top-left, 5 center, 9 bottom-right). */
function cellCenter(p: number): { x: number; y: number } {
	const col = (p - 1) % 3;
	const row = Math.floor((p - 1) / 3);
	return { x: CELL + col * 2 * CELL, y: CELL + row * 2 * CELL };
}

function layerTransform(layer: IconLayer): string {
	const parts: string[] = [];
	const dx = layer.x ?? 0;
	const dy = layer.y ?? 0;
	if (dx || dy) parts.push(`translate(${n(dx)} ${n(dy)})`);
	if (layer.rotate) parts.push(`rotate(${n(layer.rotate)} ${CENTER} ${CENTER})`);
	const scale = layerScale(layer);
	const sx = scale.x * (layer.flipH ? -1 : 1);
	const sy = scale.y * (layer.flipV ? -1 : 1);
	if (sx !== 1 || sy !== 1) {
		const scale = sx === sy ? n(sx) : `${n(sx)} ${n(sy)}`;
		parts.push(`translate(${CENTER} ${CENTER}) scale(${scale}) translate(${-CENTER} ${-CENTER})`);
	}
	return parts.join(" ");
}

/** A layer's flattened regions, pushed through its own transform so a coverage test runs in grid space. */
function layerRegions(layer: IconLayer): IconRegion[] {
	const source =
		layer.points != null
			? flattenBody(polyBody(layer.points, layer.openPath))
			: layer.glyph != null
				? flattenBody(letterBody(layer.glyph, "sans-serif"))
				: flattenBody((iconPrimitive(layer.primitive) ?? MISSING).body);
	const scale = layerScale(layer);
	const sx = scale.x * (layer.flipH ? -1 : 1);
	const sy = scale.y * (layer.flipV ? -1 : 1);
	const radians = ((layer.rotate ?? 0) * Math.PI) / 180;
	const cos = Math.cos(radians);
	const sin = Math.sin(radians);
	const dilation = Math.sqrt(Math.abs(sx * sy)) || 1;
	return source.map((region) => ({
		stroke: region.stroke * dilation,
		points: region.points.map(([px, py]) => {
			const scaledX = CENTER + ((px as number) - CENTER) * sx;
			const scaledY = CENTER + ((py as number) - CENTER) * sy;
			return [
				CENTER + (scaledX - CENTER) * cos - (scaledY - CENTER) * sin + (layer.x ?? 0),
				CENTER + (scaledX - CENTER) * sin + (scaledY - CENTER) * cos + (layer.y ?? 0),
			];
		}),
	}));
}

/** The grid resolution a composite's surviving ink is sampled at (units per sample on each axis). */
const COVERAGE_STEP = 0.25;

/**
 * The box a composition's ink actually covers on the 24-grid, or null when it paints nothing.
 *
 * A union of layer boxes is the wrong model here, because **a knockout is not ink** — it is the tool that
 * carves ink, and a carve can move where the art ends. `--circle--circle-x50-ko` bites the right half off
 * a disc; the union still reports the whole disc, so `---center` would seat the mark on a box half of
 * which is empty. So the composite is walked the way it paints: each layer's flattened regions are
 * sampled onto a coverage grid, a knockout clears what it covers, an inverted knockout keeps only what it
 * covers, and the result is the extent of what is left standing.
 *
 * The sampling is bounded by {@link COVERAGE_STEP}, so the answer is exact to a quarter unit — well under
 * what a viewer can see at icon scale, and it costs nothing unless a mark asks to be centered.
 */
export function compositionBox(composition: IconComposition): IconBox | null {
	if (composition.layers.length === 0) return null;
	const span = Math.round(GRID / COVERAGE_STEP);
	const covered = new Uint8Array(span * span);
	const at = (col: number, row: number): number => row * span + col;
	for (const layer of composition.layers) {
		const regions = layerRegions(layer);
		const hits = (px: number, py: number): boolean => regions.some((region) => regionCovers(region, px, py));
		for (let row = 0; row < span; row++) {
			const py = (row + 0.5) * COVERAGE_STEP;
			for (let col = 0; col < span; col++) {
				const px = (col + 0.5) * COVERAGE_STEP;
				const inside = hits(px, py);
				const index = at(col, row);
				if (layer.knockout) {
					if (layer.invert ? !inside : inside) covered[index] = 0;
				} else if (layer.invert) {
					if (!inside) covered[index] = 1;
				} else if (inside) {
					covered[index] = 1;
				}
			}
		}
	}
	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;
	for (let row = 0; row < span; row++) {
		for (let col = 0; col < span; col++) {
			if (!covered[at(col, row)]) continue;
			minX = Math.min(minX, col * COVERAGE_STEP);
			minY = Math.min(minY, row * COVERAGE_STEP);
			maxX = Math.max(maxX, (col + 1) * COVERAGE_STEP);
			maxY = Math.max(maxY, (row + 1) * COVERAGE_STEP);
		}
	}
	return minX === Infinity ? null : { minX, minY, maxX, maxY };
}

/** The whole-mark transform a `---center` / `---m` / `---s` finish asks for, or `""` when it is a no-op.
 * Reads outermost-first: the composite is moved (a `---center` correction, then `mx`/`my`), then scaled
 * about the canvas center. It wraps the outline and shadow filters rather than sitting under them, so a
 * finished mark moves as one piece instead of the art sliding around inside its own rim. */
function compositionTransform(composition: IconComposition): string {
	const t = composition.transform;
	let dx = t?.dx ?? 0;
	let dy = t?.dy ?? 0;
	if (composition.center) {
		const measured = compositionBox(composition);
		if (measured) {
			dx += CENTER - (measured.minX + measured.maxX) / 2;
			dy += CENTER - (measured.minY + measured.maxY) / 2;
		}
	}
	const sx = t?.scaleX ?? 1;
	const sy = t?.scaleY ?? 1;
	const parts: string[] = [];
	if (sx !== 1 || sy !== 1) {
		parts.push(`translate(${CENTER} ${CENTER}) scale(${sx === sy ? n(sx) : `${n(sx)} ${n(sy)}`}) translate(${-CENTER} ${-CENTER})`);
	}
	if (dx || dy) parts.push(`translate(${n(dx)} ${n(dy)})`);
	return parts.join(" ");
}

/**
 * Strokes a shape's silhouette as the rim of a knockout — an outline, never a fill. The body's own
 * `fill`/`stroke` (glyphs hardcode `currentColor`) is normalized so a *filled* glyph outlines instead
 * of filling, and a *stroked* glyph takes the outline color; a bare primitive inherits the group stroke.
 * `color` is left unset so an inherited outline color falls through to the icon's own `currentColor`
 * rather than the `"none"` `paintGroup` would seed, which is what made this render as a shade or a fill.
 */
function outlineGroup(body: string, outline: IconOutline, layer: IconLayer, transform: string, opts: ComposeIconOptions): string {
	const color = resolveColor(outline.color, opts);
	const width = outlineWidth(outline.size, layer);
	const stroked = body
		.replace(/fill="currentColor"/g, 'fill="none"')
		.replace(/stroke="currentColor"/g, `stroke="${color}"`);
	return `<g ${transform ? `transform="${transform}" ` : ""}fill="none" stroke="${color}" stroke-width="${n(width)}">${stroked}</g>`;
}

function paintGroup(body: string, fill: string, layer: IconLayer, transform: string, opts: ComposeIconOptions): string {
	const attrs = [
		transform && `transform="${transform}"`,
		`fill="${fill}"`,
		`color="${fill}"`,
		layer.outline && `stroke="${resolveColor(layer.outline.color, opts)}"`,
		layer.outline && `stroke-width="${n(outlineWidth(layer.outline.size, layer))}"`,
		layer.opacity != null && `opacity="${n(layer.opacity)}"`,
	]
		.filter(Boolean)
		.join(" ");
	return `<g ${attrs}>${body}</g>`;
}

const MISSING = bare(`<rect x="5" y="5" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="3 2"/>`);

/** A stable short id from a composition, so a knockout mask / rounding clip is unique per distinct spec but shared (harmlessly) between identical ones on a page. */
function specId(composition: IconComposition): string {
	const source = JSON.stringify(composition);
	let hash = 0x811c9dc5;
	for (let i = 0; i < source.length; i++) {
		hash ^= source.charCodeAt(i);
		hash = Math.imul(hash, 0x01000193);
	}
	return (hash >>> 0).toString(36);
}

/** The options a composition's colors resolve against: the caller's, with the mark's own palette
 * overrides and its own series scheme (a `---ps` finish) layered over them, so a name that pins a
 * scheme wins over the one the host passes. */
function paintOptions(composition: IconComposition, opts: ComposeIconOptions): ComposeIconOptions {
	if (!composition.palette && !composition.scheme) return opts;
	const out: ComposeIconOptions = { ...opts };
	if (composition.palette) out.palette = composition.palette;
	if (composition.scheme) out.scheme = composition.scheme;
	return out;
}

/**
 * Composes a layered icon into an SVG string. Layers paint back to front; a
 * `knockout` layer punches its shape through everything beneath it (a later layer
 * paints over the hole). An unknown primitive renders a visible placeholder box
 * rather than nothing, so a typo shows on screen.
 */
export function composeIcon(composition: IconComposition, opts: ComposeIconOptions = {}): string {
	const id = specId(composition);
	const defs: string[] = [];
	let body = "";
	let holes = 0;
	const paintOpts: ComposeIconOptions = paintOptions(composition, opts);

	for (const layer of composition.layers) {
		const primitive =
			layer.points != null
				? { body: polyBody(layer.points, layer.openPath) }
				: layer.glyph != null
					? { body: letterBody(layer.glyph, fontForSlot(layer.font, composition)) }
					: (iconPrimitive(layer.primitive) ?? MISSING);
		const transform = layerTransform(layer);
		if (layer.knockout) {
			const maskId = `xk-${id}-${holes++}`;
			const fieldFill = layer.invert ? "#000" : "#fff";
			const shapeFill = layer.invert ? "#fff" : "#000";
			const cut = `<g ${transform ? `transform="${transform}" ` : ""}fill="${shapeFill}" color="${shapeFill}">${primitive.body}</g>`;
			defs.push(
				`<mask id="${maskId}" maskUnits="userSpaceOnUse" x="0" y="0" width="${GRID}" height="${GRID}"><rect width="${GRID}" height="${GRID}" fill="${fieldFill}"/>${cut}</mask>`,
			);
			body = `<g mask="url(#${maskId})">${body}</g>`;
			if (layer.outline) body += outlineGroup(primitive.body, layer.outline, layer, transform, paintOpts);
		} else if (layer.invert) {
			const maskId = `xi-${id}-${holes++}`;
			const cut = `<g ${transform ? `transform="${transform}" ` : ""}fill="#000" color="#000">${primitive.body}</g>`;
			defs.push(
				`<mask id="${maskId}" maskUnits="userSpaceOnUse" x="0" y="0" width="${GRID}" height="${GRID}"><rect width="${GRID}" height="${GRID}" fill="#fff"/>${cut}</mask>`,
			);
			const alpha = layer.opacity != null && layer.opacity !== 1 ? ` fill-opacity="${n(layer.opacity)}"` : "";
			body += `<g mask="url(#${maskId})"><rect width="${GRID}" height="${GRID}" fill="${resolveColor(layer.fill, paintOpts)}"${alpha}/></g>`;
		} else {
			body += paintGroup(primitive.body, resolveColor(layer.fill, paintOpts), layer, transform, paintOpts);
		}
	}

	let overflow = "";
	if (composition.outline) {
		const ow = STROKE_WIDTH[composition.outline.size] ?? (STROKE_WIDTH[2] as number);
		const ocolor = resolveColor(composition.outline.color, paintOpts);
		const outlineId = `xol-${id}`;
		defs.push(
			`<filter id="${outlineId}" filterUnits="userSpaceOnUse" x="-${GRID}" y="-${GRID}" width="${GRID * 3}" height="${GRID * 3}"><feMorphology in="SourceAlpha" operator="dilate" radius="${n(ow)}" result="d"/><feFlood flood-color="${ocolor}" result="c"/><feComposite in="c" in2="d" operator="in" result="o"/><feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`,
		);
		body = `<g filter="url(#${outlineId})">${body}</g>`;
		overflow = ` style="overflow:visible"`;
	}

	if (composition.dropShadow) {
		const ds = composition.dropShadow;
		const color = resolveColor(ds.color, paintOpts);
		const filterId = `xds-${id}`;
		defs.push(
			`<filter id="${filterId}" filterUnits="userSpaceOnUse" x="-${GRID}" y="-${GRID}" width="${GRID * 3}" height="${GRID * 3}"><feDropShadow dx="${n(ds.dx)}" dy="${n(ds.dy)}" stdDeviation="${n(ds.blur)}" flood-opacity="0.5" style="flood-color:${color}"/></filter>`,
		);
		body = `<g filter="url(#${filterId})">${body}</g>`;
		overflow = ` style="overflow:visible"`;
	}

	const markTransform = compositionTransform(composition);
	if (markTransform) body = `<g transform="${markTransform}">${body}</g>`;

	const label = opts.label ?? composition.label;
	const a11y = label ? `role="img" aria-label="${escapeAttr(label)}"` : `aria-hidden="true"`;
	const title = label ? `<title>${escapeAttr(label)}</title>` : "";
	const head = defs.length ? `<defs>${defs.join("")}</defs>` : "";
	const cls = opts.className ? `class="${escapeAttr(opts.className)}" ` : "";
	const part = opts.part ? `part="${escapeAttr(opts.part)}" ` : "";
	// HACK: Firefox streaks a drop shadow whose art meets the viewport edge, so `---e{n}` pads the
	// viewBox for margin while the box stays `1em`
	const pad = composition.expand ? (composition.expand / 100) * GRID : 0;
	const vb = pad ? `${n(-pad)} ${n(-pad)} ${n(GRID + 2 * pad)} ${n(GRID + 2 * pad)}` : `0 0 ${GRID} ${GRID}`;
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="1em" height="1em" focusable="false"${overflow} ${cls}${part}${a11y}>${title}${head}${body}</svg>`;
}

/**
 * Composes an icon for a live surface: series slots resolve against `opts.register`
 * (the live cascade) while token fills stay `var(--…)`, so a mark bakes only what a
 * plain CSS variable can't carry and re-colors with the theme for everything else.
 */
export function composeIconThemed(composition: IconComposition, opts: ComposeIconOptions = {}): string {
	const palette = composition.palette;
	const paintOpts = paintOptions(composition, opts);
	const bake = (spec: string | undefined): string | undefined => {
		if (!spec || spec === "currentColor") return palette?.["*"] ?? spec;
		const s = spec.startsWith("slot:") ? resolveSlot(Number(spec.slice(5)), palette) : spec;
		return s.startsWith("series:") ? resolveColor(s, paintOpts) : s;
	};
	const layers = composition.layers.map((layer) => ({
		...layer,
		fill: bake(layer.fill),
		outline: layer.outline ? { ...layer.outline, color: bake(layer.outline.color) ?? layer.outline.color } : undefined,
	}));
	const dropShadow = composition.dropShadow
		? { ...composition.dropShadow, color: bake(composition.dropShadow.color) ?? composition.dropShadow.color }
		: undefined;
	const outline = composition.outline
		? { ...composition.outline, color: bake(composition.outline.color) ?? composition.outline.color }
		: undefined;
	return composeIcon(
		{
			layers,
			label: composition.label,
			dropShadow,
			outline,
			expand: composition.expand,
			fonts: composition.fonts,
			scheme: composition.scheme,
			transform: composition.transform,
			center: composition.center,
		},
		{ scheme: paintOpts.scheme, className: opts.className, part: opts.part, label: opts.label },
	);
}

/** A font a `letter` layer needs loaded, with ready-made Google Fonts loading snippets. */
export interface IconFontRequirement {
	/** The `font-family` the mark references. */
	family: string;
	/** The distinct glyphs the mark draws in this family — the subset an export needs, and no more. */
	glyphs: string;
	/**
	 * Whether a Google Fonts URL can be built for this family. When false, xtyle has no way to load it for
	 * you. With a catalogue installed ({@link useGoogleFontCatalogue}) this means Google really does serve
	 * the family; with none, it means only that the name is a legal one — a hyphenated or over-long family
	 * is still false, but an invented one Google has never heard of reads as true.
	 */
	google: boolean;
	/**
	 * The stylesheet URL, unescaped — what a framework binding wants (`<link href={googleHref}>`), where
	 * the binding does its own escaping. `null` when Google does not serve the family.
	 */
	googleHref: string | null;
	/** A CSS `@import` that loads the family from Google Fonts; `null` when Google does not serve it. */
	googleImport: string | null;
	/** A `<link>` to paste into HTML, escaped for that context; `null` when Google does not serve it. */
	googleLink: string | null;
	/** The nearest catalogue families when {@link google} is false — a "did you mean" for a typo. Empty
	 * unless a catalogue is installed; there is nothing to be near. */
	suggestions: string[];
}

/**
 * The external font families a composition's `letter` layers need loaded, each with the glyphs it draws
 * and ready-made Google Fonts loading code. Theme-token fonts (`var(--font-*)`) are skipped: they inherit
 * the page's own stacks and need nothing.
 *
 * With a Google Fonts catalogue installed ({@link useGoogleFontCatalogue}), loading code is emitted **only**
 * for a family Google actually serves; a family it does not gets `google: false` and a set of
 * {@link IconFontRequirement.suggestions}, because a URL built from a name Google has never heard of loads
 * nothing and renders in a fallback — better to say so than to hand over a snippet that quietly does not
 * work. With no catalogue, the engine cannot tell an invented family from a real one and emits the snippet
 * either way.
 *
 * The snippets are safe to paste into a page regardless: the family has passed the character-set gate, the
 * URL is built by {@link googleFontCssUrl}, and both snippets are escaped for the context they land in.
 */
export function iconFontImports(composition: IconComposition): IconFontRequirement[] {
	const families = new Map<string, Set<string>>();
	for (const layer of composition.layers) {
		if (layer.glyph == null) continue;
		const spec = fontForSlot(layer.font, composition);
		if (spec.startsWith("var(")) continue;
		const glyphs = families.get(spec) ?? new Set<string>();
		glyphs.add(layer.glyph);
		families.set(spec, glyphs);
	}
	return [...families].map(([family, glyphs]) => {
		const canonical = googleFontFamily(family);
		if (!canonical) {
			return { family, glyphs: [...glyphs].join(""), google: false, googleHref: null, googleImport: null, googleLink: null, suggestions: suggestGoogleFonts(family) };
		}
		const url = googleFontCssUrl(canonical);
		return {
			family: canonical,
			glyphs: [...glyphs].join(""),
			google: true,
			googleHref: url,
			googleImport: `@import url('${escapeCssUrl(url)}');`,
			googleLink: `<link rel="stylesheet" href="${escapeAttr(url)}">`,
			suggestions: [],
		};
	});
}

/** A parsed icon name: its accessible label (humanized) and the composition its spec describes. */
export interface ParsedIconName {
	label: string | null;
	composition: IconComposition;
}

const OBJECT_TOKEN = /-(?:(sx|sy|p|s|x|y|r|a)(-?\d+)|c([0-9a-f])|(o)([1-3])(?:c([0-9a-f]))?|(ko|fh|fv|i))/g;

function parseObject(segment: string): IconLayer | null {
	const keyword = /^[a-z]+[0-9]*/.exec(segment)?.[0];
	if (!keyword) return null;
	const layer: IconLayer = { primitive: resolvePrimitiveName(keyword) };
	let position = 5;
	let offX = 0;
	let offY = 0;
	let rest = segment.slice(keyword.length);
	if (keyword === "poly" || keyword === "polyline") {
		const m = /^-pts([a-z0-9.,]+)/.exec(rest);
		if (m) {
			const points = resolveIconPoints(m[1]);
			if (points) {
				layer.points = points;
				if (keyword === "polyline") layer.openPath = true;
			}
			rest = rest.slice(m[0].length);
		}
	}
	if (keyword === "letter") {
		const m = /^-(.)(?:-f(\d))?/.exec(rest);
		if (m) {
			layer.glyph = m[1];
			if (m[2] != null) layer.font = Number(m[2]);
			rest = rest.slice(m[0].length);
		}
	}
	OBJECT_TOKEN.lastIndex = 0;
	let token: RegExpExecArray | null;
	while ((token = OBJECT_TOKEN.exec(rest))) {
		if (token[1]) {
			const value = Number(token[2]);
			if (token[1] === "p") position = value;
			else if (token[1] === "s") layer.scale = value / 100;
			else if (token[1] === "sx") layer.scaleX = value / 100;
			else if (token[1] === "sy") layer.scaleY = value / 100;
			else if (token[1] === "x") offX = value;
			else if (token[1] === "y") offY = value;
			else if (token[1] === "r") layer.rotate = value;
			else if (token[1] === "a") layer.opacity = value / 100;
		} else if (token[3] != null) {
			layer.fill = colorSlot(parseInt(token[3], 16));
		} else if (token[4]) {
			layer.outline = { size: Number(token[5]), color: token[6] != null ? colorSlot(parseInt(token[6], 16)) : "currentColor" };
		} else if (token[7] === "ko") layer.knockout = true;
		else if (token[7] === "fh") layer.flipH = true;
		else if (token[7] === "fv") layer.flipV = true;
		else if (token[7] === "i") layer.invert = true;
	}
	const cell = cellCenter(position >= 1 && position <= 9 ? position : 5);
	const tx = cell.x - CENTER + (offX * GRID) / 100;
	const ty = cell.y - CENTER + (offY * GRID) / 100;
	if (tx) layer.x = tx;
	if (ty) layer.y = ty;
	return layer;
}

const SHADOW_MAX_OFFSET = 1.1;
const SHADOW_MAX_BLUR = 2.5;

/** Reads a `d{color}p{dir}s{size}t{soft}` drop-shadow token into an offset+blur the renderer applies. */
function parseDropShadow(token: string): IconDropShadow | null {
	const m = /^d([0-9a-f])?(?:p([1-9]))?(?:s([1-9]))?(?:t(\d{1,3}))?$/.exec(token);
	if (!m) return null;
	const color = colorSlot(m[1] != null ? parseInt(m[1], 16) : 15);
	const dir = m[2] != null ? Number(m[2]) : 8;
	const size = m[3] != null ? Number(m[3]) : 2;
	const soft = m[4] != null ? Math.min(100, Number(m[4])) : 50;
	const dirX = ((dir - 1) % 3) - 1;
	const dirY = Math.floor((dir - 1) / 3) - 1;
	const mag = Math.hypot(dirX, dirY) || 1;
	const dist = size * SHADOW_MAX_OFFSET;
	return {
		color,
		dx: (dirX / mag) * dist,
		dy: (dirY / mag) * dist,
		blur: (soft / 100) * SHADOW_MAX_BLUR,
	};
}

/** One `pc` palette-override flag, anchored to a single finish flag: `pc{nibble}-{value}` (per-slot) or
 * `pc-{value}` (whole-mark silhouette). The value runs to the end of the flag, so it may carry single
 * hyphens (a hyphenated token like `neutral-bg`) — finish flags are delimited by `--`, not `-`. */
const PC_FLAG = /^pc([0-9a-f])?-(.+)$/;

/** Token-name aliases for a `---pc` override: bare `fg`/`bg` mean the base ink / base surface. */
const PC_TOKEN_ALIAS: Record<string, string> = { fg: "fg-0", bg: "bg-0" };

/** One `f` font-slot flag: `f{n}-{name}` sets slot `n`, `f-{name}` sets slot 0 (the default). The name
 * runs to the end of the flag (finishes are `--`-delimited), so a multi-word family like `noto+sans` fits. */
const F_FLAG = /^f(\d)?-(.+)$/;

/** One `ps` palette flag: `ps-{palette}` pins the palette this mark's `c1`–`c9` slots draw from.
 * The value runs to the end of the flag, so a hyphenated palette name rides it fine. */
const PS_FLAG = /^ps-(.+)$/;

/** One `e` expand flag: `e{n}` pads the canvas by `n`% of the grid on every side. Capped at 100 (a full
 * grid of margin each way); a value past that is clamped rather than dropped. */
const E_FLAG = /^e(\d{1,3})$/;

/** One whole-mark `o` outline flag: `o{1-3}[c{0-f}]` — the same size steps and optional color nibble as a
 * layer's outline, but ringing the whole composite. Distinct from the per-layer `o` by living in the finish. */
const O_FLAG = /^o([1-3])(?:c([0-9a-f]))?$/;

/** The whole-mark transform flags: `s{%}` scales the composite, `sx`/`sy` then stretch that result on one
 * axis (they layer on `s`, they do not replace it), and `mx`/`my` move it by a signed percentage of the
 * grid. The finish-side twins of a layer's own `s` / `sx` / `sy` / `x` / `y`. */
const TRANSFORM_FLAG = /^(sx|sy|s|mx|my)(-?\d{1,4})$/;

/**
 * Resolve a `---pc` override value to a color spec that flows through `resolveColor`. Three shapes, so an
 * override can stay theme-reactive instead of baking a literal color: a **hex** (`3`/`4`/`6`/`8` digits)
 * is a fixed color; a single **nibble** (`0`–`f`) borrows that palette slot's canonical color (a series
 * color or a token, so it tracks the theme); a **token name** (`accent`, `success`, a named hue, the
 * `fg`/`bg` aliases, or a hyphenated token like `accent-2` / `neutral-bg`) resolves to `--{token}` off the
 * live register. Returns null for an unparseable value.
 */
function pcOverrideSpec(raw: string): string | null {
	if (/^[0-9a-f]$/.test(raw)) return SLOT_TABLE[parseInt(raw, 16)] ?? null;
	if (/^(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(raw)) return `#${raw}`;
	if (/^[a-z][a-z0-9-]*$/.test(raw)) return `--${PC_TOKEN_ALIAS[raw] ?? raw}`;
	return null;
}

/**
 * The `---` finish grammar: whole-icon metadata after the last object, its flags delimited by `--` (the
 * same separator as objects), so a flag's value can carry a single hyphen. Two kinds of flag coexist and
 * each reader skips the others' — render finishes the mark acts on (`d…` drop shadow, `pc…` palette
 * override, `f…` font slot, `ps…` series palette, `e…` canvas expand, `o…` whole-mark outline, the
 * `s`/`sx`/`sy`/`mx`/`my` whole-mark transform, and `center`), and `l…`
 * lock flags that are authoring metadata for the
 * builder's Randomize, invisible to the rendered mark. A `pc{nibble}-{value}` repaints that one palette
 * slot; a bare `pc-{value}` silhouettes every painting slot to one color (the transparent/reserved slots
 * stay clear). The value is a hex color, a palette nibble (`0`–`f`, theme-reactive), or a token name
 * (`accent`, `success`, a hue, `fg`/`bg`, or a hyphenated token like `neutral-bg`). A `ps-{scheme}` pins
 * the series scheme the mark's own `c1`–`c9` slots draw from, so the name carries its palette instead of
 * inheriting the host's; an unknown scheme is dropped and the host's still applies.
 */
function parseFinish(segment: string): Partial<IconComposition> {
	const out: Partial<IconComposition> = {};
	const palette: Record<string, string> = {};
	const fonts: Record<number, string> = {};
	const transform: IconTransform = { scaleX: 1, scaleY: 1, dx: 0, dy: 0 };
	let transformed = false;
	let uniform = 1;
	let axisX = 1;
	let axisY = 1;
	for (const flag of segment.split("--")) {
		if (!flag) continue;
		if (flag === "center") {
			out.center = true;
			continue;
		}
		const tf = TRANSFORM_FLAG.exec(flag);
		if (tf) {
			const value = Number(tf[2]);
			if (tf[1] === "s") uniform = value / 100;
			else if (tf[1] === "sx") axisX = value / 100;
			else if (tf[1] === "sy") axisY = value / 100;
			else if (tf[1] === "mx") transform.dx = (value * GRID) / 100;
			else transform.dy = (value * GRID) / 100;
			transformed = true;
			continue;
		}
		const pc = PC_FLAG.exec(flag);
		if (pc) {
			const spec = pcOverrideSpec(pc[2] as string);
			if (spec != null) {
				if (pc[1] != null) palette[String(parseInt(pc[1], 16))] = spec;
				else palette["*"] = spec;
			}
			continue;
		}
		const ps = PS_FLAG.exec(flag);
		if (ps) {
			const scheme = resolvePalette(ps[1] as string);
			if (scheme) out.scheme = scheme;
			continue;
		}
		const e = E_FLAG.exec(flag);
		if (e) {
			out.expand = Math.min(100, Number(e[1]));
			continue;
		}
		const o = O_FLAG.exec(flag);
		if (o) {
			out.outline = { size: Number(o[1]), color: o[2] != null ? colorSlot(parseInt(o[2], 16)) : "currentColor" };
			continue;
		}
		const f = F_FLAG.exec(flag);
		if (f) {
			const slot = f[1] != null ? Number(f[1]) : 0;
			const family = resolveFontSpec(f[2] as string);
			if (family != null) fonts[slot] = family;
			continue;
		}
		if (flag.startsWith("d")) {
			const shadow = parseDropShadow(flag);
			if (shadow) out.dropShadow = shadow;
		}
	}
	if (Object.keys(palette).length) out.palette = palette;
	if (Object.keys(fonts).length) out.fonts = fonts;
	if (transformed) {
		transform.scaleX = uniform * axisX;
		transform.scaleY = uniform * axisY;
		out.transform = transform;
	}
	return out;
}

/** Turns a label segment into an accessible name: `dice-3` → `dice 3`. */
function humanize(label: string): string {
	return label.replace(/-/g, " ").trim();
}

/**
 * Parses an icon name into a composition. A name is a spec when it contains `--`
 * (a label, then `--`-separated objects, then an optional `---` finish). A bare
 * name with no `--` is a lookup, not a spec, and returns `null` so the caller can
 * fall back to the functional set or a baked artifact.
 */
export function parseIconName(name: string): ParsedIconName | null {
	if (!name.includes("--")) return null;
	const finishAt = name.indexOf("---");
	const head = finishAt >= 0 ? name.slice(0, finishAt) : name;
	const finishRaw = finishAt >= 0 ? name.slice(finishAt + 3) : "";
	const parts = head.split("--");
	const label = parts[0] || null;
	const layers = parts
		.slice(1)
		.filter((segment) => segment.length > 0)
		.map(parseObject)
		.filter((layer): layer is IconLayer => layer != null);
	const composition: IconComposition = { layers };
	if (label) composition.label = humanize(label);
	if (finishRaw) Object.assign(composition, parseFinish(finishRaw));
	return { label, composition };
}

/** A name→mark generator: a pure function from a name to a composition, or null when the name isn't its shape. */
export type IconGenerator = (name: string) => ParsedIconName | null;

const iconGenerators: IconGenerator[] = [parseIconName];

/**
 * Registers an alternative name→mark generator (a hashed-identicon mode, a domain-specific mark
 * set). Generators are tried in registration order after the blessed default grammar, so an
 * alternative claims only the names the default declines. This is the seam that keeps the mark
 * generator swappable the way a token algorithm is: the engine owns `composeIcon` + the primitive
 * library, an author owns how a string becomes a composition.
 */
export function registerIconGenerator(generator: IconGenerator): void {
	iconGenerators.push(generator);
}

/** Resolves a name to a mark through the registered generators (the default grammar first), or null when none claims it. */
export function resolveIconMark(name: string): ParsedIconName | null {
	for (const generator of iconGenerators) {
		const parsed = generator(name);
		if (parsed) return parsed;
	}
	return null;
}

/** Resolve an icon name to a composition: a `--` spec composes through the mark grammar (so a colorful
 * taco works), a bare name is a single-layer primitive (`star` → `symbol-star`, any functional glyph by
 * its own name). An unknown name falls through to the primitive library's placeholder. */
export function iconComposition(name: string): IconComposition {
	if (name.includes("--")) {
		const parsed = resolveIconMark(name);
		if (parsed) return parsed.composition;
	}
	return { layers: [{ primitive: resolvePrimitiveName(name) }] };
}
