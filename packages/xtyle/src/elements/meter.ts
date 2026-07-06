import { define, escapeHtml } from "./base.js";

/**
 * A scalar gauge with semantic zones, mirroring the native `<meter>`: a value in a known range whose
 * fill shifts good / okay / bad by where it falls relative to `low` / `high` / `optimum`. Distinct
 * from `Progress` (task completion). Client-rendered; the element's text is the no-JS fallback and the
 * accessible label once it upgrades.
 */
export class XtyleMeter extends HTMLElement {
	static get observedAttributes(): string[] {
		return ["value", "max", "low", "high", "optimum", "unit", "label"];
	}

	private captured = false;
	private fallbackLabel = "";

	private num(attr: string): number | null {
		const raw = this.getAttribute(attr);
		if (raw === null) return null;
		const parsed = Number.parseFloat(raw);
		return Number.isFinite(parsed) ? parsed : null;
	}

	get value(): number {
		return this.num("value") ?? 0;
	}
	set value(value: number) {
		this.setAttribute("value", String(value));
	}

	get max(): number {
		const parsed = this.num("max");
		return parsed !== null && parsed > 0 ? parsed : 100;
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

	/** The native `<meter>` zone rule: given the preferred region (from `optimum`), a value in it is
	 * good, one region away is okay, and the opposite extreme is bad. No thresholds means a plain
	 * accent gauge. */
	private zone(): "good" | "okay" | "bad" | "none" {
		const low = this.num("low");
		const high = this.num("high");
		const optimum = this.num("optimum");
		if (low === null && high === null && optimum === null) return "none";
		const max = this.max;
		const lo = low ?? 0;
		const hi = high ?? max;
		const opt = optimum ?? (lo + hi) / 2;
		const v = Math.max(0, Math.min(max, this.value));
		const region = v < lo ? "low" : v > hi ? "high" : "mid";
		const prefers = opt <= lo ? "low" : opt >= hi ? "high" : "mid";
		if (region === prefers) return "good";
		if (prefers === "mid") return "okay";
		return region === "mid" ? "okay" : "bad";
	}

	private render(): void {
		const max = this.max;
		const value = Math.max(0, Math.min(max, this.value));
		const pct = max > 0 ? (value / max) * 100 : 0;
		const unit = this.getAttribute("unit") ?? "";
		const zone = this.zone();
		const label = this.getAttribute("label") || this.fallbackLabel;
		this.classList.add("xtyle-meter");
		for (const z of ["good", "okay", "bad"] as const) {
			this.classList.toggle(`xtyle-meter--${z}`, zone === z);
		}
		this.setAttribute("role", "meter");
		this.setAttribute("aria-valuenow", String(value));
		this.setAttribute("aria-valuemin", "0");
		this.setAttribute("aria-valuemax", String(max));
		if (label) this.setAttribute("aria-label", label);
		const labelRow = label
			? `<div class="xtyle-meter__label"><span>${escapeHtml(label)}</span><span class="xtyle-meter__value">${escapeHtml(String(value) + unit)}</span></div>`
			: "";
		this.innerHTML = `${labelRow}<div class="xtyle-meter__track"><div class="xtyle-meter__fill" style="width: ${pct}%"></div></div>`;
	}
}

define("xtyle-meter", XtyleMeter);
