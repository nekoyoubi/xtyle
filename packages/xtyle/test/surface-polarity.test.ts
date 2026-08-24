import { describe, expect, it } from "vitest";
import { auditRegister, derive } from "../src/index.js";
import { xtyleDefault } from "../src/batteries.js";

const at = (constraints: Record<string, string>) => auditRegister(derive(xtyleDefault, { constraints }));

describe("the audit names a theme whose surfaces straddle the light/dark line", () => {
	it("stays quiet when every surface sits on one side", () => {
		for (const bg of ["#0b0d12", "#f7f7f8"]) {
			const audit = at({ "--bg-0": bg });
			expect(audit.surfacePolarity.spansPoles, bg).toBe(false);
			expect(audit.passes, bg).toBe(true);
		}
	});

	it("names it when a panel is pinned across the line from the page", () => {
		const audit = at({ "--bg-0": "#0b0d12", "--bg-1": "#8a8a8a" });
		expect(audit.surfacePolarity.spansPoles).toBe(true);
		expect(audit.surfacePolarity.dark).toContain("--bg-0");
		expect(audit.surfacePolarity.light).toContain("--bg-1");
	});

	it("names it in the mirror case, a dark panel on a light page", () => {
		const audit = at({ "--bg-0": "#f7f7f8", "--bg-1": "#222222" });
		expect(audit.surfacePolarity.spansPoles).toBe(true);
		expect(audit.surfacePolarity.light).toContain("--bg-0");
		expect(audit.surfacePolarity.dark).toContain("--bg-1");
	});

	/**
	 * The reason it is worth naming: one ink is contracted to read on all three surfaces, so a theme
	 * that straddles has no satisfying value and the failures arrive as a scatter of unrelated pairs.
	 */
	it("accompanies the contrast failures it explains", () => {
		const audit = at({ "--bg-0": "#0b0d12", "--bg-1": "#8a8a8a" });
		expect(audit.passes).toBe(false);
		expect(audit.tallies.fail).toBeGreaterThan(1);
		const surfaces = new Set(audit.entries.filter((e) => e.tier === "fail").map((e) => e.bg));
		expect([...surfaces].some((s) => audit.surfacePolarity.light.includes(s))).toBe(true);
	});

	it("does not touch the verdict on its own", () => {
		const audit = at({ "--bg-0": "#0b0d12" });
		expect(audit.surfacePolarity.spansPoles).toBe(false);
		expect(audit.passes).toBe(true);
	});
});
