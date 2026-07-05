import { describe, expect, it } from "vitest";
import {
	derive,
	resolveGraph,
	type Algorithm,
	type DeriveOptions,
	type TokenLineageNode,
} from "../src/index.js";
import { xojiDefault, xojiHc, xojiLoud, xojiQuiet } from "../src/batteries.js";

const SET = [xojiDefault, xojiHc, xojiQuiet, xojiLoud];

const OPTS: Array<{ label: string; opts: DeriveOptions }> = [
	{ label: "defaults", opts: {} },
	{ label: "dark-blue", opts: { constraints: { "--bg-0": "#0f1115", "--fg-0": "#e8eaed", "--accent": "#5b8cff" } } },
	{ label: "light-warm", opts: { constraints: { "--bg-0": "#fbf7f0", "--fg-0": "#241b14", "--accent": "#c2410c" } } },
	{ label: "scheme-light-aaa", opts: { knobs: { scheme: "light", contrastBand: "aaa", vibrancy: 1 } } },
	{ label: "knob-sweep", opts: { knobs: { density: "comfortable", typeScale: 1.25, radiusScale: 2, accentShiftStep: 45 } } },
	{ label: "pin-accent", opts: { constraints: { "--accent": "#16a34a" } } },
	{ label: "pin-bg0", opts: { constraints: { "--bg-0": "#202024" } } },
	{ label: "pin-bg0-mid", opts: { constraints: { "--bg-0": "#959595" } } },
	{ label: "pin-fg0", opts: { constraints: { "--fg-0": "#fafafa" } } },
	{ label: "pin-multi", opts: { constraints: { "--bg-0": "#1a1a2e", "--accent": "#f59e0b" } } },
];

function nodeNames(nodes: TokenLineageNode[]): Set<string> {
	return new Set(nodes.map((n) => n.name));
}

describe.each(SET.map((a) => [a.id, a] as const))("graph(%s)", (_id, algorithm: Algorithm) => {
	it("node-name set equals PRODUCES plus --scheme (no extra, none missing)", () => {
		const nodes = algorithm.lineage();
		const names = nodeNames(nodes);
		expect(names.has("--scheme")).toBe(true);
		for (const produced of algorithm.produces) {
			expect(names.has(produced), `node missing for ${produced}`).toBe(true);
		}
		const expected = new Set<string>(["--scheme", ...algorithm.produces]);
		for (const name of names) {
			expect(expected.has(name), `unexpected node ${name}`).toBe(true);
		}
		expect(names.size).toBe(expected.size);
	});

	it("declares no duplicate node names", () => {
		const nodes = algorithm.lineage();
		expect(nodes.length).toBe(nodeNames(nodes).size);
	});

	it("every refs entry resolves to a declared node or a pinned input", () => {
		for (const { label, opts } of OPTS) {
			const nodes = algorithm.lineage(opts);
			const names = nodeNames(nodes);
			const pins = new Set(Object.keys(opts.constraints ?? {}));
			for (const node of nodes) {
				for (const ref of node.refs ?? []) {
					const known = names.has(ref) || pins.has(ref);
					expect(known, `${label}: ${node.name} refs unknown ${ref}`).toBe(true);
					expect(ref, `${label}: ${node.name} self-references`).not.toBe(node.name);
				}
			}
		}
	});

	it("resolveGraph(lineage(opts)) deep-equals derive(opts)", () => {
		for (const { label, opts } of OPTS) {
			const fromGraph = resolveGraph(algorithm.lineage(opts));
			const fromDerive = derive(algorithm, opts);
			expect(fromGraph, `${label}: graph register diverged from derive`).toEqual(fromDerive);
		}
	});

	it("lineage nodes carry no closures (serializable lineage data)", () => {
		const json = JSON.stringify(algorithm.lineage());
		const round = JSON.parse(json) as TokenLineageNode[];
		expect(round.length).toBe(algorithm.lineage().length);
	});

	it("pinned tokens enter as ref-less value nodes (input, not derived)", () => {
		const nodes = algorithm.lineage({ constraints: { "--bg-0": "#202024", "--accent": "#f59e0b" } });
		for (const name of ["--bg-0", "--accent"]) {
			const node = nodes.find((n) => n.name === name);
			expect(node, `${name} node present`).toBeDefined();
			expect(node?.value).toBe(name === "--bg-0" ? "#202024" : "#f59e0b");
			expect(node?.refs ?? []).toEqual([]);
		}
	});

	it("declares an honest split-complement accent fan: 2/3/4 all flank the accent, none chains off another", () => {
		const nodes = algorithm.lineage();
		const refsOf = (name: string) => nodes.find((n) => n.name === name)?.refs ?? [];
		// each of 2/3/4 derives off the primary accent (flanks + complement), so the fan can't claim a
		// wheel-style chain (4 <- 3 <- 2) it never computes
		expect(refsOf("--accent-2")).toEqual(["--accent"]);
		expect(refsOf("--accent-3")).toEqual(["--accent"]);
		expect(refsOf("--accent-4")).toEqual(["--accent"]);
	});

	it("pulls the mirror flank into the lineage when a wing is pinned, keeping 4 the accent's complement", () => {
		const nodes = algorithm.lineage({ constraints: { "--accent-2": "#22c55e" } });
		const refsOf = (name: string) => nodes.find((n) => n.name === name)?.refs ?? [];
		// the pinned wing is a ref-less input; its mirror (3) now honestly reads it; 4 is untouched
		expect(refsOf("--accent-2")).toEqual([]);
		expect(refsOf("--accent-3")).toContain("--accent-2");
		expect(refsOf("--accent-4")).toEqual(["--accent"]);
	});
});
