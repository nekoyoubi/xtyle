import type { AnchorSeed, TokenRegister } from "./types.js";

/**
 * Rewrite the deprecated {@link AnchorSeed} alias into the `constraints` it has always meant.
 * The whole translation is three renames and a spread — there is no seeding semantic here, which
 * is exactly why callers should pass `constraints` directly.
 */
export function constraintsFrom(input: AnchorSeed): TokenRegister {
	const constraints: TokenRegister = { ...(input.overrides ?? {}) };
	if (input.bg) constraints["--bg-0"] = input.bg;
	if (input.fg) constraints["--fg-0"] = input.fg;
	if (input.accent) constraints["--accent"] = input.accent;
	return constraints;
}
