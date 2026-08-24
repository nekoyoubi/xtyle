// @vitest-environment happy-dom
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import "../src/elements/field.js";
import "../src/elements/textarea.js";
import "../src/elements/select.js";

const ELEMENTS = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "elements");

afterEach(() => {
	document.body.innerHTML = "";
});

/**
 * `setValidity` throws when a flag is set and the message is blank, and `error=""` is a *present*
 * attribute — so `??` reads it as supplied and hands the empty string through. Binding a
 * possibly-empty error string is the ordinary shape in every framework, and it crashed the element.
 */
describe("a validity message is never empty", () => {
	for (const id of ["field", "textarea", "select"]) {
		it(`${id} survives an empty error attribute alongside invalid`, () => {
			const el = document.createElement(`xtyle-${id}`);
			el.setAttribute("name", "probe");
			document.body.appendChild(el);
			expect(() => {
				el.setAttribute("invalid", "");
				el.setAttribute("error", "");
			}).not.toThrow();
		});

		it(`${id} survives an empty required-message alongside required`, () => {
			const el = document.createElement(`xtyle-${id}`);
			el.setAttribute("name", "probe");
			document.body.appendChild(el);
			expect(() => {
				el.setAttribute("required", "");
				el.setAttribute("required-message", "   ");
			}).not.toThrow();
		});
	}

	it("routes every validity message through the guard rather than a nullish fallback", () => {
		const offenders: string[] = [];
		for (const file of readdirSync(ELEMENTS).filter((name) => name.endsWith(".ts"))) {
			const source = readFileSync(join(ELEMENTS, file), "utf8");
			for (const [line] of source.matchAll(/^.*getAttribute\("(?:error|required-message)"\)\s*\?\?.*$/gm)) {
				offenders.push(`${file}: ${line.trim()}`);
			}
		}
		expect(
			offenders,
			"`?? \"fallback\"` only catches an absent attribute; an empty one still reaches setValidity",
		).toEqual([]);
	});
});
