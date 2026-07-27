import { describe, expect, it } from "vitest";
import { contrast, derive, FULL_TONES } from "../src/index.js";
import { bakedAlgorithms } from "../src/batteries.js";

const PALETTES: Array<{ name: string; constraints: Record<string, string> }> = [
	{ name: "hot-pink brand (dark)", constraints: { "--accent": "#e0218a" } },
	{ name: "navy on light corporate", constraints: { "--bg-0": "#f7f8fa", "--accent": "#2d5a9e" } },
	{ name: "amber on warm light", constraints: { "--bg-0": "#faf6ef", "--accent": "#b45309" } },
	{ name: "chartreuse off-hue", constraints: { "--accent": "#7fff00" } },
	{ name: "near-monochrome slate", constraints: { "--accent": "#3a3d42" } },
];

const TONES = ["accent", "accent-2", "accent-3", "accent-4", "danger", "success", "warn", "info"];
const AA = 4.5;

for (const [id, algorithm] of Object.entries(bakedAlgorithms)) {
	describe(`${id}: real-world brand palettes derive AA-clean`, () => {
		for (const { name, constraints } of PALETTES) {
			const register = derive(algorithm, { constraints });

			it(`${name}: body and link text clear AA on the surface`, () => {
				expect(contrast(register["--fg-0"]!, register["--bg-0"]!), "fg-0 on bg-0").toBeGreaterThanOrEqual(AA);
				expect(contrast(register["--link"]!, register["--bg-0"]!), "link on bg-0").toBeGreaterThanOrEqual(AA);
			});

			it(`${name}: every tone's solid and soft pairings clear AA`, () => {
				for (const tone of TONES) {
					const solid = contrast(register[`--${tone}-fg`]!, register[`--${tone}`]!);
					expect(solid, `--${tone}-fg on --${tone}`).toBeGreaterThanOrEqual(AA);
					const soft = contrast(register[`--${tone}-text`]!, register[`--${tone}-bg`]!);
					expect(soft, `--${tone}-text on --${tone}-bg`).toBeGreaterThanOrEqual(AA);
				}
			});

			// INFO: colored typography paints `--{tone}-vivid` directly on the page surface,
			// so every tone in the full roster must clear AA against `--bg-0`
			it(`${name}: every tone's vivid ink clears AA on the surface`, () => {
				for (const tone of FULL_TONES) {
					const ratio = contrast(register[`--${tone}-vivid`]!, register["--bg-0"]!);
					expect(ratio, `--${tone}-vivid on --bg-0`).toBeGreaterThanOrEqual(AA);
				}
			});
		}
	});
}
