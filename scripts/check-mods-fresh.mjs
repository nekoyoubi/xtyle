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

const committed = [
	...mods.flatMap((mod) => [relative(root, mod.scriptPath), relative(root, mod.manifestPath)]),
	"packages/xtyle/src/host/algorithms-bundle.generated.ts",
	"packages/xtyle/src/host/authoring-prelude.generated.ts",
];

// `build-mods.mjs` also emits this one, and it is the *only* producer of it — `tsconfig.json` excludes
// `src/batteries.ts` from the `tsc` build, so a plain `npm run build` leaves it untouched. It is
// gitignored, so its drift can never land in git and failing the run over it would break `npm test` on
// a clean checkout, where it legitimately does not exist yet. But it was previously rewritten as an
// unlisted side effect, which is worse than it sounds: a stale copy poisons the CLI and any consumer
// reading the published bundle, and running this check *repaired it while reporting green* — so the
// one command that could have explained the failure instead made it disappear. Reported, never fatal.
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
