import type { FullTone } from "../vocab.js";
import { TEXT_TAGS, TEXT_SIZES, TEXT_WEIGHTS, TEXT_LEADINGS } from "../vocab.js";

export type TextAs = (typeof TEXT_TAGS)[number];
export type TextSize = (typeof TEXT_SIZES)[number];
export type TextWeight = (typeof TEXT_WEIGHTS)[number];
export type TextLeading = (typeof TEXT_LEADINGS)[number];
export type TextTone = "default" | "muted" | "subtle" | FullTone;

export interface TextMarkupProps {
	as?: TextAs;
	size?: TextSize;
	weight?: TextWeight;
	leading?: TextLeading;
	tone?: TextTone;
	mono?: boolean;
}

/** The host-layout rules for text — the `:host` rules, shared by the element's scaffold and the SSR declarative shadow root. */
export const textHostCss = `:host { display: block; } :host([as="span"]) { display: inline; }`;
