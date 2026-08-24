import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
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

	describe("the discovery surface", () => {
		const runIn = (cwd: string, ...args: string[]): string => execFileSync("node", [cli, ...args], { cwd, encoding: "utf8" });

		let project: string;

		beforeAll(() => {
			project = mkdtempSync(join(tmpdir(), "xtyle-cli-pack-"));
			const algorithm = join(project, "algorithms", "cli-fixture-algo");
			cpSync(resolve(here, "../../../algorithms/xtyle-quiet"), algorithm, { recursive: true });
			const manifestPath = join(algorithm, "mod-manifest.json");
			const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Record<string, unknown>;
			writeFileSync(manifestPath, JSON.stringify({ ...manifest, name: "cli-fixture-algo" }, null, "\t"));

			mkdirSync(join(project, "themes"), { recursive: true });
			writeFileSync(
				join(project, "themes", "dusk.theme.json"),
				run("derive", "-a", "xtyle-quiet", "--bg", "#1a1420", "--accent", "#8b5cf6", "--format", "theme", "--name", "Dusk"),
			);

			writeFileSync(
				join(project, "package.json"),
				JSON.stringify({
					name: "@fixture/pack",
					version: "3.1.0",
					private: true,
					xtyle: {
						algorithms: [{ name: "cli-fixture-algo", entry: "./algorithms/cli-fixture-algo" }],
						themes: [{ name: "dusk", entry: "./themes/dusk.theme.json" }],
					},
				}),
			);
		});

		afterAll(() => {
			rmSync(project, { recursive: true, force: true });
		});

		it("lists what an installed pack declares, and reports none rather than failing when there are none", () => {
			expect(runIn(project, "packs")).toContain("@fixture/pack@3.1.0");
			expect(runIn(project, "packs")).toContain("cli-fixture-algo");
			expect(runIn(here, "packs")).toContain("no packs installed");
		});

		it("answers `packs` as data too, since a pack list is a query", () => {
			const listed = JSON.parse(runIn(project, "packs", "--format", "json")) as {
				packs: { name: string; algorithms: { name: string }[]; themes: { name: string }[] }[];
			};
			expect(listed.packs[0]?.name).toBe("@fixture/pack");
			expect(listed.packs[0]?.themes[0]?.name).toBe("dusk");
		});

		it("derives through a pack's own algorithm, byte-identical to the blessed one it was cut from", () => {
			const viaPack = runIn(project, "derive", "-a", "cli-fixture-algo", "--bg", "#101014", "--accent", "#e07a5f", "--format", "json");
			const viaBlessed = run("derive", "-a", "xtyle-quiet", "--bg", "#101014", "--accent", "#e07a5f", "--format", "json");
			expect(viaPack).toBe(viaBlessed);
		});

		it("derives a theme a pack declares, reproducing the tokens the file recorded", () => {
			const recorded = JSON.parse(readFileSync(join(project, "themes", "dusk.theme.json"), "utf8")) as {
				tokens: Record<string, string>;
			};
			const again = JSON.parse(runIn(project, "derive", "--theme", "dusk", "--format", "json")) as Record<string, string>;
			expect(again).toMatchObject(recorded.tokens);
		});

		it("lets a caller's own pin layer over the theme's recipe", () => {
			const again = JSON.parse(
				runIn(project, "derive", "--theme", "@fixture/pack/dusk", "--accent", "#22c55e", "--format", "json"),
			) as Record<string, string>;
			expect(again["--accent"]).toBe("#22c55e");
			expect(again["--bg-0"]).toBe("#1a1420");
		});

		it("refuses a theme nobody declares instead of deriving a default one", () => {
			expect(() => runIn(project, "derive", "--theme", "absent")).toThrow();
		});

		it("resolves a reference to an install spec without installing anything", () => {
			expect(runIn(project, "add", "@someone/pack@1.0.0#warm", "--dry-run").trim()).toBe("@someone/pack@1.0.0");
			expect(runIn(project, "add", "owner/repo@main", "--dry-run").trim()).toBe("owner/repo#main");
		});

		it("refuses an add that names no pack, and one that is not a reference at all", () => {
			expect(() => runIn(project, "add")).toThrow();
			expect(() => runIn(project, "add", "pkg && whoami", "--dry-run")).toThrow();
		});

		it("carries the discovery commands in its own usage", () => {
			const help = run("--help");
			expect(help).toContain("xtyle search");
			expect(help).toContain("xtyle add");
			expect(help).toContain("xtyle packs");
		});
	});
});

describe.runIf(existsSync(resolve(here, "../dist/cli.js")))("xtyle audit --format text", () => {
	const summary = (...args: string[]): string => run("audit", "--bg", "#0b0d12", "--accent", "#d1495b", "--format", "text", ...args);

	it("names every dimension and the weakest pair in each, rather than a wall of json", () => {
		const out = summary("--knob", "scheme=dark");
		expect(out).toMatch(/· AA · PASS/);
		for (const dimension of ["contrast", "separation", "fill/surface", "ramp"]) {
			expect(out, `missing ${dimension}`).toContain(dimension);
		}
		expect(out).toMatch(/closest [\d.]+\s+--accent vs --danger/);
		expect(out).toMatch(/floor 0\.02/);
		expect(out.split("\n").length).toBeLessThan(12);
	});

	it("grades a seeded theme's counterpart alongside it, and names which is which", () => {
		const out = summary();
		expect(out).toMatch(/· dark · AA ·/);
		expect(out).toMatch(/· light · AA ·/);
	});

	it("grades one scheme when the pin leaves no counterpart, and says why", () => {
		const out = summary("--knob", "scheme=light");
		expect(out).toMatch(/· light · AA ·/);
		expect(out).not.toMatch(/· dark ·/);
		expect(out).toContain("graded one scheme");
	});

	it("grades both halves of an algorithm that states an anchor pair per scheme", () => {
		const out = run("audit", "-a", "xtyle-default", "--format", "text");
		expect(out).toContain("xtyle-default · dark");
		expect(out).toContain("xtyle-default · light");
		expect(out).not.toContain("graded one scheme");
	});

	it("grades one half when the caller pins the scheme, since a pin leaves nothing to flip", () => {
		const out = run("audit", "-a", "xtyle-default", "--knob", "scheme=light", "--format", "text");
		expect(out).toContain("xtyle-default · light");
		expect(out).not.toContain("xtyle-default · dark");
	});

	it("says which dimension decides the verdict, since three of the four are reports", () => {
		expect(summary()).toContain("only contrast decides the verdict");
	});

	it("counts what falls under a report's floor without changing the verdict", () => {
		// INFO: this register fails contrast, so the CLI exits 1 and execFileSync throws with stdout attached.
		let out: string;
		try {
			out = run("audit", "--bg", "#ffffff", "--set", "--fg-0=#8a8a8a", "--format", "text");
		} catch (error) {
			out = String((error as { stdout?: string }).stdout ?? "");
		}
		expect(out).toContain("· FAIL");
		expect(out).toMatch(/tightest 0\s+--fg-0 → --fg-1/);
		expect(out).toMatch(/\d+ under/);
	});

	it("leaves json the default, so a gate parsing stdout is unaffected", () => {
		const out = run("audit", "--bg", "#0b0d12", "--accent", "#d1495b");
		expect(() => JSON.parse(out)).not.toThrow();
	});

	it("keys json by scheme when it graded both, and stays flat when it graded one", () => {
		const both = JSON.parse(run("audit", "--bg", "#0b0d12", "--accent", "#d1495b"));
		expect(Object.keys(both.schemes)).toEqual(["dark", "light"]);
		expect(both.schemes.dark.entries.length).toBeGreaterThan(0);
		expect(both.passes).toBe(both.schemes.dark.passes && both.schemes.light.passes);

		const one = JSON.parse(run("audit", "--bg", "#0b0d12", "--accent", "#d1495b", "--knob", "scheme=dark"));
		expect(one.schemes).toBeUndefined();
		expect(one.entries.length).toBeGreaterThan(0);
	});
});
