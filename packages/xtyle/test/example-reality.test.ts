// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import "../src/elements/index.js";
import { components } from "../src/manifest/index.js";

/**
 * A manifest example is the snippet the reference page prints under "Code" — the one a consumer
 * copies. Nothing checked what it says. An attribute the element does not observe is not an error at
 * runtime: it sits in the markup, the component renders its defaults, and the page keeps presenting
 * the sample as the way to drive it. That is worse than shipping no sample, and it is exactly what a
 * rename leaves behind.
 */
const HTML_GLOBALS = new Set([
	"class",
	"dir",
	"draggable",
	"hidden",
	"id",
	"inert",
	"lang",
	"popover",
	"role",
	"slot",
	"spellcheck",
	"style",
	"tabindex",
	"title",
	"translate",
]);

const TAG = /<(xtyle-[a-z0-9-]+)((?:\s+[^\s"'>=/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+))?)*)\s*\/?>/g;
const ATTR = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+))?/g;

function attributesOf(rest: string): string[] {
	return [...rest.matchAll(ATTR)].map((match) => (match[1] as string).toLowerCase());
}

const htmlExamples = Object.values(components).flatMap((manifest) =>
	(manifest.examples ?? [])
		.filter((example) => example.source?.html)
		.map((example) => ({ id: manifest.id, label: example.label ?? "", html: example.source.html as string })),
);

describe("every published example names things that exist", () => {
	it("has examples to check, so a green run is not an empty one", () => {
		expect(htmlExamples.length).toBeGreaterThan(50);
	});

	it("uses only element names the library registers", () => {
		const unknown: string[] = [];
		for (const example of htmlExamples) {
			for (const match of example.html.matchAll(TAG)) {
				const tag = match[1] as string;
				if (!customElements.get(tag)) unknown.push(`${example.id} · ${example.label} · <${tag}>`);
			}
		}
		expect(unknown).toEqual([]);
	});

	it("sets only attributes the element it names actually reads", () => {
		const strangers: string[] = [];
		for (const example of htmlExamples) {
			for (const match of example.html.matchAll(TAG)) {
				const tag = match[1] as string;
				const observed = (customElements.get(tag) as { observedAttributes?: string[] } | undefined)?.observedAttributes;
				if (!observed) continue;
				const known = new Set(observed);
				for (const attribute of attributesOf(match[2] ?? "")) {
					if (known.has(attribute) || HTML_GLOBALS.has(attribute)) continue;
					if (attribute.startsWith("aria-") || attribute.startsWith("data-") || attribute.startsWith("on")) continue;
					strangers.push(`${example.id} · <${tag} ${attribute}> (${example.label})`);
				}
			}
		}
		expect(strangers).toEqual([]);
	});
});
