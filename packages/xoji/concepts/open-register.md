# The open register and the coverage contract

xoji's token set is not a fixed schema. Authors declare new tokens and rewire any
derivation; the register is open. That openness is held by exactly one hard
contract: a **coverage check** between what components consume and what an
algorithm produces.

## How coverage works

Every component declares the theme tokens it reads in its manifest
(`consumedTokens`). Every algorithm produces a register of tokens. Coverage is
the check that the second covers the first: for a given component set and a given
algorithm, every consumed token must be produced. A gap is a contract violation,
caught before anything renders.

The line between a consumed theme token and a component-internal custom property
matters. A custom property a component's own CSS defines and reads is not a
consumed theme token; it never enters the coverage check. The lint and the
coverage check agree on that line, so the contract never lies about what a theme
must supply.

## Why this is the only hard rule

Because the register is open, there is no global schema to validate against. The
coverage contract is what makes "any valid theme renders well out of the box"
checkable rather than aspirational. It is the single seam every algorithm and
every component meets at, and it is the only thing the engine enforces across the
two.
