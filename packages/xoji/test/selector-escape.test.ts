import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { escapeSelectorValue } from "../src/elements/fragments/selector-escape.js";

const HERE = dirname(fileURLToPath(import.meta.url));

// Values reach the fragment update hooks (tree, segmented) as opaque strings and are
// interpolated into `[data-value="..."]` selectors that run through `querySelector`.
// A raw quote produced an invalid selector that threw and took the render down; these
// guard that the escape keeps the selector well-formed for hostile values.
describe("escapeSelectorValue", () => {
	it("escapes a double quote so a value with quotes stays a valid selector string", () => {
		expect(escapeSelectorValue('find "Untitled - Notepad"')).toBe('find \\"Untitled - Notepad\\"');
	});

	it("escapes a backslash before quotes so it can't form its own escape sequence", () => {
		expect(escapeSelectorValue("a\\b")).toBe("a\\\\b");
		expect(escapeSelectorValue('a\\"b')).toBe('a\\\\\\"b');
	});

	it("escapes newlines and carriage returns that would break a CSS string token", () => {
		expect(escapeSelectorValue("a\nb")).toBe("a\\A b");
		expect(escapeSelectorValue("a\rb")).toBe("a\\D b");
	});

	it("leaves identifier-safe values untouched", () => {
		expect(escapeSelectorValue("opening")).toBe("opening");
		expect(escapeSelectorValue("5,10,20,50")).toBe("5,10,20,50");
	});
});

// The two fragment update hooks are the reported sites; guard that neither reintroduces a
// raw `data-value="${…}"` read-side selector (the write side stays `escapeAttr`).
describe("fragment update selectors escape their value", () => {
	for (const id of ["tree", "segmented"]) {
		it(`${id} never builds a raw data-value selector`, () => {
			const src = readFileSync(resolve(HERE, `../src/elements/fragments/${id}/mod.ts`), "utf8");
			const exprs = [...src.matchAll(/\[[^\]]*data-value="\$\{([^}]*)\}"/g)].map((m) => (m[1] as string).trim());
			expect(exprs.length).toBeGreaterThan(0);
			for (const expr of exprs) expect(expr.startsWith("escapeSelectorValue(")).toBe(true);
		});
	}
});
