import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { derive } from "../src/index.js";
import { getAlgorithm } from "../src/batteries.js";
import { loadAlgorithm } from "../src/host/index.js";
import type { Algorithm } from "../src/types.js";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

const SEEDS = [
	{ label: "dark, brand accent", options: { constraints: { "--bg-0": "#0f1115", "--accent": "#5b8cff" } } },
	{ label: "light page, no brand", options: { constraints: { "--bg-0": "#e6e9ef" }, knobs: { scheme: "light" } } },
	{ label: "no seed at all", options: {} },
] as const;

function packMods(): { id: string; dir: string }[] {
	const packs = join(repo, "packs");
	if (!existsSync(packs)) return [];
	const found: { id: string; dir: string }[] = [];
	for (const pack of readdirSync(packs, { withFileTypes: true })) {
		if (!pack.isDirectory()) continue;
		const manifestPath = join(packs, pack.name, "package.json");
		if (!existsSync(manifestPath)) continue;
		const pkg = JSON.parse(readFileSync(manifestPath, "utf8")) as { xtyle?: { algorithms?: { name: string; entry: string }[] } };
		for (const entry of pkg.xtyle?.algorithms ?? []) {
			found.push({ id: entry.name, dir: join(packs, pack.name, entry.entry) });
		}
	}
	return found;
}

async function loadPackAlgorithm(dir: string): Promise<Algorithm> {
	const manifest = JSON.parse(readFileSync(join(dir, "mod-manifest.json"), "utf8")) as { entry?: { script?: string } };
	const script = manifest.entry?.script ?? "src/mod.js";
	return loadAlgorithm(manifest, readFileSync(join(dir, script), "utf8"), {});
}

/**
 * `produces` is a *claim*, and the packaged-manifest cross-check cannot test it: both sides of that
 * comparison are generated from the same declaration, so they agree by construction. The only thing
 * that catches an over-claim is deriving and looking, which matters now that `adds` lets an algorithm
 * name tokens a conditional pass might not emit.
 */
describe("every algorithm derives every token it declares", () => {
	const blessed = ["xtyle-default", "xtyle-hc", "xtyle-quiet", "xtyle-loud", "nxi-nite"];

	for (const id of blessed) {
		for (const seed of SEEDS) {
			it(`${id} — ${seed.label}`, () => {
				const algorithm = getAlgorithm(id);
				const register = derive(algorithm, seed.options);
				const missing = algorithm.produces.filter((token) => typeof register[token] !== "string" || register[token] === "");
				expect(missing, `${id} declares ${missing.join(", ")} and did not derive it`).toEqual([]);
			});
		}
	}

	for (const mod of packMods()) {
		it(`${mod.id} (pack) — every seed`, async () => {
			const algorithm = await loadPackAlgorithm(mod.dir);
			for (const seed of SEEDS) {
				const register = derive(algorithm, seed.options);
				const missing = algorithm.produces.filter((token) => typeof register[token] !== "string" || register[token] === "");
				expect(missing, `${mod.id} declares ${missing.join(", ")} and did not derive it under ${seed.label}`).toEqual([]);
			}
		});
	}
});
