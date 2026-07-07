# Icon name grammar

An icon **name is its spec**. A short name like `search` is a known glyph or a
pre-baked file; a longer name is a terse, human- and machine-writable description
of a mark, parsed into a composition and rendered on the fly when no baked artifact
exists. Baked-or-generated, the same way the engine treats a derived theme: baked is
the fast path, live generation is the novel-input path, and nothing about *consuming*
a finished icon requires the generator to be running.

Because a generated mark's colors resolve to theme slots (not dead hex), it recolors
with the active theme for free; the native win over a hashed-identicon library.

## Resolution cascade

`<xtyle-icon name="…">` resolves a name in order:

1. **Known glyph:** the name is an entry in the functional set (`search`, `check`,
   `chevron-right`, …) → render that glyph.
2. **Baked artifact:** a build/SSR/cache lookup finds a materialized SVG for the
   name → serve it.
3. **Generate:** parse the name as a spec and compose the SVG live, labeling it from
   the name's label segment.

Steps 1–2 are lookups; step 3 is the generator. A name that is *only* a label with no
spec and no baked artifact renders the missing-primitive placeholder, so a typo shows
on screen rather than vanishing.

## Grammar

```
{label}--{object}--{object}…---{finish}
```

- Split on `---` (triple) first → `[head, finish]`.
- Split `head` on `--` (double) → `[label, ...objects]`.

### label

The human handle. It is the icon's **accessible name** (humanized: `dice-3` → "dice 3")
and a readable prefix so an author greps the string without dissecting it. It is **not**
part of the cache identity; the store keys on the canonicalized spec, so `dice-3--{spec}`
and `star--{spec}` with identical specs generate one shared artifact but announce
differently. Optional; when omitted the mark is decorative (`aria-hidden`) and keyed by a
hash of its spec.

### object

A primitive keyword followed by any number of flags, **in any order** (only the keyword is
positional):

```
{primitive}  p{1-9}  x{±%}  y{±%}  s{%}  r{±deg}  c{0-f}  o{1-3}[c{0-f}]  a{%}  fh  fv  ko  i
```

| flag | meaning | default |
|------|---------|---------|
| `p{1-9}` | grid cell on a phone-keypad 3×3 (`1`=top-left, `3`=top-right, `5`=center, `7`=bottom-left, `9`=bottom-right) | `p5` |
| `x{±%}` `y{±%}` | fine offset from the cell anchor, % of the grid | `0` |
| `s{%}` | size, % of the full 24-unit grid | `100` |
| `r{±deg}` | rotation about the object's own center | `0` |
| `c{0-f}` | fill color (see the palette) | `currentColor` |
| `o{1-3}[c{0-f}]` | outline: `1`/`2`/`3` = thin/medium/thick stroke, optional trailing `c{0-f}` stroke color | no outline; stroke `currentColor` |
| `a{%}` | opacity | `100` |
| `fh` / `fv` | flip horizontal / vertical | none |
| `ko` | knockout (subtract this shape from the art beneath it; see below) | paint |
| `i` | invert the shape's coverage to its complement; with `ko` (`-i-ko`) it clips the composite to the shape's silhouette (see below) | paint the shape |

Primitive keywords are single tokens (`square`, `circle`, `triangle`, `hex`, `diamond`, `shield`,
`ring`, `divider`, `star`, `bolt`, `dot`, …) mapping to the primitive library (`square` →
`shape-square`, `star` → `symbol-star`, `divider` → `divider-rule`, which rotates to vertical with
`r90`). A trailing index selects a variant where the library ships one: `square` is a sharp square,
`square1` / `square2` / `square3` its small / medium / large rounded corners. The single-token
functional glyphs are reachable as symbols by their bare name too (`check`, `close`, `search`,
`warning`, … → `symbol-check`, …), so a check badge is `badge--circle-c2--check-s55-cf`. Multi-token
glyph names (`chevron-right`) have no keyword, since a keyword is one token by rule; they stay
glyph-only.

### color palette

`c{n}` takes one **hex nibble** `0`–`f` into a 16-slot palette. Slots `1`–`9` are the nine **series
colors**; the `colors="…"` attribute (a scheme: `accents`, `skittles`, `statuses`, `thermal`,
`status`) picks what they draw from — `skittles` fills all nine with the crayon box, a smaller scheme
cycles its own colors across the nine slots. The high nibbles are theme chrome.

| slot | resolves to |
|------|-------------|
| `c0` | transparent |
| `c1`–`c9` | series colors 1–9 (drawn from `colors`) |
| `ca` | `currentColor` — the active ink |
| `cb` | `--bg-0` — background |
| `cc` | transparent |
| `cd` / `ce` | reserved (inert) |
| `cf` | `--fg-0` — foreground |

An object with no `c` inherits `currentColor`, so an un-colored spec renders like a flat
functional glyph and tints with surrounding text.

**Nine fixed slots.** Every `colors` scheme resolves to exactly nine evenly-spread colors
(`ICON_SERIES_COUNT`), so slots `1`–`9` are always full and stable no matter the scheme: a nine-hue
scheme (`skittles`) fills them with the whole box, a shorter one spreads its own colors across all nine.
The count is fixed rather than sized to the highest slot a mark references — sizing to `index + 1` made
each slot take the *last* color of its own little palette, collapsing a sequential scheme (`thermal`) to
its endpoint and a sampled categorical (`skittles`) to its last color. A fixed nine keeps each slot a
distinct, evenly-spread color, so `c1`…`c5` span the whole scheme and a slot addresses the same way in
any theme.

### finish

Everything after `---`, any order. Two kinds of token share this tail, and each reader ignores the
other's, so they coexist in one finish section:

**Render finish** modifies the whole mark. Per-shape rounding and silhouette clips are **layer** flags
(an indexed `square1`, an inverted knockout `-i-ko`); the finish holds modifiers that act on the
composite:

| flag | meaning | default |
|------|---------|---------|
| `d{c}p{1-9}s{1-5}t{%}` | **drop shadow**: a colored, offset, blurred copy cast behind the mark. `d{c}` shadow color (a palette nibble), `p{1-9}` cast direction (keypad; `5` = straight down/no offset), `s{1-5}` cast distance, `t{%}` softness (blur). Sub-params optional, default `dfp8s2t50`. | no shadow |
| `pc{n}-{value}` | **palette override**: repaint one slot for this mark. The value is a **hex** (`pc3-ff00ff` forces slot 3 to magenta), a single **nibble** `0`–`f` (`pc3-1` borrows slot 1's series color), or a **token name** (`pc3-accent` → `--accent`; also `success`, a named hue, or the `fg`/`bg` aliases). | none |
| `pc-{value}` | **silhouette**: force every painting slot to one color (transparent/reserved slots stay clear). Same three value shapes: `pc-424242` (fixed grey), `pc-fg` (the foreground token), `pc-a` (the active ink). | none |

A `pc` value stays **theme-reactive** when it's a nibble or a token — it resolves off the live register
at paint time, so the override tracks the theme instead of baking a dead color; a hex value is fixed.
Hyphenated tokens (`accent-2`, `fg-1`) can't ride the `-`-delimited finish; reach a ramped shade with the
nearest nibble or a hex. A future whole-composite modifier slots in the same way.

**Lock flags** (`l{index}{codes}`) are **authoring metadata the renderer ignores**: they pin an
object's props against the icon builder's Randomize, so a *template* name carries its own re-roll
policy. A flag is `l` + the object's **1-based index** + either `*` (the whole layer) or a run of
single-char property codes:

| code | `w` | `p` | `s` | `r` | `x` | `y` | `a` | `c` | `o` | `h` | `v` | `k` | `i` |
|------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| prop | keyword | pos | size | rotate | x | y | opacity | color | outline | flip-h | flip-v | knockout | invert |

Multiple locks join with `-`: `---l1o-l2*` pins layer 1's outline and the whole of layer 2. The two
kinds coexist, render finish first: `---d2p8s3t80-l1o` casts a shadow **and** pins a lock. Render
finish is part of the mark and survives export; the lock tokens are the only ones an export strips (so
"strip for production" lifts `l…` and keeps `d…`, not `name.split("---")[0]`).

## Render model

Objects paint **back-to-front**. Two ways to make emptiness:

- **`c0` (transparent):** paints nothing; layers below still show through where they exist.
- **`ko` (knockout):** punches this shape through everything painted beneath it, to the page
  behind the whole icon. Implemented as a mask over the accumulated art below; later painted
  objects sit on top of the hole. `ko` with an outline rims the hole (a recessed-with-highlight
  edge); the grammar allows it, no special case.
- **`i` (invert):** flips the shape's coverage to its complement. Painted alone (`-i`) it fills
  everything *except* the shape (a filled area with a shape-hole). Paired with `ko` (`-i-ko`) it inverts
  the knockout mask so only the shape survives — clipping the accumulated art to the shape's
  silhouette: `--circle-i-ko` rounds the whole mark to a circle, `--square1-i-ko` to a small-rounded
  square, `--heart-i-ko` to a heart. It replaces the old whole-composite round finish with one
  composable primitive that works for *any* shape.

## Parser notes

- **Tokenizer, not `split('-')`.** A param key is always preceded by a separator, so a signed
  value's sign (`x-10`) never collides with the separator dash, and label dashes (`dice-3`) are
  safe because the label is peeled off on `--` first.
- **`r{±deg}` is always numeric rotation** on an object; there is no alpha `r` finish anymore
  (whole-icon rounding moved to indexed primitives like `square1` and the `-i-ko` silhouette clip).
- **`o{1-3}c{N}` is one compound token:** the outline's color glues to `o` with no dash, so it
  never reads as the standalone fill `c{N}`.

## Worked examples

```
search                                                              a known functional glyph
dice-3--square3-c1--square-s80-ko--dot-p7-s10--dot-s10--dot-p3-s10   rounded face (square3),
                                                                    recessed window, solid pips on top
dice-3--square3-c1--dot-p7-s10-ko--dot-s10-ko--dot-p3-s10-ko        negative-space pips
badge--hex-c2--star-s55-cf--circle-i-ko                            a hex badge clipped to a circle
badge--circle-c2--star-s55-cf                                          a filled circle with a
                                                                       centered fg star
crest--shield-c1-o1--star-s45-cf---l1o-l2*                          a re-rollable template: layer 1's
                                                                    outline and all of layer 2 hold
                                                                    while the builder randomizes the rest
badge--circle-c2--bolt-s52-cb---dfp8s3t60                            a bolt badge lifted off the page by
                                                                    a soft shadow cast down and behind
```

## Extensibility

The mechanism/opinion line runs through this feature exactly as it runs through the token engine.
**Mechanism** (core, fixed) is the primitive library, `composeIcon`, and the `IconComposition`
shape a generator emits. **Opinion** (swappable) is `parseIconName` and everything it hardcodes:
the `--`/`---` grammar, the primitive keyword vocabulary, and the color ladder. `parseIconName` is
the blessed *default* generator, not engine law.

A generator is a pure `name → IconComposition` function. Alternatives (a hashed-identicon mode over
a seed, a domain-specific mark set) `registerIconGenerator(...)` and are tried after the default, so
one claims only the names the default declines; `<xtyle-icon>` resolves a name through that registry,
never through a hardwired parser. A variant vocabulary (different keywords, a different ladder) is a
whole new generator, not a knob on this one; the grammar's vocabulary is deliberately the default
generator's own, not a configurable surface. The default grammar above is one generator; it is not
the only one the engine can host.

## Accessibility

The label is the accessible name. A named icon is `role="img"` with the humanized label; an
unlabeled generated mark is decorative and `aria-hidden`, so an adjacent text label carries the
meaning and nothing announces the raw spec.
