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

import { escapeAttr } from "./markup/escape.js";
import { seriesPalette, type SeriesScheme } from "./series.js";
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
	/** A literal color, `currentColor`, `transparent`, a token (`--accent`), or a series slot (`series:2`). Omit to inherit `currentColor`. */
	fill?: string;
	/** Uniform scale about the center (default 1). The grammar's `s{%}` maps here as a fraction of the full grid. */
	scale?: number;
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
}

export interface ComposeIconOptions {
	/** A derived register: when present, token and series colors bake to concrete values; without it they emit `var(--…)`. */
	register?: TokenRegister;
	/** The scheme a `series:N` slot draws from (default `accents`). */
	scheme?: SeriesScheme | string[];
	/** A class on the root `<svg>`, so a host can size / spin / tone the mark like a functional glyph. */
	className?: string;
	/** A `part` on the root `<svg>`, for `::part()` styling from a consumer. */
	part?: string;
	/** Palette overrides (from the composition's `---pc` finish), keyed by nibble or `*`; a `slot:{n}`
	 * spec consults this before falling back to the canonical `SLOT_TABLE`. */
	palette?: Record<string, string>;
}

// The whole primitive library shipped in 0.4.0; a later addition passes its own `since`.
const bare = (body: string, tags: string[] = [], since = "0.4.0"): IconPrimitive => ({ body, since, tags });

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

/** The seed primitive library: shapes, frames, bars, symbols, and the functional glyphs. Each carries
 * plain-language `tags` for search and filter; the keys are internal identifiers, not a taxonomy. */
export const ICON_PRIMITIVES: Record<string, IconPrimitive> = {
	"shape-circle": bare(`<circle cx="12" cy="12" r="11"/>`, ["circle", "round", "shape", "solid"]),
	"shape-square": bare(`<rect x="1.5" y="1.5" width="21" height="21"/>`, ["square", "box", "shape", "solid"]),
	"shape-square-1": bare(`<rect x="1.5" y="1.5" width="21" height="21" rx="2"/>`, ["square", "box", "rounded", "shape"]),
	"shape-square-2": bare(`<rect x="1.5" y="1.5" width="21" height="21" rx="4"/>`, ["square", "box", "rounded", "shape"]),
	"shape-square-3": bare(`<rect x="1.5" y="1.5" width="21" height="21" rx="6"/>`, ["square", "box", "rounded", "shape"]),
	"shape-shield": bare(`<path d="M12 1.5 L21 4.5 V12 C21 18 17.2 21 12 22.5 C6.8 21 3 18 3 12 V4.5 Z"/>`, ["shield", "badge", "crest", "game", "shape"]),
	"shape-hex": bare(`<path d="M12 1.5 L21 6.75 V17.25 L12 22.5 L3 17.25 V6.75 Z"/>`, ["hexagon", "hex", "game", "shape"]),
	"shape-diamond": bare(`<path d="M12 1 L23 12 L12 23 L1 12 Z"/>`, ["diamond", "rhombus", "shape"]),
	"shape-triangle": bare(`<path d="M12 2.5 L21.5 21.5 H2.5 Z"/>`, ["triangle", "angular", "shape"]),
	"divider-rule": bare(`<rect x="2" y="11" width="20" height="2" rx="1"/>`, ["divider", "line", "separator", "rule"]),
	"frame-ring": bare(`<circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" stroke-width="1.5"/>`, ["ring", "circle", "frame", "outline", "round"]),
	"frame-border": bare(`<rect x="2.25" y="2.25" width="19.5" height="19.5" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/>`, ["border", "square", "frame", "outline"]),
	"bar-top": bare(`<rect x="2" y="2" width="20" height="5"/>`, ["bar", "band", "stripe", "top", "chief"]),
	"bar-row": bare(`<rect x="2" y="9.5" width="20" height="5"/>`, ["bar", "band", "stripe", "row", "horizontal", "fess"]),
	"bar-column": bare(`<rect x="9.5" y="2" width="5" height="20"/>`, ["bar", "band", "stripe", "column", "vertical", "pale"]),
	"bar-diagonal": bare(`<path d="M2 7 L17 22 L22 17 L7 2 Z"/>`, ["diagonal", "stripe", "slash", "band", "bend"]),
	"bar-cross": bare(`<path d="M9.5 2 h5 v7.5 h7.5 v5 h-7.5 v7.5 h-5 v-7.5 h-7.5 v-5 h7.5 Z"/>`, ["cross", "plus", "symbol"]),
	"symbol-star": bare(`<path d="M12 2 l2.9 6.2 6.8 0.7 -5.1 4.6 1.5 6.7 -6.1 -3.6 -6.1 3.6 1.5 -6.7 -5.1 -4.6 6.8 -0.7 Z"/>`, ["star", "favorite", "rating", "symbol"]),
	"symbol-heart": bare(`<path d="M12 21 C12 21 3 14.5 3 8.5 A4.5 4.5 0 0 1 12 6 A4.5 4.5 0 0 1 21 8.5 C21 14.5 12 21 12 21 Z"/>`, ["heart", "love", "favorite", "symbol"]),
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
	divider: "divider-rule",
	dot: "shape-circle",
	ring: "frame-ring",
	border: "frame-border",
	top: "bar-top",
	row: "bar-row",
	column: "bar-column",
	diagonal: "bar-diagonal",
	cross: "bar-cross",
	// heraldic aliases: kept so the older band names still resolve and stay findable in search
	chief: "bar-top",
	fess: "bar-row",
	pale: "bar-column",
	bend: "bar-diagonal",
	star: "symbol-star",
	heart: "symbol-heart",
	crescent: "symbol-crescent",
	bolt: "symbol-bolt",
};

/** Resolve a grammar keyword (`star`) or a bare library name (`symbol-star`) to its library name. */
export function resolvePrimitiveName(nameOrKeyword: string): string {
	return PRIMITIVE_KEYWORDS[nameOrKeyword] ?? nameOrKeyword;
}

/** The version a primitive first shipped in, addressed by keyword or library name (undefined if unknown). */
export function primitiveSince(nameOrKeyword: string): string | undefined {
	return ICON_PRIMITIVES[resolvePrimitiveName(nameOrKeyword)]?.since;
}

/** A primitive's plain-language tags, addressed by keyword or library name (empty when unknown). */
export function primitiveTags(nameOrKeyword: string): string[] {
	return ICON_PRIMITIVES[resolvePrimitiveName(nameOrKeyword)]?.tags ?? [];
}

/** True when `name` resolves to a primitive in the library. */
export function hasPrimitive(name: string): boolean {
	return Object.prototype.hasOwnProperty.call(ICON_PRIMITIVES, name);
}

/** Every primitive name in the library. */
export const ICON_PRIMITIVE_NAMES: string[] = Object.keys(ICON_PRIMITIVES);

const STROKE_WIDTH = [0, 0.75, 1.25, 1.75];

/** Trims float noise from a computed coordinate. */
function n(value: number): string {
	return String(Math.round(value * 1000) / 1000);
}

/** The number of series slots the palette exposes (`1`..`9` → `series:0`..`series:8`). Every scheme
 * resolves to this many evenly-spread colors, so all nine slots are full and stable across schemes:
 * a nine-hue scheme (`skittles`) fills them with the whole crayon box, a smaller one cycles its own. */
export const ICON_SERIES_COUNT = 9;

/** The palette-nibble map, addressed `0`–`f`: `0` transparent, `1`–`9` the nine series colors,
 * `a` `currentColor` (the "active" ink), `b` `--bg-0`, `c` transparent, `f` `--fg-0`; `d`/`e` reserved
 * (inert). Every color flag (`c{n}`, an outline's `c{n}`, a drop shadow's color) is a nibble into this. */
const SLOT_TABLE: Record<number, string> = {
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
	14: "transparent",
	15: "--fg-0",
};

/** True for a nibble that actually paints (every slot but transparent/reserved), so a `---pc-{hex}`
 * silhouette knows which slots to repaint and which to leave clear. */
function slotPaints(slot: number): boolean {
	return (slot >= 1 && slot <= 11) || slot === 15;
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
	// A `---pc-{hex}` silhouette flattens the implicit ink (no fill / `currentColor`) too, not just slots.
	if (!spec || spec === "currentColor") return opts.palette?.["*"] ?? "currentColor";
	if (spec.startsWith("slot:")) {
		return resolveColor(resolveSlot(Number(spec.slice(5)), opts.palette), opts);
	}
	if (spec === "transparent" || spec === "none") return spec;
	if (spec.startsWith("series:")) {
		const index = Number(spec.slice(7));
		if (!Number.isInteger(index) || index < 0) return "currentColor";
		if (!opts.register) return "currentColor";
		// Resolve against a fixed-size palette, not `index + 1`: sizing to the index made every slot
		// take the *last* color of its own little palette, so a sequential scheme (thermal) collapsed
		// to its endpoint and a sampled categorical (skittles) to its last color. A stable count makes
		// each slot a distinct, evenly-spread color — `s1`..`s5` span the whole scheme.
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
	const sx = (layer.scale ?? 1) * (layer.flipH ? -1 : 1);
	const sy = (layer.scale ?? 1) * (layer.flipV ? -1 : 1);
	if (sx !== 1 || sy !== 1) {
		const scale = sx === sy ? n(sx) : `${n(sx)} ${n(sy)}`;
		parts.push(`translate(${CENTER} ${CENTER}) scale(${scale}) translate(${-CENTER} ${-CENTER})`);
	}
	return parts.join(" ");
}

/**
 * Strokes a shape's silhouette as the rim of a knockout — an outline, never a fill. The body's own
 * `fill`/`stroke` (glyphs hardcode `currentColor`) is normalized so a *filled* glyph outlines instead
 * of filling, and a *stroked* glyph takes the outline color; a bare primitive inherits the group stroke.
 * `color` is left unset so an inherited outline color falls through to the icon's own `currentColor`
 * rather than the `"none"` `paintGroup` would seed, which is what made this render as a shade or a fill.
 */
function outlineGroup(body: string, outline: IconOutline, transform: string, opts: ComposeIconOptions): string {
	const color = resolveColor(outline.color, opts);
	const width = STROKE_WIDTH[outline.size] ?? STROKE_WIDTH[1];
	const stroked = body
		.replace(/fill="currentColor"/g, 'fill="none"')
		.replace(/stroke="currentColor"/g, `stroke="${color}"`);
	return `<g ${transform ? `transform="${transform}" ` : ""}fill="none" stroke="${color}" stroke-width="${width}">${stroked}</g>`;
}

function paintGroup(body: string, fill: string, layer: IconLayer, transform: string, opts: ComposeIconOptions): string {
	const attrs = [
		transform && `transform="${transform}"`,
		`fill="${fill}"`,
		// seeds currentColor for any child glyph drawn in it, so a symbol matches the layer fill
		`color="${fill}"`,
		layer.outline && `stroke="${resolveColor(layer.outline.color, opts)}"`,
		layer.outline && `stroke-width="${STROKE_WIDTH[layer.outline.size] ?? STROKE_WIDTH[1]}"`,
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
	const paletteOpts: ComposeIconOptions = composition.palette ? { ...opts, palette: composition.palette } : opts;

	for (const layer of composition.layers) {
		const primitive = ICON_PRIMITIVES[layer.primitive] ?? MISSING;
		const transform = layerTransform(layer);
		if (layer.knockout) {
			// A normal knockout punches the shape out of the art below (white field, black shape);
			// an inverted knockout (`-i-ko`) flips the mask so only the shape survives — clipping the
			// accumulated art to the shape's silhouette (a circle clip, a heart clip, …).
			const maskId = `xk-${id}-${holes++}`;
			const fieldFill = layer.invert ? "#000" : "#fff";
			const shapeFill = layer.invert ? "#fff" : "#000";
			// Seed `color` too, so a glyph body drawn with `currentColor` (fill or stroke) resolves to
			// the solid mask silhouette instead of a mid-tone that only half-cuts — same trick paintGroup
			// uses for the normal paint. Without it, a glyph knocks out as a faint shade, not a hole.
			const cut = `<g ${transform ? `transform="${transform}" ` : ""}fill="${shapeFill}" color="${shapeFill}">${primitive.body}</g>`;
			defs.push(
				`<mask id="${maskId}" maskUnits="userSpaceOnUse" x="0" y="0" width="${GRID}" height="${GRID}"><rect width="${GRID}" height="${GRID}" fill="${fieldFill}"/>${cut}</mask>`,
			);
			body = `<g mask="url(#${maskId})">${body}</g>`;
			if (layer.outline) body += outlineGroup(primitive.body, layer.outline, transform, paletteOpts);
		} else if (layer.invert) {
			// Paint the fill everywhere *except* the shape — a filled field with a shape-hole.
			const maskId = `xi-${id}-${holes++}`;
			const cut = `<g ${transform ? `transform="${transform}" ` : ""}fill="#000" color="#000">${primitive.body}</g>`;
			defs.push(
				`<mask id="${maskId}" maskUnits="userSpaceOnUse" x="0" y="0" width="${GRID}" height="${GRID}"><rect width="${GRID}" height="${GRID}" fill="#fff"/>${cut}</mask>`,
			);
			const alpha = layer.opacity != null && layer.opacity !== 1 ? ` fill-opacity="${n(layer.opacity)}"` : "";
			body += `<g mask="url(#${maskId})"><rect width="${GRID}" height="${GRID}" fill="${resolveColor(layer.fill, paletteOpts)}"${alpha}/></g>`;
		} else {
			body += paintGroup(primitive.body, resolveColor(layer.fill, paletteOpts), layer, transform, paletteOpts);
		}
	}

	// A whole-icon drop shadow: a colored, offset, blurred copy of the accumulated art cast behind it.
	// The shadow can reach past the 24-unit box, so the svg is allowed to overflow when one is present.
	let overflow = "";
	if (composition.dropShadow) {
		const ds = composition.dropShadow;
		const color = resolveColor(ds.color, paletteOpts);
		const filterId = `xds-${id}`;
		defs.push(
			`<filter id="${filterId}" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="${n(ds.dx)}" dy="${n(ds.dy)}" stdDeviation="${n(ds.blur)}" flood-opacity="0.5" style="flood-color:${color}"/></filter>`,
		);
		body = `<g filter="url(#${filterId})">${body}</g>`;
		overflow = ` style="overflow:visible"`;
	}

	const a11y = composition.label ? `role="img" aria-label="${escapeAttr(composition.label)}"` : `aria-hidden="true"`;
	const title = composition.label ? `<title>${escapeAttr(composition.label)}</title>` : "";
	const head = defs.length ? `<defs>${defs.join("")}</defs>` : "";
	const cls = opts.className ? `class="${escapeAttr(opts.className)}" ` : "";
	const part = opts.part ? `part="${escapeAttr(opts.part)}" ` : "";
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${GRID} ${GRID}" width="1em" height="1em" focusable="false"${overflow} ${cls}${part}${a11y}>${title}${head}${body}</svg>`;
}

/**
 * Composes an icon for a live surface: series slots resolve against `opts.register`
 * (the live cascade) while token fills stay `var(--…)`, so a mark bakes only what a
 * plain CSS variable can't carry and re-colors with the theme for everything else.
 */
export function composeIconThemed(composition: IconComposition, opts: ComposeIconOptions = {}): string {
	const palette = composition.palette;
	// Resolve a deferred `slot:{n}` (applying any `---pc` override), then bake only a series color to a
	// concrete value; a token / currentColor / transparent / literal is left for `composeIcon` to emit as
	// `var(--…)` so the mark re-colors live with the theme.
	const bake = (spec: string | undefined): string | undefined => {
		// implicit ink (no fill / currentColor) also takes the `*` silhouette
		if (!spec || spec === "currentColor") return palette?.["*"] ?? spec;
		const s = spec.startsWith("slot:") ? resolveSlot(Number(spec.slice(5)), palette) : spec;
		return s.startsWith("series:") ? resolveColor(s, opts) : s;
	};
	const layers = composition.layers.map((layer) => ({
		...layer,
		fill: bake(layer.fill),
		outline: layer.outline ? { ...layer.outline, color: bake(layer.outline.color) ?? layer.outline.color } : undefined,
	}));
	const dropShadow = composition.dropShadow
		? { ...composition.dropShadow, color: bake(composition.dropShadow.color) ?? composition.dropShadow.color }
		: undefined;
	return composeIcon({ layers, label: composition.label, dropShadow }, { scheme: opts.scheme, className: opts.className, part: opts.part });
}

/** A parsed icon name: its accessible label (humanized) and the composition its spec describes. */
export interface ParsedIconName {
	label: string | null;
	composition: IconComposition;
}

const OBJECT_TOKEN = /-(?:(p|s|x|y|r|a)(-?\d+)|c([0-9a-f])|(o)([1-3])(?:c([0-9a-f]))?|(ko|fh|fv|i))/g;

function parseObject(segment: string): IconLayer | null {
	// A primitive keyword is letters plus an optional trailing index (`square`, `square1`), so an
	// indexed variant reads as one token before the `-`-separated flags.
	const keyword = /^[a-z]+[0-9]*/.exec(segment)?.[0];
	if (!keyword) return null;
	const layer: IconLayer = { primitive: PRIMITIVE_KEYWORDS[keyword] ?? keyword };
	let position = 5;
	let offX = 0;
	let offY = 0;
	const rest = segment.slice(keyword.length);
	OBJECT_TOKEN.lastIndex = 0;
	let token: RegExpExecArray | null;
	while ((token = OBJECT_TOKEN.exec(rest))) {
		if (token[1]) {
			const value = Number(token[2]);
			if (token[1] === "p") position = value;
			else if (token[1] === "s") layer.scale = value / 100;
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

const PC_OVERRIDE = /pc([0-9a-f])?-([0-9a-f]{3,8})/g;

/**
 * The `---` finish grammar: whole-icon metadata after the last object. Three kinds of token coexist and
 * each reader skips the others' — render finishes the mark acts on (`d…` drop shadow, `pc…` palette
 * override), and `l…` lock flags that are authoring metadata for the builder's Randomize, invisible to
 * the rendered mark. A `pc{nibble}-{hex}` repaints that one palette slot; a bare `pc-{hex}` silhouettes
 * every painting slot to one color (the transparent/reserved slots stay clear).
 */
function parseFinish(segment: string): Partial<IconComposition> {
	const out: Partial<IconComposition> = {};
	const palette: Record<string, string> = {};
	PC_OVERRIDE.lastIndex = 0;
	let pc: RegExpExecArray | null;
	while ((pc = PC_OVERRIDE.exec(segment))) {
		const hex = `#${pc[2]}`;
		if (pc[1] != null) palette[String(parseInt(pc[1], 16))] = hex;
		else palette["*"] = hex;
	}
	for (const token of segment.replace(PC_OVERRIDE, "").split("-")) {
		if (token.startsWith("d")) {
			const shadow = parseDropShadow(token);
			if (shadow) out.dropShadow = shadow;
		}
	}
	if (Object.keys(palette).length) out.palette = palette;
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
