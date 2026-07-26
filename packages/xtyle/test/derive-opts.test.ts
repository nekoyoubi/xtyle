import { describe, expect, it } from "vitest";
import { clamp01, constraintsFrom, derive, deriveTraced, formatCss, toOklchColor, withLightness } from "../src/index.js";
import { xtyleDefault } from "../src/batteries.js";

const SEED = { "--accent": "#7c5cff" };

describe("derive option validation", () => {
	it("accepts the known keys (knobs, constraints, anchors, invert)", () => {
		expect(() => derive(xtyleDefault, { constraints: SEED, knobs: { scheme: "dark" } })).not.toThrow();
		expect(() => derive(xtyleDefault, { anchors: { accent: "#7c5cff" } })).not.toThrow();
		expect(() => derive(xtyleDefault, { constraints: SEED, invert: true })).not.toThrow();
		expect(() => derive(xtyleDefault, {})).not.toThrow();
	});

	it("throws on a mis-seeded shape instead of silently ignoring it", () => {
		expect(() => derive(xtyleDefault, { seeds: { accent: "#7c5cff" } } as never)).toThrow(/unknown option "seeds"/);
		expect(() => derive(xtyleDefault, { inputs: { accent: "#7c5cff" } } as never)).toThrow(/unknown option "inputs"/);
	});

	it("names both seed channels in the error so the fix is obvious", () => {
		expect(() => derive(xtyleDefault, { seeds: {} } as never)).toThrow(/anchors/);
		expect(() => derive(xtyleDefault, { seeds: {} } as never)).toThrow(/constraints/);
	});

	it("guards deriveTraced on the same keys", () => {
		expect(() => deriveTraced(xtyleDefault, { seeds: {} } as never)).toThrow(/unknown option "seeds"/);
		expect(() => deriveTraced(xtyleDefault, { constraints: SEED })).not.toThrow();
	});
});

describe("anchors is a real seed channel folded into constraints", () => {
	it("seeds the accent through the friendly `anchors` shape", () => {
		const viaAnchors = derive(xtyleDefault, { anchors: { accent: "#7c5cff" } });
		const bare = derive(xtyleDefault, {});
		expect(viaAnchors["--accent"]).toBe("#7c5cff");
		expect(viaAnchors["--accent"]).not.toBe(bare["--accent"]);
	});

	it("maps bg / fg / accent to their token keys, and an explicit constraint wins the conflict", () => {
		const r = derive(xtyleDefault, {
			anchors: { bg: "#0b0d12", fg: "#e6e9ef", accent: "#6ea8fe" },
			constraints: { "--accent": "#123456" },
		});
		expect(r["--bg-0"]).toBe("#0b0d12");
		expect(r["--fg-0"]).toBe("#e6e9ef");
		expect(r["--accent"]).toBe("#123456");
	});
});

describe("invert flips a theme to the opposite mode, non-destructively", () => {
	const anchors = { bg: "#0b0d12", fg: "#e6e9ef", accent: "#6ea8fe" };

	it("turns a dark anchor set into the light theme the swapped anchors would derive", () => {
		const inverted = derive(xtyleDefault, { anchors, invert: true });
		const swapped = derive(xtyleDefault, { anchors: { bg: anchors.fg, fg: anchors.bg, accent: anchors.accent } });
		expect(inverted["--scheme"]).toBe("light");
		expect(inverted).toEqual(swapped);
	});

	it("leaves the accent and hue anchors untouched, exchanging only bg and fg", () => {
		const inverted = derive(xtyleDefault, { anchors, invert: true });
		expect(inverted["--bg-0"]).toBe(anchors.fg);
		expect(inverted["--fg-0"]).toBe(anchors.bg);
		expect(inverted["--accent"]).toBe(anchors.accent);
	});

	it("round-trips: inverting the inverted anchors returns the original register", () => {
		const base = derive(xtyleDefault, { anchors });
		const twice = derive(xtyleDefault, {
			constraints: { "--bg-0": anchors.fg, "--fg-0": anchors.bg, "--accent": anchors.accent },
			invert: true,
		});
		expect(twice).toEqual(base);
	});

	it("flips a theme that pinned nothing but an accent, by re-deriving in the opposite mode", () => {
		const seed = { "--accent": "#3ad6f8" };
		const base = derive(xtyleDefault, { constraints: seed });
		const inverted = derive(xtyleDefault, { constraints: seed, invert: true });
		expect(base["--scheme"]).toBe("dark");
		expect(inverted["--scheme"]).toBe("light");
		expect(inverted["--accent"]).toBe(base["--accent"]);
		expect(toOklchColor(inverted["--bg-0"]!).l).toBeGreaterThan(toOklchColor(base["--bg-0"]!).l);
	});

	it("re-derives the ladder for the flipped scheme rather than carrying a stale rung", () => {
		const inverted = derive(xtyleDefault, {
			constraints: { "--bg-0": "#0b0d12", "--fg-0": "#e6e9ef" },
			invert: true,
		});
		expect(inverted["--scheme"]).toBe("light");
		const lightness = (token: string) => toOklchColor(inverted[token]!).l;
		expect(lightness("--bg-0")).toBeGreaterThan(lightness("--bg-2"));
		expect(lightness("--bg-2")).toBeGreaterThan(lightness("--bg-3"));
	});
});

describe("invert re-derives overridden surface tokens through the algorithm rather than mirroring them", () => {
	const anchors = { bg: "#0b0d12", fg: "#e6e9ef", accent: "#6ea8fe" };
	const l = (v: string | undefined) => toOklchColor(v!).l;
	const swappedAnchors = { bg: anchors.fg, fg: anchors.bg, accent: anchors.accent };

	it("flips a directly overridden dark surface to light instead of leaving it stuck dark", () => {
		const constraints = {
			"--surface-overlay": "#2c303a",
			"--bg-sunken": "#15171c",
			"--field-bg": "#1f2229",
		};
		const base = derive(xtyleDefault, { anchors, constraints });
		const inverted = derive(xtyleDefault, { anchors, constraints, invert: true });
		expect(base["--scheme"]).toBe("dark");
		expect(inverted["--scheme"]).toBe("light");
		for (const token of ["--surface-overlay", "--bg-sunken", "--field-bg"]) {
			expect(l(base[token])).toBeLessThan(0.5);
			expect(l(inverted[token])).toBeGreaterThan(0.5);
		}
	});

	it("drops an override that matched native, landing on the algorithm's own light-scheme value", () => {
		const nativeOverlay = derive(xtyleDefault, { anchors })["--surface-overlay"];
		const inverted = derive(xtyleDefault, {
			anchors,
			constraints: { "--surface-overlay": nativeOverlay! },
			invert: true,
		});
		const nativeInvertedOverlay = derive(xtyleDefault, { anchors: swappedAnchors })["--surface-overlay"];
		expect(inverted["--surface-overlay"]).toBe(nativeInvertedOverlay);
	});

	it("carries a genuine customization across the flip as its offset from native", () => {
		const nativeOverlayL = l(derive(xtyleDefault, { anchors })["--surface-overlay"]);
		const custom = formatCss(withLightness(toOklchColor("#2c303a"), nativeOverlayL + 0.08));
		const inverted = derive(xtyleDefault, {
			anchors,
			constraints: { "--surface-overlay": custom },
			invert: true,
		});
		const nativeInvertedL = l(derive(xtyleDefault, { anchors: swappedAnchors })["--surface-overlay"]);
		expect(l(inverted["--surface-overlay"])).toBeCloseTo(clamp01(nativeInvertedL + 0.08), 2);
	});

	it("keeps the accent seed and passes non-color overrides through", () => {
		const inverted = derive(xtyleDefault, {
			anchors,
			constraints: { "--radius-md": "6px" },
			invert: true,
		});
		expect(inverted["--accent"]).toBe(anchors.accent);
		expect(inverted["--radius-md"]).toBe("6px");
	});
});

describe("constraintsFrom is reachable from the main entry", () => {
	it("builds a constraints map from bg / fg / accent + overrides", () => {
		expect(constraintsFrom({ accent: "#7c5cff" })).toEqual({ "--accent": "#7c5cff" });
		expect(constraintsFrom({ bg: "#0b0d12", fg: "#e6e9ef", accent: "#6ea8fe" })).toEqual({
			"--bg-0": "#0b0d12",
			"--fg-0": "#e6e9ef",
			"--accent": "#6ea8fe",
		});
	});

	it("seeds derive through the constraints channel", () => {
		const register = derive(xtyleDefault, { constraints: constraintsFrom({ accent: "#7c5cff" }) });
		expect(register["--accent"]).toBe("#7c5cff");
	});
});
