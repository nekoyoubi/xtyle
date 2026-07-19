import { SWATCH_SIZES } from "../vocab.js";
export type SwatchSize = (typeof SWATCH_SIZES)[number];

/** The host-layout rule for a swatch — shared by the element's scaffold and the SSR declarative shadow root. */
export const swatchHostCss = `:host { display: inline-flex; }`;
