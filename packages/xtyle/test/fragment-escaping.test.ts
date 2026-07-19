import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { escapeAttr, escapeHtml } from "../src/elements/fragments/escape.js";

const here = dirname(fileURLToPath(import.meta.url));
const fragments = resolve(here, "../src/elements/fragments");
const modIds = readdirSync(fragments, { withFileTypes: true })
	.filter((e) => e.isDirectory())
	.map((e) => e.name)
	.filter((id) => {
		try {
			readFileSync(resolve(fragments, id, "mod.ts"), "utf8");
			return true;
		} catch {
			return false;
		}
	});

// Normalized so the scan is a function of the source rather than of the checkout's line endings — a
// CRLF working copy would otherwise slip past the declaration matching below and quietly under-report.
const read = (id: string): string => readFileSync(resolve(fragments, id, "mod.ts"), "utf8").replace(/\r\n/g, "\n");

/**
 * Every `${…}` inside a template literal that builds markup, with balanced-brace matching so a nested
 * object or ternary doesn't truncate the expression.
 */
function markupInterpolations(src: string): { expr: string; context: "attr" | "text" | "other" }[] {
	const out: { expr: string; context: "attr" | "text" | "other" }[] = [];
	for (let i = 0; i < src.length; i++) {
		if (src[i] !== "`") continue;
		let j = i + 1;
		const spans: { expr: string; before: string }[] = [];
		while (j < src.length) {
			const c = src[j];
			if (c === "\\") {
				j += 2;
				continue;
			}
			if (c === "$" && src[j + 1] === "{") {
				const start = j + 2;
				let depth = 1;
				let k = start;
				while (k < src.length && depth > 0) {
					if (src[k] === "{") depth++;
					else if (src[k] === "}") depth--;
					if (depth === 0) break;
					k++;
				}
				spans.push({ expr: src.slice(start, k), before: src.slice(i, j) });
				j = k + 1;
				continue;
			}
			if (c === "`") break;
			j++;
		}
		const literal = src.slice(i, j + 1);
		if (/<[a-z]|="/.test(literal)) {
			for (const s of spans) {
				const context = /=["']\s*$/.test(s.before) ? "attr" : />\s*$/.test(s.before) ? "text" : "other";
				out.push({ expr: s.expr, context });
			}
		}
		i = j;
	}
	return out;
}

/** The `string`-typed member names declared in one interface body. */
function stringMembers(body: string): Set<string> {
	const fields = new Set<string>();
	for (const line of body.split("\n")) {
		const decl = line.trim().match(/^(\w+)\??\s*:\s*(.+?);/);
		if (decl && /\bstring\b/.test(decl[2]) && !/string\[\]/.test(decl[2])) fields.add(decl[1]);
	}
	return fields;
}

/** Every interface in the file, by name — the lookup for `tabs?: TabItem[]`-shaped bindings. */
function interfaceTable(src: string): Map<string, Set<string>> {
	const table = new Map<string, Set<string>>();
	for (const m of src.matchAll(/interface\s+(\w+)\s*\{([\s\S]*?)\n\}/g)) table.set(m[1], stringMembers(m[2]));
	return table;
}

/** The `string`-typed fields of a mod's own bindings interface — its author-controlled surface. */
function stringBindingFields(src: string): Set<string> {
	const block = src.match(/interface\s+\w*Bindings\s*\{([\s\S]*?)\n\}/);
	return block ? stringMembers(block[1]) : new Set();
}

/**
 * Author strings that arrive as members of a *collection* binding — `tabs?: TabItem[]` carrying
 * `key` and `label` — rather than as a field on the bindings object itself. They are interpolated
 * through a loop variable (`tabs.map((tab) => …${tab.label}…)`), so nothing about the expression
 * mentions `bindings`, and a check keyed on `b.<field>` is structurally blind to all of them. That
 * blindness is not a narrow gap: `tabs` reaches `data-key="${key}"` and `${tab.label}` through it.
 *
 * Member names are collected across every collection binding and matched on any receiver, which
 * over-approximates rather than under-approximates — the failure this guards against is a hole that
 * reads as green, so a false positive to inspect is the cheaper direction to be wrong in.
 */
function collectionStringMembers(src: string): Set<string> {
	const block = src.match(/interface\s+\w*Bindings\s*\{([\s\S]*?)\n\}/);
	if (!block) return new Set();
	const table = interfaceTable(src);
	const members = new Set<string>();
	for (const line of block[1].split("\n")) {
		const decl = line.trim().match(/^\w+\??\s*:\s*(.+?);/);
		if (!decl) continue;
		const type = decl[1];
		const named = type.match(/\b(\w+)\[\]/) ?? type.match(/Array<\s*(\w+)\s*>/);
		if (named && table.has(named[1])) {
			for (const n of table.get(named[1])!) members.add(n);
			continue;
		}
		const inline = type.match(/\{([^}]*)\}\s*(?:\[\]|>)/);
		if (inline) for (const n of stringMembers(inline[1].replace(/;/g, ";\n"))) members.add(n);
	}
	return members;
}

describe("fragment escaping", () => {
	// Mods build markup as template-literal strings, which escape nothing for free. Six different local
	// escapers used to exist across these files, under six names and four implementations, which meant
	// any check like this one had to enumerate every variant to recognise a safe call — and silently
	// stopped covering a mod the moment someone invented a seventh name. One shared module removes that
	// failure mode: the set of escapers is closed, so "is this call safe" is decidable.
	it("no mod defines its own escaper", () => {
		const offenders = modIds.filter((id) =>
			/function\s+(esc|escAttr|escape|escapeAttr|escapeHtml|escapeCaption)\s*\(/.test(read(id)),
		);
		expect(offenders).toEqual([]);
	});

	it("every mod that escapes imports from the shared module", () => {
		const offenders = modIds.filter((id) => {
			const src = read(id);
			const uses = /\b(escapeAttr|escapeHtml)\s*\(/.test(src);
			return uses && !/from "\.\.\/escape\.js"/.test(src);
		});
		expect(offenders).toEqual([]);
	});

	// The regression guard proper: a `string` binding interpolated straight into an attribute value or a
	// text node, with no escaper around it, is an injection hole — `alert` shipped one for its
	// `dismiss-label`. Interpolations in neither position ("other") are composing already-built markup
	// fragments, which must NOT be escaped or the markup would be double-encoded.
	//
	// Tracking the binding one assignment deep is what makes this catch anything: mods overwhelmingly
	// read the binding into a local first (`const label = b.dismissLabel ?? "Dismiss"`) and interpolate
	// the local, so a check that only matched `b.<field>` at the interpolation would pass over the very
	// hole it was written for. A local that builds markup is excluded — interpolating it is composition,
	// not output, and the values inside it are checked where they are written.
	it("no string binding reaches attribute or text position unescaped", () => {
		const escaped = /\b(escapeAttr|escapeHtml|escapeSelectorValue)\s*\(/;
		const holes: string[] = [];
		for (const id of modIds) {
			const src = read(id);
			const fields = stringBindingFields(src);
			const itemMembers = collectionStringMembers(src);
			if (!fields.size && !itemMembers.size) continue;

			// A local function that returns markup owns its own escaping, exactly as an imported helper
			// does — `navButton(…)` renders a whole `<button>` and escapes the label inside itself. A
			// local assigned from one holds composed markup, so interpolating it is composition; escaping
			// it would encode the element into visible text.
			const markupHelpers = new Set(
				[...src.matchAll(/function\s+(\w+)\s*\([^)]*\)[^{]*\{([\s\S]*?)\n\}/g)]
					.filter(([, , body]) => /return\s*[`"']\s*<[a-z/]/.test(body) || /`\s*<[a-z]/.test(body))
					.map(([, name]) => name),
			);

			const carriesBinding = new Set<string>();
			for (const [, name, init] of src.matchAll(/\b(?:const|let)\s+(\w+)\s*(?::[^=]+)?=\s*([\s\S]{0,400}?);\n/g)) {
				if (escaped.test(init) || /[`"']\s*<[a-z/]|="/.test(init) || /\.map\(|\.join\(/.test(init)) continue;
				if ([...markupHelpers].some((fn) => new RegExp(`\\b${fn}\\s*\\(`).test(init))) continue;
				if ([...init.matchAll(/\b(?:b|bindings)\.(\w+)\b/g)].some((m) => fields.has(m[1]))) carriesBinding.add(name);
			}

			for (const { expr, context } of markupInterpolations(src)) {
				if (context === "other" || escaped.test(expr)) continue;

				// Three shapes where an author value is *consumed* rather than emitted, so what reaches the
				// output is never the author's string and escaping it would corrupt the real value:
				//   - indexing a module-level table — `TREND_ICON[trend]` emits the mod's own markup;
				//   - a lookup argument — `selected.has(item.value)` emits a boolean;
				//   - an imported helper — `renderIcon(tab.icon)` emits markup the helper owns, and is
				//     responsible for escaping at its own boundary.
				// Strip all three, then ask whether anything author-controlled is still being written.
				const imported = [...src.matchAll(/import \{([^}]+)\} from "[^"]+";/g)]
					.flatMap((m) => m[1].split(",").map((s) => s.trim().split(/\s+as\s+/).pop()!))
					.filter((n) => !/^escape/.test(n));
				let reduced = expr.replace(/\b[A-Z][A-Z0-9_]*\s*\[[^\]]*\]/g, "");
				reduced = reduced.replace(/\.(?:has|includes|get|indexOf)\s*\([^)]*\)/g, "");
				for (const fn of imported) reduced = reduced.replace(new RegExp(`\\b${fn}\\s*\\([^)]*\\)`, "g"), "");

				const direct = [...reduced.matchAll(/\b(?:b|bindings)\.(\w+)\b/g)].map((m) => m[1]);
				const viaLocal = [...reduced.matchAll(/\b([A-Za-z_$][\w$]*)\b/g)].map((m) => m[1]);
				const viaItem = [...reduced.matchAll(/\b[A-Za-z_$][\w$]*\.(\w+)\b/g)].map((m) => m[1]);
				if (
					direct.some((n) => fields.has(n)) ||
					viaLocal.some((n) => carriesBinding.has(n)) ||
					viaItem.some((n) => itemMembers.has(n))
				) {
					holes.push(`${id}: \${${expr.trim()}}`);
				}
			}
		}
		expect(holes).toEqual([]);
	});

	it("escapes the characters that break out of attributes and text", () => {
		expect(escapeHtml('a&b<c>d')).toBe("a&amp;b&lt;c&gt;d");
		expect(escapeAttr('" onload="x')).toBe("&quot; onload=&quot;x");
		expect(escapeAttr("it's")).toBe("it&#39;s");
		expect(escapeAttr("&")).toBe("&amp;");
	});
});
