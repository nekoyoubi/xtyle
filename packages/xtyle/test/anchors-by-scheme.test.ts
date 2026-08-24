import { describe, expect, it } from "vitest";
import { derive, invertedOptions } from "../src/index.js";
import { getAlgorithm } from "../src/batteries.js";
import { makeXtyleAlgorithm, toPreset } from "../src/authoring.js";
import { contrast, schemeOf, toOklchColor } from "../src/color.js";

const BLESSED = ["xtyle-default", "xtyle-hc", "xtyle-quiet", "xtyle-loud", "nxi-nite"];
const FILLS = ["--accent", "--neutral", "--success", "--warn", "--danger", "--info"];
const SURFACE_SEPARATION = 1.5;
const MID_GRAY_LIGHTNESS = 0.66;
const SOFTEST_REAL_PAGE_LIGHTNESS = 0.91;
const PAGE_LIGHTNESS = (MID_GRAY_LIGHTNESS + SOFTEST_REAL_PAGE_LIGHTNESS) / 2;

describe("an algorithm states its own light anchor", () => {
	it("uses the stated pair instead of flipping the default one", () => {
		const flipped = makeXtyleAlgorithm(toPreset({ id: "flipped" }));
		const stated = makeXtyleAlgorithm(
			toPreset({ id: "stated", anchorsByScheme: { light: { bg: "#eef0f4", fg: "#1b1d22" } } }),
		);

		const flippedLight = derive(flipped, { knobs: { scheme: "light" } });
		const statedLight = derive(stated, { knobs: { scheme: "light" } });

		expect(schemeOf(flippedLight["--bg-0"] as string)).toBe("light");
		expect(schemeOf(statedLight["--bg-0"] as string)).toBe("light");
		expect(statedLight["--bg-0"]).not.toBe(flippedLight["--bg-0"]);
		expect(contrast(statedLight["--fg-0"] as string, statedLight["--bg-0"] as string)).toBeGreaterThan(
			contrast(flippedLight["--fg-0"] as string, flippedLight["--bg-0"] as string),
		);
	});

	it("changes nothing about the scheme it did not state", () => {
		const plain = makeXtyleAlgorithm(toPreset({ id: "plain" }));
		const stated = makeXtyleAlgorithm(
			toPreset({ id: "plain", anchorsByScheme: { light: { bg: "#eef0f4", fg: "#1b1d22" } } }),
		);
		expect(derive(stated, {})).toEqual(derive(plain, {}));
	});

	it("yields the surface to a caller's seed and keeps the rest of its own taste", () => {
		const stated = makeXtyleAlgorithm(
			toPreset({
				id: "stated",
				anchors: { accent: "#3ad6f8" },
				anchorsByScheme: { light: { bg: "#eef0f4", fg: "#1b1d22", accent: "#0096b1" } },
			}),
		);
		const seeded = derive(stated, { constraints: { "--bg-0": "#fbf3e4" } });

		expect(seeded["--bg-0"], "the caller's own surface is never overridden").toBe("#fbf3e4");
		expect(seeded["--accent"], "reaching light by seed still gets the light half's accent").not.toBe(
			derive(stated, {})["--accent"],
		);
	});

	it("honors a caller's own brand over the stated one", () => {
		const stated = makeXtyleAlgorithm(
			toPreset({ id: "stated", anchorsByScheme: { light: { bg: "#eef0f4", fg: "#1b1d22", accent: "#0096b1" } } }),
		);
		const brand = derive(stated, { constraints: { "--bg-0": "#fbf3e4", "--accent": "#7c5cff" } });
		expect(brand["--accent"]).toBe("#7c5cff");
	});

	it("carries a scheme's own accent, so a brand tuned for one half does not have to serve both", () => {
		const stated = makeXtyleAlgorithm(
			toPreset({
				id: "stated",
				anchors: { accent: "#3ad6f8" },
				anchorsByScheme: { light: { bg: "#e6e9ef", fg: "#1b1d22", accent: "#0096b1" } },
			}),
		);
		const light = derive(stated, { knobs: { scheme: "light" } });
		expect(contrast(light["--accent"] as string, light["--bg-0"] as string)).toBeGreaterThan(SURFACE_SEPARATION);
	});

	for (const id of BLESSED) {
		it(`${id} answers for both halves`, () => {
			const algorithm = getAlgorithm(id);
			const light = derive(algorithm, invertedOptions(algorithm, {}));
			const page = light["--bg-0"] as string;

			expect(schemeOf(page), `${id}'s light half must be light`).toBe("light");

			expect(toOklchColor(page).l, `${id}'s light half is a mid-tone, not a page`).toBeGreaterThan(PAGE_LIGHTNESS);

			expect(
				contrast(light["--fg-0"] as string, page),
				`${id}'s light half must be readable`,
			).toBeGreaterThanOrEqual(4.5);

			for (const fill of FILLS) {
				expect(
					contrast(light[fill] as string, page),
					`${id}: ${fill} must separate from its light page`,
				).toBeGreaterThanOrEqual(SURFACE_SEPARATION);
			}
		});
	}
});
