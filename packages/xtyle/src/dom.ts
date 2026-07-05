import { schemeOf } from "./color.js";
import { emitCss } from "./emit/index.js";
import type { TokenRegister } from "./types.js";

export interface ApplyOptions {
	target?: HTMLElement;
	persistKey?: string;
}

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
