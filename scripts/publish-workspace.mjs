#!/usr/bin/env node
// Publishes one workspace, treating "this exact version is already on the registry" as success and
// every other failure as fatal.
//
// The workflow used to give each publish step `continue-on-error: true`. That covers the case worth
// covering — re-running a release after a partial success, where the packages that already landed
// would otherwise fail with EPUBLISHCONFLICT — but it covers it by swallowing *every* failure, which
// is far too broad: `@xtyle/svelte` and `@xtyle/astro` both depend on `@xtyle/core`, so a core publish
// that genuinely failed still let its dependents ship against a version nobody could install. On a
// public registry that is not reversible. This narrows the tolerance to the one case that earned it.

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

// `npm` is `npm.cmd` on Windows, which `execFileSync` cannot resolve without a shell. CI is Linux, so
// this is only what makes the script runnable (and therefore testable) on a maintainer's machine.
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
