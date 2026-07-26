import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
const here = dirname(fileURLToPath(import.meta.url));
const cli = resolve(here, "../dist/cli.js");
const run = (...args: string[]): string => execFileSync("node", [cli, ...args], { encoding: "utf8" });

describe.runIf(existsSync(resolve(here, "../dist/cli.js")))("xtyle CLI", () => {
	it("derives css from bg + accent, honoring the pinned accent, with no malformed values", () => {
		const css = run("derive", "--bg", "#0f1115", "--accent", "#5b8cff", "--format", "css");
		expect(css).toContain(":root {");
		expect(css).toContain("--accent: #5b8cff;");
		expect(css).not.toMatch(/NaN|undefined|null/);
		const decls = [...css.matchAll(/^\s*(--[a-z0-9-]+):\s*(.*);$/gim)];
		expect(decls.length).toBeGreaterThan(200);
		expect(decls.every(([, , value]) => (value ?? "").trim().length > 0)).toBe(true);
	});

	it("derives a flat json register that parses", () => {
		const json = JSON.parse(run("derive", "--bg", "#0f1115", "--accent", "#5b8cff", "--format", "json")) as Record<
			string,
			string
		>;
		expect(Object.keys(json).length).toBeGreaterThan(200);
		expect(json["--accent"]).toBe("#5b8cff");
		expect(Object.values(json).every((v) => typeof v === "string" && v.trim().length > 0)).toBe(true);
	});

	it("lists the blessed algorithms", () => {
		const out = run("list");
		expect(out).toContain("xtyle-default");
	});

	describe("the knob tier is reachable", () => {
		const registerOf = (...args: string[]): Record<string, string> =>
			JSON.parse(run("derive", "--format", "json", ...args)) as Record<string, string>;

		it.each(["fan", "step", "shade", "duo"])("derives the %s accent strategy", (strategy) => {
			const register = registerOf("--knob", `accentStrategy=${strategy}`);
			expect(register["--accent-2"]).toMatch(/^#[0-9a-f]{6}$/i);
		});

		it("gives each strategy a distinct accent family", () => {
			const families = ["fan", "step", "shade", "duo"].map((s) =>
				["--accent-2", "--accent-3", "--accent-4"].map((t) => registerOf("--knob", `accentStrategy=${s}`)[t]).join(),
			);
			expect(new Set(families).size).toBe(4);
		});

		it("types a numeric knob as a number rather than the string the shell hands over", () => {
			expect(registerOf("--knob", "surfaceRamp=-0.06")["--bg-2"]).not.toBe(registerOf()["--bg-2"]);
		});

		it("reports each algorithm's knob domains, so `--knob` has a discoverable vocabulary", () => {
			const listed = JSON.parse(run("knobs")) as { algorithms: Array<{ id: string; knobSpecs: Array<{ name: string }> }> };
			const nite = listed.algorithms.find((a) => a.id === "nxi-nite");
			const dflt = listed.algorithms.find((a) => a.id === "xtyle-default");
			expect(nite?.knobSpecs.map((s) => s.name)).toContain("hour");
			expect(dflt?.knobSpecs.map((s) => s.name)).not.toContain("hour");
		});

		it("fails loudly on a knob value outside the algorithm's domain", () => {
			expect(() => run("derive", "--knob", "accentStrategy=duoo")).toThrow();
			expect(() => run("derive", "--knob", "mood=wistful")).toThrow();
			expect(() => run("derive", "--knob", "surfaceRamp=9")).toThrow();
		});

		it("keeps `xtyle list` printing bare ids, one per line", () => {
			const lines = run("list").trim().split(/\r?\n/);
			expect(lines).toContain("xtyle-default");
			expect(lines.every((l) => /^[a-z0-9-]+$/.test(l))).toBe(true);
		});
	});

	describe("every command survives a retired algorithm id", () => {
		it("derives it as the knob it retired into", () => {
			const viaRetired = run("derive", "-a", "xtyle-brand", "--format", "json");
			const viaKnob = run("derive", "-a", "xtyle-default", "--knob", "accentStrategy=shade", "--format", "json");
			expect(viaRetired).toBe(viaKnob);
		});

		it("audits it", () => {
			expect(() => run("audit", "-a", "xtyle-brand")).not.toThrow();
		});

		it("covers it", () => {
			expect(() => run("coverage", "-a", "xtyle-brand", "--consumed", "--bg-0,--fg-0")).not.toThrow();
		});

		it("writes a theme file naming a live algorithm, never the retired one", () => {
			const theme = JSON.parse(run("derive", "-a", "xtyle-brand", "--format", "theme")) as {
				recipe: { algorithm: string; knobs?: Record<string, unknown> };
			};
			expect(theme.recipe.algorithm).toBe("xtyle-default");
			expect(theme.recipe.knobs).toMatchObject({ accentStrategy: "shade" });
		});
	});
});
