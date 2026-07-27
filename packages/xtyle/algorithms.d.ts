import type { Algorithm } from "@xtyle/core";

export declare const xtyleDefault: Algorithm;
export declare const xtyleHc: Algorithm;
export declare const xtyleQuiet: Algorithm;
export declare const xtyleLoud: Algorithm;
export declare const nxiNite: Algorithm;
// INFO: only the natively-baked subset, keyed by id — not every installed algorithm (those are found by scanning).
export declare const bakedAlgorithms: Record<string, Algorithm>;
export declare function getAlgorithm(id: string): Algorithm;

// INFO: resolveAlgorithm loads the shipped mod via the zero-authority sandbox; snapshotAlgorithm returns it once
// resolve settles, else null; getAlgorithm is the synchronous baked fallback.
export declare function resolveAlgorithm(id: string): Promise<Algorithm>;
export declare function snapshotAlgorithm(id: string): Algorithm | null;

// INFO: returns the sandboxed mod once resolveAlgorithm(id) has warmed, and the synchronous baked oracle until then.
export declare function hostedAlgorithm(id: string): Algorithm;

export { derive, deriveTraced, emit, emitCss, emitJson } from "@xtyle/core";
