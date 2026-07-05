import type { RampScheme } from "../series.js";

export type HeatmapScheme = RampScheme | string[];

/** Shared by the element's scaffold and the SSR shadow root. */
export const heatmapHostCss = ":host { display: block; }";
