import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadAlgorithm, loadAuthoredAlgorithm, staticAlgorithmManifest, STATIC_MANIFEST_KEY } from "../src/host/index.js";
import { bundledAlgorithmManifest, bundledAlgorithms } from "../src/host/bundle.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const LOAD_TIMEOUT_MS = 60_000;

function modFiles(id: string): { manifest: Record<string, unknown>; source: string } {
	const dir = join(ROOT, "algorithms", id);
	return {
		manifest: JSON.parse(readFileSync(join(dir, "mod-manifest.json"), "utf8")),
		source: readFileSync(join(dir, "src", "mod.js"), "utf8"),
	};
}

/**
 * The static block is a *claim*, and a claim that has drifted from the code is worse than no claim at
 * all: a consumer renders controls for knobs the algorithm no longer reads, and a discovery index
 * publishes a token set it no longer produces — silently, and forever. So the one load that already
 * happens checks the claim against what the code reports, and refuses the mod on divergence.
 */
describe("a mod's static manifest is checked against its code", () => {
	const { manifest, source } = modFiles("xtyle-default");

	it("carries the block on every bundled algorithm", () => {
		for (const id of bundledAlgorithms()) {
			expect(bundledAlgorithmManifest(id), `${id} ships no static manifest block`).not.toBeNull();
		}
	});

	it("refuses a mod whose declared knobs are not the knobs it reads", async () => {
		const drifted = {
			...manifest,
			[STATIC_MANIFEST_KEY]: { ...(manifest[STATIC_MANIFEST_KEY] as object), knobs: ["mood"] },
		};
		await expect(loadAlgorithm(drifted, source)).rejects.toThrow(/does not match what its code reports \(knobs\)/);
	}, LOAD_TIMEOUT_MS);

	it("names every field that drifted, not just the first", async () => {
		const block = manifest[STATIC_MANIFEST_KEY] as Record<string, unknown>;
		const drifted = {
			...manifest,
			[STATIC_MANIFEST_KEY]: { ...block, produces: ["--bg-0"], invariantCount: 1, passNames: ["nope"] },
		};
		await expect(loadAlgorithm(drifted, source)).rejects.toThrow(/produces, invariantCount, passNames/);
	}, LOAD_TIMEOUT_MS);

	it("accepts a block that matches, whatever order its keys happen to be in", async () => {
		const block = manifest[STATIC_MANIFEST_KEY] as Record<string, unknown>;
		const reordered = Object.fromEntries(Object.entries(block).reverse());
		const algorithm = await loadAlgorithm({ ...manifest, [STATIC_MANIFEST_KEY]: reordered }, source);
		expect(algorithm.knobs).toEqual((block.knobs as string[]));
	}, LOAD_TIMEOUT_MS);

	// The block augments `manifest()`, it never replaces it: an in-browser authored source loads under a
	// synthesized manifest that has no packaged block to carry, and a third-party pack may ship none.
	it("loads a mod that declares no block at all", async () => {
		const { [STATIC_MANIFEST_KEY]: _block, ...blockless } = manifest;
		const algorithm = await loadAlgorithm(blockless, source);
		expect(algorithm.knobs.length).toBeGreaterThan(0);
	}, LOAD_TIMEOUT_MS);

	it("loads an authored source, which has no packaged manifest to declare one in", async () => {
		const algorithm = await loadAuthoredAlgorithm(
			`defineXtyleAlgorithm({ id: "authored", vibrancy: 0.9 });`,
			{ name: "authored" },
		);
		expect(algorithm.id).toBe("authored");
		expect(algorithm.knobSpecs.length).toBeGreaterThan(0);
	}, LOAD_TIMEOUT_MS);

	it("reads a block off a manifest, and nothing off one without a usable block", () => {
		expect(staticAlgorithmManifest(manifest)?.knobs).toEqual((manifest[STATIC_MANIFEST_KEY] as { knobs: string[] }).knobs);
		expect(staticAlgorithmManifest({})).toBeNull();
		expect(staticAlgorithmManifest(undefined)).toBeNull();
		expect(staticAlgorithmManifest({ [STATIC_MANIFEST_KEY]: { knobs: ["vibrancy"] } })).toBeNull();
	});
});
