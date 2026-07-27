import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { getAlgorithm } from "../src/batteries.js";
import { HARNESS_TIMEOUT_MS, loadAlgorithm } from "../src/host/index.js";
import { resolveBundledAlgorithm, bundledAlgorithms, snapshotBundledAlgorithm } from "../src/host/bundle.js";
import type { Algorithm } from "../src/types.js";
import { buildMatrix } from "./matrix.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const ALGORITHM_IDS = ["xtyle-default", "xtyle-hc", "xtyle-quiet", "xtyle-loud", "nxi-nite"] as const;

const HOST_TIMEOUT_MS = 60_000;

const DEPTH = process.env.XTYLE_GAUNTLET_DEPTH;
const full = DEPTH === "full";
const heavy = full || DEPTH === "standard";

function sampleMatrix<T>(cases: T[], n: number): T[] {
	if (cases.length <= n) return cases;
	if (n <= 1) return cases.slice(0, 1);
	const step = (cases.length - 1) / (n - 1);
	return Array.from({ length: n }, (_, i) => cases[Math.round(i * step)] as T);
}

const fullMatrix = buildMatrix();
const matrix = full ? fullMatrix : sampleMatrix(fullMatrix, DEPTH === "standard" ? 4 : 1);
if (!full) {
	console.info(
		`mod-host: byte-identical proof sampled to ${matrix.length}/${fullMatrix.length} cases ` +
			`(set XTYLE_GAUNTLET_DEPTH=full for the whole matrix)`,
	);
}

for (const id of ALGORITHM_IDS) {
	const baked = getAlgorithm(id);
	let hosted: Algorithm;

	beforeAll(async () => {
		const modDir = join(ROOT, "algorithms", id);
		const modManifest = JSON.parse(readFileSync(join(modDir, "mod-manifest.json"), "utf8"));
		const source = readFileSync(join(modDir, "src", "mod.js"), "utf8");
		hosted = await loadAlgorithm(modManifest, source, { timeoutMs: HOST_TIMEOUT_MS });
	}, HOST_TIMEOUT_MS);

	describe(`mod-hosted ${id}`, () => {
		it("exposes the same surface as the baked algorithm", () => {
			expect(hosted.id).toBe(baked.id);
			expect(hosted.produces).toEqual(baked.produces);
			expect(hosted.knobs).toEqual(baked.knobs);
			expect(hosted.categories).toEqual(baked.categories);
			expect(hosted.invariants.length).toBe(baked.invariants.length);
			expect(hosted.passes?.length).toBe(baked.passes?.length);
			expect(hosted.passes?.map((p) => p.name)).toEqual(baked.passes?.map((p) => p.name));
		});

		for (const { label, opts } of matrix) {
			it(`derives byte-identical output for ${label}`, () => {
				const bakedRegister = baked.derive(opts);
				const hostedRegister = hosted.derive(opts);
				expect(JSON.stringify(hostedRegister)).toBe(JSON.stringify(bakedRegister));
			}, HOST_TIMEOUT_MS);

			it.runIf(heavy)(`emits byte-identical lineage for ${label}`, () => {
				expect(JSON.stringify(hosted.lineage(opts))).toBe(JSON.stringify(baked.lineage(opts)));
			}, HOST_TIMEOUT_MS);

			it.runIf(heavy)(`round-trips deriveTraced byte-identically for ${label}`, () => {
				const hostedTraced = hosted.deriveTraced!(opts);
				expect(JSON.stringify(hostedTraced.register)).toBe(JSON.stringify(baked.derive(opts)));
				expect(hostedTraced.trace.map((s) => s.name)).toEqual(
					baked.deriveTraced!(opts).trace.map((s) => s.name),
				);
			}, HOST_TIMEOUT_MS);
		}
	});
}

describe("browser bundle resolver", () => {
	const smoke = matrix[0]!.opts;

	it("bundles every blessed algorithm", () => {
		expect([...bundledAlgorithms()].sort()).toEqual([...ALGORITHM_IDS].sort());
	});

	for (const id of ALGORITHM_IDS) {
		it(`derives byte-identical to baked from the bundle for ${id}`, async () => {
			const bundled = await resolveBundledAlgorithm(id, { timeoutMs: HOST_TIMEOUT_MS });
			expect(JSON.stringify(bundled.derive(smoke))).toBe(JSON.stringify(getAlgorithm(id).derive(smoke)));
		}, HOST_TIMEOUT_MS);
	}

	it("rejects an unknown bundled id", async () => {
		await expect(resolveBundledAlgorithm("not-a-mod")).rejects.toThrow(/no bundled mod/);
	});

	it("honors a raised rail, clamps it, and caches per rail", async () => {
		const [a, b] = await Promise.all([
			resolveBundledAlgorithm("xtyle-default", { timeoutMs: HOST_TIMEOUT_MS }),
			resolveBundledAlgorithm("xtyle-default", { timeoutMs: HOST_TIMEOUT_MS }),
		]);
		expect(a).toBe(b);

		const clamped = await resolveBundledAlgorithm("xtyle-default", { timeoutMs: HARNESS_TIMEOUT_MS * 10 });
		expect(clamped).toBe(a);

		const production = await resolveBundledAlgorithm("xtyle-default");
		expect(production).not.toBe(a);
		expect(snapshotBundledAlgorithm("xtyle-default")).toBe(production);
	}, HOST_TIMEOUT_MS);
});
