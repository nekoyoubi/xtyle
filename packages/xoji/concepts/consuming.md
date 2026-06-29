# Consuming a theme

A derived theme is a flat set of CSS custom properties. You apply it once, at a
scope, and the cascade does the rest. Every xoji component reads those properties,
so theming the tokens themes the whole component set at once.

## The bindings

One component contract, three bindings, all honoring the same derived tokens:

- **`@xoji/core/elements`**: the raw custom elements. Framework-agnostic; works
  anywhere HTML does.
- **`@xoji/svelte`**: a thin Svelte wrapper over the same elements.
- **`@xoji/astro`**: Astro components, the binding this site is built from.

A component renders one of two ways from a single fragment fill. Over
Astro-rendered structure it adopts the existing markup as light DOM (zero-JS, no
flash of unstyled content). Mounted bare, it attaches a shadow root and projects
framework-owned children through native slots. The presence of server-rendered
structure is the mode signal; it is auto-detected, never configured.

## The CLI

`@xoji/core` ships a Node bin, `xoji`, for build-time derivation and proofs:

- `xoji derive --bg <color> --accent <color> --format css` derives a theme and
  emits it as CSS or JSON.
- `xoji gauntlet -a all --depth quick` spot-checks invariants across algorithms;
  `--mode hosted --depth full` runs the full battery against the sandboxed mods.
- `xoji coverage --consumed a,b,c` checks a component's consumed tokens against a
  produced register.

The same engine runs in the browser through the QuickJS the xript runtime embeds,
so live derivation in the generator and build-time derivation in the CLI are one
codebase.

## The MCP server

`xoji mcp` starts a Model Context Protocol server over stdio, handing an agent the
same engine the CLI hands a human. The tools cover `xoji_derive`,
`xoji_coverage`, `xoji_components` (list a component or describe its full
manifest), `xoji_gauntlet`, and `xoji_list_algorithms`; resources serve the
concept docs and every component manifest. Point a client at `xoji mcp` (or `npx
-y @xoji/core xoji mcp`) and an agent building against xoji reads token names and
prop shapes from the manifest instead of guessing.
