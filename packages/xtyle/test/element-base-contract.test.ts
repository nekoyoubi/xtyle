import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const elementsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "elements");

/**
 * Structural guard: every custom element must extend the shared `XtyleElement` base, never
 * `HTMLElement` directly. An element on the base inherits the lifecycle contract (including the
 * `THEME_APPLY_EVENT` re-resolution wiring); one that forks off `HTMLElement` silently skips every
 * base capability, which is exactly how a chart element once went stale/black on a live theme swap.
 */
describe("element base contract", () => {
	it("every element extends XtyleElement, not HTMLElement directly", () => {
		const files = readdirSync(elementsDir).filter((f) => f.endsWith(".ts") && !f.endsWith(".d.ts"));
		const offenders: string[] = [];
		for (const file of files) {
			// XtyleElement itself is the one legitimate `extends HTMLElement` — it *is* the base.
			if (file === "base.ts") continue;
			const src = readFileSync(join(elementsDir, file), "utf8");
			const match = src.match(/class\s+\w+\s+extends\s+HTMLElement\b/);
			if (match) offenders.push(`${file}: ${match[0]}`);
		}
		expect(offenders, `these elements bypass XtyleElement:\n${offenders.join("\n")}`).toEqual([]);
	});
});
