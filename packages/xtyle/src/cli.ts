#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import {
	auditRegister,
	PALETTE_HUE_ROLES,
	type ContrastAudit,
	type ContrastAuditOptions,
	type RoleSeparationEntry,
} from "./audit.js";
import { coverage } from "./coverage.js";
import { derive, invertedOptions } from "./index.js";
import { emit, emitters } from "./emit/index.js";
import { buildThemeFile, migrateRecipe, migratedTarget, serializeThemeFile } from "./theme-file.js";
import type { Algorithm, Knobs, Scheme } from "./types.js";
import { validateKnobs } from "./knobs.js";
import { gauntlet, GAUNTLET_DEPTH_RUNS, resolveDepth } from "./gauntlet.js";
import { packSearchQuery, searchPacks } from "./discovery.js";
import { packEntries, packInstallSpec, parsePackRef, selectPackEntry, PACK_MANIFEST_FIELD, PACK_MANIFEST_FILE, type PackRef } from "./pack.js";
import { discoverInstalledPacks, readInstalledPack, resolvePackTheme } from "./host/packs.js";
import {
	availableAlgorithms,
	defaultAlgorithm,
	refreshInstalledAlgorithms,
	resolveInstalledAlgorithm,
	HARNESS_TIMEOUT_MS,
} from "./host/registry.js";
import { algorithmDomains, bakedAlgorithm } from "./baked.js";
import { constraintsFrom } from "./constraints.js";
import type { EmitFormat } from "./types.js";

type CliFormat = EmitFormat | "theme" | "text";
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
	invert?: boolean;
	theme?: string;
	limit?: number;
	registry?: string;
	dryRun?: boolean;
	dev?: boolean;
}


/**
 * Every flag the CLI answers to, including the handful read straight off `argv` by a subcommand
 * rather than through the switch below. An unrecognised one is refused rather than skipped: a
 * mistyped `--set` or a half-remembered `--override` otherwise derives a perfectly ordinary theme
 * that quietly lacks whatever the caller asked for, and reports success while doing it.
 */
/** Flags a subcommand reads straight off `argv`, whose value may itself look like a flag —
 * `--consumed --bg-0,--fg-0` is a token list, not two options. */
const VALUE_FLAGS_READ_ELSEWHERE = new Set(["--consumed", "--level", "--separation", "--ramp-separation", "--focus-ring"]);

const KNOWN_FLAGS = new Set([
	"--accent",
	"--algorithm",
	"--bg",
	"--consumed",
	"--constraint",
	"--depth",
	"--dev",
	"--dry-run",
	"--fg",
	"--format",
	"--help",
	"--hues",
	"--invert",
	"--knob",
	"--large-text",
	"--level",
	"--limit",
	"--mode",
	"--name",
	"--no-scrollbars",
	"--out",
	"--ramp-separation",
	"--focus-ring",
	"--registry",
	"--runs",
	"--separation",
	"--set",
	"--theme",
	"-a",
	"-f",
	"-h",
	"-k",
	"-o",
]);

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
					// INFO: keep the raw string; coercion happens later against the knob's declared kind,
					// since guessing by shape would misread a `text` "12" as a number
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
			case "--invert":
				args.invert = true;
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
			case "--theme":
				args.theme = next;
				i++;
				break;
			case "--limit":
				args.limit = Number.parseInt(next ?? "20", 10);
				i++;
				break;
			case "--registry":
				args.registry = next;
				i++;
				break;
			case "--dry-run":
				args.dryRun = true;
				break;
			case "--dev":
				args.dev = true;
				break;
			default:
				if (VALUE_FLAGS_READ_ELSEWHERE.has(argv[i - 1] ?? "")) break;
				if (arg?.startsWith("-") && !KNOWN_FLAGS.has(arg)) {
					process.stderr.write(`xtyle: unknown option "${arg}"
Run \`xtyle --help\` for usage.
`);
					process.exit(2);
				}
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

/**
 * Grades a theme's counterpart alongside it, when the invocation has one to grade.
 *
 * A *theme* ships both schemes, so auditing one and printing `PASS` answers a question nobody asked.
 * Two write-ups from default-knob runs each got the headline count wrong.
 *
 * The counterpart is graded whenever there is a real one to grade: the caller seeded a surface, so
 * `invertBgFg` has something to swap, or the algorithm states an anchor pair for the other scheme and
 * answers for it.
 *
 * Flipping an algorithm that states one half leaves that anchor in place and derives a mid-gray page;
 * eighteen fills under the boundary on a mid-gray page is crying wolf about a theme nobody ships. A
 * pinned `scheme` knob has no counterpart either, for an unrelated reason, so {@link whyOneScheme}
 * names which of the two happened rather than leaving the omission silent.
 */
function auditSchemes(
	algorithm: Algorithm,
	knobs: Knobs,
	args: ParsedArgs,
	opts: ContrastAuditOptions,
): Array<{ scheme: string; result: ContrastAudit }> {
	const constraints = constraintsFrom(args);
	const grade = (o: Parameters<typeof derive>[1]): ContrastAudit =>
		auditRegister(derive(algorithm, o), opts);
	const native = derive(algorithm, { constraints, knobs, invert: args.invert });
	const nativeScheme = String(native["--scheme"] ?? "dark");
	const rows = [{ scheme: nativeScheme, result: auditRegister(native, opts) }];
	if (knobs.scheme) return rows;

	const counterpart = nativeScheme === "light" ? "dark" : "light";
	const stated = algorithm.declares?.schemes?.includes(counterpart) ?? false;
	if (constraints["--bg-0"] === undefined && !stated) return rows;

	rows.push({ scheme: counterpart, result: grade({ constraints, knobs, invert: !args.invert }) });
	return rows;
}

/**
 * Why only one scheme was graded. Two unrelated reasons reach the same one-row result, and telling a
 * caller who pinned `scheme` that they supplied no `--bg` is worse than saying nothing at all.
 */
function whyOneScheme(knobs: Knobs): string {
	if (knobs.scheme) return "  graded one scheme: the scheme is pinned, so there is no counterpart to flip";
	return (
		"  graded one scheme: no --bg seed, and this algorithm states anchors for one scheme only; " +
		"pass --bg to grade both, or declare the other half in the algorithm"
	);
}

function separationAxisNote(entry: RoleSeparationEntry): string {
	if (entry.distance === 0) return "identical";
	if (entry.dominant === "hue") return `by hue, ${entry.axes.hueAngle}°`;
	return `by ${entry.dominant}`;
}

/**
 * The audit as a human reads it: one line per dimension, each naming its own weakest pair.
 *
 * The JSON carries every graded pair, which is what a linter or a CI gate wants and what a person
 * standing at a terminal has to write a parser to get past. Three of the four dimensions are reports
 * that `passes` ignores, so the summary says which one decides the exit code rather than leaving a
 * clean verdict next to a number that looks alarming.
 */
function auditSummary(result: ContrastAudit, algorithm: string, scheme?: string): string {
	const rows: string[] = [];
	const pad = (label: string, count: string, detail: string): string =>
		`  ${label.padEnd(13)}${count.padEnd(13)}${detail}`;

	rows.push(
		`${algorithm}${scheme ? ` · ${scheme}` : ""} · ${result.level} · ${result.passes ? "PASS" : "FAIL"}`,
	);
	rows.push("");

	const worstPair = result.entries.reduce<(typeof result.entries)[number] | null>(
		(low, e) => (low === null || e.ratio < low.ratio ? e : low),
		null,
	);
	rows.push(
		pad(
			"contrast",
			`${result.tallies.total} pairs`,
			worstPair ? `weakest ${worstPair.ratio}:1  ${worstPair.pair}${result.tallies.fail ? `  (${result.tallies.fail} failing)` : ""}` : "nothing graded",
		),
	);

	const closest = result.roleSeparation.reduce<(typeof result.roleSeparation)[number] | null>(
		(low, e) => (low === null || e.distance < low.distance ? e : low),
		null,
	);
	const under = result.roleSeparation.filter((e) => !e.clears).length;
	rows.push(
		pad(
			"separation",
			`${result.roleSeparation.length} pairs`,
			closest
				? `closest ${closest.distance}  ${closest.pair}  ${separationAxisNote(closest)}  (floor ${result.separationFloor}${under ? `, ${under} under` : ""})`
				: "nothing graded",
		),
	);

	const weakestFill = result.fillSurface.reduce<(typeof result.fillSurface)[number] | null>(
		(low, e) => (low === null || e.ratio < low.ratio ? e : low),
		null,
	);
	const fillUnder = result.fillSurface.filter((e) => !e.clears).length;
	rows.push(
		pad(
			"fill/surface",
			`${result.fillSurface.length} pairs`,
			weakestFill ? `weakest ${weakestFill.ratio}:1  ${weakestFill.pair}  (floor ${result.fillSurfaceFloor}${fillUnder ? `, ${fillUnder} under` : ""})` : "nothing graded",
		),
	);

	const weakestRing = result.focusRing.reduce<(typeof result.focusRing)[number] | null>(
		(low, e) => (low === null || e.ratio < low.ratio ? e : low),
		null,
	);
	const ringUnder = result.focusRing.filter((e) => !e.clears).length;
	rows.push(
		pad(
			"focus ring",
			`${result.focusRing.length} pairs`,
			weakestRing
				? `weakest ${weakestRing.ratio}:1  ${weakestRing.pair}  (floor ${result.focusRingFloor}${
						result.focusRingFloor === result.focusRingStandard
							? ""
							: ` declared, standard ${result.focusRingStandard}:1`
					}${ringUnder ? `, ${ringUnder} under` : ""})`
				: "nothing graded",
		),
	);

	const tightest = result.rampSeparation.reduce<(typeof result.rampSeparation)[number] | null>(
		(low, e) => (low === null || e.distance < low.distance ? e : low),
		null,
	);
	const rampUnder = result.rampSeparation.filter((e) => !e.clears).length;
	const reversed = result.rampSeparation.filter((e) => e.reversed).length;
	rows.push(
		pad(
			"ramp",
			`${result.rampSeparation.length} steps`,
			tightest
				? `tightest ${tightest.distance}  ${tightest.from} → ${tightest.to}  (floor ${result.rampSeparationFloor}${rampUnder ? `, ${rampUnder} under` : ""}${reversed ? `, ${reversed} reversed` : ""})`
				: "nothing graded",
		),
	);

	rows.push("");
	if (result.surfacePolarity.spansPoles) {
		rows.push("");
		rows.push(
			`  surfaces straddle light and dark (${result.surfacePolarity.light.join(", ")} light · ` +
				`${result.surfacePolarity.dark.join(", ")} dark), so no single ink reads on all of them`,
		);
	}

	rows.push("  only contrast decides the verdict; separation, fill/surface, focus ring and ramp are reports.");
	return `${rows.join("\n")}\n`;
}

function refPackName(ref: PackRef): string | null {
	if (ref.kind === "npm") return ref.target;
	if (ref.kind === "path") return readInstalledPack(resolve(process.cwd(), ref.target))?.pack.name ?? null;
	return null;
}

function usage(): void {
	process.stdout.write(
		[
			"xtyle: themable-derivation engine",
			"",
			"usage:",
			"  xtyle derive [-a <algorithm>] [--theme <name>] [--bg <c>] [--fg <c>] [--accent <c>] [--knob <name>=<value>]... [--set <token>=<value>]... [--invert] [--format css|json|theme|prism|monaco|terminal] [--no-scrollbars] [--name <s>] [--out <file>]",
			"  xtyle gauntlet [-a <algorithm>|all] [--mode baked|hosted] [--depth quick|standard|full] [--runs <n>]",
			"  xtyle coverage --consumed <a,b,c> [-a <algorithm>] [--bg <c>] [--accent <c>] [--knob <name>=<value>]... [--set <token>=<value>]...",
			"  xtyle audit [-a <algorithm>] [--bg <c>] [--accent <c>] [--knob <name>=<value>]... [--set <token>=<value>]... [--level AA|AAA] [--large-text] [--separation <d>] [--ramp-separation <d>] [--focus-ring <r>] [--hues] [--format text|json]",
			"         --format text prints a four-line summary naming each dimension's weakest pair; json (the default) carries every graded pair",
			"         with a --bg seed it also grades that theme's inverted counterpart, since a theme ships both halves and one can pass while the other does not",
			"",
			"  --knob turns an algorithm's own dial (repeatable): --knob accentStrategy=duo --knob surfaceRamp=-0.05",
			"         `xtyle knobs` prints each algorithm's dials and the values they accept. Alias: -k.",
			"  --set  pins any token (repeatable): --set --accent-2=#7c3aed --set font-sans='Inter, sans-serif'",
			"         the leading -- is optional (--set radius-md=10px). Alias: --constraint.",
			"  --invert swaps the bg/fg anchors before deriving: the light counterpart of a dark theme (or back)",
			"  --theme derives a theme an installed pack declares, by its manifest name; -a, --knob and --set still layer over it",
			"",
			"  xtyle search [<query>|@handle|@scope/] [--limit <n>] [--format json]",
			"  xtyle add <pack>[#<entry>] [--dev] [--dry-run]",
			"  xtyle packs [--format json]",
			"",
			"  a pack is @scope/pkg, owner/repo, ./path, or a tarball URL, with @<version> pinning one",
			"  and #<entry> naming a single declared algorithm or theme instead of all of them.",
			"",
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

	if (args.command === "help" || argv.includes("--help") || argv.includes("-h")) {
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

	if (args.command === "search") {
		const query = argv[1] && !argv[1].startsWith("-") ? argv[1] : "";
		const hits = await searchPacks(query, {
			...(args.limit ? { limit: args.limit } : {}),
			...(args.registry ? { registry: args.registry } : {}),
		});
		if (!hits.length) process.exitCode = 1;
		if (args.format === "json") {
			process.stdout.write(`${JSON.stringify({ query: packSearchQuery(query), packs: hits }, null, 2)}\n`);
			return;
		}
		if (!hits.length) {
			process.stderr.write(`xtyle: no packs match ${packSearchQuery(query)}\n`);
			return;
		}
		const width = Math.max(...hits.map((hit) => `${hit.name}@${hit.version}`.length));
		for (const hit of hits) {
			const coordinate = `${hit.name}@${hit.version}`.padEnd(width);
			const by = hit.publisher ? ` (${hit.publisher})` : "";
			process.stdout.write(`${coordinate}  ${hit.description ?? ""}${by}\n`);
		}
		process.stdout.write(`\nxtyle add <name> installs one.\n`);
		return;
	}

	if (args.command === "packs") {
		const installed = discoverInstalledPacks();
		if (args.format === "json") {
			process.stdout.write(`${JSON.stringify({ packs: installed.map(({ pack, problems }) => ({ ...pack, problems })) }, null, 2)}\n`);
			return;
		}
		if (!installed.length) {
			process.stdout.write("no packs installed. `xtyle search` finds published ones.\n");
			return;
		}
		for (const { pack, problems } of installed) {
			process.stdout.write(`${pack.name}${pack.version ? `@${pack.version}` : ""}${pack.description ? ` — ${pack.description}` : ""}\n`);
			for (const entry of packEntries(pack)) {
				process.stdout.write(`  ${entry.kind.padEnd(9)} ${entry.name}${entry.description ? ` — ${entry.description}` : ""}\n`);
			}
			for (const problem of problems) process.stdout.write(`  ! ${problem}\n`);
		}
		return;
	}

	if (args.command === "add") {
		const raw = argv[1];
		if (!raw || raw.startsWith("-")) {
			process.stderr.write("xtyle: add needs a pack — @scope/pkg, owner/repo, ./path, or a tarball URL\n");
			process.exitCode = 2;
			return;
		}
		let ref = parsePackRef(raw);
		if (ref.kind === "author") {
			const hits = await searchPacks(ref.target, { ...(args.registry ? { registry: args.registry } : {}) });
			if (!hits.length) {
				process.stderr.write(`xtyle: ${ref.target} publishes no packs the index can see\n`);
				process.exitCode = 1;
				return;
			}
			if (hits.length > 1) {
				process.stderr.write(`xtyle: ${ref.target} publishes ${hits.length} packs; name one\n`);
				for (const hit of hits) process.stderr.write(`  ${hit.name}\n`);
				process.exitCode = 1;
				return;
			}
			const only = hits[0] as { name: string };
			ref = parsePackRef(ref.select ? `${only.name}#${ref.select}` : only.name);
		}

		const spec = packInstallSpec(ref);
		const before = new Set(discoverInstalledPacks().map((installed) => installed.pack.name));
		if (args.dryRun) {
			process.stdout.write(`${spec}\n`);
			return;
		}

		process.stderr.write(
			"xtyle: `add` is an npm install — install scripts are not sandboxed, so normal supply-chain trust applies.\n" +
				"       An algorithm is sandboxed when it *runs*, which is a different moment.\n",
		);
		const windows = process.platform === "win32";
		const install = windows
			? spawnSync(`npm install ${args.dev ? "--save-dev " : ""}"${spec}"`, { stdio: "inherit", shell: true })
			: spawnSync("npm", ["install", ...(args.dev ? ["--save-dev"] : []), spec], { stdio: "inherit" });
		if (install.error) {
			process.stderr.write(`xtyle: could not run npm to install ${spec} — ${install.error.message}\n`);
			process.exitCode = 1;
			return;
		}
		if (install.status !== 0) {
			process.stderr.write(`xtyle: npm install ${spec} exited ${install.status ?? "on a signal"}; nothing was added\n`);
			process.exitCode = install.status ?? 1;
			return;
		}

		refreshInstalledAlgorithms();
		const after = discoverInstalledPacks();
		const added = after.filter((installed) => !before.has(installed.pack.name));
		const named = refPackName(ref);
		const landed = added.length ? added : after.filter((installed) => installed.pack.name === named);
		if (!landed.length) {
			process.stderr.write(
				`xtyle: npm installed ${spec}, and no new pack turned up. Either it declares no ` +
					`"${PACK_MANIFEST_FIELD}" field and no ${PACK_MANIFEST_FILE}, or it was already here — ` +
					"`xtyle packs` lists what this project declares.\n",
			);
			process.exitCode = 1;
			return;
		}

		for (const { pack, problems } of landed) {
			const selected = ref.select ? selectPackEntry(pack, ref.select) : null;
			if (ref.select && !selected) {
				process.stderr.write(`xtyle: pack "${pack.name}" declares nothing called "${ref.select}"\n`);
				process.exitCode = 1;
				continue;
			}
			const entries = selected ? [selected] : packEntries(pack);
			process.stdout.write(`${pack.name}${pack.version ? `@${pack.version}` : ""}\n`);
			for (const entry of entries) process.stdout.write(`  ${entry.kind.padEnd(9)} ${entry.name}\n`);
			for (const problem of problems) process.stdout.write(`  ! ${problem}\n`);
		}
		return;
	}

	if (args.command === "derive") {
		const seed = args.theme ? resolvePackTheme(args.theme) : null;
		if (args.theme && !seed) {
			process.stderr.write(`xtyle: no installed pack declares a theme called "${args.theme}" (\`xtyle packs\` lists what does)\n`);
			process.exitCode = 1;
			return;
		}
		if (seed) {
			const recipe = migrateRecipe(seed.theme.recipe);
			if (!argv.includes("-a") && !argv.includes("--algorithm")) args.algorithm = recipe.algorithm;
			args.knobs = { ...(recipe.knobs as Record<string, string>), ...args.knobs };
			args.overrides = { ...recipe.overrides, ...args.overrides };
		}
		const { id, algorithm, knobs } = await target(args);
		const constraints = constraintsFrom(args);
		const register = derive(algorithm, { constraints, knobs, invert: args.invert });
		const output =
			args.format === "theme"
				? serializeThemeFile(
						buildThemeFile({
							meta: { name: args.name ?? seed?.theme.meta.name ?? `${id} theme`, generator: "@xtyle/core" },
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
			reports.push(gauntlet(algorithm, { runs, invertedOptions }));
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
		const register = derive(algorithm, { constraints: constraintsFrom(args), knobs, invert: args.invert });
		const result = coverage(consumed, register);
		process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
		process.exitCode = result.covered ? 0 : 1;
		return;
	}

	if (args.command === "audit") {
		const { algorithm, knobs } = await target(args);
		const levelIndex = argv.indexOf("--level");
		const level = levelIndex >= 0 && argv[levelIndex + 1] === "AAA" ? "AAA" : "AA";
		const floorIndex = argv.indexOf("--separation");
		const declaredFloor = floorIndex >= 0 ? Number(argv[floorIndex + 1]) : NaN;
		const rampIndex = argv.indexOf("--ramp-separation");
		const declaredRampFloor = rampIndex >= 0 ? Number(argv[rampIndex + 1]) : NaN;
		const ringIndex = argv.indexOf("--focus-ring");
		const ringFloorFlag = ringIndex >= 0 ? Number(argv[ringIndex + 1]) : NaN;
		const declaredRingFloor = Number.isFinite(ringFloorFlag)
			? ringFloorFlag
			: (algorithm.declares?.focusRingFloor ?? Number.NaN);
		const opts: ContrastAuditOptions = {
			level,
			largeText: argv.includes("--large-text"),
			...(argv.includes("--hues") ? { separationRoles: PALETTE_HUE_ROLES } : {}),
			...(Number.isFinite(declaredFloor) ? { separationFloor: declaredFloor } : {}),
			...(Number.isFinite(declaredRampFloor) ? { rampSeparationFloor: declaredRampFloor } : {}),
			...(Number.isFinite(declaredRingFloor) ? { focusRingFloor: declaredRingFloor } : {}),
		};
		const graded = auditSchemes(algorithm, knobs, args, opts);
		const passes = graded.every(({ result }) => result.passes);
		if (args.format === "text") {
			const single = graded.length === 1;
			process.stdout.write(
				`${graded
					.map(({ scheme, result }) => auditSummary(result, args.algorithm, scheme))
					.join("\n")}${single ? `${whyOneScheme(knobs)}\n` : ""}`,
			);
		} else {
			const only = graded[0] as (typeof graded)[number];
			process.stdout.write(
				`${JSON.stringify(
					graded.length === 1
						? only.result
						: { schemes: Object.fromEntries(graded.map(({ scheme, result }) => [scheme, result])), passes },
					null,
					2,
				)}\n`,
			);
		}
		process.exitCode = passes ? 0 : 1;
		return;
	}

	usage();
	process.exitCode = 1;
}

main().catch((error) => {
	process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
	process.exitCode = 1;
});
