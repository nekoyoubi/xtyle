# xtyle repo layout

Settled 2026-06-17. Monorepo. This is the deliberately-slim shape; read
`derivation-model.md` for *why* the pieces are what they are.

---

## Shape

- **Monorepo.** npm workspaces, `@xtyle` npm scope, a `version:bump` /
  `stats:snapshot` / `release` script trio (no changesets). One shared version across the whole spread: every
  `@xtyle/*` package bumps together, cut at the start of a development cycle via
  `/start`, never package-by-package.
- **TS/JS-dominant, no Rust of consequence.** The heavy runtime is xript's
  (rquickjs); xtyle carries at most a thin deferred QuickJS-free shim, and that's
  YAGNI. This keeps it far lighter than a full Tauri desktop repo; lean into that.
- **OSS, like xript.**

---

## Directory layout

Top-level is settled; the engine internals below are a simplified view of
`packages/xtyle/src`.

```
xtyle/
├── packages/
│   ├── xtyle/                 # the engine + raw custom elements: published as `@xtyle/core` (CLI `xtyle`, browser API, `@xtyle/core/elements`)
│   ├── svelte/               # @xtyle/svelte: thin Svelte wrapper
│   └── astro/                # @xtyle/astro: Astro components (the site's binding)
├── algorithms/               # the built-in blessed set, each its own xript plugin
│   ├── xtyle-default/
│   ├── xtyle-hc/
│   ├── xtyle-quiet/
│   ├── xtyle-loud/
│   └── nxi-nite/
├── apps/
│   └── site/                 # xtyle.dev: Astro (docs, examples, marketplace, generator)
├── docs/                     # internal design record (these files)
├── scripts/                  # version:bump · stats:snapshot · release  (xript-style release mechanics)
├── .github/workflows/        # deploy.yml (site → Pages on main) · publish.yml (npm on release)
├── .gitignore · LICENSE · CONTRIBUTING.md · CLAUDE.md · README.md
├── package.json              # private workspace root: npm workspaces + scripts
└── tsconfig.base.json
```

Three homes by *kind*: `packages/` (publishable libs), `algorithms/` (built-in
xript plugins: assets, not lib code), `apps/` (the site). `docs/` is the internal
design record; the *website's* user docs live in `apps/site`.

The engine, where the dual-entry discipline becomes physical:

```
packages/xtyle/
├── src/
│   ├── index.ts      # neutral public API: derive(), emit(), types, no fs/path/process
│   ├── graph.ts      # the open token graph: topo resolve + cycle detection
│   ├── host.ts       # xript host glue: load + run an algorithm plugin
│   ├── resolve.ts    # algorithm resolution (installed dep / on-demand fetch)
│   ├── coverage.ts   # coverage check: consumed vs produced tokens
│   ├── emit/         # serializers, open set: css · json · theme · prism · monaco · terminal
│   ├── gauntlet.ts   # per-algorithm invariant prover
│   ├── dom.ts        # browser-only: apply/switch/persist  (exports["./dom"])
│   └── cli.ts        # node-only shell: argv + fs  (the bin)
├── test/ · package.json (name "xtyle"; bin + exports) · tsconfig.json
```

A built-in algorithm (the blessed set bundles into `@xtyle/core`; a standalone
flavor pack is the same manifest + mod, plus its own `package.json`, in its own repo):

```
algorithms/xtyle-default/
├── mod-manifest.json # xript mod manifest, knobs as inputs, capabilities: none
├── src/preset.ts     # the algorithm's posture: anchors + knob defaults
├── src/mod.ts        # the mod entry: defineXtyleAlgorithm(preset), importing core by name
└── src/mod.js        # esbuild-bundled, self-contained mod the host runs
```

**Day one** (to claim the npm name) is a thin slice: `packages/xtyle/`, one or two
`algorithms/xtyle-*`, `docs/`, root config. `apps/site` and the component packages
grow in after.

---

## Algorithms are xript plugins: the keystone

A xtyle algorithm is *literally* a **xript plugin (addon)**: a manifest + xript
code, its knobs declared as the plugin's inputs, sandboxed by xript's capability
model, distributed like any xript addon. This is the single biggest simplifier in
the whole project:

- xtyle builds **no** validate / typegen / docgen / scaffold / sandbox tooling;
  that's xript's, for free. `xript validate` runs against an algorithm;
  `@xriptjs/init` scaffolds one.
- The **marketplace is xript-addon distribution** + a discovery index, not a
  bespoke registry.
- Algorithms are **pure and sandboxed by construction**: running a stranger's
  algorithm is safe because it's a xript plugin with zero ambient authority.

---

## Packages (the whole list)

- **`@xtyle/core`**: the engine, and the flagship. Pure derivation over the open
  token graph: a xript host that runs an algorithm-plugin over
  `(knobs + constraints)` → a token graph, then emits artifacts (css / json /
  theme / prism / monaco / terminal, an *open* emitter set). Ships a **CLI bin**
  *and* an importable API from the one package; see the dual-entry seam below.
- **`@xtyle/core/elements`** *(optional)*: single-layer raw custom elements (a subpath of `@xtyle/core`), styled only against the tokens they declare they consume. The element *is*
  the component; **no headless tier beneath it.**
- **`@xtyle/svelte`** *(optional)*: thin wrappers that skin the custom elements for
  Svelte.
- **`@xtyle/astro`** *(optional)*: Astro components over the same contract; the
  binding the site itself consumes. More framework skins follow as wanted.
- **Algorithms**: the built-in blessed set, all `xtyle-*` (`xtyle-default`,
  `xtyle-hc`, `xtyle-quiet`, `xtyle-loud`, …), as xript plugins in the repo. Ships out
  of the box, the initial seed of the marketplace. Personal / community **flavor
  packs** (an author's own brand-prefixed set) are *separately published* addons,
  **not** bundled in core. The split is **brand/role, not authorship**: the same
  hands may write both; `xtyle-*` wears the project's neutral brand and ships as the
  default floor, while a `<brand>-*` pack wears a personal brand and ships as an
  optional pull-down. Keeps the tool's face brand-neutral without anyone giving up
  their own flavors.

---

## The dual-entry seam: one package, CLI + importable API

`@xtyle/core` ships a **`bin`** (build-time) and an **`exports`** API (importable
anywhere) from the one package: the standard `vite` / `esbuild` / `tsup` shape,
not a wart.

```jsonc
// packages/xtyle/package.json
{
  "name": "@xtyle/core",
  "bin": { "xtyle": "./dist/cli.js" },   // build-time only
  "exports": {
    ".":     "./dist/index.js",         // the engine: neutral, importable anywhere
    "./dom": "./dist/dom.js"            // optional apply-to-DOM helper, browser
  }
}
```

The one discipline that makes it clean: **the engine is environment-neutral; the
CLI is a thin Node shell over it.**

- `import { derive, emit } from '@xtyle/core'` → pure functions
  (`derive(algorithm, knobs) → tokenGraph`, `emit(graph, 'css') → string`). **No
  `fs` / `path` / `process` in this entry**: that's what lets a browser app bundle
  it for live derivation and tree-shake cleanly.
- the `bin` is a Node wrapper that reads the algorithm + knob files off disk, calls
  the *same* `derive`/`emit`, and writes artifacts out. All Node-only code lives
  here and nowhere else.

So the build path and the live path run **identical derivation code**; only the
I/O differs (CLI reads/writes files; an app feeds knobs from UI state). "Run the
algorithm" = "ask the xript runtime to execute the plugin," and that runtime is
already portable: `@xriptjs/runtime` (WASM/JS) in the browser, the Node runtime
under the CLI, `rquickjs` in Tauri.

From a consumer's seat:

- **Static app** → `@xtyle/core` is a **devDependency**; the CLI emits CSS at build,
  the app ships only that CSS (+ optional components). Zero `@xtyle/core` in the bundle.
- **Live-derivation app** → `@xtyle/core` is a real **dependency**, bundled, `derive`
  running client-side alongside the xript runtime.

Same package both times; dev-only vs shipped is just whether you need
novel-at-runtime themes. One package, two hats: `xtyle derive` (the CLI bin) and
`import { derive } from '@xtyle/core'` are the same tool.

---

## Pulling algorithms down: CLI and site share one path

Because an algorithm is just a xript plugin (a package), consuming an arbitrary
*published* one is cheap and identical across surfaces. This is the marketplace
consumption path, and it's a first-class capability, not an afterthought:

- **CLI** resolves an algorithm by reference: an installed dependency (normal npm
  resolution from `node_modules`), or fetched on demand (`xtyle add <algo>` /
  auto-resolve from the registry), then handed to the xript host to run.
- **Site generator** fetches the plugin from a CDN at runtime (unpkg / jsDelivr /
  esm.sh-style) and loads it into the in-browser xript host, so a user can pick
  *any* published algorithm, not just the bundled `xtyle-*` set, and derive live.

xtyle builds **no registry**: the marketplace is npm + a discovery index, resolution
is npm/CDN, instantiation is xript's addon loader. Fetch-and-run of a stranger's
algorithm is safe because it's a **zero-authority pure plugin** (xript
capabilities), the same property that makes the marketplace trustworthy.

The resolve → load → run shape is settled; the reference-grammar details are in
`open-questions.md` #10.

---

## Discovery & resolution

### The unit is a manifest-declared pack

A pack (npm package or GitHub repo) carries an **xtyle manifest** (an `xtyle` field
in `package.json`, or a top-level `xtyle.json`) enumerating its contents:
`{ algorithms: [...], themes: [...] }`, each entry a name + an entry point. It's
authoritative: `xtyle add <pack>` reads it and reports everything declared, both
themes *and* algorithms. **No directory-scanning, no guessing**: the pack tells
you what's inside (manifest-as-source-of-truth, same as xript).

An entry's *kind* is the list it sits in, not a field on the entry — a second
spelling of the same fact can only ever disagree with the first. There is no
version pin on an entry either: the pack is an npm package, and its own version
is the pin.

Registration is the install. A pack's algorithms resolve because the project
declares the package, so `xtyle list` shows them and `xtyle derive -a <name>`
runs them through the same sandbox the blessed set uses; `xtyle derive --theme
<name>` re-derives a declared theme from its recipe. An id already taken keeps
its owner and the shadowing pack is reported, because an id is what a theme file
records — a marketplace cannot afford to change what an existing theme derives
quietly.

### Reference grammar: dispatch on shape

- `@scope/pkg` or a bare name → an npm package (default), `@version` pinning one
- `owner/repo` → a GitHub repo (git/tarball; "grab my repo" with no npm publish),
  `@ref` pinning a committish
- `./path`, `/path`, `C:\path`, or a `scheme://` / `file:` URL → local / remote tarball
- `@handle` (no slash) → an author, resolved to their packs through the index
- `<ref>#name` → *one* declared entry, selected by its **manifest name**,
  not a file path, so the selector survives the author reorganizing folders and
  works identically across npm / GitHub / tarball

`#` means the entry selector on every shape, which is why a GitHub committish sits
in the version position rather than in npm's own `owner/repo#ref` spelling; the
translation back happens at the install boundary and nowhere else.

### Reaching a pack from a browser

`@xtyle/core/host/remote` resolves the same references with no filesystem, which is
what lets the generator derive with any published algorithm rather than only the
bundled five. A browser cannot unpack a tarball, so a pack is read **file by file over a CDN**:
`npm/<pkg>` and `gh/<owner>/<repo>` on jsDelivr. Same manifest grammar as disk, same
precedence (a standalone `xtyle.json` wins over the `package.json` block), same
`#name` selector.

Two shapes read differently here than on disk, and deliberately:

- a **URL** is the *directory a pack is served from*, not a tarball; an archive
  extension is refused by name rather than fetched and failed
- a **path** has nothing to resolve against and says so, pointing at `@xtyle/core/host`

An entry that resolves outside its own pack is refused: a pack declares where its
files live, and one that climbs out is naming someone else's.

`fetchPackAlgorithmManifest` answers what an algorithm accepts straight off the
packaged mod manifest with **no sandbox boot**; listing a hundred packs must not
cost a hundred QuickJS runtimes, which is the whole reason the static block exists.

`packs/xtyle-pack-example` is a worked pack in this repo: two algorithms and a theme,
declared the way a published pack declares them. `npm run build:packs` bundles it and
stages it under the site's `public/`, so the Bench's **From a pack** tier has something
real to resolve and the path is exercised rather than described.

The two algorithms are deliberately different depths. `example-tinted` is a taste
vector: five numbers over the standard derivation, which is what most packs are.
`example-banded` is the one that matters for the premise: it runs its own pass after
`settle`, **declares four tokens of its own** through `adds`, and introduces a knob
(`bandLift`) with its own domain. That proves the open register and a novel knob from
a *third-party* pack, over the fetch path, rather than from inside this repo alone.
The Bench renders that knob's control from the pack's own `knobSpecs`, with no UI
entry anywhere for it.

### Discovery is an index *over* npm, not a host

Packs publish with the convention keyword `xtyle-pack`. The marketplace and
`xtyle search` are the same query over npm metadata (keyword / scope / maintainer),
so xtyle.dev is a **front-end over npm, not a hosted registry**, near-zero to run.
The index is a **pointer map**; npm / GitHub still serve the bytes. `searchPacks`
is environment-neutral for exactly this reason — the CLI and the site query one
index through one function.

### Author shorthand: `xtyle add @handle`

`@handle` (bare, no `/pkg`) resolves an *author* to their packs through the index,
derived from npm's own maintainer field. One pack is added; several are listed for
you to name, because installing an author's whole catalogue on one command is not
what anyone meant by it. For authors who span scopes or also distribute from
GitHub, an optional **profile manifest** (a JSON listing pack coordinates) would be
aggregated by the index — not built, and an addition to this rather than a
replacement for it. Disambiguation: `@handle` (no slash) = author; `@scope/pkg`
(with slash) = npm package.

### Trust gradient (since `add` spans data and code)

- **themes** are pure data (knobs + overrides) → pulling JSON, always safe
- **algorithm execution** (CLI build *or* browser generator) → runs in xript's
  zero-authority sandbox → safe even from a stranger
- **CLI `add`** is an *npm install* → normal supply-chain trust applies (postinstall
  scripts are not sandboxed). The sandbox protects at **run-time, not install-time**;
  be honest about that distinction.
- **who chose the address** is its own axis, and the browser path introduced it. A
  pack reference in a share link is resolved by `fetch` *in the page*, before any
  runtime exists — so opening someone's link reaches out to whatever origin that link
  names. The execution stays sandboxed and the distinction holds, but "the sandbox
  makes a stranger's algorithm safe" is a claim about **running** it, never about
  **fetching** it.

---

## The site: `apps/site` (xtyle.dev)

Astro, own chrome, **not** Starlight. Docs, examples, the marketplace, and the
**generator** (the tier-2 knob UX), which is just `xtyle` running client-side.
Frictionless precisely because of the TS-core call.

---

## The runtime is optional

Derivation is the work; applying a finished theme is not. Once an algorithm has
run, the output is plain CSS custom properties and the browser cascade does the
rest; the engine *can* run live, but nothing about consuming a finished theme
requires it.

- **Bounded, known-at-build theme set → pre-bake to CSS.** Switching is
  `document.documentElement.dataset.theme = '…'` against pre-built `[data-theme]`
  blocks; a ~15-line persist-plus-`prefers-color-scheme` helper is the *most* an
  app needs. No xtyle JS in the running app.
- **Unbounded / novel-at-runtime inputs → run `@xtyle/core` live in the browser.**
  Only three cases: user-authored themes (the generator itself), genuinely
  continuous derivation (frame-by-frame day/night or content-derived accents, and
  even most day/night collapses to pre-baked stops switched on a timer), and in-app
  live preview.

No `@xtyle/runtime`, no apply layer. The engine being browser-capable is a
capability you import, not a package you ship.

---

## The true minimum an app consumes

The **CSS artifact.** You can theme hand-rolled HTML with the tokens and never
install a xtyle package. Components are batteries-included sugar, not a
requirement.

---

## Other platforms (someday, and split by cost)

Token *emitters* (Flutter / XAML / WinForms / …) are cheap: another serializer
over the platform-neutral token graph + a thin read-the-artifact shim; do them
whenever. Interactive *components* per platform are expensive and stay
**web-first** for a long time. Keep the two roadmaps separate so the cheap one
isn't held hostage by the expensive one.

---

## The one discipline (a rule, not a package)

Don't rename a core token once anything consumes it: it breaks every theme and
every component at once. `xtyle`'s blessed token names are a **versioned
contract**: treat renames as breaking changes with a deprecation path. Costs
nothing now; brutal to retrofit.

---

## Deliberately NOT built

Killed as over-engineering. Each is either xript's job (algorithms-are-plugins),
a browser-mode of `xtyle`, or a documented snippet:

`@xtyle/algorithm-kit` · `@xtyle/validate` · `@xtyle/typegen` · `@xtyle/runtime` · a
standalone `@xtyle/cli` · a headless component core · a bespoke marketplace
registry.
