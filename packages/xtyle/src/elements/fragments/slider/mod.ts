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

function clampValue(b: SliderBindings): number {
	const min = b.min ?? 0;
	const max = b.max ?? 100;
	const step = (b.step ?? 1) > 0 ? (b.step ?? 1) : 1;
	const value = b.value ?? min;
	if (Number.isNaN(value)) return min;
	const snapped = Math.round((value - min) / step) * step + min;
	return Math.min(max, Math.max(min, Number(snapped.toFixed(6))));
}

function fraction(value: number, min: number, max: number): number {
	return max === min ? 0 : (value - min) / (max - min);
}

function readout(b: SliderBindings, value: number): string {
	return b.valueText ?? String(value);
}

function inner(b: SliderBindings): string {
	const min = b.min ?? 0;
	const max = b.max ?? 100;
	const value = clampValue(b);
	const uid = b.elementId ?? "xtyle-slider";
	const labelId = `${uid}-label`;
	const pct = `${(fraction(value, min, max) * 100).toFixed(3)}%`;

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
		`aria-valuemin="${min}" aria-valuemax="${max}" aria-valuenow="${value}"${valueTextAttr} aria-orientation="horizontal"` +
		`${nameAttr}${disabledAttr} style="inset-inline-start: ${pct}"></span></span>`
	);
}

hooks.fragment.mount("slider", (bindings, ops) => {
	ops.setAttr("[data-root]", "class", sliderClass(bindings));
	ops.replaceChildren("[data-slider]", inner(bindings));
});

hooks.fragment.update("slider", (bindings, ops) => {
	const min = bindings.min ?? 0;
	const max = bindings.max ?? 100;
	const value = clampValue(bindings);
	const pct = `${(fraction(value, min, max) * 100).toFixed(3)}%`;
	ops.setAttr("[data-root]", "class", sliderClass(bindings));
	ops.setAttr(".xtyle-slider__thumb", "aria-valuenow", String(value));
	const valueText = readout(bindings, value);
	ops.setAttr(".xtyle-slider__thumb", "aria-valuetext", valueText !== String(value) ? valueText : "");
	ops.setAttr(".xtyle-slider__thumb", "tabindex", bindings.disabled ? "-1" : "0");
	ops.setAttr(".xtyle-slider__thumb", "style", `inset-inline-start: ${pct}`);
	ops.setAttr(".xtyle-slider__fill", "style", `width: ${pct}`);
	if (bindings.showValue) ops.setText(".xtyle-slider__value", readout(bindings, value));
});

function clamp(next: number, ctx: KeyContext): number {
	const step = ctx.step > 0 ? ctx.step : 1;
	if (Number.isNaN(next)) return ctx.min;
	const snapped = Math.round((next - ctx.min) / step) * step + ctx.min;
	return Math.min(ctx.max, Math.max(ctx.min, Number(snapped.toFixed(6))));
}

xript.exports.register("keyAdjust", (payload: unknown, context: unknown): Intent => {
	const e = payload as EventPayload;
	if (e.disabled || e.ariaDisabled === "true") return {};
	const ctx = context as KeyContext;
	const big = (ctx.step > 0 ? ctx.step : 1) * 10;
	let next: number | null = null;
	switch (e.key) {
		case "ArrowRight":
		case "ArrowUp":
			next = ctx.value + ctx.step;
			break;
		case "ArrowLeft":
		case "ArrowDown":
			next = ctx.value - ctx.step;
			break;
		case "PageUp":
			next = ctx.value + big;
			break;
		case "PageDown":
			next = ctx.value - big;
			break;
		case "Home":
			next = ctx.min;
			break;
		case "End":
			next = ctx.max;
			break;
	}
	if (next === null) return {};
	return { setValue: clamp(next, ctx), commit: "change", preventDefault: true };
});
