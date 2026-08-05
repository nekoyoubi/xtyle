import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";
import { viteExcludes, xtyleViteConfig } from "../src/vite.js";

const require = createRequire(import.meta.url);

/**
 * The list only earns its place by being more reliable than a consumer's transcription of it, and the
 * way it stops being that is silently: a dependency gets renamed or dropped, the list keeps naming the
 * old one, and the exclusion quietly stops covering the chain it was written for. So every entry is
 * checked against what is actually installed.
 */
describe("the bundler exclusion list", () => {
	it("names only packages that are really in the graph", () => {
		const missing = viteExcludes.filter((name) => {
			if (name === "@xtyle/core") return false;
			try {
				require.resolve(`${name}/package.json`);
				return false;
			} catch {
				try {
					require.resolve(name);
					return false;
				} catch {
					return true;
				}
			}
		});
		expect(missing, "an entry naming nothing installed no longer excludes what it was written for").toEqual([]);
	});

	it("names the package itself and the runtime that carries the wasm", () => {
		expect(viteExcludes).toContain("@xtyle/core");
		expect(viteExcludes).toContain("@xriptjs/runtime");
		expect(viteExcludes.some((name) => name.includes("quickjs")), "the emscripten chain is the actual cause").toBe(true);
	});

	it("hands back a fresh array, so a consumer spreading it cannot mutate ours", () => {
		const config = xtyleViteConfig();
		config.optimizeDeps.exclude.push("something-of-their-own");
		expect(xtyleViteConfig().optimizeDeps.exclude).toEqual([...viteExcludes]);
	});
});
