import { describe, expect, it } from "vitest";
import { derive, emit, emitters, registerEmitter } from "../src/index.js";
import { xtyleDefault } from "../src/batteries.js";

const register = derive(xtyleDefault, { constraints: { "--bg-0": "#0f1115", "--accent": "#5b8cff" } });

describe("emit", () => {
	it("emits a :root css block with every token", () => {
		const css = emit(register, "css");
		expect(css.startsWith(":root {")).toBe(true);
		expect(css).toContain("--accent:");
		expect(css.trim().endsWith("}")).toBe(true);
	});

	it("emits a flat json object that round-trips", () => {
		const json = emit(register, "json");
		const parsed = JSON.parse(json);
		expect(parsed["--accent"]).toBe(register["--accent"]);
		expect(Object.values(parsed).every((v) => typeof v === "string")).toBe(true);
	});

	it("lists known emitters and throws on unknown", () => {
		expect(emitters()).toContain("css");
		expect(emitters()).toContain("json");
		expect(() => emit(register, "yaml")).toThrow();
	});

	it("is extensible via registerEmitter", () => {
		registerEmitter("count", (r) => String(Object.keys(r).length));
		expect(emit(register, "count")).toBe(String(Object.keys(register).length));
	});

	it("emits prism css that maps token classes onto the code family", () => {
		const css = emit(register, "prism");
		expect(css).toContain("var(--code-keyword");
		expect(css).toContain(".token.comment");
		expect(css).toContain("var(--code-bg");
	});

	it("emits a valid monaco theme from the code family", () => {
		const theme = JSON.parse(emit(register, "monaco"));
		expect(theme.base).toBe("vs-dark");
		expect(theme.inherit).toBe(true);
		const keyword = theme.rules.find((r: { token: string }) => r.token === "keyword");
		expect(keyword.foreground).toMatch(/^[0-9a-f]{6}$/);
		expect(theme.colors["editor.background"]).toMatch(/^#[0-9a-f]{6}$/);
		expect(theme.colors["editor.selectionBackground"]).toMatch(/^#[0-9a-f]{8}$/);
	});
});
