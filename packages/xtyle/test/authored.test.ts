import { describe, expect, it } from "vitest";
import { derive, loadAuthoredAlgorithm } from "../src/index.js";

const TIER2_SOURCE = `
defineAlgorithm({
	id: "mono",
	produces: ["--bg-0", "--fg-0", "--accent"],
	categories: { color: ["--bg-0", "--fg-0", "--accent"] },
	knobs: [],
	derive(input, { cuti }) {
		const bg = (input.constraints && input.constraints["--bg-0"]) || "#101014";
		const accent = (input.constraints && input.constraints["--accent"]) || "#5b8cff";
		return [
			{ name: "--bg-0", value: bg },
			{ name: "--fg-0", value: cuti.pickReadable(bg, ["#ffffff", "#000000"], 4.5), refs: ["--bg-0"] },
			{ name: "--accent", value: accent },
		];
	},
});
`;

describe("loadAuthoredAlgorithm", () => {
	it("runs an import-free Tier-2 source through the sandbox", async () => {
		const algo = await loadAuthoredAlgorithm(TIER2_SOURCE, { name: "mono" });
		const register = derive(algo, { constraints: { "--bg-0": "#0a0c10", "--accent": "#22c55e" } });
		expect(register["--bg-0"]).toBe("#0a0c10");
		expect(register["--accent"]).toBe("#22c55e");
		// the host `cuti` binding resolved a readable ink against the dark background
		expect(register["--fg-0"]).toBe("#ffffff");
	});

	it("exposes the authored produces + categories on the facade", async () => {
		const algo = await loadAuthoredAlgorithm(TIER2_SOURCE, { name: "mono" });
		expect(algo.produces).toEqual(["--bg-0", "--fg-0", "--accent"]);
		expect(algo.categories.color).toEqual(["--bg-0", "--fg-0", "--accent"]);
	});

	it("also runs a Tier-1 taste-vector source", async () => {
		const algo = await loadAuthoredAlgorithm(
			`defineXtyleAlgorithm({ id: "custom", anchors: { bg: "#12101a", accent: "#c084fc" }, vibrancy: 0.7 });`,
			{ name: "custom" },
		);
		const register = derive(algo, {});
		expect(register["--bg-0"]).toBeTruthy();
		expect(register["--accent"]).toBeTruthy();
	});

	it("exposes the engine's color helpers to a from-scratch source", async () => {
		// uses the prelude-exposed `oklch` / `formatCss` globals directly — no `cuti`, no imports
		const source = `
			defineAlgorithm({
				id: "helpers",
				produces: ["--bg-0", "--accent"],
				categories: { color: ["--bg-0", "--accent"] },
				knobs: [],
				derive(input) {
					const hue = (input.knobs && input.knobs.hue) || 250;
					return [
						{ name: "--bg-0", value: formatCss(oklch(0.18, 0.02, 260)) },
						{ name: "--accent", value: formatCss(oklch(0.7, 0.15, hue)) },
					];
				},
			});
		`;
		const algo = await loadAuthoredAlgorithm(source, { name: "helpers" });
		const register = derive(algo, { knobs: { hue: 30 } });
		expect(register["--bg-0"]).toMatch(/^#[0-9a-f]{6}$/);
		expect(register["--accent"]).toMatch(/^#[0-9a-f]{6}$/);
	});

	it("rejects a source with a syntax error", async () => {
		await expect(loadAuthoredAlgorithm("defineAlgorithm({ ")).rejects.toThrow();
	});
});
