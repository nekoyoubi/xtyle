/**
 * Start the site's dev server against a freshly built engine.
 *
 * A core edit (a CSS rule, an element, a fragment) only reaches the site through
 * `packages/xtyle/dist`. A dev server started against a stale `dist` keeps serving it for its whole
 * life: the site's own files hot-reload, so the page looks alive while the engine underneath is
 * frozen at whenever the server booted. That failure is invisible and expensive — the fix is on disk,
 * the page says otherwise. Building here means `npm run dev` can never show an engine you didn't build.
 *
 * `--no-build` skips it for a site-only session, where the engine genuinely hasn't moved.
 */
import { spawn, spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const shell = process.platform === "win32";

function run(command, args) {
	const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell });
	if (result.status !== 0) process.exit(result.status ?? 1);
}

if (!process.argv.includes("--no-build")) {
	console.log("\n▸ building the engine so dev can't serve a stale one (--no-build to skip)\n");
	run("node", ["scripts/build-fragments.mjs"]);
	run(npm, ["run", "build", "-w", "@xtyle/core"]);
	run("node", ["scripts/build-mods.mjs"]);
}

// Vite resolves the workspace packages once and holds them; a rebuilt `dist` behind a warm cache is
// the same ghost by another name, so the cache goes with the rebuild.
rmSync(join(root, "apps/site/node_modules/.vite"), { recursive: true, force: true });

const child = spawn(npm, ["run", "dev", "--workspace=@xtyle/site"], {
	cwd: root,
	stdio: "inherit",
	shell,
});
child.on("exit", (code) => process.exit(code ?? 0));
