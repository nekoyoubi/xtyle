import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { listComponents, derive, ICON_PRIMITIVE_NAMES, listEffects } from "@xtyle/core";
import { resolveInstalledAlgorithm } from "@xtyle/core/host";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));

const anchors = { bg: "#0b0d12", fg: "#e6e9ef", accent: "#6ea8fe" };
const algorithm = await resolveInstalledAlgorithm("xtyle-default");
const register = derive(algorithm, { anchors });
const components = listComponents();

const benchToolsSrc = readFileSync(resolve(root, "apps/site/src/data/bench-tools.ts"), "utf8");
const tools = (benchToolsSrc.match(/\bsince:\s*"/g) ?? []).length;

/**
 * The newest version tag in the repo — what actually shipped, as opposed to what is being built.
 * `package.json` is bumped at the *start* of a cycle, so it names the in-flight version from that
 * moment on and is the wrong thing to stamp a baseline with.
 */
function lastReleasedVersion() {
	try {
		const tags = execFileSync("git", ["tag", "--list", "v*", "--sort=-v:refname"], {
			cwd: root,
			encoding: "utf8",
		});
		const newest = tags.split("\n").find((line) => line.trim().length > 0);
		return newest?.trim().replace(/^v/, "") ?? null;
	} catch {
		return null;
	}
}

function compareVersions(a, b) {
	const left = a.split(".").map(Number);
	const right = b.split(".").map(Number);
	for (let i = 0; i < Math.max(left.length, right.length); i++) {
		const diff = (left[i] ?? 0) - (right[i] ?? 0);
		if (diff !== 0) return diff;
	}
	return 0;
}

const released = lastReleasedVersion();

const baseline = {
	version: released ?? pkg.version,
	components: components.length,
	tokens: Object.keys(register).length,
	categories: new Set(components.map((c) => c.category)).size,
	bindings: 3,
	primitives: ICON_PRIMITIVE_NAMES.length,
	effects: listEffects().length,
	tools,
};

const outDir = resolve(root, "apps/site/src/data");
mkdirSync(outDir, { recursive: true });
const out = resolve(outDir, "stats-baseline.json");

const previous = JSON.parse(readFileSync(out, "utf8"));

if (!released) {
	console.error(
		"xtyle: no version tag found, so there is no way to tell what has actually shipped.\n" +
			"  The baseline records the last *released* version; tag the release first.",
	);
	process.exit(1);
}

if (compareVersions(released, pkg.version) >= 0) {
	console.error(
		`xtyle: refusing to baseline against v${released} while package.json is v${pkg.version}.\n` +
			"  The baseline must stay strictly behind the in-flight version, or the site measures a\n" +
			"  release against itself: every delta reads zero and nothing the version added is badged.\n" +
			"  Bump to the next version first — re-baselining belongs at the *start* of a cycle, right\n" +
			"  after the bump, while the tree still holds the released version's numbers.",
	);
	process.exit(1);
}

if (compareVersions(released, previous.version) < 0) {
	console.error(
		`xtyle: refusing to move the baseline backwards, from v${previous.version} to v${released}.`,
	);
	process.exit(1);
}

if (!process.argv.includes("--rebaseline")) {
	console.error(
		`xtyle: refusing to overwrite the v${previous.version} baseline with v${released}.\n` +
			"  This is a once-a-cycle action whose failure mode is silent, so it has to be asked for.\n" +
			"  Pass --rebaseline when starting a new cycle, immediately after the version bump.",
	);
	process.exit(1);
}

writeFileSync(out, `${JSON.stringify(baseline, null, "\t")}\n`);
console.log(
	`xtyle: wrote stats baseline for v${baseline.version} (was v${previous.version}); in-flight is v${pkg.version}`,
	baseline,
);
