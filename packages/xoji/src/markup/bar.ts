import type { SeriesScheme } from "../series.js";

export interface BarSeries {
	name: string;
	values: number[];
}

export type BarScheme = SeriesScheme | string[];

/** The host-layout rule for a bar chart, shared by the element's scaffold and the SSR shadow root. */
export const barHostCss = ":host { display: block; }";
