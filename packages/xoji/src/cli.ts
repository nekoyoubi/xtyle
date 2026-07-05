#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import process from "node:process";
import { auditRegister } from "./audit.js";
import { coverage } from "./coverage.js";
import { derive } from "./index.js";
import { emit, emitters } from "./emit/index.js";
import { buildThemeFile, serializeThemeFile } from "./theme-file.js";
import { gauntlet, GAUNTLET_DEPTH_RUNS, resolveDepth } from "./gauntlet.js";
import { availableAlgorithms, resolveAlgorithm } from "./host/registry.js";
import { bakedAlgorithm } from "./baked.js";
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
}

function parse(argv: string[]): ParsedArgs {
	const args: ParsedArgs = {
		command: argv[0] ?? "help",
		format: "css",
		mode: "baked",
		algorithm: "xoji-default",
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
					process.stderr.write(`xoji: ignoring malformed --set "${next}" (expected token=value)\n`);
				}
				i++;
				break;
			}
			case "--format":
			case "-f":
				args.format = (next as CliFormat) ?? "css";
				i++;
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
				args.algorithm = next ?? "xoji-default";
				i++;
				break;
		}
	}
	return args;
}

function resolveForMode(id: string, mode: GauntletMode) {
	return mode === "hosted" ? resolveAlgorithm(id) : bakedAlgorithm(id);
}

function usage(): void {
	process.stdout.write(
		[
			"xoji: themable-derivation engine",
			"",
			"usage:",
			"  xoji derive [-a <algorithm>] [--bg <c>] [--fg <c>] [--accent <c>] [--set <token>=<value>]... [--format css|json|theme|prism|monaco] [--name <s>] [--out <file>]",
			"  xoji gauntlet [-a <algorithm>|all] [--mode baked|hosted] [--depth quick|standard|full] [--runs <n>]",
			"  xoji coverage --consumed <a,b,c> [-a <algorithm>] [--bg <c>] [--accent <c>] [--set <token>=<value>]...",
			"  xoji audit [-a <algorithm>] [--bg <c>] [--accent <c>] [--set <token>=<value>]... [--level AA|AAA] [--large-text]",
			"",
			"  --set pins any token (repeatable): --set --accent-2=#7c3aed --set font-sans='Inter, sans-serif'",
			"        the leading -- is optional (--set radius-md=10px). Alias: --constraint.",
			"  xoji list",
			"  xoji mcp",
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

	if (args.command === "mcp") {
		if (argv.includes("--help") || argv.includes("-h")) {
			process.stdout.write(
				[
					"xoji mcp: start the MCP server (stdio transport)",
					"",
					"Exposes the engine the CLI runs to MCP clients: tools for derive, coverage,",
					"audit, components, gauntlet, and list-algorithms, plus the concept docs and every",
					"component manifest as resources.",
					"",
					"Configure your client to run: xoji mcp (or npx -y @xoji/core xoji mcp)",
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
		const algorithm = await resolveAlgorithm(args.algorithm);
		const constraints = constraintsFrom(args);
		const register = derive(algorithm, { constraints });
		const output =
			args.format === "theme"
				? serializeThemeFile(
						buildThemeFile({
							meta: { name: args.name ?? `${args.algorithm} theme`, generator: "@xoji/core" },
							recipe: { algorithm: args.algorithm, overrides: constraints },
							register,
						}),
					)
				: emit(register, args.format);
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
		const algorithm = await resolveAlgorithm(args.algorithm);
		const consumedArg = argv[argv.indexOf("--consumed") + 1] ?? "";
		const consumed = consumedArg.split(",").map((s) => s.trim()).filter(Boolean);
		const register = derive(algorithm, { constraints: constraintsFrom(args) });
		const result = coverage(consumed, register);
		process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
		process.exitCode = result.covered ? 0 : 1;
		return;
	}

	if (args.command === "audit") {
		const algorithm = await resolveAlgorithm(args.algorithm);
		const register = derive(algorithm, { constraints: constraintsFrom(args) });
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
