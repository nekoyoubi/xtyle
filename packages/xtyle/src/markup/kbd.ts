import type { FullTone } from "../vocab.js";
import { KBD_SIZES } from "../vocab.js";

export type KbdSize = (typeof KBD_SIZES)[number];
export type KbdTone = FullTone;

/** The host-layout rule for a kbd — the one `:host` rule, shared by the element's scaffold and the SSR declarative shadow root. */
export const kbdHostCss = ":host { display: inline-block; }";
