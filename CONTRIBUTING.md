# Contributing to xtyle

xtyle is open to contributions. Here is what you need to get started.

## Development Setup

```sh
git clone https://github.com/nekoyoubi/xtyle.git
cd xtyle
npm install
```

A monorepo managed via npm workspaces; the install wires every package.

## Repository Structure

```
xtyle/
├── packages/xtyle/    # the engine + raw custom elements, published as `@xtyle/core`
│                     #   (elements imported from `@xtyle/core/elements`)
├── packages/svelte/  # @xtyle/svelte — thin Svelte wrapper
├── packages/astro/   # @xtyle/astro — Astro components
├── algorithms/       # built-in xript-plugin algorithms (xtyle-default, …)
├── apps/site/        # xtyle.dev (Astro)
└── docs/             # design record
```

## Building and Testing

```sh
npm run build                            # all packages
npm test                                 # all tests (incl. the gauntlet)

npm run build --workspace=packages/xtyle  # just the engine
npm test --workspace=packages/xtyle
```

The site runs locally with `npm run dev` (when `apps/site` exists).

## Conventions

- **TypeScript** for all new code
- **Self-documenting code** preferred over inline comments; **JSDoc** for public APIs
- **vitest** for tests
- **Commit messages** follow the project style: short header < 50 chars, past tense, markdown bullets for details

## Branch Strategy

`main` is protected. All work happens on feature branches:

- `feature/` for new functionality
- `fix/` for bug fixes
- `clean/` for refactoring, cleanup, and docs

## Pull Requests

- Keep PRs focused: one theme per PR
- Include tests for new functionality
- Run the relevant package's test suite before opening the PR
- PR descriptions should include a summary and test plan

## Key Design Decisions

These principles guide all contributions:

- **The algorithm is the asset.** A theme is a materialized invocation of a named algorithm.
- **Algorithms are xript plugins.** Sandboxed and zero-authority; xript's toolchain comes free.
- **The open register.** Authors declare tokens and rewire derivations; coverage is the only hard contract.
- **No engine gospel.** "Can't look bad" is per-algorithm policy, proven by the gauntlet.
- **The runtime is optional.** Once derived, a theme is just CSS custom properties and the browser cascade — the engine can run live, but using a finished theme never requires it.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
