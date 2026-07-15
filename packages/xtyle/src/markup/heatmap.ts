import type { Palette } from "../series.js";

/** Any named palette (or an explicit list of colors). A continuous grid interpolates its stops; a
 * `categorical` grid samples them, one per category. */
export type HeatmapScheme = Palette | string[];

/** Shared by the element's scaffold and the SSR shadow root. */
export const heatmapHostCss = ":host { display: block; }";
