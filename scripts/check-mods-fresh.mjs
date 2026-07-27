import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { relative } from "node:path";
import { discoverAlgorithms } from "./algorithms.mjs";

// INFO: compares the rebuild to the working tree (not git HEAD), so a fresh-but-uncommitted artifact passes.

const root = process.cwd();
const mods = discoverAlgorithms(root);

const committed = [
	...mods.flatMap((mod) => [relative(root, mod.scriptPath), relative(root, mod.manifestPath)]),
	"packages/xtyle/src/host/algorithms-bundle.generated.ts",
	"packages/xtyle/src/host/authoring-prelude.generated.ts",
];

// INFO: batteries.js is gitignored (tsconfig excludes src/batteries.ts from tsc), so its drift can't land in git; reported, never fatal.
const buildOutputs = ["packages/xtyle/dist/batteries.js"];

const hashOne = (f) =>
	existsSync(f) ? createHash("sha256").update(readFileSync(f)).digest("hex") : "absent";
const hashAll = (files) => files.map(hashOne);

const beforeCommitted = hashAll(committed);
const beforeOutputs = hashAll(buildOutputs);
execSync("node scripts/build-mods.mjs", { stdio: "inherit" });
const afterCommitted = hashAll(committed);
const afterOutputs = hashAll(buildOutputs);

const refreshed = buildOutputs.filter(
	(_, i) => beforeOutputs[i] !== "absent" && beforeOutputs[i] !== afterOutputs[i],
);
if (refreshed.length) {
	console.warn(
		"\nBuild outputs were stale and have been refreshed:\n  " +
			refreshed.join("\n  ") +
			"\nNot a failure (they are gitignored), but if a test or the CLI just misbehaved, this is why.",
	);
}

const stale = committed.filter((_, i) => beforeCommitted[i] !== afterCommitted[i]);
if (stale.length) {
	console.error(
		"\nGenerated mods are stale — they no longer match the engine source.\n" +
			"The rebuild just refreshed them; commit the result. Drifted files:\n  " +
			stale.join("\n  "),
	);
	process.exit(1);
}
console.log("mods in sync with engine source ✓");
