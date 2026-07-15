import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { relative } from "node:path";
import { discoverAlgorithms } from "./algorithms.mjs";

// The algorithm mods (`algorithms/*/src/mod.js`), the static manifest block each mod-manifest carries,
// the browser bundle, and the authoring prelude are all generated from the engine source by
// `build-mods.mjs`, but they are committed to git so the hosted path and the byte-identical test can
// read them from disk. That means they can silently drift when the engine changes and the bundle is not
// rebuilt — shipping a baked↔hosted divergence, or a static block that advertises knobs the algorithm no
// longer reads. This guard rebuilds them and fails if the rebuild changes anything, so stale generated
// artifacts can never land. It compares the rebuild against the working tree (not git HEAD), so a
// legitimately-uncommitted-but-fresh artifact passes — only one that no longer matches its source fails.

const root = process.cwd();
const mods = discoverAlgorithms(root);

const generated = [
	...mods.flatMap((mod) => [relative(root, mod.scriptPath), relative(root, mod.manifestPath)]),
	"packages/xtyle/src/host/algorithms-bundle.generated.ts",
	"packages/xtyle/src/host/authoring-prelude.generated.ts",
];

const hashAll = () =>
	generated
		.map((f) => `${f}:${existsSync(f) ? createHash("sha256").update(readFileSync(f)).digest("hex") : "absent"}`)
		.join("\n");

const before = hashAll();
execSync("node scripts/build-mods.mjs", { stdio: "inherit" });
const after = hashAll();

if (before !== after) {
	const stale = generated.filter((_, i) => before.split("\n")[i] !== after.split("\n")[i]);
	console.error(
		"\nGenerated mods are stale — they no longer match the engine source.\n" +
			"The rebuild just refreshed them; commit the result. Drifted files:\n  " +
			stale.join("\n  "),
	);
	process.exit(1);
}
console.log("mods in sync with engine source ✓");
