# xoji repo layout

Settled 2026-06-17. Monorepo. This is the deliberately-slim shape; read
`derivation-model.md` for *why* the pieces are what they are.

---

## Shape

- **Monorepo.** npm workspaces, `@xoji` npm scope, a `version:bump` + `release`
  script pair (no changesets). One shared version across the whole spread: every
  `@xoji/*` package bumps together, cut at the start of a development cycle via
  `/start`, never package-by-package.
- **TS/JS-dominant, no Rust of consequence.** The heavy runtime is xript's
  (rquickjs); xoji carries at most a thin deferred QuickJS-free shim, and that's
  YAGNI. This keeps it far lighter than a full Tauri desktop repo; lean into that.
- **OSS, like xript.**

---

## Directory layout

Top-level is settled; file-level internals are illustrative first-cut (no engine
code yet).

```
xoji/
├── packages/
│   ├── xoji/                 # the engine + raw custom elements: published as `@xoji/core` (CLI `xoji`, browser API, `@xoji/core/elements`)
│   ├── svelte/               # @xoji/svelte: thin Svelte wrapper
│   └── astro/                # @xoji/astro: Astro components (the site's binding)
├── algorithms/               # the built-in blessed set, each its own xript plugin
│   ├── xoji-default/
│   ├── xoji-hc/
│   ├── xoji-quiet/
│   ├── xoji-loud/
│   └── nxi-nite/
├── apps/
│   └── site/                 # xoji.dev: Astro (docs, examples, marketplace, generator)
├── docs/                     # internal design record (these files)
├── scripts/                  # version:bump · release  (xript-style release mechanics)
├── .github/workflows/ci.yml  # frontend + site build + docgen; no Rust (CI policy)
├── .gitignore · LICENSE · CONTRIBUTING.md · CLAUDE.md · README.md
├── package.json              # private workspace root: npm workspaces + scripts
└── tsconfig.base.json
```

Three homes by *kind*: `packages/` (publishable libs), `algorithms/` (built-in
xript plugins: assets, not lib code), `apps/` (the site). `docs/` is the internal
design record; the *website's* user docs live in `apps/site`.

The engine, where the dual-entry discipline becomes physical:

```
packages/xoji/
├── src/
│   ├── index.ts      # neutral public API: derive(), emit(), types, no fs/path/process
│   ├── graph.ts      # the open token graph: topo resolve + cycle detection
│   ├── host.ts       # xript host glue: load + run an algorithm plugin
│   ├── resolve.ts    # algorithm resolution (installed dep / on-demand fetch)
│   ├── coverage.ts   # coverage check: consumed vs produced tokens
│   ├── emit/         # serializers, open set: css · json · json5 · yaml · xml
│   ├── gauntlet.ts   # per-algorithm invariant prover
│   ├── dom.ts        # browser-only: apply/switch/persist  (exports["./dom"])
│   └── cli.ts        # node-only shell: argv + fs  (the bin)
├── test/ · package.json (name "xoji"; bin + exports) · tsconfig.json
```

A built-in algorithm (the blessed set bundles into `@xoji/core`; a standalone
flavor pack is the same manifest + mod, plus its own `package.json`, in its own repo):

```
algorithms/xoji-default/
├── mod-manifest.json # xript mod manifest, knobs as inputs, capabilities: none
├── src/preset.ts     # the algorithm's posture: anchors + knob defaults
├── src/mod.ts        # the mod entry: defineXojiAlgorithm(preset), importing core by name
└── src/mod.js        # esbuild-bundled, self-contained mod the host runs
```

**Day one** (to claim the npm name) is a thin slice: `packages/xoji/`, one or two
`algorithms/xoji-*`, `docs/`, root config. `apps/site` and the component packages
grow in after.

---

## Algorithms are xript plugins: the keystone

A xoji algorithm is *literally* a **xript plugin (addon)**: a manifest + xript
code, its knobs declared as the plugin's inputs, sandboxed by xript's capability
model, distributed like any xript addon. This is the single biggest simplifier in
the whole project:

- xoji builds **no** validate / typegen / docgen / scaffold / sandbox tooling;
  that's xript's, for free. `xript validate` runs against an algorithm;
  `@xriptjs/init` scaffolds one.
- The **marketplace is xript-addon distribution** + a discovery index, not a
  bespoke registry.
- Algorithms are **pure and sandboxed by construction**: running a stranger's
  algorithm is safe because it's a xript plugin with zero ambient authority.

---

## Packages (the whole list)

- **`@xoji/core`**: the engine, and the flagship. Pure derivation over the open
  token graph: a xript host that runs an algorithm-plugin over
  `(knobs + constraints)` → a token graph, then emits artifacts (css / json /
  json5 / yaml / xml, an *open* emitter set). Ships a **CLI bin** *and* an
  importable API from the one package; see the dual-entry seam below.
- **`@xoji/core/elements`** *(optional)*: single-layer raw custom elements (a subpath of `@xoji/core`), styled only against the tokens they declare they consume. The element *is*
  the component; **no headless tier beneath it.**
- **`@xoji/svelte`** *(optional)*: thin wrappers that skin the custom elements for
  Svelte.
- **`@xoji/astro`** *(optional)*: Astro components over the same contract; the
  binding the site itself consumes. More framework skins follow as wanted.
- **Algorithms**: the built-in blessed set, all `xoji-*` (`xoji-default`,
  `xoji-hc`, `xoji-quiet`, `xoji-loud`, …), as xript plugins in the repo. Ships out
  of the box, the initial seed of the marketplace. Personal / community **flavor
  packs** (an author's own brand-prefixed set) are *separately published* addons,
  **not** bundled in core. The split is **brand/role, not authorship**: the same
  hands may write both; `xoji-*` wears the project's neutral brand and ships as the
  default floor, while a `<brand>-*` pack wears a personal brand and ships as an
  optional pull-down. Keeps the tool's face brand-neutral without anyone giving up
  their own flavors.

---

## The dual-entry seam: one package, CLI + importable API

`@xoji/core` ships a **`bin`** (build-time) and an **`exports`** API (importable
anywhere) from the one package: the standard `vite` / `esbuild` / `tsup` shape,
not a wart.

```jsonc
// packages/xoji/package.json
{
  "name": "@xoji/core",
  "bin": { "xoji": "./dist/cli.js" },   // build-time only
  "exports": {
    ".":     "./dist/index.js",         // the engine: neutral, importable anywhere
    "./dom": "./dist/dom.js"            // optional apply-to-DOM helper, browser
  }
}
```

The one discipline that makes it clean: **the engine is environment-neutral; the
CLI is a thin Node shell over it.**

- `import { derive, emit } from '@xoji/core'` → pure functions
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

- **Static app** → `@xoji/core` is a **devDependency**; the CLI emits CSS at build,
  the app ships only that CSS (+ optional components). Zero `@xoji/core` in the bundle.
- **Live-derivation app** → `@xoji/core` is a real **dependency**, bundled, `derive`
  running client-side alongside the xript runtime.

Same package both times; dev-only vs shipped is just whether you need
novel-at-runtime themes. One package, two hats: `xoji derive` (the CLI bin) and
`import { derive } from '@xoji/core'` are the same tool.

---

## Pulling algorithms down: CLI and site share one path

Because an algorithm is just a xript plugin (a package), consuming an arbitrary
*published* one is cheap and identical across surfaces. This is the marketplace
consumption path, and it's a first-class capability, not an afterthought:

- **CLI** resolves an algorithm by reference: an installed dependency (normal npm
  resolution from `node_modules`), or fetched on demand (`xoji add <algo>` /
  auto-resolve from the registry), then handed to the xript host to run.
- **Site generator** fetches the plugin from a CDN at runtime (unpkg / jsDelivr /
  esm.sh-style) and loads it into the in-browser xript host, so a user can pick
  *any* published algorithm, not just the bundled `xoji-*` set, and derive live.

xoji builds **no registry**: the marketplace is npm + a discovery index, resolution
is npm/CDN, instantiation is xript's addon loader. Fetch-and-run of a stranger's
algorithm is safe because it's a **zero-authority pure plugin** (xript
capabilities), the same property that makes the marketplace trustworthy.

The resolve → load → run shape is settled; the reference-grammar details are in
`open-questions.md` #10.

---

## Discovery & resolution

### The unit is a manifest-declared pack

A pack (npm package or GitHub repo) carries an **xoji manifest** (an `xoji` field
in `package.json`, or a top-level `xoji.json`) enumerating its contents:
`{ algorithms: [...], themes: [...] }` with name / kind / entry point. It's
authoritative: `xoji add <pack>` reads it and registers everything declared, both
themes *and* algorithms. **No directory-scanning, no guessing**: the pack tells
you what's inside (manifest-as-source-of-truth, same as xript).

### Reference grammar: dispatch on shape

- `@scope/pkg` → an npm package (default, versioned)
- `owner/repo` → a GitHub repo (git/tarball; "grab my repo" with no npm publish)
- `./path` or a URL → local / remote tarball
- `<ref>#name` → register *one* declared entry, selected by its **manifest name**,
  not a file path, so the selector survives the author reorganizing folders and
  works identically across npm / GitHub / tarball

Bare ref registers all; `#name` registers one.

### Discovery is an index *over* npm, not a host

Packs publish with a convention keyword (`xoji-algorithm` / `xoji-pack`). The
marketplace and `xoji search` are queries over npm metadata (keyword / scope /
maintainer), so xoji.dev is a **front-end over npm, not a hosted registry**,
near-zero to run. The index is a **pointer map**; npm / GitHub still serve the
bytes.

### Author shorthand: `xoji add @handle`

`@handle` (bare, no `/pkg`) resolves an *author* to their packs through the index.
Leanest path: derive it from the author's npm scope / maintainer. For authors who
span scopes or also distribute from GitHub, an optional **profile manifest** (a
JSON listing pack coordinates) is aggregated by the index. Disambiguation: `@handle`
(no slash) = author profile; `@scope/pkg` (with slash) = npm package.

### Trust gradient (since `add` spans data and code)

- **themes** are pure data (knobs + overrides) → pulling JSON, always safe
- **algorithm execution** (CLI build *or* browser generator) → runs in xript's
  zero-authority sandbox → safe even from a stranger
- **CLI `add`** is an *npm install* → normal supply-chain trust applies (postinstall
  scripts are not sandboxed). The sandbox protects at **run-time, not install-time**;
  be honest about that distinction.

---

## The site: `apps/site` (xoji.dev)

Astro, own chrome, **not** Starlight. Docs, examples, the marketplace, and the
**generator** (the tier-2 knob UX), which is just `xoji` running client-side.
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
  app needs. No xoji JS in the running app.
- **Unbounded / novel-at-runtime inputs → run `@xoji/core` live in the browser.**
  Only three cases: user-authored themes (the generator itself), genuinely
  continuous derivation (frame-by-frame day/night or content-derived accents, and
  even most day/night collapses to pre-baked stops switched on a timer), and in-app
  live preview.

No `@xoji/runtime`, no apply layer. The engine being browser-capable is a
capability you import, not a package you ship.

---

## The true minimum an app consumes

The **CSS artifact.** You can theme hand-rolled HTML with the tokens and never
install a xoji package. Components are batteries-included sugar, not a
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
every component at once. `xoji`'s blessed token names are a **versioned
contract**: treat renames as breaking changes with a deprecation path. Costs
nothing now; brutal to retrofit.

---

## Deliberately NOT built

Killed as over-engineering. Each is either xript's job (algorithms-are-plugins),
a browser-mode of `xoji`, or a documented snippet:

`@xoji/algorithm-kit` · `@xoji/validate` · `@xoji/typegen` · `@xoji/runtime` · a
standalone `@xoji/cli` · a headless component core · a bespoke marketplace
registry.
