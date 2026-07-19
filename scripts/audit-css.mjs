import { pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * Report what xtyle's stylesheet does to a consuming app's global scope.
 *
 * xtyle's CSS lands on top of CSS someone else already wrote. Every selector it emits that isn't
 * anchored to something xtyle owns can reach out and restyle a stranger's markup — silently, with no
 * way for them to opt out short of not adopting the library. This has bitten twice inside the library
 * already: Spinner's `[data-spinner]` erased SplitButton's busy indicator, and Alert's fallback glyph
 * borrowed Icon's `[data-icon]`. Both were xtyle-vs-xtyle; a consumer's `<div data-card>` is the same
 * collision with nobody watching.
 *
 * This reports; it does not block. A finding here is a question — "does this rule need global reach,
 * or was it written wide because that was easy?" — and the answer is a judgement call, not a gate.
 *
 * Reads the *emitted* sheets rather than the source modules, because that is what a consumer receives.
 */

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, "packages", "xtyle", "dist");

if (!existsSync(join(dist, "css", "index.js"))) {
	console.error("xtyle: build @xtyle/core first (npm run build -w @xtyle/core)");
	process.exit(1);
}

const { componentsCss, utilitiesCss } = await import(pathToFileURL(join(dist, "css", "index.js")));
const { emitCss } = await import(pathToFileURL(join(dist, "emit", "css.js")));

/** A selector anchors if its leftmost compound names something only xtyle puts in the DOM. */
const ANCHORS = [
	/\.xtyle-/,
	/^xtyle-[a-z-]+/,
	/\[data-root\]/,
	/\[class\^="xtyle-"\]/,
	/\[class\*=" xtyle-"\]/,
	/^:host/,
];

/** Global on purpose. Each entry is a claim that no scoped construct can do the job. */
const EXPECTED_GLOBAL = new Map([
	[
		":root",
		"the token block — custom properties must inherit document-wide, and color-scheme is the only " +
			"way to tell the UA to theme native controls, the canvas, and scrollbars",
	],
]);

function splitTopLevel(list, separators) {
	const out = [];
	let buf = "";
	let depth = 0;
	let quote = "";
	for (const ch of list) {
		if (quote) {
			buf += ch;
			if (ch === quote) quote = "";
			continue;
		}
		if (ch === '"' || ch === "'") {
			quote = ch;
			buf += ch;
			continue;
		}
		if (ch === "(" || ch === "[") depth++;
		else if (ch === ")" || ch === "]") depth--;
		if (depth === 0 && separators.includes(ch)) {
			out.push(buf);
			buf = "";
			continue;
		}
		buf += ch;
	}
	out.push(buf);
	return out.map((s) => s.trim()).filter(Boolean);
}

const leftmostCompound = (selector) =>
	splitTopLevel(selector, [" ", ">", "+", "~", "\t", "\n"])[0] ?? selector;

function selectorsOf(css) {
	const out = [];
	const src = css.replace(/\/\*[\s\S]*?\*\//g, "");
	let buf = "";
	let depth = 0;
	for (let i = 0; i < src.length; i++) {
		const ch = src[i];
		if (ch === "{") {
			const prelude = buf.trim();
			buf = "";
			depth++;
			if (prelude.startsWith("@")) {
				if (/^@(keyframes|font-face|property|counter-style)/.test(prelude)) {
					let d = 1;
					while (++i < src.length && d > 0) {
						if (src[i] === "{") d++;
						else if (src[i] === "}") d--;
					}
					depth--;
				}
				continue;
			}
			if (prelude) out.push(...splitTopLevel(prelude, [","]));
			continue;
		}
		if (ch === "}") {
			depth--;
			buf = "";
			continue;
		}
		buf += ch;
	}
	return out.filter(Boolean);
}

const isAnchored = (selector) => ANCHORS.some((re) => re.test(leftmostCompound(selector)));

const SHEETS = [
	["componentsCss", componentsCss],
	[
		"utilitiesCss",
		utilitiesCss(["--bg-0", "--fg-0", "--accent", "--space-2", "--radius-sm"], {
			"--bg-0": "color",
			"--fg-0": "color",
			"--accent": "color",
			"--space-2": "space",
			"--radius-sm": "radius",
		}),
	],
	["emitCss", emitCss({ "--bg-0": "#101014", "--scrollbar-thumb": "#333", "--scrollbar-track": "#111" })],
];

console.log("\nxtyle global CSS footprint — what the library does to a consumer's own styles\n");

let unanchored = 0;
let total = 0;

for (const [name, css] of SHEETS) {
	const selectors = selectorsOf(css);
	total += selectors.length;
	const loose = [...new Set(selectors.filter((s) => !isAnchored(s) && !EXPECTED_GLOBAL.has(s)))];
	const expected = [...new Set(selectors.filter((s) => EXPECTED_GLOBAL.has(s)))];
	unanchored += loose.length;

	console.log(`  ${name} — ${selectors.length} selectors`);
	for (const sel of expected) console.log(`    global, by design: ${sel}\n      ${EXPECTED_GLOBAL.get(sel)}`);
	if (loose.length === 0) {
		console.log("    every other selector anchors on an xtyle-owned hook");
	} else {
		for (const sel of loose) console.log(`    REACHES A CONSUMER'S MARKUP: ${sel}`);
	}
	console.log("");
}

const keyframes = [...componentsCss.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1]);
const bareFrames = keyframes.filter((n) => !n.startsWith("xtyle-"));
console.log(`  @keyframes — ${keyframes.length} declared, ${bareFrames.length} un-namespaced`);
if (bareFrames.length) console.log(`    COLLIDES: ${bareFrames.join(", ")}`);

const resets = selectorsOf(componentsCss).filter((s) => /^(html|body|\*)$/.test(leftmostCompound(s)));
console.log(`  reset rules on html / body / * — ${resets.length}`);
if (resets.length) console.log(`    ${resets.join(", ")}`);

console.log(
	`\n  ${total} selectors emitted, ${unanchored} reaching beyond xtyle` +
		(unanchored === 0 ? " — the sheet stays in its own house\n" : " — each is a question worth answering\n"),
);
