/** How a tour shows which step you're on. `count` prints "2 of 5", `dots` draws one dot per step,
 * `none` shows nothing. */
export type TourProgress = "count" | "dots" | "none";

/** The host-layout rule for a tour — it takes no space in the flow; the spotlight it drives paints
 * over the page. Shared by the element's fragment scaffold and the SSR declarative shadow root. */
export const tourHostCss = ":host { display: contents; }";

/** One stop on a tour, as data: what to point at, what to say, and how to frame it. */
export interface TourStepSpec {
	target: string;
	heading?: string;
	body?: string;
	placement?: string;
	shape?: string;
	padding?: string | number;
	radius?: string | number;
	scrollIntoView?: boolean;
	noDismiss?: boolean;
}

/**
 * A whole walkthrough as inert data, so it can be held in a variable, addressed by id, listed in a
 * picker, or contributed by a mod — none of which markup living inside one screen can be.
 *
 * `id`, `title` and `summary` are carried for the consumer's sake rather than the component's: a tour
 * that can be named is a tour a help menu can offer. Nothing here reaches outside the page, and nothing
 * records that a tour was taken; that is the app's to keep, and `taken` is how it tells the component.
 */
export interface TourSpec {
	id?: string;
	title?: string;
	summary?: string;
	steps: TourStepSpec[];
}
