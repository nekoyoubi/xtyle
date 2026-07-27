# Effects

A **token** is a value. A **component** is a thing. An **effect** is a *verb* — a visual behavior applied
to an element under a condition — and neither of the other two can hold one. A token cannot say "on
hover"; a component cannot decorate an element that already exists without wrapping it. So an effect is
its own kind, and it is addressed the way an icon name and a theme recipe already are: **a name that is
its own spec**.

```
{effect}[@{condition}][?{key}:{value},{key}:{value}…]
```

```html
<span   data-fx="throb">                      <!-- no condition: ambient -->
<a      data-fx="glow@hover">
<button data-fx="glare@hover lift@active">
<div    data-fx="tint@checked frost@disabled">

<span   data-fx="throb?rate:3s,colors:[accent,accent-2]">
<a      data-fx="glare@hover?angle:315,rate:100ms,color:#fff">
<div    data-fx="glow@hover?spread:18">        <!-- one param, the rest default -->
```

## The three properties that matter

**It emits CSS and needs no runtime.** `[data-fx~="glow@hover"]:hover` is a plain attribute selector, so
the layer is a stylesheet a build step writes once. Consuming an effect never requires the engine to be
running, exactly as consuming a derived theme does not. The whole cross product of the shipped set is
~3 KB gzipped.

**Its values derive.** Every effect composes from the same shared tokens rather than hardcoding numbers,
which makes intensity the *algorithm's* policy rather than a per-component guess:

| algorithm | `--fx-intensity` |
|---|---|
| `xtyle-quiet` | 0.49 |
| `xtyle-default` | 0.73 |
| `xtyle-loud` | 0.98 |
| `xtyle-hc` | **0** |

`xtyle-hc` sits at zero on purpose. A halo, a lift, and a wash all spend edge contrast, which is the one
thing a high-contrast taste exists to protect, so it flattens the whole layer rather than toning each
effect down one at a time. No hand-picked per-component glow stays coherent across a theme set that way.

**Its library is opinion, not law.** `registerEffect` and `registerCondition` are **last-wins on the
name**, and the built-ins register first. An addon that names `glow` replaces it; an addon that names
`sparkle` extends the set. Neither has to restate the rest — the same registration contract fills use.

```ts
import { registerEffect, registerCondition } from "@xtyle/core";

registerEffect({ name: "sparkle", active: "outline:1px dashed var(--fx-color)" });
registerCondition({ name: "dragging", selector: "[data-dragging]" });
// `sparkle@dragging` now works, and so does `glow@dragging`
```

## The shipped set

| effect | what it does |
|---|---|
| `glow` | a halo, the accent bloom |
| `throb` | a slow pulse that drifts between `--fx-color` and `--fx-color-alt` |
| `glare` | an animated sheen that sweeps across the box |
| `lift` | a small rise with a shadow under it |
| `tint` | a color wash over the surface |
| `frost` | a backdrop blur and saturation bump |
| `reveal` | fades and slides in when armed (see below) |
| `shake` | a short nudge, for an error |
| `saturate` | a vividness bump |

## Conditions

| condition | selector |
|---|---|
| *(none)* | always — ambient |
| `hover` | `:hover` |
| `focus` | `:focus-visible` |
| `active` | `:active` |
| `checked` | `:checked` |
| `disabled` | `:disabled`, `[aria-disabled="true"]` |
| `open` | `[open]`, `[aria-expanded="true"]` |
| `invalid` | `:invalid`, `[aria-invalid="true"]` |
| `armed` | `[data-fx-armed]` |

## Tokens

| token | derived from |
|---|---|
| `--fx-intensity` | the algorithm's taste; `0` disables the layer |
| `--fx-color` | `--accent` |
| `--fx-color-alt` | `--accent-2` — the hue a `throb` travels toward |
| `--fx-duration` | `--duration-base` |
| `--fx-ease` | `--ease-standard` |

They are ordinary tokens on the open register, so **a theme dials them with an override and needs no
knob**, and an element re-points one inline the way the site's toolbar does:

```html
<a data-fx="glow@hover" style="--fx-color: var(--pink)">
```

Five shared tokens rather than a family per effect is deliberate. A per-effect family would grow with
the library and lock a third-party effect out of deriving at all; a shared dial means an addon's effect
answers to the theme the day it lands, with no change to an algorithm that never heard of it.

## Parameters

An effect's tunables are **named**, after a `?`, comma-separated:

```html
<span data-fx="throb?rate:3s,colors:[accent,accent-2]">
<div  data-fx="glow@hover?spread:18">
```

Naming rather than ordering them matters more than it looks. Positional arguments are order-locked:
you cannot set a late one without restating every earlier one, and you cannot add a new parameter to
an effect later without either renumbering existing markup or bolting it awkwardly onto the end. Named
arguments take any subset in any order, and an effect can grow a parameter without breaking a single
spec anyone has already written.

| effect | parameters |
|---|---|
| `glow` | `spread` (px), `color` |
| `throb` | `rate` (s), `color`, `color-alt`, `colors` (list), `spread` (px) |
| `glare` | `angle` (deg), `rate` (ms), `color` |
| `lift` | `distance` (px), `color` |
| `tint` | `amount` (%), `color` |
| `frost` | `blur` (px), `saturation` (%) |
| `reveal` | `distance` (px), `rate` (ms) |
| `shake` | `distance` (px), `rate` (ms) |
| `saturate` | `amount` (%) — `0` grayscale, `100` unchanged, `200` double |

A **bracketed list** fans out to a related group, so a pair that is nearly always set together can be
written as one: `colors:[accent,accent-2]` fills `color` and `color-alt`. Its commas stay inside the
brackets rather than splitting the pairs around it.

`saturate`'s `amount` is a **target**, not an addend, and it splits at the neutral `100%`: the vivify
half (above `100%`) is tempered by `--fx-intensity` the way every effect is, but a **reduction is
honored exactly**. `saturate?amount:0` is `saturate(0)` — grayscale — on *every* theme, `xtyle-hc`
included, and a negative clamps to the same. A value should mean the value.

A value resolves in the same three shapes a `---pc` icon override uses, so the two grammars stay
learnable as one idea:

- a **hex** (`#fff`, `ff00ff`) is a fixed color;
- a **bare number** takes the parameter's declared unit, so `315` reads as `315deg` and `3` as `3s`;
  a value that carries its own unit (`100ms`, `2rem`) passes through untouched;
- anything else is a **token name** and resolves to `var(--name)`, which keeps it theme-reactive
  rather than freezing the color it happened to be at authoring time. A trailing digit written
  without a hyphen is the same token, so `accent2` finds `--accent-2`.

### Why the values are not in the selector

**A CSS attribute selector can match a token but never parse it.** `[data-fx~="throb"]` does not match
`throb?rate:3s` at all — they are different tokens — and no selector can pull `3s` out of one. So the
layer matches the *token* and takes the *values* from custom properties:

```css
/* what the sheet emits, once */
[data-fx][data-fx~="throb"],[data-fx][data-fx^="throb?"],[data-fx][data-fx*=" throb?"] {
  animation: xtyle-fx-throb var(--fx-throb-duration, …) …;
}
```

```html
<!-- what the element carries -->
<span data-fx="throb?rate:3s" style="--fx-throb-duration:3s">
```

Two details in that selector are load-bearing:

- the parameterised form is anchored at a **token boundary** (the start of the value, or a space)
  rather than matched as a naive substring, because `[data-fx*="glow@focus"]` would happily fire on
  `glow@focus-within` and hand an author an effect they never asked for;
- the leading `[data-fx]` is **specificity, not matching**. An effect decorates a consumer's own
  element, and a single class rule ties a bare attribute selector — then wins on source order, since
  the consumer's stylesheet loads after the library's. A framework that scopes styles (Astro adds
  `[data-astro-cid-…]`) ties it exactly. Without the bump, an effect silently loses to the very thing
  it is decorating.

### Who writes the properties

Three layers, and the same baked-or-generated cascade a derived theme uses — so **the runtime stays
optional**:

1. **Write the property yourself.** Always works, needs nothing, and *cascades* — set it on a parent
   and everything inside inherits it.
   ```html
   <div style="--fx-glow-color: var(--pink)"> … </div>
   ```
2. **Let a binding expand the spec at build or SSR.** `fxStyle(spec)` returns the properties and
   `fxStyleAttr(spec)` returns them as a `style` string, so a parameterised effect costs no
   JavaScript at runtime.
   ```ts
   fxStyle("glare@hover?angle:315,rate:100ms,color:#fff");
   // → { "--fx-glare-angle": "315deg", "--fx-glare-duration": "100ms", "--fx-glare-color": "#fff" }
   ```
3. **Resolve it live** by calling the same function in the browser, for markup composed at runtime.

An effect an addon registers declares its own `params`, so a third-party effect is parameterised on
exactly the same terms as a built-in one.

## Proving an effect is visible

An effect whose CSS is correct and whose pixels never change is broken, and reading the stylesheet
cannot tell you which you have. `scripts/check-effects-visible.mjs` drives the docs page, samples each
effect at rest and while live, and fails on any that renders no difference:

```sh
node scripts/check-effects-visible.mjs [url]
```

It reports two numbers per effect, because one is not enough: the share of pixels past a per-pixel
threshold (which catches a sharp change and *misses a soft one*) and the mean per-channel delta (which
is what catches a wide blurred halo).

## Reduced motion is the library's job, not the adopter's

Every effect that moves is wrapped in a `prefers-reduced-motion: reduce` guard that returns it to
stillness. This is a large part of why the layer is worth having: the policy gets decided once,
correctly, instead of by every adopter who happens to remember.

## `reveal` is the one effect that needs a runtime

Everything else is pure CSS. `reveal` needs to know when an element enters the viewport, so it is the
only member of the set that depends on an observer — and it is built so that **the absence of the
runtime can never hide content**. The bare name does nothing; the hidden state is reachable only
through `data-fx-armed`, which nothing but the observer sets. With no JavaScript, nothing is ever armed,
and a reader sees the content rather than an empty page waiting for a script that will not arrive.

## Where it sits in the sheet

`baseCss()` emits utilities, then components, then effects. Effects come last so a `data-fx` rule
outranks a component's own declaration at equal specificity: an effect decorates what is already there,
and losing to the thing it decorates would make it useless on exactly the components an adopter most
wants to decorate.
