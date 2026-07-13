interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
	setText(selector: string, text: string): void;
}

interface SliderBindings {
	value?: number;
	min?: number;
	max?: number;
	step?: number;
	altStep?: number;
	disabled?: boolean;
	size?: string;
	tone?: string;
	label?: string | null;
	labelledby?: string | null;
	showValue?: boolean;
	hideLabel?: boolean;
	valueText?: string;
	elementId?: string;
	editableValue?: boolean;
	editing?: boolean;
}

interface EventPayload {
	disabled?: boolean;
	ariaDisabled?: string;
	key?: string;
}

interface KeyContext {
	value: number;
	min: number;
	max: number;
	step: number;
}

interface Intent {
	setValue?: number;
	nudge?: 1 | -1;
	forceAlt?: boolean;
	commit?: "input" | "change";
	preventDefault?: boolean;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: SliderBindings, ops: OpsBuilder) => void) => void };
};
declare const xript: { exports: { register(name: string, fn: (...args: unknown[]) => unknown): void } };

function sliderClass(b: SliderBindings): string {
	const size = b.size ?? "md";
	const tone = b.tone ?? "accent";
	return [
		"xtyle-slider",
		`xtyle-slider--${tone}`,
		size !== "md" && `xtyle-slider--${size}`,
		b.disabled && "xtyle-slider--disabled",
		b.showValue && b.editableValue && "xtyle-slider--value-editable",
	]
		.filter(Boolean)
		.join(" ");
}

/** The true value the host stored (already snapped / clamped as its mode dictates); never re-snapped here,
 * so a fine typed value or an overflow value passes through untouched. */
function trueValue(b: SliderBindings): number {
	const value = b.value ?? (b.min ?? 0);
	return Number.isNaN(value) ? (b.min ?? 0) : value;
}

/** The value the thumb sits at: the true value pinned to the rail (an overflow value pins at the edge). */
function railValue(b: SliderBindings): number {
	const min = b.min ?? 0;
	const max = b.max ?? 100;
	return Math.min(max, Math.max(min, trueValue(b)));
}

function fraction(value: number, min: number, max: number): number {
	return max === min ? 0 : (value - min) / (max - min);
}

function readout(b: SliderBindings, value: number): string {
	return b.valueText ?? String(value);
}

function inner(b: SliderBindings): string {
	const railMin = b.min ?? 0;
	const railMax = b.max ?? 100;
	const value = trueValue(b);
	const rail = railValue(b);
	// The announced range widens to include an overflow value so `aria-valuenow` stays within it.
	const ariaMin = Math.min(railMin, value);
	const ariaMax = Math.max(railMax, value);
	const uid = b.elementId ?? "xtyle-slider";
	const labelId = `${uid}-label`;
	const pct = `${(fraction(rail, railMin, railMax) * 100).toFixed(3)}%`;

	const nameAttr = b.labelledby
		? ` aria-labelledby="${b.labelledby}"`
		: b.label
			? ` aria-labelledby="${labelId}"`
			: "";
	const disabledAttr = b.disabled ? ' aria-disabled="true"' : "";
	const tabindex = b.disabled ? "-1" : "0";
	const valueText = readout(b, value);
	const valueTextAttr = valueText !== String(value) ? ` aria-valuetext="${valueText}"` : "";

	const labelClass = b.hideLabel ? "xtyle-slider__label xtyle-slider__label--hidden" : "xtyle-slider__label";
	const label = b.label
		? `<span class="${labelClass}" part="label" id="${labelId}">${b.label}</span>`
		: "";

	const valueMarkup = b.showValue
		? `<span class="xtyle-slider__value" part="value" aria-hidden="true">${readout(b, value)}</span>`
		: "";

	const headerLabel = b.hideLabel ? "" : label;
	const header = valueMarkup
		? `<span class="xtyle-slider__header" part="header">${headerLabel}${valueMarkup}</span>${b.hideLabel ? label : ""}`
		: label;

	return (
		`${header}<span class="xtyle-slider__rail" part="rail">` +
		`<span class="xtyle-slider__fill" part="fill" style="width: ${pct}"></span>` +
		`<span class="xtyle-slider__thumb" part="thumb" role="slider" tabindex="${tabindex}" ` +
		`aria-valuemin="${ariaMin}" aria-valuemax="${ariaMax}" aria-valuenow="${value}"${valueTextAttr} aria-orientation="horizontal"` +
		`${nameAttr}${disabledAttr} style="inset-inline-start: ${pct}"></span></span>`
	);
}

hooks.fragment.mount("slider", (bindings, ops) => {
	ops.setAttr("[data-root]", "class", sliderClass(bindings));
	ops.replaceChildren("[data-slider]", inner(bindings));
});

hooks.fragment.update("slider", (bindings, ops) => {
	const railMin = bindings.min ?? 0;
	const railMax = bindings.max ?? 100;
	const value = trueValue(bindings);
	const rail = railValue(bindings);
	const pct = `${(fraction(rail, railMin, railMax) * 100).toFixed(3)}%`;
	ops.setAttr("[data-root]", "class", sliderClass(bindings));
	ops.setAttr(".xtyle-slider__thumb", "aria-valuemin", String(Math.min(railMin, value)));
	ops.setAttr(".xtyle-slider__thumb", "aria-valuemax", String(Math.max(railMax, value)));
	ops.setAttr(".xtyle-slider__thumb", "aria-valuenow", String(value));
	const valueText = readout(bindings, value);
	ops.setAttr(".xtyle-slider__thumb", "aria-valuetext", valueText !== String(value) ? valueText : "");
	ops.setAttr(".xtyle-slider__thumb", "tabindex", bindings.disabled ? "-1" : "0");
	ops.setAttr(".xtyle-slider__thumb", "style", `inset-inline-start: ${pct}`);
	ops.setAttr(".xtyle-slider__fill", "style", `width: ${pct}`);
	// While the value is being edited its span holds the inline field, so leave it be until the edit ends.
	if (bindings.showValue && !bindings.editing) ops.setText(".xtyle-slider__value", readout(bindings, value));
});

// The step size and rail clamp live host-side (they read the live event's modifier keys), so the sandbox
// handler only names the direction: an arrow nudges by one step, a page nudges by the alt step, Home/End
// jump to the rail ends.
xript.exports.register("keyAdjust", (payload: unknown, context: unknown): Intent => {
	const e = payload as EventPayload;
	if (e.disabled || e.ariaDisabled === "true") return {};
	const ctx = context as KeyContext;
	switch (e.key) {
		case "ArrowRight":
		case "ArrowUp":
			return { nudge: 1, preventDefault: true };
		case "ArrowLeft":
		case "ArrowDown":
			return { nudge: -1, preventDefault: true };
		case "PageUp":
			return { nudge: 1, forceAlt: true, preventDefault: true };
		case "PageDown":
			return { nudge: -1, forceAlt: true, preventDefault: true };
		case "Home":
			return { setValue: ctx.min, commit: "change", preventDefault: true };
		case "End":
			return { setValue: ctx.max, commit: "change", preventDefault: true };
	}
	return {};
});
