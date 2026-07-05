import { describe, expect, it } from "vitest";
import { constraintsFrom, derive, deriveTraced } from "../src/index.js";
import { xojiDefault } from "../src/batteries.js";

const SEED = { "--accent": "#7c5cff" };

describe("derive option validation", () => {
	it("accepts the known keys (knobs, constraints, anchors)", () => {
		expect(() => derive(xojiDefault, { constraints: SEED, knobs: { scheme: "dark" } })).not.toThrow();
		expect(() => derive(xojiDefault, { anchors: { accent: "#7c5cff" } })).not.toThrow();
		expect(() => derive(xojiDefault, {})).not.toThrow();
	});

	it("throws on a mis-seeded shape instead of silently ignoring it", () => {
		// The reported footgun: these were accepted and dropped, returning the *default* accent.
		expect(() => derive(xojiDefault, { seeds: { accent: "#7c5cff" } } as never)).toThrow(/unknown option "seeds"/);
		expect(() => derive(xojiDefault, { inputs: { accent: "#7c5cff" } } as never)).toThrow(/unknown option "inputs"/);
	});

	it("names both seed channels in the error so the fix is obvious", () => {
		expect(() => derive(xojiDefault, { seeds: {} } as never)).toThrow(/anchors/);
		expect(() => derive(xojiDefault, { seeds: {} } as never)).toThrow(/constraints/);
	});

	it("guards deriveTraced on the same keys", () => {
		expect(() => deriveTraced(xojiDefault, { seeds: {} } as never)).toThrow(/unknown option "seeds"/);
		expect(() => deriveTraced(xojiDefault, { constraints: SEED })).not.toThrow();
	});
});

describe("anchors is a real seed channel folded into constraints", () => {
	it("seeds the accent through the friendly `anchors` shape", () => {
		const viaAnchors = derive(xojiDefault, { anchors: { accent: "#7c5cff" } });
		const bare = derive(xojiDefault, {});
		expect(viaAnchors["--accent"]).toBe("#7c5cff");
		expect(viaAnchors["--accent"]).not.toBe(bare["--accent"]);
	});

	it("maps bg / fg / accent to their token keys, and an explicit constraint wins the conflict", () => {
		const r = derive(xojiDefault, {
			anchors: { bg: "#0b0d12", fg: "#e6e9ef", accent: "#6ea8fe" },
			constraints: { "--accent": "#123456" },
		});
		expect(r["--bg-0"]).toBe("#0b0d12");
		expect(r["--fg-0"]).toBe("#e6e9ef");
		expect(r["--accent"]).toBe("#123456");
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
		const register = derive(xojiDefault, { constraints: constraintsFrom({ accent: "#7c5cff" }) });
		expect(register["--accent"]).toBe("#7c5cff");
	});
});
