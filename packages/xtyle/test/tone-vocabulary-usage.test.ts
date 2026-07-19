import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { FULL_TONES, EMPHASIS_TONES, EYEBROW_EMPHASIS, SECTION_SURFACES } from "../src/vocab.js";

const REPO = join(import.meta.dirname, "..", "..", "..");

/**
 * A tone outside the roster interpolates into a class name no rule matches, so the component renders
 * with no chrome and the page still looks deliberate. `resolveTone` now catches it at runtime and
 * falls back, but a fallback is a repair, not a pass: the demo still shows the wrong color, and the
 * warning only appears in a build log nobody reads. `teal` sat in the tour demo this way, and the
 * toast suite asserted on `violet`, both unnoticed.
 */
const ALLOWED = new Set<string>([
	...FULL_TONES,
	...EMPHASIS_TONES,
	...EYEBROW_EMPHASIS,
	...SECTION_SURFACES,
	"none",
]);

const SOURCE = /\.(astro|svelte|ts|html)$/;
const SKIP = /node_modules|[\\/]dist[\\/]|[\\/]\.astro[\\/]|__baselines__|source\.generated/;

function toneLiterals(dir: string): { file: string; tone: string }[] {
	const found: { file: string; tone: string }[] = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (SKIP.test(path)) continue;
		if (entry.isDirectory()) {
			found.push(...toneLiterals(path));
			continue;
		}
		if (!SOURCE.test(entry.name)) continue;
		for (const match of readFileSync(path, "utf8").matchAll(/\btone=["']([a-z0-9-]+)["']/g)) {
			found.push({ file: path.slice(REPO.length + 1), tone: match[1] });
		}
	}
	return found;
}

describe("tone vocabulary usage", () => {
	it("never authors a tone the roster cannot resolve", () => {
		const offenders = toneLiterals(join(REPO, "apps", "site", "src"))
			.concat(toneLiterals(join(REPO, "packages")))
			.filter(({ tone }) => !ALLOWED.has(tone));
		expect(offenders).toEqual([]);
	});
});
