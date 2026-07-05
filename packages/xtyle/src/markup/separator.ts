export type Orientation = "horizontal" | "vertical";
export type SeparatorVariant = "default" | "with-label";
export type SeparatorSize = "thin" | "normal";

/** The host-layout rules for a separator — the `:host` rules, shared by the element's scaffold and the SSR declarative shadow root. */
export const separatorHostCss =
	`:host { display: block; } :host([orientation="vertical"]) { display: inline-flex; height: 100%; }`;
