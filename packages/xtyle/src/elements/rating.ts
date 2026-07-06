import { define } from "./base.js";

const STAR = `<svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true"><path fill="currentColor" d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`;

/**
 * A read-only star rating. It renders a row of stars with a filled overlay clipped to `value / max`,
 * so a fractional value shows a partial star exactly. Client-rendered (like `Spinner`): the element's
 * text content is the no-JS fallback and becomes the accessible label once it upgrades to stars.
 */
export class XtyleRating extends HTMLElement {
	static get observedAttributes(): string[] {
		return ["value", "max", "size", "label"];
	}

	private captured = false;
	private fallbackLabel = "";

	get value(): number {
		const parsed = Number.parseFloat(this.getAttribute("value") ?? "0");
		return Number.isFinite(parsed) ? parsed : 0;
	}
	set value(value: number) {
		this.setAttribute("value", String(value));
	}

	get max(): number {
		const parsed = Number.parseInt(this.getAttribute("max") ?? "5", 10);
		return Number.isFinite(parsed) && parsed > 0 ? parsed : 5;
	}
	set max(value: number) {
		this.setAttribute("max", String(value));
	}

	connectedCallback(): void {
		if (!this.captured) {
			this.fallbackLabel = (this.textContent ?? "").trim();
			this.captured = true;
		}
		this.render();
	}

	attributeChangedCallback(): void {
		if (this.captured) this.render();
	}

	private render(): void {
		this.classList.add("xtyle-rating");
		this.classList.toggle("xtyle-rating--sm", this.getAttribute("size") === "sm");
		this.classList.toggle("xtyle-rating--lg", this.getAttribute("size") === "lg");
		const max = this.max;
		const value = Math.max(0, Math.min(max, this.value));
		const pct = max > 0 ? (value / max) * 100 : 0;
		const stars = STAR.repeat(max);
		this.setAttribute("role", "img");
		this.setAttribute("aria-label", this.getAttribute("label") || this.fallbackLabel || `${value} out of ${max} stars`);
		this.innerHTML = `<span class="xtyle-rating__row xtyle-rating__row--empty" aria-hidden="true">${stars}</span><span class="xtyle-rating__row xtyle-rating__row--filled" aria-hidden="true" style="width: ${pct}%">${stars}</span>`;
	}
}

define("xtyle-rating", XtyleRating);
