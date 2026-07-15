import type { Algorithm } from "@xtyle/core";

export declare const xtyleDefault: Algorithm;
export declare const xtyleHc: Algorithm;
export declare const xtyleQuiet: Algorithm;
export declare const xtyleLoud: Algorithm;
export declare const nxiNite: Algorithm;
// The baked oracle — the blessed algorithms compiled natively, keyed by id. Not the set of algorithms
// that exist (that is whatever is installed, discovered by scanning); the subset with a native twin.
export declare const bakedAlgorithms: Record<string, Algorithm>;
export declare function getAlgorithm(id: string): Algorithm;

// The canonical (sandboxed, byte-identical) resolver on the importable surface. `resolveAlgorithm`
// loads the shipped mod through the zero-authority sandbox; `snapshotAlgorithm` reads the resolved
// mod synchronously once `resolveAlgorithm(id)` has settled, else `null`. `getAlgorithm` stays the
// synchronous baked oracle and first-paint fallback.
export declare function resolveAlgorithm(id: string): Promise<Algorithm>;
export declare function snapshotAlgorithm(id: string): Algorithm | null;

// The snapshot/cache bridge: returns the resolved sandboxed mod once `resolveAlgorithm(id)` has
// warmed, and the synchronous baked oracle in the meantime, so a caller gets a usable algorithm
// on the first paint and the byte-identical hosted mod thereafter.
export declare function hostedAlgorithm(id: string): Algorithm;

// The pure-derive path, re-exported so the whole thing is reachable from this one entry:
// `import { derive, getAlgorithm, emitCss } from "@xtyle/core/algorithms"`.
export { derive, deriveTraced, emit, emitCss, emitJson } from "@xtyle/core";
