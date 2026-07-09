import { XtyleDecoratorElement, define } from "./base.js";

/**
 * A centered placeholder for a no-data state: no results, an empty inbox, a fresh list. Standalone
 * and purely presentational (like `Stack`): it classes itself and the CSS centers and styles its
 * content, so a heading, a `<p>`, an icon in `.xtyle-empty__media`, and buttons in
 * `.xtyle-empty__actions` fall into place from the theme with no markup of its own.
 */
export class XtyleEmpty extends XtyleDecoratorElement {
	connectedCallback(): void {
		super.connectedCallback();
		this.classList.add("xtyle-empty");
	}
}

define("xtyle-empty", XtyleEmpty);
