import { describe, expect, it } from "vitest";
import { coverage, coverComponents, derive } from "../src/index.js";
import { xojiDefault } from "../src/batteries.js";

const register = derive(xojiDefault, { constraints: { "--bg-0": "#0f1115", "--accent": "#5b8cff" } });

describe("coverage", () => {
	it("reports covered when the consumed floor is produced", () => {
		const result = coverage(["--bg-0", "--fg-0", "--accent"], register);
		expect(result.covered).toBe(true);
		expect(result.missing).toHaveLength(0);
	});

	it("normalizes names without the leading dashes", () => {
		const result = coverage(["bg-0", "accent"], register);
		expect(result.covered).toBe(true);
	});

	it("reports missing tokens", () => {
		const result = coverage(["--bg-0", "--does-not-exist"], register);
		expect(result.covered).toBe(false);
		expect(result.missing).toContain("--does-not-exist");
	});

	it("the full produces set covers itself", () => {
		expect(coverage(xojiDefault.produces, register).covered).toBe(true);
	});
});

describe("coverage ergonomic overloads (adopter-applied register)", () => {
	it("accepts the object-arg form", () => {
		expect(coverage({ consumed: ["--bg-0", "--accent"], produced: register }).covered).toBe(true);
	});

	it("coverComponents checks component ids against an explicit produced register", () => {
		const [result] = coverComponents(register, ["button"]);
		expect(result).toMatchObject({ id: "button", covered: true });
	});

	it("coverComponents accepts the components-first object-arg form", () => {
		const results = coverComponents(["button", "badge"], { produced: register });
		expect(results.map((r) => r.id)).toEqual(["button", "badge"]);
		expect(results.every((r) => r.covered)).toBe(true);
	});

	it("coverComponents reports missing tokens against a sparse applied register", () => {
		const sparse = { "--bg-0": "#000000" } as typeof register;
		const [result] = coverComponents(["button"], { produced: sparse });
		expect(result.covered).toBe(false);
		expect(result.missing.length).toBeGreaterThan(0);
	});

	it("coverComponents throws on an unknown component id", () => {
		expect(() => coverComponents(register, ["not-a-component"])).toThrow(/unknown component id/);
	});
});
