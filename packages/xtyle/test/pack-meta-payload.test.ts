import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import hostManifest from "../manifest.json" with { type: "json" };
import { STATIC_MANIFEST_SLOT } from "../src/host/index.js";

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..", "..", "..");

interface PayloadSchema {
	type: string;
	required?: string[];
	properties: Record<string, { type?: string }>;
	additionalProperties?: boolean;
}

const slot = (hostManifest as { slots: { id: string; payload?: PayloadSchema }[] }).slots.find(
	(candidate) => candidate.id === STATIC_MANIFEST_SLOT,
);

function modManifests(): { label: string; fill: Record<string, unknown> }[] {
	const roots = [
		{ dir: join(repo, "algorithms"), depth: 1 },
		{ dir: join(repo, "packs"), depth: 2 },
	];
	const found: { label: string; fill: Record<string, unknown> }[] = [];

	const visit = (dir: string, depth: number, label: string): void => {
		if (!existsSync(dir)) return;
		for (const dirent of readdirSync(dir, { withFileTypes: true })) {
			if (!dirent.isDirectory()) continue;
			const path = join(dir, dirent.name);
			if (depth > 1) {
				visit(path, depth - 1, `${label}/${dirent.name}`);
				continue;
			}
			const manifestPath = join(path, "mod-manifest.json");
			if (!existsSync(manifestPath)) continue;
			const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
				fills?: Record<string, Record<string, unknown>[]>;
			};
			const fill = manifest.fills?.[STATIC_MANIFEST_SLOT]?.[0];
			if (fill) found.push({ label: `${label}/${dirent.name}`, fill });
		}
	};

	for (const root of roots) visit(root.dir, root.depth, root.dir === roots[0]?.dir ? "algorithms" : "packs");
	return found;
}

describe(`every mod's ${STATIC_MANIFEST_SLOT} fill matches the payload the slot declares`, () => {
	const stamped = modManifests();

	it("finds the slot and something stamped against it", () => {
		expect(slot?.payload).toBeDefined();
		expect(stamped.length).toBeGreaterThan(0);
	});

	for (const { label, fill } of stamped) {
		it(`${label} declares no property the slot refuses`, () => {
			const payload = slot?.payload as PayloadSchema;
			const undeclared = Object.keys(fill).filter((key) => !(key in payload.properties));
			expect(
				undeclared,
				`${label} stamps ${undeclared.join(", ")}, which the slot's payload does not declare — with ` +
					"`additionalProperties: false` the mod manifest is invalid, and nothing that only reads the " +
					"block would ever say so",
			).toEqual([]);
		});

		it(`${label} carries everything the slot requires`, () => {
			const payload = slot?.payload as PayloadSchema;
			const missing = (payload.required ?? []).filter((key) => !(key in fill));
			expect(missing, `${label} omits required ${missing.join(", ")}`).toEqual([]);
		});
	}
});
