import type { AnchorSeed, TokenRegister } from "./types.js";

export function constraintsFrom(input: AnchorSeed): TokenRegister {
	const constraints: TokenRegister = { ...(input.overrides ?? {}) };
	if (input.bg) constraints["--bg-0"] = input.bg;
	if (input.fg) constraints["--fg-0"] = input.fg;
	if (input.accent) constraints["--accent"] = input.accent;
	return constraints;
}
