import { TOOLTIP_PLACEMENTS } from "../vocab.js";
export type TooltipPlacement = (typeof TOOLTIP_PLACEMENTS)[number];

/** The host-layout rule for a tooltip — the one `:host` rule, shared by the element's scaffold and the SSR declarative shadow root. */
export const tooltipHostCss = ":host { display: inline-flex; }";
