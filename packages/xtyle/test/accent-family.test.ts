import { describe, expect, it } from "vitest";
import { derive, hueDelta, toOklchColor } from "../src/index.js";
import { xtyleDefault } from "../src/batteries.js";

const FAMILY = ["--accent", "--accent-2", "--accent-3", "--accent-4"] as const;

function family(constraints: Record<string, string>, knobs: Record<string, unknown> = {}) {
	const register = derive(xtyleDefault, { constraints, knobs });
	return FAMILY.map((token) => ({ token, hex: register[token] as string, color: toOklchColor(register[token] as string) }));
}

const lightnesses = (members: ReturnType<typeof family>) => members.map((m) => Math.round(m.color.l * 100));

describe("the shade ladder hangs off a rung it can reach", () => {
	it("climbs away from the floor when the accent is already dark", () => {
		const members = family({ "--bg-0": "#b4b5b6", "--fg-0": "#e7e9ff", "--accent": "#22004e" }, { accentStrategy: "shade", vibrancy: 0 });
		expect(new Set(members.map((m) => m.hex)).size).toBe(4);
		const ls = lightnesses(members);
		expect(ls.every((l, i) => i === 0 || l > (ls[i - 1] as number))).toBe(true);
	});

	it("walks down away from the ceiling when the accent is already light", () => {
		const members = family({ "--bg-0": "#101014", "--accent": "#f2e9ff" }, { accentStrategy: "shade" });
		expect(new Set(members.map((m) => m.hex)).size).toBe(4);
		const ls = lightnesses(members);
		expect(ls.every((l, i) => i === 0 || l < (ls[i - 1] as number))).toBe(true);
	});

	it("keeps the tint-up-two-down posture when the accent has room on both sides", () => {
		const ls = lightnesses(family({ "--bg-0": "#0b0d12", "--accent": "#6ea8fe" }, { accentStrategy: "shade" }));
		expect(ls[1]).toBeGreaterThan(ls[0] as number);
		expect(ls[2]).toBeLessThan(ls[0] as number);
		expect(ls[3]).toBeLessThan(ls[2] as number);
	});
});

describe("a hue fan turns chroma it can actually hold", () => {
	it("gives the wings of a near-white accent chroma to separate with", () => {
		const members = family({ "--bg-0": "#fffcfc", "--fg-0": "#575197", "--accent": "#e9fcff" }, { accentStrategy: "fan", accentSplit: 20, vibrancy: 0 });
		expect(new Set(members.map((m) => m.hex)).size).toBe(4);
		expect(Math.max(...members.slice(1).map((m) => m.color.c))).toBeGreaterThan(members[0]!.color.c);
	});

	it("leaves a healthy accent's fan on the accent's own lightness", () => {
		const members = family({ "--bg-0": "#0b0d12", "--accent": "#6ea8fe" }, { accentStrategy: "fan" });
		const ls = lightnesses(members);
		expect(new Set(ls).size).toBe(1);
	});

	it("steps duo's two shades apart when the second brand is achromatic and lends them no hue", () => {
		const members = family(
			{ "--bg-0": "#a7ffed", "--fg-0": "#d14a33", "--accent": "#ffdce5", "--accent-2": "#878787" },
			{ accentStrategy: "duo", accentSplit: 30, scheme: "light", contrastBand: "aa" },
		);
		const [, , third, fourth] = members;
		expect(third!.hex).not.toBe(fourth!.hex);
		expect(Math.abs(third!.color.l - fourth!.color.l)).toBeGreaterThan(0.02);
	});

	it("leaves duo's shades on one lightness when the two brands' hues already separate them", () => {
		const members = family(
			{ "--bg-0": "#0b0d12", "--accent": "#6ea8fe", "--accent-2": "#ff8a3d" },
			{ accentStrategy: "duo" },
		);
		const [, , third, fourth] = members;
		expect(Math.abs(third!.color.l - fourth!.color.l)).toBeLessThan(0.02);
		expect(third!.hex).not.toBe(fourth!.hex);
	});

	it("honors a pinned family member verbatim rather than rescuing it", () => {
		const members = family({ "--bg-0": "#fffcfc", "--accent": "#e9fcff", "--accent-2": "#123456" }, { accentStrategy: "fan" });
		expect(members[1]?.hex).toBe("#123456");
	});

	it("keeps the fourth off a flank the pin's mirror swung into", () => {
		const members = family(
			{ "--bg-0": "#ffffff", "--fg-0": "#1a1a1a", "--accent": "#d81b60", "--accent-2": "#00b894" },
			{ accentStrategy: "fan" },
		);
		const arcs = members.flatMap((one, i) =>
			members.slice(i + 1).map((other) => Math.abs(hueDelta(one.color.h, other.color.h))),
		);
		expect(Math.min(...arcs)).toBeGreaterThan(30);
	});

	it("keeps a soft accent fill off its own solid on a mid-gray page", () => {
		const register = derive(xtyleDefault, { constraints: { "--bg-0": "#8a8a8a", "--fg-0": "#111111", "--accent": "#7a7d80" } });
		const solid = toOklchColor(register["--accent"] as string);
		const tint = toOklchColor(register["--accent-bg"] as string);
		const arc = Math.abs(hueDelta(solid.h, tint.h)) * Math.min(solid.c, tint.c);
		expect(Math.abs(solid.l - tint.l) >= 0.02 || Math.abs(solid.c - tint.c) >= 0.02 || arc >= 0.6).toBe(true);
	});

	it("leaves the fourth on the accent's complement when no flank is pinned", () => {
		const members = family({ "--bg-0": "#ffffff", "--fg-0": "#1a1a1a", "--accent": "#d81b60" }, { accentStrategy: "fan" });
		const [first, , , fourth] = members;
		expect(Math.abs(Math.abs(hueDelta(first!.color.h, fourth!.color.h)) - 180)).toBeLessThan(1);
	});
});
