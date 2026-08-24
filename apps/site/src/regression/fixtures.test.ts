import { describe, expect, it } from "vitest";
import { listComponents } from "@xtyle/core";
import { COLLECTION_FIXTURES, fixtures, fixtureFor, DEFAULT_FIXTURE } from "./fixtures.ts";

const PARITY_EXEMPT = new Set([
	"app-shell",
	"mobile-shell",
	"parallax",
	"statusbar",
	"toolbar",
	"accordion",
	"select",
	"theme-picker",
]);

/**
 * `dock-zone` takes its collections as JSON attributes on child panels rather than as props on the
 * host, so every binding hands them over as identical markup and the property-versus-attribute split
 * this rule guards cannot arise. Exempt on the shape of the API, not on convenience.
 */
const CHILD_BORNE_COLLECTIONS = new Set(["dock-zone"]);

const COLLECTION_TYPE = /\[\]|Item|Node|Command|Segment|Series|Step|Tab\b/;

function collectionProps(id: string): string[] {
	const component = listComponents().find((c) => c.id === id);
	return (component?.props ?? []).filter((p) => COLLECTION_TYPE.test(String(p.type ?? ""))).map((p) => p.name);
}

/**
 * The parity suite compares a component across its bindings, and objects reach the raw element as
 * properties while the Astro binding writes attributes — so a collection prop is the one place the
 * bindings can genuinely disagree. Comparing such a component on the empty default fixture makes the
 * check pass by never rendering a row, which is how a wrapper that dropped every item it was handed
 * stayed green.
 */
describe("no component with a collection prop is compared empty", () => {
	const withCollections = listComponents()
		.map((c) => c.id)
		.filter((id) => !PARITY_EXEMPT.has(id) && !CHILD_BORNE_COLLECTIONS.has(id))
		.filter((id) => collectionProps(id).length > 0);

	it("finds the components this rule is about", () => {
		expect(withCollections.length).toBeGreaterThan(10);
	});

	it.each(withCollections)("%s is given real data to render", (id) => {
		const fixture = fixtureFor(id);
		expect(fixture, `${id} falls back to the empty default fixture`).not.toBe(DEFAULT_FIXTURE);
		const populated = collectionProps(id).some((name) => {
			const value = fixture.props[name];
			return Array.isArray(value) ? value.length > 0 : value !== undefined;
		});
		expect(
			populated || fixture.childrenHtml.length > 0,
			`${id} has a fixture but none of its collection props (${collectionProps(id).join(", ")}) carry data`,
		).toBe(true);
	});

	it("names props the component actually declares, so a fixture cannot quietly set nothing", () => {
		const passthrough = /^(class|style|id|title|hidden|tabindex|role|slot|part|static)$|^(data|aria)-/;
		const wrong: string[] = [];
		for (const [id, fixture] of Object.entries(fixtures)) {
			const component = listComponents().find((c) => c.id === id);
			if (!component) continue;
			const declared = new Set((component.props ?? []).map((p) => p.name));
			for (const prop of Object.keys(fixture.props)) {
				if (passthrough.test(prop) || declared.has(prop)) continue;
				wrong.push(`${id}.${prop}`);
			}
		}
		expect(wrong, "a fixture sets a prop the component does not declare, so it renders as if unset").toEqual([]);
	});

	it("keeps every collection fixture reachable through the resolver", () => {
		for (const id of Object.keys(COLLECTION_FIXTURES)) {
			expect(fixtures[id], `${id} was shadowed out of the fixture map`).toBe(COLLECTION_FIXTURES[id]);
		}
	});
});
