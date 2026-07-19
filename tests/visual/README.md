# @xtyle/visual-tests

Cross-lib visual + behavioral regression for xtyle. Opt-in (browser-driven, so
it never sits in the fast `npm test` gate):

```sh
npm run test:visual          # run every leg against a fresh production build
npm run test:visual:update   # re-baseline the Leg 1 screenshots after an intended change
```

It answers three questions a change to a component or the engine can silently
break:

1. **Did this render break in a subtle, layout-oriented way?** (Leg 1)
2. **Do the three bindings still render in lockstep?** (Leg 2)
3. **Did a shared-element change break the things that _use_ it?** (Leg 3)

## How it runs

Playwright builds the site (`XTYLE_REGRESSION=1`) and serves the **production**
build on `http://localhost:4382` (a dedicated port, so it never collides with a
`astro dev` you have running on 4381). Determinism: fixed viewport, reduced
motion, self-hosted fonts, chrome hidden, theme seeded per-algorithm via
`localStorage`, and `nxi-nite`'s hour pinned so it doesn't key off the clock.

## Leg 1 — visual regression (`specs/demos.spec.ts`)

Screenshots each of the 83 live demos (`apps/site/src/components/demos/*.astro`)
under all five baked algorithms (`xtyle-default`, `xtyle-hc`, `xtyle-quiet`,
`xtyle-loud`, `nxi-nite`) and diffs against a committed baseline in
`specs/__baselines__/<algorithm>/<id>.png`. Because the demos are comprehensive
matrices (every variant / size / state) built on the real bindings, a subtle
layout break shows up as a pixel diff — and because the demos _consume_ the
elements, a shared-element change that breaks a downstream user shows up here too
(question 3).

Update baselines only after an **intended** visual change:
`npm run test:visual:update`, then eyeball the diff before committing.

A **missing** baseline is a hard failure, not an auto-write (`updateSnapshots:
"none"`). A new demo therefore fails the suite until someone runs the update
script and reviews what it captured — a component cannot quietly baseline itself
against whatever it happened to render on its first run.

## Leg 2 — binding parity (`specs/parity.spec.ts`)

Env-gated harness pages at `/regression/<id>` (excluded from production builds)
render each component through **raw element / Svelte / Astro** from one shared
fixture (`apps/site/src/regression/fixtures.ts`), and `pixelmatch` diffs the
three columns **directly against each other** — no golden files, parity is
intrinsic. `raw ↔ svelte` (both runtime, same fragment) is held to a tight
tolerance; `raw ↔ astro` (SSR light-DOM vs runtime mount) to a looser one.

The three bindings are wired by a generated registry
(`scripts/gen-regression-registries.mjs`, run automatically as the site's
`prebuild`).

### Parity-exempt components

A small set is intentionally skipped (`PARITY_EXEMPT` in `parity.spec.ts`), each
with its reason in a comment. Two kinds:

- **Not a single comparable instance** — layout / composed-chrome shells
  (`app-shell`, `mobile-shell`, `parallax`, `statusbar`, `toolbar`) and
  `accordion` (its items are sub-components the raw-HTML-child harness can't feed
  the Svelte binding fairly). Their cross-binding correctness rides on Leg 1.
- **Intended divergence** — `select`: the Astro SSR binding renders the option
  list inline (a functional no-JS select) and the runtime element collapses it to
  a trigger once hydrated. That's progressive enhancement, not a regression.

## Leg 3 — consumer coverage

Folded into Leg 1: every demo is asserted to render with a non-empty canvas and
zero JS errors (uncaught exceptions / failed module imports). Resource 404s are
surfaced as soft annotations rather than failures, since demos legitimately show
load-failure states.

## Notes

- The first fragment fill on each parity page also inits the xript runtime, so
  the harness waits for each runtime element's render signature to hold steady
  before capturing. There is no framework-level "fragment filled" signal to wait
  on; a real one would let the harness drop the timing floor.
