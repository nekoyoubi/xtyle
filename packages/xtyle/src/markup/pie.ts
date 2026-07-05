import type { SeriesScheme, StatusTone } from "../series.js";

export interface PieDatum {
	label: string;
	value: number;
	/** For the `statuses` scheme, the semantic outcome this slice represents. Colors it by meaning
	 * regardless of which categories are present, so a filtered-out zero-value slice never shifts the
	 * mapping. Ignored by every other scheme. */
	tone?: StatusTone;
}

export type PieScheme = SeriesScheme | string[];
export type PieVariant = "pie" | "donut";

/** The host-layout rule for a pie chart, shared by the element's scaffold and the SSR shadow root. */
export const pieHostCss = ":host { display: block; }";
