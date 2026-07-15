/** How a tour shows which step you're on. `count` prints "2 of 5", `dots` draws one dot per step,
 * `none` shows nothing. */
export type TourProgress = "count" | "dots" | "none";

/** The host-layout rule for a tour — it takes no space in the flow; the spotlight it drives paints
 * over the page. Shared by the element's fragment scaffold and the SSR declarative shadow root. */
export const tourHostCss = ":host { display: contents; }";
