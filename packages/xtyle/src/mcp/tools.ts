import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { derive } from "../index.js";
import { auditRegister } from "../audit.js";
import { emit, emitters } from "../emit/index.js";
import { coverage, coverComponent, coverComponents } from "../coverage.js";
import { gauntlet, GAUNTLET_DEPTH_RUNS, resolveDepth } from "../gauntlet.js";
import { availableAlgorithms, defaultAlgorithm, resolveInstalledAlgorithm, HARNESS_TIMEOUT_MS } from "../host/registry.js";
import { listComponents, getComponent } from "../manifest/registry.js";
import { buildThemeFile, migratedTarget, serializeThemeFile } from "../theme-file.js";
import type { Algorithm, Knobs, TokenRegister } from "../types.js";
import { validateKnobs } from "../knobs.js";
import { algorithmDomains, bakedAlgorithm } from "../baked.js";
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

/**
 * The `knobs` input every deriving tool takes — an algorithm's own dials (`accentStrategy`,
 * `surfaceRamp`, a novel knob a third-party algorithm declares). Values stay loosely typed because
 * the *domain* is the algorithm's to state, not this schema's: `xtyle_list_algorithms` returns each
 * algorithm's `knobSpecs`, which is where an agent learns what a knob accepts.
 */
const knobsInput = z
	.record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
	.optional()
	.describe('Algorithm knobs, e.g. { "accentStrategy": "duo" } or { "surfaceRamp": -0.05 }. Call xtyle_list_algorithms for each algorithm\'s knobSpecs (the accepted names, kinds, and ranges).');

/**
 * The emit formats a tool accepts, built from the engine's own emitter set rather than a second copy
 * of it — so a newly-added emitter can't be advertised by `xtyle_list_algorithms` and then rejected
 * by `xtyle_derive`. `emitters()` is a runtime list, so the tuple `z.enum` wants is asserted here.
 */
export const formatInput = z.enum([...emitters(), "theme"] as unknown as [string, ...string[]]);

/**
 * The resolved algorithm a tool derives with, and the knobs it derives under: the id through
 * {@link migratedTarget}, then the caller's knobs checked against the domain that algorithm declares.
 * Every tool resolves through here rather than off a raw id — and an agent that invents a knob name or
 * a value outside the domain gets told so, instead of a theme that quietly isn't the one it asked for.
 */
async function resolveTarget(
	algorithm: string | undefined,
	knobs: Record<string, unknown> | undefined,
): Promise<{ id: string; algorithm: Algorithm; knobs: Knobs }> {
	const migrated = migratedTarget(algorithm ?? defaultAlgorithm(), knobs ?? {});
	const resolved = await resolveInstalledAlgorithm(migrated.algorithm);
	return { id: migrated.algorithm, algorithm: resolved, knobs: validateKnobs(resolved, migrated.knobs) };
}

export function registerTools(server: McpServer, buildInfo: ServerBuildInfo): void {
	const register = server.registerTool.bind(server) as unknown as RegisterTool;

	register(
		"xtyle_server_info",
		{
			title: "Report this server's build identity",
			description:
				"Return the running xtyle MCP server's name, version, and build timestamp. If `builtAt` predates a change you made in the xtyle repo, the running server is stale, so rebuild and reconnect before trusting its results.",
			inputSchema: {},
		},
		async () => json({ ...buildInfo, runtime: `node ${process.version}` }),
	);

	register(
		"xtyle_list_algorithms",
		{
			title: "List algorithms, their knobs, and emit formats",
			description:
				"List the algorithms that derive a theme — each with the `knobs` it reads and the `knobSpecs` declaring what those knobs accept (kind, range, options, default) — plus the emit formats the engine can serialize a register into. Read this before passing `knobs` to any other tool: the algorithm owns its knob domain, so this is the only place the accepted values are stated. `accentStrategy` is the one that reshapes the accent family (`fan` / `step` / `shade` / `duo`); a novel knob a third-party algorithm declares shows up here the same way a blessed one does.",
			inputSchema: {},
		},
		async () => {
			const algorithms = await algorithmDomains(availableAlgorithms());
			return json({ algorithms, formats: [...emitters(), "theme"] });
		},
	);

	register(
		"xtyle_derive",
		{
			title: "Derive a theme",
			description:
				"Run an algorithm over a set of constraints and emit the resulting token register. Pass seed colors as `bg`/`fg`/`accent`, turn the algorithm's own dials via `knobs` (the casual path — `accentStrategy: \"duo\"` for a two-brand theme), or pin any token directly via `overrides` (the escape hatch). Reach for `knobs` before `overrides`: hand-pinning `--accent-2/3/4` to fake an accent family is what `accentStrategy` exists to spare you. The algorithm runs through xript's sandbox, the canonical derivation path.",
			inputSchema: {
				algorithm: z.string().optional().describe("Algorithm id. Defaults to xtyle-default. Use xtyle_list_algorithms to see the set."),
				bg: z.string().optional().describe("Background seed color, the `--bg-0` constraint (any CSS color)."),
				fg: z.string().optional().describe("Foreground seed color, the `--fg-0` constraint."),
				accent: z.string().optional().describe("Accent seed color, the `--accent` constraint."),
				knobs: knobsInput,
				overrides: z.record(z.string(), z.string()).optional().describe("Pin any token directly, e.g. { \"--radius-md\": \"6px\" }. Merged under the seed colors."),
				format: formatInput.optional().describe("Emit format. Defaults to css."),
				name: z.string().optional().describe("Theme name, used only by the `theme` format."),
			},
		},
		async ({ algorithm, bg, fg, accent, knobs, overrides, format, name }) => {
			try {
				const target = await resolveTarget(algorithm, knobs);
				const resolved = target.algorithm;
				const constraints = constraintsFrom({ bg, fg, accent, overrides });
				const register = derive(resolved, { constraints, knobs: target.knobs });
				const fmt = format ?? "css";
				if (fmt === "theme") {
					return text(
						serializeThemeFile(
							buildThemeFile({
								meta: { name: name ?? `${target.id} theme`, generator: "@xtyle/core" },
								recipe: { algorithm: target.id, knobs: target.knobs, overrides: constraints },
								register,
							}),
						),
					);
				}
				return text(emit(register, fmt as Parameters<typeof emit>[1]));
			} catch (error) {
				return text(error instanceof Error ? error.message : String(error), true);
			}
		},
	);

	register(
		"xtyle_coverage",
		{
			title: "Check token coverage",
			description:
				"Derive a register and check that it covers the tokens a component consumes. Pass `component` to check one component's manifest, `consumed` to check an explicit token list, or neither to check every shipped component and report the gaps.",
			inputSchema: {
				algorithm: z.string().optional().describe("Algorithm id. Defaults to xtyle-default."),
				bg: z.string().optional().describe("Background seed color."),
				fg: z.string().optional().describe("Foreground seed color."),
				accent: z.string().optional().describe("Accent seed color."),
				knobs: knobsInput,
				overrides: z.record(z.string(), z.string()).optional().describe("Pin tokens directly before checking."),
				component: z.string().optional().describe("A component id to check against its declared consumedTokens."),
				consumed: z.array(z.string()).optional().describe("An explicit list of token names to check."),
			},
		},
		async ({ algorithm, bg, fg, accent, knobs, overrides, component, consumed }) => {
			try {
				const target = await resolveTarget(algorithm, knobs);
				const resolved = target.algorithm;
				const register = derive(resolved, { constraints: constraintsFrom({ bg, fg, accent, overrides }), knobs: target.knobs });
				if (component) {
					const manifest = getComponent(component);
					if (!manifest) return text(`unknown component: ${component}`, true);
					return json({ algorithm: target.id, component, ...coverComponent(manifest, register) });
				}
				if (consumed) return json({ algorithm: target.id, ...coverage(consumed, register) });
				const all = coverComponents(register);
				return json({ algorithm: target.id, covered: all.every((c) => c.covered), components: all });
			} catch (error) {
				return text(error instanceof Error ? error.message : String(error), true);
			}
		},
	);

	register(
		"xtyle_components",
		{
			title: "List or describe components",
			description:
				"Without an id, list every shipped component (id, name, category, summary, keywords, seeAlso, bindings). With an id, return that component's full manifest: props, variants, states, slots, consumedTokens, accessibility, and examples. Reach for this first when building against xtyle so token names and prop shapes come from the manifest, not a guess. `keywords` are capability synonyms (a searcher's words, not the component's own name) and `seeAlso` cross-references overlapping components, so scan them to find the right component by what it does — e.g. `meter`/`gauge` lands on `progress`, `dropdown` on `select`, `modal` on `dialog`.",
			inputSchema: {
				id: z.string().optional().describe("A component id. Omit to list all components."),
			},
		},
		async ({ id }) => {
			if (!id) {
				return json(
					listComponents().map((c) => ({
						id: c.id,
						name: c.name,
						category: c.category,
						summary: c.summary,
						keywords: c.keywords ?? [],
						seeAlso: c.seeAlso ?? [],
						bindings: c.bindings,
					})),
				);
			}
			const manifest = getComponent(id);
			if (!manifest) return text(`unknown component: ${id}`, true);
			return json(manifest);
		},
	);

	register(
		"xtyle_gauntlet",
		{
			title: "Run the gauntlet",
			description:
				"Prove an algorithm's invariants hold across randomized inputs. Pass `all` to sweep every algorithm. The gauntlet proves a theme is safe (contrast holds, no NaN), not that it looks good.",
			inputSchema: {
				algorithm: z.string().optional().describe("Algorithm id, or `all`. Defaults to xtyle-default."),
				mode: z.enum(["baked", "hosted"]).optional().describe("Run the baked build or the sandboxed mod. Defaults to baked."),
				depth: z.enum(["quick", "standard", "full"]).optional().describe("Run count preset. Defaults to standard."),
				runs: z.number().int().positive().optional().describe("Explicit run count, overriding depth."),
			},
		},
		async ({ algorithm, mode, depth, runs }) => {
			const id = algorithm ?? defaultAlgorithm();
			const resolvedDepth = resolveDepth(depth);
			const runCount = runs ?? GAUNTLET_DEPTH_RUNS[resolvedDepth];
			const resolvedMode = mode ?? "baked";
			try {
				const ids = id === "all" ? availableAlgorithms() : [migratedTarget(id).algorithm];
				const reports = [];
				for (const algId of ids) {
					const resolved =
						resolvedMode === "hosted"
							? await resolveInstalledAlgorithm(algId, { timeoutMs: HARNESS_TIMEOUT_MS })
							: await bakedAlgorithm(algId);
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
		"xtyle_audit",
		{
			title: "Audit a theme's contrast",
			description:
				"Grade a derived register against xtyle's canonical text/fill pairs (body tiers, link, and every semantic tone's readable-on-base and text-on-fill variants) at the WCAG floors, returning a per-pair AAA/AA/fail tier plus tallies. The register-level complement to the gauntlet: the gauntlet proves an algorithm is safe across random seeds, this reports a specific theme's contrast.",
			inputSchema: {
				algorithm: z.string().optional().describe("Algorithm id. Defaults to xtyle-default."),
				bg: z.string().optional().describe("Background seed color."),
				fg: z.string().optional().describe("Foreground seed color."),
				accent: z.string().optional().describe("Accent seed color."),
				knobs: knobsInput,
				overrides: z.record(z.string(), z.string()).optional().describe("Pin tokens directly before auditing."),
				level: z.enum(["AA", "AAA"]).optional().describe("The floor a pair must clear to pass. Defaults to AA."),
				largeText: z.boolean().optional().describe("Grade against the large-text WCAG floors (AA 3.0 / AAA 4.5)."),
			},
		},
		async ({ algorithm, bg, fg, accent, knobs, overrides, level, largeText }) => {
			try {
				const target = await resolveTarget(algorithm, knobs);
				const resolved = target.algorithm;
				const register = derive(resolved, { constraints: constraintsFrom({ bg, fg, accent, overrides }), knobs: target.knobs });
				const result = auditRegister(register, { level, largeText });
				return json({ algorithm: target.id, ...result }, !result.passes);
			} catch (error) {
				return text(error instanceof Error ? error.message : String(error), true);
			}
		},
	);
}
