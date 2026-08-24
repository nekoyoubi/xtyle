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
contrast-safe pairs → ~300 tokens, once per theme load/switch), so perf is a
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

## 4. Spacing scale shape: RESOLVED

Both halves went the way the question's first option pointed, and the code has been shipping the
answer for long enough that leaving this open was the record lagging rather than a live fork.

**Numeric, and shorter than proposed.** The scale is `--space-0` through `--space-8`, nine steps,
linear at a quarter-rem stride (`0 · 0.25 · 0.5 · 0.75 · 1 · 1.25 · 1.5 · 1.75 · 2` rem at
`normal`). Not named (`xs..xl`), and not the `1..16` the question sketched — nine steps covers the
component set with every step used, and a step nobody reaches for is a token the theme still has to
carry. Components address it by index (`gap` on `Stack` / `Cluster` / `Grid` takes `0–8`), which is
what makes the numeric form worth its terseness: a named scale would need a mapping table at every
call site.

**Density is a multiplier, not an override.** The `density` knob (`compact` / `normal` /
`comfortable`, default `normal`) scales the whole ramp uniformly rather than substituting a second
set of values:

| step | compact | normal | comfortable |
|---|---|---|---|
| `--space-1` | 0.2rem | 0.25rem | 0.3125rem |
| `--space-4` | 0.8rem | 1rem | 1.25rem |
| `--space-8` | 1.6rem | 2rem | 2.5rem |

0.8x and 1.25x off `normal`, exactly. The consequence worth naming: **a component that reads
`--space-N` gets density for free and can never disagree with it**, because there is no second
scale to fall out of sync with. An override model would have let one surface ship a compact ramp
while its neighbour stayed normal, which is the failure a derived token set exists to prevent.

The multiplier is the *algorithm's* policy, not an engine law — a pack is free to derive a
non-uniform ramp, or to ignore density entirely.

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

The first cut landed and kept growing: ~91 components across shell, layout, form,
navigation, feedback, content, control, media, metrics, and overlay, each a xript fragment whose `consumedTokens`
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
`select` | `range` | `text` | `composite`, plus per-kind `min` / `max` / `step` /
`options` / `default`), carried on `Algorithm.knobSpecs` and threaded through the
`manifest()` export and the sandboxed host, so the editing surface renders a knob's
control *from* the algorithm's own declaration. The blessed scalar knobs resolve their
domains from a shared registry; a knob only one algorithm reads lives in *that
algorithm's* `knobSpecs` and self-renders from the spec it ships (`hour` is nxi-nite's,
and a shared registry holding it would be the same name-keyed table `knobSpecs` exists
to delete). `composite` marks a group the consumer expands into several controls
(`anchors`, `fonts`) — declared rather than name-matched, so a consumer tells a
composite from a scalar without a hardcoded list. A `default` may be qualified by
`defaultByScheme`: `surfaceRamp` is signed, so one static number necessarily seeds the
wrong sign on half of all themes, and the scheme it keys off is the one the register
*derived* under, not the `scheme` knob.

The split the shape settled on: the algorithm owns the *domain* (kind, range, options,
the valid inputs) and a consumer owns only cosmetics (a localized label, digit
precision), so the two never re-litigate who decides a knob's values. The domain is
also *enforced*, not merely rendered: every headless door (CLI `--knob`, the MCP tools)
checks a value against the declared domain and coerces by the declared `kind`, because
the derivation itself falls back silently on an unrecognized value — correct for a
derivation that must always produce a theme, fatal for an input surface where it turns
a typo into a quietly different design. `color` / `list` kinds are intentionally not in
the type yet (a boolean folds onto `select`, a color onto the token-override tier);
they can join if a real knob needs one.

## 10. Discovery & resolution: MOSTLY RESOLVED (the CLI is real)

The shape was always settled (`repo-layout.md` → "Discovery & resolution"). The
sub-forks below said "settle once the CLI is real", and `xtyle search` / `xtyle add` /
`xtyle packs` are now built, so they are settled by what shipped rather than by
argument:

- **Reference grammar** — RESOLVED. `@scope/pkg` and a bare name are npm,
  `owner/repo` is GitHub, `./path` and `/path` and `C:\path` are paths, a `scheme://`
  or `file:` is a tarball URL, and bare `@handle` is an author. `@version` pins
  (a committish, for GitHub). The selector char is `#name`, uniformly across every
  shape. A GitHub committish therefore goes in the version position
  (`owner/repo@main`), translated back to npm's own `owner/repo#main` at the install
  boundary: `#` means exactly one thing on a xtyle reference, which is the property
  that makes a selector portable across npm / GitHub / tarball.
- **`@handle` vs `@scope/pkg`** — RESOLVED, no edge case bit. The slash is the whole
  test, and it is unambiguous because npm forbids a bare `@scope` as a package name.
  A version on an author (`@handle@1.0.0`) is refused rather than guessed at.
- **Index source** — RESOLVED as npm-derived, and the profile manifest is not built.
  `keywords:xtyle-pack` scopes every query; `@handle` becomes `maintainer:`, `@scope/`
  becomes `scope:`. A profile manifest only earns its keep for an author spanning
  scopes *or* distributing off-npm, which is a real case and a later one — it is an
  addition to this, not a fork in it.
- **Pack manifest schema** — RESOLVED. `{ algorithms: [{ name, entry, description? }],
  themes: [...] }`, in the `xtyle` field of `package.json` or a standalone `xtyle.json`
  (the file wins when both exist). Two departures from the sketch: an entry carries no
  `kind`, because the list it sits in already says so and a second spelling could only
  ever disagree with the first; and no version pin, because the pack *is* an npm
  package and its own version is the pin.
- **Install-time trust** — RESOLVED as plain npm trust, said out loud. `add` prints
  that install scripts are not sandboxed and that the sandbox covers the moment an
  algorithm *runs*, which is a different moment. No vetting layer, no second lockfile:
  a bespoke trust story would imply a guarantee xtyle cannot make.

Still open, and genuinely:

- **What `#name` restricts.** It selects for *verification and reporting* at install
  time and for *resolution* when one entry is being named — it does not hide the pack's
  other entries afterwards. Making it do so would need xtyle to keep an exclusion list
  per project, which is state that rots the moment the pack updates. Revisit only if a
  real pack ships enough unwanted entries for the clutter to bite.
- **The author profile manifest**, per the index note above.
- **Browser-side resolution.** `searchPacks` is neutral and the site can query the same
  index today, but fetching a *pack* from a CDN into the in-browser host (so the
  generator can derive with any published algorithm) is not built.

## 11. Derivation quality under real-world anchors: sub-forks

Scrutiny across five real-world themes (light corporate, warm brand, near-monochrome,
high-vibrancy, high-contrast) rendered over the full component set confirmed the
chassis holds everywhere: the `fg-0..3` text ramp and the surface *lightness* spacing
are even, monotonic, and AA/AAA in every theme.

**That holds for *anchors*, not for *pins*, and the difference is now measured.** Every one of those
five themes supplied `--bg-0` / `--accent` and let the ramp derive. Pin `--fg-0` itself — which no
gauntlet run does, since `CONSTRAINT_TARGETS` draws from five other tokens — and the ramp walks the
anchor toward the contrast floor with no headroom left to walk into, so `--fg-1/2/3` all land back on
it. Four text levels, one colour, on all five algorithms; `nxi-nite` inverts instead, pushing the
lower steps past the anchor to a pole. Every contrast pair still passes, because each step is as
legible as the anchor: the theme is safe and its hierarchy has stopped existing. The audit's
`rampSeparation` reports it (distance per adjacent step, plus `reversed` for a step that jumps the
wrong way). **Whether anything should gate is DECIDED: it does not.** Separation stays a report across the
board — `roleSeparation`, `fillSurface` and `rampSeparation` are measured, published, and ignored by
`passes`, deliberately and not as a stopgap. Measuring is cheap and safe; gating spends someone's shipped
theme, and the `--danger` boundary grade already proved a damning number can describe a control that
renders correctly. **And when a pin makes the hierarchy impossible, `derive()` collapses quietly**, which
is today's behaviour: it stays honest about contrast and silent about hierarchy rather than breaking the
floor or overriding the author's pin. Do not re-open either as though it were pending.
**A pinned *surface* over-constrains the same way, and reaches further.** Pin `--bg-1` across the
light/dark line from the page (`#8a8a8a` on a near-black `--bg-0`, or `#222222` on a near-white one) and
the surface ladder re-threads correctly — `--bg-2` follows the pin — while every ink collapses onto one
value and fails on the surface that moved: `--fg-1 on --bg-1` at 2.63, `--neutral-text` at 1.14, twelve
failing pairs. It is unsatisfiable rather than mis-derived: each ink is *one* token contracted to read on
the page base and both panel steps, so surfaces that straddle leave it no value. The audit reports
`surfacePolarity` so the twelve read as one cause rather than twelve, and stays silent whenever the
surfaces sit on one side. It also surfaced where the algorithm
passes its per-token AA invariant while failing the *product*: the gauntlet checks
each token in isolation, so none of these were caught. Each is per-algorithm policy,
not architecture:

- **Accent-2/3/4 identity: SETTLED — it is a knob, not a taste.** This began as "shade ladder vs
  harmonic," became an algorithm-declared taste field (`accentFan`), and has now landed where it
  belonged: **`accentStrategy` is a first-class knob** on the shared derivation, taking `fan`
  (the default: 2/3 flank the accent at ∓`accentSplit`, and 4 takes the widest gap the three leave,
  which with symmetric flanks is the accent's 180° complement and with a pinned flank is wherever the
  pin left room), `step` (an even
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
  so only the degenerate near-coincident cases move; a pinned fill is honored verbatim.

  **The hue-strategy chroma fork this bullet used to leave open is CLOSED, and the claim it rested on was
  stale.** `FAN_MIN_CHROMA` (0.045) floors the *fan base* for every strategy, so a pure-gray accent does
  not fan into four identical grays: measured, `#808080` yields wings at chroma 0.045 across hues 316 / 45
  / 180 under `fan` and 88 / 180 / 270 under `step`, all four distinct, with `--accent` itself honored
  verbatim at chroma 0. Anyone re-reading the old wording would have gone looking for a floor that was
  already there.

  What the floor did *not* cover is the rails, and writing the invariant the fork kept circling — "the
  accent family stays mutually distinguishable", pairwise, failing when ΔL and ΔC are both tiny and the
  chroma-weighted hue arc is too — turned up three real collapses the per-token gauntlet never saw:

  - **`shade` near a lightness rail: FIXED.** A dark accent (L 22) stepped down twice, both rungs clamped
    to the floor, and 3/4 emitted one hex digit apart. The ladder now walks away from the nearer rail and
    keeps its tint-up-two-down posture whenever both sides have room.
  - **`fan` / `step` at the top of the ramp: FIXED.** The chroma floor was applied at a lightness the gamut
    will not honor, so a near-white accent fanned into four near-identical near-whites — the floor was
    real and simply unspendable there. The hue strategies now fan from a base moved off the rail far
    enough to hold it; `shade` and `duo` separate on lightness and keep the accent's own.
  - **`duo` with an achromatic second brand: FIXED.** Two brands separate their shades by hue alone, and
    a gray brand has none to give — pinning `--accent-2` to `#878787` put both shades on the floored
    chroma at hue 0 and the same lightness, emitting them byte-identically. They step apart on lightness
    now when the hue arc cannot carry them, and stay on one lightness when it can.

  **The invariant is now in the gauntlet**, and all five algorithms pass it at full depth. It is what
  makes this bullet checkable rather than a taste claim: every one of the three collapses passed each
  per-token check while two members read as one colour.

  One thing the hunt cost two passes and is worth not repeating: a gauntlet failure used to report its
  `seeds` and `knobs` but not the extra tokens the run pinned — a headroom target, a mid-lightness
  background, `duo`'s second brand. The duo case is *only* reachable with that pin, so the record could
  not reproduce its own failure and the case looked fixed every time it was checked by hand. Failures
  now carry their full `constraints`.

  Worth carrying into that work: `--accent-2`/`-3` have exactly one consumer in the component library
  (`dock-zone`'s drop indicators) and `--accent-4` has none. The family is a *theme* surface apps paint
  with, not library chrome — so "does the fan look good" is answered on a palette or an app, never from
  the component gallery.
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
- **Accent↔status collision guard: DECIDED and SHIPPED for `danger`.** The call was made: a status role
  re-derives away from the accent when the two collide. `danger` is held `STATUS_ACCENT_MIN_HUE_SEPARATION`
  (30 degrees) off a chromatic accent, measured rather than chosen: an accent walked through `--danger`
  reads as one color across roughly a 40 degree arc and is comfortably distinct by 45.
  **It changes nothing at any default anchor** because no blessed algorithm ships a red accent, so it
  bites only the case it exists for. A pin on the role still wins outright.
  Which way it moves is a property of the role rather than of the accent: it retreats from its own
  nearest neighbouring status hue, so `danger` backs away from `--warn` into the pinks. That direction
  is load-bearing. Keying it off which side the accent sits on puts a discontinuity in the middle of the
  collision zone, where an accent nudged five degrees swings `danger` sixty degrees around the wheel.
  Pushing the other way is worse than magenta: it lands `danger` within ten degrees of `--warn`, which
  breaks the mutual-distinguishability invariant that is a hard promise, to protect hue semantics that
  are not.
  **`--info` is deliberately NOT guarded**, and the measurement is why. It reads as blue by definition
  and the blessed accents are blues, so guarding it rotates every shipped `--info` about thirty degrees
  into violet (`#8b8fff` on `hc`, `#736eff` on `loud`) on four of the five algorithms at their default
  anchors. That trades a role that cannot be told from the accent for a role that is no longer the color
  its name promises, and it is a separate call from the one that was made. `ACCENT_COLLISION_GUARDED` is
  the one-line switch if it is ever wanted.
  **The third option — break the collision on lightness rather than hue — is measured and dominated.**
  It was the honest alternative: keep `--info` blue, move it in L until it separates. At the 0.02 floor
  it takes ΔL 0.02 and produces `#0083e0` against a `#0089ea` accent, which clears the metric and reads
  as the same colour, so it satisfies the number and not the eye. Pushed to the 0.0864 the hue guard
  achieves, it breaks two other floors: `--info-fg` falls to **4.1** on `loud` and **4.0** on `quiet`
  (under AA), and the fill against `--bg-0` falls to **2.7** and **2.6** (under the 3:1 boundary). So
  the axis that keeps the name costs the contract, and there is no ΔL that buys real separation cheaply.
  The choice is hue-rotation or nothing.
  **And the collision is dark-only**, which the numbers above do not say because they were all taken at
  default knobs. In `light` all five algorithms already separate (0.0755–0.3006), so guarding `--info`
  would rotate a scheme that has no collision to fix. A guard keyed on measured distance rather than on
  hue proximity would not — that is a real difference between the guard as built and the guard as
  described, and it is unexplored.
  **Where the pushed role lands is worth watching, and is currently fine.** Guarding costs `--danger`
  distance from the *named* hue it moves toward: against a crimson brand it derives at hue 46 and sits
  **0.0599** from `--orange`, against 0.1255 under a blue brand. That clears comfortably and renders as
  two colours, but it halves the margin, and nothing checks a status role against a named hue in either
  direction. A larger threshold, or a brand sitting further into the reds, is the shape that would crowd
  them. The `crimson` visual project renders the guarded path, since every blessed algorithm anchors on
  a blue and nothing else in the suite turns the guard on at all.
  The measurements that prompted it are kept below.
- **The original finding — not hypothetical, nor only `danger`.** When the brand
  accent lands on a status role's hue, solid primary and that solid status read identical. Measured on
  the shipped defaults, with no accent supplied at all: `xtyle-loud` emits `--accent` and `--info` as
  the *same hex* (`#0089ea`), `xtyle-hc` likewise (`#339fff`), `xtyle-quiet` at ΔE 0.0051 and
  `nxi-nite` at 0.0097 (`#2389e2` vs `#2d8add`) — so a primary control and an info badge paint one
  color out of the box on **four** of the five algorithms. `xtyle-default` is the only one clear
  (worst pair 0.1069, `--success` vs `--warn`). The blessed "status roles mutually distinguishable"
  invariant deliberately excludes `--accent`, which is why nothing catches this; the audit deliberately
  *includes* it (`xtyle audit` reports the pair), so the "warn" branch is already built and reporting.
  What is left is the taste call the original bullet named: nudge the colliding status role, nudge the
  accent, or leave it and treat the audit as the answer. Leaving it is defensible — `--info` is defined
  as blue and a blue brand legitimately coincides — which is exactly why it wants your call and not the
  engine's.
  **The report now says which axis a distance lives on**, because the floor is a single number and the
  same number means different things depending on where it comes from. `roleSeparation[]` carries
  `axes` (the lightness / chroma / hue steps, which recombine in quadrature to exactly the distance)
  and `dominant`, and the summary line names it: `closest 0 --accent vs --info by hue, 0°`. This is
  what makes the collision legible rather than one more close pair — and it is also what shows the
  floor is not a perceptual constant. A crimson brand accent scores **0.0342** against `--danger`,
  clearing the 0.02 floor by 70% while rendering as the same button, because 73% of that distance is an
  8.5° hue rotation and the hue term scales with the chroma it happens at; the `orange`/`brown`
  collapse that genuinely needed fixing scored **0.0193**, and two plainly-distinct grays score 0.0199.
  No floor *value* fixes that ordering, which is the part the separation call has to answer.
- **Named-hue mutual distinguishability: DECIDED, and it resolves to no gate.** `xtyle-quiet` **declines**
  the promise: a muted palette converging at `vibrancy: 0` is quiet working as asked, not quiet broken, so
  no invariant asserts a promise it never made. The hue-separation gate therefore does not ship on any
  algorithm, and `xtyle audit --hues` stays the only thing watching, which is the intended end state
  rather than a gap. **`brown`'s `-0.1` stays** as shipped, and the remaining dark earth tones are the
  palette owner's to calibrate; the loop does not extend the prescription. The history below is kept as
  the diagnosis of why the hues crowd.
- **How it got here: the lightness offset was IMPLEMENTED, and the taste call it
  was reserved for is still open.** A loop pass took the per-hue lightness offset this bullet marks as
  yours and shipped it (`brown` at `l: -0.1` on the ladder), so the code no longer matches the "not
  forced" framing below. What it bought, measured across all five algorithms on dark and light anchors:
  `orange`/`brown` separation moved from **0.0193** to **0.102–0.120**, every contrast pair held (worst
  ratio unchanged at 4.67, zero failures), and the gauntlet stayed 150/150. `brown` reads as a brown
  again rather than a second orange (`#ea6e00` → `#bd5700` on `hc`/`loud`; `#883d00` on white).
  **What is still yours is the number.** `-0.1` was picked to clear the floor with margin, not chosen as
  a design value, and this bullet's own point stands: brown's exact darkness is a taste decision. Retune
  it or revert it — the change is one commit and touches only `PALETTE_HUES` plus the ladder that reads
  the new optional `l`. **The invariant's blocker also changed shape**: with the offset in, the hard
  named-hue invariant goes green on `default` / `nxi-nite` / `hc` / `loud` at 150/150 and red only on
  `quiet`, 23 runs of 150, every one at `vibrancy: 0` where the muted taste converges by request. So it
  is no longer "red on today's palette" but "asserts a promise `quiet` may not make," which is a
  different and smaller question. It stayed unshipped for that reason.
  The measured history below is left as the diagnosis of *why* they crowd.
  Re-measured before the offset landed: `brown` no longer derives more chroma than `orange` in any
  algorithm (`loud` now 0.159 vs 0.175, `quiet` 0.036 vs 0.079, `default` 0.082 vs 0.175), so the
  outright inversion the rest of this bullet diagnosed has since been fixed elsewhere and is not the
  live problem. Default-dark improved to 0.0928 with `red`/`orange` the nearest pair, not
  `orange`/`brown`. What remains is `loud`, where `orange`/`brown` sits at 0.0221 on the shipped
  anchors and the gauntlet's randomized inputs drive it to **0.0139** — under the 0.02 the engine's own
  status guard uses. `xtyle audit --hues` now reports the whole 36-pair matrix against that floor, so
  the palette owner can see it without running a battery. A hard invariant was written and **not
  shipped**: it goes red on today's palette, and the only fix that greens it is the per-hue lightness
  offset below, which is yours. The rest of this bullet stands as the diagnosis of *why* they crowd.
  The
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
  status/code ones. That prescription is what a pass went and implemented for `brown`, ahead of the call
  it was waiting on — see the head of this bullet. **The other dark earth tones are untouched**, and
  whether they want the same treatment is still open, as is the invariant.
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
- **Soft vs solid status axis: the *collapse* is FIXED; the *tinted-treatment* taste fork stays open.**
  The tint takes the surface's lightness and the accent's chroma, so a mid-gray page under a near-gray
  accent put the page, the fill and the tint on one lightness with nothing left to tell them apart:
  measured `--accent` `#7a7d80` against `--accent-bg` `#7d7e7f` at ΔOKLCH 0.0059, under the 0.02 the
  engine already treats as one color, so `variant="soft"` painted exactly what `variant="solid"` paints.
  `--accent-bg` now steps off `--accent` when the two read as one, re-running the ink's contrast lift on
  every candidate so separation is never bought by making the tint unreadable, and returning the tint
  untouched when a pole leaves nowhere to go. Gated on the collapse, so a theme whose tint already read
  apart is byte-identical (the flagship dark holds at 0.4998). Guarded by `a soft fill reads apart from
  its solid`. What remains is the taste question: should soft always be a *distinctly tinted* treatment
  rather than merely a separate one? That reshapes every soft variant on every theme, so it wants an eye.
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

**The collapse guard was testing identity, not perceptibility — half fixed, half still open.**
The derivation's collapse trigger compared the emitted strings for *equality*, so `xtyle-hc` on a light page
shipped `--link` `#0542c9` against `--link-hover` `#0442c9` — one unit apart in one channel — and the check
called them distinct. The trigger and its candidate-acceptance test now compare perceptual distance against
`LINK_HOVER_MIN_DELTA`, set at the perceptibility floor rather than at a designed hover strength (how bold the
affordance should be is the taste call below). `hc` moves `#0542c9` → `#002b92`, 0.0003 → 0.108, and every other
algorithm/anchor pair is byte-identical to before because they were already clearing it.

**The bigger effect was on the search, not the trigger.** Accepting the first *non-identical* candidate stopped
the walk at whatever barely-different colour came up first, which is why cases well away from a pole still
emitted near-collapses: `xtyle-default` on `#0b0d12` shipped `#3f7cff` / `#437fff` (0.0087) and a `#020100`
accent shipped 0.0014. Holding candidates to the floor lets the search keep walking to a genuinely distinct one —
those two now emit 0.117 and 0.101. This revises the section's own history: the `#020100` → `#98938a` /
`#99948b` pair recorded above as resolved was itself 0.0014 apart, distinct only under the identity test it was
written against.

A near-miss candidate is now also kept as a fallback rather than discarded. Rejecting it outright made the search
fall through to the *original* hover, which the full battery caught emitting `--link` and `--link-hover` both
`#fcfcfc` on `xtyle-hc` at a near-pole seed — strictly worse than the near-miss it replaced.

**The invariant now grades the same way, and the pole exception moved from two hexes to a reach.** Tightening it
first failed the full battery on `xtyle-hc` with a pure-black accent over a near-black page: the exception named
`#000000` and `#ffffff` exactly, and the panel-contrast fallback desaturates *toward* a pole without always
landing on one, so a `--link` at `#fcfcfc` is the same dead end and was not covered. `POLE_REACH` keys the
exception on how close the lightness actually sits, which is what the situation is about — a link at an extreme
has one direction left to move and no readable room in it, so that collapse is unavoidable rather than wrong.
Green at `XTYLE_GAUNTLET_DEPTH=full`, which is the depth that draws the pole seeds at all.

Note the flagship figures in the paragraph above are historical: `xtyle-default` at its own anchors now emits
`#3ad6f8` → `#99eaff`, not the `#40a0fa` → `#42a3fd` this section was written against.

**Still open (the taste call).** How *strong* the affordance should be is still a design decision rather than a
bug: the floor above only guarantees the hover is visible at all, not that it reads boldly. It can go two ways: widen the derived link/link-hover delta across all themes, or give
`<xtyle-link>` a non-color hover affordance the way the `muted` variant already does (thicken the underline, or a
faint tint) so hover never rides on color alone. Both reshape the flagship's link feel site-wide, so they wait on
a design eye and your taste.

## 17. An algorithm stating its own light anchor: RESOLVED

`PresetAnchors` is one pair — `{ bg, fg }` — and `DEFAULT_ANCHORS` is dark (`#25272e` / `#e2e0e0`). The `scheme`
knob flips the *derivation*, not the anchor, so `derive(algo, { knobs: { scheme: "light" } })` reads a dark anchor
under a light scheme and lands on a mid-gray page (`--bg-0: #9da0a9`, `--bg-2: #91949d`) rather than a light one.
Nothing is broken in the ladder: the inks are readable and the invariants hold. It is simply not a theme anyone
would ship, and it is what every blessed algorithm produces if you ask for its light half without seeding one.

**Why it matters more than it looks.** `invertedOptions` inverts *seeds*, deliberately, so inverting an unseeded
invocation is a no-op on the anchor and lands in the same gray. So there is no expression, anywhere, for "the light
counterpart of this algorithm at its own defaults" — you can only get a light theme by supplying a light surface
yourself. That also makes the mid-gray a trap for tooling: an audit that grades it reports every solid fill under
the boundary grade, which reads as a catastrophic finding and is an artifact of the input. `xtyle audit` now
declines to grade a counterpart it would have to invent, and says so, but that is the tool refusing a bad question
rather than the gap closing.

**The knob layer already solved the shape.** `KnobSpec` carries `defaultByScheme`, which is exactly how
`surfaceRamp` flips its sign between dark and light. Anchors have no equivalent. The obvious symmetry is
`anchors: { bg, fg, accent?, byScheme?: { light: { bg, fg } } }` or a second anchor pair keyed by scheme, and it is
mechanism the engine offers with the values staying the algorithm's own taste — the same split the declared
focus-ring floor uses.

**Settled: optional, with a stated fallback.** `anchorsByScheme` is the symmetry the knob layer already had:
`anchors: { … }` names the pair an algorithm starts from, `anchorsByScheme: { light: { bg, fg, accent? } }` names the
half its default pair does not describe, and the values stay the algorithm's own taste. Optional matches every
neighboring decision (`KnobSpec.defaultByScheme`, the declared focus-ring floor, `adds`): absent, the flip still
happens and the gray is still reachable, which keeps a single-posture algorithm cheap to write.

The algorithms themselves refuse the reading that one is inherently single-scheme, with a light theme always a
*theme's* choice of seed. Every one of them declares `scheme` as a knob, which is a claim to have two halves;
until now none could say what the second one was.

**A caller's seed still wins.** The stated pair is a *default*, not a pin, so `derive(algo, { constraints: { "--bg-0":
… } })` is byte-identical to before. Measured across the blessed set: bare and dark-seeded output are unchanged,
light-seeded picks up the stated half's taste, and the path that used to be gray is the one that moves most.

**All five now answer for both halves.** `xtyle-hc` already did, because flipping pure black lands on pure white; it
states the pair anyway so the intent survives a change to its dark anchor. The other four went from `#9da0a9` to a
real page. `xtyle-default` also states a light-tuned accent, which answers question 18 from its third reading: the
preset cyan sits at 1.42 on a light page and the light-half accent at **2.88**, inside the 2.79–3.55 band the rest
of the blessed set occupies.

**Downstream, now closed:** `xtyle audit` grades the counterpart whenever the algorithm declares one. The refusal
was about a mid-gray the audit would have had to invent; a stated algorithm hands it a real theme instead.
`declares.schemes` carries which halves an algorithm answers for, through the facade and the packaged mod manifest,
so a third party that states one half still gets the refusal rather than a grade on a page it does not ship.

Grading both halves found something on its first run: **every** blessed algorithm's light half puts `--accent`
under the `fill/surface` floor against `--bg-2` (2.38–2.81 against 3), while three of the five have a clean dark
half. That is question 18's closing paragraph (`pageFloor` floors against `--bg-0` alone) arriving
from the direction it named, and the failure is sharper in light because the surface ladder *descends*, so
`--bg-2` moves toward a fill rather than away from one.

## 18. A preset's accent outranks the algorithm's own surface-separation floor

Two stated intents collide, and they cannot both hold.

**The first** is pinned by a test — *"honors a baked `defaultAnchors.accent` exactly as a call-site accent would
resolve."* A flavour author picked that colour deliberately, the same way an app author would, so the derivation
honours it verbatim: `completeAnchors` sets `accentExplicit` when *either* the caller supplied an accent **or** the
preset declares one, and an explicit accent skips `pageFloor`.

**The second** is an invariant — *"solid fills separate from `--bg-0`"* at `SURFACE_SEPARATION` (1.5). It skips a
fill the *caller* constrained, but a preset's accent is not a caller constraint, so the invariant does apply to it.

**Where they meet.** Seed a light page and supply no brand — a very ordinary thing to want — and `xtyle-default`
hands back its preset cyan `#3ad6f8` against `#e6e9ef` at **1.42**, under the algorithm's own 1.5 floor. Every
other fill on that theme sits at 4.30–4.90; the accent is alone. Letting `pageFloor` reach a preset accent lifts it
to 1.54 (`#2dcef0`) and is **byte-identical in dark on all five algorithms**, because the floor is a no-op wherever
the accent already clears — but it breaks the first intent, and the test that states it.

**The gauntlet cannot referee this.** It seeds `--accent` whenever it seeds a background, so "preset accent, author
page" is outside its input space; the case is unreachable by the fuzzer and reachable by an ordinary user. Widening
the battery to cover it is mechanism rather than policy — but it cannot be widened without going red, because the
conflict is real. Which way it should go red is the question.

**The three readings.** That a preset accent is the *algorithm's taste* and should be floored against a page the
author chose, leaving only a caller's brand untouchable. That it is a *brand* like any other and 1.42 is the honest
consequence of asking for a cyan-accented light theme, in which case the invariant should skip it and say so. Or
that the real defect is upstream — an algorithm whose only accent is tuned for its only (dark) anchor, which is
[question 17](#17-an-algorithm-stating-its-own-light-anchor-resolved) again from a second direction.

**The third reading is now the one that shipped, and it removes the symptom without settling the question.**
`xtyle-default` states a light-half accent, so seeding a light page and supplying no brand hands back **2.70**
rather than 1.42. The collision itself is untouched: a preset accent still outranks `pageFloor`, and an algorithm
that declares no light accent still reaches the same conflict. What changed is that the blessed set no longer walks
into it, so the remaining question is about the rule rather than about a theme anyone ships.

**Separately, and not in conflict with anything:** `pageFloor` floors fills against `--bg-0` alone. Nothing governs
them against `--bg-1` or `--bg-2`, which the audit does grade, so a fill can clear the page and still have no edge
on a raised panel. Measured across the blessed set the gap is small in dark (bg-0 2.79–3.55 against bg-2 2.79–3.09)
and the same shape in light. That one is a straightforward extension whenever the floor above is settled.
