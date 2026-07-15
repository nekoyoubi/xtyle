/** Which viewport edge a sheet is anchored to, and therefore the axis it slides and swipes along. */
export type SheetSide = "top" | "right" | "bottom" | "left";

/** A sheet's extent across its anchored edge: a height for `top` / `bottom`, a width for `left` / `right`.
 * The `--sheet-block` / `--sheet-inline` custom properties override any of them. */
export type SheetSize = "sm" | "md" | "lg" | "full";

/** The host-layout rule for a sheet — the `:host` rule plus the scaffold wrapper, shared by the element's fragment scaffold and the SSR declarative shadow root. */
export const sheetHostCss = ":host { display: contents; } .xtyle-sheet-host { display: contents; }";
