import { describe, expect, it } from "vitest";
import { contrast, derive } from "../src/index.js";
import { getAlgorithm } from "../src/batteries.js";

const IDS = ["xtyle-default", "xtyle-hc", "xtyle-quiet", "xtyle-loud", "nxi-nite"] as const;
const FILLS = ["--accent", "--neutral", "--success", "--warn", "--danger", "--info"];
const SURFACES = ["--bg-0", "--bg-1", "--bg-2"];

describe("fills and control edges hold 3:1 against every surface they sit on", () => {
	for (const id of IDS) {
		for (const scheme of ["dark", "light"] as const) {
			it(`${id}, ${scheme}`, () => {
				const register = derive(getAlgorithm(id), { knobs: { scheme } });
				for (const fill of FILLS) {
					for (const surface of SURFACES) {
						const ratio = contrast(register[fill] as string, register[surface] as string);
						expect(ratio, `${fill} on ${surface}`).toBeGreaterThanOrEqual(3);
					}
				}
			});
		}
	}

	for (const id of IDS) {
		for (const scheme of ["dark", "light"] as const) {
			it(`${id}, ${scheme}: --line-strong holds 3:1 against the field and every surface`, () => {
				const register = derive(getAlgorithm(id), { knobs: { scheme } });
				for (const surface of ["--field-bg", ...SURFACES]) {
					const ratio = contrast(register["--line-strong"] as string, register[surface] as string);
					expect(ratio, `--line-strong on ${surface}`).toBeGreaterThanOrEqual(3);
				}
			});
		}
	}

	it("leaves a caller's own brand accent verbatim even when it sits under the floor", () => {
		const register = derive(getAlgorithm("xtyle-default"), {
			knobs: { scheme: "light" },
			constraints: { "--accent": "#7dd3fc" },
		});
		expect(register["--accent"]).toBe("#7dd3fc");
	});
});
