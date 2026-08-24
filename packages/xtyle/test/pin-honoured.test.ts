import { describe, expect, it } from "vitest";
import { derive } from "../src/index.js";
import { bakedAlgorithms, getAlgorithm } from "../src/batteries.js";

const ALGORITHM_IDS = Object.keys(bakedAlgorithms);

/**
 * Token overrides are documented as the universal escape hatch: whatever an algorithm would have
 * derived, a pin wins. The gauntlet draws its pins from five targets, so the contract has only ever
 * been exercised on `--accent`, `--bg-0`, `--code-bg`, `--terminal-bg` and `--field-bg` — and the
 * escape hatch is worth exactly as much as the token nobody tested.
 */
const UNDRAWN_TOKENS = [
	"--line",
	"--line-strong",
	"--focus-ring",
	"--link",
	"--link-hover",
	"--selection-bg",
	"--selection-text",
	"--surface-overlay",
	"--scrim",
	"--success",
	"--warn",
	"--danger",
	"--info",
	"--neutral-bg",
	"--neutral-text",
	"--accent-text",
	"--body-bg",
	"--bg-sunken",
	"--fg-disabled",
	"--field-border",
] as const;

const VALUES = ["#8a8a8a", "#d1495b"] as const;

describe("a pinned token survives derivation verbatim, on every algorithm", () => {
	it.each(ALGORITHM_IDS)("%s honours every pin it is handed", (id) => {
		const algorithm = getAlgorithm(id);
		const rewritten: string[] = [];
		let compared = 0;
		for (const token of UNDRAWN_TOKENS) {
			for (const value of VALUES) {
				const register = derive(algorithm, { constraints: { [token]: value } });
				compared++;
				if (register[token] !== value) rewritten.push(`${token} pinned ${value} came back ${register[token]}`);
			}
		}
		expect(compared, "the sweep compared nothing, so its green means nothing").toBe(
			UNDRAWN_TOKENS.length * VALUES.length,
		);
		expect(rewritten, `${id} rewrote a pin instead of honouring it`).toEqual([]);
	});

	it("pins the token it was handed and leaves the rest of the register deriving", () => {
		const register = derive(getAlgorithm("xtyle-default"), { constraints: { "--link": "#8a8a8a" } });
		expect(register["--link"]).toBe("#8a8a8a");
		expect(register["--fg-0"]).not.toBe("#8a8a8a");
		expect(Object.keys(register).length).toBeGreaterThan(100);
	});

	it("covers tokens the gauntlet's own pin list does not", () => {
		const drawn = new Set(["--accent", "--bg-0", "--code-bg", "--terminal-bg", "--field-bg"]);
		expect(UNDRAWN_TOKENS.some((token) => drawn.has(token))).toBe(false);
		expect(UNDRAWN_TOKENS.length).toBeGreaterThan(drawn.size * 2);
	});
});
