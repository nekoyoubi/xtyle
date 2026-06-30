import type { FullTone } from "../vocab.js";

export type TextAs = "p" | "span";
export type TextSize = "xs" | "sm" | "body" | "lg";
export type TextWeight = "normal" | "medium" | "semibold" | "bold";
export type TextLeading = "tight" | "snug" | "loose";
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
