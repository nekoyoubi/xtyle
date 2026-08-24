import { describe, expect, it } from "vitest";
import { PRODUCED_TOKENS, SHARED_KNOBS, TOKEN_CATEGORIES, settlePass, toPreset } from "../src/authoring.js";
import { getAlgorithm } from "../src/batteries.js";
import type { DeriveOptions, Pass, PassContext, TokenName, TokenRegister } from "../src/authoring.js";

/**
 * `@xtyle/core/authoring` is the surface a mod imports, and it is the *only* one a mod may take values
 * from — reaching past it into `@xtyle/core` drags the neutral index into the bundle and breaks the
 * build with errors naming dependencies the algorithm never mentioned. So anything an author needs to
 * write a pass has to be reachable here, types included.
 */
describe("the mod-side authoring surface carries what a pass needs", () => {
	it("names the types a pass is written against", () => {
		const pass: Pass = {
			name: "probe",
			run(register: TokenRegister, ctx: PassContext): TokenRegister {
				return { ...register, "--probe": ctx.scheme };
			},
		};
		const options: DeriveOptions = { knobs: { scheme: "light" } };
		const preset = toPreset({ id: "probe" });
		expect(pass.run({}, { knobs: {}, scheme: "dark", pinned: {}, passIndex: 0 })["--probe"]).toBe("dark");
		expect(settlePass(preset, options).name).toBe("settle");
	});

	it("carries the standard register, so a tier-2 author can extend it rather than transcribe it", () => {
		const mine: TokenName[] = ["--band-quiet"];
		const produces: TokenName[] = [...PRODUCED_TOKENS, ...mine];

		expect(PRODUCED_TOKENS.length).toBeGreaterThan(300);
		expect(produces.length).toBe(PRODUCED_TOKENS.length + 1);
		expect(new Set(PRODUCED_TOKENS)).toEqual(new Set(getAlgorithm("xtyle-default").produces));
	});

	it("categorizes every token it says the standard register produces", () => {
		const uncategorized = PRODUCED_TOKENS.filter((token) => typeof TOKEN_CATEGORIES[token] !== "string");
		expect(uncategorized, `no category for ${uncategorized.join(", ")}`).toEqual([]);
	});

	it("names the shared knobs, so an algorithm adding one keeps the rest", () => {
		expect(SHARED_KNOBS).toContain("scheme");
		expect([...SHARED_KNOBS, "bandLift"]).toHaveLength(SHARED_KNOBS.length + 1);
	});
});
