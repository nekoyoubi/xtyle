# Algorithms are xript plugins

A xoji algorithm is literally an xript plugin: a manifest plus xript code, with
its knobs as declared inputs, run in xript's zero-authority sandbox. Because of
that, xript's toolchain (validate, typegen, docgen, init) and its capability
model come free; xoji builds none of it.

An algorithm lives under the top-level `algorithms/` directory as a real mod: a
`mod-manifest.json` and a bundled `mod.js`. It is authored against an ergonomic
surface (`@xoji/core/authoring`) and imports the core engine by name. The host
exposes color primitives to the sandbox as a gated binding, so an algorithm does
OKLCH color math without being handed broad authority.

## The blessed set

xoji ships a small built-in set, each its own xript plugin:

- **xoji-default**: the neutral default.
- **xoji-hc**: a high-contrast posture.
- **xoji-quiet**: muted, low-chroma.
- **xoji-loud**: saturated and high-energy.
- **nxi-nite**: a multi-pass day/night algorithm whose register re-derives across
  the hours.

Each algorithm carries its own invariants and proves them with a gauntlet
parameterized by that algorithm. A blessed algorithm derives byte-identical
whether run baked or hosted through the sandbox, so the sandboxed mod is the
canonical engine and the baked path is a fast, verified fallback.
