import { execFileSync } from "node:child_process";
import { readdirSync, existsSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { discoverAlgorithms, discoverPacks, packAlgorithmMods } from "./algorithms.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

/** Every `.ts` beside a mod's entry — a mod is free to split its preset and passes out of `mod.ts`. */
function modSources(entryPath) {
	const dir = dirname(entryPath);
	if (!existsSync(dir)) return [];
	return readdirSync(dir)
		.filter((file) => file.endsWith(".ts"))
		.map((file) => join(dir, file));
}

const mods = [
	...discoverAlgorithms(root).map((mod) => mod.sourcePath),
	...discoverPacks(root).flatMap((pack) => packAlgorithmMods(pack).map((mod) => mod.sourcePath)),
];
const sources = [...new Set(mods.flatMap(modSources))];

if (sources.length === 0) {
	console.log("check-mod-types: no mod sources found");
	process.exit(0);
}

console.log(`check-mod-types: ${sources.length} source(s) across ${mods.length} mod(s)`);

try {
	execFileSync(
		process.execPath,
		[
			join(root, "node_modules", "typescript", "bin", "tsc"),
			"--noEmit",
			"--strict",
			"--module",
			"nodenext",
			"--moduleResolution",
			"nodenext",
			"--target",
			"es2022",
			"--skipLibCheck",
			...sources,
		],
		{ cwd: root, stdio: "inherit" },
	);
} catch {
	console.error(
		"\nA mod's source does not typecheck. esbuild strips types without checking them, so a mod " +
			"builds and ships either way — which is how a pass can run entirely untyped.",
	);
	process.exit(1);
}

console.log(`check-mod-types: ${sources.map((source) => relative(root, source)).length} mod source(s) typecheck ✓`);
