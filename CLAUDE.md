# CLAUDE.md

## What is xtyle?

xtyle is a themable-derivation engine and component contract. A named, swappable **algorithm** maps a small set of overridable anchors + knobs into a full, internally-consistent design-token set, co-designed against a component library so any valid theme renders well out of the box. The algorithm is the durable, reusable asset; a theme is a materialized invocation of one (quick or hard-won, both first-class). See [`docs/derivation-model.md`](docs/derivation-model.md) for the full architecture.

## Repository Structure

Monorepo managed via npm workspaces. TypeScript throughout.

```
xtyle/
├── packages/
│   ├── xtyle/         # the engine + raw custom elements, published as `@xtyle/core` (CLI `xtyle`, browser API, `@xtyle/core/elements`, `@xtyle/core/fx`, `@xtyle/core/vite`)
│   ├── svelte/       # @xtyle/svelte: thin Svelte wrapper
│   └── astro/        # @xtyle/astro: Astro components (the site's binding)
├── algorithms/       # the built-in blessed set, each its own xript plugin
│   └── xtyle-default/ #   the neutral default; xtyle-hc / xtyle-quiet / xtyle-loud / nxi-nite follow
├── apps/
│   └── site/         # xtyle.dev: Astro (docs, examples, marketplace, generator)
├── docs/             # design record (derivation-model, dimensional-contract, collection-substrate, component-fragments, code-component, icon-name-grammar, effects, repo-layout, roadmap, open-questions)
├── tests/visual/     # the cross-algorithm visual regression baseline (Playwright)
└── scripts/          # version:bump · release · stats:snapshot · the build/check helpers
```

## Tech Stack

- **Engine**: TypeScript, OKLCH color math (via `culori`), zero DOM in the neutral core
- **Algorithms**: xript plugins (manifest + xript code), run in xript's zero-authority sandbox
- **Package management**: npm workspaces
- **Site**: Astro, deployed to xtyle.dev
- **Test runner**: vitest

## Development Commands

```sh
npm install                               # install all workspace dependencies
npm run build                             # build all packages
npm test                                  # routine gate: baked gauntlet + sampled hosted matrix (fast)
XTYLE_GAUNTLET_DEPTH=full npm test         # production battery: full gauntlet + whole hosted byte-identical matrix
npm run dev                               # run the site locally (when apps/site exists)

npm run test:visual                       # the cross-algorithm visual regression baseline
npm run test:visual:update                # re-baseline it after an intended visual change

npm run build --workspace=packages/xtyle   # build just the engine
npm test --workspace=packages/xtyle        # test just the engine

# the unified CLI (after build)
npx xtyle derive --bg <c> --accent <c> --format css   # derive a theme + emit (css/json/theme/prism/monaco/terminal)
npx xtyle derive --knob accentStrategy=duo             # turn one of the algorithm's own dials (repeatable; alias -k)
npx xtyle knobs [-a <algorithm>]                        # what dials an algorithm has, and what each one accepts
npx xtyle gauntlet -a all --depth quick                # fast baked spot-check across all algorithms (default mode: baked)
npx xtyle gauntlet -a all --mode hosted --depth full   # prove invariants against the shipped sandboxed mods
npx xtyle coverage --consumed a,b,c                    # check a component's consumed tokens
npx xtyle audit -a <algorithm> [--level AA|AAA]        # grade a theme's contrast against the canonical WCAG text/fill pairs
npx xtyle mcp                                          # start the MCP server (the CLI + engine, for agents) over stdio
# planned (next build): `xtyle add <pack>` / `xtyle search <query>`, the discovery surface
```

## ⛔ NO AGENT-WRITTEN CODE COMMENTS — EVER, WITHOUT AN EXPLICIT REQUEST

**An AI agent MUST NOT add a code comment to this repository unless the human explicitly asks for that comment, in the conversation, in that spot.** No inline `//`, no `/* */`, no block headers, no tagged comments (`// INFO:`, `// HACK:`, `// SAFETY:`, `// PERF:`, …), no "explaining the non-obvious bit," in any file (`.ts` / `.svelte` / `.astro` / `.mjs` / `.css` / anywhere). Default is zero. When unsure, none.

- A tag is **not** a way to keep a comment. The comment audit gate accepts a tag; the human does not. Passing the gate is not permission — it is the floor, not the goal.
- "The reasoning is non-obvious" is **not** an exception. Put the reasoning in the commit message, the PR description, or a `docs/` file — never in the code.
- Editing code near an existing comment does not license a new one. Removing a stale or explanatory comment is always fine.
- If a gate, linter, or reviewer seems to *want* a comment, leave it out and say so.
- The **only** comments that may exist are JSDoc `/** */` blocks documenting the *public-API contract* of an exported symbol (what a consumer calls) — never to narrate implementation, and never inline. When in doubt, it is not this; write no comment.

The reflex to explain code with a comment is the single most-repeated instruction-violation in this repo's history. Write the code so it reads without one. If it genuinely cannot, rename, extract, or restructure — do not annotate.

## Conventions

- TypeScript for all new code
- **No code comments** (see the hard rule above). Self-documenting code — clear names, small functions, types
- Commit messages follow the project style: short header < 50 chars, past tense, markdown bullets for details
- Branches: `feature/` new work · `fix/` bug fixes · `clean/` refactor/cleanup/docs
- **Tests and dogfood passes clean up after themselves.** Anything a test or a manual derive-and-look session starts (a site preview server, a spawned `node` process, a temp file, a held port) gets torn down before the work is considered done. Don't leave orphaned preview servers or sockets bound; a pass that walks away with processes still running hasn't finished. Kill a stray preview by its PID on the port, never with a blanket `node` kill (that takes unrelated processes with it).
- **The visual suite cannot run concurrently with itself.** `npm run test:visual` pins a fixed port and spawns its own preview server, so a second instance kills the first one's server mid-run. The symptom is a confusing cascade of "server is gone" failures rather than a clear port conflict, so check for an already-running instance before blaming the baseline.

## ⚠️ REACH FOR XTYLE FIRST — NEVER HAND-ROLL UI THE SYSTEM CAN PROVIDE

**xtyle is the design system. Building any user-facing surface — a control, a token value, a hover effect, a layout primitive — starts by reaching for what xtyle already ships, and when it ships nothing that fits, by *extending xtyle*, not by hand-rolling a one-off.** This applies inside the repo (the site, the bench, the demos) and to anything built against xtyle. A bespoke `<div>` switch when `<xtyle-switch>` exists, a hardcoded `#hex` when a token carries the value, a hand-written `@keyframes` glow when the effect layer has `glow` — each is a defect, not a shortcut, and the cost is a surface that drifts from the theme, ignores the algorithm, and duplicates work the library exists to own.

The order of reach, every time you are about to write UI:

1. **A component?** Check `packages/xtyle/src/manifest/` and `@xtyle/core/elements`. If a component fits, use it — through the `@xtyle/astro` / `@xtyle/svelte` binding on the site, or the raw element elsewhere. A switch is `<Switch>`, a toggle group is `<Segmented>`, a menu is `<Menu>`; do not rebuild them.
2. **A token?** Colors, space, radius, shadow, duration, easing, layer, the named hues — all derive. Read the value from the token (`var(--accent)`, `var(--space-3)`), never a literal. A literal is a value the theme can't reach.
3. **An effect?** A glow, pulse, sweep, lift, tint, blur, grayscale, shake — the effect layer owns these as `data-fx` specs that derive their intensity from the algorithm and honor reduced motion for free. Do not write a `filter`/`@keyframes`/`transition` by hand for anything the effect layer covers.

**When nothing fits, the answer is to build it into xtyle — not around it.** A missing prop gets added to the component (and its manifest, demo, docs — see the rule below). A missing effect gets `registerEffect`ed into the library, last-wins on the name. A missing token gets derived by the algorithm. A whole missing capability that is user-extensible rather than core gets built as a **mod**: xtyle is xript-driven, and its components, effects, fonts, and generators are all fillable/registerable surfaces a mod can reshape or add to without touching core. The line is: promote to core what is blessed and universal; ship as a mod what is optional or opinionated. Either way it lands *in the system*, reusable, themed, and covered — never as a private snowflake in one page's stylesheet.

The failure this rule exists to prevent: reaching for a raw `<div>`, a literal color, or a hand-rolled animation "just for this one spot" because it is faster in the moment. It is never just this one spot, the moment's shortcut becomes the codebase's drift, and the library it bypassed is the entire point of the project. If the reach turns up a gap, that gap is the work — fill it in xtyle.

## ⚠️ EVERY MAJOR BROWSER, NOT JUST CHROME

**xtyle targets Chromium, Firefox, and WebKit. A mechanism that only works in one engine is a defect, not an implementation detail — and picking one is a decision made *before* the code, not discovered after it ships.**

When a capability could be built more than one way, browser support is part of choosing, ranked alongside fidelity and simplicity. Check it at the moment of the choice. "It works" means it works in all three; a local render proves one engine and nothing else.

- **Verify in more than one engine before calling a visual feature done.** Playwright defaults to Chromium and `tests/visual` runs Chromium only, so a green suite and a clean local screenshot are both single-engine evidence. Anything that leans on a newer CSS property gets a second engine opened against it, deliberately.
- **Prefer the broadly-implemented property over the elegant one.** `mask-image` and `border-image` are universal; `mask-border` / `-webkit-mask-box-image` are not implemented in Firefox at all. When a property is unevenly supported, the alternative that reaches every engine wins even when it costs more machinery.
- **Degrade toward the shape, never away from it.** The worst failure is silent and inverted: an unsupported property drops out of the cascade and leaves whatever was underneath, so a masked frame becomes a solid rectangle and the feature reads as a *bug in the artwork* rather than a missing capability. If a path can't be made universal, it must fail into something recognisably the same thing — and be feature-detected, not assumed.
- **`@supports` and `CSS.supports()` are the tools.** Branch on the capability, not on a browser.

The failure this rule exists to prevent: reaching for the property that expresses the idea most neatly, confirming it in the one browser that happens to be open, and shipping a feature that renders wrong for every user on a different engine — where it is invisible to the person who wrote it and maddening to everyone else.

## ⚠️ DEMOS, DOCS, AND CODE SAMPLES ARE PART OF THE FEATURE — NEVER OPTIONAL

**A change to a component or the engine is NOT DONE until its demo, its docs, and its code samples show the change. No exceptions. This is not cleanup for "later" or a follow-up task — it is half of the work, every single time.**

When you add or change a prop, variant, size, state, token, or behavior, you MUST update **all** of these in the same change, or the feature effectively does not exist to anyone using the library:

1. **The manifest** — `packages/xtyle/src/manifest/<id>.manifest.ts`. This is the source of truth the reference page, the MCP server, and coverage all read. Update every relevant field: `props`, `variants`, `sizes`, `states`, `anatomy`, `slots`, `consumedTokens`, `a11y`, `description`, and the `examples`. A new capability with no manifest entry is invisible and uncovered.

2. **The live demo** — `apps/site/src/components/demos/<id>.astro`. **This is the single most-forgotten surface, and the most important one.** The reference page's "Live demo" stage renders *this file*, not the manifest examples. A manifest `example` is a **code snippet** shown in the "Code" section; it is NOT a live demo. If a new `tone`/`pulse`/`variant`/state isn't added to the demo `.astro`, then someone browsing the docs sees the component render without ever seeing the thing you just built. **Adding a manifest example is not enough. Update the demo file so the new behavior is on screen.**

3. **The code samples** — every `example.source` (`html` / `svelte` / `astro`) in the manifest must actually exercise the new capability and stay accurate and copy-pasteable. Stale or wrong samples are worse than none.

**Then prove it with your own eyes.** Build the site and actually load the demo page (browser/screenshot, not just a passing test) to confirm the new thing renders in the live demo under a derived theme. "The manifest example has it" is not proof the demo shows it — those are different surfaces, and the demo is the one users look at.

**The failure this rule exists to prevent:** shipping a feature that works in code and passes tests but appears *nowhere* in the docs a user actually browses — so it's built, but undiscoverable. If you catch yourself thinking "the code's done, the demos can come later," stop: the demos are not later, they are now, in this change.

## ⚠️ CHROME IS A FRAGMENT — AND A STYLESHEET CAN BUILD CHROME TOO

**If a component invents something the user sees, that thing goes in an xript fragment. If you are writing `document.createElement` (or `innerHTML`, or a template string) in an element's `connectedCallback` to construct a control bar, a button, a dot, a handle, or a rail — stop. You are hardcoding the one surface a mod exists to reshape. And if you are reaching for `::before { content: … }` to draw a marker, a checkmark, a connector, or a caret — stop for the same reason. The delivery mechanism does not matter. The reachability does.**

**The one-line test: chrome is what a token cannot fix.** If the only useful override is a *value* — a color, a thickness, whether it's there at all — it's a **finish**, and CSS is the right home. If a plausible mod would want to change the thing's **identity or structure** — put an icon in it, swap the glyph, restructure it, hang something off it — it's a **part**, and it belongs in a fragment. No token reaches "what it is."

Three ten-second probes. A pseudo-element is a **part** if *any* is true:

1. **It has text.** Non-empty `content` — a counter, a glyph, a checkmark. `content: ""` alone is not text.
2. **It has its own box.** An explicit `width`/`height`, or offsets that place it beside or outside the host box. `inset: 0; border-radius: inherit` is **not** its own box — that is the host's box, painted.
3. **You would name it in the anatomy.** "marker", "rail", "dot", "connector", "gutter", "chevron" → part. "hover wash", "focus ring", "tap target" → not.

One carve-out, and it is principled rather than convenient: **a pseudo-element whose existence is gated on a design token is a finish by construction.** The `--selection-cue: marker` glyphs (`tabs`, `tree`, `segmented`, `pagination`, `swatch`) draw a `✓` inside a container query on a derived token. They are the *algorithm's* accessibility policy, applied uniformly — which is the definitional opposite of a mod-surface hole. Without this carve-out the rule eats its own a11y layer.

Then the question of **who owns it**, which has three answers, not two:

- **The component owns it, and it renders → it MUST be a fragment.** Markup the component *invents* and the user *sees*: a track, a control bar, prev/next arrows, dots, a play toggle, a star row, a tab strip, a resize handle, a shell's app bar. The component conjured it, so the author has nothing to edit and a mod is the *only* way to change it. It renders through `packages/xtyle/src/elements/fragments/<id>/` with a `mod.manifest.json` `fills` entry and a matching slot in `component-host.json`. That is mod-zero: the built-in fill goes through the exact surface a third party would use.
- **The author owns it → a decorator is correct.** Semantic content the *consumer* wrote, which the element merely classes and ARIAs in place: a real `<table>`, an `<ol>` of events, a set of slides. There is nothing for a mod to override that isn't already the author's to edit.
- **The component owns it and it does NOT render → plumbing, and it stays in the element.** An `aria-live` announcer, a hidden form input mirroring the value for a `<form>`, a measurement sentinel, a portal root. It is invented, but it has no visual surface anyone would ever want to restyle. **If a mod can't see it, it isn't chrome.** Routing plumbing through a fragment buys nothing and makes the fragment a liability.

**A component can be more than one of these, and that is the trap.** `Carousel` receives the author's slides (content), invents a track, arrows, dots, and a play toggle (chrome), *and* invents an `aria-live` region (plumbing). Receiving content does not license building chrome imperatively, and having plumbing does not excuse the chrome next to it. Split it: behavior — scroll math, seam-clone looping, keyboard, autoplay — stays in the element, plumbing stays in the element, and the *chrome it draws* goes in the fragment.

**How this actually goes wrong, twice.** The first pass of `MobileShell` was built as a light-DOM decorator, which would have put an app's chrome outside the fragment model and quietly made the one surface an app most wants to reskin the one surface it *couldn't*. It got caught and rebuilt as a fragment.

The second way is worse, because the rule itself was blind to it. This table used to be keyed on **imperative DOM calls** — which is precisely the metric that scores `steps` and `timeline` at *zero* and calls them clean, while they conjure a numbered marker, a checkmark, a connector track, a dot, and a rail that exist as **no node anywhere**, reachable by neither a mod nor the author. Worse still, their doc comments cited *each other* as precedent ("drawn from the theme in CSS"), so the mistake was self-propagating. **Never key this table on a mechanism.** Key it on the only thing that matters:

**Invents rendered furniture no fill owns** — counting markup *and* stylesheet.

| component | invents | via |
|---|---|---|
| *none currently* | — | — |

The table is empty, and it stays. **Do not delete it** — it exists to catch the next offender, not to record the last one. Every component renders its chrome through `fragments/<id>/`, and the CSS-drawn markers, checkmarks, chevrons, gutters, rails and dots are real nodes in a fill.

**A fragment's existence is not a pass** — this is the shape that fooled a whole audit. `bar`, `pie`, `heatmap`, `toast`, `image` and `color-picker` all *had* fragments and still wrote chrome into them from the element, which looks compliant and isn't: a mod's override gets clobbered on the next hover, the next edit, the next paint. When you check a component, check that the fill owns *everything* it draws, not that a fill exists.

`lightbox` is the inverse and is correctly absent from the table: it composes an already-fragment-backed `<xtyle-dialog>` and fills it with the viewer's payload. So is the imperative `toast()` API, which creates `<xtyle-toast>` elements and lets each one render through its own fill.

**And a fill only wins if it is loaded after mod-zero.** Fills share one runtime and their ops concatenate in registration order, last-op-wins. `loadFill()` pulls the built-in fill for a slot in *first*, so an override loaded at any point still wins — but if you add a new path that registers a fill, route it through `loadFill()` or you will silently reintroduce the bug where an app that installs its mods at boot has them painted over.

**Plumbing that correctly stays in the element**, so nobody "fixes" it: `carousel`'s and `date-picker`'s `aria-live` announcers, the hidden mirror inputs in `rating` / `combobox` / `dropzone`, and `field`'s `<datalist>`. All invented, none reskinnable.

**When you add or touch a component, state which side of the line it is on and why.** If it invents rendered furniture and has no fill that owns it, that is a defect to raise — not a style preference, and not something to work around. Keep the table honest; a component that lands in it silently is the exact failure this rule exists to prevent.

## Release Process

Mirrors xript. The version is cut at the **start** of a development cycle, not on the tail of finished work: a full spread bump across every lib up front, so all of `@xtyle/*` always share one version. Three scripts handle the mechanics:

1. **`npm run version:bump <version>`** syncs the version across the root and every workspace `package.json` (and internal `xtyle` / `@xtyle/*` dep ranges). Run `npm install` after to refresh the lockfile.
2. **`npm run release`** cuts a GitHub Release from the current version and the matching `CHANGELOG.md` section. The user runs this after the cycle's work has merged.
3. **`npm run stats:snapshot -- --rebaseline`** re-baselines `apps/site/src/data/stats-baseline.json`. It runs at the **start of a cycle, immediately after the version bump** — never at release. The baseline records the *last released* version, and every growth figure and "New" badge on the site is measured against it, so it must stay strictly behind `package.json`'s version: `main` deploys on push, and a baseline naming the version `main` is currently showing publishes a site claiming that release shipped nothing. The script stamps the newest git tag rather than `package.json`, refuses when the two are equal, refuses to move backwards, and still requires the flag.

The `/start` command runs the whole version kickoff at the beginning of a cycle (validate → branch off `main` → bump all libs → changelog stub → verify → commit → push); work then lands on that version's branch. The `/bootstrap-npm` command handles a package's first publish, required to claim the npm name before CI can take over.

## Changelog

Top-level `CHANGELOG.md`:

- **When**: every PR shipping user-facing changes. Skip internal refactors, CI tweaks, doc typos.
- **Format**: bare version header (`## v0.10.0`), past-tense bullets, sub-bullets for detail, backtick all code references. Entries through `v0.9.0` carry themed titles and keep them; do not add a title to a new entry, and do not retitle an old one.
- **Voice**: entries are user-facing copy; pass them through a voice review before committing.
- **No dates in headers**: git tags them; dates rot in text.
- **Test-count table** at the bottom of each version entry.

## Current State

Pre-alpha. The architecture is settled and recorded in `docs/`. The engine (`packages/xtyle`) was the first build (OKLCH derivation over the open token graph, the blessed algorithms, css/json emit, the per-algorithm gauntlet, and the `xtyle` CLI) and on top of it now sit the raw custom elements (`@xtyle/core/elements`), the `@xtyle/svelte` / `@xtyle/astro` bindings, the component set, and the site (`apps/site`). The `xtyle add` discovery path is the main surface still ahead.

## Key Design Decisions

- **The algorithm is the asset, the theme is the print.** A theme is a materialized invocation of a named, composable algorithm. The split is about reuse, not worth: an algorithm is the durable, shareable engine; a theme can be anything from a throwaway "pick three colors" to the hard-won work of a creative dialing in a full design. Both matter; the architecture just keeps the reusable machinery separate from any one materialized result.
- **Algorithms are literally xript plugins.** Manifest + xript code, knobs as declared inputs, run in a zero-authority sandbox, so xript's toolchain (validate / typegen / docgen / init) and its capability model come free; xtyle builds none of it.
- **The open register.** Not a fixed schema: authors declare new tokens and rewire any derivation. The only hard contract is a **coverage check** between what components consume and what a module produces.
- **No engine-level "can't look bad" gospel.** Invariants are per-algorithm policy; the gauntlet is parameterized by algorithm.
- **Three input tiers.** Algorithm internals (builders) / algorithm knobs (the whole casual UX) / token overrides (universal escape hatch).
- **TS-core.** One engine everywhere; runs at build via the CLI and in the browser (the generator, live derivation) via the QuickJS the xript runtime embeds.
- **The runtime is optional, not required.** Once derived, a theme is just CSS custom properties + the browser cascade; no engine needs to be running to use it. The engine *can* run live (the generator, novel-at-runtime inputs), but nothing about consuming a finished theme depends on it.
- **Dual-entry.** One `@xtyle/core` package exposes a neutral importable API *and* a Node CLI bin (`xtyle`) *and* a browser DOM helper; the core stays environment-neutral (no `fs` / `path` / `process` outside the CLI).
- **Manifest-as-source-of-truth.** Packs declare their own contents; discovery is an index over npm, not a hosted registry.
- **Effects are a third kind.** A token is a value, a component is a thing, an **effect** is a verb: a
  behavior applied to any element under a condition, addressed by a spec string (`data-fx="glow@hover"`, with named params after a `?`: `throb?rate:3s,colors:[accent,accent-2]`)
  in the same name-is-its-spec shape as an icon name. A bare spec is plain attribute-selector CSS and
  needs no runtime, but a `?params` tail has nowhere in a selector to live, so `data-fx` alone silently
  yields the effect with its defaults; `@xtyle/core/fx` is the optional runtime that closes that gap
  (`applyEffect` delivers a spec's parameters, `fireEffect` drives a transient, `armInView` arms
  `reveal`). Its values derive from five shared `--fx-*` tokens, so intensity is the algorithm's policy
  (`xtyle-hc` flattens the layer to zero because a halo spends the edge contrast it protects); and its
  library is **last-wins on the name**, so an addon replaces one effect or adds a new one without
  restating the rest. Reduced-motion suppression is the library's job, decided once. Do not hand-roll a
  hover glow, a pulse, or a sweep in a component's own CSS — see [`docs/effects.md`](docs/effects.md).
- **The collection substrate.** The components that rope off items and move a cursor across them (`menu`, `tree`, `combobox`, `command-palette`, `tabs`, `segmented`, plus `<xtyle-list>` as the reference skin) share one keyboard reducer, roving tab stop, and selection model rather than each hand-rolling arrow wrapping, `Home`/`End`, typeahead, and the selection-cue contract. `table` consumes the selection core but keeps its own 2-D column identity; `pagination` stays out on purpose, because a page cursor is not a selection. Do not add a bespoke roving-tabindex handler to a new component — see [`docs/collection-substrate.md`](docs/collection-substrate.md).
- **The gesture core.** Every component that drags (`slider`, `splitter`, `sheet`, `reveal`, `rating`, `redact`, `color-picker`, `dock-zone`, `app-shell`) sits on one pointer-drag core, `packages/xtyle/src/elements/gesture.ts`: `startDrag` owns axis lock, signed travel, and the velocity read a flick needs, and `settle` animates a release off the theme's own motion tokens rather than a hardcoded duration. The core is what makes the edge cases uniform — hand-rolled draggers listened for `pointerup` but not `pointercancel`, so a cancelled pointer left a live drag behind. Do not write a bespoke `pointerdown`/`pointermove` handler for a new component; extend the core.
