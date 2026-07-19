import type { FullTone } from "../vocab.js";
import { SECTION_TAGS, SECTION_VARIANTS, SECTION_PADDINGS } from "../vocab.js";

export type SectionTag = (typeof SECTION_TAGS)[number];
export type SectionVariant = (typeof SECTION_VARIANTS)[number];
export type SectionTone = "plain" | "quiet" | FullTone;
export type SectionPadding = (typeof SECTION_PADDINGS)[number];

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
