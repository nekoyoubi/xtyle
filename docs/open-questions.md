# xtyle: open questions

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
bigger audience and the whole reason xtyle is standalone. TS-core is frictionless
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
`@xtyle/core` (with `@xtyle/core/elements`, `/markup`, `/css`, `/authoring`, `/elements/ssr`
subpaths); thin `@xtyle/svelte` and `@xtyle/astro` bindings wrap it; the algorithms live as
xript mods under `algorithms/`; the site is `apps/site`. (The early sketch's separate
`engine` / `contract` / `headless` / `preact` packages collapsed into `@xtyle/core` + the two
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
external brand-identity token system. What format does it hand xtyle, and what
does xtyle expose back?

## 7. Component catalog scope: RESOLVED (growing as designed)

The first cut landed and kept growing: ~60 components across shell, layout, forms,
navigation, feedback, content, media, and metrics, each a xript fragment whose `consumedTokens`
the coverage lint verifies. The premise held: the catalog grows freely because every
component speaks only contract verbs; no fixed scope, no engine coupling. Adding the
next component is a registration checklist, not an architecture decision.

## 8. Tauri adapter surface

The thin `-tauri` edge: theme persistence, OS dark/light detection, window-chrome
theming, live-switch IPC. Confirm the boundary so it never leaks into the core.

A working reference shape already exists in a shipping Tauri + xtyle consumer, worth
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

The boundary to confirm: this all lives in a `@xtyle/tauri` edge package, never the
environment-neutral core. The package itself is a deliberate, user-owned call.

## 9. Knob vocabulary: the next load-bearing fork

The casual author's entire world is **tier 2 (algorithm knobs)**, so the shape of
that surface is the input-side mirror of the open-register decision. Two poles:

- **Freeform**: every algorithm declares whatever bespoke knobs it wants. Max
  expressivity, but every algorithm needs a custom UI and you can't meaningfully
  swap one algorithm for another or compare them.
- **Blessed-core-plus-extension** *(current lean)*: xtyle blesses a standard intent
  vocabulary (`scheme`, `contrast-band`, `vibrancy`, `edge`, `density`, `anchors`,
  …) the generation tooling renders consistently, plus freeform extension for the
  weird stuff. Lets "swap the algorithm, keep my cyan + orange and my mid-high
  contrast" do something predictable.

Open: the exact blessed set, how an algorithm maps a blessed intent onto its
internal rules, and how composed / inherited algorithms merge or override an
ancestor's declared knobs.

**Knob types are now DECIDED (structured, algorithm-declared).** A knob is no longer a
bare name: an algorithm declares each one's *domain* as a `KnobSpec` (`kind`:
`select` | `range` | `text`, plus per-kind `min` / `max` / `step` / `options` /
`default`), carried on `Algorithm.knobSpecs` and threaded through the `manifest()`
export and the sandboxed host, so the editing surface renders a knob's control
*from* the algorithm's own declaration. The blessed scalar knobs resolve their
domains from a shared registry; a novel knob of the algorithm's own self-renders from
the spec it ships. The split the shape settled on: the algorithm owns the *domain*
(kind, range, options, the valid inputs) and a consumer owns only cosmetics (a
localized label, digit precision), so the two never re-litigate who decides a knob's
values. `color` / `list` kinds are intentionally not in the type yet (a boolean folds
onto `select`, a color onto the token-override tier); they can join if a real knob
needs one.

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
  xtyle.dev? a `<owner>/xtyle-profile` repo?) and how cross-scope / GitHub packs
  aggregate.
- **Pack manifest schema**: the exact `xtyle` field / `xtyle.json` shape that
  enumerates `{ algorithms, themes }` (names, kinds, entry points, version pins).
- **Install-time trust for CLI `add`**: npm install runs unsandboxed postinstall;
  decide whether xtyle leans on plain npm trust or adds any vetting / lockfile
  discipline. (Run-time is already safe via the xript sandbox.)

## 11. Derivation quality under real-world anchors: sub-forks

Scrutiny across five real-world themes (light corporate, warm brand, near-monochrome,
high-vibrancy, high-contrast) rendered over the full component set confirmed the
chassis holds everywhere: the `fg-0..3` text ramp and the surface *lightness* spacing
are even, monotonic, and AA/AAA in every theme. It also surfaced where the algorithm
passes its per-token AA invariant while failing the *product*: the gauntlet checks
each token in isolation, so none of these were caught. Each is per-algorithm policy,
not architecture:

- **Accent-2/3/4 identity: SETTLED — it is a knob, not a taste.** This began as "shade ladder vs
  harmonic," became an algorithm-declared taste field (`accentFan`), and has now landed where it
  belonged: **`accentStrategy` is a first-class knob** on the shared derivation, taking `fan`
  (the default: 2/3 flank the accent at ∓`accentSplit`, 4 is its 180° complement), `step` (an even
  hue-walk, each accent one `accentShiftStep` past the last, chaining a pinned wing with it),
  `shade` (2/3/4 hold the accent's hue and step its lightness — a tint up, two deeper shades down),
  or `duo` (two brand anchors: `--accent` *and* `--accent-2` are inputs, and 3/4 are their shades,
  placed against the pair's mean lightness so the two ramps read as one system). An algorithm still
  declares its own default posture via the `accentStrategy` spec field, but that is now a *default*,
  not a lock — a theme reshapes the accent family without needing a whole algorithm to do it.

  This is what retired `xtyle-brand`: a sixth blessed algorithm whose entire reason to exist was
  "the default, but with a shade ladder" is a knob wearing an algorithm's clothes. Its output is
  reachable as `accentStrategy: "shade"`, and stored themes naming it migrate onto the knob.

  What stays open is narrower: whether a near-gray accent's *hue* postures (`fan` / `step`) should
  borrow the status chroma-floor, the look call below. `shade` and `duo` sidestep it by separating on
  lightness. Confirmed dogfooding seven brand / hostile palettes: chromatic accents spread cleanly
  under every strategy, and a near-gray accent still collapses to near-identical grays under the
  *hue* strategies (hue rotation can't separate what has no chroma; see the next bullet).
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
  open is purely the **categorical taste fork for the *hue* strategies**: a pure-gray accent still fans
  `accent-2/3/4` into four byte-identical grays under `fan` / `step` (hue rotation is a no-op with no
  chroma to turn), and whether that hue fan should borrow the status chroma-floor so a muted brand's
  accents stay mutually distinguishable. The `shade` and `duo` strategies (§11 first bullet) sidestep it
  by separating on lightness instead of hue; whether a *hue* strategy should chroma-floor a near-gray fan
  is a look call, not a safety one; surface, don't force.
- **Bare `--accent` as a non-text affordance: the fill floor (1.5:1) is below the WCAG non-text floor (3:1).**
  The safety floor above guarantees a solid fill *separates* from `--bg-0` (≥1.5:1, so it can't vanish), tuned
  for `--accent` as a **fill** with `--accent-fg` on top. But dogfooding a *derived-accent* sweep (bg only, no
  accent pin) shows ~15 components consume **bare `--accent` as a non-text affordance**, not a fill: a
  focus-state `border-color` (`field` / `number-input` / `checkbox` / `radio`), an active edge (`tabs`
  bottom-border, `toc` left-border, `section` border, `dock-zone` active border/box-shadow, `swatch` ring), and
  as ink (`select` focus-chevron `color`, `spinner` `color`, `sparkline`/`segmented`/`switch` fills). WCAG 1.4.11
  wants **3:1** for those graphical/focus uses, but the token only promises 1.5:1, so on a **mid-tone** page the
  derived accent clears the fill floor yet fails 3:1: at `--bg-0: #444` the derived `--accent` (`#2389e2`) reads
  `2.67:1`; `#3a3a3a`→`3.11`, `#e8e8ea`→`2.99`, `#2e2e33`→`3.70`. So a focus ring, a select chevron, or a spinner
  is under-legible on a slate-gray theme even though the fill (with `--accent-fg`) and `--accent-vivid` (the ink,
  6–7:1 there) are both fine. The fork, and why it isn't a rush-fix: **(a)** raise the accent/bg floor to 3:1,
  but `--accent` is the *fill* and a pinned accent is honored verbatim, so forcing 3:1 distorts the brand fill on
  mid-tone pages; **(b)** re-point the non-text consumers at a contrast-tuned token, but `--accent-vivid` /
  `--accent-text` change the focus-ring/edge color system-wide on *every* theme (a look change, not a mid-tone
  one); **(c)** add a derived `--accent-edge` floored at 3:1-vs-`--bg-0` (hue/chroma of `--accent`, lightness
  nudged) for exactly the border/ring/graphical-accent role, leaving the fill and the ink tokens untouched.
  Option (c) fits the open-register + contract-tuned-variant precedent (`--accent-bg`/`--accent-text` already
  exist as "≠ fill") and confines the change to the affordances that need it, but it's a new token + a
  distinguishability invariant + re-pointing the consumers, i.e. a real algorithm pass. A per-algorithm
  `--accent`-vs-`--bg-0` ≥ 3:1 non-text invariant would guard whichever branch lands. Look-affecting and
  user-owned: surfaced with the measurements, not forced.
- **Accent↔danger collision guard.** When the brand accent hue lands in the red
  family, solid primary and solid destructive read identical. Nudge danger, warn, or
  leave it?
- **Named-hue mutual distinguishability: the warm cluster collapses, `brown`↔`orange` worst.** The
  status roles and the `--code-*` scopes each carry an OKLab-distance *distinguishability invariant*;
  the twelve named hues do not, and dogfooding shows they need one. Measured nearest-pair OKLab
  distance across themes: `orange`/`brown` is consistently the closest, at `0.060` (default dark),
  `0.023` (default light), `0.021` (quiet), `0.019` (loud), far under the status floor (`xtyle-quiet`'s
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

The proposed mechanism, and it fits xtyle cleanly: a **non-color intent token** the algorithm
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
  style-query consumption. The *selection* axis is now covered across every surface that rested on color
  alone (Tree, Tabs, Segmented, Pagination, Swatch, Carousel; see the sub-note for the reasoned holdouts);
  what remains is growing the *vocabulary* beyond selection, the status-redundancy and focus-emphasis cues
  noted above.
  - **The cue value is one; the cue *form* is the component's.** `marker` means "add a redundant
    non-color cue," and each surface renders the form its medium allows, no second token value needed.
    A *text-context* selection (a labelled row / tab / pill) draws a `✓` beside the label in the row's
    own foreground; those three are done. A surface with no legible-glyph home draws a **shape** instead
    under the same `marker` value: `Pagination`'s current page now grows a non-color underline bar (a
    bare number can't host a leading `✓` without reading as content), so it honors the cue too. This
    keeps the mechanism/policy/render split clean, the engine carries the intent, the algorithm sets it,
    the component owns *how*. `Swatch` now joins them with the shape-ring this note predicted, and stays
    additive like the rest: a picked chip keeps its accent selection ring and, under `marker`, *gains* a
    second neutral `--fg-0` outline ring around it (a `::after`, not a recolor), so a color-deficient user
    reads the selection by that added ring rather than the accent hue, on an arbitrary consumer chip color.
    `Carousel` joins the shape-cue set too: its pagination dots signalled the current slide by fill color
    alone (accent vs a muted dot at an identical size), so under `marker` the active dot elongates into a
    pill, a pure size change no color-deficient viewer can miss. With it the clean *color-only-among-peers*
    surfaces are complete: every selection-bearing surface that rested on color alone now carries a
    redundant channel, a `✓` where a label hosts one and a shape where it doesn't. The remaining candidates
    were weighed and left by design, not oversight: `toc`'s active section and `dock-zone`'s active tab
    already pair the accent with a non-color cue (a medium-weight label, a raised and underlined surface),
    so neither rests on color alone; a `button`'s `aria-selected` / `aria-pressed` tint does, but a marker
    there lands on every variant and size at once (a per-variant design call, not the isolated additive the
    others were), so it waits for a deliberate pass rather than riding this thread. The genuinely
    un-styleable holdouts remain: a native `Select`'s option list is browser chrome, and a
    `Menu` carries actions, not a persistent checked state.
- **Render helpers.** Should the contract ship canonical recipes (a blessed "invert" or "glyph"
  treatment) so components don't each reinvent them, or is that the component library's job?

## 13. Statusbar overflow: the containment model

Today `.xtyle-statusbar` is a plain flex row (gap, a `flex:1` spacer, items `white-space: nowrap`,
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
(the site's own code blocks; any editor surface that consumes xtyle).

Why it's xtyle-shaped: syntax colors are *a set of mutually-distinguishable hues at controlled
contrast on the editor bg*, exactly OKLCH derivation. The design:

- A **declared token family**, a canonical ~12–16 scopes, *not* every TextMate scope (adapters
  fold the long tail onto the core set), derived by the algorithm or a blessed `code` extension
  module so `@xtyle/core` stays neutral.
- **The hard invariant is mutual distinguishability**: single-token contrast is already proven; a
  code palette also needs *inter-token* distance (comment ≠ keyword ≠ string at a glance), readable
  on `--code-bg`, ideally colorblind-safe. The generalization of the §11 "soft-status minimum
  inter-hue distinguishability" note; the policy lives in the code algorithm.
- **A new emitter family** for adapters: Prism / CM are pure CSS (`.token.comment { color:
  var(--code-comment) }`); Monaco needs a small theme-builder. Sits alongside `emitCss` / `emitJson`.

A real swing (token family + distinguishability invariant + emitters + a code algorithm/module),
multi-pass. **Status: DONE.** The canonical `--code-*` family derives off the accent with a
mutual-distinguishability invariant in the gauntlet (perceptual OKLab distance, not luminance-only);
`prism` and `monaco` emitters sit beside `css`/`json` (`xtyle derive --format prism|monaco`); and the
`<xtyle-code>` component consumes it: Prism tokenization that re-themes live, plus `copy`, `wrap`,
`line-numbers`, and `highlight` (the last finally rendering the derived `--code-line-highlight`).
Dogfooded on real blocks across the site.

## 15. Hosted-canonical derivation & the browser runtime

Every algorithm runs two ways, proven byte-identical: **baked** (the synchronous `getAlgorithm`
registry compiled into `@xtyle/core`) and **hosted** (the algorithm's xript mod run through the
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
(`algorithms-bundle.generated.ts`) plus `resolveBundledAlgorithm` (at `@xtyle/core/host/bundle`) run the
canonical mod client-side, byte-identical to baked, and the site's bench now consumes it in place of its own
`?raw` loader. The **snapshot fast-path** for the imperative surfaces landed too: `hostedAlgorithm(id)` (on
`@xtyle/core/algorithms`) returns the resolved hosted mod once warm and bridges the cold first call on the
byte-identical baked oracle while it kicks off the resolve, so a synchronous non-reactive caller is canonical
from the next call on with no await. The site's imperative theme derivation (applying a saved theme,
rendering theme thumbnails) now derives through it instead of `getAlgorithm`. Baked is thus down to two
frames: the *reactive* live-preview's synchronous first paint (where a reactive resolved-map is the right
shape, not a plain accessor) and the byte-identical test oracle. What's genuinely left is small and optional:
retire even the reactive first-paint frame, and decide whether the oracle role is permanent.

## 16. Link hover feedback: weak by default, absent for low-chroma accents

Dogfooding real palettes surfaced this. `--link-hover` derives as the accent shifted ±0.08 in lightness,
then run through the same panel-contrast enforcement as `--link`. Two problems fall out:

- **The delta is near-imperceptible even on the flagship.** `xtyle-default` emits `--link` `#40a0fa` and
  `--link-hover` `#42a3fd`: a lightness step so small the hover reads as no change. The default `<xtyle-link>`
  is underlined at rest and changes *only* its color on hover, so that near-zero color delta is the entire
  hover affordance.
- **For a low-chroma accent it collapsed to nothing (FIXED).** A near-gray accent (say `#808080`) has no hue to
  keep the base and the shifted version apart once the panel-contrast enforcement pulls both to the same readable
  lightness, so `--link-hover` came out byte-identical to `--link` and the link's hover was a literal no-op.

**The collapse is resolved (the derivation branch).** When the resolved `--link` and `--link-hover` emit an
identical value, the factory now steps the resolved link toward the contrast pole and re-runs
`enforceChromaticOnPanels` on it. Re-enforcing measures contrast at each step, so the result always lands on the
readable side of the floor, sidestepping the trap that broke a first attempt: a naive raw lightness step off the
resolved link **breaks the `links clear AA on bg-0` gauntlet invariant** for high-chroma accents on extreme
backgrounds, because gamut-clamping a darkened saturated color can *raise* its luminance back below the floor.
The step is gated on the emitted values being identical, so chromatic accents are byte-identical to before and
only the degenerate collapse changes (`#808080` now emits `--link` `#9b9b9b` / `--link-hover` `#bababa`, a clear
step; the whole gauntlet stays green).

**The comprehensive guard is now RESOLVED, and it needed no pole exception.** The earlier attempt at a
`link hover distinct from link` invariant failed the full `XTYLE_GAUNTLET_DEPTH=full` battery on chromatic accents
enforced to a lightness extreme (a light pink `#ffcfe1` at L≈0.88, a light yellow `#fefea4` at L≈0.96, a near-black
`#020100`), where a single fixed toward-the-pole step is *erased by gamut clamping* (both lightnesses clamp to one
displayable hex). The fix replaced that one step with a search that forces a distinct emitted value, re-enforcing
each candidate so it always lands readable: grow the lightness step toward the readable pole (the natural hover
feel, and what non-degenerate collapses take on the first iteration); if the pole clamps every step to one hex,
nudge the *other* way, where an accent already over-contrasted at an extreme has headroom; and if lightness is
pinned at a pole for that hue, drop chroma so the emitted value shifts. That separates every case where a distinct
*readable* neighbor exists (dogfood-verified: `#ffcfe1`→`#fff6f9`, `#fefea4`→`#ffffff`, `#020100`→`#98938a`/
`#99948b`, pure `#000000`/`#ffffff` as an accent).

The invariant landed **with exactly the genuine-pole exception the carryover predicted**, and no wider. The full
battery surfaced the residual: a mid-gray page (`bg`/`accent` both near `#808080`) whose same-side panels sit too
close to it makes the panel-contrast floor *unachievable*, so `--link` falls through `enforceChromaticOnPanels` to
the `enforceOnPanels` fallback, which desaturates to a true pole (`#000000` / `#ffffff`). At a pure pole there is
only one direction (toward mid) and every step there drops below the floor, so no distinct readable hover exists
and the collapse is genuinely unavoidable, readability over hover delta. The invariant therefore treats a
pure-pole `--link` collapse as acceptable and fails only an *avoidable* one. Green under the full
`XTYLE_GAUNTLET_DEPTH=full` battery. (The deeper cause, a mid-gray surface ramp whose panels can't clear a text
floor, is the §11 surface-minimum-step territory, not a link concern.)

**Still open (the taste call).** The delta stays near-imperceptible even after the collapse fix: that
`#40a0fa` → `#42a3fd` step on the flagship reads as no change, and since the default `<xtyle-link>` rides its
entire hover on that color delta, the affordance is effectively invisible. Strengthening it is a design decision,
not a bug fix, and it can go two ways: widen the derived link/link-hover delta across all themes, or give
`<xtyle-link>` a non-color hover affordance the way the `muted` variant already does (thicken the underline, or a
faint tint) so hover never rides on color alone. Both reshape the flagship's link feel site-wide, so they wait on
a design eye and your taste.
