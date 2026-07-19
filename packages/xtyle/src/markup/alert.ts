import type { FullTone } from "../vocab.js";
import { ALERT_SEVERITIES, ALERT_VARIANTS } from "../vocab.js";

/** The alert's color — any semantic role, accent variant, or named hue. */
export type AlertTone = FullTone;
/** The alert's meaning — drives the status glyph + live-region politeness, independent of color. */
export type AlertSeverity = (typeof ALERT_SEVERITIES)[number];
export type AlertVariant = (typeof ALERT_VARIANTS)[number];

/** The host-layout rule for an alert — the one `:host` rule, shared by the element's scaffold and the SSR declarative shadow root. */
export const alertHostCss = ":host { display: block; }";
