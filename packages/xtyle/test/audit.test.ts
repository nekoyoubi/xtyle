import { describe, expect, it } from "vitest";
import { auditRegister, canonicalContrastPairs, derive, PALETTE_HUE_ROLES } from "../src/index.js";
import { xtyleDefault } from "../src/batteries.js";

const register = derive(xtyleDefault, { constraints: { "--bg-0": "#0e1116", "--accent": "#6b5dd3" } });

describe("auditRegister", () => {
	it("audits xtyle's canonical text/fill pairs and the default theme clears AA", () => {
		const audit = auditRegister(register);
		// INFO: 39 = fg-0 + 6 surface inks × 3 surfaces + placeholder + 9 on-fill + 3 accent-text + 5 tint-text + fg-0/fg-1 on accent tint
		expect(audit.tallies.total).toBe(39);
		expect(audit.tallies.fail).toBe(0);
		expect(audit.passes).toBe(true);
		expect(audit.level).toBe("AA");
		expect(audit.entries.some((e) => e.fg === "--accent-fg" && e.bg === "--accent")).toBe(true);
		expect(audit.entries.some((e) => e.fg === "--fg-2" && e.bg === "--bg-2")).toBe(true);
		expect(audit.entries.some((e) => e.fg === "--accent-text" && e.bg === "--bg-1")).toBe(true);
		expect(audit.entries.some((e) => e.fg === "--placeholder" && e.bg === "--field-bg")).toBe(true);
		expect(audit.entries.some((e) => e.fg === "--danger-text" && e.bg === "--danger-bg")).toBe(true);
		expect(audit.entries.some((e) => e.fg === "--danger-text" && e.bg === "--bg-0")).toBe(false);
		expect(audit.entries.some((e) => e.fg === "--accent-2-fg" && e.bg === "--accent-2")).toBe(true);
	});

	it("holds every ink a component can lay on the accent tint", () => {
		const pairs = canonicalContrastPairs();
		expect(pairs).toContainEqual({ fg: "--fg-0", bg: "--accent-bg" });
		expect(pairs).toContainEqual({ fg: "--accent-text", bg: "--accent-bg" });
		expect(pairs).toContainEqual({ fg: "--fg-1", bg: "--accent-bg" });

		const audit = auditRegister(register);
		for (const ink of ["--fg-0", "--fg-1", "--accent-text"]) {
			const entry = audit.entries.find((e) => e.fg === ink && e.bg === "--accent-bg");
			expect(entry, `${ink} on --accent-bg is audited`).toBeDefined();
			expect(entry?.tier).not.toBe("fail");
		}
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

	it("exports the canonical pairs as data a consumer can read and extend", () => {
		const pairs = canonicalContrastPairs();
		expect(pairs).toHaveLength(39);
		expect(pairs[0]).toEqual({ fg: "--fg-0", bg: "--bg-0" });
		expect(auditRegister(register).tallies.total).toBe(pairs.length);
	});

	it("grades a consumer's own pair set when opts.pairs is passed, with a custom label", () => {
		const audit = auditRegister(register, {
			pairs: [
				{ fg: "--danger-text", bg: "--bg-0", label: "danger ink on base" },
				{ fg: "--success-text", bg: "--bg-0" },
			],
		});
		expect(audit.tallies.total).toBe(2);
		expect(audit.entries[0]?.pair).toBe("danger ink on base");
		expect(audit.entries[1]?.pair).toBe("--success-text on --bg-0");
		expect(audit.entries.some((e) => e.bg === "--danger-bg")).toBe(false);
	});

	it("audits the named hues against each other when handed the palette set", () => {
		const audit = auditRegister(register, { separationRoles: PALETTE_HUE_ROLES });
		expect(audit.roleSeparation).toHaveLength((PALETTE_HUE_ROLES.length * (PALETTE_HUE_ROLES.length - 1)) / 2);
		expect(audit.roleSeparation.every((entry) => entry.a.startsWith("--") && entry.aValue)).toBe(true);
		expect(audit.roleSeparation.some((entry) => entry.pair === "--orange vs --brown")).toBe(true);
	});

	it("leaves the achromatic names out of the palette set, since they are meant to sit together", () => {
		expect(PALETTE_HUE_ROLES).not.toContain("--gray");
		expect(PALETTE_HUE_ROLES).not.toContain("--white");
		expect(PALETTE_HUE_ROLES).not.toContain("--black");
	});
});

describe("fill-vs-surface reporting", () => {
	it("grades every solid fill against every surface", () => {
		const audit = auditRegister(register);
		expect(audit.fillSurface.length).toBe(18);
		expect(audit.fillSurfaceFloor).toBe(3);
		expect(audit.fillSurface.some((e) => e.fill === "--danger" && e.surface === "--bg-2")).toBe(true);
		expect(audit.worstFillSurface).toBeGreaterThan(0);
	});

	it("reports a fill that vanishes into its surface without failing the audit", () => {
		const invisible = { ...register, "--danger": register["--bg-0"] as string };
		const audit = auditRegister(invisible);

		const pair = audit.fillSurface.find((e) => e.fill === "--danger" && e.surface === "--bg-0");
		expect(pair?.ratio).toBe(1);
		expect(pair?.clears).toBe(false);
		expect(audit.worstFillSurface).toBe(1);

		const textFailures = audit.entries.filter((e) => e.tier === "fail").length;
		expect(audit.tallies.fail).toBe(textFailures);
		expect(audit.passes).toBe(audit.tallies.pass === audit.tallies.total);
		expect(
			audit.fillSurface.filter((e) => !e.clears).length,
			"the boundary grade is reported and never counted as a contrast failure",
		).toBeGreaterThan(0);
	});

	it("takes a caller's floor for the boundary grade", () => {
		const audit = auditRegister(register, { fillSurfaceFloor: 20 });
		expect(audit.fillSurfaceFloor).toBe(20);
		expect(audit.fillSurface.every((e) => e.clears)).toBe(false);
	});
});

const collapsed = derive(xtyleDefault, { constraints: { "--bg-0": "#ffffff", "--fg-0": "#8a8a8a" } });
const inverted = derive(xtyleDefault, { constraints: { "--bg-0": "#ffffff", "--fg-2": "#000000" } });

describe("ramp separation", () => {
	it("grades every adjacent step of the ordered ramps, and a healthy theme clears them", () => {
		const audit = auditRegister(register);
		const fg = audit.rampSeparation.filter((e) => e.ramp === "--fg");
		expect(fg.map((e) => `${e.from}->${e.to}`)).toEqual(["--fg-0->--fg-1", "--fg-1->--fg-2", "--fg-2->--fg-3"]);
		expect(audit.rampSeparation.some((e) => e.ramp === "--bg")).toBe(true);
		expect(audit.rampSeparation.every((e) => e.clears)).toBe(true);
		expect(audit.rampSeparation.every((e) => !e.reversed)).toBe(true);
		expect(audit.worstRampSeparation).toBeGreaterThan(0);
	});

	it("reports a ramp that collapsed onto its anchor, which contrast alone calls healthy", () => {
		const audit = auditRegister(collapsed);
		const fg = audit.rampSeparation.filter((e) => e.ramp === "--fg");
		expect(fg.every((e) => e.distance === 0)).toBe(true);
		expect(fg.every((e) => !e.clears)).toBe(true);
		expect(audit.worstRampSeparation).toBe(0);
		expect(new Set(fg.map((e) => e.toValue)).size).toBe(1);
	});

	it("reports a step that reversed the ramp, which distance alone calls healthy", () => {
		const audit = auditRegister(inverted);
		const reversed = audit.rampSeparation.filter((e) => e.reversed);
		expect(reversed).toHaveLength(1);
		expect(reversed[0]?.from).toBe("--fg-1");
		expect(reversed[0]?.to).toBe("--fg-2");
		expect(audit.rampSeparation.every((e) => e.clears)).toBe(true);
	});

	it("is a report and not a verdict, so `passes` ignores it", () => {
		const audit = auditRegister(collapsed);
		expect(audit.rampSeparation.some((e) => !e.clears)).toBe(true);
		expect(audit.passes).toBe(auditRegister(collapsed).tallies.pass === auditRegister(collapsed).tallies.total);
	});

	it("leaves the accent family out, because whether it is a ramp is the strategy's call", () => {
		const audit = auditRegister(register);
		expect(audit.rampSeparation.some((e) => e.from.startsWith("--accent"))).toBe(false);
	});

	it("takes the floor as a parameter", () => {
		const audit = auditRegister(register, { rampSeparationFloor: 0.9 });
		expect(audit.rampSeparationFloor).toBe(0.9);
		expect(audit.rampSeparation.every((e) => !e.clears)).toBe(true);
	});
});

describe("the focus ring", () => {
	it("grades the ring against every surface it is drawn on, and nothing else", () => {
		const audit = auditRegister(register);
		expect(audit.focusRing.map((e) => e.against)).toEqual(["--bg-0", "--bg-1", "--bg-2"]);
		expect(audit.focusRingFloor).toBe(3);
	});

	it("composites the ring before grading it, because a ring carries alpha", () => {
		const translucent = { ...register, "--ring": "rgba(255, 255, 255, 0.1)" };
		const audit = auditRegister(translucent);
		const onBg0 = audit.focusRing.find((e) => e.against === "--bg-0");
		expect(onBg0?.ringValue).not.toContain("rgba");
		expect(onBg0?.ratio).toBeLessThan(3);
		expect(auditRegister({ ...register, "--ring": "#ffffff" }).focusRing[0]?.ratio).toBeGreaterThan(
			onBg0?.ratio ?? 0,
		);
	});

	it("catches a ring pinned to the surface behind it, which every other dimension misses", () => {
		const invisible = { ...register, "--ring": register["--bg-0"] as string };
		const audit = auditRegister(invisible);
		expect(audit.focusRing.find((e) => e.against === "--bg-0")?.ratio).toBe(1);
		expect(audit.focusRing.some((e) => !e.clears)).toBe(true);
		expect(audit.passes, "the verdict is contrast alone, so an invisible ring still passes").toBe(true);
	});

	it("takes the floor as a parameter", () => {
		expect(auditRegister(register, { focusRingFloor: 21 }).focusRing.every((e) => !e.clears)).toBe(true);
	});
});
