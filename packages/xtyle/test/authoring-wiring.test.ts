import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { getComponent } from "../src/manifest/registry.js";

const WRAPPERS = join(import.meta.dirname, "..", "..", "astro", "src");

/**
 * The diagnostic is only as good as the id each wrapper passes it. `diagnoseAuthoring` returns an
 * empty list for an id it cannot resolve, so a typo or a wrong-by-one derivation (`checkbox-group`
 * for a component the registry files under `checkbox`) disables the check on that component and says
 * nothing — the same silent-success failure the diagnostic exists to catch.
 */
function wiredIds(): { file: string; id: string }[] {
	return readdirSync(WRAPPERS)
		.filter((f) => f.endsWith(".astro"))
		.map((file) => {
			const match = readFileSync(join(WRAPPERS, file), "utf8").match(/checkAuthoring\("([a-z0-9-]+)"/);
			return match ? { file, id: match[1] } : null;
		})
		.filter((entry): entry is { file: string; id: string } => entry !== null);
}

describe("astro authoring diagnostic wiring", () => {
	it("wires every id to a component the registry actually knows", () => {
		const unresolvable = wiredIds().filter(({ id }) => !getComponent(id));
		expect(unresolvable).toEqual([]);
	});

	it("wires each wrapper at most once", () => {
		const seen = wiredIds().map(({ file }) => file);
		expect(seen.length).toBe(new Set(seen).size);
	});

	it("covers the components that have a manifest of their own", () => {
		expect(wiredIds().length).toBeGreaterThan(75);
	});
});
