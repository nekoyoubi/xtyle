import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { derive } from "../index.js";
import { auditRegister } from "../audit.js";
import { emit, emitters } from "../emit/index.js";
import { coverage, coverComponent, coverComponents } from "../coverage.js";
import { gauntlet, GAUNTLET_DEPTH_RUNS, resolveDepth } from "../gauntlet.js";
import { availableAlgorithms, resolveAlgorithm } from "../host/registry.js";
import { listComponents, getComponent } from "../manifest/registry.js";
import { buildThemeFile, serializeThemeFile } from "../theme-file.js";
import type { TokenRegister } from "../types.js";
import { bakedAlgorithm } from "../baked.js";
import { constraintsFrom } from "../constraints.js";
import type { ServerBuildInfo } from "./server.js";

interface ToolResult {
	[key: string]: unknown;
	content: Array<{ type: "text"; text: string }>;
	isError?: boolean;
}

function text(value: string, isError = false): ToolResult {
	return { content: [{ type: "text", text: value }], isError };
}

function json(value: unknown, isError = false): ToolResult {
	return text(JSON.stringify(value, null, 2), isError);
}

// The SDK's generic `registerTool` infers a per-tool callback type from the Zod
// shape; on the larger schemas that inference exceeds TypeScript's instantiation
// depth (TS2589). Adapting it to one concrete signature sidesteps the generic
// while leaving runtime validation, which is driven by the real shape, intact.
type ToolHandler = (args: Record<string, any>) => ToolResult | Promise<ToolResult>;
type RegisterTool = (name: string, config: { title: string; description: string; inputSchema: z.ZodRawShape }, cb: ToolHandler) => void;

export function registerTools(server: McpServer, buildInfo: ServerBuildInfo): void {
	const register = server.registerTool.bind(server) as unknown as RegisterTool;

	register(
		"xoji_server_info",
		{
			title: "Report this server's build identity",
			description:
				"Return the running xoji MCP server's name, version, and build timestamp. If `builtAt` predates a change you made in the xoji repo, the running server is stale, so rebuild and reconnect before trusting its results.",
			inputSchema: {},
		},
		async () => json({ ...buildInfo, runtime: `node ${process.version}` }),
	);

	register(
		"xoji_list_algorithms",
		{
			title: "List algorithms and emit formats",
			description: "List the algorithm ids that derive a theme and the emit formats the engine can serialize a register into.",
			inputSchema: {},
		},
		async () => json({ algorithms: availableAlgorithms(), formats: [...emitters(), "theme"] }),
	);

	register(
		"xoji_derive",
		{
			title: "Derive a theme",
			description:
				"Run an algorithm over a set of constraints and emit the resulting token register. Pass seed colors as `bg`/`fg`/`accent`, or pin any token directly via `overrides`. The algorithm runs through xript's sandbox, the canonical derivation path.",
			inputSchema: {
				algorithm: z.string().optional().describe("Algorithm id. Defaults to xoji-default. Use xoji_list_algorithms to see the set."),
				bg: z.string().optional().describe("Background seed color, the `--bg-0` constraint (any CSS color)."),
				fg: z.string().optional().describe("Foreground seed color, the `--fg-0` constraint."),
				accent: z.string().optional().describe("Accent seed color, the `--accent` constraint."),
				overrides: z.record(z.string(), z.string()).optional().describe("Pin any token directly, e.g. { \"--radius-md\": \"6px\" }. Merged under the seed colors."),
				format: z.enum(["css", "json", "theme", "prism", "monaco"]).optional().describe("Emit format. Defaults to css."),
				name: z.string().optional().describe("Theme name, used only by the `theme` format."),
			},
		},
		async ({ algorithm, bg, fg, accent, overrides, format, name }) => {
			const id = algorithm ?? "xoji-default";
			try {
				const resolved = await resolveAlgorithm(id);
				const constraints = constraintsFrom({ bg, fg, accent, overrides });
				const register = derive(resolved, { constraints });
				const fmt = format ?? "css";
				if (fmt === "theme") {
					return text(
						serializeThemeFile(
							buildThemeFile({
								meta: { name: name ?? `${id} theme`, generator: "@xoji/core" },
								recipe: { algorithm: id, overrides: constraints },
								register,
							}),
						),
					);
				}
				return text(emit(register, fmt));
			} catch (error) {
				return text(error instanceof Error ? error.message : String(error), true);
			}
		},
	);

	register(
		"xoji_coverage",
		{
			title: "Check token coverage",
			description:
				"Derive a register and check that it covers the tokens a component consumes. Pass `component` to check one component's manifest, `consumed` to check an explicit token list, or neither to check every shipped component and report the gaps.",
			inputSchema: {
				algorithm: z.string().optional().describe("Algorithm id. Defaults to xoji-default."),
				bg: z.string().optional().describe("Background seed color."),
				fg: z.string().optional().describe("Foreground seed color."),
				accent: z.string().optional().describe("Accent seed color."),
				overrides: z.record(z.string(), z.string()).optional().describe("Pin tokens directly before checking."),
				component: z.string().optional().describe("A component id to check against its declared consumedTokens."),
				consumed: z.array(z.string()).optional().describe("An explicit list of token names to check."),
			},
		},
		async ({ algorithm, bg, fg, accent, overrides, component, consumed }) => {
			const id = algorithm ?? "xoji-default";
			try {
				const resolved = await resolveAlgorithm(id);
				const register = derive(resolved, { constraints: constraintsFrom({ bg, fg, accent, overrides }) });
				if (component) {
					const manifest = getComponent(component);
					if (!manifest) return text(`unknown component: ${component}`, true);
					return json({ algorithm: id, component, ...coverComponent(manifest, register) });
				}
				if (consumed) return json({ algorithm: id, ...coverage(consumed, register) });
				const all = coverComponents(register);
				return json({ algorithm: id, covered: all.every((c) => c.covered), components: all });
			} catch (error) {
				return text(error instanceof Error ? error.message : String(error), true);
			}
		},
	);

	register(
		"xoji_components",
		{
			title: "List or describe components",
			description:
				"Without an id, list every shipped component (id, name, category, summary, bindings). With an id, return that component's full manifest: props, variants, states, slots, consumedTokens, accessibility, and examples. Reach for this first when building against xoji so token names and prop shapes come from the manifest, not a guess.",
			inputSchema: {
				id: z.string().optional().describe("A component id. Omit to list all components."),
			},
		},
		async ({ id }) => {
			if (!id) {
				return json(
					listComponents().map((c) => ({ id: c.id, name: c.name, category: c.category, summary: c.summary, bindings: c.bindings })),
				);
			}
			const manifest = getComponent(id);
			if (!manifest) return text(`unknown component: ${id}`, true);
			return json(manifest);
		},
	);

	register(
		"xoji_gauntlet",
		{
			title: "Run the gauntlet",
			description:
				"Prove an algorithm's invariants hold across randomized inputs. Pass `all` to sweep every algorithm. The gauntlet proves a theme is safe (contrast holds, no NaN), not that it looks good.",
			inputSchema: {
				algorithm: z.string().optional().describe("Algorithm id, or `all`. Defaults to xoji-default."),
				mode: z.enum(["baked", "hosted"]).optional().describe("Run the baked build or the sandboxed mod. Defaults to baked."),
				depth: z.enum(["quick", "standard", "full"]).optional().describe("Run count preset. Defaults to standard."),
				runs: z.number().int().positive().optional().describe("Explicit run count, overriding depth."),
			},
		},
		async ({ algorithm, mode, depth, runs }) => {
			const id = algorithm ?? "xoji-default";
			const resolvedDepth = resolveDepth(depth);
			const runCount = runs ?? GAUNTLET_DEPTH_RUNS[resolvedDepth];
			const resolvedMode = mode ?? "baked";
			try {
				const ids = id === "all" ? availableAlgorithms() : [id];
				const reports = [];
				for (const algId of ids) {
					const resolved = resolvedMode === "hosted" ? await resolveAlgorithm(algId) : await bakedAlgorithm(algId);
					reports.push({ ...gauntlet(resolved, { runs: runCount }), algorithm: algId });
				}
				const ok = reports.every((r) => r.ok);
				return json({ mode: resolvedMode, depth: resolvedDepth, runs: runCount, ok, reports }, !ok);
			} catch (error) {
				return text(error instanceof Error ? error.message : String(error), true);
			}
		},
	);

	register(
		"xoji_audit",
		{
			title: "Audit a theme's contrast",
			description:
				"Grade a derived register against xoji's canonical text/fill pairs (body tiers, link, and every semantic tone's readable-on-base and text-on-fill variants) at the WCAG floors, returning a per-pair AAA/AA/fail tier plus tallies. The register-level complement to the gauntlet: the gauntlet proves an algorithm is safe across random seeds, this reports a specific theme's contrast.",
			inputSchema: {
				algorithm: z.string().optional().describe("Algorithm id. Defaults to xoji-default."),
				bg: z.string().optional().describe("Background seed color."),
				fg: z.string().optional().describe("Foreground seed color."),
				accent: z.string().optional().describe("Accent seed color."),
				overrides: z.record(z.string(), z.string()).optional().describe("Pin tokens directly before auditing."),
				level: z.enum(["AA", "AAA"]).optional().describe("The floor a pair must clear to pass. Defaults to AA."),
				largeText: z.boolean().optional().describe("Grade against the large-text WCAG floors (AA 3.0 / AAA 4.5)."),
			},
		},
		async ({ algorithm, bg, fg, accent, overrides, level, largeText }) => {
			const id = algorithm ?? "xoji-default";
			try {
				const resolved = await resolveAlgorithm(id);
				const register = derive(resolved, { constraints: constraintsFrom({ bg, fg, accent, overrides }) });
				const result = auditRegister(register, { level, largeText });
				return json({ algorithm: id, ...result }, !result.passes);
			} catch (error) {
				return text(error instanceof Error ? error.message : String(error), true);
			}
		},
	);
}
