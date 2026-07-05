import type { SeriesScheme, StatusTone } from "../series.js";

export interface BarSeries {
	name: string;
	values: number[];
	/** For the `statuses` scheme when coloring by series, the semantic outcome this series represents.
	 * Colors it by meaning regardless of which series are present. Ignored by every other scheme, and
	 * by category-colored charts (categories carry no tone). */
	tone?: StatusTone;
}

export type BarScheme = SeriesScheme | string[];

/** The host-layout rule for a bar chart, shared by the element's scaffold and the SSR shadow root. */
export const barHostCss = ":host { display: block; }";
