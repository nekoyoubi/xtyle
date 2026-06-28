# @xoji/svelte

[![npm](https://img.shields.io/npm/v/@xoji/svelte?label=npm)](https://www.npmjs.com/package/@xoji/svelte)
[![docs](https://img.shields.io/badge/docs-xoji.dev-blue)](https://xoji.dev)
[![license](https://img.shields.io/badge/license-MIT-green)](https://opensource.org/license/mit)

Thin Svelte 5 wrappers over the [`@xoji/core`](https://www.npmjs.com/package/@xoji/core)
custom elements, the Svelte binding of the xoji component contract. Each wrapper is a
typed Svelte component that renders the matching `<xoji-*>` element and forwards its
props, slots, and arbitrary attributes (`{...rest}` lands on the element).

## Install

```sh
npm install @xoji/svelte @xoji/core
```

`svelte@^5` is a peer dependency; `@xoji/core` (pulled in automatically) provides the
custom elements and the derivation engine.

## Usage

```svelte
<script>
  import { Button, Badge, Card } from "@xoji/svelte";
</script>

<Card>
  <Badge tone="success">new</Badge>
  <Button tone="accent">Save</Button>
</Card>
```

Components are styled entirely by **design tokens**, the CSS custom properties a xoji
*algorithm* derives. Drop a derived theme on `:root` (or any ancestor) and every
component themes with it; no per-component styling required. See
[`@xoji/core`](https://www.npmjs.com/package/@xoji/core) for deriving and applying a
theme, and [xoji.dev](https://xoji.dev) for the full component reference.

## License

MIT
