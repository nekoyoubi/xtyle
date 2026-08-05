# Component fragments (architecture)

xtyle's UI components render through xript **fragments**, so app authors can — via
sandboxed xript — replace a component's markup with a customized version, or build new
components on xtyle's theming. Built-in and app-authored fills are identical in kind:
the built-ins are xtyle's own mod-zero fills of the same slots an app fills. The only
privileged thing about a built-in is that it ships in the box.

This is not a xtyle invention. xript 0.8 ships a canonical fragment seam
(`slots` / `fills` / `bindings` / `handlers`, host API `createRuntime` → `loadMod` →
`fireFragmentHook` → `invokeExport`). xtyle **adopts** it; it builds no fragment runtime
of its own. See the xript `host-fragments` guidance.

## The seam

- **Slot** — host-declared plug-point, all of them in
  `packages/xtyle/src/elements/fragments/component-host.json`. One per component:
  `component.<name>`, `accepts: ["application/x-xtyle+html"]`, `multiple: false`, gated by a
  per-component `capability` (`xtyle.component.<name>`).
- **Fill** — a mod's contribution to a slot: `{ id, format, source, handlers?, meta? }`.
  The `id` is the **fragment id** the element drives (`"calendar"`, `"button"`), and it
  is the key the runtime registers hooks under.
- **Template** — the fill's `source`, an inert `application/x-xtyle+html` document. In practice a
  component's template is a bare scaffold (`<div data-root data-bar></div>`); everything
  else is drawn by the hook. **No logic, no iteration** in the template. xtyle does not
  use xript's declarative binding attributes (`data-bind` / `data-if`): the host never
  calls `updateBindings`, so every painted node comes from a hook's ops.
- **Handlers** — `{ selector, on, handler }`. On a matching DOM event the host calls
  `invokeExport(handler, [payload, context])`; the author's code runs in the sandbox,
  never in the page. The host serializes the event to JSON (tagName, dataset,
  value/checked, trimmed text, key) before it crosses.

## Rendering loop (host-owned)

The trusted element host owns the DOM and the state. `FragmentHost`
(`packages/xtyle/src/elements/fragment-host.ts`) drives one fill against one element's
root. Per change:

1. `fireFragmentHook(fragmentId, "mount" | "update", bindings)` → `FragmentOp[]` — a
   command buffer (`replaceChildren` / `toggle` / `addClass` / `removeClass` / `setText`
   / `setAttr`). The host applies each op in order against the painted scaffold.
2. A handler that fires returns a **`FragmentIntent`** — a serializable record
   (`select`, `focus`, `preventDefault`, `emit`, `toggleChecked`, …) — and the host
   applies it: calls `.focus()`, updates element state, fires the component's
   `CustomEvent`. `FragmentOp` has no `focus` verb, so anything that moves focus or
   selection goes through an intent. Logic in the sandbox; DOM effects in the host.

State lives in the host (the reducer loop is host-side, not a mod export). The host never
calls the runtime's internal `processFragment`; it drives the runtime and applies the
inert output.

### Iteration → a `replaceChildren` hook

The template can't loop. A list component (Tabs, Tree, Menu, Select, Calendar, …) ships a
hook that, given the bound array, computes the children markup and emits
`{ op: "replaceChildren", selector, value }`. The hook is a sandbox export; list markup is
logic and stays in the sandbox. Static components (Button, Badge) ship a hook too — every
component does, because the ops are the only paint path — but theirs is a one-liner.

`<xtyle-table>` is **not** in this list. It decorates the author's own `<table>` in place
rather than rendering one, so there is nothing for a fill to draw.

## Writing a fill

A fill is an ordinary xript mod: a manifest, an inert template, and a script.

```
my-calendar/
├── mod.manifest.json
├── calendar.html      # the inert scaffold
└── mod.js             # hooks + handler exports (must be pre-bundled: one IIFE, no imports)
```

```json
{
  "$schema": "https://xript.dev/schema/mod-manifest/v0.8.json",
  "xript": "0.8",
  "name": "acme-calendar",
  "version": "1.0.0",
  "capabilities": ["xtyle.component.calendar"],
  "entry": { "script": "mod.js", "format": "script" },
  "fills": {
    "component.calendar": [
      { "id": "calendar", "format": "application/x-xtyle+html", "source": "calendar.html" }
    ]
  }
}
```

```js
hooks.fragment.mount("calendar", (bindings, ops) => {
	ops.replaceChildren("[data-calendar]", chips(bindings));
});
hooks.fragment.update("calendar", (bindings, ops) => {
	ops.replaceChildren("[data-calendar]", chips(bindings));
});
```

The `id` **must** be the component's fragment id, and the markup must keep the marker
attributes the element binds behavior to (`data-date`, `data-nav`, `data-body`, …). Those
markers are the fill contract: rename one and the chrome survives but the behavior does
not. Where a component's markers are non-obvious, the built-in fill documents them in its
`fills[].meta.markers` (see `fragments/calendar/mod.manifest.json`).

### Installing it

There is **no install path** yet — no `xtyle add`, no directory scan for component fills,
no `<script type="xtyle-mod">` discovery. An app loads a fill by calling the host directly:

```ts
import { loadFill } from "@xtyle/core/elements/fragment-host.js";

await loadFill(manifest, {
	"calendar.html": "<div class=\"acme-cal\" data-root data-calendar></div>",
	"mod.js": bundledModSource,
});
```

`fragmentSources` is a plain `Record<filename, source>` — no filesystem is touched, which
is how the built-ins ship (`fragments/<id>/source.generated.ts`, generated by
`scripts/build-fragments.mjs` off a scan of the `fragments/` directory). `loadFill` is a
deep import; it is not re-exported from `@xtyle/core/elements`.

## Precedence — what actually happens today

**Last mod loaded wins, and xtyle's own fill is always loaded first.** That is the whole
rule. `priority` is not read, and `resolveSlotSingle` is never called.

Every fill — built-in and override alike — loads into **one shared runtime** created from
`component-host.json`. Fragment hooks register by fragment id and handler exports register
by name into a single shared table, so a second mod registering `"calendar"` displaces the
first. (Built-in handler exports are namespaced `<id>__<name>` at build time so components
can't clobber each other's handlers; an override replacing a built-in handler
*implementation* must register the prefixed name itself.) The runtime then concatenates
every registered mod's ops for a hook in registration order and applies them in sequence, so
the last-registered fill's ops are the ones the DOM ends up with. Precedence *is* load order.

Which makes load order the host's problem, not the app's. Left alone the built-in fill loads
lazily, on an element's first paint — *after* an app that installed its override at boot,
which would then be silently clobbered the moment the first instance rendered. So `loadFill`
resolves mod-zero first: it reads the slots a manifest fills, pulls xtyle's own fill for each
of them in ahead of it (`elements/built-in-fills.ts` maps every `component.*` slot to its
built-in behind a dynamic `import`, so a page that installs no mod never pays for the table),
and only then loads the manifest itself. The built-in therefore always holds registration
index 0 for its slot, and an app can install its overrides whenever it likes — including at
boot, before a single element has upgraded, which is the only moment an app can reliably
arrange. `loadedFillNames()` reports the loaded fills in registration order, lowest
precedence first.

A fill that lands *after* its component already painted repaints the mounted hosts for its
fragment id, so a lazily installed mod reaches the screen immediately rather than waiting for
the component's next state change (which, on a component that never changes, is never).

## What an override can and cannot do

**Can:**

- Throw away the component's entire inner structure. `test/calendar.mod-override.test.ts`
  replaces the month `<table>` with a flat row of `<button>` chips — no table, no
  `role="grid"`, no weekday header — and the element's keyboard grid, range machine, month
  steps, and roving tab stop all still work, because they bind to the fill's markers.
- Replace the implementation of a handler the built-in already declares.
- Declare the tokens it consumes in `fills[].meta.tokens`.

**Cannot (today):**

- **Replace the scaffold root.** `FragmentHost` is constructed with the *element's* built-in
  manifest and sources, so the painted template is always the built-in's `<id>.html`. An
  override's own `source` is loaded into the runtime but never painted. In practice the
  scaffolds are near-empty, so this bites rarely — but the root element, its classes, and
  its `part` are not yours.
- **Add interactive chrome.** Handler declarations are collected from the *built-in*
  manifest, so `{ selector, on, handler }` entries in an override's manifest are never
  wired. New buttons a fill draws get no events unless they match a selector the built-in
  already declares.
- **Extend the intent vocabulary.** The host applies a closed `FragmentIntent` union.
- **Change what SSR renders.** `fragment-ssr.ts` holds a static map of the built-in
  manifests, so Astro's build-time render always paints the built-in; an override only
  takes effect in the browser, replacing that markup on its first mount.
- **Fill more than one component per manifest.** `fillSource()` returns the first fill that
  has a `source`, whatever its `id`, and `collectHandlers()` unions handlers across every
  fill in the manifest. One mod manifest = one component fill.

## The sanitize floor — what a fill may actually paint

A hook returns markup as a *string*, and that string does not go straight into the DOM.
xript's host code (`finalizeOps`) sanitizes every op value against the profile of the
format the fill declares: `replaceChildren` markup goes through the vocabulary, and any
prop carrying a URL sink goes through the scheme allowlist. This runs in host code, after
the sandbox and before the paint, and a refused element or attribute is **dropped without
an error**.

Both halves of that profile are declared in `component-host.json`:

```json
"formats": {
  "application/x-xtyle+html": {
    "syntax": "html",
    "schemes": ["http", "https", "mailto", "tel", "data"],
    "vocabularies": ["xtyle.components", "html"]
  }
}
```

- **`vocabularies`** is why a fill may paint `<xtyle-badge tone="danger">` and may not paint
  `<script>`, `<iframe>`, an `onclick=`, or somebody's undeclared `<my-widget>`. It is also
  what makes `<xtyle-markdown allow-html>` defensible: the option lifts *xtyle's* escaping,
  and this floor is still underneath it.
- **`schemes`** is the URL allowlist. Declaring it **replaces** xript's default set rather
  than extending it, and omitting the key inherits that default — which is
  `http`/`https`/`mailto`/`data`, with **no `tel`**.

**The trap, which has already cost us once.** There are two allowlists between a URL and the
DOM: the markup renderers' (`markup/markdown.ts` and friends) and this one. They are
separate lists, this one runs last, and it fails silently. `tel:` was permitted by the
renderer, documented in the manifest, asserted by a renderer-level test, and *still* stripped
in every paint, because the format declared no `schemes` and quietly inherited a set without
it. Nothing was red.

Two rules fall out of that:

- **Assert at the paint, not at the renderer.** A test that renders a string and inspects it
  proves nothing about what the component puts on screen. `markdown.element.test.ts` walks
  every scheme the renderer allows through a real element for exactly this reason.
- **Widen both lists at once, or neither.** `allowUriSchemes()`
  (`packages/xtyle/src/elements/uri-schemes.ts`) is the only supported way to add a host
  protocol like `asset:` — it writes the renderer's registry *and* this `schemes` array, and
  it throws if called after the runtime has read the manifest, because a half-applied
  security decision is worse than a refused one. Nothing is added on an app's behalf.

### Registering a component is three gates, not two

The floor above is also a **registration obligation**, and it is the half of the checklist
that gets forgotten. A new component is reachable by mods only once all three of these exist
in `component-host.json`, and each one fails in a different register:

| gate | what it grants | how a missing one looks |
|---|---|---|
| the **slot**, `component.<name>` | a fill has somewhere to land | there is nothing to fill; an override is inert |
| the **capability**, `xtyle.component.<name>` | the mod's declaration is grantable | the mod is refused, surfacing as a wasm/CSP-shaped load error rather than a named missing capability |
| the **vocabulary node**, `xtyle.components.nodes["xtyle-<name>"]` | any fill may *emit* the element | the tag is dropped from the paint with **no error at all** |

The first two are what the checklist feels like; the third is the only one that is silent,
which is why it is the one that slips. A component can hold a slot, a capability, a built-in
fill, a full manifest and a green suite, and still be the one component of the set that no
mod can put on screen — the sanitize floor strips every `<xtyle-…>` a fill tries to emit,
exactly as designed, because the vocabulary never heard of it.

A node also declares the props the tag accepts, and any prop carrying a URL needs its `sink`
(`uri` for a link, `image-uri` for a source, `css` for `style`). Miss the sink and the
element survives while that one attribute vanishes — the same silence, one level down.

**And a node that declares only *some* of its props is the commoner miss.** Nothing about it
looks wrong: the tag paints, the demo works, the suite is green, because the author's own
markup never passes through the sanitize floor. It is only a *mod* composing the component
that watches half its configuration quietly not arrive. `reveal` shipped 7 of its 45
attributes this way. So the obligation is every attribute the element observes, not the
handful the first draft happened to need.

`component-host.test.ts` holds the three gates: every slot names a capability, every markup
slot has a built-in fill that holds it, every `component.*` slot has a matching node, and
every `src`/`href`/`poster` prop carries a sink. `component-vocabulary.test.ts` holds the
fourth obligation, comparing each registered element's `observedAttributes` against the props
its node declares — the check that turns the silent gate into a failing one.

### The data slots — contributing values rather than markup

Not every contribution is a fill of markup. Four slots take a JSON payload instead, and each
is backed by a registry with the same last-wins-on-the-name contract fills have:

| slot | contributes | registry |
|---|---|---|
| `xtyle.icons` | glyph bodies on the 24×24 grid | `registerIcons` / `registerIconFills` |
| `xtyle.icon-primitives` | named point lists for `poly` / `polyline` | `registerIconShapes` / `registerIconShapeFills` |
| `xtyle.reveal-shapes` | `clip-path` silhouettes with an optional grip inset | `registerRevealShapes` / `registerRevealShapeFills` |
| `xtyle.pack-meta` | pack metadata | — |

Each pair is deliberate. The bare `register*` takes values directly, which is what a page or a
test wants; the `register*Fills` reads them out of a mod manifest's `fills` block, which is
what a *host* calls when it loads a mod — so a contribution can be **declared** rather than
executed, validated by the toolchain, and gated by the capability the slot names. A registry
reachable only by running code is half a surface: nothing can check it before it runs.

Each also has a `reset*()` that returns the registry to its built-ins, for a host teardown and
so one test's registration cannot leak into the next.

## The capability model — what it actually grants

Each slot names a capability (`xtyle.component.button`), and a mod must declare that
capability to fill that slot: xript's grant gate is default-deny.

But the grant is **all-or-nothing**. The component runtime is created with *every*
`xtyle.component.*` capability granted, so any mod loaded through `loadFill` may fill any
component slot it declares. There is no per-mod narrowing, no consumer-facing prompt, and
no way to grant a mod `component.button` but withhold `component.dialog`. Declaring is
getting.

What the sandbox does buy is real: a fill runs with `hostBindings: {}` — no DOM, no
network, no host API. It returns inert markup strings and serializable intents, and the
trusted host performs every mutation. DOM events are flattened to JSON before they cross
the boundary.

## The coverage leash

Built-in fills declare the tokens they consume in `fills[].meta.tokens`. Be clear about
what that is worth today: **nothing checks it.** The `xtyle coverage` command and
`coverComponent()` read `consumedTokens` off the *component* manifest
(`packages/xtyle/src/manifest/<id>.manifest.ts`), not off any fill. So a fill's token
declaration is documentation, and an override's token needs are not coverage-checked at
all. Wiring the fill's `meta` into the coverage check is the open work; the metadata is
there and correct in the meantime.

## Build / runtime split (mirrors the rest of xtyle)

- **Astro (build-time):** drive the runtime in Node at build, emit the resolved markup — as
  a declarative shadow root (`renderFragment`) or as light DOM against the global component
  sheet (`renderFragmentLight`). Zero browser runtime for a static default.
- **Svelte / html (runtime):** drive the runtime in the browser (the QuickJS the runtime
  already embeds for algorithms), render immediately, wire handlers. When SSR already
  painted the scaffold, the first apply runs as an `update`, not a structure-destroying
  `mount`.

If the runtime fails to load — a CSP blocking wasm, a blocked asset fetch — the host marks
the element `data-xtyle-fill-error` and logs one attributed diagnostic per page.
Server-rendered content survives; only the client-only render path needs the runtime.
