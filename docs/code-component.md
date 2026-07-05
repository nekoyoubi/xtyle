# `<xtyle-code>` — themed code block (design)

A turnkey, read-only, syntax-highlighted code block that colors itself entirely
from the `--code-*` token family. It is the first in-app consumer of the §14
syntax-highlighting tokens (those tokens and the Prism/Monaco emitters already
exist; nothing in the component set reads them yet).

Distinct from the emitters: an **emitter** themes a highlighter you already run
(your Prism, your Monaco/CodeMirror); **`<xtyle-code>`** is xtyle's own block, with
the tokenizer included. They coexist.

Build this **after** the de-orgy rework lands — it lives at `@xtyle/core/elements`
(the post-fold home) and leans on the `--code-*` family + the Prism emitter that
already ship.

## Decisions

### Tokenizer: Prism (MIT)
Chosen because Prism's output is **class-based** (`.token.keyword`, …), which the
existing xtyle Prism-theme CSS already colors through `var(--code-*)`. So a block
**re-themes live** the moment the theme changes — the colors are just cascading
CSS variables. The theme side is already done (the Prism emitter).

Rejected:
- **Rolling our own** — a grammar engine is a multi-year, per-language tarpit and
  off-mission.
- **Shiki** — best grammar fidelity, but it bakes colors inline and is heavy
  (oniguruma WASM), which fights xtyle's live-CSS-variable re-theming and the
  runtime path. Great if fidelity beat live-re-theme and weight; for us it doesn't.
- **highlight.js** (BSD-3) is the fallback if Prism's slow maintenance (v2 alpha)
  becomes a problem — it would need a new emitter (we have Prism's, not hljs's).

### Render split (mirrors the rest of xtyle)
- **Astro (build-time):** tokenize in Node at build → static `.token.*` spans →
  colored by the `--code-*` CSS. Zero JS, zero grammar bytes in the browser,
  re-themes live, no flash.
- **Svelte / html (runtime):** tokenize client-side. Render the code immediately
  as plain-but-themed text (`--code-bg`/`--code-fg`, mono), then recolor when the
  grammar resolves. This is **recolor only** — same characters, spans just gain
  color — so no FOUC and no layout shift. The flash affects only dynamic runtime
  blocks; Astro blocks ship pre-colored.

### Language loading: fully lazy, per-language
Full support is *available* (any of Prism's ~290 grammars, via a generated
lang→`import()` map plus aliases like `ts`→`typescript`), but nothing is eager:
- a page with no `<xtyle-code>` loads nothing;
- a page with 1–3 langs loads Prism core once + only those grammar chunks.

No default bundled set — eager-bundling even js/ts wastes bytes on the
zero-block majority. Mechanics:
- each grammar is its own code-split chunk, fetched on demand;
- **dependency pre-loading** walks Prism's dep metadata (`tsx`→`jsx`→`js`→`markup`)
  before loading the target;
- an unknown/unsupported lang falls back to plain-but-themed text, never an error.

### Preload controls (default stays lazy)
To kill even the minor recolor flash on known-code-heavy or desktop pages:
- **`preload` attribute** on `<xtyle-code>` — warm *this* block's grammar eagerly
  (and emit a `modulepreload` hint);
- **`XtyleCode.warm(["ts", "rust"])`** static — page-level "load these now";
- the attribute and `warm()` share one internal warm path (no divergence).

### Custom grammars
`XtyleCode.registerLanguage(name, grammar)` — escape hatch for a language Prism
doesn't ship.

### API home
- `XtyleCode` element class lives in `@xtyle/core/elements`.
- `warm` and `registerLanguage` are **statics on `XtyleCode`** (discoverable right
  where the component is).
- `@xtyle/svelte` re-exports `XtyleCode` so framework users don't reach across.
- Astro mostly needs none of this (build-time tokenized), but `preload` can still
  emit the `modulepreload` hint.

## Tokens consumed (coverage contract)
The full `--code-*` family — `--code-bg`/`-fg`, the scope colors, plus
`--code-line-highlight` and `--code-selection`. This component is what finally
makes §14 a consumed contract, not just produced tokens.

## Component API
- `lang` — language id (aliases resolved). **decided**
- code — slotted text content (or a `code` prop). **decided**
- `preload` — eager-load this block's grammar. **decided** (name `preload`, not `eager`)
- `line-numbers` — counter gutter, sticky on horizontal scroll, tag-aware so a token
  spanning lines still numbers cleanly. **decided** (borrows `--code-comment` /
  `--field-border`, adds no tokens; works under `wrap` and on the zero-JS path)
- `highlight` — tint chosen lines, a 1-based spec (`2`, `2,4`, `4-6`), drawn with
  `--code-line-highlight`. **decided** (name `highlight`, not `highlight-lines`; reuses
  the already-derived token, pairs with `line-numbers`, full-bleed under scroll/`wrap`)
- `wrap` — soft-wrap vs. horizontal scroll. **decided** (declarative `:host([wrap])`, no JS)
- `copy` — copy-to-clipboard button. **decided** (on by default; `copy="false"` to
  drop it). The fragment ships the button `hidden`; the custom element wires the
  click and un-hides it only where the Clipboard API exists, so the zero-JS Astro
  path and insecure contexts never paint a dead control. The click is element-owned,
  not a fragment handler — the zero-authority fill sandbox can't reach the clipboard,
  and a copy is a host capability, not markup the fill should re-skin. The seam is a
  declared contract: the fill's `hostControls` manifest entry (`{ marker, capability,
  behavior }`) names the control, the shared `wireHostControls` helper gates and wires
  it by capability, and a lint asserts every declared marker ships in the scaffold — so
  the next host-wired control is a manifest row, not a new hardcoded element branch.

## Still open
- `warm`/`registerLanguage` as statics on `XtyleCode` — leaning yes; the alternative
  is a `code` namespace object (`import { code } from "@xtyle/core/elements"`).
- Ship in `@xtyle/core/elements` (leaning yes; the class is tiny, only Prism is
  deferred) vs. its own opt-in subpath.
- Whether Prism's maintenance status warrants the hljs fallback up front.
