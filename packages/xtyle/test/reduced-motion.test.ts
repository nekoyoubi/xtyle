import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const componentsDir = fileURLToPath(new URL("../src/css/components", import.meta.url));
const base = readFileSync(join(componentsDir, "base.ts"), "utf8");

/** Reduced-motion is calmed in two layers. The base sheet carries one universal reset that zeroes
 * duration and iteration-count for every `xtyle-`classed element, so any app that ships the bundled
 * `componentsCss` gets motion-safety for free. That reset is load-bearing: drop it and every
 * continuously-moving surface starts ignoring the user's motion preference at once. Guard its shape
 * so a refactor can't silently remove it. */
describe("the base reduced-motion reset", () => {
	it("neutralizes animation and transition for every xtyle-classed element", () => {
		const block = base.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?\}\s*\}/);
		expect(block, "base.ts must carry a prefers-reduced-motion reset").not.toBeNull();
		const css = block?.[0] ?? "";
		expect(css).toMatch(/\[class\^="xtyle-"\]/);
		expect(css).toMatch(/animation-duration:\s*0\.01ms\s*!important/);
		expect(css).toMatch(/animation-iteration-count:\s*1\s*!important/);
		expect(css).toMatch(/transition-duration:\s*0\.01ms\s*!important/);
	});
});

/** The base reset only reaches an element when the base sheet is on the page. Each component's CSS
 * is also exported on its own (`spinnerCss`, `skeletonCss`, …), and a consumer that adopts one module
 * in isolation ships without the base layer, so it gets no motion-safety from the reset. Every
 * component that runs a CSS animation therefore carries its own `prefers-reduced-motion` guard too, so
 * the standalone path is safe (and the base reset stays a belt-and-suspenders for the bundled path).
 * The base reset alone also can't cover non-duration motion: `parallax` resets `translate` / `scale`
 * that the reset never touches, which is why per-component guards exist at all. */
describe("per-component reduced-motion self-guards", () => {
	const files = readdirSync(componentsDir).filter((f) => f.endsWith(".ts") && f !== "base.ts");
	for (const file of files) {
		const css = readFileSync(join(componentsDir, file), "utf8");
		if (!/animation:\s*(?!none)[a-zA-Z]/.test(css)) continue;
		it(`${file} guards its animation under prefers-reduced-motion`, () => {
			expect(
				css,
				`${file} runs a CSS animation but has no prefers-reduced-motion guard, so a consumer adopting its CSS module standalone (without the base reset) would keep animating for a motion-sensitive user`,
			).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
		});
	}
});
