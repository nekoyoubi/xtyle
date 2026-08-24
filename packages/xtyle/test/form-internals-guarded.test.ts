// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const elementsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "elements");

/**
 * `attachInternals` is not universally available — it reached Safari only in 16.4 — and an element
 * that calls it bare in its constructor throws before it can upgrade, so the component never renders
 * at all rather than merely losing form participation. Both `textarea` and `checkbox` shipped that
 * way and neither was caught by a test: the visual suite runs browsers that have the API, and no
 * engine test constructed either element.
 */
describe("a form-associated element survives an environment without ElementInternals", () => {
	const sources = readdirSync(elementsDir)
		.filter((f) => f.endsWith(".ts") && !f.endsWith(".d.ts"))
		.map((f) => ({ name: f, text: readFileSync(join(elementsDir, f), "utf8") }))
		.filter((f) => f.text.includes("attachInternals"));

	it("finds the form-associated elements to check", () => {
		expect(sources.length, "no element calls `attachInternals`, so this guard is checking nothing").toBeGreaterThan(5);
	});

	for (const { name, text } of sources) {
		it(`${name} guards its attachInternals call`, () => {
			const guarded =
				text.includes('"attachInternals" in this') ||
				text.includes('typeof this.attachInternals === "function"');
			expect(
				guarded,
				`${name} calls \`attachInternals\` without checking for it first, so the element throws on construction wherever the API is missing and never upgrades`,
			).toBe(true);
		});
	}
});
