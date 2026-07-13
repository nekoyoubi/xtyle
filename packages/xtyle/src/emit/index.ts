import type { Emitter, EmitFormat, TokenRegister } from "../types.js";
import { emitCss } from "./css.js";
import { emitJson } from "./json.js";
import { emitMonaco } from "./monaco.js";
import { emitPrism } from "./prism.js";
import { emitTerminal } from "./terminal.js";

const registry = new Map<string, Emitter>([
	["css", emitCss],
	["json", emitJson],
	["prism", emitPrism],
	["monaco", emitMonaco],
	["terminal", emitTerminal],
]);

export function registerEmitter(format: string, emitter: Emitter): void {
	registry.set(format, emitter);
}

export function emitters(): string[] {
	return [...registry.keys()];
}

export function emit(register: TokenRegister, format: EmitFormat | string): string {
	const emitter = registry.get(format);
	if (!emitter) {
		throw new Error(
			`xtyle: no emitter for format "${format}" (known: ${emitters().join(", ")})`,
		);
	}
	return emitter(register);
}

export { emitCss, emitJson, emitMonaco, emitPrism, emitTerminal };
