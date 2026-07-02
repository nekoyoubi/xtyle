import type { SeriesScheme } from "../series.js";

export interface PieDatum {
	label: string;
	value: number;
}

export type PieScheme = SeriesScheme | string[];
export type PieVariant = "pie" | "donut";

/** The host-layout rule for a pie chart, shared by the element's scaffold and the SSR shadow root. */
export const pieHostCss = ":host { display: block; }";
