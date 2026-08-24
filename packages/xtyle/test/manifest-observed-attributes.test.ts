// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import "../src/elements/index.js";
import { listComponents } from "../src/manifest/registry.js";
import type { ComponentManifest } from "../src/manifest/types.js";

const PLATFORM_ATTRIBUTES = new Set(["aria-label", "aria-labelledby", "title", "lang", "dir"]);

const kebab = (name: string): string => name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

function documented(manifest: ComponentManifest): Set<string> {
	const names = new Set<string>();
	for (const prop of manifest.props) {
		names.add(kebab(prop.name));
		if (prop.attr) names.add(prop.attr);
		for (const alias of prop.aliases ?? []) names.add(alias.toLowerCase());
	}
	if (manifest.variants.length) names.add("variant");
	if (manifest.sizes.length) names.add("size");
	return names;
}

function observedAttributes(id: string): string[] | null {
	const element = customElements.get(`xtyle-${id}`) as { observedAttributes?: string[] } | undefined;
	return element?.observedAttributes ?? null;
}

describe("a manifest documents every attribute its element observes", () => {
	const manifests = listComponents().filter((manifest) => observedAttributes(manifest.id)?.length);

	it("finds elements with observed attributes to check, so a refactor cannot silently empty this", () => {
		expect(manifests.length).toBeGreaterThan(50);
	});

	it("leaves no observed attribute undocumented", () => {
		const gaps: string[] = [];
		for (const manifest of manifests) {
			const known = documented(manifest);
			for (const attribute of observedAttributes(manifest.id) ?? []) {
				if (PLATFORM_ATTRIBUTES.has(attribute)) continue;
				if (!known.has(attribute)) gaps.push(`${manifest.id}.${attribute}`);
			}
		}
		expect(gaps).toEqual([]);
	});

	it("keeps the platform exemption to attributes the platform itself defines", () => {
		for (const attribute of PLATFORM_ATTRIBUTES) {
			expect(attribute).toMatch(/^(aria-[a-z]+|title|lang|dir)$/);
		}
	});
});
