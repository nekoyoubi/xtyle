import { build } from "esbuild";
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { buildMod, discoverPacks, packAlgorithmMods } from "./algorithms.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const staged = join(root, "apps", "site", "public", "packs");

for (const pack of discoverPacks(root)) {
	for (const mod of packAlgorithmMods(pack)) {
		const stamped = await buildMod(mod, build);
		console.log(`bundled ${pack.name}/${mod.id} mod${stamped ? " + stamped its static manifest" : ""}`);
	}

	const destination = join(staged, pack.name);
	rmSync(destination, { recursive: true, force: true });
	mkdirSync(destination, { recursive: true });
	cpSync(pack.dir, destination, {
		recursive: true,
		filter: (source) => !source.includes("node_modules") && !source.endsWith(".ts"),
	});
	writeFileSync(join(destination, "package.json"), `${JSON.stringify(pack.pkg, null, "\t")}\n`);
	console.log(`staged ${pack.name} -> apps/site/public/packs/${pack.name}/`);
}
