import { describe, expect, it } from "vitest";
import { listEffects } from "@xtyle/core";
import { BLURB, DEMOS, effectsWithoutDemo } from "./effect-demos";

describe("effect demos", () => {
	it("stages every effect the library registers", () => {
		expect(effectsWithoutDemo()).toEqual([]);
	});

	it("would name an effect that shipped without one", () => {
		const names = listEffects().map((effect) => effect.name);
		expect(names.length).toBeGreaterThan(0);
		expect(names.filter((name) => !DEMOS[`${name}-absent`])).toEqual(names);
	});

	it("addresses each demo by the spec's own effect name", () => {
		for (const [name, demo] of Object.entries(DEMOS)) {
			expect(demo.spec.startsWith(name)).toBe(true);
		}
	});

	it("carries a blurb for every staged effect", () => {
		for (const name of Object.keys(DEMOS)) expect(BLURB[name]).toBeTruthy();
	});
});
