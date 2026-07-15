import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { builtInFillFor, builtInFillSlots } from "../src/elements/built-in-fills.js";

const fragmentsDir = fileURLToPath(new URL("../src/elements/fragments", import.meta.url));

interface FillManifest {
	name: string;
	fills: Record<string, unknown>;
}

function onDisk(): Map<string, FillManifest> {
	const found = new Map<string, FillManifest>();
	for (const entry of readdirSync(fragmentsDir, { withFileTypes: true })) {
		if (!entry.isDirectory()) continue;
		const manifest = JSON.parse(
			readFileSync(join(fragmentsDir, entry.name, "mod.manifest.json"), "utf8"),
		) as FillManifest;
		for (const slot of Object.keys(manifest.fills)) found.set(slot, manifest);
	}
	return found;
}

/**
 * The registry is what lets the host pull xtyle's own fill in ahead of a mod that overrides it, so a
 * component missing from it is a component whose built-in registers *after* an app's override and
 * silently wins — the bug the registry exists to prevent, and one that would only show up as a mod
 * quietly doing nothing. A fill that ships without an entry here fails the build instead.
 */
describe("the built-in fill registry", () => {
	it("covers every fill xtyle ships, under the slot and name that fill declares", () => {
		for (const [slot, manifest] of onDisk()) {
			expect(builtInFillFor(slot), `no built-in fill registered for ${slot}`).toBeDefined();
			expect(builtInFillFor(slot)?.name).toBe(manifest.name);
		}
	});

	it("registers nothing xtyle does not ship", () => {
		const slots = new Set(onDisk().keys());
		for (const slot of builtInFillSlots()) expect(slots.has(slot)).toBe(true);
	});

	it("loads a fill's own manifest and sources through its slot", async () => {
		const source = await builtInFillFor("component.rating")?.load();
		expect((source?.manifest as { name: string }).name).toBe("xtyle-rating-default");
		expect(Object.keys(source?.fragmentSources ?? {})).toContain("rating.html");
	});
});
