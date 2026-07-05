import { describe, expect, it } from "vitest";
import {
	derive,
	getAlgorithm,
	hostedAlgorithm,
	resolveAlgorithm,
	snapshotAlgorithm,
} from "../src/batteries.js";

const IDS = ["xoji-default", "xoji-hc", "xoji-quiet", "xoji-loud", "nxi-nite"];
const constraints = { "--bg-0": "#0b0d12", "--fg-0": "#e6e9ef", "--accent": "#6ea8fe" };

describe("hostedAlgorithm", () => {
	// The module cache is cold at the first assertion (vitest isolates modules per file), so this
	// must run first to exercise the cold branch deterministically.
	it("bridges on the baked oracle before the hosted mod is warm", () => {
		expect(snapshotAlgorithm("xoji-loud")).toBeNull();
		expect(hostedAlgorithm("xoji-loud")).toBe(getAlgorithm("xoji-loud"));
	});

	it("returns the resolved hosted mod once its cache is warm", async () => {
		await resolveAlgorithm("xoji-quiet");
		const snap = snapshotAlgorithm("xoji-quiet");
		expect(snap).not.toBeNull();
		expect(hostedAlgorithm("xoji-quiet")).toBe(snap);
	});

	it("derives byte-identical to the baked oracle across every algorithm", async () => {
		await Promise.all(IDS.map((id) => resolveAlgorithm(id)));
		for (const id of IDS) {
			expect(hostedAlgorithm(id)).toBe(snapshotAlgorithm(id));
			expect(derive(hostedAlgorithm(id), { constraints })).toEqual(
				derive(getAlgorithm(id), { constraints }),
			);
		}
	});

	it("throws on an unknown id, like getAlgorithm", () => {
		expect(() => hostedAlgorithm("nope")).toThrow(/unknown algorithm/);
	});
});
