# xoji roadmap

Where xoji is going, in dependency order. A compass, not a ticket queue: pick the milestone the current state makes _reachable_, and let the throughline matter more than the count.

## status

Pre-alpha. The derivation architecture is settled (see [`derivation-model.md`](./derivation-model.md), [`dimensional-contract.md`](./dimensional-contract.md)). Shipping today: the OKLCH engine, a full component contract across `@xoji/core` / `@xoji/svelte` / `@xoji/astro`, the per-component manifest + coverage system, a graph-truthful derivation (`derive` = `resolveGraph(buildGraph(…))` with honest lineage), and the studio site (the reference pages + the Bench).

The layer that _defines_ the product, algorithms as xript plugins, is **largely true now**. The hosting spine has landed: `@xriptjs/runtime` is a real dependency, `src/host/` loads mods, every algorithm carries a real `mod-manifest.json` (xript 0.7 schema, declared capabilities + `graph`/`manifest`/`invariants` exports) plus an esbuild-bundled, self-contained `mod.js`, and the hosted path is proven byte-identical to baked across the whole suite. The sandboxed mod is the **canonical `derive` path** for the CLI and the site (`resolveAlgorithm`, with an in-process derive cache so repeat derivations skip the sandbox); mods are authored through the ergonomic `defineXojiAlgorithm` / `defineAlgorithm` surface, and color reaches them through the `cuti` host binding. The math (`buildGraph`, the invariants) lives in `@xoji/core`; the default mods import it by name and ship bundled with core: a settled call (core is batteries-included; no separate math packages, no extraction). What remains before the thesis is fully closed:

1. **The neutral importable API still leads with baked.** The `@xoji/core/algorithms` surface exposes `getAlgorithm` (baked) as the importable path, alongside a re-export of the engine so the whole pure-derive path is one import; `resolveAlgorithm` is the Node-side host seam and hasn't been generalized to the browser/importable surface. Baked stays the byte-identical oracle regardless.
2. **Mods aren't yet bundled into the published package.** `resolveAlgorithm` finds `algorithms/` by walking the repo; for a published `@xoji/core` the default mods need to ship inside the package so resolution works from a plain install.

## milestones

### 1. algorithms as real xript plugins: the spine (top priority)

The product's whole thesis. An algorithm is a named **xript** plugin (a manifest declaring its anchors, knobs, and produced tokens, plus xript code that derives them, run in xript's zero-authority sandbox), not baked TypeScript. This sits above everything else; until it lands, xoji is a nice theme kit, not the moddable derivation platform it's meant to be.

Landed:

- ✅ The xript model is understood and used, not guessed. `@xriptjs/runtime@^0.7.0` is wired into `@xoji/core` via `src/host/`.
- ✅ The **algorithm-manifest contract** exists: each algorithm carries a `mod-manifest.json` (xript 0.7 schema) declaring capabilities + `graph` / `manifest` / `invariants` exports, knobs + anchors as inputs.
- ✅ The algorithms (`xoji-default` / `xoji-hc` / `xoji-quiet` / `xoji-loud` / `nxi-nite`) ship as esbuild-bundled, self-contained mods, executed through the host and **proven byte-identical** to the baked output across the suite; the live site has run on the hosted runtime.

Landed since:

- ✅ **Flipped the default.** `resolveAlgorithm` runs the sandboxed mod as the canonical path for the CLI and the site; baked `getAlgorithm` is demoted to the byte-identical test oracle.
- ✅ **Resolved math ownership.** Settled: `@xoji/core` ships the derivation math and the default mods bundled; mods import core by name (the on-ramp a stranger uses too), and color crosses to mods through the `cuti` host binding. No separate math packages.
- ✅ **Tamed the runtime cost.** An in-process derive cache keyed on `(id, opts)` collapses the site's repeated derives (~5.8s → ~0.16s); novel inputs pay the sandbox once.

Remaining:

- **Generalize the canonical path to the importable/browser surface** (today `resolveAlgorithm` is the Node host seam; the neutral entry still leads with baked `getAlgorithm`).
- **Bundle the default mods into the published `@xoji/core`** so `resolveAlgorithm` resolves from a plain install, then retire baked-as-default outside the oracle.
- **Earn the free toolchain.** With the mod as source of truth, run xript's validate / typegen / docgen / init against it instead of approximating in TS.

### 2. derivation depth & realism

The algorithm has to behave the way it was envisioned against the inputs people actually use, not just pass the gauntlet.

- Pin re-threading across the whole register: an override re-enters derivation and dependents re-solve around it (accent ramp + the tone families done: pinning `--accent-2` re-threads `-3`/`-4`, and pinning a tone solid like `--green` or `--danger` now re-hues its whole `-bg`/`-fg`/`-text` family; surface re-spacing next).
- The sibling algorithms (`xoji-hc` / `xoji-quiet` / `xoji-loud`) as genuinely distinct design postures, not chroma multipliers.
- Gamut and contrast robustness; scrutiny against real brand colors, light palettes, near-monochrome, and off-hue accents, judged by eye, not just green.

### 3. component contract & correctness

- Cross-browser correctness and a11y depth on the live, driven UI, Firefox-verified so far: the four interactive controls (**checkbox** toggle+check, **switch** `aria-checked`, **radio** check+dot, **slider** `role=slider` thumb + ArrowRight) and the overlays (**Dialog** opens, traps focus, renders its body; **Tooltip** shows on hover). The library's `appearance: none` + custom-role + sibling-indicator + native-`<dialog>`/Popover patterns hold cross-engine. (`Menu` behaves identically in Chromium and Firefox: no engine divergence; its interactive open is verified in the live Bench.) Remaining: layout / data components, and adding Safari/WebKit.
- Component discoverability / IA: a persistent component nav, not a listing stranded on one index page.
- Fill genuine contract gaps; keep parity across `core` / `svelte` / `astro`.

### 4. presentation

- Design elevation: the site has to look like its makers command design, not a competent-default template.
- The Bench studio polished into the flagship surface; a light / multi-theme story that proves the engine's range.
- Documentation depth.

### 5. discovery & packs

- The `xoji add` / `xoji search` path; the npm-derived pack index; authored algorithm + theme packs.

### 6. consumer DX & publish-readiness

- Prebuilt CSS (`styles.css` / `tokens.css` / `components.css`) + self-theming entries; per-package READMEs and clean `exports`; one-import onboarding so adopting xoji is effortless.
- Staged toward a first public release.

## housekeeping

- **Retire the placeholder `@xoji/core@0.0.1` on npm.** A throwaway publish exists only because the bare name had to be claimed; it does not represent the product. Deprecate it, then unpublish within npm's window.
