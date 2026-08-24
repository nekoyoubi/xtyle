import { describe, expect, it } from "vitest";
import { derive } from "../src/index.js";
import { bakedAlgorithms, getAlgorithm } from "../src/batteries.js";

const ALGORITHM_IDS = Object.keys(bakedAlgorithms);
const STEPS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

function ramp(id: string, density: string): number[] {
	const register = derive(getAlgorithm(id), { knobs: { density } });
	return STEPS.map((step) => {
		const raw = register[`--space-${step}`];
		const parsed = Number.parseFloat(String(raw));
		expect(Number.isFinite(parsed), `--space-${step} on ${id} at ${density} was ${raw}`).toBe(true);
		return parsed;
	});
}

/**
 * Density scales the whole space ramp by one factor rather than substituting a second set of values.
 * That is what lets a component read `--space-N` and get density for free: with one scale there is no
 * second one to fall out of sync with, so two surfaces cannot disagree about how dense the theme is.
 * A per-step drift would not fail a spot check on a single step, which is why this walks all of them.
 */
describe("density scales the space ramp uniformly, so nothing can drift off it", () => {
	it.each(ALGORITHM_IDS)("%s applies one factor across every step", (id) => {
		const normal = ramp(id, "normal");
		let compared = 0;

		for (const density of ["compact", "comfortable"]) {
			const scaled = ramp(id, density);
			const factors = scaled.map((value, i) => value / normal[i]);
			const first = factors[0];
			for (const factor of factors) {
				compared++;
				expect(factor, `${id} at ${density} scaled a step by ${factor} while another moved ${first}`).toBeCloseTo(
					first,
					5,
				);
			}
			if (density === "compact") expect(first, `${id} compact should tighten`).toBeLessThan(1);
			else expect(first, `${id} comfortable should loosen`).toBeGreaterThan(1);
		}

		expect(compared, "the ramp walk compared nothing, so its green means nothing").toBe(STEPS.length * 2);
	});

	it("holds the zero step at zero, which no factor may move off", () => {
		for (const id of ALGORITHM_IDS) {
			for (const density of ["compact", "normal", "comfortable"]) {
				const register = derive(getAlgorithm(id), { knobs: { density } });
				expect(Number.parseFloat(String(register["--space-0"])), `${id} at ${density}`).toBe(0);
			}
		}
	});

	it("keeps the ramp monotonic, so a larger step is never tighter than a smaller one", () => {
		for (const id of ALGORITHM_IDS) {
			for (const density of ["compact", "normal", "comfortable"]) {
				const values = ramp(id, density);
				const sorted = [...values].sort((a, b) => a - b);
				expect(values, `${id} at ${density} has a step that goes backwards`).toEqual(sorted);
			}
		}
	});
});
