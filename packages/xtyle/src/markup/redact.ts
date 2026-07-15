/** How a redaction obscures its content while concealed. `blur` softens it, `block` lays a solid
 * bar over it, `mask` covers it with a dotted fill. */
export type RedactMode = "blur" | "block" | "mask";

/** What brings the content back. `hover` reveals while hovered or focused, `click` toggles it,
 * `hold` shows it only while pressed, `never` leaves the reveal to the page-level switch alone. */
export type RedactReveal = "hover" | "click" | "hold" | "never";

/** The host-layout rule for a redaction — shared by the element's fragment scaffold and the SSR
 * declarative shadow root. It flows inline with the text it sits in and gives the cover a box to
 * absolutely fill. */
export const redactHostCss = ":host { display: inline-block; }";
