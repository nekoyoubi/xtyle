import { XtyleElement, define, type StyleMode } from "./base.js";

/**
 * A vertical activity feed. Standalone (like `table` / `dock-zone`): it decorates a slotted
 * ordered list rather than rendering a fragment, so the semantic `<ol><li>` stays the source
 * of truth and the connector rail + dots are drawn from the theme in CSS.
 */
export class XtyleTimeline extends XtyleElement {
	protected override get styleMode(): StyleMode {
		return "scoped";
	}

	protected template(): string {
		return "";
	}

	// Decorator manages its own light DOM; the base render would wipe slotted children.
	protected override render(): void {}

	private observer: MutationObserver | null = null;

	connectedCallback(): void {
		super.connectedCallback();
		this.decorate();
		if (typeof MutationObserver !== "undefined" && !this.observer) {
			this.observer = new MutationObserver(() => {
				if (this.isConnected) this.decorate();
			});
			this.observer.observe(this, { childList: true, subtree: true });
		}
	}

	override disconnectedCallback(): void {
		super.disconnectedCallback();
		this.observer?.disconnect();
		this.observer = null;
	}

	/** Class the host, the list, and each item. A framework recreating list items leaves them
	 * undecorated, so the observer re-runs this; it detaches itself first so its own class writes
	 * can't re-trigger the observer. */
	private decorate(): void {
		this.observer?.disconnect();
		this.classList.add("xtyle-timeline");
		const list = this.querySelector(":scope > ol, :scope > ul");
		if (list) {
			list.classList.add("xtyle-timeline__list");
			for (const child of Array.from(list.children)) {
				if (child.tagName === "LI") child.classList.add("xtyle-timeline__item");
			}
		}
		if (this.isConnected && this.observer) {
			this.observer.observe(this, { childList: true, subtree: true });
		}
	}
}

define("xtyle-timeline", XtyleTimeline);
