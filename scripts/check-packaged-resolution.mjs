#!/usr/bin/env node
// Proves algorithm resolution works for someone who installed `@xtyle/core` from npm, which no test
// running inside this repo can do: `algorithms/` sits at the repo root, so `findAlgorithmsRoot`'s
// walk-up climbs out of `packages/xtyle/` and finds it no matter how the resolver is written. A
// published tarball has no such directory above it — npm cannot pack files above a package dir — so
// the failure only appears once the code is installed somewhere else. This packs, installs into a
// scratch project outside the repo, and derives + bakes there.

import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CORE = join(ROOT, "packages", "xtyle");

const scratch = mkdtempSync(join(tmpdir(), "xtyle-packaged-"));
let failed = false;

function run(cmd, args, cwd) {
	return execFileSync(cmd, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], shell: process.platform === "win32" });
}

try {
	// `dist/batteries.js` ships in the tarball and `build-mods.mjs` is its only producer — `tsconfig.json`
	// excludes `src/batteries.ts`, so a plain `npm run build` never refreshes it. Packing without this
	// lets the check install a stale copy, resolve through it, and pass: `@xtyle/core/algorithms` (the
	// path this whole check exists to prove) *is* `dist/batteries.js`, and a stale-but-valid one derives
	// perfectly well — it just derives the wrong values. Green for the wrong reason is the one outcome a
	// packaging gate must not be able to produce.
	console.log("rebuilding generated mods so the pack cannot capture a stale artifact");
	run("node", [join(ROOT, "scripts", "build-mods.mjs")], ROOT);

	console.log(`packing @xtyle/core into ${scratch}`);
	run("npm", ["pack", "--pack-destination", scratch], CORE);
	const tarball = readdirSync(scratch).find((f) => f.endsWith(".tgz"));
	if (!tarball) throw new Error("npm pack produced no tarball");

	// A tarball that carries `algorithms/` would mask the very thing this checks, so assert its absence
	// rather than assuming it: the guarantee is that the bundle covers the gap, not that the gap closed.
	// Asked of npm rather than `tar`, which on Windows reads a `C:\…` path as a remote host.
	const [{ files = [] } = {}] = JSON.parse(run("npm", ["pack", "--dry-run", "--json"], CORE));
	if (files.some((f) => /(^|\/)algorithms\/.*mod-manifest\.json/.test(f.path))) {
		throw new Error("the tarball now ships algorithms/ — this check assumes it does not; revisit the fallback");
	}

	const project = join(scratch, "consumer");
	mkdirSync(project, { recursive: true });
	writeFileSync(join(project, "package.json"), JSON.stringify({ name: "xtyle-packaged-consumer", private: true, type: "module" }));

	console.log("installing the tarball into a scratch project outside the repo");
	run("npm", ["install", "--no-audit", "--no-fund", join(scratch, tarball)], project);

	// The repro from the field report: a generated icon mark bakes a register at build time, which is
	// the only SSR path that derives from disk. `name="check"` (a static icon) never touched this.
	writeFileSync(
		join(project, "probe.mjs"),
		`
import { derive, resolveIconMark, composeIconThemed, seriesPalette } from "@xtyle/core";
import { resolveAlgorithm } from "@xtyle/core/algorithms";
import { bundledAlgorithms } from "@xtyle/core/host/bundle";
import { resolveInstalledAlgorithm, resolveAlgorithm as deprecatedAlias } from "@xtyle/core/host";

const ids = bundledAlgorithms();
if (!ids.includes("xtyle-default")) throw new Error("bundledAlgorithms() omits xtyle-default: " + ids.join(","));
if (ids.length < 5) throw new Error("bundledAlgorithms() reported only " + ids.join(","));

const register = derive(await resolveAlgorithm("xtyle-default"), {});
if (!Object.keys(register).length) throw new Error("derive produced an empty register");

const parsed = resolveIconMark("demo--letter-a-x-20-y-6-s85-c5-o2cb---f0-Sigmar");
if (!parsed) throw new Error("resolveIconMark returned null for the generated mark");
const svg = composeIconThemed(parsed.composition, { register, scheme: "skittles", part: "icon" });
if (!svg.includes("<svg")) throw new Error("the baked icon mark is not an svg");

// The metrics helpers reach the same seam whenever the scheme is a *named* palette rather than an
// array, which is the default for every chart component.
const colors = seriesPalette("skittles", 4, register, {});
if (colors.length !== 4) throw new Error("seriesPalette did not resolve against the derived register");

for (const id of ids) {
  if ((await resolveAlgorithm(id)).id !== id) throw new Error("resolveAlgorithm returned the wrong id for " + id);
}

// The disk twin cannot work here and is not supposed to. What it owes the caller is an error that
// names the path that does work — that is the whole trap this check exists to keep shut.
await resolveInstalledAlgorithm("xtyle-default").then(
  () => { throw new Error("@xtyle/core/host resolved without an algorithms/ directory; it is the disk twin and should not"); },
  (err) => {
    if (!err.message.includes("@xtyle/core/algorithms")) {
      throw new Error("the disk twin's error does not point at the filesystem-free path: " + err.message);
    }
  },
);

// The old export name is a compatibility promise to anyone already on it, and only a real install can
// prove it survived the build and the exports map rather than merely existing in source.
if (deprecatedAlias !== resolveInstalledAlgorithm) {
  throw new Error("the deprecated resolveAlgorithm alias is missing or is not the same function");
}

console.log("packaged resolution OK — " + ids.length + " algorithms, icon mark baked, disk twin errors correctly");
`,
	);

	console.log("resolving + baking from the installed package");
	process.stdout.write(run("node", ["probe.mjs"], project));
	console.log("check-packaged-resolution: PASS");
} catch (err) {
	failed = true;
	console.error("check-packaged-resolution: FAIL");
	console.error(err.stdout ?? "");
	console.error(err.stderr ?? err.message);
} finally {
	rmSync(scratch, { recursive: true, force: true });
}

process.exit(failed ? 1 : 0);
