import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// The `xoji` CLI is a first-class product surface (dual-entry: importable API + CLI bin + DOM helper).
// The engine tests cover derivation; this smokes the built bin end-to-end — arg parsing, the seed
// channel (`--bg` / `--accent` → constraints), format dispatch, and emit — so the wiring can't rot silently.
const here = dirname(fileURLToPath(import.meta.url));
const cli = resolve(here, "../dist/cli.js");
const run = (...args: string[]): string => execFileSync("node", [cli, ...args], { encoding: "utf8" });

describe.runIf(existsSync(resolve(here, "../dist/cli.js")))("xoji CLI", () => {
	it("derives css from bg + accent, honoring the pinned accent, with no malformed values", () => {
		const css = run("derive", "--bg", "#0f1115", "--accent", "#5b8cff", "--format", "css");
		expect(css).toContain(":root {");
		expect(css).toContain("--accent: #5b8cff;");
		expect(css).not.toMatch(/NaN|undefined|null/);
		// every custom-property declaration carries a non-empty value
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
		expect(out).toContain("xoji-default");
	});
});
