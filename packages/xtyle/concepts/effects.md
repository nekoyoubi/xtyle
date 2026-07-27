# Effects

A token is a value and a component is a thing; an **effect** is a *verb* — a visual
behavior applied to any element under a condition. Neither of the other two can hold
one: a token cannot say "on hover", and a component cannot decorate an element that
already exists without wrapping it. So an effect is its own kind, addressed the way an
icon name is: a name that is its own spec, written in a `data-fx` attribute.

## The spec string

```
{effect}[@{condition}][?{key}:{value},{key}:{value}…]
```

```html
<span   data-fx="throb">                     <!-- no condition: ambient -->
<a      data-fx="glow@hover">
<button data-fx="glare@hover lift@active">   <!-- space-separate several -->
<div    data-fx="glow@hover?spread:18">      <!-- one param, the rest default -->
<span   data-fx="throb?rate:3s,colors:[accent,accent-2]">
```

- No condition means **ambient** (always on).
- Parameters are **named**, after a `?`, comma-separated, in any order and any subset.
- A **bracketed list** fans out to a related group: `colors:[accent,accent-2]` fills
  `color` and `color-alt`.
- A value is a **hex** (`#fff`), a **bare number** that takes the parameter's unit
  (`315`→`315deg`, `3`→`3s`), or a **token name** resolved to `var(--name)` so it stays
  theme-reactive (`accent2` finds `--accent-2`).

## It needs no runtime

`[data-fx~="glow@hover"]:hover` is a plain attribute selector, so the layer is a
stylesheet emitted once (`effectsCss()`); consuming an effect never requires the engine
to be running, exactly as consuming a derived theme does not. `baseCss()` emits it after
components so a `data-fx` rule outranks a component's own declaration at equal
specificity. The one exception is `reveal`, which needs an observer to know when an
element enters the viewport — and it is built so the absence of that runtime can never
hide content.

## Intensity is the algorithm's policy

Every effect composes from the same shared tokens rather than hardcoding numbers, so
intensity is the algorithm's taste, not a per-component guess:

- `--fx-intensity` — the master dial; `0` disables the whole layer
- `--fx-color` — the primary color (from `--accent`)
- `--fx-color-alt` — the second hue a `throb` travels toward (from `--accent-2`)
- `--fx-duration` — the base timing (from `--duration-base`)
- `--fx-ease` — the base easing (from `--ease-standard`)

`xtyle-hc` sits at `--fx-intensity: 0` on purpose: a halo, a lift, and a wash all spend
edge contrast, the one thing a high-contrast taste exists to protect. These are ordinary
tokens on the open register, so a theme dials them with an override and needs no knob,
and an element can re-point one inline (`style="--fx-color: var(--pink)"`).

## The shipped set

`glow` (a halo), `throb` (a slow pulse between two hues), `glare` (a sweeping sheen),
`lift` (a small rise with a shadow), `tint` (a color wash), `frost` (a backdrop blur),
`reveal` (fades in when armed), `shake` (a short error nudge), and `saturate` (a
vividness bump; `amount:0` is grayscale, honored exactly on every theme).

Conditions: `hover`, `focus`, `active`, `checked`, `disabled`, `open`, `invalid`,
`armed` (plus the ambient no-condition form).

Every effect that moves is wrapped in a `prefers-reduced-motion: reduce` guard, so that
policy is decided once by the library rather than by every adopter who remembers.

## It is extensible

`registerEffect` and `registerCondition` are **last-wins on the name**, built-ins first.
An addon that names `glow` replaces it; one that names `sparkle` extends the set. Neither
restates the rest — the same registration contract fragment fills use.

```ts
import { registerEffect, registerCondition } from "@xtyle/core";

registerEffect({ name: "sparkle", active: "outline:1px dashed var(--fx-color)" });
registerCondition({ name: "dragging", selector: "[data-dragging]" });
// `sparkle@dragging` now works, and so does `glow@dragging`
```

Query the live set through the MCP `xtyle_effects` tool (the catalog, or one effect's
params), or in code via `listEffects()` / `listConditions()` / `EFFECT_TOKENS`. A
binding can expand a parameterised spec to inline properties at build or SSR with
`fxStyle(spec)` / `fxStyleAttr(spec)`, so the parameters cost no runtime JavaScript.
