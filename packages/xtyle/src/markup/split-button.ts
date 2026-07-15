import type { Size } from "../vocab.js";

/** A split button's size, matching Button's steps so the pair can sit in the same row. */
export type SplitButtonSize = Size | "xs";

/** The host-layout rule for a split button — the `:host` rule, shared by the element's fragment scaffold and the SSR declarative shadow root. */
export const splitButtonHostCss = ":host { display: inline-flex; } :host([block]) { display: flex; }";
