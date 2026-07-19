import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * A few components give their own scaffold marker a *global* rule in the shared stylesheet
 * (`[data-root][data-icon] { display: contents }`, and the same for `spinner`). That is fine — until a
 * *different* component reaches for the same name for one of its own nodes, at which point it silently
 * inherits a stranger's layout.
 *
 * The bug that produced this test: SplitButton marked its busy indicator `data-spinner`, and Spinner's
 * global `[data-spinner] { display: contents }` erased the box it needed. The spinner had a width, a border
 * and an animation, and it drew nothing at all — a component styled by a stylesheet it never asked for.
 *
 * So: a fragment may not mark its nodes with the marker of another component that ships a global
 * `[data-<id>]` rule. A component id that ships no such rule reserves nothing — the harm is inheriting a
 * stranger's global rule, which can only happen where the stranger defined one. (This is why a generic
 * marker like `data-list`, used by several components' internal list containers, is only a collision once
 * some `list` component actually gives `[data-list]` a global rule — which the reference List does not.)
 */
const FRAGMENTS = join(import.meta.dirname, "..", "src", "elements", "fragments");
const COMPONENT_CSS = join(import.meta.dirname, "..", "src", "css", "components");

function componentIds(): string[] {
	return readdirSync(FRAGMENTS).filter((entry) => statSync(join(FRAGMENTS, entry)).isDirectory());
}

function markersIn(html: string): string[] {
	return [...html.matchAll(/\bdata-([a-z][a-z-]*)\b/g)].map((match) => match[1]);
}

/** Whether the component that owns `id` ships a global rule keyed on `[data-<id>]` — the only case a
 * borrower of that marker inherits a stranger's layout. */
function ownsGlobalMarkerRule(id: string): boolean {
	const file = join(COMPONENT_CSS, `${id}.ts`);
	return existsSync(file) && readFileSync(file, "utf8").includes(`[data-${id}]`);
}

describe("no fragment borrows another component's marker", () => {
	const ids = componentIds();

	it("finds every fragment", () => {
		expect(ids.length).toBeGreaterThan(60);
	});

	for (const id of ids) {
		it(`${id}: marks its own nodes with no other component's globally-ruled marker`, () => {
			const html = readFileSync(join(FRAGMENTS, id, `${id}.html`), "utf8");
			const borrowed = markersIn(html).filter(
				(marker) => marker !== id && ids.includes(marker) && ownsGlobalMarkerRule(marker),
			);
			expect(
				borrowed,
				`${id}.html marks a node data-${borrowed[0]}, which is ${borrowed[0]}'s scaffold marker with a global [data-${borrowed[0]}] rule — it will inherit that component's global styles`,
			).toEqual([]);
		});
	}
});
