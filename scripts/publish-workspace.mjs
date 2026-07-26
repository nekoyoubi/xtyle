#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const workspace = process.argv[2];
if (!workspace) {
	console.error("usage: publish-workspace.mjs <workspace-dir> [--dry-run]");
	process.exit(1);
}
const dryRun = process.argv.includes("--dry-run");

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const { name, version } = JSON.parse(readFileSync(join(ROOT, workspace, "package.json"), "utf8"));
const spec = `${name}@${version}`;

// INFO: npm is npm.cmd on Windows; execFileSync needs a shell to resolve it
const shell = process.platform === "win32";

/**
 * Whether this exact version is already on the registry. A `npm view` failure is not evidence of
 * absence on its own — an outage or an auth problem fails the same way — so the "already there" branch
 * is only taken on a clean success, and everything else falls through to a real publish attempt that
 * will surface the underlying error itself.
 */
function alreadyPublished() {
	try {
		return execFileSync("npm", ["view", spec, "version"], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], shell })
			.trim() === version;
	} catch {
		return false;
	}
}

if (alreadyPublished()) {
	console.log(`${spec} is already on the registry; skipping`);
	process.exit(0);
}

console.log(`publishing ${spec}${dryRun ? " (dry run)" : ""}`);
execFileSync(
	"npm",
	["publish", `--workspace=${workspace}`, "--access", "public", ...(dryRun ? ["--dry-run"] : [])],
	{ cwd: ROOT, stdio: "inherit", shell },
);
