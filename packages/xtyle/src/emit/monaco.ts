import { formatCss, schemeOf, toOklchColor } from "../color.js";
import type { TokenRegister } from "../types.js";

// Each code scope maps to the Monaco/TextMate token names it should colour. Monaco
// matches rules by token-name prefix, so listing the common scopes folds the long
// tail onto the canonical family the same way the Prism emitter does.
const SCOPE_RULES: Record<string, string[]> = {
	comment: ["comment"],
	keyword: ["keyword", "storage", "keyword.control"],
	string: ["string", "string.value"],
	number: ["number", "constant.numeric"],
	function: ["function", "entity.name.function", "support.function"],
	type: [
		"type",
		"type.identifier",
		"class",
		"struct",
		"interface",
		"enum",
		"support.type",
		"support.class",
		"entity.name.type",
		"entity.name.class",
	],
	variable: ["variable", "identifier", "parameter", "property", "member"],
	operator: ["operator"],
	punctuation: ["delimiter", "delimiter.bracket", "delimiter.parenthesis", "delimiter.square"],
	tag: ["tag", "entity.name.tag", "metatag"],
	attr: ["attribute.name", "entity.other.attribute-name"],
	regexp: ["regexp", "string.regexp"],
};

/**
 * Emit a Monaco `IStandaloneThemeData` object that colours the editor from the
 * derived `--code-*` family. Monaco wants opaque rule foregrounds as bare 6-digit
 * hex and workbench `colors` as `#rrggbb[aa]`, so the engine's CSS values (which can
 * be `rgba(...)`) are normalised through the same OKLCH round-trip the core uses.
 */
export function emitMonaco(register: TokenRegister): string {
	// `formatCss` renders alpha colours as `rgba(...)`; Monaco only speaks hex, so
	// fold both of its output shapes into `#rrggbb` / `#rrggbbaa`.
	const hex = (token: string): string | undefined => {
		const value = register[token];
		if (!value) return undefined;
		const css = formatCss(toOklchColor(value));
		if (css.startsWith("#")) return css;
		const parts = css
			.match(/rgba?\(([^)]+)\)/)?.[1]
			?.split(",")
			.map((s) => s.trim());
		if (!parts) return css;
		const byte = (n: number): string => Math.round(n).toString(16).padStart(2, "0");
		const [r, g, b] = parts.slice(0, 3).map((n) => byte(Number.parseFloat(n)));
		const a = parts[3] === undefined ? "" : byte(Number.parseFloat(parts[3]) * 255);
		return `#${r}${g}${b}${a}`;
	};

	const rules: Array<{ token: string; foreground: string }> = [];
	for (const [role, tokens] of Object.entries(SCOPE_RULES)) {
		const fg = hex(`--code-${role}`);
		if (!fg) continue;
		const foreground = fg.slice(1, 7);
		for (const token of tokens) rules.push({ token, foreground });
	}

	const bg = register["--code-bg"];
	const base = bg && schemeOf(bg) === "light" ? "vs" : "vs-dark";

	const colors: Record<string, string> = {};
	const color = (key: string, token: string): void => {
		const v = hex(token);
		if (v) colors[key] = v;
	};
	color("editor.background", "--code-bg");
	color("editor.foreground", "--code-fg");
	color("editor.lineHighlightBackground", "--code-line-highlight");
	color("editor.selectionBackground", "--code-selection");

	return `${JSON.stringify({ base, inherit: true, rules, colors }, null, 2)}\n`;
}
