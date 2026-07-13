import { schemeOf } from "../color.js";
import type { TokenRegister } from "../types.js";

export function emitCss(register: TokenRegister): string {
	const lines = Object.keys(register)
		.sort()
		.map((name) => `\t${normalizeName(name)}: ${register[name]};`);
	const bg = register["--bg-0"] ?? register["bg-0"];
	const scheme = bg ? `\tcolor-scheme: ${schemeOf(bg)};\n` : "";
	const hasScrollbar =
		register["--scrollbar-thumb"] !== undefined && register["--scrollbar-track"] !== undefined;
	const scrollbar = hasScrollbar
		? "\tscrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);\n"
		: "";
	return `:root {\n${scheme}${scrollbar}${lines.join("\n")}\n}\n`;
}

function normalizeName(name: string): string {
	return name.startsWith("--") ? name : `--${name}`;
}
