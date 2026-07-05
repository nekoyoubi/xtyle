import { describe, expect, it } from "vitest";
import { getComponent, coverComponent, derive } from "../src/index.js";
import { xojiDefault } from "../src/batteries.js";

const register = derive(xojiDefault, {
	constraints: { "--bg-0": "#0b0d12", "--fg-0": "#e6e9ef", "--accent": "#6ea8fe" },
});

describe("carousel", () => {
	it("registers the carousel component in the media category", () => {
		const manifest = getComponent("carousel");
		expect(manifest.category).toBe("media");
		expect(manifest.name).toBe("Carousel");
	});

	it("covers every consumed token against xoji-default", () => {
		const result = coverComponent(getComponent("carousel"), register);
		expect(result.missing, `missing: ${result.missing.join(", ")}`).toEqual([]);
		expect(result.covered).toBe(true);
	});

	it("declares a default slide slot and the autoplay knobs", () => {
		const manifest = getComponent("carousel");
		expect(manifest.slots.some((s) => s.name === "default")).toBe(true);
		const props = manifest.props.map((p) => p.name);
		expect(props).toEqual(expect.arrayContaining(["label", "autoplay", "interval", "loop", "controls", "dots"]));
	});
});
