import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Every component's scaffold wrapper is marked `data-<its own id>`, and the shared stylesheet gives each of
 * those markers a global rule (`[data-icon] { display: contents }` and friends). That is fine — until a
 * *different* component reaches for the same name for one of its own nodes, at which point it silently
 * inherits a stranger's layout.
 *
 * The bug that produced this test: SplitButton marked its busy indicator `data-spinner`, and Spinner's
 * global `[data-spinner] { display: contents }` erased the box it needed. The spinner had a width, a border
 * and an animation, and it drew nothing at all — a component styled by a stylesheet it never asked for.
 *
 * So: a fragment may mark its nodes with anything except another component's id.
 */
const FRAGMENTS = join(import.meta.dirname, "..", "src", "elements", "fragments");

function componentIds(): string[] {
	return readdirSync(FRAGMENTS).filter((entry) => statSync(join(FRAGMENTS, entry)).isDirectory());
}

function markersIn(html: string): string[] {
	return [...html.matchAll(/\bdata-([a-z][a-z-]*)\b/g)].map((match) => match[1]);
}

describe("no fragment borrows another component's marker", () => {
	const ids = componentIds();

	it("finds every fragment", () => {
		expect(ids.length).toBeGreaterThan(60);
	});

	for (const id of ids) {
		it(`${id}: marks its own nodes with names no other component owns`, () => {
			const html = readFileSync(join(FRAGMENTS, id, `${id}.html`), "utf8");
			const borrowed = markersIn(html).filter((marker) => marker !== id && ids.includes(marker));
			expect(
				borrowed,
				`${id}.html marks a node data-${borrowed[0]}, which is ${borrowed[0]}'s scaffold marker — it will inherit that component's global rules`,
			).toEqual([]);
		});
	}
});
