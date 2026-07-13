export interface BottomNavTab {
	value: string;
	label: string;
	/** A functional icon name, drawn above the label. */
	icon?: string;
	/** An optional count, e.g. unread. */
	badge?: string | number | null;
}

/** The host-layout rule for the bottom nav: the one `:host` rule, shared by the element's scaffold and the SSR declarative shadow root. */
export const bottomNavHostCss = ":host { display: block; }";
