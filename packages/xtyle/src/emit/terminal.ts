import { cssToHex } from "../color.js";
import type { TokenRegister } from "../types.js";

const ANSI = ["black", "red", "green", "yellow", "blue", "magenta", "cyan", "white"] as const;

/**
 * Emit an xterm.js `ITheme` object from the derived `--terminal-*` family. The shape
 * (`background` / `foreground` / `cursor` / `cursorAccent`, the 8 base and 8 bright
 * ANSI colours, and an optional `selectionBackground`) is what xterm.js and the
 * emulator configs that mirror it consume, and every value is normalised to hex.
 */
export function emitTerminal(register: TokenRegister): string {
	const hex = (token: string): string | undefined => {
		const value = register[token];
		return value ? cssToHex(value) : undefined;
	};

	const theme: Record<string, string> = {};
	const put = (key: string, token: string): void => {
		const v = hex(token);
		if (v) theme[key] = v;
	};

	put("background", "--terminal-bg");
	put("foreground", "--terminal-fg");
	put("cursor", "--terminal-cursor");
	put("cursorAccent", "--terminal-cursor-accent");
	put("selectionBackground", "--selection");

	for (const name of ANSI) {
		put(name, `--terminal-${name}`);
		const bright = `bright${name.charAt(0).toUpperCase()}${name.slice(1)}`;
		put(bright, `--terminal-bright-${name}`);
	}

	return `${JSON.stringify(theme, null, 2)}\n`;
}
