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

## License

MIT
