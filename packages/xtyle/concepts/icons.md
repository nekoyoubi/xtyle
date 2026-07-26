# Icons

An icon **name is its own spec**. A short name like `search` is a known glyph or a
pre-baked file; a longer name is a terse, writable description of a mark, parsed into a
layered composition and rendered to SVG on the fly when no baked artifact exists. Because
a generated mark's colors resolve to theme slots rather than dead hex, it recolors with
the active theme for free.

Query the live set through the MCP `xtyle_icons` tool: the whole roster and grammar, one
primitive in detail, or a spec composed to SVG so you can see the mark. In code the path
is `composeIcon(iconComposition(name))`; nothing about *consuming* a finished icon needs
the generator running.

## Resolution cascade

`<xtyle-icon name="…">` resolves a name in order: a **known glyph** → that glyph; a
**baked artifact** → that SVG; otherwise **generate** by parsing the name as a spec. A
name that is only a label with no spec and no baked artifact renders a placeholder, so a
typo shows rather than vanishes.

## Grammar

```
{label}--{object}--{object}…---{finish}
```

- Split on `---` (triple) first into `[head, finish]`.
- Split `head` on `--` (double) into `[label, ...objects]`.
- Split `finish` on `--` into finish flags. Values keep single hyphens (`accent-2`).

The **label** is the human handle and the icon's accessible name (`dice-3` announces as
"dice 3"). Omit it and the mark is decorative (`aria-hidden`). It is not part of the cache
identity, so two labels with the same spec share one artifact.

Objects paint **back-to-front**: a later object sits on top of an earlier one.

### object flags

A primitive keyword followed by any number of flags, in any order (only the keyword is
positional):

| flag | meaning | default |
|------|---------|---------|
| `p{1-9}` | grid cell on a phone-keypad 3×3 (1=top-left, 5=center, 9=bottom-right) | `p5` |
| `x{±%}` `y{±%}` | fine offset from the cell anchor | `0` |
| `s{%}` | size, % of the 24-unit grid | `100` |
| `sx{%}` `sy{%}` | stretch one axis, **multiplied onto `s`** (`s50-sx200` = half size, then twice as wide) | `100` |
| `r{±deg}` | rotation about the object's own center | `0` |
| `c{0-f}` | fill color (see the palette) | `currentColor` |
| `o{1-3}[c{0-f}]` | outline: 1/2/3 thin/medium/thick, optional trailing stroke color | none |
| `a{%}` | opacity | `100` |
| `fh` / `fv` | flip horizontal / vertical | none |
| `ko` | knockout: subtract this shape from the art beneath it | paint |
| `i` | invert coverage; with `ko` (`-i-ko`) clip the composite to the shape's silhouette | paint |

### color palette

`c{n}` takes one hex nibble `0`–`f`:

| slot | resolves to |
|------|-------------|
| `c0` | transparent |
| `c1`–`c9` | series colors 1–9, drawn from the active `colors` palette |
| `ca` | `currentColor` (active ink) |
| `cb` | `--bg-0` (background) |
| `cc` | transparent (clear) |
| `cd` | reserved (inert) |
| `ce` | `--neutral-bg` (empty track) |
| `cf` | `--fg-0` (foreground) |

An object with no `c` inherits `currentColor`. Every palette resolves to exactly nine
series colors, so slots 1–9 are always full. The palette comes from the host
(`<xtyle-icon colors="skittles">`) unless the mark pins its own with `---ps-{palette}`.
The shipped palettes are `accents`, `skittles`, `statuses`, `thermal`, `severity`,
`intensity`.

### primitives

Keywords are single tokens mapping to the library: stamped shapes (`circle`, `square`,
`square1/2/3`, `hex`, `diamond`, `triangle`, `shield`, `pentagon`, `octagon`), volumes
(`disc`, `cylinder`/`drum`, `cone`, `oval`, `pill`, `egg`, `arch`, `wedge`, `half`,
`quarter`), nature and curves (`wave`, `water`, `swish`, `blob`, `lens`, `leaf`, `cloud`,
`mountain`, `sun`, `flame`, `drop`), markers (`banner`, `tag`, `bubble`, `chevron`,
`arrow`), stars and seals (`star`, `star4`/`sparkle`, `star6`, `star8`, `burst`, `seal`),
pen-strokes (`line`, `arc`, `corner`, `vee`), frames (`ring`, `border`), and bars. Most
are **filled art, not line work** — a mark stacks solids. `sx`/`sy` restretch any of them,
so one `oval` covers every ellipse ratio. A trailing index picks a variant (`square1`,
`star6`). The single-token functional glyphs are reachable by their bare name too
(`check`, `search`), so `badge--circle-c2--check-s55-cf` works.

`letter-{glyph}` typesets one character as a mark, colored/outlined/scaled like any
primitive; `-f{n}` picks a font slot (f0 sans, f1 display, f2 mono).

### finish

Everything after `---`, `--`-separated, in any order:

| flag | meaning |
|------|---------|
| `d{c}p{1-9}s{1-5}t{%}` | drop shadow (color, direction, distance, softness; default `dfp8s2t50`) |
| `pc{n}-{value}` | palette override: repaint one slot (hex, nibble, or token like `accent`) |
| `pc-{value}` | silhouette: force every painting slot to one color |
| `ps-{palette}` | pin the series palette this mark's `c1`–`c9` draw from |
| `f{n}-{name}` | bind a `letter` font slot (`sans`/`display`/`mono`, or a literal family) |
| `e{n}` | expand the canvas by n% so edge-hugging art gains margin under a shadow |
| `s{%}` `sx{%}` `sy{%}` | scale the whole composite about the center |
| `mx{±%}` `my{±%}` | shift the whole composite |
| `center` | measure the ink the mark actually leaves and center that box |
| `o{1-3}[c{0-f}]` | one outline ringing the union silhouette of everything the mark paints |

A `pc` value stays theme-reactive when it is a nibble or token; a hex is fixed. Lock flags
(`l{index}{codes}`) are authoring metadata the renderer ignores and export strips.

## Render model

Two ways to make emptiness: `c0` paints nothing (layers below show through); `ko` punches
a hole through everything beneath, to the page behind the icon. `i` inverts a shape's
coverage; `-i-ko` clips the whole composite to the shape's silhouette, so `--circle-i-ko`
rounds a mark to a circle and `--heart-i-ko` to a heart.

## Worked examples

```
search                                              a known functional glyph
badge--circle-c2--star-s55-cf                       a filled circle with a centered fg star
badge--hex-c2--star-s55-cf--circle-i-ko             a hex badge clipped to a circle
database--cylinder-c1--disc-y-25-c3--disc-y-2-c2-a70  a drum with two platter bands
lozenge--circle-c2-sx160-sy70                       one circle stretched into an ellipse
badge--circle-c2--bolt-s52-cb---dfp8s3t60           a bolt badge lifted by a soft shadow
heat--ring-c1--dot-s28-c9---ps-thermal--pc1-fg      a thermal mark, slot 1 forced to fg ink
badge--circle-c1--letter-A-cb-s55---f0-display      a display-font A on an accent disc
crest--star-p1-s40-c1---center                      built off-center, then re-centered
```

## Extensibility

Mechanism (fixed): the primitive library, `composeIcon`, and the `IconComposition` shape.
Opinion (swappable): `parseIconName` and its `--`/`---` grammar and keyword vocabulary. A
`registerIconGenerator(name → IconComposition)` alternative is tried after the default, so
it claims only the names the default declines. The grammar above is one generator, not
engine law.
