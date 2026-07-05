export interface CardLinkMarkupProps {
	href?: string | null;
	target?: string | null;
	rel?: string | null;
	interactive?: boolean;
	overlay?: boolean;
	compact?: boolean;
}

/** The host-layout rule for a card-link — the one `:host` rule, shared by the element's scaffold and the SSR declarative shadow root. */
export const cardLinkHostCss = ":host { display: block; }";
