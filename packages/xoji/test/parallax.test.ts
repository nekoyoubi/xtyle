import { describe, expect, it } from "vitest";
import { getComponent, coverComponent, derive } from "../src/index.js";
import { xojiDefault } from "../src/batteries.js";

const register = derive(xojiDefault, {
	constraints: { "--bg-0": "#0b0d12", "--fg-0": "#e6e9ef", "--accent": "#6ea8fe" },
});

describe("parallax", () => {
	it("registers the parallax component in the media category", () => {
		const manifest = getComponent("parallax");
		expect(manifest.category).toBe("media");
		expect(manifest.name).toBe("Parallax");
	});

	it("covers every consumed token against xoji-default", () => {
		const result = coverComponent(getComponent("parallax"), register);
		expect(result.missing, `missing: ${result.missing.join(", ")}`).toEqual([]);
		expect(result.covered).toBe(true);
	});

	it("declares a default layer slot and the sizing knobs", () => {
		const manifest = getComponent("parallax");
		expect(manifest.slots.some((s) => s.name === "default")).toBe(true);
		const props = manifest.props.map((p) => p.name);
		expect(props).toEqual(expect.arrayContaining(["min-height", "amplitude", "mode"]));
	});

	it("offers a scroll and a cursor mode", () => {
		const mode = getComponent("parallax").props.find((p) => p.name === "mode");
		expect(mode?.default).toBe("scroll");
		expect(mode?.type).toContain("cursor");
	});
});
