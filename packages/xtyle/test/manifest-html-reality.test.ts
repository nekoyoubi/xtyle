import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { components } from "../src/manifest/index.js";

/**
 * A manifest prop name is the camelCase one the Svelte and Astro bindings take. In HTML it is the
 * kebab spelling, and the two are only ever reconciled in an author's head — a camelCase attribute is
 * not an error, it is simply not an attribute, so the component renders its defaults and nothing says
 * why. These checks hold the manifest against what HTML actually does with the names it declares.
 */
const elementsDir = join(import.meta.dirname, "..", "src", "elements");

/** Attributes the UA gives behavior to on every element, so a component adopting one inherits it. */
const HTML_GLOBALS = new Set([
	"title",
	"id",
	"slot",
	"style",
	"class",
	"hidden",
	"dir",
	"lang",
	"draggable",
	"tabindex",
	"role",
	"translate",
	"spellcheck",
	"inert",
	"popover",
	"autofocus",
	"contenteditable",
	"accesskey",
]);

/** Props whose name is a global on purpose, because the component means the global's own behavior. */
const DELIBERATE: Record<string, Set<string>> = {
	field: new Set(["spellcheck", "autofocus"]),
	textarea: new Set(["spellcheck", "autofocus"]),
	combobox: new Set(["spellcheck", "autofocus"]),
	"command-palette": new Set(["spellcheck"]),
};

function kebab(name: string): string {
	return name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

function elementSource(id: string): string | null {
	const file = join(elementsDir, `${id}.ts`);
	try {
		return readFileSync(file, "utf8");
	} catch {
		return null;
	}
}

const htmlManifests = Object.values(components).filter((m) => m.bindings.includes("html") && m.props.length > 0);

describe("a manifest prop name is not an HTML global", () => {
	for (const manifest of htmlManifests) {
		const offenders = manifest.props
			.map((p) => p.attr ?? kebab(p.name))
			.filter((attr) => HTML_GLOBALS.has(attr) && !DELIBERATE[manifest.id]?.has(attr));
		it(`${manifest.id} declares no prop that collides with a global`, () => {
			expect(
				offenders,
				`${manifest.id} declares ${offenders.join(", ")}, which the UA already gives behavior to on every element — the component inherits that behavior whether it wants it or not (a \`title\` paints a native tooltip, a \`hidden\` or \`draggable\` is a functional collision)`,
			).toEqual([]);
		});
	}
});

describe("a manifest prop's html spelling is one the element reads", () => {
	for (const manifest of htmlManifests) {
		const source = elementSource(manifest.id);
		if (!source) continue;
		const multiword = manifest.props.filter(
			(p) => /[A-Z]/.test(p.name) && !p.name.includes("(") && !p.type.includes("=>") && !p.readonly,
		);
		if (multiword.length === 0) continue;
		it(`${manifest.id} reads every multi-word prop by its kebab attribute`, () => {
			for (const prop of multiword) {
				const attr = prop.attr ?? kebab(prop.name);
				expect(
					source.includes(`"${attr}"`) || source.includes(`-${attr.split("-").slice(1).join("-")}\``),
					`<xtyle-${manifest.id}> never reads "${attr}", the HTML spelling of the manifest's \`${prop.name}\` — an author writing \`${prop.name}="…"\` in markup gets silence`,
				).toBe(true);
			}
		});
	}
});
