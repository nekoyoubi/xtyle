import { XtyleElement, define, type StyleMode } from "./base.js";
import type { FullTone } from "../index.js";
import { progressHostCss } from "../markup/index.js";
import { rampColor, rampGradientStops, RAMP_TOKENS, RAMP_SCHEMES, type RampScheme } from "../series.js";
import { readLiveRegister } from "./live-register.js";
import { FragmentHost } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/progress/source.generated.js";

export type ProgressVariant = "linear" | "circular";
export type ProgressSize = "sm" | "md" | "lg";
export type ProgressValueFormat = "percent" | "value" | "value-max";
export type ProgressPulse = "fast" | "slow" | null;
export type ProgressRampMode = "solid" | "gradient";

export class XtyleProgress extends XtyleElement {
	protected override get styleMode(): StyleMode {
		return "auto";
	}

	protected override get resolvesThemeAtRuntime(): boolean {
		return true;
	}

	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "progress", {
		applyIntent: () => {},
	});

	static get observedAttributes(): string[] {
		return ["variant", "tone", "size", "value", "min", "max", "indeterminate", "show-value", "value-format", "unit", "colorize-value", "value-position", "meter", "ramp", "ramp-mode", "reverse", "aria-label"];
	}

	get variant(): ProgressVariant {
		return (this.getAttribute("variant") as ProgressVariant) ?? "linear";
	}
	set variant(value: ProgressVariant) {
		this.setAttribute("variant", value);
	}

	get tone(): FullTone {
		return (this.getAttribute("tone") as FullTone) ?? "accent";
	}
	set tone(value: FullTone) {
		this.setAttribute("tone", value);
	}

	get size(): ProgressSize {
		return (this.getAttribute("size") as ProgressSize) ?? "md";
	}
	set size(value: ProgressSize) {
		this.setAttribute("size", value);
	}

	get min(): number {
		return Number(this.getAttribute("min") ?? 0);
	}
	set min(value: number) {
		this.setAttribute("min", String(value));
	}

	get max(): number {
		return Number(this.getAttribute("max") ?? 100);
	}
	set max(value: number) {
		this.setAttribute("max", String(value));
	}

	get value(): number {
		return Number(this.getAttribute("value") ?? 0);
	}
	set value(value: number) {
		this.setAttribute("value", String(value));
	}

	get indeterminate(): boolean {
		return this.hasAttribute("indeterminate");
	}
	set indeterminate(value: boolean) {
		this.reflectBoolean("indeterminate", value);
	}

	get showValue(): boolean {
		return this.hasAttribute("show-value");
	}
	set showValue(value: boolean) {
		this.reflectBoolean("show-value", value);
	}

	get valueFormat(): ProgressValueFormat {
		const raw = this.getAttribute("value-format");
		return raw === "value" || raw === "value-max" ? raw : "percent";
	}
	set valueFormat(value: ProgressValueFormat) {
		this.setAttribute("value-format", value);
	}

	/** A unit appended to the `value` / `value-max` readout (e.g. `GB`); the `percent` format ignores it. */
	get unit(): string {
		return this.getAttribute("unit") ?? "";
	}
	set unit(value: string) {
		this.setAttribute("unit", value);
	}

	get colorizeValue(): boolean {
		return this.hasAttribute("colorize-value");
	}
	set colorizeValue(value: boolean) {
		this.reflectBoolean("colorize-value", value);
	}

	get valuePosition(): "end" | "inset" {
		return this.getAttribute("value-position") === "inset" ? "inset" : "end";
	}
	set valuePosition(value: "end" | "inset") {
		this.setAttribute("value-position", value);
	}

	/** Report as a `meter` (a measurement against a capacity, e.g. disk used) rather than the default
	 * `progressbar` (a task advancing). Flips the ARIA role; the visual treatment is unchanged. */
	get meter(): boolean {
		return this.hasAttribute("meter");
	}
	set meter(value: boolean) {
		this.reflectBoolean("meter", value);
	}

	/** Color the fill by its own value along a ramp instead of a flat tone: a built-in `RampScheme`
	 * (`accent` / `thermal` / `status`), a JSON array of stop colors (`["#00f","#f00"]`), or a
	 * comma-separated stop list (`var(--info),var(--danger)`). Absent leaves the tone in charge. */
	get ramp(): RampScheme | string[] | null {
		const raw = this.getAttribute("ramp");
		if (!raw) return null;
		if (raw.startsWith("[")) {
			try {
				const parsed = JSON.parse(raw) as string[];
				return Array.isArray(parsed) && parsed.length ? parsed : null;
			} catch {
				return null;
			}
		}
		if (raw.includes(",")) {
			const stops = raw.split(",").map((s) => s.trim()).filter(Boolean);
			return stops.length ? stops : null;
		}
		return RAMP_SCHEMES.includes(raw as RampScheme) ? (raw as RampScheme) : null;
	}
	set ramp(value: RampScheme | string[] | null) {
		if (value === null) this.removeAttribute("ramp");
		else this.setAttribute("ramp", Array.isArray(value) ? JSON.stringify(value) : value);
	}

	/** How a `ramp` paints: `solid` (one color sampled at the current value off the live cascade) or
	 * `gradient` (the whole scale as a pure-CSS sweep clipped to the fill, SSR-safe, linear only). */
	get rampMode(): ProgressRampMode {
		return this.getAttribute("ramp-mode") === "gradient" ? "gradient" : "solid";
	}
	set rampMode(value: ProgressRampMode) {
		this.setAttribute("ramp-mode", value);
	}

	get reverse(): boolean {
		return this.hasAttribute("reverse");
	}
	set reverse(value: boolean) {
		this.reflectBoolean("reverse", value);
	}

	private get ariaRole(): string {
		return this.meter ? "meter" : "progressbar";
	}

	private fraction(): number {
		const span = this.max - this.min;
		if (!Number.isFinite(span) || span <= 0) return 0;
		const clamped = Math.min(Math.max(this.value, this.min), this.max);
		return (clamped - this.min) / span;
	}

	/** Reads the ramp's anchor tokens off the live cascade so a solid fill's color tracks the theme. */
	private paletteRegister(): Record<string, string> {
		return readLiveRegister(this, RAMP_TOKENS, () => {
			if (this.root.firstChild) this.render();
		});
	}

	/** Circular rings only take a solid ramp; a stroke gradient would need a per-instance SVG def. */
	private effectiveRampMode(): ProgressRampMode {
		return this.rampMode === "gradient" && this.variant !== "circular" ? "gradient" : "solid";
	}

	private rampBindings(scheme: RampScheme | string[]): Record<string, unknown> {
		const reverse = this.reverse;
		if (this.effectiveRampMode() === "gradient") {
			return { ramp: true, rampMode: "gradient", rampStops: rampGradientStops(scheme, { reverse }) };
		}
		const color = rampColor(scheme, this.fraction(), this.paletteRegister(), { reverse });
		return { ramp: true, rampMode: "solid", rampColor: color };
	}

	/** The `<threshold>` config elements — direct children of the host, never displayed. Read live off
	 * the host (`:scope > threshold`): they sit there as hidden direct children under SSR-light and as
	 * unprojected light children under a shadow render alike. The captured-group read is a fallback for
	 * a forced-light host whose scaffold paint relocated them out of the element. */
	private thresholdEls(): Element[] {
		const live = Array.from(this.querySelectorAll(":scope > threshold"));
		if (live.length) return live;
		return this.fragment.slottedNodes("").filter((n): n is Element => n instanceof Element && n.tagName === "THRESHOLD");
	}

	/** Declarative `<threshold below tone pulse>` children, sorted by their ceiling. The active band is the
	 * first whose `below` percent the current value falls under; it overrides the tone and may pulse. */
	private thresholds(): { below: number; tone: FullTone | null; pulse: ProgressPulse }[] {
		return this.thresholdEls()
			.map((el) => {
				const belowRaw = el.getAttribute("below");
				const below = belowRaw === null || belowRaw === "" ? Number.POSITIVE_INFINITY : Number(belowRaw);
				const pulseRaw = el.getAttribute("pulse");
				return {
					below: Number.isNaN(below) ? Number.POSITIVE_INFINITY : below,
					tone: (el.getAttribute("tone") as FullTone | null) ?? null,
					pulse: (pulseRaw === "fast" || pulseRaw === "slow" ? pulseRaw : null) as ProgressPulse,
				};
			})
			.sort((a, b) => a.below - b.below);
	}

	private activeThreshold(): { below: number; tone: FullTone | null; pulse: ProgressPulse } | null {
		const bands = this.thresholds();
		if (bands.length === 0) return null;
		const span = this.max - this.min;
		const pct = span > 0 ? ((Math.min(Math.max(this.value, this.min), this.max) - this.min) / span) * 100 : 0;
		return bands.find((band) => pct < band.below) ?? bands[bands.length - 1] ?? null;
	}

	get effectiveTone(): FullTone {
		return this.activeThreshold()?.tone ?? this.tone;
	}

	private effectivePulse(): ProgressPulse {
		if (this.indeterminate) return null;
		return this.activeThreshold()?.pulse ?? null;
	}

	attributeChangedCallback(): void {
		if (this.root.firstChild) this.render();
	}

	private get bindings(): Record<string, unknown> {
		return {
			variant: this.variant,
			tone: this.effectiveTone,
			size: this.size,
			value: this.value,
			min: this.min,
			max: this.max,
			indeterminate: this.indeterminate,
			showValue: this.showValue,
			valueFormat: this.valueFormat,
			unit: this.getAttribute("unit") ?? undefined,
			colorizeValue: this.colorizeValue,
			valuePosition: this.valuePosition,
			pulse: this.effectivePulse(),
			role: this.ariaRole,
			ariaLabel: this.getAttribute("aria-label"),
			ariaLabelledby: this.getAttribute("aria-labelledby"),
			...(this.ramp ? this.rampBindings(this.ramp) : {}),
		};
	}

	/** A signature of the state ops can't patch incrementally — the variant (linear vs circular
	 * are entirely different element trees), the indeterminate flag (it drops `aria-valuenow` and the
	 * indicator's inline size, which `setAttr` can't remove), `show-value` (it adds/removes the
	 * readout node), and the accessible name (switching between `aria-label` and `aria-labelledby`,
	 * or dropping the name entirely, requires removing an attribute, which `setAttr` can't do). When
	 * it changes, the structure is rebuilt rather than patched. */
	private shapeSignature(): string {
		const label = this.getAttribute("aria-label");
		const labelledby = this.getAttribute("aria-labelledby");
		const name = label !== null ? `l:${label}` : labelledby !== null ? `b:${labelledby}` : "";
		return `${this.variant}|${this.indeterminate}|${this.showValue}|${name}`;
	}

	private warnIfUnnamed(): void {
		if (!this.getAttribute("aria-label") && !this.getAttribute("aria-labelledby")) {
			console.warn(
				`xtyle-progress: a ${this.ariaRole} has no accessible name. Provide an \`aria-label\` so it is announced.`,
			);
		}
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(progressHostCss);
		this.fragment.reshapeIfChanged(this.shapeSignature());
		this.fragment.update(this.bindings);
		this.warnIfUnnamed();
	}
}

define("xtyle-progress", XtyleProgress);
