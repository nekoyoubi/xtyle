import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { derive, listEffects, listConditions, effectsCss, EFFECT_TOKENS } from "../index.js";
import { iconPrimitiveRoster, iconComposition, composeIcon } from "../index.js";
import { PALETTES } from "../series.js";
import { ICON_GRAMMAR } from "./icon-grammar.js";
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
import { existedAt, resolveAsOf, VERSION_INPUT_DESCRIPTION } from "./as-of.js";

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

// HACK: the SDK's generic `registerTool` infers its callback from the Zod shape, which blows
// TypeScript's instantiation depth (TS2589) on the larger schemas; one concrete signature avoids it.
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

/** The spec-string grammar an agent needs to write a valid `data-fx`, stated once so the effects tool
 * hands over the rules rather than making the agent infer them from the catalog. */
const EFFECT_SYNTAX = {
	spec: "{effect}[@{condition}][?{key}:{value},{key}:{value}…]",
	attribute: "data-fx",
	notes: [
		"Write the spec in a `data-fx` attribute; the layer is plain attribute-selector CSS and needs no runtime.",
		"No condition means ambient (always on). Space-separate multiple specs on one element.",
		"Parameters are named, not positional: after a `?`, comma-separated, any subset in any order.",
		"A bracketed list fans out to a related group — `colors:[accent,accent-2]` fills `color` and `color-alt`.",
		"A value is a hex (`#fff`), a bare number that takes the param's unit (`315`→`315deg`, `3`→`3s`), or a token name resolved to `var(--name)` so it stays theme-reactive (`accent2`→`--accent-2`).",
		"Intensity derives from the shared `--fx-*` tokens, so it is the algorithm's policy (`xtyle-hc` zeros `--fx-intensity` and flattens the layer).",
	],
	examples: ["throb", "glow@hover", "glare@hover lift@active", "throb?rate:3s,colors:[accent,accent-2]", "glow@hover?spread:18"],
};

const FX_TOKEN_ROLES: Record<string, string> = {
	"--fx-intensity": "the algorithm's taste; 0 disables the whole layer",
	"--fx-color": "the effect's primary color (derives from --accent)",
	"--fx-color-alt": "the second hue a throb travels toward (derives from --accent-2)",
	"--fx-duration": "the base timing (derives from --duration-base)",
	"--fx-ease": "the base easing (derives from --ease-standard)",
};

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
				"Return the running xtyle MCP server's name, version, build timestamp, and — the part that matters when you are building against a pinned dependency — **which version of xtyle this surface answers for**. If `builtAt` predates a change you made in the xtyle repo, the running server is stale, so rebuild and reconnect before trusting its results. `versionPinning` lists the tools that accept a `version` argument and the ones that cannot: a catalog can be answered as of an older version, but anything that *runs* the engine (derive, gauntlet, audit, coverage) executes this build and cannot be rewound.",
			inputSchema: {},
		},
		async () =>
			json({
				...buildInfo,
				runtime: `node ${process.version}`,
				speaks: buildInfo.version,
				versionPinning: {
					accepts: ["xtyle_components", "xtyle_effects", "xtyle_icons"],
					alwaysHead: ["xtyle_derive", "xtyle_coverage", "xtyle_gauntlet", "xtyle_audit", "xtyle_list_algorithms"],
					note: "Catalog answers can be pinned with `version`; tools that execute the engine always run this build. Pinned answers carry an `asOf` envelope naming the version they describe and an `omitted` count for what was filtered out.",
				},
			}),
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
				version: z.string().optional().describe(VERSION_INPUT_DESCRIPTION),
			},
		},
		async ({ id, version }) => {
			const asOf = resolveAsOf(version, buildInfo.version);
			const all = listComponents();
			const available = all.filter((c) => existedAt(c.since, asOf.asOf));
			const omitted = all.length - available.length;

			if (!id) {
				return json({
					...asOf,
					omitted,
					count: available.length,
					components: available.map((c) => ({
						id: c.id,
						name: c.name,
						category: c.category,
						since: c.since,
						summary: c.summary,
						keywords: c.keywords ?? [],
						seeAlso: c.seeAlso ?? [],
						bindings: c.bindings,
					})),
				});
			}

			const manifest = getComponent(id);
			if (!manifest) return text(`unknown component: ${id}`, true);
			if (!existedAt(manifest.since, asOf.asOf)) {
				return json(
					{
						...asOf,
						error: `"${id}" was introduced in ${manifest.since}, which is newer than ${asOf.asOf}`,
						since: manifest.since,
						hint: `Upgrade xtyle to ${manifest.since} or later to use it, or omit \`version\` to see the current catalog.`,
					},
					true,
				);
			}
			return json({ ...asOf, component: manifest });
		},
	);

	register(
		"xtyle_effects",
		{
			title: "List or describe effects and their spec grammar",
			description:
				"Effects are xtyle's third kind: a token is a value, a component is a thing, an **effect** is a *verb* — a behavior applied to any element under a condition through a `data-fx` spec string. Without an `effect`, return the whole catalog: every effect (its params, whether it animates, whether it is ambient), every condition, the shared `--fx-*` tokens, and the spec-string grammar with examples — everything needed to write a valid `data-fx`. Pass `effect` to detail one. Pass `format: \"css\"` to emit the effect-layer stylesheet (the full effects × conditions cross product), the artifact you drop next to a derived theme: it needs no runtime and suppresses motion under `prefers-reduced-motion` for free.",
			inputSchema: {
				effect: z.string().optional().describe("An effect name to describe in detail (e.g. `glow`). Omit to list the whole catalog."),
				format: z.enum(["json", "css"]).optional().describe("`json` (default) returns the catalog; `css` emits the effect-layer stylesheet."),
				version: z.string().optional().describe(VERSION_INPUT_DESCRIPTION),
			},
		},
		({ effect, format, version }) => {
			if ((format ?? "json") === "css") return text(effectsCss());
			const asOf = resolveAsOf(version, buildInfo.version);
			const conditions = listConditions()
				.filter((c) => existedAt(c.since, asOf.asOf))
				.map((c) => ({ name: c.name, selector: c.selector, since: c.since }));
			const shape = (e: ReturnType<typeof listEffects>[number]) => ({
				name: e.name,
				description: e.description,
				tags: e.tags ?? [],
				animated: e.animated ?? false,
				ambient: e.ambient !== false,
				since: e.since,
				params: (e.params ?? []).map((p) => ({ name: p.name, unit: p.unit, expands: p.expands })),
				example: e.ambient === false || e.animated ? e.name : `${e.name}@hover`,
			});
			if (effect) {
				const def = listEffects().find((e) => e.name === effect);
				if (!def) return text(`unknown effect: ${effect}`, true);
				if (!existedAt(def.since, asOf.asOf)) {
					return json(
						{ ...asOf, error: `"${effect}" was introduced in ${def.since}, which is newer than ${asOf.asOf}`, since: def.since },
						true,
					);
				}
				return json({ ...asOf, effect: shape(def), conditions, syntax: EFFECT_SYNTAX });
			}
			return json({
				...asOf,
				syntax: EFFECT_SYNTAX,
				tokens: EFFECT_TOKENS.map((name) => ({ name, role: FX_TOKEN_ROLES[name] })),
				effects: listEffects()
					.filter((e) => existedAt(e.since, asOf.asOf))
					.map(shape),
				conditions,
				registration: "Last-wins on the name: registerEffect / registerCondition replace a name or extend the set, built-ins first, so an addon re-points one effect without restating the rest.",
			});
		},
	);

	register(
		"xtyle_icons",
		{
			title: "Speak the icon-name grammar: roster, rules, and render",
			description:
				"An icon name is its own spec — a short name is a known glyph, a longer name (`badge--circle-c2--star-s55-cf`) is a terse description of a mark composed to SVG on the fly. Without arguments, return everything needed to write one fluently: the full grammar (spec structure, object flags, the color-nibble palette, finish flags, the render model), the primitive roster (every primitive with its grammar keywords, aliases, family, description, and tags), the series palettes, and worked examples. Pass `primitive` to detail one primitive. Pass `name` to **compose that spec to SVG** and see the mark it produces — the fastest way to check a name renders what you meant.",
			inputSchema: {
				name: z.string().optional().describe("A full icon name/spec to compose to SVG, e.g. `database--cylinder-c1--disc-y-25-c3`. Returns the rendered SVG."),
				primitive: z.string().optional().describe("A primitive keyword or library name to detail, e.g. `cylinder`. Omit both to get the full grammar and roster."),
				version: z.string().optional().describe(VERSION_INPUT_DESCRIPTION),
			},
		},
		({ name, primitive, version }) => {
			if (name) {
				try {
					return text(composeIcon(iconComposition(name)));
				} catch (error) {
					return text(error instanceof Error ? error.message : String(error), true);
				}
			}
			const asOf = resolveAsOf(version, buildInfo.version);
			const roster = iconPrimitiveRoster().filter((p) => existedAt(p.since, asOf.asOf));
			if (primitive) {
				const entry =
					roster.find((p) => p.keywords.includes(primitive)) ?? roster.find((p) => p.library === primitive);
				if (!entry) return text(`unknown primitive: ${primitive}`, true);
				const [keyword] = entry.keywords;
				return json({
					...asOf,
					primitive: entry,
					example: keyword ? `mark--${keyword}-c1` : `mark--${entry.library}-c1`,
				});
			}
			return json({
				...asOf,
				grammar: ICON_GRAMMAR,
				palettes: PALETTES,
				primitiveCount: roster.length,
				primitives: roster,
			});
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
