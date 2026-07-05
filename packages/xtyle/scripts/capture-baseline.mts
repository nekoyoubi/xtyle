import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getAlgorithm } from "../dist/algorithms/index.js";
import { buildMatrix } from "../test/matrix.js";

const outDir = process.argv[2] ?? join(tmpdir(), "xtyle-mod-baseline");
mkdirSync(outDir, { recursive: true });

const algorithm = getAlgorithm("xtyle-default");
const matrix = buildMatrix();

const index: Array<{ label: string; opts: unknown }> = [];
for (const { label, opts } of matrix) {
	const register = algorithm.derive(opts);
	writeFileSync(join(outDir, `${label}.json`), JSON.stringify(register, null, 2) + "\n", "utf8");
	index.push({ label, opts });
}
writeFileSync(join(outDir, "_matrix.json"), JSON.stringify(index, null, 2) + "\n", "utf8");

console.log(`captured ${matrix.length} registers to ${outDir}`);
