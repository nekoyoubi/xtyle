import { SHEET_SIDES, SHEET_SIZES } from "../vocab.js";
/** Which viewport edge a sheet is anchored to, and therefore the axis it slides and swipes along. */
export type SheetSide = (typeof SHEET_SIDES)[number];

/** A sheet's extent across its anchored edge: a height for `top` / `bottom`, a width for `left` / `right`.
 * The `--sheet-block` / `--sheet-inline` custom properties override any of them. */
export type SheetSize = (typeof SHEET_SIZES)[number];

/** The host-layout rule for a sheet — the `:host` rule plus the scaffold wrapper, shared by the element's fragment scaffold and the SSR declarative shadow root. */
export const sheetHostCss = ":host { display: contents; } .xtyle-sheet-host { display: contents; }";
