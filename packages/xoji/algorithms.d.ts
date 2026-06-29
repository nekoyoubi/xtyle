import type { Algorithm } from "@xoji/core";

export declare const xojiDefault: Algorithm;
export declare const xojiHc: Algorithm;
export declare const xojiQuiet: Algorithm;
export declare const xojiLoud: Algorithm;
export declare const nxiNite: Algorithm;
export declare const algorithms: Record<string, Algorithm>;
export declare function getAlgorithm(id: string): Algorithm;

// The pure-derive path, re-exported so the whole thing is reachable from this one entry:
// `import { derive, getAlgorithm, emitCss } from "@xoji/core/algorithms"`.
export { derive, deriveTraced, emit, emitCss, emitJson } from "@xoji/core";
