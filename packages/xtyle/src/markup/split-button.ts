import { BUTTON_SIZES, SPLIT_BUTTON_VARIANTS } from "../vocab.js";

/** A split button's size, matching Button's steps so the pair can sit in the same row. */
export type SplitButtonSize = (typeof BUTTON_SIZES)[number];

/** Button's treatments minus `link`. */
export type SplitButtonVariant = (typeof SPLIT_BUTTON_VARIANTS)[number];

/** The host-layout rule for a split button — the `:host` rule, shared by the element's fragment scaffold and the SSR declarative shadow root. */
export const splitButtonHostCss = ":host { display: inline-flex; } :host([block]) { display: flex; }";
