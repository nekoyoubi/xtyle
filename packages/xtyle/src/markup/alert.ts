import type { FullTone } from "../vocab.js";

/** The alert's color — any semantic role, accent variant, or named hue. */
export type AlertTone = FullTone;
/** The alert's meaning — drives the status glyph + live-region politeness, independent of color. */
export type AlertSeverity = "success" | "warn" | "danger" | "info";
export type AlertVariant = "soft" | "solid";

/** The host-layout rule for an alert — the one `:host` rule, shared by the element's scaffold and the SSR declarative shadow root. */
export const alertHostCss = ":host { display: block; }";
