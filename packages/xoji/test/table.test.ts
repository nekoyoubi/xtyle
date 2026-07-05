import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(fileURLToPath(new URL("../src/elements/table.ts", import.meta.url)), "utf8");

describe("xoji-table re-decoration", () => {
	it("arms a MutationObserver over the subtree so post-mount rows get decorated", () => {
		expect(source).toContain("new MutationObserver");
		expect(source).toMatch(/observe\(this,\s*\{\s*childList:\s*true,\s*subtree:\s*true\s*\}\)/);
	});

	it("disconnects the observer while decorating, so its own writes can't loop", () => {
		expect(source).toMatch(/decorate\(\):\s*void\s*\{\s*this\.contentObserver\?\.disconnect\(\)/);
	});

	it("disconnects the observer on teardown", () => {
		expect(source).toMatch(/disconnectedCallback[\s\S]*this\.contentObserver\?\.disconnect\(\)/);
	});
});
