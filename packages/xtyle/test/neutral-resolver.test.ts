import { describe, expect, it } from "vitest";
import { derive, getAlgorithm, resolveAlgorithm, snapshotAlgorithm } from "../src/batteries.js";

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
