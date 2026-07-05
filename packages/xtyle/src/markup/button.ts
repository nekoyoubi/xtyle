import type { Size } from "../vocab.js";

export type ButtonSize = Size | "xs";

/** The host-layout rules for a button — the `:host` rules, shared by the element's scaffold and the SSR declarative shadow root. */
export const buttonHostCss = `:host { display: inline-flex; } :host([block]) { display: flex; }`;
