# Component fragments (architecture)

xtyle's UI components render through xript **fragments**, so app authors can — via
sandboxed xript — replace a component's markup with a customized version, or build new
components on xtyle's theming. Built-in and app-authored fills are identical in kind:
the built-ins are xtyle's own mod-zero fills of the same slots an app fills. The only
privileged thing about a built-in is that it ships in the box.

This is not a xtyle invention. xript 0.7 ships a canonical fragment seam
(`slots` / `fills` / `bindings` / `handlers`, host API `createRuntime` → `loadMod` →
`fireFragmentHook` → `invokeExport`). xtyle **adopts** it; it builds no fragment runtime
of its own. See the xript `host-fragments` guidance.

## The seam

- **Slot** — host-declared plug-point, all of them in
  `packages/xtyle/src/elements/fragments/component-host.json`. One per component:
  `component.<name>`, `accepts: ["text/html+jsml"]`, `multiple: false`, gated by a
  per-component `capability` (`xtyle.component.<name>`).
- **Fill** — a mod's contribution to a slot: `{ id, format, source, handlers?, meta? }`.
  The `id` is the **fragment id** the element drives (`"calendar"`, `"button"`), and it
  is the key the runtime registers hooks under.
- **Template** — the fill's `source`, an inert `text/html+jsml` document. In practice a
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
rather than rendering one, so there is nothing for a fill to draw. (A `component.table`
slot is nevertheless declared in `component-host.json` today with no fill behind it — a
dead slot, being resolved.)

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
  "$schema": "https://xript.dev/schema/mod/v0.7.json",
  "xript": "0.7",
  "name": "acme-calendar",
  "version": "1.0.0",
  "capabilities": ["xtyle.component.calendar"],
  "entry": { "script": "mod.js", "format": "script" },
  "fills": {
    "component.calendar": [
      { "id": "calendar", "format": "text/html+jsml", "source": "calendar.html" }
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
