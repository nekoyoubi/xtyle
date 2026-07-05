export interface TocItem {
	id: string;
	label: string;
}

/** The host-layout rule for a toc — the one `:host` rule, shared by the element's scaffold and the SSR declarative shadow root. */
export const tocHostCss = ":host { display: block; }";
