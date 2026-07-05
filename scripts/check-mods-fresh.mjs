import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

// The algorithm mods (`algorithms/*/src/mod.js`) and the authoring prelude are generated from the
// engine source by `build-mods.mjs`, but they are committed to git so the hosted path and the
// byte-identical test can read them from disk. That means they can silently drift when the engine
// changes and the bundle is not rebuilt — shipping a baked↔hosted divergence. This guard rebuilds
// them and fails if the rebuild changes anything, so stale bundles can never land. It compares the
// rebuild against the working tree (not git HEAD), so a legitimately-uncommitted-but-fresh bundle
// passes — only a bundle that no longer matches its source fails.

const generated = [
	...readdirSync("algorithms")
		.map((dir) => join("algorithms", dir, "src", "mod.js"))
		.filter(existsSync),
	"packages/xtyle/src/host/authoring-prelude.generated.ts",
];

const hashAll = () =>
	generated.map((f) => `${f}:${createHash("sha256").update(readFileSync(f)).digest("hex")}`).join("\n");

const before = hashAll();
execSync("node scripts/build-mods.mjs", { stdio: "inherit" });
const after = hashAll();

if (before !== after) {
	const stale = generated.filter(
		(_, i) => before.split("\n")[i] !== after.split("\n")[i],
	);
	console.error(
		"\nGenerated mods are stale — they no longer match the engine source.\n" +
			"The rebuild just refreshed them; commit the result. Drifted files:\n  " +
			stale.join("\n  "),
	);
	process.exit(1);
}
console.log("mods in sync with engine source ✓");
