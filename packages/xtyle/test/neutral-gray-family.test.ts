import { describe, expect, it } from "vitest";
import { contrast, derive, lightness } from "../src/index.js";
import { getAlgorithm } from "../src/batteries.js";

const SOFT = ["xtyle-default", "xtyle-quiet", "xtyle-loud", "nxi-nite"] as const;

describe("the neutral family keeps three values", () => {
	for (const id of SOFT) {
		for (const scheme of ["dark", "light"] as const) {
			it(`${id}, ${scheme}`, () => {
				const r = derive(getAlgorithm(id), { knobs: { scheme } });
				const [fill, text, vivid] = [r["--neutral"], r["--neutral-text"], r["--neutral-vivid"]] as string[];
				expect(new Set([fill, text, vivid]).size, `${fill} ${text} ${vivid}`).toBe(3);
				expect(contrast(vivid as string, r["--bg-0"] as string)).toBeGreaterThan(contrast(text as string, r["--bg-0"] as string));
				expect(text).not.toMatch(/^#(fff|ffffff|000|000000)$/i);
			});
		}
	}
});

describe("the gray family follows the scheme", () => {
	for (const id of SOFT) {
		it(id, () => {
			const dark = derive(getAlgorithm(id), { knobs: { scheme: "dark" } });
			const light = derive(getAlgorithm(id), { knobs: { scheme: "light" } });
			expect(lightness(dark["--gray-bg"] as string)).toBeLessThan(0.5);
			expect(lightness(light["--gray-bg"] as string)).toBeGreaterThan(0.5);
			expect(contrast(light["--gray-text"] as string, light["--gray-bg"] as string)).toBeGreaterThanOrEqual(4.5);
		});
	}
});
