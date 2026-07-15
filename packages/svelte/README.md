# @xtyle/svelte

[![npm](https://img.shields.io/npm/v/@xtyle/svelte?label=npm)](https://www.npmjs.com/package/@xtyle/svelte)
[![docs](https://img.shields.io/badge/docs-xtyle.dev-blue)](https://xtyle.dev)
[![license](https://img.shields.io/badge/license-MIT-green)](https://opensource.org/license/mit)

Thin Svelte 5 wrappers over the [`@xtyle/core`](https://www.npmjs.com/package/@xtyle/core)
custom elements, the Svelte binding of the xtyle component contract. Each wrapper is a
typed Svelte component that renders the matching `<xtyle-*>` element and forwards its
props, slots, and arbitrary attributes (`{...rest}` lands on the element).

## Install

```sh
npm install @xtyle/svelte @xtyle/core
```

`svelte@^5` is a peer dependency; `@xtyle/core` (pulled in automatically) provides the
custom elements and the derivation engine.

## Usage

```svelte
<script>
  import { Button, Badge, Card } from "@xtyle/svelte";
</script>

<Card>
  <Badge tone="success">new</Badge>
  <Button tone="accent">Save</Button>
</Card>
```

Components are styled entirely by **design tokens**, the CSS custom properties a xtyle
*algorithm* derives. Drop a derived theme on `:root` (or any ancestor) and every
component themes with it; no per-component styling required. See
[`@xtyle/core`](https://www.npmjs.com/package/@xtyle/core) for deriving and applying a
theme, and [xtyle.dev](https://xtyle.dev) for the full component reference.

## Importing a component registers only that element

**This is a behavior change.** Each wrapper now pulls in *its own* custom element
(`@xtyle/core/elements/button.js`) instead of the whole-element barrel. Importing `Button`
registers `<xtyle-button>` — and nothing else.

Previously, importing *any* component registered *all* 87 elements as a side effect, so
hand-written markup happened to work whether or not you had imported the matching wrapper.
That also meant a page rendering a single `Card` shipped every element in the library, plus
the ~300 Prism grammar chunks the code element's language table reaches. A single-component
build drops from **308 files / 11.5 MiB to 9 files / 9.9 MiB** on this change alone (and to
**7 files / 2.1 MiB** once the QuickJS debug variants are stubbed — see below).

**What breaks:** hand-written `<xtyle-*>` markup for an element whose wrapper you never
imported. It will render as an inert unknown tag — no upgrade, no styling, no error.

```svelte
<script>
  import { Button } from "@xtyle/svelte";
</script>

<Button>fine</Button>
<!-- inert: nothing registered <xtyle-badge> -->
<xtyle-badge tone="accent">not upgraded</xtyle-badge>
```

**Two ways to fix it.** Import the wrapper and use it (preferred — you keep the payload win):

```svelte
<script>
  import { Button, Badge } from "@xtyle/svelte";
</script>

<Badge tone="accent">upgraded</Badge>
```

…or restore the old register-everything behavior in one line, if you drive the elements as
raw markup and don't want to enumerate them:

```svelte
<script>
  import "@xtyle/svelte/register";
</script>

<xtyle-badge tone="accent">upgraded</xtyle-badge>
```

`@xtyle/svelte/register` registers all 87 elements up front. It is the explicit opt-in to the
old behavior, and it costs the old bundle size — reach for it only when you need it.

## Trimming the QuickJS debug WebAssembly

Components paint their chrome through xript's sandboxed QuickJS runtime, so its WebAssembly
is load-bearing — but only the *release* variants are ever selected. `quickjs-emscripten`
statically imports all four variants behind getters a bundler cannot see through, so the two
**debug** builds (7.81 MiB of `.wasm`) land in every consumer bundle with nothing referencing
them. Alias them to an inert stub:

```js
// vite.config.js
import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    alias: {
      "@jitl/quickjs-wasmfile-debug-sync": "/path/to/quickjs-debug-stub.js",
      "@jitl/quickjs-wasmfile-debug-asyncify": "/path/to/quickjs-debug-stub.js",
    },
  },
});
```

```js
// quickjs-debug-stub.js — importing it is inert; only *using* a debug variant raises.
export default new Proxy(
  {},
  {
    get(_t, prop) {
      if (prop === "then" || typeof prop === "symbol") return undefined;
      throw new Error("QuickJS debug variants are stubbed out at build time.");
    },
  },
);
```

This drops the two debug `.wasm` files and leaves the release pair (1.52 MiB) that the
runtime actually loads. Do **not** stub the release variants: without them the fragment
runtime cannot initialize and client-rendered elements log
`the component fragment runtime failed to load` and paint nothing.

## License

MIT
