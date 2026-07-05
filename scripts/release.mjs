#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { execSync, spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

const pkg = JSON.parse(readFileSync(resolve(root, "packages/xtyle/package.json"), "utf8"));
const version = pkg.version;
const tag = `v${version}`;

const branch = execSync("git branch --show-current", { cwd: root, encoding: "utf8" }).trim();
if (branch !== "main") {
	console.error(`You're on '${branch}', not 'main'. Switch to main before releasing.`);
	process.exit(1);
}

const status = execSync("git diff --stat HEAD", { cwd: root, encoding: "utf8" }).trim();
if (status) {
	console.error("Tracked files have uncommitted changes. Commit or stash first.");
	process.exit(1);
}

execSync("git fetch origin main", { cwd: root, stdio: "inherit" });
const behind = execSync("git rev-list HEAD..origin/main --count", { cwd: root, encoding: "utf8" }).trim();
if (behind !== "0") {
	console.error(`Local main is ${behind} commit(s) behind origin. Pull first.`);
	process.exit(1);
}

const changelog = readFileSync(resolve(root, "CHANGELOG.md"), "utf8");
const headerPattern = new RegExp(`^## ${tag.replace(/\./g, "\\.")}\\b(.*)$`, "m");
const match = changelog.match(headerPattern);
if (!match) {
	console.error(`No changelog entry found for ${tag} in CHANGELOG.md. Add one before releasing.`);
	process.exit(1);
}

const headerIndex = changelog.indexOf(match[0]);
const afterHeader = changelog.slice(headerIndex + match[0].length);
const nextHeader = afterHeader.search(/^## /m);
const body = (nextHeader === -1 ? afterHeader : afterHeader.slice(0, nextHeader)).trim();

const theme = match[1].replace(/^\s*[—:]\s*/, "").trim();
const title = theme ? `${tag}: ${theme}` : tag;

console.log(`Releasing ${title}`);
console.log(`  version: ${version} (from packages/xtyle)`);
console.log(`  body:    ${body.split("\n").length} lines from CHANGELOG.md\n`);

const tagExists = spawnSync("git", ["rev-parse", "-q", "--verify", `refs/tags/${tag}`], { cwd: root }).status === 0;
if (!tagExists) {
	execSync(`git tag -a ${tag} -m "${title}"`, { cwd: root, stdio: "inherit" });
	execSync(`git push origin ${tag}`, { cwd: root, stdio: "inherit" });
	console.log(`Annotated tag ${tag} created and pushed.`);
}

spawnSync("gh", ["release", "create", tag, "--title", title, "--notes-file", "-"], {
	cwd: root,
	input: body,
	stdio: ["pipe", "inherit", "inherit"],
});

console.log(`\nRelease ${tag} created. Publish workflows should fire momentarily.`);
console.log(`View at: https://github.com/nekoyoubi/xtyle/releases/tag/${tag}`);
