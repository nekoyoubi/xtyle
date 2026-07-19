import { escapeAttr } from "../escape.js";

interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
	setText(selector: string, value: string): void;
}

interface ProgressBindings {
	variant?: string;
	tone?: string;
	size?: string;
	value?: number;
	min?: number;
	max?: number;
	indeterminate?: boolean;
	showValue?: boolean;
	valueFormat?: string;
	unit?: string;
	colorizeValue?: boolean;
	valuePosition?: string;
	pulse?: string | null;
	track?: string | null;
	thickness?: string | null;
	role?: string;
	ariaLabel?: string | null;
	ariaLabelledby?: string | null;
	ramp?: boolean;
	rampMode?: string;
	rampColor?: string;
	rampStops?: string[];
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: ProgressBindings, ops: OpsBuilder) => void) => void };
};

const RADIUS = 16;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** A thickness is a bare number or a number with a CSS unit, and nothing else. Anything outside that
 * shape is dropped rather than interpolated: this string lands in an inline `style` attribute built by
 * template literal, where the sandbox has no escaping helper to reach for. */
function thicknessValue(b: ProgressBindings): string | null {
	const t = b.thickness?.trim();
	return t && /^[0-9]*\.?[0-9]+(?:[a-z]+|%)?$/i.test(t) ? t : null;
}

/** A unitless thickness is in ring units and scales with the diameter; one carrying a CSS unit is an
 * absolute weight, which only holds if the stroke opts out of the viewBox transform. */
function fixedStroke(b: ProgressBindings): boolean {
	const t = thicknessValue(b);
	return !!t && !/^[0-9]*\.?[0-9]+$/.test(t);
}

function progressClass(b: ProgressBindings): string {
	const variant = b.variant ?? "linear";
	const tone = b.tone ?? "accent";
	const size = b.size ?? "md";
	const pulse = b.pulse === "fast" || b.pulse === "slow" ? b.pulse : null;
	const track = b.track ?? null;
	return [
		"xtyle-progress",
		`xtyle-progress--${variant}`,
		`xtyle-progress--${tone}`,
		size !== "md" && `xtyle-progress--${size}`,
		b.indeterminate && "xtyle-progress--indeterminate",
		b.colorizeValue && "xtyle-progress--colorize-value",
		b.valuePosition === "inset" && "xtyle-progress--value-inset",
		pulse && `xtyle-progress--pulse-${pulse}`,
		track === "none" && "xtyle-progress--no-track",
		track && track !== "none" && `xtyle-progress--track-${track}`,
		fixedStroke(b) && "xtyle-progress--fixed-stroke",
	]
		.filter(Boolean)
		.join(" ");
}

/** The root's inline style carries the author's thickness as the custom property the stylesheet reads,
 * so a mod restyling the groove or the arc sees the same value the element resolved. */
function rootStyle(b: ProgressBindings): string {
	const t = thicknessValue(b);
	return t ? `--xtyle-progress-stroke:${t}` : "";
}

function fraction(b: ProgressBindings): number {
	const min = b.min ?? 0;
	const max = b.max ?? 100;
	const value = b.value ?? 0;
	const span = max - min;
	if (!Number.isFinite(span) || span <= 0) return 0;
	const clamped = Math.min(Math.max(value, min), max);
	return (clamped - min) / span;
}

function ariaAttrs(b: ProgressBindings): string {
	const min = ` aria-valuemin="${b.min ?? 0}"`;
	const max = ` aria-valuemax="${b.max ?? 100}"`;
	const now = b.indeterminate ? "" : ` aria-valuenow="${b.value ?? 0}"`;
	const label = b.ariaLabel ?? null;
	const labelledby = b.ariaLabelledby ?? null;
	const name =
		label !== null ? ` aria-label="${escapeAttr(label)}"` : labelledby !== null ? ` aria-labelledby="${escapeAttr(labelledby)}"` : "";
	return `${min}${max}${now}${name}`;
}

function valueText(b: ProgressBindings): string {
	if (b.indeterminate) return "…";
	const min = b.min ?? 0;
	const max = b.max ?? 100;
	const value = Math.min(Math.max(b.value ?? 0, min), max);
	const unit = b.unit ?? "";
	switch (b.valueFormat ?? "percent") {
		case "value":
			return `${value}${unit}`;
		case "value-max":
			return `${value}/${max}${unit}`;
		default:
			return `${Math.round(fraction(b) * 100)}%`;
	}
}

function valueReadout(b: ProgressBindings): string {
	return `<span class="xtyle-progress__value" part="value"><slot name="value"><span data-progress-value>${valueText(b)}</span></slot></span>`;
}

/** The linear indicator's inline style: its fill width, plus an optional value-driven ramp fill. A
 * `gradient` ramp paints the scale's stops as a `linear-gradient` sized to the full track (so the
 * visible slice always shows the scale from its cold end up to the current fraction), needing no JS.
 * A `solid` ramp paints the single `rampColor` the host sampled off the live cascade. */
function linearIndicatorStyle(b: ProgressBindings): string {
	if (b.indeterminate) return "";
	const parts = [`width:${Math.round(fraction(b) * 100)}%`];
	if (b.ramp && b.rampMode === "gradient" && b.rampStops && b.rampStops.length) {
		const f = fraction(b);
		const size = f > 0 ? 100 / f : 100;
		parts.push(
			`background:linear-gradient(90deg, ${b.rampStops.join(", ")})`,
			`background-size:${size.toFixed(2)}% 100%`,
			"background-repeat:no-repeat",
		);
	} else if (b.ramp && b.rampColor) {
		parts.push(`background:${b.rampColor}`);
	}
	return parts.join(";");
}

/** The circular indicator's inline style: the arc geometry, plus an optional `solid` ramp stroke.
 * Circular rings only take a solid ramp (a stroke gradient would need a per-instance SVG def). */
function circularIndicatorStyle(b: ProgressBindings): string {
	const dasharray = CIRCUMFERENCE.toFixed(3);
	const offset = b.indeterminate
		? (CIRCUMFERENCE * 0.7).toFixed(3)
		: (CIRCUMFERENCE * (1 - fraction(b))).toFixed(3);
	const parts = [`stroke-dasharray:${dasharray}`, `stroke-dashoffset:${offset}`];
	if (b.ramp && b.rampColor && !b.indeterminate) parts.push(`stroke:${b.rampColor}`);
	return parts.join(";");
}

function rootAttrs(b: ProgressBindings): string {
	const style = rootStyle(b);
	return `part="progress" class="${progressClass(b)}" role="${escapeAttr(b.role ?? "progressbar")}"${ariaAttrs(b)}${style ? ` style="${style}"` : ""}`;
}

function linearHtml(b: ProgressBindings): string {
	const style = linearIndicatorStyle(b);
	const styleAttr = style ? ` style="${style}"` : "";
	const readout = b.showValue ? valueReadout(b) : "";
	return `<div ${rootAttrs(b)}><div class="xtyle-progress__track" part="track"><div class="xtyle-progress__indicator" part="indicator"${styleAttr}></div></div>${readout}</div>`;
}

function circularHtml(b: ProgressBindings): string {
	const dashStyle = ` style="${circularIndicatorStyle(b)}"`;
	const readout = b.showValue && !b.indeterminate ? valueReadout(b) : "";
	const size = b.size ?? "md";
	const sw = size === "sm" ? 3 : size === "lg" ? 5 : 4;
	return `<div ${rootAttrs(b)}><svg class="xtyle-progress__svg" viewBox="0 0 40 40" aria-hidden="true"><circle class="xtyle-progress__track-ring" part="track" cx="20" cy="20" r="${RADIUS}" stroke-width="${sw}"></circle><circle class="xtyle-progress__indicator" part="indicator" cx="20" cy="20" r="${RADIUS}" stroke-width="${sw}"${dashStyle}></circle></svg>${readout}</div>`;
}

function progressHtml(b: ProgressBindings): string {
	return (b.variant ?? "linear") === "circular" ? circularHtml(b) : linearHtml(b);
}

hooks.fragment.mount("progress", (bindings, ops) => {
	ops.replaceChildren("[data-progress]", progressHtml(bindings));
});

hooks.fragment.update("progress", (bindings, ops) => {
	ops.setAttr(".xtyle-progress", "class", progressClass(bindings));
	ops.setAttr('[part="progress"]', "style", rootStyle(bindings));
	ops.setAttr('[part="progress"]', "role", bindings.role ?? "progressbar");
	ops.setAttr('[part="progress"]', "aria-valuemin", String(bindings.min ?? 0));
	ops.setAttr('[part="progress"]', "aria-valuemax", String(bindings.max ?? 100));
	if (!bindings.indeterminate) ops.setAttr('[part="progress"]', "aria-valuenow", String(bindings.value ?? 0));
	if ((bindings.variant ?? "linear") === "circular") {
		ops.setAttr('[part="indicator"]', "style", circularIndicatorStyle(bindings));
	} else if (!bindings.indeterminate) {
		ops.setAttr('[part="indicator"]', "style", linearIndicatorStyle(bindings));
	}
	if (bindings.showValue) ops.setText("[data-progress-value]", valueText(bindings));
});
