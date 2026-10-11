import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";

/** The `exports` map of a package as `{ subpath: typesFile }`, skipping wildcard and non-module entries. */
function entryTypes(packageDir, fromSource) {
	const pkg = JSON.parse(readFileSync(join(packageDir, "package.json"), "utf8"));
	const entries = {};
	for (const [subpath, target] of Object.entries(pkg.exports ?? {})) {
		if (subpath.includes("*") || subpath.endsWith(".json")) continue;
		const types = typeof target === "object" && target !== null ? target.types : null;
		const js = typeof target === "string" ? target : target?.default;
		if (typeof types === "string") {
			entries[subpath] = join(packageDir, types);
			continue;
		}
		if (typeof js !== "string" || !js.endsWith(".js")) continue;
		const file = fromSource ? js.replace(/^\.\/dist\//, "./src/").replace(/\.js$/, ".ts") : js.replace(/\.js$/, ".d.ts");
		entries[subpath] = join(packageDir, file);
	}
	return entries;
}

/**
 * Every name each public subpath of a package exports, values and types alike.
 *
 * @param packageDir a package root holding `package.json`
 * @param fromSource read the `src` twin of each `dist` entry, for a tree that has not been built
 * @returns `{ subpath: sortedNames }` for every subpath whose entry file exists
 */
export function exportsOf(packageDir, fromSource = false) {
	const entries = Object.fromEntries(Object.entries(entryTypes(packageDir, fromSource)).filter(([, file]) => existsSync(file)));
	const program = ts.createProgram(Object.values(entries), {
		allowJs: false,
		noEmit: true,
		skipLibCheck: true,
		module: ts.ModuleKind.NodeNext,
		moduleResolution: ts.ModuleResolutionKind.NodeNext,
		target: ts.ScriptTarget.ES2022,
	});
	const checker = program.getTypeChecker();
	const out = {};
	for (const [subpath, file] of Object.entries(entries)) {
		const source = program.getSourceFile(file);
		const symbol = source && checker.getSymbolAtLocation(source);
		out[subpath] = symbol ? checker.getExportsOfModule(symbol).map((s) => s.getName()).sort() : [];
	}
	return out;
}
