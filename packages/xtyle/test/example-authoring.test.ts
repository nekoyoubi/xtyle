import { describe, expect, it } from "vitest";
import { listComponents } from "../src/manifest/registry.js";

const PASSTHROUGH = new Set([
	"class",
	"dir",
	"hidden",
	"id",
	"inert",
	"lang",
	"part",
	"popover",
	"role",
	"slot",
	"style",
	"tabindex",
	"title",
]);

const kebab = (name: string): string => name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
const openValueSpace = (type: string | undefined): boolean => /\bstring(\[\])?\b/.test(type ?? "");

const names = new Map<string, Set<string>>();
const optionSets = new Map<string, Map<string, Set<string>>>();

for (const manifest of listComponents()) {
	const tag = `xtyle-${manifest.id}`;
	const known = new Set(PASSTHROUGH);
	for (const prop of manifest.props) {
		known.add(kebab(prop.name));
		if (prop.attr) known.add(prop.attr);
		for (const alias of prop.aliases ?? []) known.add(alias.toLowerCase());
	}
	if (manifest.variants.length) known.add("variant");
	if (manifest.sizes.length) known.add("size");
	names.set(tag, known);

	for (const prop of manifest.props) {
		if (!prop.options?.length || openValueSpace(prop.type)) continue;
		const on = prop.attrOn ?? tag;
		const byAttr = optionSets.get(on) ?? new Map<string, Set<string>>();
		for (const name of [kebab(prop.name), prop.attr, ...(prop.aliases ?? [])]) {
			if (name) byAttr.set(name.toLowerCase(), new Set(prop.options.map(String)));
		}
		optionSets.set(on, byAttr);
	}
}

const ignorable = (name: string): boolean =>
	name === "/" ||
	name.startsWith("data-") ||
	name.startsWith("aria-") ||
	name.startsWith("on") ||
	name.startsWith("bind:");

function audit(html: string): string[] {
	const found: string[] = [];
	for (const element of html.matchAll(/<(xtyle-[a-z-]+)((?:\s+[^\s=>]+(?:="[^"]*")?)*)\s*\/?>/g)) {
		const tag = element[1] as string;
		const known = names.get(tag);
		if (!known) continue;
		const byAttr = optionSets.get(tag);
		for (const attribute of element[2].matchAll(/([^\s=]+)(?:="([^"]*)")?/g)) {
			const name = attribute[1].toLowerCase();
			if (!name || ignorable(name)) continue;
			if (!known.has(name)) {
				found.push(`<${tag} ${name}> is not a documented prop`);
				continue;
			}
			const allowed = byAttr?.get(name);
			const value = attribute[2];
			if (!allowed || value === undefined || value === "" || value.includes("{") || allowed.has(value)) continue;
			found.push(`<${tag} ${name}="${value}"> — expected ${[...allowed].join(" | ")}`);
		}
	}
	return found;
}

describe("published html examples", () => {
	for (const manifest of listComponents()) {
		const examples = manifest.examples.filter((example) => example.source.html);
		if (!examples.length) continue;
		it(`${manifest.id} copies out clean`, () => {
			const problems = examples.flatMap((example) =>
				audit(example.source.html ?? "").map((issue) => `${example.id}: ${issue}`),
			);
			expect(problems).toEqual([]);
		});
	}

	it("audits a corpus worth auditing", () => {
		const total = listComponents().reduce(
			(sum, manifest) => sum + manifest.examples.filter((example) => example.source.html).length,
			0,
		);
		expect(total).toBeGreaterThan(100);
	});

	it("bites on a value outside a closed set", () => {
		expect(audit('<xtyle-stat sentiment="bad"></xtyle-stat>')).toEqual([
			'<xtyle-stat sentiment="bad"> — expected positive | negative | neutral',
		]);
		expect(audit('<xtyle-stat nonsense="x"></xtyle-stat>')).toEqual(["<xtyle-stat nonsense> is not a documented prop"]);
		expect(audit('<xtyle-stat sentiment="negative"></xtyle-stat>')).toEqual([]);
	});
});
