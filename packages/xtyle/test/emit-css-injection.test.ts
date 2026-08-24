import { describe, expect, it, vi } from "vitest";
import { emitCss } from "../src/emit/css.js";
import { derive } from "../src/index.js";
import { getAlgorithm } from "../src/batteries.js";

const ALGORITHMS = ["xtyle-default", "xtyle-hc", "xtyle-quiet", "xtyle-loud", "nxi-nite"];

describe("a register cannot write a rule the author did not", () => {
	it("drops a value that closes the declaration and opens another", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		const css = emitCss({ "--bg-0": "#101010", "--accent": "red; } body { display: none } :root { --x: 1" });
		expect(css).toContain("--bg-0: #101010;");
		expect(css).not.toContain("display: none");
		expect(warn).toHaveBeenCalledWith(expect.stringContaining("--accent"));
	});

	it("drops a name that is not a custom property", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		const css = emitCss({ "--bg-0": "#101010", "x: red; } html {": "1" });
		expect(css).not.toContain("html {");
		expect(warn).toHaveBeenCalledWith(expect.stringContaining("custom property"));
	});

	it("emits every token the blessed algorithms actually derive, in both schemes", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		for (const id of ALGORITHMS) {
			for (const scheme of ["dark", "light"] as const) {
				const register = derive(getAlgorithm(id), { knobs: { scheme } });
				const css = emitCss(register);
				const emitted = css.split("\n").filter((line) => line.trim().startsWith("--")).length;
				expect(emitted, `${id} (${scheme}) must emit every token it derives`).toBe(Object.keys(register).length);
			}
		}
		expect(warn, "no legitimate derived token may trip the guard").not.toHaveBeenCalled();
	});
});
