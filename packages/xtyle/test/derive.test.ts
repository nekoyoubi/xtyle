import { describe, expect, it } from "vitest";
import { KEYWORD_DOMAINS, contrast, derive, toOklchColor } from "../src/index.js";
import { xtyleDefault } from "../src/batteries.js";

const PALETTE_HUES = [
	"red",
	"orange",
	"yellow",
	"green",
	"blue",
	"purple",
	"brown",
	"pink",
	"cyan",
	"gray",
	"white",
	"black",
];
const PALETTE_STOPS = ["subtle", "muted", "base", "strong", "contrast"];

function lengthRem(value: string): number {
	const m = /^(-?[0-9.]+)(rem|px)$/.exec(value);
	return m ? Number.parseFloat(m[1]!) : Number.NaN;
}

describe("derive(xtyle-default) — coverage", () => {
	it("produces every declared token from bg + accent", () => {
		const register = derive(xtyleDefault, {
			constraints: { "--bg-0": "#0f1115", "--accent": "#5b8cff" },
		});
		for (const token of xtyleDefault.produces) {
			expect(register[token], `missing ${token}`).toBeTypeOf("string");
			expect(register[token]!.length, `empty ${token}`).toBeGreaterThan(0);
		}
	});

	it("declares a category for every produced token", () => {
		for (const token of xtyleDefault.produces) {
			expect(xtyleDefault.categories[token], `no category for ${token}`).toBeTypeOf(
				"string",
			);
		}
	});
});

describe("dimensions.color", () => {
	const register = derive(xtyleDefault, { constraints: { "--bg-0": "#0f1115", "--accent": "#5b8cff" } });

	it("derives scheme from bg lightness", () => {
		expect(derive(xtyleDefault, { constraints: { "--bg-0": "#101010" } })["--scheme"]).toBe("dark");
		expect(derive(xtyleDefault, { constraints: { "--bg-0": "#f4f4f4" } })["--scheme"]).toBe("light");
	});

	it("clears AA for fg-0 on bg-0", () => {
		expect(contrast(register["--fg-0"]!, register["--bg-0"]!)).toBeGreaterThanOrEqual(4.5);
	});

	it("emits the new component verbs", () => {
		for (const t of [
			"--neutral",
			"--neutral-bg",
			"--neutral-fg",
			"--neutral-text",
			"--accent-bg",
			"--accent-fg",
			"--accent-text",
			"--field-bg",
			"--field-border",
			"--placeholder",
			"--fg-disabled",
			"--surface-overlay",
			"--surface-overlay-border",
			"--success-fg",
			"--success-text",
			"--warn-fg",
			"--warn-text",
			"--danger-fg",
			"--danger-text",
			"--info-fg",
			"--info-text",
		]) {
			expect(register[t], `missing ${t}`).toBeTypeOf("string");
		}
	});

	it("emits the existing floor fx verbs", () => {
		for (const t of ["--bg-sunken", "--selection", "--highlight", "--shadow"]) {
			expect(register[t], `missing ${t}`).toBeTypeOf("string");
			expect(register[t]!.length, `empty ${t}`).toBeGreaterThan(0);
		}
		expect(register["--shadow"]).toBe(register["--elevation-3"]);
	});

	it("recesses bg-sunken below body-bg and keeps selection/highlight translucent", () => {
		const dark = derive(xtyleDefault, { constraints: { "--bg-0": "#0f1115" } });
		expect(toOklchColor(dark["--bg-sunken"]!).l).toBeLessThanOrEqual(
			toOklchColor(dark["--body-bg"]!).l,
		);
		const light = derive(xtyleDefault, { constraints: { "--bg-0": "#f4f4f4" } });
		expect(toOklchColor(light["--bg-sunken"]!).l).toBeGreaterThanOrEqual(
			toOklchColor(light["--body-bg"]!).l,
		);
		expect(register["--selection"]).toMatch(/rgba?\(/);
		expect(register["--highlight"]).toMatch(/rgba?\(/);
	});

	it("flanks accent-2 a half-step under the accent by default", () => {
		const r = derive(xtyleDefault, { constraints: { "--accent": "#5b8cff" } });
		const base = toOklchColor(r["--accent"]!);
		const a2 = toOklchColor(r["--accent-2"]!);
		const delta = ((a2.h - base.h) % 360 + 360) % 360;
		expect(Math.abs(delta - 315)).toBeLessThan(2);
	});

	it("routes a token override through as a constraint", () => {
		const r = derive(xtyleDefault, {
			constraints: { "--accent": "rebeccapurple" },
		});
		expect(r["--accent"]).toBe("rebeccapurple");
	});
});

describe("dimensions.palette", () => {
	const register = derive(xtyleDefault, { constraints: { "--bg-0": "#0f1115", "--accent": "#5b8cff" } });

	it("emits a bare alias and a 5-stop ramp per hue", () => {
		for (const hue of PALETTE_HUES) {
			expect(register[`--color-${hue}`], `missing --color-${hue}`).toBeTypeOf("string");
			for (const stop of PALETTE_STOPS) {
				expect(register[`--color-${hue}-${stop}`], `missing --color-${hue}-${stop}`).toBeTypeOf(
					"string",
				);
			}
		}
	});

	it("keeps each chromatic hue true to its name across schemes", () => {
		const hueAngles: Record<string, number> = {
			red: 25,
			green: 145,
			blue: 250,
		};
		for (const scheme of ["dark", "light"] as const) {
			const r = derive(xtyleDefault, { knobs: { scheme } });
			for (const [hue, angle] of Object.entries(hueAngles)) {
				const o = toOklchColor(r[`--color-${hue}-base`]!);
				let dh = Math.abs(o.h - angle) % 360;
				if (dh > 180) dh = 360 - dh;
				expect(dh, `${hue} strayed in ${scheme}`).toBeLessThan(20);
			}
		}
	});

	it("decouples literal palette from status roles", () => {
		const r = derive(xtyleDefault, { constraints: { "--accent": "#ffd000" } });
		const red = toOklchColor(r["--color-red-base"]!);
		let dh = Math.abs(red.h - 25) % 360;
		if (dh > 180) dh = 360 - dh;
		expect(dh).toBeLessThan(20);
	});

	it("makes contrast stop readable on base", () => {
		for (const hue of PALETTE_HUES) {
			expect(
				contrast(register[`--color-${hue}-base`]!, register[`--color-${hue}-contrast`]!),
				`${hue} contrast`,
			).toBeGreaterThanOrEqual(4.5);
		}
	});
});

describe("dimensions.type", () => {
	it("scales text steps from the typeScale knob", () => {
		const r = derive(xtyleDefault, { knobs: { typeScale: 1.25 } });
		const steps = ["xs", "sm", "body", "lg", "xl", "2xl", "3xl", "4xl", "5xl"];
		let prev = -Infinity;
		for (const step of steps) {
			const rem = lengthRem(r[`--text-${step}`]!);
			expect(rem).toBeGreaterThan(prev);
			prev = rem;
		}
		expect(r["--text-body"]).toBe("1rem");
	});

	it("emits fonts, leading, and weights", () => {
		const r = derive(xtyleDefault, { knobs: { fonts: { mono: "Fira Code" } } });
		expect(r["--font-mono"]).toBe("Fira Code");
		expect(r["--font-sans"]).toContain("system-ui");
		expect(Number.parseFloat(r["--weight-bold"]!)).toBeGreaterThan(
			Number.parseFloat(r["--weight-normal"]!),
		);
		expect(Number.parseFloat(r["--leading-loose"]!)).toBeGreaterThan(
			Number.parseFloat(r["--leading-tight"]!),
		);
	});
});

describe("dimensions.geometry / motion / elevation / space", () => {
	it("scales the radius ladder by radiusScale and stays non-decreasing", () => {
		const r = derive(xtyleDefault, { knobs: { radiusScale: 2 } });
		expect(lengthRem(r["--radius-none"]!)).toBe(0);
		expect(lengthRem(r["--radius-md"]!)).toBe(8);
		expect(lengthRem(r["--radius-lg"]!)).toBeGreaterThanOrEqual(lengthRem(r["--radius-md"]!));
	});

	it("emits increasing borders and durations and bezier easings", () => {
		const r = derive(xtyleDefault, {});
		expect(r["--ease-standard"]).toContain("cubic-bezier(");
		expect(Number.parseFloat(r["--duration-slow"]!)).toBeGreaterThan(
			Number.parseFloat(r["--duration-fast"]!),
		);
		expect(r["--border-thick"]).toBe("2px");
	});

	it("emits a 6-rung elevation ladder, 0 = none", () => {
		const r = derive(xtyleDefault, {});
		expect(r["--elevation-0"]).toBe("none");
		expect(r["--elevation-3"]).toContain("rgba");
	});

	it("scales the space ramp by density", () => {
		const compact = derive(xtyleDefault, { knobs: { density: "compact" } });
		const comfy = derive(xtyleDefault, { knobs: { density: "comfortable" } });
		expect(compact["--space-0"]).toBe("0rem");
		expect(lengthRem(comfy["--space-4"]!)).toBeGreaterThan(lengthRem(compact["--space-4"]!));
	});
});

describe("keyword intent-token domains", () => {
	const ctxFor = (register: Record<string, string>) => ({
		register,
		categories: xtyleDefault.categories,
		knobs: {},
		scheme: "dark" as const,
		constraints: {},
	});

	it("only emits in-domain --selection-cue values", () => {
		const cue = derive(xtyleDefault)["--selection-cue"] as string;
		expect(KEYWORD_DOMAINS["--selection-cue"]).toContain(cue);
		const redundant = derive(xtyleDefault, { knobs: { cues: "redundant" } })["--selection-cue"] as string;
		expect(redundant).toBe("marker");
	});

	it("the format invariant rejects a keyword value outside its domain", () => {
		const register = derive(xtyleDefault) as Record<string, string>;
		expect(xtyleDefault.invariants.every((inv) => inv(ctxFor(register)).ok)).toBe(true);
		const bad = ctxFor({ ...register, "--selection-cue": "sparkle" });
		expect(xtyleDefault.invariants.some((inv) => !inv(bad).ok)).toBe(true);
	});
});

describe("deep pinning re-hues a pinned tone's whole family", () => {
	const anchors = { bg: "#0f1115", accent: "#5b8cff" };
	const hueOf = (css: string) => ((toOklchColor(css).h % 360) + 360) % 360;
	const hueDist = (a: number, b: number) => {
		const d = Math.abs(a - b) % 360;
		return d > 180 ? 360 - d : d;
	};

	it("re-hues a pinned semantic role's tint and inks off its catalog hue", () => {
		const pin = "#3366ff";
		const pinHue = hueOf(pin);
		const r = derive(xtyleDefault, { anchors, constraints: { "--danger": pin } });
		expect(r["--danger"]).toBe(pin);
		for (const t of ["--danger-bg", "--danger-text"] as const) {
			expect(hueDist(hueOf(r[t]!), pinHue)).toBeLessThan(12);
		}
		expect(contrast(r["--danger-text"]!, r["--danger-bg"]!)).toBeGreaterThanOrEqual(4.5);
	});

	it("re-hues a pinned palette tone's family around the pin", () => {
		const pin = "#cc2e88";
		const pinHue = hueOf(pin);
		const r = derive(xtyleDefault, { anchors, constraints: { "--green": pin } });
		expect(r["--green"]).toBe(pin);
		for (const t of ["--green-bg", "--green-text"] as const) {
			expect(hueDist(hueOf(r[t]!), pinHue)).toBeLessThan(12);
		}
		expect(contrast(r["--green-fg"]!, r["--green"]!)).toBeGreaterThanOrEqual(4.5);
	});

	it("keeps the catalog hue when the tone is left unpinned", () => {
		const r = derive(xtyleDefault, { anchors });
		expect(hueDist(hueOf(r["--danger-text"]!), hueOf("#3366ff"))).toBeGreaterThan(60);
		expect(hueDist(hueOf(r["--green-text"]!), hueOf("#cc2e88"))).toBeGreaterThan(60);
	});
});

describe("status roles stay mutually distinguishable", () => {
	const ctxFor = (register: Record<string, string>) => ({
		register,
		categories: xtyleDefault.categories,
		knobs: {},
		scheme: "dark" as const,
		constraints: {},
	});

	it("passes on real output and fires when two status colors collapse", () => {
		const register = derive(xtyleDefault) as Record<string, string>;
		expect(xtyleDefault.invariants.every((inv) => inv(ctxFor(register)).ok)).toBe(true);
		const collapsed = ctxFor({ ...register, "--danger": register["--success"]! });
		const failed = xtyleDefault.invariants
			.map((inv) => inv(collapsed))
			.filter((result) => !result.ok);
		expect(failed.some((result) => result.name === "status roles mutually distinguishable")).toBe(true);
	});
});
