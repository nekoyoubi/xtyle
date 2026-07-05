import type { TokenRegister } from "../types.js";

const SCOPE_SELECTORS: Record<string, string[]> = {
	comment: [".token.comment", ".token.prolog", ".token.doctype", ".token.cdata"],
	punctuation: [".token.punctuation"],
	tag: [".token.tag", ".token.property", ".token.symbol", ".token.deleted"],
	number: [".token.number", ".token.boolean", ".token.constant"],
	string: [".token.string", ".token.char", ".token.selector", ".token.inserted"],
	attr: [".token.attr-name"],
	operator: [".token.operator", ".token.entity", ".token.url"],
	keyword: [".token.keyword", ".token.atrule", ".token.attr-value"],
	function: [".token.function"],
	type: [".token.class-name", ".token.builtin"],
	regexp: [".token.regex", ".token.important"],
	variable: [".token.variable"],
};

const CONTAINER = 'code[class*="language-"], pre[class*="language-"]';

/**
 * Emit a Prism-compatible stylesheet that maps Prism's token classes onto the
 * derived `--code-*` family. Rules reference the custom properties (with the
 * resolved value as a static fallback), so a themed page re-colours live as the
 * theme switches, and a copied-out sheet still works standalone.
 */
export function emitPrism(register: TokenRegister): string {
	const ref = (token: string): string => {
		const value = register[token];
		return value ? `var(${token}, ${value})` : `var(${token})`;
	};

	const rules: string[] = [
		`${CONTAINER} {\n\tcolor: ${ref("--code-fg")};\n\tbackground: ${ref("--code-bg")};\n}`,
		`${CONTAINER} ::selection,\n${CONTAINER}::selection {\n\tbackground: ${ref("--code-selection")};\n}`,
		`.line-highlight {\n\tbackground: ${ref("--code-line-highlight")};\n}`,
	];

	for (const [scope, selectors] of Object.entries(SCOPE_SELECTORS)) {
		rules.push(`${selectors.join(",\n")} {\n\tcolor: ${ref(`--code-${scope}`)};\n}`);
	}

	return `${rules.join("\n\n")}\n`;
}
