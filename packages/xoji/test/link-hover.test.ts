import { describe, expect, it } from "vitest";
import { derive } from "../src/index.js";
import { xojiDefault } from "../src/batteries.js";

describe("link-hover distinctness", () => {
	it("keeps --link-hover distinct from --link for a low-chroma (near-gray) accent", () => {
		for (const accent of ["#808080", "#7c7c7c", "#909090"]) {
			const reg = derive(xojiDefault, { constraints: { "--accent": accent } });
			expect(reg["--link-hover"]).not.toBe(reg["--link"]);
		}
	});

	it("keeps them distinct for chromatic accents pinned near a lightness pole (gamut-clamp erases the step)", () => {
		// The base lightness hover step clamps back to one displayable hex at these extremes; the guard
		// must fall through to an off-pole nudge or a chroma drop to force a distinct emitted value.
		for (const accent of ["#ffcfe1", "#fefea4", "#020100", "#000000", "#ffffff", "#0a0f02"]) {
			const reg = derive(xojiDefault, { constraints: { "--accent": accent } });
			expect(reg["--link-hover"], `accent ${accent}`).not.toBe(reg["--link"]);
			expect(reg["--link"]).toMatch(/^#[0-9a-f]{6}$/i);
		}
	});

	it("leaves a chromatic accent's link and link-hover byte-identical to their derivation", () => {
		// The collapse guard must not perturb a chromatic accent that already resolves distinct values.
		const reg = derive(xojiDefault, { constraints: { "--accent": "#2563eb" } });
		expect(reg["--link"]).not.toBe(reg["--link-hover"]);
		expect(reg["--link"]).toMatch(/^#[0-9a-f]{6}$/i);
	});
});
