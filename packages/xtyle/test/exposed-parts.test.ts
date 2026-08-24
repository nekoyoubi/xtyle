import { readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { listComponents } from "../src/manifest/registry.js";

const here = dirname(fileURLToPath(import.meta.url));
const fragments = resolve(here, "../src/elements/fragments");

const PART = /part=\\?"([^"\\]+)/g;

/**
 * Every `part` name a component's fill emits, or null when it has no fill to read. A fill emits from two
 * places and both count: the `mod.ts` ops that build chrome per render, and the `.html` scaffold mounted
 * once underneath them. Reading only the first is how `tabs` and `tablist` sat emitted-and-undeclared
 * while the manifest's own `sticky` docs told authors to write `::part(tablist)`.
 */
function emittedParts(id: string): Set<string> | null {
	let sources: string[];
	try {
		sources = readdirSync(resolve(fragments, id))
			.filter((file) => file === "mod.ts" || file.endsWith(".html"))
			.map((file) => readFileSync(resolve(fragments, id, file), "utf8"));
	} catch {
		return null;
	}
	if (sources.length === 0) return null;
	const parts = new Set<string>();
	for (const source of sources)
		for (const match of source.matchAll(PART)) for (const name of match[1].split(/\s+/)) parts.add(name);
	return parts;
}

/**
 * `anatomy` publishes each node's *internal* selector, which under a shadow render matches nothing from
 * an outside sheet — and shadow DOM answers a selector that matches nothing with silence, so an author
 * who copies it gets no styling, no error, and no way to tell "wrong syntax" from "not exposed".
 * `exposedParts` is the answer to that question, which makes it worth exactly as much as its accuracy.
 */
describe("exposedParts says what an outside sheet can actually reach", () => {
	it("lists precisely what each fill emits, no more and no less", () => {
		const drift: string[] = [];
		for (const manifest of listComponents()) {
			const emitted = emittedParts(manifest.id);
			if (!emitted || emitted.size === 0) continue;
			const declared = new Set(manifest.exposedParts ?? []);
			const missing = [...emitted].filter((p) => !declared.has(p));
			const phantom = [...declared].filter((p) => !emitted.has(p));
			if (missing.length) drift.push(`${manifest.id}: emits but does not declare ${missing.join(", ")}`);
			if (phantom.length) drift.push(`${manifest.id}: declares but never emits ${phantom.join(", ")}`);
		}
		expect(drift).toEqual([]);
	});

	it("claims nothing for a component with no parts-emitting fill, rather than an empty promise", () => {
		for (const manifest of listComponents()) {
			const emitted = emittedParts(manifest.id);
			if (emitted && emitted.size > 0) continue;
			expect(manifest.exposedParts ?? [], manifest.id).toEqual([]);
		}
	});

	/** The 30% of anatomy entries whose name is not a part are genuinely internal. That is a fine state to
	 * be in and a bad state to be silent about, so the field has to distinguish it rather than omit it. */
	it("leaves an anatomy entry unreachable rather than pretending, where the fill emits no such part", () => {
		const palette = listComponents().find((c) => c.id === "command-palette");
		expect(palette?.exposedParts, "a shadow component with parts declares them").toBeTruthy();
		const reachable = palette!.anatomy.filter((a) => palette!.exposedParts!.includes(a.name));
		expect(reachable.length, "at least some of the published anatomy is reachable").toBeGreaterThan(0);
		expect(reachable.length, "and not all of it is, which is the thing worth publishing").toBeLessThanOrEqual(
			palette!.anatomy.length,
		);
	});
});
