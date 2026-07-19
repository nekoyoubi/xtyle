# The collection substrate — `<xtyle-list>` and the shared selection core (design)

Eight components in the set are, underneath, the same machine wearing different
skins: **menu, tree, table, combobox, command-palette, tabs, segmented,
pagination**. Each one ropes off a set of items, moves a keyboard cursor across
them, marks one or more as chosen, and paints a region per item (an icon, a label,
a trailing shortcut, sometimes an action). Each one implements that machine again,
by hand, slightly differently — a private roving-tabindex handler here, a bespoke
`aria-selected` toggle there, its own copy of the `--selection-cue` marker CSS in a
third place. The divergence is not intentional design variance; it is eight
independent chances to get arrow-key wrapping, `Home`/`End`, typeahead, focus
restoration, and the color-only-selection accessibility contract subtly wrong, and
to fix a bug in one and not the other seven.

This document specifies the shared machine — a **collection substrate**: one
behavior core (roving navigation + selection model + active-indicator + item
anatomy), a thin reference skin over it (`<xtyle-list>`), and a deliberate order for
migrating the eight bespoke lists onto it. `table` is the load-bearing exception: it
keeps its own 2-D / column identity and stays a decorator over the author's real
`<table>`, but it **consumes the same selection core** rather than reinventing row
selection.

> Status: design. This slots beside [`component-fragments.md`](./component-fragments.md)
> (the fragment seam it builds on) and honors the selection-cue contract ratified in
> [`open-questions.md`](./open-questions.md) §12. The per-component migration order and
> the table seam are grounded in a survey of the eight components' current
> implementations; where this doc states "today," it means the code as surveyed, not a
> guess.

## Why a substrate, not eight lists

The argument is not DRY for its own sake. Three specific contracts are currently
re-implemented per component, and each is a place correctness silently rots:

1. **Roving-tabindex navigation.** Exactly one item is in the tab order
   (`tabindex="0"`); the rest are `tabindex="-1"`; arrow keys move the tab stop and
   `.focus()` the new item; `Home`/`End` jump to ends; typeahead matches a leading
   substring; focus wraps or clamps per orientation. This is ~40 lines of exacting
   keyboard code with well-known failure modes (losing the tab stop on delete,
   focus escaping on `Home` in a scrolled container, RTL arrow inversion). Eight
   copies means eight chances to diverge, and they have.

2. **The selection model.** `none` / `single` / `multi` / `range`, with the range
   machine (anchor + focus, `Shift+Arrow` extends, `Shift+Click` spans,
   `Ctrl/Cmd+Click` toggles) being genuinely fiddly. Menu has none; tabs/segmented/
   pagination are single; a multi-select list or a table row-selection wants
   multi/range. Today each that needs selection writes its own; most don't offer
   range at all because it is expensive to write once, let alone eight times.

3. **The color-only-selection accessibility contract** (§12). "Selection must not be
   color-only." The engine derives `--selection-cue: tint | marker`; under `marker`
   a text-context selection draws a redundant `✓` beside the label and a
   glyph-less surface draws a shape instead. Tree, Tabs, Segmented, Pagination,
   Swatch, and Carousel each carry their own `@container style(--selection-cue: marker)`
   CSS block today. That is the *form* (correctly per-component — see §12's "the cue
   form is the component's"), but the *decision to render a cue at all* is the same
   selection-state signal in all of them, and it should come from one place that can
   never forget to emit it.

A substrate collapses all three to one implementation, tested once, and makes adding
the ninth list-like component a skin over a proven core rather than a fourth-ish
re-derivation of roving tabindex.

## What the substrate is not

- **Not a layout primitive.** `stack` / `cluster` / `grid` arrange arbitrary
  children with no item semantics, no cursor, no selection. The collection substrate
  is about *items you navigate and choose among*. A list that merely stacks content
  with none of that is a `stack`, and should stay one.
- **Not a new fragment runtime.** It rides the existing xript fragment seam
  (`component-host.json` slots, mod-zero fills, `loadFill`, the host-owned op/intent
  loop). See [`component-fragments.md`](./component-fragments.md). The substrate is a
  set of shared element-side helpers plus a manifest vocabulary, not a second
  rendering path.
- **Not a headless-library dependency.** No downstream runtime dep; the core is
  xtyle's own code in `@xtyle/core/elements`, environment-neutral, drivable at build
  (Astro) and in the browser (Svelte / html) exactly like the rest of the set.

## The behavior core

The core is a set of pure, DOM-free helpers a skin composes — it does **not** own the
DOM (the fragment host does) and it does **not** own state storage (the element
does). It is the *logic* between a keyboard event and a `FragmentIntent`, factored so
every skin runs the identical, tested implementation.

### Where the core lives — the dual-consumption seam

This is the load-bearing structural decision, and the survey forced it. Today the
interaction logic is split across two layers and duplicated per component: an
element-side half (tree's `navContext()` → `NavRow[]`, `ensureRoving()`,
`applyIntent()`) and a **sandbox** half (tree's `navKeydown` is a pure export inside
`fragments/tree/mod.ts`, which the fragment runtime bundles into an isolated IIFE with
no imports). A fragment skin invokes its reducer *inside the sandbox*; the host applies
the returned intent.

But **`table` has no fragment at all** — it is an `XtyleDecoratorElement` that stamps
BEM classes onto the author's real `<table>` (no shadow root, no scaffold, no
`mod.ts`). It can never reach a sandbox export. So a selection core that only exists as
a fragment reducer cannot serve table, which is precisely the component the brief
requires to share the selection core.

The resolution: the core is authored **once as a plain TypeScript module** under
`@xtyle/core/elements/collection/` (`selection-model.ts`, `roving.ts`,
`nav-reducer.ts`) — no DOM, no sandbox assumption, no host binding. It is consumed two
ways, mirroring xtyle's existing build/runtime split:

- **Fragment skins** (menu, tree, tabs, segmented, combobox, command-palette) —
  their `mod.ts` imports the shared reducer, and esbuild **inlines it into each
  sandbox bundle** at build. The logic runs in the sandbox as before; it is simply no
  longer copy-pasted. One source, compiled into each fill. (Verified against
  `scripts/build-fragments.mjs`: it bundles `mod.ts` with `bundle: true, format:
  "iife"` and no `external`, so a relative import from the shared module inlines
  cleanly; the handler-namespacing regex only rewrites the `xript.exports.register(…)`
  calls, which stay in each `mod.ts`, never in the pure shared module.)
- **The decorator** (table) — imports the same module and runs it **host-side**,
  directly, exactly as it already imports `tableParts`. No sandbox in the path.

Both paths produce the same `FragmentIntent`-shaped result, which the element applies
host-side. This is the only design that lets a fragment-rendered listbox and a
decorated `<table>` share one tested selection machine. It also means the first
concrete refactor is mechanical and provable: **lift tree's `navKeydown` + roving
bookkeeping out of `fragments/tree/mod.ts` into `collection/`, and have the tree
fragment import it** — a behavior-preserving extraction with tree's existing tests as
the oracle, before any new skin exists.

Three cooperating pieces make up that module:

### 1. Navigation — one stepping engine, two focus strategies (`NavController`)

The survey killed the first draft's assumption of a single roving controller. The
eight split cleanly across **two** focus strategies, and the core must drive both:

- **Roving tabindex** (menu, tree, tabs, segmented) — exactly one item is in the tab
  order and real DOM focus *moves* to it.
- **`aria-activedescendant`** virtual focus (combobox, command-palette) — DOM focus
  stays parked on an `<input>`, and a virtual "active" pointer (an option id on
  `aria-activedescendant`) moves instead. The active option is scrolled into view by
  hand because the list never holds focus.

What is *shared* between them is everything that matters: the item set, the
enabled/disabled filtering, and the geometric stepping — next/prev with **wrap or
clamp**, first/last, `Home`/`End`, optional `PageUp`/`PageDown`, optional typeahead.
What *differs* is one thing: whether the result moves real focus (a `focus` intent) or
moves a pointer id (a `focusValue` / activedescendant intent). So `NavController` is
one stepping engine parameterized by a `focus: "roving" | "activedescendant"`
strategy, not two controllers.

Parameters:

- `orientation: "vertical" | "horizontal" | "both"` — which arrow keys step (`both`
  is the 2-D case; table's row axis and a wrapped segmented control both want it).
- `focus: "roving" | "activedescendant"` — the strategy above.
- `wrap: boolean` — step past the end wraps or clamps. (Menu/tree/tabs/segmented/
  combobox wrap; command-palette's page-jumps clamp while its single-steps wrap — so
  `wrap` is per-motion, not one flag. The engine takes wrap as a property of the
  motion, matching the surveyed behavior exactly.)
- `typeahead: boolean` — a printable-key buffer matches leading item text. (None of
  the eight do arrow-typeahead today; combobox/command-palette *filter* on typing
  instead, which is a per-component concern above the core — see below.)
- `homeEnd: boolean`, `pageKeys: boolean` — `Home`/`End`, `PageUp`/`PageDown`
  (command-palette is the only current `pageKeys` user).

It reads the item set live (so a re-rendered fill or a re-decorated `<table>` is
picked up), tracks the current index, and returns the intended move as a
`FragmentIntent` — it **never calls `.focus()` itself**, because focus is a host
effect, not sandbox reach (`component-fragments.md` §"Rendering loop": "anything that
moves focus or selection goes through an intent"). Disabled items are skipped. It is
the one place `Home`-in-a-scrolled-container, RTL arrow inversion, and
wrap-vs-clamp-per-motion are gotten right, once.

Filtering, overlay hosting, and form-association stay **out** of the core and in the
element: combobox's query filter + chips + `setFormValue`, command-palette's
`<dialog>` portal + document `mod+k` hotkey, menu's `[popover]`. The core stops at
item / focus / selection / intent; those are legitimately per-component (confirmed by
all four nav+select surveys).

### 2. The selection model (`SelectionModel`)

A pure, DOM-free state machine over item *keys*, parameterized by mode:

- `none` — no selection state; the collection is navigational only.
- `single` — at most one key; selecting another replaces it. Tabs, segmented,
  pagination (current page), single-select combobox.
- `multi` — a set of keys; each toggle adds/removes. `Ctrl/Cmd+Click` and `Space`
  toggle without clearing.
- `range` — a set plus an **anchor** and a **focus**; `Shift+Click` / `Shift+Arrow`
  replaces the range from anchor to focus; a plain click resets the anchor. This is
  the piece nobody wants to write twice.

It exposes `selectedKeys()`, `isSelected(key)`, and transition methods
(`toggle`, `replaceWith`, `extendTo`, `clear`) that each return the new selection so
the caller reflects it in one place. It carries **no** DOM and **no** ARIA — the skin
maps its output onto `aria-selected` / `aria-checked` / `aria-current` per its role
(a tab is `aria-selected`, a menu-item-checkbox is `aria-checked`, a pagination page
is `aria-current`), and onto the selection-state attribute the CSS reads.

The selection-cue contract (§12) attaches here, once: whenever `SelectionModel`
reports a key selected, the skin stamps the state that the shared item CSS branches
on under `@container style(--selection-cue: marker)`. The core guarantees the *signal*
is present on every selection-bearing skin; each skin still owns the cue's *form*
(✓ beside a label, a shape where no glyph fits), exactly as §12 requires. Table gets
this for free the moment it consumes the model — its historically color-only row
selection (the motivating case in §12) gains the redundant channel without table
writing cue CSS by hand.

### 3. Active-indicator state

"Active" (the item under the keyboard cursor / hover) is distinct from "selected"
(the chosen item), and conflating them is a recurring bug. The core keeps them
separate: `RovingController` owns *active* (the roving cursor), `SelectionModel` owns
*selected*. A skin can render both at once (the actively-focused row that is also
selected), and the CSS targets them independently (`[data-active]` vs the selection
state). Automatic-activation skins (tabs, where arrowing changes selection
immediately) simply wire "active changed → select the active key"; manual-activation
skins (a multi-select list, where you arrow to an item and press `Space` to choose)
leave them decoupled. That auto/manual switch is one boolean the skin sets, not two
code paths. (Command-palette today *conflates* the two — it writes
`aria-selected` off the active flag, for an item that is never persistently selected;
migrating it onto the core, which keeps active and selected separate, fixes that
as a side effect.)

### The intent vocabulary — formalize the god-union

The three pieces above emit their results as `FragmentIntent`s, the serializable
records the host applies (`focus`, `select`, `preventDefault`, `emit`, …). That union
already exists in `elements/fragment-host.ts`, and it has quietly grown into a
**god-union accumulating a field for every component's private needs** — `openMenu`,
`focusValue`, `activateValue`, `expandKey`, `nudge`, `jump`, `removeValue`,
`removeLast`, `commitValue`, `returnFocus`, and more. That it exists in that shape is
itself the strongest evidence a shared core is wanted: eight components already speak
one intent language, they just each invented their own words for it. The substrate
formalizes the collection-relevant subset into a structured, documented vocabulary
(`move` / `activate` / `select` / `toggleExpand` / `close` / `removeValue`) rather than
an ever-accreting flat union, and hoists the identical `applyIntent` preamble (the
byte-for-byte `preventDefault`/`stopPropagation` guard at the top of all four nav
elements), `captureReturnFocus`, `scrollActiveIntoView`, uid sequencing, and
`escapeHtml`/`escapeAttr` out of the per-component copies.

## Fragment anatomy — the item, its parts, and its finishes

Every collection item shares one anatomy, and the split follows the chrome rule in
[`CLAUDE.md`](../CLAUDE.md) exactly: what the component *invents and renders* is a
**part** (fragment-owned, mod-reachable); what a token *finishes* is a **finish** (CSS).

The four item regions, all **parts** the fill owns:

- **lead** — a leading affordance: an icon, a checkbox/radio glyph for a selectable
  item, an avatar, a tree twisty. Optional.
- **content** — the item's label / primary content. Required. **Fill-drawn from a
  data array** for every fragment skin: the survey confirmed all eight list-renderers
  are data-driven (items arrive as a JSON prop; item markup is generated in the
  `mount`/`update` hook, because a fragment template cannot loop — see
  `component-fragments.md` §"Iteration"). The one exception is `table`, which decorates
  the author's real `<tr>`/`<td>` in place. So `content` is generated markup in the
  reference skin and every fragment migration, and authored markup only in table.
- **trail** — a trailing affordance: a keyboard shortcut (`kbd`), a count/badge, a
  chevron, a metadata timestamp. Optional.
- **actions** — a cluster of per-item controls (a delete button, an overflow menu).
  Optional, and the one region with a wiring caveat (below).

Two things that are **finishes**, not parts, and stay in CSS — this is deliberate and
follows §12's carve-out that "a pseudo-element gated on a design token is a finish by
construction":

- **the selection marker** — the `✓` (or shape) under `--selection-cue: marker`. It
  is drawn by the shared item CSS inside the container-style query, never as a node
  the fragment builds. It is the algorithm's accessibility policy applied uniformly,
  which is the definitional opposite of a mod-surface hole.
- **the active/focus ring and the hover wash** — token-valued finishes on the item
  box, not structure.

### The `actions` wiring caveat

Per [`component-fragments.md`](./component-fragments.md), a fragment override **cannot
add interactive chrome**: handler declarations are collected from the *built-in*
manifest, and new buttons a fill draws get no events unless they match a selector the
built-in already declares. So the `actions` region cannot be an open-ended "put any
interactive control here and it'll work" surface for overrides.

The substrate resolves this the way `<xtyle-code>`'s copy button already did (see
[`code-component.md`](./code-component.md)): item actions are a **declared contract**,
not free markup. An action is a manifest row (`{ marker, capability, behavior }`)
that the built-in scaffold ships and the shared `wireHostControls` helper gates and
wires by capability; a lint asserts every declared marker ships in the scaffold. An
override can restyle a declared action and swap its glyph; adding a *net-new*
interactive action is a manifest change, which is the honest boundary of today's
fragment model rather than a hole pretending otherwise.

## `<xtyle-list>` — the reference skin

`<xtyle-list>` is the thin, general skin over the core: the plainest possible
collection, the one you reach for when you want "a navigable, optionally-selectable
list of items" and none of the eight specialized identities. It is also the **proof
harness** for the core — if the core can't express a clean generic list, it can't
express the eight.

### Dimensions (manifest `props` / `variants`)

- **`orientation`** — `vertical` (default) | `horizontal`. Sets the roving axis and
  the flow direction.
- **`item-interaction`** — the interaction posture, four values:
  - `static` — no cursor, no selection; a presentational list (roving off). Rare, but
    it means `<xtyle-list>` degrades to a styled `<ul>` cleanly.
  - `navigational` — roving cursor, no selection; items are links/actions you move
    among and activate (menu-like).
  - `selectable` — roving + a `SelectionModel`; the `selection` prop picks the mode.
  - `actionable` — `navigational` plus per-item `actions` (the declared-control
    region).
- **`selection`** — `none` (default) | `single` | `multi` | `range`. Only meaningful
  under `item-interaction="selectable"`; drives which `SelectionModel` mode runs.
- **`paging`** — opt-in, `off` (default) | `pages` | `virtual`. `pages` chunks the
  item set with the existing `pagination` skin as the control; `virtual` windows the
  DOM for large sets. Both are **opt-in and off by default** — the plain list pays
  for neither. (Virtualization interacts with roving — the cursor must be able to move
  to an item not currently in the DOM window — so it is a core-aware feature, not a
  bolt-on; the core exposes the item *keys* independent of their DOM presence for
  exactly this.)

### Manifest shape

`<xtyle-list>` declares an ordinary `ComponentManifest` (`manifest/types.ts`) like
every other component — the substrate adds **no** new manifest machinery, it uses the
existing fields:

- `id: "list"`, `category: "content"` (a general collection; the specialized skins
  keep their own categories).
- `anatomy`: the four item parts (`lead` / `content` / `trail` / `actions`) plus the
  container (`root`, `list`), each an `AnatomyPart` with its `selector` and consumed
  `tokens`.
- `props`: `orientation`, `item-interaction`, `selection`, `paging`, per above, each a
  `PropDef` with `options` enumerated so the reference page and MCP surface them.
- `states`: `active` (the roving cursor), `selected`, `disabled`, each a `StateDef`
  with its `selector`.
- `consumedTokens`: the item surface/hover/active/selected token families plus the
  `--selection-cue` axis (declared consumed so the coverage check and §12's
  `lintStyleQueryDomains` both see it).
- `slots`: optional per-item rich-content slots (`item-N`), following `segmented`'s
  precedent, for the cases where a data string isn't enough. The primary path is the
  data `items` prop, not slots.
- `examples`: the four interaction postures, each as a copy-pasteable
  `html`/`svelte`/`astro` triple.

The specialized skins that migrate onto the core keep their *own* manifests unchanged
in shape — they simply share the core's *implementation*. A reader of the menu
manifest still sees a menu; the substrate is an implementation fact, not a manifest
one. (Whether the manifest should *declare* substrate participation — a
`collection: { nav, selection }` block — is left open below.)

---

## The eight today

Surveyed as the code stands. Every component but `table` renders through a fragment
(`fragments/<id>/mod.ts`) with a pure `navKeydown`-style export returning an intent;
`table` is a decorator with no fragment. This is the reality the migration is measured
against, not an idealization.

| component | nav model | selection | item anatomy (regions it renders) | active vs. selected | ARIA pattern |
|---|---|---|---|---|---|
| **tree** | roving tabindex; Up/Down, **Left/Right expand-collapse**, Home/End, Enter/Space | **single** — `aria-selected` + accent row + `--selection-cue` ✓ | **lead** twisty · **content** label · **trail** badges · **actions** hover cluster (all four) | roving focus is the cursor, distinct from `aria-selected` | `[role=tree] > [role=treeitem] > [role=group]` |
| **menu** | roving tabindex; Up/Down, Home/End, Enter/Space, Esc, Tab | **none** (action list; fires `select`, marks nothing) | **content** label · **trail** hint (shortcut); heading/separator groups | none — roving focus *is* the highlight | `[popover][role=menu] > [role=menuitem]` |
| **tabs** | roving tabindex; Arrows/Home/End, wrap, skip disabled | **single** — `value` attr → `aria-selected` + `--selection-cue` ✓; `change{value}` | **content** label only (icon must be baked into label HTML) | per-variant fill on selected; focus ring separate | `[role=tablist] > [role=tab]` |
| **segmented** | roving tabindex; **auto-only** (arrow = move+select); wrap | **single** — `value` → `aria-checked` + ✓; **form-associated**; bare `change` | **lead** icon slot · **content** label · **trail** badge | token fill on checked; focus ring separate | `[role=radiogroup] > [role=radio]` |
| **combobox** | **`aria-activedescendant`**; Up/Down, Home/End, Enter, Esc, Tab-commit, **Backspace** remove-last | **single or multi** — `aria-selected` + check glyph + chips; form-associated | **content** label · **trail** check; control chrome: chips, clear, caret | **clean split** — `data-active` vs `aria-selected` | `input[role=combobox] + [role=listbox][aria-multiselectable] > [role=option]` |
| **command-palette** | **`aria-activedescendant`**; Up/Down, **PageUp/Down**, Enter, Esc; typing filters; doc hotkey | **none** persistent (launcher) — but `aria-selected` is wrongly bound to *active* | **content** label (+`<mark>` match) · **trail** hint + `<kbd>` keycaps; heading groups | active only — **conflated** into `aria-selected` (a smell) | `dialog > input[role=combobox] + [role=listbox] > [role=option]` |
| **pagination** | **none** — native Tab over `<a>`/`<button>`; no keydown handler | **single** "current page" → `aria-current="page"`; a scalar over a *virtual* range (pages behind an ellipsis aren't rendered) | prev/next SVG controls · page-number `<li>` · ellipsis sentinel (a different item species) | static pill on current; **shape** cue (underline bar), not ✓; focus ring separate | `<nav> > <ol> > [aria-current]` |
| **table** | **none** — sortable headers are individual tab stops; scroll wrap conditional tab stop | **none today** — no row/cell/column selection exists at all | decorates the author's real `<tr>`/`<td>`; invents only the sort caret (via Icon) | n/a | native `<table>` + `aria-sort` on headers |

The duplication the table makes concrete, tallied across the surveys:

- **Wrap-around arrow stepping** `(here ± 1 + n) % n` — reimplemented in tree, menu,
  tabs, segmented, combobox, and command-palette. Six copies of the one loop.
- **`navKeydown`** — tabs and segmented are near-byte-identical; menu, tree, combobox
  each a variant of the same shape.
- **Roving `tabindex` assignment** (`selected && !disabled ? "0" : "-1"`) — in tabs,
  segmented, tree, menu, plus each component's `update` hook.
- **`applyIntent` preamble** (`preventDefault`/`stopPropagation` guard) — byte-identical
  atop menu, tree, combobox, command-palette.
- **Virtual-focus plumbing** (`activeValue` + `aria-activedescendant` +
  `scrollActiveIntoView`) — independently reimplemented in combobox and command-palette.
- **`--selection-cue` container-query block** — pasted into tree, tabs, segmented,
  swatch (✓) and pagination, carousel (shape). Seven copies.
- **`escapeHtml`/`escapeAttr`, rootClass builder, tone-var generation, the rAF settle
  re-render, `shapeSignature`/`reshapeIfChanged`, `warnIfUnnamed`, uid counters** —
  duplicated across nearly every one.

That is the case for the substrate in one table: not a hypothetical tidiness, a
measured six-to-seven-fold repetition of exactly the code where keyboard and
accessibility correctness lives.

## Adoption order

Lowest-risk / highest-proof first. Each step has a built-in oracle (existing behavior
or existing tests) so no step is a leap. The core grows in two capability steps
(roving first, then activedescendant); the skins adopt as that capability lands.

**Phase 0 — Extract the core from tree, behavior-preserving. ✅ Landed.** Tree is the
richest exemplar: it already does roving + single-select + the full
lead/content/trail/actions anatomy + the `--selection-cue` marker. What landed:
`@xtyle/core/elements/collection/` with `roving.ts` (the linear stepping +
roving-resolution the value-picker survey flagged as the clearest dedup),
`nav-reducer.ts` (the linear keydown reducer), and `selection-model.ts` (the full
`none/single/multi/range` model), each with direct unit tests. Tree's fragment
`navKeydown` now delegates its linear axis (Up/Down/Home/End) to `linearNav` and
composes its own hierarchical keys (Left/Right expand-collapse, Enter/Space) on top;
the element's `ensureRoving` calls `resolveRoving`. Tree's **expansion-state
reconciliation stays tree-side** — it is hierarchical (keep-collapsed-branch,
live-data reseed), not generic selection, so it never belonged in the core; the
`SelectionModel` is built and tested here and first *consumed* by `<xtyle-list>` in
Phase 1. **No behavior change**: tree's existing suite plus a new keyboard test are the
oracle (2299 tests green), and esbuild was confirmed to inline the shared module into
tree's sandbox `mod.js` (0 imports, self-contained IIFE) — the dual-consumption path
proven in practice on day one.

**Phase 1 — Ship `<xtyle-list>` on the extracted core. ✅ Landed.** The reference skin
is built directly on `collection/`: element + fragment + host slot + built-in fill +
CSS + manifest + registry + `@xtyle/svelte` / `@xtyle/astro` wrappers + live demo +
card preview + tests. It ships all four `item-interaction` postures and the full
`none`/`single`/`multi`/`range` selection (`SelectionModel`'s first consumer — proving
it beyond its unit tests), with ctrl/shift-click driving toggle/range via a new
modifier-key serialization in the fragment host. Browser-verified live under a derived
theme. `paging`/`virtual` remain opt-in follow-ons. A guard refinement rode along:
`fragment-marker-collisions` now flags a borrowed marker only when the owning component
ships a global `[data-<id>]` rule (its documented harm), so `data-list` stays legal for
the components that use it internally.

**Phase 2 — tabs + segmented. ✅ Landed.** The clearest dedup: both fragments'
`navKeydown` hand-rolled the same wrap-around arrow loop. Both now delegate to the
shared `linearNav` (orientation `both`, wrap, Home/End), composing their own activation
on top: tabs keeps its automatic/manual `activation` flag (auto selects on move, manual
commits on Enter), segmented activates on move like a radiogroup — each still reading
the element's existing `enabledKeys` context, so no element-side change was needed.
Their single-value selection and segmented's form-association stay element-side
unchanged (roving keys on the selected value, so there is no separate cursor to model,
and wrapping a trivial single value in `SelectionModel` would be churn without benefit);
the `--selection-cue` ✓ stays a per-component finish. Keyboard tests were added for both
(they had none), and live arrow nav was browser-verified. The behavioral tests are the
oracle; the render markup is untouched, so the visual-regression baselines are unaffected.

**Phase 3 — menu. ✅ Landed.** Roving, `selection: none`, `navigational` posture. Menu's
`itemKeydown` now delegates its Up/Down/Home/End (wrapping) to the shared `linearNav`,
mapped to the menu's `focusValue` intent, while its own keys stay on top: Enter/Space
activates, Escape closes and returns focus, Tab closes. Menu keeps its `[popover]`
hosting entirely element-side — the core touches only the roving axis. A `menu-keyboard`
test (skip-disabled, wrap, Home/End) was added to cover nav the suite had missed, and
live nav was browser-verified. Render markup untouched; visual baselines unaffected.

**Phase 4 — combobox + command-palette (the activedescendant step). ✅ Landed.** The
`aria-activedescendant` pair now consumes the core's stepping — proving `linearNav`/
`stepKey` are focus-strategy-agnostic (they return a target key; the element decides
real-focus vs. virtual-pointer). Combobox's fragment `inputKeydown` delegates its
open-list arrow/Home/End to `linearNav`, reported as `focusValue`, keeping open/close,
Enter/Tab commit, Escape, Backspace-remove-last, and query-filtering + form-association
element-side. Command-palette's element-side `moveActive` consumes `stepKey` for its
single-step wrap (host-side import — the decorator-style consumption table also uses),
keeping its page-jump clamp, `<dialog>` portal, `PageUp/Down`, and `mod+k` hotkey
element-side. `stepKey` was refined so a null/unknown cursor lands first-forward /
last-back (combobox's filtered-out-active case); inert for the roving skins, which never
pass a null cursor. Scoped narrower than the original ambition: the `scrollActiveIntoView`
/ option-id plumbing was **not** hoisted into the core, and command-palette's
active-bound `aria-selected` was left as-is — both are element-side today and are clean
follow-ons, not blockers. The components' mature suites (combobox 62 / 28 arrow
assertions, command-palette 39 / 10) are the oracle; combobox activedescendant nav was
browser-verified live.

**Phase 5 — pagination. ✅ Landed as a reasoned no-migration.** The plan had pagination
consume `SelectionModel(single)` keyed over its virtual range. Looking at the code, that
is the wrong call: pagination has **no keyboard handler, no roving, no `tabindex`
management, and zero fragment handlers** — it is a *navigator*, not a collection you rove
or select within. It uses native Tab order over `<a>`/`<button>`, a scalar `page` integer
reflected as `aria-current`, and a direct click listener that bypasses the intent
pipeline entirely; its `range()` ellipsis-windowing is pagination-specific. So there is
no nav-stepping to delegate to `linearNav`, and wrapping a single monotonic page index in
`SelectionModel` (a *set* state-machine) is a category error and the exact churn declined
for tabs/segmented's single value in Phase 2. The value-picker survey reached the same
conclusion independently ("pagination shares the CSS/scaffold conventions and the
`FragmentHost` plumbing but **not** the roving/nav/intent code"). Pagination proves roving
is optional simply *by existing outside the core* — no code needs to be forced onto it to
demonstrate that. It stays as-is by design; the "selection can key items not in the DOM"
property is already carried by `list` and `combobox`, which have real set-selection over
filtered lists. No code change; this entry records the decision.

**Phase 6 — table (the host-side seam). ✅ Landed.** The most novel integration, and it
worked exactly as designed: table consumes the core **host-side, with no fragment**, as a
decorator. A `selection` prop (`none`/`single`/`multi`/`range`) makes the body rows a
`role=grid`; the element imports `SelectionModel` + `linearNav` + `resolveRoving`
directly (the plain-module path, proven from Phase 0), holds the selected row keys, and
drives the row cursor over the row axis only. Click/Enter selects, Space toggles,
Ctrl/Cmd-click toggles, Shift-click and Shift+Arrow extend; rows key by `data-value` (or
index), seed from `data-selected`, and an `input[data-row-select]` checkbox mirrors state.
The entire column axis — sort, `scope`, sticky, geometry — is untouched, and marking is
`aria-selected` on the `<tr>` (attribute writes, which the content observer's `childList`
watch ignores, so the survey's feared disconnect-guard turned out unnecessary). Resolves
the dead `component.table` slot: table consumes the core **without a fill**, as predicted.
Shipped with CSS, manifest, astro/svelte props, a selectable-rows demo, and tests;
browser-verified live.

**All six phases are landed.** Eight components were surveyed; seven now share the nav
core (tree, list, tabs, segmented, menu, combobox, command-palette) and `table` consumes
its selection half host-side, leaving `pagination` deliberately outside as a navigator.
The hand-rolled wrap-around arrow loop that appeared six times is now one tested
implementation, and the `SelectionModel` behind `<xtyle-list>` and `<xtyle-table>` is one
range machine instead of none. Open follow-ons, none blocking: the `--selection-cue` CSS
is still a per-component finish (never unified into a helper), combobox/command-palette's
`scrollActiveIntoView` + option-id plumbing was not hoisted into the core, and
`paging`/`virtual` on `<xtyle-list>` remain opt-in stubs.

## The table seam

`table` is the exception that proves the core is 1-D-with-a-pluggable-item-resolver,
not 2-D. The rule: **make the core one-dimensional over a host-supplied item list, and
let table own the orthogonal column axis as a decorator wrapped around the core.**
Never teach the core what a column is.

What stays table-only (the column axis and its native-`<table>` substrate — none of it
enters the core):

- `<thead>`/`<tbody>`/`<tfoot>`, `<caption>`, `<th scope>` row/column association —
  table decorates these in place; it never generates them.
- Per-column **sort** (`aria-sort` asc/desc/none + the rotating caret), column
  alignment, widths/`colgroup`, and any future sticky-first-column.
- Grid-geometry chrome: `bordered` full-cell grid, `striped` zebra `:nth-child`, the
  header under-rule, footer-cell reclassification.
- Scroll/overflow geometry: the `overflow:auto` wrap, `max-height`, the live
  `ResizeObserver` overflow → conditional scroll tab stop, rounded clipping, sticky
  header.

What table consumes from the core (the row axis, `rows-as-items`):

- **Selection state**, keyed by a stable row value — `none`/`single`/`multi`/`range`,
  the whole machine table lacks today. This is the motivating §12 case: table's
  eventual color-only selected-row gains the redundant `--selection-cue` channel for
  free, without table writing cue CSS.
- **Roving bookkeeping** for the row axis (one `tabindex=0` row, the rest `-1`), the
  discipline tree already implements.
- **The keydown reducer** for the linear (row) axis — Up/Down/Home/End/Enter/Space,
  Ctrl/Shift → toggle/range — returning an intent table applies.

What the core must expose for table to plug in (this is the API the reference skin also
uses, generalized so it isn't listbox-shaped):

1. **A host-supplied item resolver, not a DOM assumption.** The core takes
   `getItems(): ItemRef[]` (an iterable of `{ key, element, disabled }`) rather than
   hard-coding "my items are my children" or "items carry `role=option`". Table supplies
   `tbody tr` mapped to `{ key: row.dataset.value, element: row }`. This is exactly the
   shape tree already flattens to (`NavRow`), generalized.
2. **Selection keyed by opaque string + a marking callback.** The core owns the
   `Set<key>` and the mode/anchor; it does **not** write ARIA. It calls a host-provided
   `markSelected(itemRef, selected)` so table writes `aria-selected` on the **`<tr>`**
   (the native-correct target — rows, not cells) while a listbox writes it on its option
   and a checkbox column mirrors it onto an author-owned `<xtyle-checkbox>`.
3. **Roving as `(activeKey, setActive, tabindexFor)`**, decoupled from selection, so
   table applies the tab stop to the row element.
4. **A pure reducer that takes a caller-supplied geometry and returns an intent** — it
   handles only the linear axis and never touches the DOM. Table calls it for vertical
   (row) motion and **wraps** it for the second axis: Left/Right, cell-level focus, and
   header-sort activation are intercepted by table *before* it delegates the leftover
   keys to the core. The column axis is a decorator around the core, not a parameter
   inside it. This is the whole of "without contorting either."

Two integration constraints specific to table, both from the survey:

- Because table is a decorator with **no fragment**, it reaches the core only through
  the host-side import path (Phase 0's plain module), never a sandbox export. This is
  the reason the core must be a plain module, restated as a hard constraint.
- Table's selection marking must run **inside** its existing `MutationObserver`
  disconnect guard (`decorate()` disconnects the observer around its own class writes),
  or core-driven `aria-selected` writes will re-trigger the decorate observer. The
  `markSelected` callback is invoked from within that guarded window.

A "selection column" (a checkbox per row) is **author-owned markup** — a real `<td>`
with an `<xtyle-checkbox>` — consistent with the decorator doctrine: the core toggles
state, table reflects it onto both the `<tr>`'s `aria-selected` and the checkbox's
`checked` through the same `markSelected` hook. Nothing new is invented as chrome.

## Still open

- **Manifest declaration of substrate participation.** Should a migrated component's
  manifest carry an explicit `collection: { nav, selection }` block (discoverable,
  lintable, MCP-visible), or is substrate participation purely an implementation
  detail invisible to the manifest? Leaning toward a small declared block, because the
  coverage/lint machinery already rewards declared contracts over implicit ones.
- **`item-interaction="actionable"` + `selection` together.** The survey settles the
  direction if not the syntax: `tree` already renders a per-item **actions** cluster
  *and* carries single selection, so actionable-and-selectable co-occurs in the set
  today. The four-value `item-interaction` enum treats them as siblings, which the tree
  evidence contradicts. Lean: two orthogonal axes — a `navigational` baseline plus
  independent `selectable?` and `actionable?` — rather than one enum. Open only on the
  *surface* (one enum prop vs. two independent props); the model is orthogonal.
- **Where `<xtyle-list>` and `menu` diverge — mostly resolved.** The nav+select survey
  draws the line: the container differs sharply across the family (menu = `[popover]`,
  combobox = `xtyle-popover`, command-palette = `<dialog>` + portal + a document
  hotkey, tree = inline), and overlay hosting, query-filtering, and form-association are
  legitimately per-component. So `menu` is **not** a preset of `list`; it is a distinct
  skin sharing the core's item/focus/selection/intent while owning its overlay identity.
  The substrate stops at the collection; the overlay is the component's. Open only:
  whether the overlay-ish intents (`close`, `returnFocus`) live in the collection
  vocabulary or a sibling one.
- **Data-driven vs. authored items for `<xtyle-list>`.** Every fragment skin is
  data-driven (items as a prop); only `table` decorates authored children. The reference
  skin follows the family and is **data-driven** (an `items` prop), with optional
  per-item slots for rich content exactly as `segmented` already does (`slot:
  "segment-N"`). Open: whether `<xtyle-list>` *also* offers an authored-children mode for
  the plain case, or stays purely data-driven. Leaning purely data-driven — the fragment
  model (templates can't loop) makes authored-children the awkward path.
- **Virtualization and SSR.** The Astro build-time path renders static markup; a
  virtualized list has no complete static form. Likely: `virtual` degrades to the full
  list at build and windows only under the runtime, matching the existing build/runtime
  split and pagination's proof that selection can key items not in the DOM. Confirm
  against `fragment-ssr.ts`.
