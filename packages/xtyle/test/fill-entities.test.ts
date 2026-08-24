import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const srcDir = join(dirname(fileURLToPath(import.meta.url)), "..", "src");
const fragmentsDir = join(srcDir, "elements", "fragments");
const markupDir = join(srcDir, "markup");

/**
 * XML predefines five named entities and no more, so anything a fill writes beyond these reaches the
 * page as its own literal characters: `&times;` renders as six of them beside a `&#215;` that decodes
 * correctly in the same template. It fails silently and only in the rendered output, which is why it
 * survived a review, a manifest and a visual baseline before a consumer reported it.
 */
const XML_PREDEFINED = new Set(["amp", "lt", "gt", "apos", "quot"]);
const NAMED_ENTITY = /&([a-zA-Z][a-zA-Z0-9]*);/g;

/**
 * Both surfaces that emit markup, because a component has two: the fill a mod can replace, and the
 * `markup/` module the static render and the Astro binding go through. Fixing one and calling the bug
 * closed is exactly how the `&times;` survived its own fix.
 */
function fillSources(): { id: string; source: string }[] {
	const fills = readdirSync(fragmentsDir, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => ({ id: `fragments/${entry.name}`, path: join(fragmentsDir, entry.name, "mod.ts") }));
	const markup = readdirSync(markupDir, { withFileTypes: true })
		.filter((entry) => entry.isFile() && entry.name.endsWith(".ts"))
		.map((entry) => ({ id: `markup/${entry.name}`, path: join(markupDir, entry.name) }));
	return [...fills, ...markup].flatMap((mod) => {
		try {
			return [{ id: mod.id, source: readFileSync(mod.path, "utf8") }];
		} catch {
			return [];
		}
	});
}

describe("what a fill writes into the page", () => {
	it("spells a glyph as a numeric reference, since only five named entities survive", () => {
		const offenders: string[] = [];
		for (const { id, source } of fillSources()) {
			for (const [entity, name] of source.matchAll(NAMED_ENTITY)) {
				if (!XML_PREDEFINED.has(name)) offenders.push(`${id}: ${entity}`);
			}
		}
		expect(offenders).toEqual([]);
	});

	it("would name a fill that reintroduced one", () => {
		const sources = fillSources();
		expect(sources.length).toBeGreaterThan(0);
		const planted = `<span>&times;</span>`;
		const found = [...planted.matchAll(NAMED_ENTITY)].filter(([, name]) => !XML_PREDEFINED.has(name));
		expect(found.map(([entity]) => entity)).toEqual(["&times;"]);
	});
});
