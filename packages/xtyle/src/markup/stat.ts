export type StatTrend = "up" | "down" | "flat";
export type StatSentiment = "positive" | "negative" | "neutral";
export type StatAlign = "start" | "center";
export type StatSize = "sm" | "md" | "lg";

/** The host-layout rule for a stat: the one `:host` rule, shared by the element's scaffold and the SSR declarative shadow root. */
export const statHostCss = ":host { display: block; }";
