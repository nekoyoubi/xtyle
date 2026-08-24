import type { XriptInitOptions } from "@xriptjs/runtime";

/** A QuickJS build the sandbox can run on — one of the `@jitl/quickjs-*` variant packages. */
export type SandboxVariant = NonNullable<XriptInitOptions["variant"]>;

let variant: SandboxVariant | undefined;
let claimed = false;

/**
 * Run the sandbox on a QuickJS build of your choosing, rather than the default
 * `@jitl/quickjs-wasmfile-release-sync`.
 *
 * Components render their chrome through a sandboxed fragment runtime, and algorithms derive in one
 * too. That runtime loads a WebAssembly module which the default build fetches as a separate asset
 * relative to its own JavaScript — a fetch some bundlers break, most visibly Vite's dependency
 * pre-bundling, which rewrites the JavaScript into `node_modules/.vite/deps/` and leaves the wasm
 * behind. `viteExcludes` from `@xtyle/core/vite` is one answer. This is the other: hand xtyle a
 * `singlefile-*` variant, which carries the wasm inline as base64, and there is no asset for any
 * bundler to lose.
 *
 * ```ts
 * import { setSandboxVariant } from "@xtyle/core";
 * import variant from "@jitl/quickjs-singlefile-browser-release-sync";
 *
 * setSandboxVariant(variant);
 * ```
 *
 * The trade is the usual one and it is yours to make: inline costs every visitor the bytes up front
 * and cannot be cached separately; a separate asset is smaller and cacheable but has to survive
 * whatever your bundler does to module locations.
 *
 * Call it before anything renders — a fill loading or an algorithm deriving builds the runtime, and
 * the build is what reads this.
 *
 * @throws if a runtime has already been built, since the variant it is running on cannot be
 * swapped underneath it and a call that silently did nothing would be worse than one that says so.
 */
export function setSandboxVariant(next: SandboxVariant): void {
	if (claimed) {
		throw new Error(
			"xtyle: setSandboxVariant was called after the sandbox started; a running runtime cannot " +
				"change the QuickJS build underneath it. Call it before the first component renders or " +
				"the first theme derives.",
		);
	}
	variant = next;
}

/** Drop back to the default QuickJS build. Has no effect on a runtime already built. */
export function resetSandboxVariant(): void {
	variant = undefined;
	claimed = false;
}

/**
 * The options every `initXript` call in this package goes through, so one configured variant reaches
 * the component runtime and the algorithm host alike. Reading them is what claims the choice.
 */
export function sandboxInitOptions(): XriptInitOptions {
	claimed = true;
	return variant ? { variant } : {};
}
