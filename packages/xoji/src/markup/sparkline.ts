import type { FullTone } from "../vocab.js";

export type SparklineVariant = "line" | "area" | "bar";
export type SparklineTone = FullTone;

/** The host-layout rule for a sparkline, shared by the element's scaffold and the SSR shadow root. */
export const sparklineHostCss = ":host { display: inline-block; }";
