import { describe, expect, it } from "vitest";
import { auditRegister, derive } from "../src/index.js";
import { xojiDefault } from "../src/batteries.js";

const register = derive(xojiDefault, { constraints: { "--bg-0": "#0e1116", "--accent": "#6b5dd3" } });

describe("auditRegister", () => {
	it("audits xoji's canonical text/fill pairs and the default theme clears AA", () => {
		const audit = auditRegister(register);
		// fg-0 + 6 surface inks × 3 surfaces + placeholder + 9 on-fill + 3 accent-text + 4 tint-text = 36
		expect(audit.tallies.total).toBe(36);
		expect(audit.tallies.fail).toBe(0);
		expect(audit.passes).toBe(true);
		expect(audit.level).toBe("AA");
		// each token is audited on its intended surface, matching xoji-default's own invariants
		expect(audit.entries.some((e) => e.fg === "--accent-fg" && e.bg === "--accent")).toBe(true);
		// the neutral inks are held readable on the panel surfaces, not only the base
		expect(audit.entries.some((e) => e.fg === "--fg-2" && e.bg === "--bg-2")).toBe(true);
		expect(audit.entries.some((e) => e.fg === "--accent-text" && e.bg === "--bg-1")).toBe(true);
		// the placeholder is checked on the field surface it actually sits on
		expect(audit.entries.some((e) => e.fg === "--placeholder" && e.bg === "--field-bg")).toBe(true);
		// status readable inks sit on their soft tint, not the base
		expect(audit.entries.some((e) => e.fg === "--danger-text" && e.bg === "--danger-bg")).toBe(true);
		expect(audit.entries.some((e) => e.fg === "--danger-text" && e.bg === "--bg-0")).toBe(false);
		expect(audit.entries.some((e) => e.fg === "--accent-2-fg" && e.bg === "--accent-2")).toBe(true);
	});

	it("grades tiers at the WCAG normal-text floors", () => {
		const white = { "--fg-0": "#ffffff", "--bg-0": "#000000" }; // 21:1 -> AAA
		const grade = auditRegister(white);
		const body = grade.entries.find((e) => e.fg === "--fg-0");
		expect(body?.tier).toBe("AAA");
		expect(body?.ratio).toBeGreaterThan(7);

		const mid = auditRegister({ "--fg-0": "#767676", "--bg-0": "#ffffff" }); // ~4.54 -> AA, not AAA
		expect(mid.entries[0]?.tier).toBe("AA");

		const low = auditRegister({ "--fg-0": "#999999", "--bg-0": "#777777" }); // < 4.5 -> fail
		expect(low.entries[0]?.tier).toBe("fail");
		expect(low.passes).toBe(false);
	});

	it("relaxes the floors for large text", () => {
		const mid = { "--fg-0": "#8a8a8a", "--bg-0": "#ffffff" }; // ~3.1: fails normal AA, clears large AA
		expect(auditRegister(mid).entries[0]?.tier).toBe("fail");
		expect(auditRegister(mid, { largeText: true }).entries[0]?.tier).toBe("AA");
	});

	it("gates pass against the requested level", () => {
		const aa = auditRegister(register, { level: "AA" });
		const aaa = auditRegister(register, { level: "AAA" });
		// the default theme is built to AA, so AAA gates most pairs out of `pass`
		expect(aa.passes).toBe(true);
		expect(aaa.passes).toBe(false);
		expect(aaa.tallies.pass).toBeLessThan(aa.tallies.pass);
	});

	it("reports the worst ratio as the weakest link", () => {
		const audit = auditRegister(register);
		const min = Math.min(...audit.entries.map((e) => e.ratio));
		expect(audit.worst).toBe(min);
	});

	it("skips pairs a partial register is missing and never throws", () => {
		const partial = auditRegister({ "--fg-0": "#fff", "--bg-0": "#000" });
		expect(partial.tallies.total).toBe(1);
		expect(partial.passes).toBe(true);

		const empty = auditRegister({});
		expect(empty.tallies.total).toBe(0);
		expect(empty.worst).toBe(0);
		expect(empty.passes).toBe(true);
	});
});
