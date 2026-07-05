# @xtyle/core

[![npm](https://img.shields.io/npm/v/@xtyle/core?label=npm)](https://www.npmjs.com/package/@xtyle/core)
[![docs](https://img.shields.io/badge/docs-xtyle.dev-blue)](https://xtyle.dev)
[![license](https://img.shields.io/badge/license-MIT-green)](https://opensource.org/license/mit)

A themable-derivation engine. Hand it an **algorithm** and a few pinned colors, and it
derives a full **register** of CSS-ready tokens across seven dimensions: color, a literal
12-hue palette, type, geometry, motion, elevation, and space.

The *algorithm* carries the rules, the math, the taste. A *theme* is a materialization of
one, quick or hard-won, both first-class. This package is the pure derivation engine plus
the built-in `xtyle-default` algorithm.

## Install

```sh
npm install @xtyle/core
```

## Quick start

```ts
import { derive, emit } from "@xtyle/core";
import { xtyleDefault } from "@xtyle/core/algorithms";

const register = derive(xtyleDefault, {
	constraints: { "--bg-0": "#0f1115", "--accent": "#5b8cff" },
});

console.log(emit(register, "css"));
// :root {
//   --accent: #5b8cff;
//   --bg-0: ...;
//   --fg-0: ...;
//   ...
// }
```

The engine (`derive`, `emit`) is on `@xtyle/core`; the blessed algorithms (`xtyleDefault`,
`getAlgorithm`, the full set) are on `@xtyle/core/algorithms`, which also re-exports the
engine, so `import { derive, getAlgorithm, emitCss } from "@xtyle/core/algorithms"` reaches
the whole pure-derive path in one import.

Constraints are pinned token values. They land in the output verbatim and feed back in as
derivation inputs, so pinning `--bg-0` re-derives `--fg-0` to hold contrast. Tune posture
with `knobs` (below).

## Dual entry

The package is environment-split by design:

- **`@xtyle/core`**: the neutral, importable engine (`derive`, `emit`, `coverage`, `gauntlet`,
  `makeXtyleAlgorithm`, color and graph helpers); no `node:*`, no DOM globals, safe in any runtime.
- **`@xtyle/core/algorithms`**: the blessed algorithm set (`xtyleDefault`, `getAlgorithm`, the
  registry) plus a re-export of the engine, so the whole pure-derive path is one import.
- **`@xtyle/core/dom`**: browser helpers (`apply`, `clear`, `persist`, `restore`,
  `toStyleSheet`) that write tokens to a live `:root`.
- **`xtyle` bin**: a Node CLI for one-shot derivation, coverage, and the gauntlet.

```ts
import { apply } from "@xtyle/core/dom";
apply(register, { persistKey: "theme" });
```

```sh
xtyle derive --bg "#0f1115" --accent "#5b8cff" --format css
xtyle coverage --consumed "--bg-0,--fg-0,--accent" --bg "#0f1115"
xtyle gauntlet --runs 200
```

`--bg` / `--fg` / `--accent` are shorthands for the three headline anchors; `--set <token>=<value>`
(repeatable, alias `--constraint`) pins *any* token, so a full multi-anchor recipe bakes straight
from the CLI without dropping to the importable API. The leading `--` on the token is optional.

```sh
xtyle derive --accent "#2d5a9e" \
  --set --accent-2=#7c3aed \
  --set font-sans="Inter, system-ui, sans-serif" \
  --set radius-md=10px \
  --format css
```

## The seven-dimension contract

`xtyle-default` produces 276 tokens. A representative tour follows; see
[xtyle.dev](https://xtyle.dev) for the authoritative full register.

### color

- **surfaces**: `--body-bg`, `--bg-0..3`, `--scrim`, `--surface-overlay`, `--surface-overlay-border`
- **content**: `--fg-0..3`, `--fg-disabled`, `--placeholder`
- **lines / rings**: `--line`, `--line-2`, `--ring`, `--ring-bg`
- **accent**: `--accent`, `--accent-hover`, `--accent-active`, `--accent-2..4`, `--accent-bg`, `--accent-fg`, `--accent-text`
- **fields**: `--field-bg`, `--field-border`
- **state**: `--state-hover`, `--state-press`, `--state-selected`, `--state-disabled`, `--state-drag` (translucent)
- **links**: `--link`, `--link-hover`
- **tones**: each of the 21 tones (the semantic roles, `--accent-2/3/4`, and the twelve named hues) derives a uniform `--{tone}` / `--{tone}-bg` / `--{tone}-fg` / `--{tone}-text` / `--{tone}-vivid` family, so any component renders any tone through one code path
- **code**: a `--code-*` syntax family (`--code-keyword`, `--code-function`, `--code-comment`, ...) for highlighted blocks

### palette (literal, name-honest, decoupled from roles)

Twelve hues (`red orange yellow green blue purple brown pink cyan gray white black`), each
a bare alias `--color-<hue>` plus a 5-stop ramp
`--color-<hue>-{subtle,muted,base,strong,contrast}`. Scheme-aware in OKLCH; the hue stays
true to its name in every theme (lightness and chroma flex, hue holds). `--color-red`
stays red even if `--danger` is yellow.

### type

`--font-{sans,mono,display}`, scale `--text-{xs,sm,body,lg,xl,2xl,3xl,4xl,5xl}` (rem, from
the `typeScale` ratio), `--leading-{tight,normal,loose}`, `--weight-{normal,medium,semibold,bold}`.

### geometry

`--radius-{none,sm,md,lg,full}` (scaled by `radiusScale`), `--border-{thin,normal,thick}`.

### motion

`--duration-{fast,base,slow}` (ms), `--ease-{standard,emphasized}` (`cubic-bezier()`).

### elevation

`--elevation-0..5`, scheme-aware box-shadow strings; 0 is none, 1..5 progressively stronger.

### space

`--space-0..8`, a numeric rem ramp scaled by the `density` knob (compact / normal / comfortable).

## Knobs

`scheme` · `vibrancy` (`0..1`) · `contrastBand` (`'aa'|'aaa'|number`) · `accentSplit` ·
`accentShiftStep` · `typeScale` · `radiusScale` · `density` · `cues` ·
`fonts {sans,mono,display}` · `anchors {bg,fg}` (the base-color seed). Every knob has a
sensible default. Specific colors like the accent are set as constraints, not knobs.

## Derivation rules (`xtyle-default`)

- **Scheme** auto-derives from `--bg-0` lightness in OKLCH (`< 0.5` is dark, else light).
- **Surfaces** step lightness from `--bg-0` in OKLCH, monotonically: lightening for dark
  schemes, darkening for light.
- **Content** `--fg-0..3` reduce contrast toward the surface; `--fg-0` holds above the WCAG
  AA floor (`>= 4.5`, or AAA / a custom band via `contrastBand`) against `--bg-0`.
- **On-fill / on-tint text** (`--*-fg`, `--*-text`, `--color-*-contrast`) is swept to clear
  AA against its pairing; fills get nudged out of the contrast dead-zone.
- **Accent family** `--accent-2/3` flank the accent as a split-complement at ∓`accentSplit`;
  `--accent-4` takes its 180° complement. `vibrancy` scales accent, status, and palette chroma.
- **Status hues** track the named palette (success green, warn amber, danger red, info blue)
  and follow a pin to those palette colors.
- **State overlays** are scheme-aware neutral colors with alpha ~0.06 to 0.16.

## Coverage

Components declare what they consume; algorithms declare what they produce; the engine
verifies the produced set covers the consumed set.

```ts
import { coverage } from "@xtyle/core";
coverage(["--bg-0", "--fg-0", "--accent"], register);
// { covered: true, missing: [] }
```

## The gauntlet

Fires N extreme and random knob and constraint sets at a chosen algorithm and asserts
*that algorithm's declared invariants*. Invariants are **dimension-aware**: each token
carries a category (`color`, `length`, `number`, `font`, `shadow`, `duration`, `easing`),
so the OKLCH parse only runs on color tokens while `--font-sans`, `--duration-fast`,
`--text-lg`, and `--elevation-2` get the right format check for their kind. Asserts AA
contrast floors, monotonic surfaces and palette ramps, hue fidelity, translucent overlays,
and the structural ladders (type scale, weights, radius, borders, durations, elevation
strength, space).

```ts
import { gauntlet } from "@xtyle/core";
import { xtyleDefault } from "@xtyle/core/algorithms";
const report = gauntlet(xtyleDefault, { runs: 200 });
// { ok: true, passed: 200, runs: 200, failures: [] }
```

## Emitters

`emit(register, format)` ships with `css` and `json`. The set is open;
`registerEmitter(name, fn)` adds your own.

## Algorithms are xript mods

The `Algorithm` contract (`id`, `produces`, `knobs`, `categories`, `derive`, `invariants`)
maps onto a xript mod: knobs as declared inputs, sandboxed by xript's capability model. The
blessed set ships as real mods, a `mod-manifest.json` plus an esbuild-bundled `mod.js` run
through `@xriptjs/runtime`, and `resolveAlgorithm` runs the sandboxed mod as the canonical
derive path, held byte-identical to the baked TypeScript that serves as the test oracle.
Author your own with `defineXtyleAlgorithm` / `defineAlgorithm` from `@xtyle/core/authoring`.

## The MCP server

`xtyle mcp` starts a Model Context Protocol server over stdio that hands an agent the same
engine the CLI hands a human. Point an MCP client at `xtyle mcp` (or `npx -y @xtyle/core xtyle
mcp`).

- **Tools**: `xtyle_derive`, `xtyle_coverage`, `xtyle_components` (list every component or
  describe one's full manifest), `xtyle_gauntlet`, `xtyle_list_algorithms`, and
  `xtyle_server_info`; each runs the same code as its CLI counterpart, so the two can't drift.
- **Resources**: `xtyle://concept/{id}` for the concept docs and `xtyle://component/{id}` for
  every component manifest, so an agent answers from what ships rather than from memory.

An agent building against xtyle reads token names and prop shapes from the manifest instead
of guessing.

## License

MIT
