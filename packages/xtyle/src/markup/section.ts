import type { FullTone } from "../vocab.js";

export type SectionTag = "section" | "div" | "header" | "footer";
export type SectionVariant = "band" | "stage";
export type SectionTone = "plain" | "quiet" | FullTone;
export type SectionPadding = "none" | "sm" | "md" | "lg";

export interface SectionMarkupProps {
	as?: SectionTag;
	variant?: SectionVariant;
	tone?: SectionTone;
	bordered?: boolean;
	padding?: SectionPadding;
	label?: string | null;
}

/** The host-layout rule for a section — the one `:host` rule, shared by the element's scaffold and the SSR declarative shadow root. */
export const sectionHostCss = ":host { display: block; }";
