export type TooltipPlacement = "top" | "bottom" | "left" | "right";

/** The host-layout rule for a tooltip — the one `:host` rule, shared by the element's scaffold and the SSR declarative shadow root. */
export const tooltipHostCss = ":host { display: inline-flex; }";
