import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));

/**
 * Properties one engine ships and another does not. Reaching for one is a decision made before the
 * code, not discovered after it ships — an unsupported property drops out of the cascade silently
 * and leaves whatever was underneath, so the feature reads as a bug in the artwork rather than a
 * missing capability. Branch on the capability with `@supports` and the check stands aside.
 */
const NOT_UNIVERSAL = [
	"mask-border",
	"-webkit-mask-box-image",
	"field-sizing",
	"anchor-name",
	"position-anchor",
	"@position-try",
	"scroll-marker-group",
	"::scroll-marker",
	"::scroll-button",
	"corner-shape",
	"text-box-trim",
	"text-box-edge",
	"animation-timeline",
	"scroll-timeline",
	"view-timeline",
	"@scope",
	"text-wrap: pretty",
];

function sourceFiles(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) return sourceFiles(path);
		return /\.(ts|css)$/.test(entry.name) ? [path] : [];
	});
}

function withoutSupportsBlocks(css: string): string {
	let out = "";
	let index = 0;
	while (index < css.length) {
		const at = css.indexOf("@supports", index);
		if (at < 0) return out + css.slice(index);
		out += css.slice(index, at);
		const open = css.indexOf("{", at);
		if (open < 0) return out;
		let depth = 0;
		let cursor = open;
		for (; cursor < css.length; cursor++) {
			if (css[cursor] === "{") depth++;
			else if (css[cursor] === "}" && --depth === 0) break;
		}
		index = cursor + 1;
	}
	return out;
}

describe("the shipped css stays inside what every target engine implements", () => {
	const files = sourceFiles(resolve(here, "..", "src", "css"));

	it("reads every stylesheet source, so a clean result means something", () => {
		expect(files.length).toBeGreaterThan(10);
	});

	for (const property of NOT_UNIVERSAL) {
		it(`uses no unguarded ${property}`, () => {
			const offenders = files.filter((file) => withoutSupportsBlocks(readFileSync(file, "utf8")).includes(property));
			expect(offenders.map((file) => file.slice(file.indexOf("src")))).toEqual([]);
		});
	}
});
