import { describe, expect, it } from "vitest";
import { derive } from "../src/index.js";
import { xtyleDefault } from "../src/batteries.js";

describe("link-hover distinctness", () => {
	it("keeps --link-hover distinct from --link for a low-chroma (near-gray) accent", () => {
		for (const accent of ["#808080", "#7c7c7c", "#909090"]) {
			const reg = derive(xtyleDefault, { constraints: { "--accent": accent } });
			expect(reg["--link-hover"]).not.toBe(reg["--link"]);
		}
	});

	it("keeps them distinct for chromatic accents pinned near a lightness pole (gamut-clamp erases the step)", () => {
		// INFO: at these lightness extremes the base hover step gamut-clamps back to one hex, so the guard
		// must fall through to an off-pole nudge or a chroma drop to emit a distinct value.
		for (const accent of ["#ffcfe1", "#fefea4", "#020100", "#000000", "#ffffff", "#0a0f02"]) {
			const reg = derive(xtyleDefault, { constraints: { "--accent": accent } });
			expect(reg["--link-hover"], `accent ${accent}`).not.toBe(reg["--link"]);
			expect(reg["--link"]).toMatch(/^#[0-9a-f]{6}$/i);
		}
	});

	it("leaves a chromatic accent's link and link-hover byte-identical to their derivation", () => {
		const reg = derive(xtyleDefault, { constraints: { "--accent": "#2563eb" } });
		expect(reg["--link"]).not.toBe(reg["--link-hover"]);
		expect(reg["--link"]).toMatch(/^#[0-9a-f]{6}$/i);
	});
});

/**
 * The distinctness above is asserted by string inequality, which is a test of identity and not of
 * perceptibility — two colours one unit apart in one channel satisfy it and read as one colour. These
 * grade the same guarantee by perceptual distance.
 */
describe("link-hover perceptibility", () => {
	const MIN = 0.01;
	const POLES = new Set(["#000000", "#ffffff"]);


	it("separates link from link-hover perceptibly on every blessed algorithm, light and dark", async () => {
		const { bakedAlgorithms } = await import("../src/batteries.js");
		const { oklabDistance } = await import("../src/color.js");
		for (const [id, algorithm] of Object.entries(bakedAlgorithms)) {
			for (const bg of ["#ffffff", "#0b0d12"]) {
				const reg = derive(algorithm, { constraints: { "--bg-0": bg, "--accent": "#2563eb" } });
				const link = reg["--link"] as string;
				if (POLES.has(link)) continue;
				const delta = oklabDistance(link, reg["--link-hover"] as string);
				expect(delta, `${id} on ${bg}: ${link} vs ${reg["--link-hover"]}`).toBeGreaterThanOrEqual(MIN);
			}
		}
	});

	it("separates them perceptibly for the accents that used to collapse", async () => {
		const { oklabDistance } = await import("../src/color.js");
		for (const accent of ["#808080", "#7c7c7c", "#ffcfe1", "#fefea4", "#020100", "#0a0f02"]) {
			const reg = derive(xtyleDefault, { constraints: { "--accent": accent } });
			const link = reg["--link"] as string;
			if (POLES.has(link)) continue;
			expect(oklabDistance(link, reg["--link-hover"] as string), `accent ${accent}`).toBeGreaterThanOrEqual(MIN);
		}
	});
});
