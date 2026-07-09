import { schemeOf } from "./color.js";
import { emitCss } from "./emit/index.js";
import type { TokenRegister } from "./types.js";

export interface ApplyOptions {
	target?: HTMLElement;
	persistKey?: string;
}

/**
 * Fired on `document` after a theme is applied to any target (`:root` or a scoped subtree). Elements
 * that bake colors from the live cascade (the charts, the ramps) listen for it and re-resolve, so a
 * theme swap under an already-mounted element recolors it instead of leaving it frozen on the palette
 * it read at mount. Each listener re-reads its own cascade, so a scoped apply colors only its subtree.
 */
export const THEME_APPLY_EVENT = "xtyle:theme-apply";

function normalize(name: string): string {
	return name.startsWith("--") ? name : `--${name}`;
}

export function apply(register: TokenRegister, opts: ApplyOptions = {}): void {
	const target = opts.target ?? document.documentElement;
	for (const [name, value] of Object.entries(register)) {
		target.style.setProperty(normalize(name), value);
	}
	const bg = register["--bg-0"] ?? register["bg-0"];
	if (bg) target.style.colorScheme = schemeOf(bg);
	if (opts.persistKey) persist(opts.persistKey, register);
	if (typeof document !== "undefined") {
		document.dispatchEvent(new CustomEvent(THEME_APPLY_EVENT, { detail: { target } }));
	}
}

export function clear(register: TokenRegister, target: HTMLElement = document.documentElement): void {
	for (const name of Object.keys(register)) {
		target.style.removeProperty(normalize(name));
	}
	target.style.colorScheme = "";
}

export function toStyleSheet(register: TokenRegister): string {
	return emitCss(register);
}

export function persist(key: string, register: TokenRegister): void {
	localStorage.setItem(key, JSON.stringify(register));
}

export function restore(key: string, opts: ApplyOptions = {}): TokenRegister | null {
	const raw = localStorage.getItem(key);
	if (!raw) return null;
	const register = JSON.parse(raw) as TokenRegister;
	apply(register, opts);
	return register;
}
