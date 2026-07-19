#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import process from "node:process";
import { auditRegister } from "./audit.js";
import { coverage } from "./coverage.js";
import { derive } from "./index.js";
import { emit, emitters } from "./emit/index.js";
import { buildThemeFile, migratedTarget, serializeThemeFile } from "./theme-file.js";
import type { Algorithm, Knobs } from "./types.js";
import { validateKnobs } from "./knobs.js";
import { gauntlet, GAUNTLET_DEPTH_RUNS, resolveDepth } from "./gauntlet.js";
import { availableAlgorithms, defaultAlgorithm, resolveInstalledAlgorithm, HARNESS_TIMEOUT_MS } from "./host/registry.js";
import { algorithmDomains, bakedAlgorithm } from "./baked.js";
import { constraintsFrom } from "./constraints.js";
import type { EmitFormat } from "./types.js";

type CliFormat = EmitFormat | "theme";
type GauntletMode = "baked" | "hosted";

interface ParsedArgs {
	command: string;
	bg?: string;
	fg?: string;
	accent?: string;
	format: CliFormat;
	name?: string;
	out?: string;
	runs?: number;
	depth?: string;
	mode: GauntletMode;
	algorithm: string;
	overrides?: Record<string, string>;
	knobs?: Record<string, string>;
	scrollbars?: boolean;
}


function parse(argv: string[]): ParsedArgs {
	const args: ParsedArgs = {
		command: argv[0] ?? "help",
		format: "css",
		mode: "baked",
		algorithm: defaultAlgorithm(),
	};
	for (let i = 1; i < argv.length; i++) {
		const arg = argv[i];
		const next = argv[i + 1];
		switch (arg) {
			case "--bg":
				args.bg = next;
				i++;
				break;
			case "--fg":
				args.fg = next;
				i++;
				break;
			case "--accent":
				args.accent = next;
				i++;
				break;
			case "--set":
			case "--constraint": {
				const eq = next?.indexOf("=") ?? -1;
				if (next && eq > 0) {
					const rawKey = next.slice(0, eq).trim();
					const key = rawKey.startsWith("--") ? rawKey : `--${rawKey}`;
					(args.overrides ??= {})[key] = next.slice(eq + 1);
				} else if (next !== undefined) {
					process.stderr.write(`xtyle: ignoring malformed --set "${next}" (expected token=value)\n`);
				}
				i++;
				break;
			}
			case "--knob":
			case "-k": {
				const eq = next?.indexOf("=") ?? -1;
				if (next && eq > 0) {
					// Kept as the raw string the shell handed over. The value is coerced against the knob's
					// *declared* kind once the algorithm is known — guessing a type from the string's shape
					// here would read a `text` knob set to "12" as a number and a `select` set to "false" as
					// a boolean.
					(args.knobs ??= {})[next.slice(0, eq).trim()] = next.slice(eq + 1);
				} else if (next !== undefined) {
					process.stderr.write(`xtyle: ignoring malformed --knob "${next}" (expected name=value)\n`);
				}
				i++;
				break;
			}
			case "--format":
			case "-f":
				args.format = (next as CliFormat) ?? "css";
				i++;
				break;
			case "--no-scrollbars":
				args.scrollbars = false;
				break;
			case "--name":
				args.name = next;
				i++;
				break;
			case "--out":
			case "-o":
				args.out = next;
				i++;
				break;
			case "--runs":
				args.runs = Number.parseInt(next ?? "100", 10);
				i++;
				break;
			case "--depth":
				args.depth = next;
				i++;
				break;
			case "--mode":
				args.mode = next === "hosted" ? "hosted" : "baked";
				i++;
				break;
			case "--algorithm":
			case "-a":
				args.algorithm = next ?? defaultAlgorithm();
				i++;
				break;
		}
	}
	return args;
}

/** A gauntlet run loads a hosted mod under {@link HARNESS_TIMEOUT_MS}, not the production rail. */
function resolveForMode(id: string, mode: GauntletMode) {
	const { algorithm } = migratedTarget(id);
	return mode === "hosted" ? resolveInstalledAlgorithm(algorithm, { timeoutMs: HARNESS_TIMEOUT_MS }) : bakedAlgorithm(algorithm);
}

/**
 * The resolved algorithm a command derives with, and the knobs it derives under: the requested id
 * through the retirement migration, then the caller's `--knob`s checked and coerced against the domain
 * that algorithm declares. Validation has to happen here rather than at parse time, because the domain
 * belongs to the algorithm and is not known until it resolves.
 */
async function target(args: ParsedArgs): Promise<{ id: string; algorithm: Algorithm; knobs: Knobs }> {
	const migrated = migratedTarget(args.algorithm, args.knobs ?? {});
	const algorithm = await resolveInstalledAlgorithm(migrated.algorithm);
	return { id: migrated.algorithm, algorithm, knobs: validateKnobs(algorithm, migrated.knobs) };
}

function usage(): void {
	process.stdout.write(
		[
			"xtyle: themable-derivation engine",
			"",
			"usage:",
			"  xtyle derive [-a <algorithm>] [--bg <c>] [--fg <c>] [--accent <c>] [--knob <name>=<value>]... [--set <token>=<value>]... [--format css|json|theme|prism|monaco|terminal] [--no-scrollbars] [--name <s>] [--out <file>]",
			"  xtyle gauntlet [-a <algorithm>|all] [--mode baked|hosted] [--depth quick|standard|full] [--runs <n>]",
			"  xtyle coverage --consumed <a,b,c> [-a <algorithm>] [--bg <c>] [--accent <c>] [--knob <name>=<value>]... [--set <token>=<value>]...",
			"  xtyle audit [-a <algorithm>] [--bg <c>] [--accent <c>] [--knob <name>=<value>]... [--set <token>=<value>]... [--level AA|AAA] [--large-text]",
			"",
			"  --knob turns an algorithm's own dial (repeatable): --knob accentStrategy=duo --knob surfaceRamp=-0.05",
			"         `xtyle knobs` prints each algorithm's dials and the values they accept. Alias: -k.",
			"  --set  pins any token (repeatable): --set --accent-2=#7c3aed --set font-sans='Inter, sans-serif'",
			"         the leading -- is optional (--set radius-md=10px). Alias: --constraint.",
			"  xtyle list",
			"  xtyle knobs [-a <algorithm>]",
			"  xtyle mcp",
			"",
			`algorithms: ${availableAlgorithms().join(", ")}`,
			`emitters: ${emitters().join(", ")}`,
			"",
		].join("\n"),
	);
}

async function main(): Promise<void> {
	const argv = process.argv.slice(2);
	const args = parse(argv);

	if (args.command === "help" || args.command === "--help" || args.command === "-h") {
		usage();
		return;
	}

	if (args.command === "list") {
		for (const id of availableAlgorithms()) process.stdout.write(`${id}\n`);
		return;
	}

	if (args.command === "knobs") {
		const ids = argv.includes("-a") || argv.includes("--algorithm") ? [migratedTarget(args.algorithm).algorithm] : availableAlgorithms();
		const algorithms = await algorithmDomains(ids);
		process.stdout.write(`${JSON.stringify({ algorithms }, null, 2)}\n`);
		return;
	}

	if (args.command === "mcp") {
		if (argv.includes("--help") || argv.includes("-h")) {
			process.stdout.write(
				[
					"xtyle mcp: start the MCP server (stdio transport)",
					"",
					"Exposes the engine the CLI runs to MCP clients: tools for derive, coverage,",
					"audit, components, gauntlet, and list-algorithms, plus the concept docs and every",
					"component manifest as resources.",
					"",
					"Configure your client to run: xtyle mcp (or npx -y @xtyle/core xtyle mcp)",
					"",
				].join("\n"),
			);
			return;
		}
		const { createServer } = await import("./mcp/server.js");
		const { StdioServerTransport } = await import("@modelcontextprotocol/sdk/server/stdio.js");
		const version = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf-8")).version as string;
		await createServer(version).connect(new StdioServerTransport());
		return;
	}

	if (args.command === "derive") {
		const { id, algorithm, knobs } = await target(args);
		const constraints = constraintsFrom(args);
		const register = derive(algorithm, { constraints, knobs });
		const output =
			args.format === "theme"
				? serializeThemeFile(
						buildThemeFile({
							meta: { name: args.name ?? `${id} theme`, generator: "@xtyle/core" },
							recipe: { algorithm: id, knobs, overrides: constraints },
							register,
						}),
					)
				: emit(register, args.format, { scrollbars: args.scrollbars });
		if (args.out) {
			writeFileSync(args.out, output);
			process.stdout.write(`wrote ${Object.keys(register).length} tokens to ${args.out}\n`);
		} else {
			process.stdout.write(output);
		}
		return;
	}

	if (args.command === "gauntlet") {
		const depth = resolveDepth(args.depth);
		const runs = args.runs ?? GAUNTLET_DEPTH_RUNS[depth];
		const ids = args.algorithm === "all" ? availableAlgorithms() : [args.algorithm];
		const reports = [];
		for (const id of ids) {
			const algorithm = await resolveForMode(id, args.mode);
			reports.push(gauntlet(algorithm, { runs }));
		}
		const ok = reports.every((r) => r.ok);
		const out = ids.length === 1 ? { mode: args.mode, depth, runs, ...reports[0] } : { mode: args.mode, depth, runs, ok, reports };
		process.stdout.write(`${JSON.stringify(out, null, 2)}\n`);
		process.exitCode = ok ? 0 : 1;
		return;
	}

	if (args.command === "coverage") {
		const { algorithm, knobs } = await target(args);
		const consumedArg = argv[argv.indexOf("--consumed") + 1] ?? "";
		const consumed = consumedArg.split(",").map((s) => s.trim()).filter(Boolean);
		const register = derive(algorithm, { constraints: constraintsFrom(args), knobs });
		const result = coverage(consumed, register);
		process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
		process.exitCode = result.covered ? 0 : 1;
		return;
	}

	if (args.command === "audit") {
		const { algorithm, knobs } = await target(args);
		const register = derive(algorithm, { constraints: constraintsFrom(args), knobs });
		const levelIndex = argv.indexOf("--level");
		const level = levelIndex >= 0 && argv[levelIndex + 1] === "AAA" ? "AAA" : "AA";
		const result = auditRegister(register, { level, largeText: argv.includes("--large-text") });
		process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
		process.exitCode = result.passes ? 0 : 1;
		return;
	}

	usage();
	process.exitCode = 1;
}

main().catch((error) => {
	process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
	process.exitCode = 1;
});
