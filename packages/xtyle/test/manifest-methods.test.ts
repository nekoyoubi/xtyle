import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { listComponents } from "../src/manifest/registry.js";

const componentManifests = listComponents();

const ELEMENT_DIR = new URL("../src/elements/", import.meta.url);

const PLATFORM = new Set([
	"connectedCallback",
	"disconnectedCallback",
	"attributeChangedCallback",
	"adoptedCallback",
	"formDisabledCallback",
	"formResetCallback",
	"formAssociatedCallback",
	"formStateRestoreCallback",
	"constructor",
]);

const KEYWORDS = new Set(["if", "for", "while", "switch", "catch", "return", "do", "else"]);

const INTERNAL: Record<string, string[]> = {
	reveal: ["behaviorFor", "latchAt", "toneFor", "gripStyleFor", "gripFor", "commitAt", "travelFor", "focusLid"],
	"reveal-group": ["concealAll"],
	redact: ["syncRevealed"],
	dropzone: ["addFiles", "setDragging", "rejects", "containsPoint", "removeFile", "clear", "setProgress", "setStatus"],
	markdown: ["repaint"],
	bbcode: ["repaint"],
	calendar: ["focusDay"],
	combobox: ["openFrom", "hide", "reposition"],
	"date-picker": ["show", "hide", "toggle"],
	"scheme-toggle": ["toggleScheme"],
	checkbox: ["sync"],
};

function declaredMethods(id: string): string[] {
	let source: string;
	try {
		source = readFileSync(new URL(`${id}.ts`, ELEMENT_DIR), "utf8");
	} catch {
		return [];
	}
	const found = new Set<string>();
	for (const line of source.split("\n")) {
		const match = /^\t(?!private |static |get |set |readonly |declare )([a-z][A-Za-z0-9]*)\s*\(/.exec(line);
		const name = match?.[1];
		if (name && !PLATFORM.has(name) && !KEYWORDS.has(name)) found.add(name);
	}
	return [...found];
}

describe("a component's imperative surface is declared, not just implemented", () => {
	for (const manifest of componentManifests) {
		const declared = declaredMethods(manifest.id);
		if (declared.length === 0) continue;
		const internal = INTERNAL[manifest.id] ?? [];
		const expected = declared.filter((name) => !internal.includes(name)).sort();
		if (expected.length === 0) continue;

		it(`documents every public method on ${manifest.id}`, () => {
			const documented = (manifest.methods ?? []).map((method) => method.name).sort();
			expect(documented).toEqual(expected);
		});
	}

	for (const manifest of componentManifests) {
		if (!manifest.methods?.length) continue;
		it(`only documents methods ${manifest.id} actually has`, () => {
			const declared = declaredMethods(manifest.id);
			for (const method of manifest.methods ?? []) {
				expect(declared, `${manifest.id}.${method.name}`).toContain(method.name);
			}
		});
	}

	it("never claims a method is reachable from Astro, which renders no instance", () => {
		for (const manifest of componentManifests) {
			for (const method of manifest.methods ?? []) {
				expect(method.bindings, `${manifest.id}.${method.name}`).not.toContain("astro");
			}
		}
	});
});
