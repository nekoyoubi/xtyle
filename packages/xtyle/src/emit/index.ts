import type { Emitter, EmitFormat, EmitOptions, TokenRegister } from "../types.js";
import { emitCss } from "./css.js";
import { emitJson } from "./json.js";
import { emitMonaco } from "./monaco.js";
import { emitPrism } from "./prism.js";
import { emitTerminal } from "./terminal.js";
import { SINCE_FLOOR, type Provenanced } from "../provenance.js";

interface RegisteredEmitter extends Provenanced {
	emit: Emitter;
}

/**
 * The emit formats, each dated.
 *
 * A format is a thing a release can add, so it is a thing a consumer can ask about by version —
 * "can I emit a Monaco theme on the version I'm pinned to" has a real answer, and it should not
 * have to be answered by reading a changelog. See `provenance.ts` for the rule and for what the
 * floor version means.
 */
const registry = new Map<string, RegisteredEmitter>([
	["css", { emit: emitCss, since: SINCE_FLOOR }],
	["json", { emit: emitJson, since: SINCE_FLOOR }],
	["prism", { emit: emitPrism, since: SINCE_FLOOR }],
	["monaco", { emit: emitMonaco, since: SINCE_FLOOR }],
	["terminal", { emit: emitTerminal, since: SINCE_FLOOR }],
]);

/** Register a format. `since` is the xtyle version it became available in; a third-party emitter
 * that omits it reads as always-present, which is right for something the host added itself. */
export function registerEmitter(format: string, emitter: Emitter, since?: string): void {
	registry.set(format, { emit: emitter, since });
}

export function emitters(): string[] {
	return [...registry.keys()];
}

/** The formats with their provenance, for anything answering a version-scoped question. */
export function emitterProvenance(): Array<{ format: string; since?: string }> {
	return [...registry.entries()].map(([format, entry]) => ({ format, since: entry.since }));
}

export function emit(
	register: TokenRegister,
	format: EmitFormat | string,
	opts?: EmitOptions,
): string {
	const emitter = registry.get(format)?.emit;
	if (!emitter) {
		throw new Error(
			`xtyle: no emitter for format "${format}" (known: ${emitters().join(", ")})`,
		);
	}
	return emitter(register, opts);
}

export { emitCss, emitJson, emitMonaco, emitPrism, emitTerminal };
