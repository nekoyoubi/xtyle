import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The component CSS lives in template literals, so a backtick inside a *CSS* comment closes the string
 * and the file stops parsing, throwing a cascade of syntax errors nowhere near the comment that caused
 * them. It is an easy habit to fall into when writing prose about `--tokens` and `.selectors`, so the
 * rule is enforced rather than remembered.
 *
 * A backtick in a TypeScript doc comment is fine, so only comments *inside* a literal are checked: at
 * any offset, an odd number of preceding backticks means the literal is still open.
 */
const cssDir = join(import.meta.dirname, "..", "src", "css", "components");

function insideTemplateLiteral(source: string, offset: number): boolean {
	let backticks = 0;
	for (let i = 0; i < offset; i++) {
		if (source[i] === "`" && source[i - 1] !== "\\") backticks++;
	}
	return backticks % 2 === 1;
}

describe("component css source", () => {
	const files = readdirSync(cssDir).filter((f) => f.endsWith(".ts"));

	it("has css modules to check", () => {
		expect(files.length).toBeGreaterThan(0);
	});

	for (const file of files) {
		it(`${file} keeps backticks out of its css comments`, () => {
			const source = readFileSync(join(cssDir, file), "utf8");
			const offenders: string[] = [];
			for (const match of source.matchAll(/\/\*[\s\S]*?\*\//g)) {
				if (match.index === undefined) continue;
				if (!insideTemplateLiteral(source, match.index)) continue;
				if (match[0].includes("`")) offenders.push(match[0].split("\n")[0]!.trim());
			}
			expect(
				offenders,
				`a backtick inside a css comment closes the template literal: ${offenders.join(" | ")}`,
			).toEqual([]);
		});
	}
});
