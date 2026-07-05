import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const base = readFileSync(fileURLToPath(new URL("../src/css/components/base.ts", import.meta.url)), "utf8");

/** Every xoji animation (skeleton shimmer, spinner spin, badge / avatar pulse) is calmed under
 * `prefers-reduced-motion` by one universal reset in the base sheet, not per-component guards. That
 * reset is load-bearing: drop it and every continuously-moving surface starts ignoring the user's
 * motion preference at once. Guard its shape so a refactor can't silently remove it. */
describe("the base reduced-motion reset", () => {
	it("neutralizes animation and transition for every xoji-classed element", () => {
		const block = base.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?\}\s*\}/);
		expect(block, "base.ts must carry a prefers-reduced-motion reset").not.toBeNull();
		const css = block?.[0] ?? "";
		expect(css).toMatch(/\[class\^="xoji-"\]/);
		expect(css).toMatch(/animation-duration:\s*0\.01ms\s*!important/);
		expect(css).toMatch(/animation-iteration-count:\s*1\s*!important/);
		expect(css).toMatch(/transition-duration:\s*0\.01ms\s*!important/);
	});
});
