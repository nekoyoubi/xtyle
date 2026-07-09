import { XtyleDecoratorElement, define } from "./base.js";

/**
 * A horizontal step indicator for a linear process (checkout, onboarding, a wizard). Standalone
 * (like `Table` / `Timeline`): it decorates a slotted ordered list rather than rendering a
 * fragment. The `current` index splits the steps into done / current / upcoming, which the CSS
 * draws as filled / outlined / muted markers on a connector track, all from the theme.
 */
export class XtyleSteps extends XtyleDecoratorElement {
	static get observedAttributes(): string[] {
		return ["current"];
	}

	get current(): number {
		const parsed = Number.parseInt(this.getAttribute("current") ?? "0", 10);
		return Number.isFinite(parsed) ? parsed : 0;
	}
	set current(value: number) {
		this.setAttribute("current", String(value));
	}

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

	attributeChangedCallback(): void {
		if (this.isConnected) this.decorate();
	}

	/** Class the host and list, then split each step into done / current / upcoming by its index
	 * against `current`, marking the current one with `aria-current`. Detaches the observer first so
	 * its own writes can't re-trigger it. */
	private decorate(): void {
		this.observer?.disconnect();
		this.classList.add("xtyle-steps");
		const list = this.querySelector(":scope > ol, :scope > ul");
		if (list) {
			list.classList.add("xtyle-steps__list");
			const current = this.current;
			const items = Array.from(list.children).filter((child) => child.tagName === "LI");
			items.forEach((step, i) => {
				step.classList.add("xtyle-steps__step");
				step.classList.toggle("xtyle-steps__step--done", i < current);
				step.classList.toggle("xtyle-steps__step--current", i === current);
				step.classList.toggle("xtyle-steps__step--upcoming", i > current);
				if (i === current) step.setAttribute("aria-current", "step");
				else step.removeAttribute("aria-current");
			});
		}
		if (this.isConnected && this.observer) {
			this.observer.observe(this, { childList: true, subtree: true });
		}
	}
}

define("xtyle-steps", XtyleSteps);
