import { schemeOf } from "../color.js";
import type { EmitOptions, TokenRegister } from "../types.js";

export function emitCss(register: TokenRegister, opts: EmitOptions = {}): string {
	const selector = opts.selector ?? ":root";
	const lines = Object.keys(register)
		.sort()
		.filter((name) => emittable(name, register[name]))
		.map((name) => `\t${normalizeName(name)}: ${register[name]};`);
	const bg = register["--bg-0"] ?? register["bg-0"];
	const scheme = bg ? `\tcolor-scheme: ${schemeOf(bg)};\n` : "";
	const hasScrollbar =
		register["--scrollbar-thumb"] !== undefined && register["--scrollbar-track"] !== undefined;
	const scrollbar =
		opts.scrollbars !== false && hasScrollbar
			? "\tscrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);\n"
			: "";
	return `${selector} {\n${scheme}${scrollbar}${lines.join("\n")}\n}\n`;
}

function normalizeName(name: string): string {
	return name.startsWith("--") ? name : `--${name}`;
}

const CUSTOM_PROPERTY = /^--[A-Za-z0-9_-]+$/;
const CLOSES_A_DECLARATION = /[;{}]|<\//;

/**
 * A register is data, and a theme file is data that can arrive from anywhere — a pasted export, a
 * pack fetched off a URL. Both halves of a declaration land in CSS text verbatim, so a value that
 * closes the rule and opens another is a stylesheet the author never wrote. Refused rather than
 * escaped, because there is no legitimate token whose name is not a custom property or whose value
 * carries a brace, and quietly repairing one would teach an author that it worked.
 */
function emittable(name: string, value: string | undefined): boolean {
	if (value === undefined) return false;
	if (!CUSTOM_PROPERTY.test(normalizeName(name))) {
		console.warn(`xtyle: dropped "${name}" — a token name must be a CSS custom property, and this one would not emit as a declaration`);
		return false;
	}
	if (CLOSES_A_DECLARATION.test(value)) {
		console.warn(`xtyle: dropped "${name}" — its value carries a character that ends the declaration, which is a stylesheet, not a token`);
		return false;
	}
	return true;
}
