import { describe, expect, it } from "vitest";
import { auditRegister, derive, oklabDistance } from "../src/index.js";
import { xtyleDefault } from "../src/batteries.js";

const at = (accent: string) => derive(xtyleDefault, { constraints: { "--bg-0": "#101216", "--accent": accent } });

describe("oklabDistance", () => {
	it("reads two identical colors as zero apart", () => {
		expect(oklabDistance("#e5484d", "#e5484d")).toBe(0);
	});

	/** The whole reason the audit needed a second measure: contrast cannot see a hue swap. */
	it("separates two fills that luminance contrast calls identical", () => {
		const a = "oklch(0.62 0.16 25)";
		const b = "oklch(0.62 0.16 145)";
		expect(oklabDistance(a, b)).toBeGreaterThan(0.2);
	});

	it("takes a color object as readily as a string", () => {
		expect(oklabDistance({ l: 0.6, c: 0.1, h: 20, alpha: 1 }, "oklch(0.6 0.1 20)")).toBeCloseTo(0, 5);
	});
});

describe("the audit reports how far the solid fills read from each other", () => {
	it("grades every unordered pair of the six roles", () => {
		const audit = auditRegister(at("#6ea8fe"));
		expect(audit.roleSeparation).toHaveLength(15);
		expect(audit.separationFloor).toBe(0.02);
	});

	it("leaves an ordinary brand color clear of every status role", () => {
		const audit = auditRegister(at("#6ea8fe"));
		expect(audit.roleSeparation.filter((entry) => !entry.clears)).toEqual([]);
		expect(audit.worstSeparation).toBeGreaterThan(0.02);
	});

	/**
	 * The case the report was written for — a red brand deriving a danger that reads as the same colour
	 * — no longer happens: the derivation holds `--danger` off a colliding accent, so the report has
	 * nothing to name. Kept as the regression guard for that guard.
	 */
	it("finds no collision under the red brand that used to produce one", () => {
		const audit = auditRegister(at("#e5484d"));
		expect(audit.roleSeparation.filter((entry) => !entry.clears)).toEqual([]);
		expect(audit.worstSeparation).toBeGreaterThan(0.02);
	});

	/**
	 * The report still has to be able to say it. A pin is the one way two roles can still land on each
	 * other, since a direct pin outranks the guard.
	 */
	it("names a collision an author pins into place", () => {
		const register = derive(xtyleDefault, {
			constraints: { "--bg-0": "#101216", "--accent": "#e5484d", "--danger": "#e5484d" },
		});
		const audit = auditRegister(register);
		expect(audit.roleSeparation.filter((entry) => !entry.clears).map((entry) => entry.pair)).toContain(
			"--accent vs --danger",
		);
		expect(audit.worstSeparation).toBeLessThan(0.02);
	});

	it("does not let the collision touch the contrast verdict, which is a different question", () => {
		const audit = auditRegister(at("#e5484d"));
		expect(audit.passes).toBe(true);
	});

	it("grades against a caller's floor rather than only its own", () => {
		const audit = auditRegister(at("#6ea8fe"), { separationFloor: 0.5 });
		expect(audit.separationFloor).toBe(0.5);
		expect(audit.roleSeparation.some((entry) => !entry.clears)).toBe(true);
	});

	it("reports nothing rather than guessing when the roles are absent", () => {
		const audit = auditRegister({ "--fg-0": "#fff", "--bg-0": "#000" });
		expect(audit.roleSeparation).toEqual([]);
		expect(audit.worstSeparation).toBe(0);
	});
});
