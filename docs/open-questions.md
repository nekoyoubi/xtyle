# xoji: open questions

Live forks, roughly in the order they gate other work. Several have since settled as the
engine and component set got built. Those carry an inline `DECIDED`/`RESOLVED`/`DONE` marker
and stay here as the record of how they were answered; the rest are genuinely open. The prior
cycles in an earlier in-house theme engine are a starting point, not a verdict.

## Settled: the derivation architecture (see `derivation-model.md`)

The spine is locked; don't relitigate. Captured in full in `derivation-model.md`:

- **The algorithm is the asset; the theme is the print.** Algorithm = a named,
  composable **xript** module owning rules / math / defaults / exposed knobs.
  Theme = an invocation of one (knob bindings + overrides), materialized.
- **Resolution per field** = explicit literal | explicit-fed-xript | algorithm's
  rule. An override is a **constraint the algorithm re-solves around**, not a leaf
  patch (pinned `accent-2` → the algorithm re-fits `accent-3/-4`).
- **The register is open, not fixed.** Authors declare new tokens (`--color-pink`),
  rewire any derivation, build superset algorithms.
- **The only hard contract is a coverage check**: components declare what they
  consume, modules declare what they produce, the engine verifies coverage.
- **No engine-level "can't look bad" gospel.** Invariants are per-algorithm
  policy; the gauntlet is parameterized by algorithm.
- **Three input tiers**: algorithm internals (builders) / algorithm knobs (the
  whole casual UX) / token overrides (universal escape hatch).

## 1. Engine language (DECIDED: TS-core)

The derivation engine is **TypeScript**, shipped as the npm source of truth.

**Why.** The engine is tiny, rarely-run math (parse colors → OKLCH arithmetic →
contrast-safe pairs → ~80 tokens, once per theme load/switch), so perf is a
non-factor and Rust's speed/size edge buys nothing perceptible. That leaves one
question (where does friction hurt?) and it hurts most on the web, which is the
bigger audience and the whole reason xoji is standalone. TS-core is frictionless
on web (`npm install`, no WASM, no async init, identical in browser / SSR /
Astro-build / edge, debuggable, KBs) and runs in the Tauri apps through the
QuickJS the xript runtime already embeds. One codebase everywhere; engine and
author `generate`-fns speak the same language; engine + contract types live in
one repo.

Rejected **Rust+WASM** because the web story is the friction-heavy one (`.wasm`
blob, async instantiation, bundler/SSR/CSP headaches, a black box OSS consumers
can't read or patch), landing the cost exactly where the "minimal friction"
pitch can least afford it. The prior in-house Rust engine isn't wasted:
it's the **spec to port from** (ramp steps, accent rotation, contrast-crossover
foreground pick all translate 1:1), with the gauntlet verifying parity.

**Cost, accepted:** the Rust apps cross the JS boundary to derive (invisible,
since derivation is rare and that boundary is already crossed for the current
engine and author scripts).

**Escape hatch (YAGNI for now):** if built-in default themes ever need to derive
without spinning up QuickJS, add a thin Rust shim for just that path later.

**Ties to the algorithm model:** the TS engine is the *host*; algorithms and author
overrides are **xript** (JS on the QuickJS the runtime already embeds), so engine,
algorithms, and overrides all speak one language, the original "same language"
rationale, now generalized from a color-only `generate`-fn to the whole algorithm
artifact.

## 2. Packaging / monorepo layout (DECIDED: single repo, npm workspaces)

Single repo, npm workspaces. The engine + raw custom elements ship as one
`@xoji/core` (with `@xoji/core/elements`, `/markup`, `/css`, `/authoring`, `/elements/ssr`
subpaths); thin `@xoji/svelte` and `@xoji/astro` bindings wrap it; the algorithms live as
xript mods under `algorithms/`; the site is `apps/site`. (The early sketch's separate
`engine` / `contract` / `headless` / `preact` packages collapsed into `@xoji/core` + the two
bindings.)

## 3. Palette specifics: largely RESOLVED

- The exact ~12 hue list **landed**: twelve named hues, each a full four-token family
  (`--{hue}` / `-bg` / `-fg` / `-text`) plus a `--{hue}-vivid` member.
- **Hues derive off the accent (DECIDED).** Each named hue keeps its canonical angle but scales
  its chroma off the accent's chroma (with a floor so a near-gray accent's hues stay
  recognizable) and biases lightness toward the accent, so a vivid brand fans out vivid named
  colors, a muted brand mutes them.
- Ramp stop count / names: the swatch ladder (`--color-*`) carries a monotonic lightness ramp;
  the exact named-stop vocabulary beyond the four-token family is the one piece still soft.

## 4. Spacing scale shape

Numeric step scale (`--space-1..16`) vs named (`--space-xs..xl`). How density
modes compose over it (multiplier vs override).

## 5. Type ramp extent: RESOLVED

Extended, and the sibling axes decided. The size ramp runs
`xs → sm → body → lg → xl → 2xl → 3xl → 4xl → 5xl` (the modular ratio climbs two display stops
past `3xl`). `--leading-*` (`tight`/`normal`/`loose`) and `--weight-*` (`normal`/`medium`/`semibold`/`bold`)
are part of the derived contract; `--tracking-*` was **left out**: letter-spacing is the component
library's call, not a derived token. All blessed algorithms produce the full set, byte-identical to baked.

## 6. brand-token seam

Exact push (brand anchors in) and pull (derived tokens out) surface for an
external brand-identity token system. What format does it hand xoji, and what
does xoji expose back?

## 7. Component catalog scope: RESOLVED (growing as designed)

The first cut landed and kept growing: ~50 components across shell, layout, forms,
navigation, feedback, and data-display, each a xript fragment whose `consumedTokens`
the coverage lint verifies. The premise held: the catalog grows freely because every
component speaks only contract verbs; no fixed scope, no engine coupling. Adding the
next component is a registration checklist, not an architecture decision.

## 8. Tauri adapter surface

The thin `-tauri` edge: theme persistence, OS dark/light detection, window-chrome
theming, live-switch IPC. Confirm the boundary so it never leaks into the core.

A working reference shape already exists in a shipping Tauri + xoji consumer, worth
mirroring rather than redesigning from scratch:

- **persistence**: the active theme id lives in a small key-value store (a `ui.theme`
  key), read at boot and written on switch; the adapter exposes a store-backed
  `getTheme()` / `setTheme(id)` seam so no app reinvents it.
- **live-switch**: a Rust-side `theme-changed` event re-applies the register to
  `document.documentElement` with a `setProperty` loop (no re-derive), so a switch is
  instant and flicker-free.
- **OS scheme**: track the OS light/dark signal and flip between a light and dark
  recipe; a time-aware auto-switch rides the same seam.
- **window chrome**: the OS titlebar and frame read the same register, so the native
  chrome stays coherent with the webview content.

The boundary to confirm: this all lives in a `@xoji/tauri` edge package, never the
environment-neutral core. The package itself is a deliberate, user-owned call.

## 9. Knob vocabulary: the next load-bearing fork

The casual author's entire world is **tier 2 (algorithm knobs)**, so the shape of
that surface is the input-side mirror of the open-register decision. Two poles:

- **Freeform**: every algorithm declares whatever bespoke knobs it wants. Max
  expressivity, but every algorithm needs a custom UI and you can't meaningfully
  swap one algorithm for another or compare them.
- **Blessed-core-plus-extension** *(current lean)*: xoji blesses a standard intent
  vocabulary (`scheme`, `contrast-band`, `vibrancy`, `edge`, `density`, `anchors`,
  …) the generation tooling renders consistently, plus freeform extension for the
  weird stuff. Lets "swap the algorithm, keep my cyan + orange and my mid-high
  contrast" do something predictable.

Open: the exact blessed set, knob types (enum / range / color / list), how an
algorithm maps a blessed intent onto its internal rules, and how composed /
inherited algorithms merge or override an ancestor's declared knobs.

## 10. Discovery & resolution: sub-forks

The shape is settled (`repo-layout.md` → "Discovery & resolution"): manifest-declared
packs, shape-dispatched refs, `#name` selectors, an npm-derived index, a `@handle`
author shorthand. The open details:

- **Reference grammar finalization**: the exact accepted shapes and the selector
  char (`#name` vs `:name` vs `/name`). Settle once the CLI is real.
- **`@handle` vs `@scope/pkg` disambiguation**: reserve bare `@handle` (no slash)
  for the author-profile index, `@scope/pkg` for npm. Confirm no edge cases bite.
- **Index source**: npm-derived (keyword / scope / maintainer queries) vs an
  author-published **profile manifest** vs both. Where the profile lives (served by
  xoji.dev? a `<owner>/xoji-profile` repo?) and how cross-scope / GitHub packs
  aggregate.
- **Pack manifest schema**: the exact `xoji` field / `xoji.json` shape that
  enumerates `{ algorithms, themes }` (names, kinds, entry points, version pins).
- **Install-time trust for CLI `add`**: npm install runs unsandboxed postinstall;
  decide whether xoji leans on plain npm trust or adds any vetting / lockfile
  discipline. (Run-time is already safe via the xript sandbox.)

## 11. Derivation quality under real-world anchors: sub-forks

Scrutiny across five real-world themes (light corporate, warm brand, near-monochrome,
high-vibrancy, high-contrast) rendered over the full component set confirmed the
chassis holds everywhere: the `fg-0..3` text ramp and the surface *lightness* spacing
are even, monotonic, and AA/AAA in every theme. It also surfaced where the algorithm
passes its per-token AA invariant while failing the *product*: the gauntlet checks
each token in isolation, so none of these were caught. Each is per-algorithm policy,
not architecture:

- **Accent-2/3/4 identity: shade ladder vs harmonic.** `accent-2`/`-3` flank the
  accent at ∓half the shift step and `accent-4` is its 180° complement (a
  split-complement fan off the base, each member derived independently and
  individually pinnable), so a chromatic brand yields a harmonious, distinct
  four-color set rather than a tight analogous huddle. The categorical posture is the
  current default; a shade ladder of the accent (deeper / lighter around the one brand
  hue) remains the likely answer for a branding-first posture, so the fork is still
  open, possibly per-algorithm (ties to #3). Re-confirmed dogfooding seven brand /
  hostile palettes: chromatic accents spread cleanly, but a near-gray accent still
  collapses to near-identical grays (hue rotation can't separate what has no chroma;
  see the next bullet).
- **Low-chroma / contrast-floor accent fallback: the *vanish* is FIXED; the *ramp* taste fork stays open.**
  The accent only ever moves on hue/chroma, so when chroma collapses (near-gray accent) it can't
  separate from neutral. Dogfooding showed the failure is broader than chroma: *any* solid page-paint
  fill whose lightness lands on `--bg-0`'s vanishes: a violet accent reads `1.01:1` on a mid-gray
  page, an achromatic-dark accent collapses `--accent` onto `--bg-0` (both `#141414`, `1.14:1`), and a
  mid-gray page sinks `--neutral` and the status solids (`--danger` `1.38:1`) alongside it. None of
  these is taste: a primary/secondary/destructive control you can't see is a bug the per-token AA
  gauntlet never caught (each fill's own *text* still read). **Fixed with a lightness-axis safety
  floor:** every non-pinned solid that paints directly on the page (`--accent`, `--neutral`, the status
  fills) is pushed away from `--bg-0` along lightness (hue and chroma preserved) until it clears a
  minimum `1.5:1` separation, and a `solid fills separate from --bg-0` gauntlet invariant guards the
  line. A healthy chromatic fill already clears it and is untouched (amber `1.88`, vivid blue `4.53`),
  so only the degenerate near-coincident cases move; a pinned fill is honored verbatim. What *remains*
  open is purely the **categorical taste fork**: a pure-gray accent still fans `accent-2/3/4` into four
  byte-identical grays (hue rotation is a no-op with no chroma to turn), the same `accent-N` identity
  question (split-complement vs shade-ladder, §11 first bullet), and whether the fan should borrow the
  status chroma-floor so a muted brand's accents stay mutually distinguishable. That's a look call, not
  a safety one; surface, don't force.
- **Accent↔danger collision guard.** When the brand accent hue lands in the red
  family, solid primary and solid destructive read identical. Nudge danger, warn, or
  leave it?
- **Named-hue mutual distinguishability: the warm cluster collapses, `brown`↔`orange` worst.** The
  status roles and the `--code-*` scopes each carry an OKLab-distance *distinguishability invariant*;
  the twelve named hues do not, and dogfooding shows they need one. Measured nearest-pair OKLab
  distance across themes: `orange`/`brown` is consistently the closest, at `0.060` (default dark),
  `0.023` (default light), `0.021` (quiet), `0.019` (loud), far under the status floor (`xoji-quiet`'s
  nearest status pair sits `≈0.044`). Root cause: `brown` is *defined* as a low-chroma orange
  (`{h:50, c:0.08}` vs orange `{h:55, c:0.18}`), but the shared chroma scaling + per-stop gamut clamp
  erases that: in `loud` mode `brown` derives **more** chroma (`0.180`) than `orange` (`0.168`), an
  outright inversion, and every hue shares one lightness ladder so `brown` never goes darker to
  compensate. So a `tone="brown"` chip renders indistinguishable from `tone="orange"` (sometimes
  *brighter*), and the palette's promise of twelve distinct colors quietly fails. The fix is genuine
  palette calibration and **user-owned** (same lane as the status-hue nudge): give `brown` (and the
  other dark earth tones) a per-hue lightness offset so it reads as the dark, muted color it *is* and
  separates from `orange` by lightness; and/or add a named-hue distinguishability invariant like the
  status/code ones. Not forced: surfaced for the palette owner's call; `brown`'s exact darkness is a
  taste decision, not an engine law.
- **Soft-status (and named-hue) surface derivation: FIXED.** The soft `*-bg` degenerated
  two ways: in the light path the status tint reached *above* the page and clamped to
  white-on-white, and a named hue's `-bg` reused its swatch ramp's `subtle` chip, reading
  as a near-full-strength color rather than a faint tint. A soft surface is now defined
  uniformly across the whole roster (a wash sitting just off `--bg-0` at ~0.35× the tone's
  chroma, with `-text` re-derived to clear AA on it), so a soft `danger`/`success` shows a
  real faint hue-tint and each hue's wash keeps its own hue instead of collapsing to a
  near-gray. Residual: no formal *minimum inter-hue distinguishability* invariant on the
  tints themselves: the solids carry one (the status mutual-distinguishability guard) and
  the washes inherit those hues, but the washes aren't independently floored.
- **Status-text chroma vs the vibrancy knob: FIXED (and the extreme-mode collapse with it).**
  Two coupled fixes to status `*-text`. (1) *Vibrancy*: the readable-ink sweep seeded its
  chroma from a hardcoded constant, so `*-text` never tracked vibrancy (a loud theme
  shipped timid status text); it now seeds from the vibrancy-driven `statusChroma`
  (quiet→default→loud success-text chroma ~0.04→0.10→0.20), still bounded by the contrast
  floors. (2) *Extreme mode*: high-contrast algorithms repurposed `*-bg` as the saturated
  fill and tuned `*-text` to pure black/white *for that fill*, so any component using
  `*-text` as text on a neutral panel (Stat trend, Breadcrumb tones) got ~1:1 invisible
  text: half the tones black, half white. Extreme now keeps `*-bg` a tint and derives
  `*-text` through the same hued panel-readable sweep as every other mode; the "panel text
  clears AA" invariant no longer exempts extreme, so the gauntlet enforces it. The
  soft/solid/text triad still wants one *coherent* vividness policy (the soft-status item
  above), but text now tracks the knob and never vanishes.
- **Surface ramp minimum perceptual step: the *border* channel FIXED; the borderless bg-step residual stays open.**
  Lightness spacing is even but carries no minimum adjacent *contrast*, so when the bg anchor is
  pinned at / near a pole the ramp collapses: at pinned pure-black, `--bg-0` and `--bg-1` both land
  on black (≈1.01:1), and dogfooding showed the *border* and *shadow* channels collapse with it:
  `--line` derived to `#0e0e0e` on `#000000` (1.09:1) and the elevation shadow is black-on-black, so
  a bordered card lost every separation channel at once. The border channel is the load-bearing one
  (Card / Panel / Field all separate by `--line` + shadow, not the bg-step alone), and it was a
  genuine functional failure, not taste, so it is **fixed**: `--line` / `--line-2` / `--field-border`
  now clear a minimum contrast against their surface (1.5 / 1.8 / 1.5), pushed toward the far pole
  from the surface when the fixed step collapses, guarded by a `borders separate from their surface`
  invariant. A bordered card now reads on a pure-black page (verified in-browser). What *remains* is
  the narrower **borderless** bg-step residual: two adjacent surfaces with no border between them
  still don't separate at a pinned pole (the bg ramp itself carries no minimum-contrast floor, only
  monotonic order). Lower priority now that the bordered components are safe; the open branch is the
  same shape (guarantee a minimum adjacent bg-step contrast, with an upward lift near the floor) and
  it touches every surface on every theme, so it wants a human eye on the step size. **The concrete
  consumer, found dogfooding:** `--table--striped` rows alternate `--bg-1`/`--bg-2` with no border
  between them, so they ride the bg-step alone: measured `c(bg-1,bg-2)` = `1.036` at pinned pure-black
  vs `~1.17` in a normal dark theme, i.e. stripes that are subtle by design go nearly invisible at the
  pole. It only bites a *pinned* pole (an explicit extreme the user chose), and a fix reshapes the
  surface step on every theme, so it stays a calibration call, not a safety fix.
- **Soft vs solid status axis.** In some postures "soft" collapses to the same fill as
  "solid," making the variant a no-op. Should soft always be a distinct tinted
  treatment?
- **Light-theme chromatic-text black-collapse: FIXED.** `--link` / `--link-hover` /
  `--accent-text` formerly collapsed to pure black on light / dark-text themes (a vivid blue
  accent yielded `--link = #000000`): the shared `enforceOnPanels` leans on `sweepToward`,
  which desaturates to gray and falls back to a true pole, right for neutral text, wrong for
  brand-toned text. Per-token AA passed (black clears it), so the gauntlet never caught it.
  Fixed with a hue-preserving `enforceChromaticOnPanels` that steps lightness keeping chroma
  until it clears the floor against bg-0 and the same-side panels, deferring to the
  floor-guaranteeing path only when hue genuinely can't survive the required contrast (AAA, or
  a near-gray accent). `--neutral-text` keeps the desaturating enforcement by design.

**Safe tunables: all landed.** Measured and fixed: the `--fg-disabled` ~3:1 floor; the
`--field-border` ~1.5:1 minimum against `--field-bg`; the state-overlay alpha boost as the bg
anchor nears its scheme's extreme (near-black hover measured ~1.10:1, now ~1.17:1, matching
mid-range, while mid-range themes are untouched); and `--link`'s light-theme black-collapse.
The deeper per-algorithm **policy** items above (accent-N identity, accent↔danger, soft-status,
status-text vividness, surface minimum step, soft-vs-solid) remain; those want a human eye.

## 12. Accessibility intent as a non-color rendering contract: a new fork

The register is, today, almost entirely *values*: colors, lengths, fonts. But some intent
can't be a value. When the accessibility intent diverges from the aesthetic intent in a
load-bearing way, the algorithm needs to communicate a *rendering strategy*, not a color.

The motivating case: **Tree selection is signalled by color alone** (`--accent-bg` +
`--accent-text` on the selected row). `aria-selected` is set, so assistive tech is fine. But
for a sighted low-vision / color-deficient user this leans on WCAG 1.4.1 ("don't convey meaning
by color alone"), and no *color* the engine derives can fix it. The fix isn't a different hue;
it's a different *render*: invert the row, add a glyph, add a border (a **redundant, non-color
cue**).

The proposed mechanism, and it fits xoji cleanly: a **non-color intent token** the algorithm
sets and the component reads to change *how* it renders, e.g. `--selection-indicator: color |
invert | glyph`, or a boolean `--redundant-status-cues`. The high-contrast algorithm sets it
("selection must not be color-only"); the Tree reads it and swaps its strategy. Same shape as
`prefers-reduced-motion`: a flag a component *branches on*, not a value it interpolates.

Why it's a natural extension, not a new architecture:

- **The open register already holds non-color tokens** (lengths, fonts, durations). An
  *enum/flag* token is the same idea one step on: a token whose value is a render *mode*, not a
  measurement.
- **It's the cleanest mechanism / policy / strategy split.** Engine declares the slot and
  governs it by coverage, no opinion. Algorithm sets the value (hc → "redundant cue"), exactly
  where an algorithm's opinion belongs. Component owns *how* (Tree decides "invert" = swap
  fg/bg, "glyph" = prepend a check). The engine never dictates the render; it carries the
  intent. This arguably demonstrates the algorithm↔component contract *better* than color
  derivation, because it makes vivid that the contract is about intent, not pixels.
- **The coverage check extends with zero new machinery**: a component declares it consumes
  `--selection-indicator`; a module declares it produces it.

What it reframes: an **algorithm is a function from anchors to a rendering *contract*, not to
colors**. The contract carries both values (colors) and intents (strategies). hc proves the
engine can't stay color-only and still honor accessibility, because accessibility is sometimes a
*behavior*, not a hue. It sits one layer above the just-landed hc status-text fix (#11):
deriving a *perceivable* color is necessary but, for selection, not *sufficient*: 1.4.1 wants a
second channel.

Open sub-forks:

- **Vocabulary.** The blessed intent set: `selection-indicator`, `status-redundancy` (icon
  beside color), `focus-emphasis`, `motion`, `affordance-cues`? Where's the blessed-vs-declared
  line (mirrors #9)?
- **Typed non-color tokens: both sides now enforced.** These are enums, not scalars. The
  *emit* half: a `KEYWORD_DOMAINS` registry declares each keyword token's legal value set and the
  format invariant rejects an algorithm emitting outside it (so the gauntlet catches
  `--selection-cue: sparkle`). The *consume* half is now guarded too: `lintStyleQueryDomains`
  sweeps every component's CSS and fails the build if any `@container style(--token: value)` branch
  queries a value outside that token's domain, catching a typo or a domain rename that would
  otherwise leave a silently-dead branch (the cue just never appears). So the component side now
  has two guarantees, not one: the gated query-validity lint *and* the safe `tint` baseline (a
  component that simply doesn't branch on a value falls back to color-only, no cue). What remains
  is only the soft *completeness* axis: should a consumer be *required* to honor every value, or
  is the safe baseline a legitimate opt-out? The baseline being AA-safe argues for opt-out, so this
  is a quality nudge, not a hard gap. Ties to #9's knob-type question, and to typegen emitting union
  types from the domains.
- **Per-algorithm vs cross-cutting axis (DECIDED: cross-cutting).** Accessibility intent is a
  cross-cutting **knob**, not a property only hc sets, the non-color sibling of the existing
  `contrastBand` axis, so a brand algorithm can carry strict accessibility without abandoning its
  palette. **First slice landed as proof:** a `cues` knob (`color | redundant`) drives a
  `--selection-cue` token (`tint | marker`), high-contrast emits `marker` by default, any
  algorithm opts in via the knob, and **Tree, Tabs, and Segmented** each honor it with a non-color
  check glyph through a CSS `@container style()` query; the coverage lint now understands
  style-query consumption. What remains is growing the vocabulary (above) and carrying the cue into
  the remaining selection-bearing surfaces (status redundancy, focus emphasis).
- **Render helpers.** Should the contract ship canonical recipes (a blessed "invert" or "glyph"
  treatment) so components don't each reinvent them, or is that the component library's job?

## 13. Statusbar overflow: the containment model

Today `.xoji-statusbar` is a plain flex row (gap, a `flex:1` spacer, items `white-space: nowrap`,
no `flex-wrap` / `overflow` / `min-width:0`), so when content exceeds the width it just **spills**.
The question: what *should* it do, and where does the responsibility sit? Two layers, both needed:

- **The bar owns the overflow *strategy***, an `overflow` prop: `clip | wrap | scroll | collapse`.
  The first three are pure CSS (overflow-hidden / flex-wrap / overflow-x:auto). `collapse` is the
  flagship: low-priority cells fold into a `+N` overflow popover when space is tight (a
  `ResizeObserver` in the element; fine, it's interactive chrome, not derivation). This matches a
  real consumer need surfaced in the field (measure cell widths, collapse low-priority cells into a
  `+N` overflow).
- **Each cell owns its *sizing fallout***: `priority` (what collapses first; a pinned cell never
  drops) and `truncate` (may it ellipsis, or stay whole?). The bar can't collapse intelligently
  without cells declaring what's expendable.

This is **component-API territory, not derivation / §12**: the overflow strategy is the app's
choice for its statusbar, a `prop` + per-cell attributes, not an intent token the algorithm
derives. (Density could influence spacing; the strategy is the consumer's call.) Building it closes
the standing "responsive Statusbar" gap. **Status: DONE.** Shipped as the `overflow` prop
(`clip | wrap | scroll | collapse`); `collapse` ranks cells by per-cell `data-priority` (a
`data-required` cell never drops) via a `ResizeObserver`, folds the lowest-priority ones into a
native-Popover `+N` overflow, and a `manual-overflow` mode fires an `overflow-change` event carrying
the real light-DOM cells so a consumer can render its own popover.

## 14. Syntax-highlighting token family: derived code colors

A proposed token family (`--code-comment / -keyword / -string / -number / -function / -variable /
-type / -operator / -punctuation / -tag / -attr / -regexp`, plus `--code-bg / -fg / -line-highlight
/ -selection`) so a code editor (CodeMirror / Monaco / Prism / Shiki) themes from the **same anchors
and algorithm** as the rest of the chrome: change the accent, the highlighting re-themes
coherently, no app-vs-editor clash. A flagship "look what this derives" demo, and immediately useful
(the site's own code blocks; any editor surface that consumes xoji).

Why it's xoji-shaped: syntax colors are *a set of mutually-distinguishable hues at controlled
contrast on the editor bg*, exactly OKLCH derivation. The design:

- A **declared token family**, a canonical ~12–16 scopes, *not* every TextMate scope (adapters
  fold the long tail onto the core set), derived by the algorithm or a blessed `code` extension
  module so `@xoji/core` stays neutral.
- **The hard invariant is mutual distinguishability**: single-token contrast is already proven; a
  code palette also needs *inter-token* distance (comment ≠ keyword ≠ string at a glance), readable
  on `--code-bg`, ideally colorblind-safe. The generalization of the §11 "soft-status minimum
  inter-hue distinguishability" note; the policy lives in the code algorithm.
- **A new emitter family** for adapters: Prism / CM are pure CSS (`.token.comment { color:
  var(--code-comment) }`); Monaco needs a small theme-builder. Sits alongside `emitCss` / `emitJson`.

A real swing (token family + distinguishability invariant + emitters + a code algorithm/module),
multi-pass. **Status: DONE.** The canonical `--code-*` family derives off the accent with a
mutual-distinguishability invariant in the gauntlet (perceptual OKLab distance, not luminance-only);
`prism` and `monaco` emitters sit beside `css`/`json` (`xoji derive --format prism|monaco`); and the
`<xoji-code>` component consumes it: Prism tokenization that re-themes live, plus `copy`, `wrap`,
`line-numbers`, and `highlight` (the last finally rendering the derived `--code-line-highlight`).
Dogfooded on real blocks across the site.

## 15. Hosted-canonical derivation & the browser runtime

Every algorithm runs two ways, proven byte-identical: **baked** (the synchronous `getAlgorithm`
registry compiled into `@xoji/core`) and **hosted** (the algorithm's xript mod run through the
zero-authority sandbox via `resolveAlgorithm`). Hosted is the thesis: an algorithm is a real xript
plugin, so the sandboxed mod that ships is the one that derives. It is already the canonical path
everywhere it can be, the CLI (`derive` / `coverage`), the MCP tools, and the site's SSR all resolve
hosted. Baked persists in two deliberate roles: the **byte-identical test oracle** (the gauntlet proves
hosted against it, so retiring it would drop the guarantee), and a **synchronous fallback** for the one
surface hosted can't yet serve.

That surface is the **browser**, and two things keep baked its default today:

- **The resolver is Node-only.** `resolveAlgorithm` reads each mod's manifest and bundle off disk with
  `node:fs`, so it cannot run client-side. A browser path needs the mods *bundled for delivery* (manifest
  + `mod.js` as importable assets) plus a browser-side loader over the JS/WASM xript runtime.
- **First paint is synchronous; the mod load is async.** A reactive live-derivation surface (the
  generator, a `$derived` preview) paints before any async sandbox load could settle, so it falls back to
  baked for that frame. `snapshotAlgorithm` already reads the canonical mod synchronously *once warm*, so
  the missing half is warming it in the browser.

Sub-forks: bundle every blessed mod eagerly, or lazily per selected algorithm? Keep the gauntlet's baked
default (kept for speed, cold hosted being ~30x slower) or give it a snapshot fast-path? And is the oracle
role permanent, or does a future self-verifying mod retire even that?

**Status: essentially closed.** Hosted is canonical everywhere: the CLI / MCP / SSR resolve it, and the
browser generator flips its live derivation to the hosted mod once warm (`hosted?.get(id) ?? baked`), so
baked serves only the synchronous first-paint frame and the byte-identical test oracle. The filesystem-free
core resolver landed too: `loadAlgorithm` was already environment-neutral, so a build-time mod bundle
(`algorithms-bundle.generated.ts`) plus `resolveBundledAlgorithm` (at `@xoji/core/host/bundle`) run the
canonical mod client-side, byte-identical to baked, and the site's bench now consumes it in place of its own
`?raw` loader. What's genuinely left is small and optional: retire the sync-first-paint baked frame (a
snapshot fast-path, if it's worth the complexity) and decide whether the oracle role is permanent.
