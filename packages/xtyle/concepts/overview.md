# What xtyle is

xtyle is a themable-derivation engine and component contract. A named, swappable
**algorithm** maps a small set of overridable anchors plus a handful of knobs into
a full, internally-consistent design-token set, co-designed against a component
library so any valid theme renders well out of the box.

The split that runs through everything: the algorithm is the durable, reusable
asset; a **theme** is a materialized invocation of one. An algorithm is a named,
composable engine you can share and reuse. A theme is the print it produces,
anywhere from a quick three-color pick to a design dialed in over days. Both are
first-class; the architecture just keeps the reusable machinery separate from any
one materialized result.

## The three input tiers

Every derivation takes input at one of three levels, in increasing power:

1. **Algorithm knobs.** Declared inputs an algorithm exposes (a split angle, a
   contrast posture, a warmth bias). This is the whole casual UX: pick an
   algorithm, turn its knobs, get a coherent theme.
2. **Anchors (constraints).** A small set of seed colors the algorithm derives
   from. `--bg-0`, `--fg-0`, and `--accent` are the common ones. They are
   constraints fed back into derivation, not a privileged tier of their own.
3. **Token overrides.** The universal escape hatch: pin any token in the register
   directly. A well-built algorithm re-threads the rest of the ramp around a
   pinned token rather than leaving an incoherent gap.

## What stays in the engine, what lives in an algorithm

The engine (`@xtyle/core`) is mechanism, never policy. It owns the open register,
the dependency graph and lineage, the coverage contract, and emit. It has no
opinion about how a ramp should look or what "pleasant" means. The **algorithm**
is the opinion: how this one works. There is no engine-level "can't look bad"
gospel; invariants are per-algorithm policy, proven by a gauntlet parameterized
by algorithm.

## The runtime is optional

Once derived, a theme is just CSS custom properties plus the browser cascade. No
engine needs to be running to use it. The engine can run live for the generator
or for novel-at-runtime inputs, but nothing about consuming a finished theme
depends on it.
