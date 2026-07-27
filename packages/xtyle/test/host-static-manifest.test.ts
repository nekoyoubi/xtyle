import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadAlgorithm, loadAuthoredAlgorithm, staticAlgorithmManifest, STATIC_MANIFEST_SLOT } from "../src/host/index.js";
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

/** The packaged block, and a manifest carrying a replacement for it. The block rides in a data fill —
 * a slot whose `accepts` names a JSON media type — so reaching it means indexing the fill list, not a
 * key off the manifest root. */
function packMeta(manifest: Record<string, unknown>): Record<string, unknown> {
	const fills = manifest.fills as Record<string, Record<string, unknown>[]>;
	return fills[STATIC_MANIFEST_SLOT][0];
}

function withPackMeta(manifest: Record<string, unknown>, block: unknown): Record<string, unknown> {
	return { ...manifest, fills: { ...(manifest.fills as object), [STATIC_MANIFEST_SLOT]: [block] } };
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
		const drifted = withPackMeta(manifest, { ...packMeta(manifest), knobs: ["mood"] });
		await expect(loadAlgorithm(drifted, source)).rejects.toThrow(/does not match what its code reports \(knobs\)/);
	}, LOAD_TIMEOUT_MS);

	it("names every field that drifted, not just the first", async () => {
		const drifted = withPackMeta(manifest, {
			...packMeta(manifest),
			produces: ["--bg-0"],
			invariantCount: 1,
			passNames: ["nope"],
		});
		await expect(loadAlgorithm(drifted, source)).rejects.toThrow(/produces, invariantCount, passNames/);
	}, LOAD_TIMEOUT_MS);

	it("accepts a block that matches, whatever order its keys happen to be in", async () => {
		const block = packMeta(manifest);
		const reordered = Object.fromEntries(Object.entries(block).reverse());
		const algorithm = await loadAlgorithm(withPackMeta(manifest, reordered), source);
		expect(algorithm.knobs).toEqual(block.knobs as string[]);
	}, LOAD_TIMEOUT_MS);

	it("loads a mod that declares no block at all", async () => {
		const { [STATIC_MANIFEST_SLOT]: _fill, ...otherFills } = manifest.fills as Record<string, unknown>;
		const algorithm = await loadAlgorithm({ ...manifest, fills: otherFills }, source);
		expect(algorithm.knobs.length).toBeGreaterThan(0);
	}, LOAD_TIMEOUT_MS);

	it("loads a mod that declares no fills whatsoever", async () => {
		const { fills: _fills, ...fillless } = manifest;
		const algorithm = await loadAlgorithm(fillless, source);
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
		expect(staticAlgorithmManifest(manifest)?.knobs).toEqual(packMeta(manifest).knobs);
		expect(staticAlgorithmManifest({})).toBeNull();
		expect(staticAlgorithmManifest(undefined)).toBeNull();
		expect(staticAlgorithmManifest({ fills: {} })).toBeNull();
		expect(staticAlgorithmManifest(withPackMeta(manifest, { knobs: ["vibrancy"] }))).toBeNull();
	});

	/** A slot takes a list of fills, so the packaged shape is an array — but a hand-written manifest that
	 * put the object there directly still reads, rather than reporting an empty pack. */
	it("reads the block whether the fill is wrapped in a list or not", () => {
		const block = packMeta(manifest);
		expect(staticAlgorithmManifest({ fills: { [STATIC_MANIFEST_SLOT]: block } })?.knobs).toEqual(block.knobs);
	});
});
