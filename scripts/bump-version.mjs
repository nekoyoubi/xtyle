#!/usr/bin/env node

import { readFileSync, writeFileSync, globSync } from "node:fs";
import { resolve } from "node:path";

const version = process.argv[2];
if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
	console.error("Usage: node scripts/bump-version.mjs <version>");
	console.error("Example: node scripts/bump-version.mjs 0.1.0");
	process.exit(1);
}

const root = resolve(import.meta.dirname, "..");
const patterns = [
	"package.json",
	"packages/*/package.json",
	"algorithms/*/package.json",
	"apps/*/package.json",
];

const files = [
	...new Set(patterns.flatMap((p) => globSync(p, { cwd: root }))),
].map((p) => resolve(root, p));

let updated = 0;
for (const abs of files) {
	const pkg = JSON.parse(readFileSync(abs, "utf8"));
	pkg.version = version;
	for (const field of ["dependencies", "devDependencies", "peerDependencies"]) {
		const deps = pkg[field];
		if (!deps) continue;
		for (const name of Object.keys(deps)) {
			if ((name === "xtyle" || name.startsWith("@xtyle/")) && /^[\d^~]/.test(deps[name])) {
				deps[name] = `^${version}`;
			}
		}
	}
	writeFileSync(abs, JSON.stringify(pkg, null, "\t") + "\n");
	updated++;
	console.log(`  ${abs.slice(root.length + 1)} -> ${version}`);
}

console.log(`\n${updated} file(s) updated to ${version}`);
console.log("Run 'npm install' to refresh the lockfile.");
