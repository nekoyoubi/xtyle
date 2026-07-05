import { describe, expect, it } from "vitest";
import { resolveAlgorithm, snapshotAlgorithm } from "../src/host/registry.js";

describe("host registry snapshot", () => {
	it("snapshots a resolved mod synchronously, null until then", async () => {
		const algorithm = await resolveAlgorithm("xtyle-default");
		expect(snapshotAlgorithm("xtyle-default")).toBe(algorithm);
		// an id never resolved in this run has no snapshot
		expect(snapshotAlgorithm("xtyle-hc")).toBeNull();
		expect(snapshotAlgorithm("nonexistent")).toBeNull();
	});

	it("returns the same cached instance as resolveAlgorithm", async () => {
		const first = await resolveAlgorithm("xtyle-quiet");
		const second = await resolveAlgorithm("xtyle-quiet");
		expect(second).toBe(first);
		expect(snapshotAlgorithm("xtyle-quiet")).toBe(first);
	});
});
