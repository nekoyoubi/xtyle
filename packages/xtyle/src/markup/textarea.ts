export type TextareaResize = "none" | "vertical" | "horizontal" | "both";

/** The host-layout rule for a textarea — the one `:host` rule, shared by the element's scaffold and the SSR declarative shadow root. */
export const textareaHostCss = ":host { display: block; }";
