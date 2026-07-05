import { describe, expect, it } from "vitest";
import { derive, getAlgorithm, resolveAlgorithm, snapshotAlgorithm } from "../src/batteries.js";

// The importable `@xtyle/core/algorithms` surface should reach the *canonical* sandboxed mod, not
// only the baked oracle. `resolveAlgorithm` (re-exported from the shipped bundle) must derive
// byte-identical to `getAlgorithm`, and `snapshotAlgorithm` must read the resolved mod once warmed.
const IDS = ["xtyle-default", "xtyle-hc", "xtyle-quiet", "xtyle-loud", "nxi-nite"] as const;
const SEED = { constraints: { "--bg-0": "#0f1115", "--accent": "#5b8cff" } };
const TIMEOUT = 60_000;

describe("neutral-surface canonical resolver", () => {
	for (const id of IDS) {
		it(`resolveAlgorithm("${id}") derives byte-identical to the baked oracle`, async () => {
			const hosted = await resolveAlgorithm(id);
			const baked = getAlgorithm(id);
			expect(JSON.stringify(derive(hosted, SEED))).toBe(JSON.stringify(derive(baked, SEED)));
		}, TIMEOUT);
	}

	it("snapshotAlgorithm returns the resolved mod once warmed, null before", async () => {
		// nxi-nite is resolved by the loop above; a never-resolved id stays null.
		expect(snapshotAlgorithm("not-a-real-mod")).toBeNull();
		await resolveAlgorithm("xtyle-default");
		const snap = snapshotAlgorithm("xtyle-default");
		expect(snap).not.toBeNull();
		expect(snap!.id).toBe("xtyle-default");
	}, TIMEOUT);

	it("rejects an unknown id", async () => {
		await expect(resolveAlgorithm("not-a-real-mod")).rejects.toThrow();
	}, TIMEOUT);
});
