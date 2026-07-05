export type AvatarGroupSize = "sm" | "md" | "lg" | "xl";
export type AvatarGroupSpacing = "snug" | "normal" | "loose";

/** The host-layout rule for an avatar group, shared by the element's scaffold and the SSR shadow root. */
export const avatarGroupHostCss = ":host { display: inline-flex; }";
