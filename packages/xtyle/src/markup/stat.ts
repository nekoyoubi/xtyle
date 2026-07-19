import { STAT_TRENDS, STAT_SENTIMENTS, STAT_ALIGNS } from "../vocab.js";
export type StatTrend = (typeof STAT_TRENDS)[number];
export type StatSentiment = (typeof STAT_SENTIMENTS)[number];
export type StatAlign = (typeof STAT_ALIGNS)[number];
export type StatSize = "sm" | "md" | "lg";

/** The host-layout rule for a stat: the one `:host` rule, shared by the element's scaffold and the SSR declarative shadow root. */
export const statHostCss = ":host { display: block; }";
