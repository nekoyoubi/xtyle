# xtyle: dimensional token contract (working draft)

This is a **starting point**, not a spec to conform to. It lifts the model that
already got cycles in a prior in-house theme crate and its theme designer,
marks what's already built vs net-new, and is wide open to revision.
Nothing here is authority; it's where we start hashing.

> **Read `derivation-model.md` first.** This doc lists *what tokens exist*; that
> one is *how they come to exist*, and it's the spine. Two corrections it makes to
> the framing below: (1) the register is **open, not fixed**: these tokens are one
> algorithm's baseline floor, not a canon every theme conforms to; authors declare
> new tokens and rewire derivations freely. (2) The filling and the invariants are
> the **algorithm's**, not the engine's; there is no engine-level "every theme is
> valid" gospel. The lists here are best read as the register `xtyle-default` ships.

A theme is an **invocation of an algorithm**, materialized to a token set. The
algorithm resolves every **dimension**: each dimension has the algorithm's
defaults, a per-token `auto | explicit` override layer (an override is a constraint
the algorithm re-solves around, not a leaf patch), and an author resolver /
`generate`-fn hook. An author can supply as little as `bg + accent` and the chosen
algorithm fills the rest; override any single token; or pick / write a different
algorithm. (The color `generate`-fn was the embryo of the whole algorithm concept,
now generalized to every dimension.)

Legend: `[have]` already exists in the prior cycles · `[new]` net-new for xtyle.

---

## dimensions.color

### Anchors (authored) `[have]`

`bg` · `fg` · `accent` · `accent2?` · `accent3?` · `accent4?` · `chrome_tint?` ·
`accent_shift_step`. Scheme auto-derives from `bg` luminance when unset.

### Core floor: derived verbs `[have]` (34)

- **Surfaces**: `--body-bg` `--bg-sunken` `--bg-0..3` `--scrim`
- **Content**: `--fg-0..3` `--accent-fg`
- **Lines / rings**: `--line` `--line-2` `--ring` `--ring-bg`
- **Accent**: `--accent` `--accent-hover` `--accent-active` `--accent-2..4`
  `--accent-shift-step`
- **Status**: `--success(-bg)` `--warn(-bg)` `--danger(-bg)` `--info(-bg)`
- **Selection / fx**: `--selection` `--highlight` `--shadow`

### ANSI palette `[have]` (20)

`--terminal-{bg,fg,cursor,cursor-accent}` + 8 normal + 8 bright. Scheme-aware
OKLCH defaults; ride-through.

### New component-facing verbs `[new]`

Today these would be open `extras`; promote to canon so a component lib renders
out of the box.

- **On-fill text**: `--success-fg` `--warn-fg` `--danger-fg` `--info-fg`
  (ink readable on the matching solid fill)
- **Status text-on-tint**: `--success-text` `--warn-text` `--danger-text` `--info-text`
  (readable on the matching `-bg` tint)
- **Neutral role**: `--neutral` `--neutral-bg` `--neutral-fg` `--neutral-text`
- **Accent surface/text**: `--accent-bg` `--accent-text` (contrast-tuned; ≠ fill)
- **Form / field**: `--field-bg` `--field-border` `--placeholder`
- **Disabled content**: `--fg-disabled`
- **Overlay surface**: `--surface-overlay` `--surface-overlay-border`
  (menus / popovers / tooltips / modals; distinct from the `bg-*` ladder)
- **Links**: `--link` `--link-hover`

### State overlays `[new]`

Compositable, hue-neutral, scheme-aware alphas a component layers over *any*
surface / accent / status fill. One set covers every role: keeps the floor flat.

`--state-hover` `--state-press` `--state-selected` `--state-disabled` `--state-drag`

---

## dimensions.palette `[have → generalize]`

**Literal, name-honest color: explicitly NOT semantic.** This is the register
you reach for when a thing is "the red one" (a brand mark, a logo fill, a
category swatch) and must *not* inherit role meaning. `--color-red` stays red in
every theme (lightness/chroma flex for scheme + contrast; hue stays red). The
*role* registers stay independent: `--danger` can be bright yellow in one theme
while `--color-red` is still red. A red logo themes to `--color-red`, never to
`--danger`.

**Plain crayon-box names, not designer names.** Starting set (the basic eight-crayon box):

`red orange yellow green blue purple brown black`, plus `gray` and `white` for
UI reach; `pink` / `cyan` optional. The prior `--tint-{rose,amber,citron,…}` were
the earlier exploration; they get replaced/renamed freely; nothing consumes this
palette yet.

Each hue exposes a **bare alias** + a **short ramp**:

- `--color-red` → the base stop, the ergonomic single reach, usually all you want
- `--color-red-{subtle,muted,base,strong,contrast}` → the ramp when you need it;
  `contrast` is the readable on-color text stop

Covers brand marks, tags, categories, data-viz series: anything that wants an
actual color by name rather than a role.

---

## dimensions.type `[have]`

`--font-{sans,mono,display}` + scale steps `--text-{sm,body,lg,xl}` from a
`type_scale` ratio. (Designer fields: `fontSans/Mono/Display`, `scaleSm/Body/Lg/Xl`.)
Likely extend the ramp (`xs`, `2xl`, `3xl`) + add `--leading-*` / `--weight-*`
(TBD).

---

## dimensions.geometry `[have]`

- **Radius**: `--radius-{none,sm,md,lg,full}` (canon ladder 0 / 2 / 4 / 8 / 9999)
- **Border**: `--border-{thin,normal,thick}` (1 / 1.5 / 2px)

---

## dimensions.motion `[have]`

- **Timings**: `--duration-{fast,base,slow}` + per-timing easing
  (canon 120 / 200 / 320ms)
- **Reference curves**: `--ease-standard` `--ease-emphasized`

---

## dimensions.elevation `[new]`

The one genuinely-absent dimension; only a single `--shadow` + `--scrim` exist
today. Add a scheme-aware ladder:

`--elevation-0..5`, scheme-derived (shadows behave differently in dark vs light).
The lone `--shadow` becomes a mid rung of the ladder.

---

## dimensions.space `[new]`

Today density is rail-scoped (`--rail-*` under `[data-density]`), not an app-wide
scale. Generalize to an app-wide ramp:

`--space-*` (numeric step scale vs named `xs..xl`, TBD) from a `space_unit`
anchor. Density modes become multipliers over the ramp rather than bespoke
per-shell sizes.

---

## Domain groups (ride-through `extras`) `[have]`

`terminal.*` (the 20 ANSI), `syntax.*`, `chart.*`, and any author-invented slot.
Not derived; flowed through to the floor unchanged. Keyed by CSS-token name
without the leading `--`.

---

## Invariants (the gauntlet)

These are **per-algorithm policy, not engine gospel.** The gauntlet is
parameterized by algorithm: it fires N extreme knob / anchor seeds at a *chosen*
algorithm and asserts *that algorithm's declared invariants*. The list below is
what a contrast-conscientious algorithm like `xtyle-default` (or, more strictly,
`xtyle-hc`) chooses to guarantee; an algorithm that declares none has nothing to
assert, and that's a legitimate choice. What such an algorithm guarantees for
*any* anchors, asserted across N extreme seeds:

- every contract token is emitted (no `None` reaches a consumer)
- `fg-0` on `bg-0` clears WCAG AA; every `*-fg` / `*-text` / `*-contrast` clears
  its pairing
- surface, content, and palette ramps are monotonic in luminance
- alpha-bearing tokens stay translucent
- state-overlay composites remain distinguishable on every surface they land on

The four existing tests from the prior engine are the seed of this.
