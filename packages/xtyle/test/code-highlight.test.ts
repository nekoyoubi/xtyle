import { describe, expect, it } from "vitest";
import {
	highlight,
	registerLanguage,
	resolveLanguage,
	warmLanguages,
} from "../src/elements/code-highlight.js";

describe("resolveLanguage", () => {
	it("resolves a canonical id to itself", () => {
		expect(resolveLanguage("typescript")).toBe("typescript");
	});

	it("resolves an alias to its canonical id", () => {
		expect(resolveLanguage("ts")).toBe("typescript");
		expect(resolveLanguage("html")).toBe("markup");
		expect(resolveLanguage("js")).toBe("javascript");
	});

	it("is case- and whitespace-insensitive", () => {
		expect(resolveLanguage("  TS  ")).toBe("typescript");
	});

	it("returns null for a blank or unknown language", () => {
		expect(resolveLanguage(null)).toBeNull();
		expect(resolveLanguage("")).toBeNull();
		expect(resolveLanguage("   ")).toBeNull();
		expect(resolveLanguage("not-a-real-language")).toBeNull();
	});
});

describe("highlight", () => {
	it("tokenizes a known language into .token spans", async () => {
		const result = await highlight("const x = 1;", "ts");
		expect(result.language).toBe("typescript");
		expect(result.html).toContain('class="token keyword"');
		expect(result.html).toContain("const");
	});

	it("falls back to escaped plain text for an unknown language", async () => {
		const result = await highlight("a < b && c > d", "not-a-real-language");
		expect(result.language).toBeNull();
		expect(result.html).toBe("a &lt; b &amp;&amp; c &gt; d");
		expect(result.html).not.toContain("token");
	});

	it("loads a grammar's dependencies before the target", async () => {
		const result = await highlight("const App = () => <div />;", "tsx");
		expect(result.language).toBe("tsx");
		expect(result.html).toContain("token");
	});
});

describe("warmLanguages", () => {
	it("warms a grammar so a later highlight tokenizes it", async () => {
		await warmLanguages(["rust"]);
		const result = await highlight("fn main() {}", "rust");
		expect(result.language).toBe("rust");
		expect(result.html).toContain('class="token keyword"');
	});

	it("skips unknown ids without throwing", async () => {
		await expect(warmLanguages(["not-a-real-language", "go"])).resolves.toBeUndefined();
	});
});

describe("registerLanguage", () => {
	it("makes a custom grammar resolvable and used", async () => {
		registerLanguage("xtyle-toy", {
			keyword: /\b(?:THEME|TOKEN)\b/,
		});
		expect(resolveLanguage("xtyle-toy")).toBe("xtyle-toy");
		const result = await highlight("THEME and TOKEN", "xtyle-toy");
		expect(result.language).toBe("xtyle-toy");
		expect(result.html).toContain('class="token keyword"');
		expect(result.html).toContain("THEME");
	});

	it("resolves a custom grammar by its lowercased name", () => {
		registerLanguage("MyLang", { keyword: /x/ });
		expect(resolveLanguage("mylang")).toBe("mylang");
	});
});
