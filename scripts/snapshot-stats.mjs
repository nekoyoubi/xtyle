import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { listComponents, derive, ICON_PRIMITIVE_NAMES } from "@xtyle/core";
import { resolveInstalledAlgorithm } from "@xtyle/core/host";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));

const anchors = { bg: "#0b0d12", fg: "#e6e9ef", accent: "#6ea8fe" };
const algorithm = await resolveInstalledAlgorithm("xtyle-default");
const register = derive(algorithm, { anchors });
const components = listComponents();

// The bench tools live in a small site-side data file; count its entries so the tools stat
// re-baselines with the rest at release time without duplicating the registry.
const benchToolsSrc = readFileSync(resolve(root, "apps/site/src/data/bench-tools.ts"), "utf8");
const tools = (benchToolsSrc.match(/\bsince:\s*"/g) ?? []).length;

const baseline = {
	version: pkg.version,
	components: components.length,
	tokens: Object.keys(register).length,
	categories: new Set(components.map((c) => c.category)).size,
	bindings: 3,
	primitives: ICON_PRIMITIVE_NAMES.length,
	tools,
};

const outDir = resolve(root, "apps/site/src/data");
mkdirSync(outDir, { recursive: true });
const out = resolve(outDir, "stats-baseline.json");

// The baseline is the *last released* snapshot, and every growth delta on the site is measured
// against it. Writing it mid-cycle overwrites the reference point with the very numbers it exists to
// compare against, which silently zeroes every delta — the readouts still render, they just all say
// nothing. That is a one-way loss with no error, so re-baselining onto the in-flight version has to
// be asked for rather than fallen into.
// There is no signal in the tree for "has this version shipped yet", so the script cannot tell a
// release from a mid-cycle run on its own. It asks instead: this is a handful-of-times-a-year action
// whose failure mode is silent and unrecoverable from the repo alone.
const previous = JSON.parse(readFileSync(out, "utf8"));
if (!process.argv.includes("--release")) {
	console.error(
		`xtyle: refusing to overwrite the v${previous.version} baseline with v${baseline.version}.\n` +
			"  The baseline is the last *released* snapshot, and every growth delta is measured against it.\n" +
			"  Re-capturing mid-cycle replaces the reference point with the numbers it exists to compare\n" +
			"  against, so every delta silently becomes zero and the readouts render as blank.\n" +
			"  Pass --release when a version has actually shipped.",
	);
	process.exit(1);
}

writeFileSync(out, `${JSON.stringify(baseline, null, "\t")}\n`);
console.log(
	`xtyle: wrote stats baseline for v${baseline.version} (was v${previous.version})`,
	baseline,
);
