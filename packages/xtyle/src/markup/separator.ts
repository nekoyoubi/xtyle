import { ORIENTATIONS, SEPARATOR_VARIANTS, SEPARATOR_SIZES } from "../vocab.js";
export type Orientation = (typeof ORIENTATIONS)[number];
export type SeparatorVariant = (typeof SEPARATOR_VARIANTS)[number];
export type SeparatorSize = (typeof SEPARATOR_SIZES)[number];

/** The host-layout rules for a separator — the `:host` rules, shared by the element's scaffold and the SSR declarative shadow root. */
export const separatorHostCss =
	`:host { display: block; } :host([orientation="vertical"]) { display: inline-flex; height: 100%; }`;
