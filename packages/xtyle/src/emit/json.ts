import type { TokenRegister } from "../types.js";

export function emitJson(register: TokenRegister): string {
	const flat: TokenRegister = {};
	for (const name of Object.keys(register).sort()) {
		flat[name] = register[name] as string;
	}
	return `${JSON.stringify(flat, null, 2)}\n`;
}
