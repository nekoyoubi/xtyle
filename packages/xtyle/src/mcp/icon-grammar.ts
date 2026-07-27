/**
 * The icon-name grammar as structured data, so the `xtyle_icons` tool hands an agent the rules rather
 * than making it infer them. This is the prose of `docs/icon-name-grammar.md` turned into tables an
 * agent can read field by field; the live primitive roster and palette list are merged in at call time
 * so those never drift, and the `icons` concept resource carries the same grammar as narrative.
 */
export const ICON_GRAMMAR = {
	summary:
		"An icon name is its own spec. A short name (`search`) is a known glyph or a baked file; a longer name is a terse description of a mark, parsed and composed to SVG on the fly. Colors resolve to theme slots, so a generated mark recolors with the theme for free.",
	spec: "{label}--{object}--{object}…---{finish}",
	structure: [
		"Split on `---` (triple) first into [head, finish].",
		"Split head on `--` (double) into [label, ...objects].",
		"Split finish on `--` (double) into finish flags. A flag value may carry single hyphens (`accent-2`, `neutral-bg`).",
		"An object is a primitive keyword followed by any number of flags in any order — only the keyword is positional.",
		"Objects paint back-to-front; a later object sits on top of an earlier one.",
	],
	resolutionCascade: [
		"Known glyph: the name is an entry in the functional set (`search`, `check`, `chevron-right`) → render that glyph.",
		"Baked artifact: a build/SSR/cache lookup finds a materialized SVG → serve it.",
		"Generate: parse the name as a spec and compose the SVG live, labeling it from the name's label segment.",
	],
	label:
		"The human handle and the icon's accessible name (`dice-3` announces as \"dice 3\"). Not part of the cache identity. Omit it and the mark is decorative (`aria-hidden`).",
	objectFlags: [
		{ flag: "p{1-9}", meaning: "grid cell on a phone-keypad 3×3 (1=top-left, 5=center, 9=bottom-right)", default: "p5" },
		{ flag: "x{±%} y{±%}", meaning: "fine offset from the cell anchor, % of the grid", default: "0" },
		{ flag: "s{%}", meaning: "size, % of the full 24-unit grid", default: "100" },
		{ flag: "sx{%} sy{%}", meaning: "stretch one axis, multiplied onto `s` (so `s50-sx200` is half size then twice as wide)", default: "100" },
		{ flag: "r{±deg}", meaning: "rotation about the object's own center", default: "0" },
		{ flag: "c{0-f}", meaning: "fill color (see colorNibbles)", default: "currentColor" },
		{ flag: "o{1-3}[c{0-f}]", meaning: "outline: 1/2/3 = thin/medium/thick stroke, optional trailing stroke color", default: "no outline" },
		{ flag: "a{%}", meaning: "opacity", default: "100" },
		{ flag: "fh / fv", meaning: "flip horizontal / vertical", default: "none" },
		{ flag: "ko", meaning: "knockout: subtract this shape from the art beneath it, down to the page", default: "paint" },
		{ flag: "i", meaning: "invert coverage to the complement; with `ko` (`-i-ko`) clips the composite to the shape's silhouette", default: "paint the shape" },
	],
	colorNibbles: [
		{ slot: "c0", resolvesTo: "transparent" },
		{ slot: "c1–c9", resolvesTo: "series colors 1–9, drawn from the active `colors` palette" },
		{ slot: "ca", resolvesTo: "currentColor — the active ink" },
		{ slot: "cb", resolvesTo: "--bg-0 — background" },
		{ slot: "cc", resolvesTo: "transparent — clear" },
		{ slot: "cd", resolvesTo: "reserved (inert)" },
		{ slot: "ce", resolvesTo: "--neutral-bg — the empty/neutral track" },
		{ slot: "cf", resolvesTo: "--fg-0 — foreground" },
	],
	colorNotes: [
		"An object with no `c` inherits `currentColor`, so an un-colored spec tints with surrounding text.",
		"Every `colors` palette resolves to exactly nine series colors (ICON_SERIES_COUNT), so slots 1–9 are always full and stable across palettes.",
		"The palette comes from the host (`<xtyle-icon colors=\"skittles\">`) unless the mark pins its own with the `ps-` finish, which wins.",
	],
	finishFlags: [
		{ flag: "d{c}p{1-9}s{1-5}t{%}", meaning: "drop shadow: color / cast direction / distance / softness. Sub-params optional (default `dfp8s2t50`)" },
		{ flag: "pc{n}-{value}", meaning: "palette override: repaint one slot. Value is a hex, a nibble 0–f, or a token name (`accent`, `success`, `fg`/`bg`)" },
		{ flag: "pc-{value}", meaning: "silhouette: force every painting slot to one color" },
		{ flag: "ps-{palette}", meaning: "series palette: pin which palette c1–c9 draw from, so the name carries its palette" },
		{ flag: "f{n}-{name}", meaning: "font slot: bind slot n for `letter` layers to a font (`sans`/`display`/`mono`, or a literal family with `+` for spaces)" },
		{ flag: "e{n}", meaning: "expand canvas: pad the viewBox by n% so edge-hugging art gains margin under a shadow" },
		{ flag: "s{%} sx{%} sy{%}", meaning: "whole-mark size: scale the finished composite about the canvas center" },
		{ flag: "mx{±%} my{±%}", meaning: "whole-mark move: shift the finished composite by a signed % of the grid" },
		{ flag: "center", meaning: "re-center: measure the ink the mark actually leaves standing and center that box (applied before mx/my)" },
		{ flag: "o{1-3}[c{0-f}]", meaning: "whole-mark outline: one stroke ringing the union silhouette of everything the mark paints" },
		{ flag: "l{index}{codes}", meaning: "lock flags: authoring metadata the renderer ignores; pins layer props against the builder's Randomize. Stripped on export" },
	],
	renderModel: [
		"c0 (transparent) paints nothing; layers below show through.",
		"ko (knockout) punches this shape through everything painted beneath it, to the page behind the icon.",
		"i (invert) alone fills everything except the shape; `-i-ko` inverts the knockout so only the shape survives, clipping the composite to that silhouette (`--circle-i-ko` rounds the whole mark to a circle).",
	],
	textMarks:
		"`letter-{glyph}` typesets one character as a mark, colored/outlined/scaled like any primitive. `-f{n}` picks a font slot (f0 sans, f1 display, f2 mono): `--letter-Q-f1` is a display-face Q.",
	extensibility:
		"Mechanism (fixed): the primitive library, `composeIcon`, and the `IconComposition` shape. Opinion (swappable): `parseIconName` and its `--`/`---` grammar and keyword vocabulary. A `registerIconGenerator(name → IconComposition)` alternative is tried after the default, claiming only names the default declines.",
	examples: [
		{ name: "search", note: "a known functional glyph" },
		{ name: "badge--circle-c2--star-s55-cf", note: "a filled circle with a centered foreground star" },
		{ name: "badge--hex-c2--star-s55-cf--circle-i-ko", note: "a hex badge clipped to a circle" },
		{ name: "database--cylinder-c1--disc-y-25-c3--disc-y-2-c2-a70", note: "a drum with two platter bands" },
		{ name: "lozenge--circle-c2-sx160-sy70", note: "one circle stretched into an ellipse" },
		{ name: "badge--circle-c2--bolt-s52-cb---dfp8s3t60", note: "a bolt badge lifted off the page by a soft drop shadow" },
		{ name: "heat--ring-c1--dot-s28-c9---ps-thermal--pc1-fg", note: "a thermal mark, slot 1 forced to the foreground ink" },
		{ name: "badge--circle-c1--letter-A-cb-s55---f0-display", note: "a display-font A on an accent disc" },
		{ name: "crest--star-p1-s40-c1---center", note: "a mark built off-center, then measured and re-centered" },
	],
} as const;
