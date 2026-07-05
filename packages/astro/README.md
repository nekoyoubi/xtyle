# @xtyle/astro

[![npm](https://img.shields.io/npm/v/@xtyle/astro?label=npm)](https://www.npmjs.com/package/@xtyle/astro)
[![docs](https://img.shields.io/badge/docs-xtyle.dev-blue)](https://xtyle.dev)
[![license](https://img.shields.io/badge/license-MIT-green)](https://opensource.org/license/mit)

Zero-JS Astro 6 components that emit semantic HTML against the xtyle component classes,
the SSR binding of the [`@xtyle/core`](https://www.npmjs.com/package/@xtyle/core) component
contract. Each component server-renders the matching markup and ships **no client
JavaScript** unless that component genuinely needs it.

## Install

```sh
npm install @xtyle/astro @xtyle/core
```

`astro@^6` is a peer dependency; `@xtyle/core` (pulled in automatically) provides the
markup contract and the derivation engine.

## Usage

```astro
---
import Button from "@xtyle/astro/Button.astro";
import Card from "@xtyle/astro/Card.astro";
---

<Card>
  <Button tone="accent">Save</Button>
</Card>
```

Components are styled entirely by **design tokens**, the CSS custom properties a xtyle
*algorithm* derives. Emit a theme to CSS (via the `xtyle` CLI in `@xtyle/core`) and drop it
on `:root`; every component themes with it, with nothing running at runtime. See
[`@xtyle/core`](https://www.npmjs.com/package/@xtyle/core) for deriving a theme, and
[xtyle.dev](https://xtyle.dev) for the full component reference.

## License

MIT
