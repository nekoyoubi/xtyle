export type ImageFit = "cover" | "contain";
export type ImageRadius = "none" | "sm" | "md" | "lg";
export type ImageLoading = "lazy" | "eager";

/** The host-layout rule for an image: the one `:host` rule, shared by the element's scaffold and the SSR declarative shadow root. */
export const imageHostCss = ":host { display: block; }";
