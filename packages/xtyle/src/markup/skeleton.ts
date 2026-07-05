export type SkeletonShape = "text" | "line" | "block" | "circle";

/** The host-layout rule for a skeleton — the one `:host` rule, shared by the element's scaffold and the SSR declarative shadow root. */
export const skeletonHostCss = ":host { display: block; }";
