# Component fragments (architecture)

xtyle's UI components render through xript **fragments**, so app/site authors can —
via sandboxed xript — enhance a component through slots, replace its markup with a
customized version, or build entirely new components on xtyle's theming. Built-in and
app-authored components are identical in kind: the built-ins are xtyle's own mod-zero
fills of the same slots an app fills. The only privileged thing about a built-in is
that it ships in the box.

This is not a xtyle invention. xript 0.7 ships a canonical fragment seam
(`slots` / `fills` / `bindings` / `handlers`, host API `createRuntime` → `loadMod` →
`updateBindings` / `fireFragmentHook` → `invokeExport`). xtyle **adopts** it; it builds
no fragment runtime of its own. See the xript `host-fragments` guidance.

## The seam

- **Slot** — host-declared plug-point. xtyle declares one per component:
  `component:<name>`, `accepts: ["text/html+jsml"]`, gated by a per-component
  `capability` (`xtyle.component.<name>`).
- **Fill** — a mod's contribution to a slot. A component fill is `{ id, format,
  source, bindings, handlers, priority, meta }`. The built-in default is the
  lowest-priority fill (mod-zero); an app override is a higher-priority fill of the
  same slot. `resolveSlotSingle(slotId)` returns the winner — the resolution seam
  (`instance > app type > baked default`) is just fill priority.
- **Template** — the fill's `source`, an inert `text/html+jsml` document.
  `data-bind="<name>"` sets text/values, `data-if="<expr>"` toggles visibility. **No
  logic, no iteration** in the template.
- **Handlers** — `{ selector, on, handler }`. On a matching DOM event the host calls
  `invokeExport(handler, [payload])`; the author's code runs in the sandbox, never in
  the page. The host serializes the event to JSON (tagName, dataset, value/checked,
  trimmed text) before it crosses.

## Rendering loop (host-owned)

The trusted element host owns the DOM and the state. Per change:

1. `updateBindings(data)` → `{ fragmentId, html, visibility }[]` — host-side binding
   resolution, **no sandbox cost**. This covers static components entirely.
2. `fireFragmentHook(fragmentId, lifecycle, bindings)` → `FragmentOp[]` — a command
   buffer (`toggle` / `addClass` / `removeClass` / `setText` / `setAttr` /
   `replaceChildren`). The host applies each op in order. **This runs sandbox code**
   (the hook), so only components that need it pay for it.

State lives in the host (the reducer loop is host-side, not a mod export). The host
never calls the runtime's internal `processFragment`; it drives the runtime and
applies the inert output.

## Two findings that shape every component

### Iteration → a `replaceChildren` hook

The template can't loop. A list component (Tabs, Tree, Table, Menu, Select) ships a
**hook** that, given the bound array, computes the children markup and emits
`{ op: "replaceChildren", selector, value }`. The hook is a sandbox export; list
markup is logic and stays in the sandbox. Static components (Button, Badge) need no
hook — bindings + `data-if` suffice.

### Focus / keyboard → a returned intent

`FragmentOp` has no `focus`. Behavior that moves focus or selection (arrow-key tab
nav, roving tabindex, manual vs automatic activation) lives in a sandbox handler that
**returns a serializable intent** — `{ select?, focus?, preventDefault?, emit? }` —
and the host applies it (calls `.focus()`, updates state, fires the component's
`CustomEvent`). The intent protocol is xtyle's thin, consistent layer over the
canonical handler-dispatch seam. Logic in the sandbox; DOM effects in the host.

## The coverage leash

A fill declares the `--code-*`-style tokens it consumes in its `meta` (xript fills
tolerate extra keys; the runtime only polices "slot exists + capability held"). xtyle's
existing coverage check reads that metadata — it is a *separate* leash from xript's
`capability` (which is a default-deny grant gate: "may this mod fill the slot"). Both
are kept: capability gates the fill, coverage validates the tokens.

## Build / runtime split (mirrors the rest of xtyle)

- **Astro (build-time):** drive the runtime in Node at build, emit the resolved
  shadow as a declarative shadow root. Zero browser runtime for a static default.
- **Svelte / html (runtime):** drive the runtime in the browser (the QuickJS the
  runtime already embeds for algorithms), render immediately, wire handlers.

## Default fill authoring

A built-in's existing `*Markup()` function becomes the fill's template (the static
scaffold) plus, for list components, the hook that emits its `replaceChildren`. The
element stops owning a hardcoded `template()`; it drives the fragment host against its
slot and applies what comes back.
