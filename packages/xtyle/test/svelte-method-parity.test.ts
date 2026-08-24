import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { components } from "../src/manifest/index.js";

const svelteDir = resolve(import.meta.dirname, "..", "..", "svelte", "src");
const key = (name: string): string => name.toLowerCase().replace(/[^a-z0-9]/g, "");

const wrappers = new Map(
	readdirSync(svelteDir)
		.filter((file) => file.endsWith(".svelte"))
		.map((file) => [key(file.slice(0, -".svelte".length)), file]),
);

const svelteMethods = Object.values(components).flatMap((manifest) =>
	(manifest.methods ?? [])
		.filter((method) => method.bindings.includes("svelte"))
		.map((method) => ({ id: manifest.id, name: method.name })),
);

describe("a method the manifest offers to Svelte is one the wrapper re-exports", () => {
	it("has methods to check, so a green run is not an empty one", () => {
		expect(svelteMethods.length).toBeGreaterThan(20);
	});

	it("re-exports every svelte-bound method", () => {
		const missing: string[] = [];
		for (const { id, name } of svelteMethods) {
			const file = wrappers.get(key(id));
			if (!file) {
				missing.push(`${id}.${name} — the manifest offers it to Svelte and no wrapper exists`);
				continue;
			}
			const source = readFileSync(resolve(svelteDir, file), "utf8");
			if (new RegExp(`export function ${name}\\b`).test(source)) continue;
			missing.push(`${id}.${name} — declared \`svelte\` but ${file} never re-exports it, so calling it is a type error a consumer only meets at build time`);
		}
		expect(missing).toEqual([]);
	});
});
