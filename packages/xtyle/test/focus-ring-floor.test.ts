import { describe, expect, it } from "vitest";
import { auditRegister, derive } from "../src/index.js";
import { bakedAlgorithms, getAlgorithm } from "../src/batteries.js";
import { ringForContrast } from "../src/algorithms/factory.js";
import { contrast, flatten, formatCss, oklch, toOklchColor } from "../src/color.js";
import type { Algorithm, Scheme } from "../src/types.js";

const SCHEMES: Scheme[] = ["dark", "light"];

function worstRing(algorithm: Algorithm, scheme: Scheme, knobs: Record<string, unknown> = {}): number {
	const audit = auditRegister(derive(algorithm, { knobs: { scheme, ...knobs } }));
	return audit.focusRing.reduce((low, entry) => Math.min(low, entry.ratio), Infinity);
}

describe("ringForContrast", () => {
	it("composites the ring's alpha before grading, so a translucent value is not overstated", () => {
		const surface = toOklchColor("#ffffff");
		const seed = { ...toOklchColor("#3ad6f8"), alpha: 0.7 };
		const raw = contrast("#3ad6f8", "#ffffff");
		const blended = contrast(formatCss(flatten(formatCss(seed), "#ffffff")), "#ffffff");
		expect(raw).toBeGreaterThan(blended);

		const walked = ringForContrast(seed, [surface], 3);
		const ratio = contrast(formatCss(flatten(formatCss(walked), "#ffffff")), "#ffffff");
		expect(ratio).toBeGreaterThanOrEqual(3);
	});

	it("clears every surface it is handed, not just the nearest one", () => {
		const surfaces = ["#ffffff", "#f4f4f4", "#e8e8e8"].map(toOklchColor);
		const walked = ringForContrast({ ...toOklchColor("#3ad6f8"), alpha: 0.7 }, surfaces, 3);
		for (const surface of surfaces) {
			const backdrop = formatCss(surface);
			expect(contrast(formatCss(flatten(formatCss(walked), backdrop)), backdrop)).toBeGreaterThanOrEqual(3);
		}
	});

	it("keeps the brand's hue rather than sweeping to a grey pole", () => {
		const seed = { ...toOklchColor("#3ad6f8"), alpha: 0.7 };
		const walked = ringForContrast(seed, [toOklchColor("#ffffff")], 3);
		expect(walked.h).toBeCloseTo(seed.h, 5);
		expect(walked.c).toBeGreaterThan(0);
	});

	it("returns the seed untouched when it already clears", () => {
		const seed = { ...toOklchColor("#3ad6f8"), alpha: 0.7 };
		expect(ringForContrast(seed, [toOklchColor("#0e1116")], 3)).toBe(seed);
	});

	it("returns the best it reached when the floor is unreachable", () => {
		const surfaces = [oklch(0.05, 0, 0), oklch(0.95, 0, 0)];
		const seed = { ...toOklchColor("#3ad6f8"), alpha: 0.7 };
		const walked = ringForContrast(seed, surfaces, 21);
		const reached = Math.min(
			...surfaces.map((surface) => {
				const backdrop = formatCss(surface);
				return contrast(formatCss(flatten(formatCss(walked), backdrop)), backdrop);
			}),
		);
		expect(reached).toBeLessThan(21);
		expect(reached).toBeGreaterThan(1);
	});
});

describe("the blessed algorithms honour the ring floor they declare", () => {
	it.each(Object.keys(bakedAlgorithms))("%s clears its declared floor in both schemes", (id) => {
		const algorithm = getAlgorithm(id);
		const floor = algorithm.declares?.focusRingFloor;
		expect(floor).toBeTypeOf("number");
		for (const scheme of SCHEMES) {
			expect(worstRing(algorithm, scheme)).toBeGreaterThanOrEqual((floor as number) - 0.01);
		}
	});

	it.each(Object.keys(bakedAlgorithms))("%s keeps a visible ring on a light theme", (id) => {
		expect(worstRing(getAlgorithm(id), "light")).toBeGreaterThanOrEqual(3);
	});

	it("holds through nxi-nite's later passes, which re-seat the surfaces the ring was walked against", () => {
		for (const hour of [0, 3, 9, 12, 18, 23]) {
			for (const scheme of SCHEMES) {
				expect(worstRing(getAlgorithm("nxi-nite"), scheme, { hour })).toBeGreaterThanOrEqual(3 - 0.01);
			}
		}
	});

	it("lets a posture declare above the standard, and xtyle-hc does", () => {
		const hc = getAlgorithm("xtyle-hc");
		expect(hc.declares?.focusRingFloor).toBe(4.5);
		for (const scheme of SCHEMES) {
			expect(worstRing(hc, scheme)).toBeGreaterThanOrEqual(4.5);
		}
	});

	it("keeps --ring-bg in the ring's own family once the ring has moved", () => {
		const register = derive(getAlgorithm("xtyle-default"), { knobs: { scheme: "light" } });
		const ring = toOklchColor(register["--ring"] as string);
		const wash = toOklchColor(register["--ring-bg"] as string);
		expect(wash.h).toBeCloseTo(ring.h, 5);
		expect(wash.l).toBeCloseTo(ring.l, 5);
		expect(wash.alpha).toBeLessThan(ring.alpha);
	});
});

describe("auditRegister reports the standard beside the floor it graded", () => {
	const register = derive(getAlgorithm("xtyle-default"), { knobs: { scheme: "light" } });

	it("defaults to WCAG 2.2's 3:1 and says so", () => {
		const audit = auditRegister(register);
		expect(audit.focusRingFloor).toBe(3);
		expect(audit.focusRingStandard).toBe(3);
	});

	it("keeps the standard fixed when a lower floor is graded, so a declared floor cannot read as conformance", () => {
		const audit = auditRegister(register, { focusRingFloor: 1.5 });
		expect(audit.focusRingFloor).toBe(1.5);
		expect(audit.focusRingStandard).toBe(3);
		expect(audit.focusRing.every((entry) => entry.clears)).toBe(true);
		expect(audit.focusRingFloor).toBeLessThan(audit.focusRingStandard);
	});
});

describe("the declared floor is discoverable without deriving", () => {
	it("rides algorithmDomains, so an agent reads it from the same call it reads knobs from", async () => {
		const { algorithmDomains } = await import("../src/baked.js");
		const domains = await algorithmDomains(Object.keys(bakedAlgorithms));
		for (const domain of domains) {
			expect(domain.focusRingFloor).toBeTypeOf("number");
		}
		expect(domains.find((d) => d.id === "xtyle-hc")?.focusRingFloor).toBe(4.5);
		expect(domains.find((d) => d.id === "xtyle-default")?.focusRingFloor).toBe(3);
	});
});
