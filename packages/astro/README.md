# @xoji/astro

[![npm](https://img.shields.io/npm/v/@xoji/astro?label=npm)](https://www.npmjs.com/package/@xoji/astro)
[![docs](https://img.shields.io/badge/docs-xoji.dev-blue)](https://xoji.dev)
[![license](https://img.shields.io/badge/license-MIT-green)](https://opensource.org/license/mit)

Zero-JS Astro 6 components that emit semantic HTML against the xoji component classes,
the SSR binding of the [`@xoji/core`](https://www.npmjs.com/package/@xoji/core) component
contract. Each component server-renders the matching markup and ships **no client
JavaScript** unless that component genuinely needs it.

## Install

```sh
npm install @xoji/astro @xoji/core
```

`astro@^6` is a peer dependency; `@xoji/core` (pulled in automatically) provides the
markup contract and the derivation engine.

## Usage

```astro
---
import Button from "@xoji/astro/Button.astro";
import Card from "@xoji/astro/Card.astro";
---

<Card>
  <Button tone="accent">Save</Button>
</Card>
```

Components are styled entirely by **design tokens**, the CSS custom properties a xoji
*algorithm* derives. Emit a theme to CSS (via the `xoji` CLI in `@xoji/core`) and drop it
on `:root`; every component themes with it, with nothing running at runtime. See
[`@xoji/core`](https://www.npmjs.com/package/@xoji/core) for deriving a theme, and
[xoji.dev](https://xoji.dev) for the full component reference.

## License

MIT
