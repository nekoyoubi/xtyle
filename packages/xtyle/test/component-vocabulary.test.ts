// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { resolveFormatProfile, sanitizeFragment } from "@xriptjs/sanitize";
import "../src/elements/index.js";
import { listComponents } from "../src/manifest/index.js";

const here = dirname(fileURLToPath(import.meta.url));
const host = JSON.parse(readFileSync(resolve(here, "../src/elements/fragments/component-host.json"), "utf8")) as {
	formats: Record<string, unknown>;
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

	it("lets the config children a component reads through a j5ml fill", () => {
		const profile = resolveFormatProfile("application/x-xtyle+j5ml", host.formats, host.vocabularies as Record<string, unknown>);
		const source = JSON.stringify([
			["xtyle-progress", { value: 80 }, ["threshold", { below: 50, tone: "danger", pulse: "fast" }]],
			["xtyle-select", { label: "Pick", value: "b" }, ["option", { value: "a" }, "A"], ["optgroup", { label: "More" }, ["option", { value: "b", disabled: true }, "B"]]],
		]);
		const result = sanitizeFragment(source, profile!);
		expect(result.diagnostics.map((d) => `${d.code}`)).toEqual([]);
		expect(result.strippedElements).toEqual([]);
		expect(result.strippedAttributes).toEqual([]);
	});

	it("types every structured prop as JSON, so a fill can hand over the value itself", () => {
		const structured = /\[\]|\{|Record<|Array<|Item\b|Spec\b|Knobs|Constraints|DockLayout/;
		const untyped: string[] = [];
		for (const component of listComponents()) {
			for (const prop of component.props) {
				if (!prop.bindings.includes("html") || prop.propertyOnly || prop.attrOn || prop.readonly) continue;
				if (!structured.test(prop.type) || prop.type.startsWith("(")) continue;
				const attr = prop.attr ?? prop.name.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
				const declared = (componentNodes[`xtyle-${component.id}`]?.props?.[attr] ?? {}) as { type?: string[] };
				if (!declared.type?.includes("array") || !declared.type.includes("object")) untyped.push(`xtyle-${component.id}.${attr}`);
			}
		}
		expect(untyped).toEqual([]);
	});

	it("accepts a structured prop as a value or as the JSON string it used to need", () => {
		const profile = resolveFormatProfile("application/x-xtyle+j5ml", host.formats, host.vocabularies as Record<string, unknown>);
		for (const items of [[{ label: "Inbox", value: "inbox" }], JSON.stringify([{ label: "Inbox", value: "inbox" }])]) {
			const result = sanitizeFragment(JSON.stringify(["xtyle-list", { label: "Folders", items }]), profile!);
			expect(result.diagnostics).toEqual([]);
			expect(result.strippedAttributes).toEqual([]);
		}
	});

	it("is actually reading live elements, not passing because nothing registered", () => {
		const covered = Object.keys(componentNodes).filter((tag) => customElements.get(tag) !== undefined);
		expect(covered.length).toBeGreaterThan(50);
	});
});
