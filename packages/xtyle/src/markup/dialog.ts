import { DIALOG_SIZES } from "../vocab.js";
/** Dialog width steps. Beyond the three base sizes, `xl` (64rem) and `full` (viewport-minus-margin)
 * cover editor-class content; the `--dialog-width` / `--dialog-max-width` custom properties override any of them. */
export type DialogSize = (typeof DIALOG_SIZES)[number];

/** The host-layout rule for a dialog — the `:host` rule plus the scaffold wrapper, shared by the element's fragment scaffold and the SSR declarative shadow root. */
export const dialogHostCss = ":host { display: contents; } .xtyle-dialog-host { display: contents; }";
