import { describe, expect, it } from "vitest";
import { getComponent, coverComponent, derive } from "../src/index.js";
import { xtyleDefault } from "../src/batteries.js";

const register = derive(xtyleDefault, {
	constraints: { "--bg-0": "#0b0d12", "--fg-0": "#e6e9ef", "--accent": "#6ea8fe" },
});

describe("hero", () => {
	it("registers the hero component in the media category", () => {
		const manifest = getComponent("hero");
		expect(manifest.category).toBe("media");
		expect(manifest.name).toBe("Hero");
	});

	it("covers every consumed token against xtyle-default", () => {
		const result = coverComponent(getComponent("hero"), register);
		expect(result.missing, `missing: ${result.missing.join(", ")}`).toEqual([]);
		expect(result.covered).toBe(true);
	});

	it("declares a default composition slot and the align/split knobs", () => {
		const manifest = getComponent("hero");
		expect(manifest.slots.some((s) => s.name === "default")).toBe(true);
		const props = manifest.props.map((p) => p.name);
		expect(props).toEqual(expect.arrayContaining(["align", "split"]));
	});
});
