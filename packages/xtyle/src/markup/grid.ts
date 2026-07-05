export type GridAlign = "start" | "center" | "end" | "stretch";

/** The host-layout rules for a grid — the `:host` rules, shared by the element's scaffold and the SSR declarative shadow root. */
export const gridHostCss = ":host { display: block; } :host([inline]) { display: inline-block; }";
