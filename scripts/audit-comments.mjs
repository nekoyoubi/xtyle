#!/usr/bin/env node
/**
 * Fails on net-new narrative inline `//` comments.
 *
 * The project policy is that a comment only earns its place when it carries information the code,
 * a type, or a JSDoc block cannot. That is a judgment call made hundreds of times per branch, and
 * judgment does not scale, so this gate makes the common case mechanical: a new `//` comment must
 * open with one of the tags below, which is a claim about *which* exception it falls under. An
 * untagged one is reported for comparison against the policy.
 *
 * A tag is not a way to keep a comment. It labels the rare comment that already survived the
 * question "can the code say this?" — relabeling narrative prose to clear this gate defeats it.
 *
 * Usage:
 *   node scripts/audit-comments.mjs              # net-new vs main (commits + working tree)
 *   node scripts/audit-comments.mjs --base <ref>
 *   node scripts/audit-comments.mjs --all        # whole tree, for measuring the backlog
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const TAGS = ["TODO", "FIXME", "HACK", "INFO", "PERF", "SAFETY"];
const TAGGED = new RegExp(`^//\\s*(${TAGS.join("|")}):\\s*\\S`);
/** Tool directives (`@vitest-environment`, `ts-expect-error`, linter pragmas) are instructions, not prose. */
const DIRECTIVE = /^\/\/\s*(@[\w-]+|(ts|eslint|prettier|biome|oxlint|dprint|deno|istanbul|c8|v8)[- ])/;
const EXTENSIONS = [".ts", ".tsx", ".mts", ".mjs", ".js", ".astro", ".svelte"];
const SKIP = [
	/\/dist\//,
	/\/node_modules\//,
	/\.generated\./,
	/\/fragments\/[^/]+\/mod\.js$/,
	/(^|\/)algorithms\/[^/]+\/src\/mod\.js$/,
	/(^|\/)packs\/[^/]+\/[^/]+\/src\/mod\.js$/,
];

/** A file whose first line marks it build-output. Generated files carry whatever their generator emits. */
const isGenerated = (source) => source.startsWith("// GENERATED");

const argv = process.argv.slice(2);
const all = argv.includes("--all");
const base = argv.includes("--base") ? argv[argv.indexOf("--base") + 1] : "main";

const git = (...a) => execFileSync("git", a, { encoding: "utf8", maxBuffer: 512 * 1024 * 1024 });

const auditable = (file) =>
	EXTENSIONS.some((e) => file.endsWith(e)) && !SKIP.some((re) => re.test(file.replace(/\\/g, "/")));

/**
 * Line numbers sitting inside a template literal, which in this repo means a code *sample* rendered
 * into the docs. A comment there is the sample explaining itself to a reader and is none of this
 * gate's business. Backtick parity is a heuristic, and it errs toward skipping — the safe direction
 * for a blocking check.
 */
const templateLinesCache = new Map();
function templateLines(file) {
	if (templateLinesCache.has(file)) return templateLinesCache.get(file);
	const inside = new Set();
	let source;
	try {
		source = readFileSync(file, "utf8");
	} catch {
		templateLinesCache.set(file, inside);
		return inside;
	}
	let open = false;
	source.split("\n").forEach((line, i) => {
		if (open) inside.add(i + 1);
		let ticks = 0;
		for (let c = 0; c < line.length; c++) {
			if (line[c] === "`" && line[c - 1] !== "\\") ticks++;
		}
		if (ticks % 2 === 1) {
			open = !open;
			if (open) inside.add(i + 1);
		}
	});
	templateLinesCache.set(file, inside);
	return inside;
}

/** A `//` line comment, ignoring `///` and `//!` doc comments. */
const commentText = (line) => {
	const trimmed = line.trim();
	if (!trimmed.startsWith("//")) return null;
	if (trimmed.startsWith("///") || trimmed.startsWith("//!")) return null;
	return trimmed;
};

/**
 * A continuation of a tagged comment: the line above it is part of the same block and that block
 * opened with a tag. Only one continuation line is allowed, keeping a survivor to two lines.
 */
function offenders(lines) {
	const out = [];
	for (let i = 0; i < lines.length; i++) {
		const { text, line, file } = lines[i];
		if (TAGGED.test(text) || DIRECTIVE.test(text)) continue;
		if (templateLines(file).has(line)) continue;
		const prev = lines[i - 1];
		const continues =
			prev && prev.file === file && prev.line === line - 1 && TAGGED.test(prev.text);
		if (continues) continue;
		out.push(lines[i]);
	}
	return out;
}

function fromTree() {
	const files = git("ls-files").split("\n").filter(Boolean).filter(auditable);
	const found = [];
	for (const file of files) {
		let source;
		try {
			source = readFileSync(file, "utf8");
		} catch {
			continue;
		}
		if (isGenerated(source)) continue;
		source.split("\n").forEach((raw, i) => {
			const text = commentText(raw);
			if (text) found.push({ file, line: i + 1, text });
		});
	}
	return found;
}

function fromDiff() {
	let mergeBase;
	try {
		mergeBase = git("merge-base", "HEAD", base).trim();
	} catch {
		console.log(`audit-comments: no merge base with ${base}; nothing to compare`);
		process.exit(0);
	}
	if (mergeBase === git("rev-parse", "HEAD").trim()) {
		console.log(`audit-comments: HEAD is at ${base}; nothing new to audit`);
		process.exit(0);
	}

	// INFO: git diff omits untracked paths, so a brand-new file's comments would clear the gate;
	// scan untracked files separately
	const found = [];
	for (const file of git("ls-files", "--others", "--exclude-standard").split("\n").filter(Boolean)) {
		if (!auditable(file)) continue;
		let source;
		try {
			source = readFileSync(file, "utf8");
		} catch {
			continue;
		}
		if (isGenerated(source)) continue;
		source.split("\n").forEach((raw, i) => {
			const text = commentText(raw);
			if (text) found.push({ file, line: i + 1, text });
		});
	}

	const diff = git("diff", "--unified=0", mergeBase);
	let file = null;
	let line = 0;
	for (const raw of diff.split("\n")) {
		if (raw.startsWith("+++ b/")) {
			file = raw.slice(6);
			continue;
		}
		if (raw.startsWith("@@")) {
			const m = /\+(\d+)/.exec(raw);
			line = m ? Number.parseInt(m[1], 10) : 0;
			continue;
		}
		if (!raw.startsWith("+") || raw.startsWith("+++")) continue;
		if (file && auditable(file)) {
			const text = commentText(raw.slice(1));
			if (text) found.push({ file, line, text });
		}
		line++;
	}
	return found;
}

const found = all ? fromTree() : fromDiff();
const bad = offenders(found);

if (bad.length === 0) {
	console.log(`audit-comments: ${found.length} inline comment(s) checked, all accounted for`);
	process.exit(0);
}

const byFile = new Map();
for (const o of bad) {
	if (!byFile.has(o.file)) byFile.set(o.file, []);
	byFile.get(o.file).push(o);
}

console.error(`\naudit-comments: ${bad.length} untagged inline comment(s) in ${byFile.size} file(s)\n`);
for (const [file, entries] of [...byFile].sort((a, b) => b[1].length - a[1].length)) {
	console.error(`  ${file}`);
	for (const e of entries.slice(0, 6)) {
		const text = e.text.length > 96 ? `${e.text.slice(0, 93)}...` : e.text;
		console.error(`    ${e.line}: ${text}`);
	}
	if (entries.length > 6) console.error(`    ... and ${entries.length - 6} more`);
}
console.error(
	`\nDelete these, or state which exception each falls under with a tag: ${TAGS.map((t) => `${t}:`).join(" ")}` +
		`\nA tag is not a way to keep a comment. See the comment rule in CLAUDE.md.\n`,
);
process.exit(1);
