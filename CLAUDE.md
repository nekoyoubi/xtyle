# CLAUDE.md

## What is xoji?

xoji is a themable-derivation engine and component contract. A named, swappable **algorithm** maps a small set of overridable anchors + knobs into a full, internally-consistent design-token set, co-designed against a component library so any valid theme renders well out of the box. The algorithm is the durable, reusable asset; a theme is a materialized invocation of one (quick or hard-won, both first-class). See [`docs/derivation-model.md`](docs/derivation-model.md) for the full architecture.

## Repository Structure

Monorepo managed via npm workspaces. TypeScript throughout.

```
xoji/
├── packages/
│   ├── xoji/         # the engine + raw custom elements, published as `@xoji/core` (CLI `xoji`, browser API, `@xoji/core/elements`)
│   ├── svelte/       # @xoji/svelte: thin Svelte wrapper
│   └── astro/        # @xoji/astro: Astro components (the site's binding)
├── algorithms/       # the built-in blessed set, each its own xript plugin
│   └── xoji-default/ #   the neutral default; xoji-hc / xoji-quiet / xoji-loud / nxi-nite follow
├── apps/
│   └── site/         # xoji.dev: Astro (docs, examples, marketplace, generator)
├── docs/             # design record (derivation-model, dimensional-contract, repo-layout, open-questions)
└── scripts/          # version:bump · release
```

## Tech Stack

- **Engine**: TypeScript, OKLCH color math (via `culori`), zero DOM in the neutral core
- **Algorithms**: xript plugins (manifest + xript code), run in xript's zero-authority sandbox
- **Package management**: npm workspaces
- **Site**: Astro, deployed to xoji.dev
- **Test runner**: vitest

## Development Commands

```sh
npm install                               # install all workspace dependencies
npm run build                             # build all packages
npm test                                  # routine gate: baked gauntlet + sampled hosted matrix (fast)
XOJI_GAUNTLET_DEPTH=full npm test         # production battery: full gauntlet + whole hosted byte-identical matrix
npm run dev                               # run the site locally (when apps/site exists)

npm run build --workspace=packages/xoji   # build just the engine
npm test --workspace=packages/xoji        # test just the engine

# the unified CLI (after build)
npx xoji derive --bg <c> --accent <c> --format css   # derive a theme + emit (css/json)
npx xoji gauntlet -a all --depth quick                # fast baked spot-check across all algorithms (default mode: baked)
npx xoji gauntlet -a all --mode hosted --depth full   # prove invariants against the shipped sandboxed mods
npx xoji coverage --consumed a,b,c                    # check a component's consumed tokens
# planned (next build): `xoji add <pack>` / `xoji search <query>`, the discovery surface
```

## Conventions

- TypeScript for all new code
- Self-documenting code preferred over inline comments (see global rules); JSDoc for public APIs
- Commit messages follow the project style: short header < 50 chars, past tense, markdown bullets for details
- Branches: `feature/` new work · `fix/` bug fixes · `clean/` refactor/cleanup/docs
- **Tests and dogfood passes clean up after themselves.** Anything a test or a manual derive-and-look session starts (a site preview server, a spawned `node` process, a temp file, a held port) gets torn down before the work is considered done. Don't leave orphaned preview servers or sockets bound; a pass that walks away with processes still running hasn't finished. Kill a stray preview by its PID on the port, never with a blanket `node` kill (that takes unrelated processes with it).

## Release Process

Mirrors xript. The version is cut at the **start** of a development cycle, not on the tail of finished work: a full spread bump across every lib up front, so all of `@xoji/*` always share one version. Two scripts handle the mechanics:

1. **`npm run version:bump <version>`** syncs the version across the root and every workspace `package.json` (and internal `xoji` / `@xoji/*` dep ranges). Run `npm install` after to refresh the lockfile.
2. **`npm run release`** cuts a GitHub Release from the current version and the matching `CHANGELOG.md` section. The user runs this after the cycle's work has merged.

The `/start` command runs the whole version kickoff at the beginning of a cycle (validate → branch off `main` → bump all libs → changelog stub → verify → commit → push); work then lands on that version's branch. The `/bootstrap-npm` command handles a package's first publish, required to claim the npm name before CI can take over.

## Changelog

Top-level `CHANGELOG.md`:

- **When**: every PR shipping user-facing changes. Skip internal refactors, CI tweaks, doc typos.
- **Format**: themed version header (`## v0.2.0: Open Register`), past-tense bullets, sub-bullets for detail, backtick all code references.
- **Voice**: entries are user-facing copy; pass them through a voice review before committing.
- **No dates in headers**: git tags them; dates rot in text.
- **Test-count table** at the bottom of each version entry.

## Current State

Pre-alpha. The architecture is settled and recorded in `docs/`. The engine (`packages/xoji`) was the first build (OKLCH derivation over the open token graph, the blessed algorithms, css/json emit, the per-algorithm gauntlet, and the `xoji` CLI) and on top of it now sit the raw custom elements (`@xoji/core/elements`), the `@xoji/svelte` / `@xoji/astro` bindings, the component set, and the site (`apps/site`). The `xoji add` discovery path is the main surface still ahead.

## Key Design Decisions

- **The algorithm is the asset, the theme is the print.** A theme is a materialized invocation of a named, composable algorithm. The split is about reuse, not worth: an algorithm is the durable, shareable engine; a theme can be anything from a throwaway "pick three colors" to the hard-won work of a creative dialing in a full design. Both matter; the architecture just keeps the reusable machinery separate from any one materialized result.
- **Algorithms are literally xript plugins.** Manifest + xript code, knobs as declared inputs, run in a zero-authority sandbox, so xript's toolchain (validate / typegen / docgen / init) and its capability model come free; xoji builds none of it.
- **The open register.** Not a fixed schema: authors declare new tokens and rewire any derivation. The only hard contract is a **coverage check** between what components consume and what a module produces.
- **No engine-level "can't look bad" gospel.** Invariants are per-algorithm policy; the gauntlet is parameterized by algorithm.
- **Three input tiers.** Algorithm internals (builders) / algorithm knobs (the whole casual UX) / token overrides (universal escape hatch).
- **TS-core.** One engine everywhere; runs at build via the CLI and in the browser (the generator, live derivation) via the QuickJS the xript runtime embeds.
- **The runtime is optional, not required.** Once derived, a theme is just CSS custom properties + the browser cascade; no engine needs to be running to use it. The engine *can* run live (the generator, novel-at-runtime inputs), but nothing about consuming a finished theme depends on it.
- **Dual-entry.** One `@xoji/core` package exposes a neutral importable API *and* a Node CLI bin (`xoji`) *and* a browser DOM helper; the core stays environment-neutral (no `fs` / `path` / `process` outside the CLI).
- **Manifest-as-source-of-truth.** Packs declare their own contents; discovery is an index over npm, not a hosted registry.
