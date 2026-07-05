import { describe, expect, it } from "vitest";
import {
	DEFAULT_ANCHORS,
	deriveTraced,
	makeXtyleAlgorithm,
	makeXtylePipelineAlgorithm,
	resolveGraph,
	runPipeline,
	settlePass,
	SHARED_KNOBS,
} from "../src/index.js";
import { nxiNite, xtyleDefault } from "../src/batteries.js";
import { nightness } from "../../../algorithms/nxi-nite/src/passes.js";
import type { Pass, PassContext, PresetDefaults, TokenRegister } from "../src/index.js";

const PRESET: PresetDefaults = {
	id: "pipeline-test",
	knobs: SHARED_KNOBS,
	defaultAnchors: DEFAULT_ANCHORS,
	contrastFloor: 4.7,
	declaredTextOnFillFloor: 4.5,
	defaultVibrancy: 0.5,
	accentChromaMul: 1,
	statusChromaMul: 1,
	paletteChromaMul: 1,
	neutralChroma: 0.01,
	elevationStrengthMul: 1,
	elevationAlphaBoost: 0,
	accentTintChromaMul: 0.3,
};

const stampPass = (name: string, key: string, value: string): Pass => ({
	name,
	run: (register: TokenRegister) => ({ ...register, [key]: value }),
});

describe("single-pass backward compat", () => {
	it("a shipped algorithm exposes exactly one pass named 'settle'", () => {
		expect(xtyleDefault.passes?.map((p) => p.name)).toEqual(["settle"]);
	});

	it("deriveTraced yields one snapshot whose register equals derive", () => {
		const opts = { constraints: { "--bg-0": "#0f1115", "--fg-0": "#e8eaed", "--accent": "#5b8cff" } };
		const traced = deriveTraced(xtyleDefault, opts);
		expect(traced.trace).toHaveLength(1);
		expect(traced.trace[0]?.name).toBe("settle");
		expect(JSON.stringify(traced.register)).toBe(JSON.stringify(xtyleDefault.derive(opts)));
		expect(JSON.stringify(traced.trace[0]?.register)).toBe(
			JSON.stringify(xtyleDefault.derive(opts)),
		);
	});

	it("synthesizes a single snapshot for an algorithm without deriveTraced", () => {
		const bare = { ...xtyleDefault };
		delete bare.deriveTraced;
		const opts = {};
		const traced = deriveTraced(bare, opts);
		expect(traced.trace).toHaveLength(1);
		expect(traced.trace[0]?.name).toBe("derive");
		expect(JSON.stringify(traced.register)).toBe(JSON.stringify(bare.derive(opts)));
	});

	it("resolveGraph(lineage) reproduces derive for a single-pass algorithm", () => {
		const opts = { constraints: { "--bg-0": "#101820", "--fg-0": "#f0f0f0", "--accent": "#22c55e" } };
		expect(JSON.stringify(resolveGraph(xtyleDefault.lineage(opts) as Parameters<typeof resolveGraph>[0]))).toBe(
			JSON.stringify(xtyleDefault.derive(opts)),
		);
	});
});

describe("runPipeline ordering", () => {
	it("threads the register through passes in order, snapshot count === pass count", () => {
		const passes: Pass[] = [
			stampPass("a", "--a", "1"),
			stampPass("b", "--b", "2"),
			stampPass("c", "--c", "3"),
		];
		const ctx = (passIndex: number): PassContext => ({
			constraints: {},
			knobs: {},
			scheme: "dark",
			pinned: {},
			passIndex,
		});
		const { register, trace } = runPipeline(passes, ctx);
		expect(trace.map((s) => s.name)).toEqual(["a", "b", "c"]);
		expect(trace).toHaveLength(passes.length);
		expect(register).toEqual({ "--a": "1", "--b": "2", "--c": "3" });
		expect(Object.keys(trace[0]!.register)).toEqual(["--a"]);
		expect(Object.keys(trace[1]!.register)).toEqual(["--a", "--b"]);
		expect(Object.keys(trace[2]!.register)).toEqual(["--a", "--b", "--c"]);
	});

	it("passes a correct passIndex to each stage", () => {
		const seen: number[] = [];
		const recorder = (name: string): Pass => ({
			name,
			run: (register, ctx) => {
				seen.push(ctx.passIndex);
				return register;
			},
		});
		runPipeline([recorder("x"), recorder("y")], (passIndex) => ({
			constraints: {},
			knobs: {},
			scheme: "dark",
			pinned: {},
			passIndex,
		}));
		expect(seen).toEqual([0, 1]);
	});
});

describe("multi-pass algorithm via makeXtylePipelineAlgorithm", () => {
	const multi = makeXtylePipelineAlgorithm(PRESET, (preset, opts) => [
		settlePass(preset, opts),
		stampPass("warmth", "--probe-warmth", "on"),
		stampPass("dim", "--probe-dim", "on"),
		stampPass("restore", "--probe-restore", "on"),
	]);

	it("exposes the full ordered pass list", () => {
		expect(multi.passes?.map((p) => p.name)).toEqual(["settle", "warmth", "dim", "restore"]);
	});

	it("deriveTraced names every pass and each snapshot differs from the prior", () => {
		const traced = multi.deriveTraced!({});
		expect(traced.trace.map((s) => s.name)).toEqual(["settle", "warmth", "dim", "restore"]);
		for (let i = 1; i < traced.trace.length; i++) {
			expect(JSON.stringify(traced.trace[i]!.register)).not.toBe(
				JSON.stringify(traced.trace[i - 1]!.register),
			);
		}
	});

	it("derive returns the final composed register", () => {
		const r = multi.derive({});
		expect(r["--probe-warmth"]).toBe("on");
		expect(r["--probe-dim"]).toBe("on");
		expect(r["--probe-restore"]).toBe("on");
	});

	it("resolveGraph(lineage) reproduces derive for a multi-pass algorithm", () => {
		const opts = { constraints: { "--bg-0": "#0f1115", "--fg-0": "#e8eaed", "--accent": "#5b8cff" } };
		expect(JSON.stringify(resolveGraph(multi.lineage(opts) as Parameters<typeof resolveGraph>[0]))).toBe(
			JSON.stringify(multi.derive(opts)),
		);
	});

	it("its settle-only sibling is byte-identical to the shipped single-pass form", () => {
		const sibling = makeXtylePipelineAlgorithm(PRESET, (preset, opts) => [settlePass(preset, opts)]);
		const plain = makeXtyleAlgorithm(PRESET);
		const opts = { constraints: { "--bg-0": "#1a1410", "--fg-0": "#f0e6dc", "--accent": "#ff9a3c" } };
		expect(JSON.stringify(sibling.derive(opts))).toBe(JSON.stringify(plain.derive(opts)));
	});
});

describe("nxi-nite Day/Night multi-pass", () => {
	it("exposes the four named passes settle->warmth->dim->contrast-restore", () => {
		expect(nxiNite.passes?.map((p) => p.name)).toEqual([
			"settle",
			"warmth",
			"dim",
			"contrast-restore",
		]);
	});

	it("deriveTraced names the four passes and each snapshot differs", () => {
		const opts = { constraints: { "--bg-0": "#0f1115", "--fg-0": "#e8eaed", "--accent": "#5b8cff" }, knobs: { hour: 23 } };
		const traced = deriveTraced(nxiNite, opts);
		expect(traced.trace.map((s) => s.name)).toEqual([
			"settle",
			"warmth",
			"dim",
			"contrast-restore",
		]);
		for (let i = 1; i < traced.trace.length; i++) {
			expect(JSON.stringify(traced.trace[i]!.register)).not.toBe(
				JSON.stringify(traced.trace[i - 1]!.register),
			);
		}
		expect(JSON.stringify(traced.register)).toBe(JSON.stringify(nxiNite.derive(opts)));
	});

	it("resolveGraph(lineage) reproduces derive across hours", () => {
		for (const hour of [0, 6, 12, 18, 23]) {
			const opts = { constraints: { "--bg-0": "#0f1115", "--fg-0": "#e8eaed", "--accent": "#5b8cff" }, knobs: { hour } };
			expect(
				JSON.stringify(
					resolveGraph(nxiNite.lineage(opts) as Parameters<typeof resolveGraph>[0]),
				),
			).toBe(JSON.stringify(nxiNite.derive(opts)));
		}
	});

	it("noon and midnight diverge; hour 0 and hour 24 are identical (phase wraps)", () => {
		const anchors = { bg: "#0f1115", fg: "#e8eaed", accent: "#5b8cff" };
		const noon = nxiNite.derive({ anchors, knobs: { hour: 12 } });
		const midnight = nxiNite.derive({ anchors, knobs: { hour: 0 } });
		const wrap = nxiNite.derive({ anchors, knobs: { hour: 24 } });
		expect(JSON.stringify(noon)).not.toBe(JSON.stringify(midnight));
		expect(JSON.stringify(midnight)).toBe(JSON.stringify(wrap));
	});

	it("nightness wraps at the 0/24 pole with noon as the day pole", () => {
		expect(nightness(0)).toBeCloseTo(nightness(24), 10);
		expect(nightness(0)).toBeCloseTo(1, 10);
		expect(nightness(12)).toBeCloseTo(-1, 10);
	});
});
