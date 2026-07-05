import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { listComponents, derive, ICON_PRIMITIVE_NAMES } from "@xtyle/core";
import { resolveAlgorithm } from "@xtyle/core/host";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));

const anchors = { bg: "#0b0d12", fg: "#e6e9ef", accent: "#6ea8fe" };
const algorithm = await resolveAlgorithm("xtyle-default");
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
writeFileSync(out, `${JSON.stringify(baseline, null, "\t")}\n`);
console.log(`xtyle: wrote stats baseline for v${baseline.version}`, baseline);
