// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import "../src/elements/index.js";

const here = dirname(fileURLToPath(import.meta.url));
const host = JSON.parse(readFileSync(resolve(here, "../src/elements/fragments/component-host.json"), "utf8")) as {
	vocabularies: Record<string, { nodes: Record<string, { props?: Record<string, unknown> }> }>;
};
const componentNodes = host.vocabularies["xtyle.components"].nodes;

/**
 * The vocabulary gate is the silent one. A node that omits a prop does not fail anything — it lets the
 * sanitize floor strip that attribute off any `<xtyle-…>` a fill emits, with no error, so a mod
 * composing the component watches half its configuration quietly not arrive. `component-host.test.ts`
 * checks that every component *has* a node; the commoner miss is a node that declares a fraction of
 * what its element actually reads, which nothing was watching until this.
 */
describe("the component vocabulary covers what each element observes", () => {
	it("declares every observed attribute of every registered component", () => {
		const gaps: string[] = [];
		for (const [tag, node] of Object.entries(componentNodes)) {
			const observed = (customElements.get(tag) as { observedAttributes?: string[] } | undefined)?.observedAttributes;
			if (!observed) continue;
			const declared = new Set(Object.keys(node.props ?? {}));
			for (const attribute of observed) if (!declared.has(attribute)) gaps.push(`${tag}.${attribute}`);
		}
		expect(gaps).toEqual([]);
	});

	it("is actually reading live elements, not passing because nothing registered", () => {
		const covered = Object.keys(componentNodes).filter((tag) => customElements.get(tag) !== undefined);
		expect(covered.length).toBeGreaterThan(50);
	});
});
