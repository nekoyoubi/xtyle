# @xtyle/core

[![npm](https://img.shields.io/npm/v/@xtyle/core?label=npm)](https://www.npmjs.com/package/@xtyle/core)
[![docs](https://img.shields.io/badge/docs-xtyle.dev-blue)](https://xtyle.dev)
[![license](https://img.shields.io/badge/license-MIT-green)](https://opensource.org/license/mit)

A **themable-derivation engine and component contract**. Hand it an *algorithm* and a few
pinned colors and it derives a full, internally-consistent design-token set; on top of those
tokens ships a library of **91 components** that read their styling straight from it.

```sh
npm install @xtyle/core
```

## The model

- **The algorithm is the asset; the theme is the print.** An *algorithm* is a named,
  reusable engine: the rules, the color math, the taste. A *theme* is one invocation of it,
  quick or hard-won, both first-class. Algorithms get reused; themes get materialized.
- **Derivation, not a fixed palette.** Pin a background and an accent; the engine derives
  surfaces, content, lines, an accent family, status hues, a 12-hue palette, type, geometry,
  motion, elevation, and space, holding WCAG contrast floors in OKLCH as it goes.
- **Chrome is a swappable fragment.** Components are raw custom elements that paint their own
  furniture (a control bar, a track, a marker) through sandboxed [xript](https://xript.dev)
  fragments. A mod re-skins that furniture through the same surface the built-ins render from.
- **The runtime is optional.** A derived theme is CSS custom properties and the browser
  cascade; nothing has to be running to consume one. The engine runs live only for
  novel-at-runtime inputs: user-authored themes, live preview, day/night.

## Components

**91 components across 10 categories**, all styled purely by the design tokens an algorithm
derives (no per-component color, no magic numbers). Drop a derived theme on `:root` and every
component themes with it.

| category | what's in it |
|---|---|
| **shell** | the app frame: `app-shell`, `mobile-shell`, `toolbar`, `dock`, `panel`, `statusbar`, `bottom-nav` |
| **layout** | primitives that arrange everything: `stack`, `cluster`, `grid`, `section`, `splitter`, `separator`, `theme-scope`, and more |
| **control** | things people click, toggle, drag: `button`, `split-button`, `switch`, `checkbox`, `radio`, `slider`, `segmented`, `rating`, `scheme-toggle` |
| **form** | fields and the structure that binds them: `field`, `select`, `textarea`, `combobox`, `number-input`, `date-picker`, `color-picker`, `theme-picker`, `dropzone`, `form-group` |
| **navigation** | paths between views: `tabs`, `breadcrumb`, `link`, `menu`, `pagination`, `command-palette`, `tree`, `toc` |
| **feedback** | signals of what's happening: `alert`, `progress`, `spinner`, `skeleton`, `toast`, `steps`, `empty` |
| **overlay** | layers above the page: `dialog`, `sheet`, `popover`, `tooltip`, `spotlight`, `tour` |
| **content** | shapes that carry words and structured detail: `heading`, `text`, `code`, `table`, `kbd`, `list`, `markdown`, `bbcode`, `timeline`, `eyebrow`, `redact`, `theme-card`, `theme-swatch` |
| **media** | the visual pieces: `icon`, `image`, `avatar`, `avatar-group`, `badge`, `hero`, `carousel`, `parallax`, `nine-patch` |
| **metrics** | numbers at a glance: `chart`, `bar`, `pie`, `sparkline`, `heatmap`, `stat` |

Counts by category: content 13, form 11, control 10, layout 10, feedback 9, media 9, navigation
8, overlay 8, shell 7, metrics 6. See [xtyle.dev](https://xtyle.dev) for the live reference and
every component's full manifest.

### Raw custom elements

The components ship as framework-free custom elements on `@xtyle/core/elements`. Importing the
barrel registers all of them; importing one path registers only that element.

```ts
import "@xtyle/core/elements";        // register the whole set
import "@xtyle/core/elements/button.js"; // …or just <xtyle-button>
```

```html
<xtyle-card>
  <xtyle-badge tone="success">new</xtyle-badge>
  <xtyle-button tone="accent">Save</xtyle-button>
</xtyle-card>
```

Prefer a framework? Use a binding below. They wrap these same elements.

## Framework bindings

Two thin wrappers ship alongside the engine, each the binding of the same component contract.

### Svelte, `@xtyle/svelte`

Typed Svelte 5 wrappers that render the matching `<xtyle-*>` element and forward props, slots,
and attributes. Importing a wrapper registers only its element.

```sh
npm install @xtyle/svelte @xtyle/core
```

```svelte
<script>
  import { Button, Badge, Card } from "@xtyle/svelte";
</script>

<Card>
  <Badge tone="success">new</Badge>
  <Button tone="accent">Save</Button>
</Card>
```

### Astro, `@xtyle/astro`

Zero-JS Astro 6 components that server-render semantic HTML against the xtyle component
classes and ship no client JavaScript unless a component genuinely needs it.

```sh
npm install @xtyle/astro @xtyle/core
```

```astro
---
import Button from "@xtyle/astro/Button.astro";
import Card from "@xtyle/astro/Card.astro";
---

<Card>
  <Button tone="accent">Save</Button>
</Card>
```

## Engine

Hand `derive` an algorithm plus a few pinned colors; get back a full **register** of
CSS-ready tokens. `emit` renders it (`css` / `json`); the emitter set is open.

```ts
import { derive, emit } from "@xtyle/core";
import { xtyleDefault } from "@xtyle/core/algorithms";

const register = derive(xtyleDefault, {
  constraints: { "--bg-0": "#0f1115", "--accent": "#5b8cff" },
});

console.log(emit(register, "css"));
// :root { --accent: #5b8cff; --bg-0: …; --fg-0: …; … }
```

Constraints are pinned token values: they land in the output verbatim *and* feed back in as
derivation inputs, so pinning `--bg-0` re-derives `--fg-0` to hold contrast. Apply a register
to a live document with the DOM helpers:

```ts
import { apply } from "@xtyle/core/dom";
apply(register, { persistKey: "theme" });
```

**`xtyle-default` produces ~310 tokens** across seven dimensions: color, a literal 12-hue
palette, type, geometry, motion, elevation, and space. The scheme (light / dark) auto-derives
from `--bg-0` lightness; surfaces step monotonically; on-fill text is swept to clear AA
against its pairing.

### The algorithm set

`@xtyle/core` ships **five algorithms** over one preset-parameterized core, each its own xript
module with its own declared invariants:

- **`xtyle-default`**: neutral, readability-conscientious baseline; AA floors, balanced vibrancy.
- **`xtyle-hc`**: high-contrast; clamps derived text toward AAA where the fill allows.
- **`xtyle-quiet`**: low vibrancy, muted chroma, soft elevation; still AA.
- **`xtyle-loud`**: high vibrancy, saturated accents, punchier elevation; still AA.
- **`nxi-nite`**: time-aware day/night, folding the time of day into extra derivation passes.

How the accent family relates to `--accent` is a **knob, not an algorithm**: `accentStrategy`
(`fan` / `step` / `shade` / `duo`) reshapes `--accent-2/3/4` against any of the five. `duo`
takes a second brand color and shades the pair.

## Effects

An **effect** is a verb: a behavior applied to any element under a condition, addressed by a
spec string in the same name-is-its-spec shape as an icon name. Set it with a `data-fx`
attribute; it emits plain attribute-selector CSS and needs no runtime.

```html
<xtyle-button data-fx="glow@hover">Save</xtyle-button>
<xtyle-card data-fx="throb?rate:3s,colors:[accent,accent-2]">…</xtyle-card>
```

Nine effects ship (`glow`, `throb`, `glare`, `lift`, `tint`, `frost`, `reveal`, `shake`,
`saturate`) over eight conditions (`hover`, `focus`, `active`, `checked`, `disabled`, `open`,
`invalid`, `armed`). Their intensity derives from five shared `--fx-*` tokens, so it is the
algorithm's policy, and reduced-motion suppression is handled once by the library. The library
is last-wins on the name, so a mod replaces one effect or adds a new one without restating the
rest. Programmatic access lives on `@xtyle/core`: `registerEffect`, `registerCondition`,
`listEffects`, `effectsCss`, `fxStyle`, and `EFFECT_TOKENS`. The effect layer is not yet
surfaced via the CLI or MCP.

## CLI

After install, the `xtyle` bin reaches the whole engine from one command.

```sh
xtyle derive --bg "#0f1115" --accent "#5b8cff" --format css   # derive + emit
xtyle derive -a xtyle-loud --knob accentStrategy=duo --set --accent-2=#e0507a
xtyle knobs                                # every algorithm's dials and what each accepts
xtyle coverage --consumed "--bg-0,--fg-0,--accent"  # does an algorithm cover what's consumed?
xtyle audit -a xtyle-default --level AA    # grade a theme's contrast against the WCAG pairs
xtyle gauntlet -a all --runs 200           # fire extreme inputs, assert declared invariants
xtyle mcp                                  # start the MCP server over stdio
```

The CLI reaches all three input tiers: algorithm knobs (`--knob`, alias `-k`), the three
headline anchor shorthands (`--bg` / `--fg` / `--accent`), and the universal `--set` escape
hatch that pins any token.

## The MCP server

`xtyle mcp` starts a Model Context Protocol server over stdio that hands an agent the same
engine the CLI hands a human (point a client at `xtyle mcp` or `npx -y @xtyle/core xtyle mcp`).
Tools include `xtyle_derive`, `xtyle_coverage`, `xtyle_audit`, `xtyle_components` (list or
describe any component's manifest), `xtyle_gauntlet`, and `xtyle_list_algorithms`; resources
expose the concept docs and every component manifest, so an agent answers from what ships
rather than from memory.

## Package entry points

| import | what it is |
|---|---|
| `@xtyle/core` | the neutral engine: `derive`, `emit`, `coverage`, `gauntlet`, the effect layer (`registerEffect`, `listEffects`, `effectsCss`, `fxStyle`, `EFFECT_TOKENS`), color and graph helpers. No `node:*`, no DOM globals. |
| `@xtyle/core/algorithms` | the five blessed algorithms plus a re-export of the engine, so the whole derive path is one import. |
| `@xtyle/core/elements` | the raw custom-element library (barrel registers all); `./elements/<id>.js` for one; `./elements/ssr` for server rendering. |
| `@xtyle/core/dom` | browser helpers (`apply`, `clear`, `persist`, `restore`, `toStyleSheet`) that write tokens to a live `:root`. |
| `@xtyle/core/css` | the component, utility, and effect CSS as strings (`componentsCss`, `utilitiesCss`, `effectsCss`, and per-component exports). |
| `@xtyle/core/authoring` | `defineXtyleAlgorithm` / `defineAlgorithm` for writing your own algorithm. |
| `@xtyle/core/concepts` | the concept documentation the reference site and MCP server read. |
| `xtyle` (bin) | the Node CLI. |

## License

MIT
