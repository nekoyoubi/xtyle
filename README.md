# xoji

[![built with xript](https://img.shields.io/badge/built%20with-xript-d6249f)](https://xript.dev)
[![npm](https://img.shields.io/npm/v/@xoji/core?label=npm)](https://www.npmjs.com/package/@xoji/core)
[![docs](https://img.shields.io/badge/docs-xoji.dev-blue)](https://xoji.dev)
[![license](https://img.shields.io/badge/license-MIT-green)](LICENSE)

A **themable-derivation engine and component contract**. A small set of pinned colors
propagates algorithmically into a full, internally-consistent design-token set,
co-designed against a component library so that any valid theme renders well out of the box.

`xoji.dev` · a standalone design-token and theming product · not a brand spec, not
framework infra, its own thing, consumed by desktop apps and websites alike.

## The shape

The crown jewel is an **architecture, not a function**. See
[`docs/derivation-model.md`](docs/derivation-model.md) for the spine. In short: the durable
asset is the **algorithm** (a named, composable [xript](https://xript.dev) module that owns
the rules, math, defaults, and exposed knobs); a **theme** is an invocation of one (knob
bindings plus token overrides), materialized to a token set. Themes are the prints, the
algorithm is the press; the split is about reuse, not worth. xript is an extensibility
protocol: an algorithm is a manifest-declared, sandboxed plugin, and its validation and
type tooling come free.

Three layers over that spine:

1. **Derivation engine**: a xript host plus a resolution orchestrator over an *open* token
   graph, `(algorithm: knobs + constraints) → full register`. OKLCH, no DOM, exhaustively
   testable. Owns resolution order, constraint routing, cycle detection, coverage
   verification, and materialization, but *not* vocabulary or invariants (those belong to
   the algorithm).
2. **The token contract**: a **coverage floor**, not a fixed schema. Components declare what
   they consume; an algorithm or theme declares what it produces; the engine checks coverage.
   Any app, site, or canvas reads the tokens without a framework, and the register is open,
   so authors declare new tokens and rewire derivations.
3. **Components (optional)**: single-layer raw custom elements (`@xoji/core/elements`). The
   element *is* the component, no headless tier beneath it, styled *only* against tokens it
   declares it consumes. Thin framework wrappers (`@xoji/svelte`, `@xoji/astro`, and more)
   skin them. Optional sugar; the CSS artifact is the real minimum an app consumes.

**The runtime is optional.** Once an algorithm has run, a theme is just CSS custom
properties and the browser cascade does the rest; nothing has to be running to use it.
Pre-bake a bounded theme set to CSS (switching is a `data-theme` swap), and run `@xoji/core`
live in the browser only when you actually need novel-at-runtime inputs (user-authored
themes, continuous day/night, live preview). See [`docs/repo-layout.md`](docs/repo-layout.md).

## Why themes tend to look good

There is **no engine-level "can't look bad" gospel**. Whether a theme can look bad is a
choice each *algorithm* makes. The taste lives in the algorithm:

- Components reference **only** declared tokens, no raw colors, no magic numbers, so a good
  algorithm's discipline reaches the whole catalog.
- A **contrast-conscientious algorithm** (e.g. `xoji-hc`) guarantees every token it derives
  is perceptually valid for any inputs: contrast floors, state deltas, disabled muting,
  border separation. OKLCH makes the contrast-preserving math trustworthy. A permissive
  algorithm may honor a garish input verbatim; that is its own call.
- A **gauntlet** proves whatever an algorithm *declares*: fire N extreme knob and constraint
  sets at that algorithm, materialize its register, assert its invariants hold. The gauntlet
  is parameterized by algorithm, not a universal floor.

## The algorithm set

`@xoji/core` ships five algorithms over one preset-parameterized core (`makeXojiAlgorithm`),
each its own xript module with its own declared invariants the gauntlet holds it to:

- **`xoji-default`**: the neutral, readability-conscientious baseline; AA contrast floors,
  balanced vibrancy.
- **`xoji-hc`**: high-contrast. Clamps derived text toward AAA (`>= 7` where the fill allows,
  AA minimum everywhere) and declares that stricter floor as its invariant.
- **`xoji-quiet`**: low vibrancy, muted chroma, soft elevation, gentle accents; still AA.
- **`xoji-loud`**: high vibrancy, saturated accents and palette, punchier elevation; still AA.
- **`nxi-nite`**: time-aware day/night. Folds the time of day into the derivation through its
  own passes, beyond the posture scalars the others vary.

All five share the same token register (~276 tokens across the seven-dimension contract) and
the same core math. The first four differ only in posture; `nxi-nite` adds its own derivation
passes on top. Drive any of them from the CLI:

```sh
xoji list                       # the five algorithm ids
xoji derive -a xoji-loud --bg "#0f1115" --accent "#5b8cff"
xoji gauntlet -a xoji-hc --runs 250
```

## The dimensional contract

Themes are dimensional, not just color: color, a literal 12-hue palette, type, geometry,
motion, elevation, and space. A theme author pins as little as a background and an accent and
the algorithm fills the rest, overrides any single token through a constraint, or writes a
new algorithm. See [`docs/dimensional-contract.md`](docs/dimensional-contract.md) for the full
token register and [`docs/open-questions.md`](docs/open-questions.md) for the forks still open.

## Lineage

xoji extracts and generalizes a theme engine proved out in a prior in-house project (a shared
theme crate plus a theme designer), which already shipped the color, type, geometry, and
motion dimensions but only lifted color into the shared lib. xoji is where the whole
dimensional model becomes a standalone, consumable contract, plus the elevation and spacing
dimensions and the expanded component-facing verbs the existing system left as ad-hoc `extras`.

## Status

Pre-alpha. Engine language is settled (**TS-core**; see
[`docs/open-questions.md`](docs/open-questions.md) #1). The `@xoji/core` engine is live: the
full register derives over an open token graph, five algorithms ship over a shared
preset-parameterized core, and the dimension-aware gauntlet holds each algorithm to its own
declared invariants. Algorithms run as xript modules through the zero-authority sandbox, the
canonical derive path for the CLI and the site. A native in-process derivation, held
byte-identical to the hosted output by the test matrix, serves as a fast path, the test
oracle, and the front of the neutral importable API.
