import type { RampScheme, SeriesScheme } from "../series.js";

// A continuous grid keys off a `RampScheme` (accent / thermal / status); a `categorical` grid keys
// each column off a `SeriesScheme` (accents / skittles / statuses). The prop is shared across both
// modes, so its type is the union of what either mode accepts, plus an explicit `string[]` of colors.
export type HeatmapScheme = RampScheme | SeriesScheme | string[];

/** Shared by the element's scaffold and the SSR shadow root. */
export const heatmapHostCss = ":host { display: block; }";
