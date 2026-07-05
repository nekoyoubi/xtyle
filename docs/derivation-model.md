# xtyle: the derivation model

This is the spine. The README calls the derivation engine "the crown jewel"; this
doc is what the crown jewel actually *is*, and it's an architecture, not a
function. `dimensional-contract.md` lists *what tokens exist*; this doc is *how
they come to exist*. Where the two disagree, this one wins, and the contract doc's
token lists are read as **one algorithm's baseline register**, not a fixed canon.

---

## The inversion: the algorithm is the asset

Every theming system that exists treats the **theme** as the artifact and the
engine as plumbing. xtyle inverts that. The durable, shareable, composable,
posture-encoding asset is the **algorithm**; a **theme** is a
materialization that falls out of one.

"Pick a gaming algorithm → cyan + orange → theme falls out" works because the
gaming algorithm already carries all the taste: sharp edges, the contrast band,
the bichromatic accent logic, the vibrancy curve. The author contributed two
colors; the algorithm contributed everything that makes the result *good*. So the
thing people collect, swap, fork, refine, and brag about is **algorithms**.
Themes are the prints, the algorithm is the press; the split is about reuse, not
worth. A print can be a throwaway or a creative's hard-won design; the press is the
reusable machinery either way.

Themes are the **eventuality** of algorithm + preference. Most authors never touch
the algorithm level at all.

---

## Three concepts

### Algorithm: a program with a parameter signature

A named, first-class **xript plugin (addon)** that owns the rules, the math, and
the defaults *for everything*. It is not "the color resolver"; it resolves every
dimension. Two algorithms (`xtyle-default`, `xtyle-hc`) are two worldviews doing
the same job with different posture. Being literally a xript plugin is the
keystone: knobs are its declared inputs, it's sandboxed by xript's capability
model, and it distributes like any addon, so xript's toolchain (validate /
typegen / docgen / init) and sandbox come free, and xtyle builds none of it.

An algorithm:

- **Declares its exposed knobs**: the curated, high-level intents it offers
  (`scheme`, `contrast-band`, `vibrancy`, `edge`, `density`, `anchors`, …). The
  knobs *are* its parameter signature.
- **Composes / inherits**: `xtyle-loud` extends `xtyle-default`; `xtyle-hc` is
  a sibling. A custom algorithm can be a **functional superset of xtyle**.
- **Owns its own invariant policy.** `xtyle-hc` clamps for contrast no matter the
  inputs; `xtyle-default` may honor a garish accent verbatim. There is **no
  engine-level "can't look bad" gospel**: whether themes can look bad is a choice
  each algorithm makes.
- **Owns its refit policy**: how a pinned member of a generated family reshapes
  the rest of that family (see Resolution, below).

### Theme: an invocation

A binding of an algorithm's knobs to values, plus any token-level overrides,
**materialized** to a resolved token set (CSS custom properties), shippable and
consumable by components.

A theme is an *invocation* of an algorithm, not a kind-of-algorithm. **Promotion
is refactor-up, not accretion:** when a theme's overrides grow rich and reusable,
you *lift* them into a derived algorithm, like extracting a function from inlined
code. You don't slide a theme up a continuum into an algorithm; you refactor it
into one deliberately.

**The theme file makes that materialization portable.** A theme serializes to a
self-describing `xtyle-theme` artifact: `meta` · `recipe` · `tokens`. The `recipe`
is the binding itself (the algorithm plus its `anchors` / `knobs` / `overrides`),
the re-derivable source of truth; `tokens` is the materialized register, a cache so
a consumer applies the theme without ever running the engine. One contract keeps
the two honest: re-deriving the `recipe` reproduces the `tokens` byte-for-byte. The
engine carries it (`buildThemeFile` / `serializeThemeFile` / `parseThemeFile` from
`@xtyle/core`), the schema is published at `xtyle.dev/schema/theme.v1.json`, and
`xtyle derive --format theme` emits one straight from the CLI.

### Generation tooling: the bridge

- **Casual flow (the standard case):** pick an algorithm → set a few knobs / drop
  a couple of colors → a theme falls out. The author lives entirely in the knobs.
- **Builder flow:** owning the algorithm makes theme production procedural:
  batch / spreadsheet-driven, N rows of knob values → N materialized themes.

---

## The resolution model

Per field, resolution is one of three, and the algorithm is always the thing
running the world:

1. **Author explicit literal**: pinned value.
2. **Author explicit value(s) fed through xript**: an author expression / transform.
3. **The algorithm's own xript rule**: the default, for everything not provided.

The load-bearing rule: **an override is a constraint injected into the algorithm,
never a terminal leaf patch.** Pinning a value re-enters the algorithm as new
input, and the algorithm re-solves *around* it.

**The tone-family example (canonical).** An algorithm derives a tone's soft tint
and inks from its solid: `--danger-bg`, `--danger-fg`, and `--danger-text` all
off `--danger`. An author pins `--danger` to a custom violet. The tint and inks
must **adapt**; the algorithm re-fits the whole family around the constraint,
re-hued and still AA-clear, instead of leaving them on the catalog red. So the
unit of derivation is not "a value," it's a **generator**: `(algorithm rule + any
author constraints on a member) → the whole family`. *How* it re-fits (which ink
pole? how much headroom?) is the algorithm's call, not the engine's.

Resolution is a topological pass over the graph; constraints are routed to the
generators that own the constrained families; cycles get a clear error, not a
hang (the graph is author-editable, so cycles are reachable; see the open
register).

---

## The open register

The token register is **open, not fixed.** An author can:

- **Declare new tokens**: `--color-pink` didn't exist; now it does, a first-class
  consumable node like any other.
- **Reference them as inputs to any other token**: set `--accent`'s derivation to
  an expression that reads `--color-pink` (not a literal, a reference to another
  node).
- **Build superset algorithms** out of their own settings / xripts.

Every node is both input and output; there is no input/output dichotomy; that's
CSS custom properties' open nature, with an algorithm + xript derivation layer on
top.

**Dracula, walked through:** declare `--color-pink`; set `--accent ← --color-pink`;
the algorithm takes it from there: `--accent-l1..4`, `--state-*` over accent,
`--link`, `--accent-fg` all re-derive from the pink-sourced accent. And
`--color-pink` now simply *exists* for anything else that wants raw pink.

---

## The coverage contract (the only hard contract)

If the register is open, the one thing that must stay pin-downable is what a
component needs to render. That's a **coverage check**, not a schema:

- **Components declare what they consume**: the floor of tokens they read.
- **Algorithms / themes declare what they produce.**
- **The engine verifies the produced set covers the consumed set.**

"Functional superset of xtyle" is exactly this: satisfy the floor, then add as much
as you want on top. The contract is coverage, never a fixed vocabulary.

**The gauntlet is parameterized by algorithm.** It fires N extreme knob / anchor
sets at a *chosen* algorithm, materializes its register, and asserts *that
algorithm's declared invariants* hold. `xtyle-hc` declares strict contrast and
must survive the gauntlet; an algorithm that declares no invariants has nothing to
assert and that's a legitimate choice. The gauntlet validates the *covered*
tokens under the *algorithm's* policy; it is not a universal floor.

---

## Three input tiers

1. **Algorithm internals**: the full xript rule graph. Builder territory, authored
   rarely.
2. **Algorithm knobs**: the high-level intents the algorithm exposes. The casual
   author lives here and nowhere else; **this tier is the entire standard-case
   UX**, so it's where the real design work is.
3. **Token overrides**: pin or rewire any specific node (`--color-pink → --accent`).
   The universal escape hatch, available at any tier.

**Anchors are seeds, not pins.** The handful of anchor colors (`bg` / `fg` /
`accent`) are inputs the algorithm *interprets*, not literal values it stamps
verbatim, so the algorithm's chroma posture reshapes them. The same
`accent` anchor derives at its given chroma under the neutral default but is
muted under a low-chroma posture and boosted under a vivid or high-contrast one
(e.g. a frost cyan anchor lands near its source on the default, washed-out on the
quiet posture, and pushed brighter on the loud / high-contrast ones). The fixed
`bg` is the exception the postures leave alone; the seed they reshape most is the
accent. To pin a color literally, immune to posture, reach for a tier-3 token
override; that is exactly what the escape hatch is for.

This is a "mechanism not policy" + tiered-adoption ethos applied to theming.

---

## The engine, precisely

The engine is a **xript host + a resolution orchestrator over an open token
graph.** It deliberately owns *less* than it sounds:

- **The engine owns:** resolution order, routing constraints to generators, cycle
  detection, coverage verification, materialization. No vocabulary, no invariants,
  no taste.
- **The algorithm owns:** vocabulary defaults, rules, math, exposed knobs,
  invariant policy, refit policy.
- **The theme owns:** knob bindings, token overrides, register extensions.

*Engine* here names a layer, not the npm package. `@xtyle/core` is
batteries-included: it ships the blessed `xtyle-*` algorithms' vocabulary, math, and
invariants (the house-algorithm SDK) alongside the engine mechanism, so the
built-in set bundles without a separate install. The split still holds where it
counts: a third-party algorithm (a Tier-2 `defineAlgorithm` run through the sandbox)
owns its own vocabulary, math, and invariants exactly as the blessed set does; the
engine mechanism it runs on owns none of that.

So the whole spine reduces to: *an open, xript-derived token graph; an algorithm
is a composable xript module that maps (knobs + constraints) → a full register; a
theme is an invocation of an algorithm that materializes to a coverage-satisfying
token set; the only hard contract is the coverage check between what components
consume and what a module produces.*

---

## Open fork this raises

The casual author's entire world is **tier 2 (the knobs)**, so the shape of the
knob vocabulary is the next load-bearing decision, the input-side mirror of the
open-register question. Tracked in `open-questions.md`. Current lean:
blessed-core-plus-extensible (a standard intent vocabulary the tooling renders
consistently, with freeform extension), so that swapping algorithms keeps shared
intents predictable instead of throwing the author into a new control panel each
time.
