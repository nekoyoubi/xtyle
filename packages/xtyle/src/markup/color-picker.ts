import {
	channelsOf,
	colorToChannels,
	formatColor,
	hsvToRgb,
	nearestNamedColor,
	oklchToDisplay,
	parseColor,
	type ChannelDef,
	type ChannelModel,
	type ColorFormat,
	type HarmonyScheme,
} from "../convert.js";

/** The chroma axis cap and internal canvas resolution for the OKLCH perceptual plane. */
export const PLANE_MAX_C = 0.4;
export const PLANE_W = 160;
export const PLANE_H = 120;
/** Out-of-gamut samples desaturate toward their own luma (greyed, not darkened) with a contour at the edge. */
export const OUT_OF_GAMUT_DESAT = 0.8;
export const PLANE_EDGE_SHADE = 0.45;

export interface Hsv {
	h: number;
	s: number;
	v: number;
}

export function clamp01(n: number): number {
	return Math.min(1, Math.max(0, n));
}

/** Render a channel value to the precision its step implies (0.001 → 3 dp, 1 → integer). */
export function formatChannelValue(value: number, def: ChannelDef): string {
	const decimals = def.step >= 1 ? 0 : Math.min(3, Math.ceil(-Math.log10(def.step)));
	return `${value.toFixed(decimals)}${def.unit ?? ""}`;
}

export function namedSnapLabel(name: string): { text: string; aria: string } {
	return { text: `≈ ${name}`, aria: `Snap to the nearest named color: ${name}` };
}

export function channelSliders(model: ChannelModel, hsv: Hsv, alpha: number, disabled: boolean): string {
	const values = colorToChannels(hsvToRgb({ ...hsv, alpha }), model);
	return channelsOf(model)
		.map((def, i) => {
			const value = values[i] ?? def.min;
			const name = `${def.label}${def.unit ? ` (${def.unit})` : ""}`;
			const formatted = formatChannelValue(value, def);
			return `<label class="xtyle-color-picker__channel" part="channel"><span class="xtyle-color-picker__channel-label" aria-hidden="true">${def.label}</span><input class="xtyle-color-picker__channel-input" part="channel-input" type="range" min="${def.min}" max="${def.max}" step="${def.step}" value="${value}" aria-label="${name}" aria-valuetext="${formatted}"${disabled ? " disabled" : ""} /><span class="xtyle-color-picker__channel-value" part="channel-value" aria-hidden="true">${formatted}</span></label>`;
		})
		.join("");
}

export interface ColorPickerMarkupProps {
	/** The live HSV state (derived from the `value` attribute / color string). */
	hsv: Hsv;
	/** The live alpha (0–1); only surfaced when `alphaEnabled`. */
	alpha: number;
	/** The resolved readout format (already clamped to the `modes` set). */
	format: ColorFormat;
	/** The resolved channel-slider model, or null when channels are off. */
	channelModel: ChannelModel | null;
	/** The resolved snap targets (web-safe / named), empty when snapping is off. */
	snapTargets: string[];
	/** The parsed preset swatch strings (the raw `swatches` entries). */
	swatches: string[];
	/** Whether the OKLCH perceptual plane is shown. */
	planeEnabled: boolean;
	/** Whether the picker collapses to a trigger button + popover. */
	triggerEnabled: boolean;
	/** The active harmony scheme, or null. */
	harmonyScheme: HarmonyScheme | null;
	/** Whether the alpha track is shown. */
	alphaEnabled: boolean;
	/** The contrast comparison color string, or null. */
	contrastAgainst: string | null;
	disabled: boolean;
	label: string | null;
	labelledby: string | null;
	/** Stable id seed for the label, popover, and `aria` wiring. */
	elementId: string;
	/** Whether the EyeDropper API is available (the element gates the button on it). */
	hasEyeDropper: boolean;
}

/** The current alpha respecting the opt-in: 1 unless alpha is enabled. */
function currentAlpha(props: ColorPickerMarkupProps): number {
	return props.alphaEnabled ? props.alpha : 1;
}

/**
 * The single source of a color picker's shadow markup. The custom element renders it into
 * its shadow root at runtime; the `@xtyle/astro` binding emits the same string into a
 * declarative shadow root at build. Both paths render one identical control from one
 * source — no per-binding reimplementation. Pure and DOM-free, so it is safe to
 * import in any environment (SSR included). The handle positions and live readouts are
 * painted in place by the element after hydration; the SSR shadow is the static fallback.
 */
export function colorPickerMarkup(props: ColorPickerMarkupProps): string {
	const labelText = props.label;
	const labelledby = props.labelledby;
	const labelId = `${props.elementId}-label`;
	const groupName = labelledby
		? ` aria-labelledby="${labelledby}"`
		: labelText
			? ` aria-labelledby="${labelId}"`
			: "";
	const tabindex = props.disabled ? "-1" : "0";
	const disabledClass = props.disabled ? " xtyle-color-picker--disabled" : "";
	const disabledAttr = props.disabled ? " disabled" : "";
	const label = labelText
		? `<span class="xtyle-color-picker__label" part="label" id="${labelId}">${labelText}</span>`
		: "";
	const eyedropper = props.hasEyeDropper
		? `<button class="xtyle-color-picker__eyedropper" part="eyedropper" type="button" aria-label="Pick a color from the screen"${disabledAttr}><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="m18 3 3 3-9 9-4 1 1-4 9-9ZM5 21l3-3" /></svg></button>`
		: "";
	const currentHex = formatColor(hsvToRgb({ ...props.hsv, alpha: props.alpha }), "hex");
	const swatches = props.swatches
		.map((entry) => {
			const parsed = parseColor(entry);
			return parsed ? { entry, hex: formatColor(parsed, "hex") } : null;
		})
		.filter((s): s is { entry: string; hex: string } => s !== null);
	const presets = swatches.length
		? `<div class="xtyle-color-picker__presets" part="presets" role="group" aria-label="Preset colors">${swatches
				.map(
					({ entry, hex }) =>
						`<button class="xtyle-color-picker__preset" part="preset" type="button" data-color="${entry}" data-hex="${hex}" style="--cp-chip: ${hex}" aria-label="${entry}" aria-pressed="${String(hex.toLowerCase() === currentHex.toLowerCase())}"${disabledAttr}></button>`,
				)
				.join("")}</div>`
		: "";
	const contrastPanel = props.contrastAgainst && parseColor(props.contrastAgainst)
		? `<div class="xtyle-color-picker__contrast" part="contrast"><div class="xtyle-color-picker__contrast-sample" aria-hidden="true">Aa</div><div class="xtyle-color-picker__contrast-readout"><span class="xtyle-color-picker__contrast-ratio">1.00</span><span class="xtyle-color-picker__contrast-badges"><span class="xtyle-color-picker__contrast-badge" data-level="aa">AA</span><span class="xtyle-color-picker__contrast-badge" data-level="aaa">AAA</span></span></div></div>`
		: "";
	const alphaTrack = props.alphaEnabled
		? `<div class="xtyle-color-picker__alpha" part="alpha"><div class="xtyle-color-picker__alpha-handle" part="alpha-handle" role="slider" tabindex="${tabindex}" aria-label="Opacity" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100"></div></div>`
		: "";
	const harmonyRow = props.harmonyScheme
		? `<div class="xtyle-color-picker__presets xtyle-color-picker__harmony" part="harmony" role="group" aria-label="${props.harmonyScheme} harmony"></div>`
		: "";
	const channelModel = props.channelModel;
	const channelRows = channelModel
		? `<div class="xtyle-color-picker__channels" part="channels" role="group" aria-label="${channelModel.toUpperCase()} channels">${channelSliders(channelModel, props.hsv, currentAlpha(props), props.disabled)}</div>`
		: "";
	const planeBlock = props.planeEnabled
		? `<div class="xtyle-color-picker__plane-field" part="plane-field"><div class="xtyle-color-picker__plane-wrap" part="plane-wrap"><canvas class="xtyle-color-picker__plane" part="plane" width="${PLANE_W}" height="${PLANE_H}"></canvas><div class="xtyle-color-picker__plane-handle" part="plane-handle" role="slider" tabindex="${tabindex}" aria-label="OKLCH lightness and chroma" aria-valuetext="" aria-valuemin="0" aria-valuemax="100"></div></div><div class="xtyle-color-picker__plane-readout" part="plane-readout" aria-hidden="true"></div></div>`
		: "";
	const snapTargets = props.snapTargets;
	const snapsRow = snapTargets.length
		? `<div class="xtyle-color-picker__snaps" part="snaps" role="group" aria-label="Snap to palette">${snapTargets
				.map((target) => {
					if (target === "named") {
						const labels = namedSnapLabel(nearestNamedColor(hsvToRgb({ ...props.hsv, alpha: currentAlpha(props) })).name);
						return `<button class="xtyle-color-picker__snap xtyle-color-picker__snap--named" part="snap" type="button" data-snap="named" aria-label="${labels.aria}"${disabledAttr}>${labels.text}</button>`;
					}
					return `<button class="xtyle-color-picker__snap" part="snap" type="button" data-snap="web-safe" aria-label="Snap to the nearest web-safe color"${disabledAttr}>Web-safe</button>`;
				})
				.join("")}</div>`
		: "";

	const body = `<div class="xtyle-color-picker__area" part="area"><div class="xtyle-color-picker__sv-handle" part="sv-handle" role="slider" tabindex="${tabindex}" aria-label="Saturation and brightness" aria-valuetext="" aria-valuemin="0" aria-valuemax="100"></div></div>${planeBlock}<div class="xtyle-color-picker__controls" part="controls"><div class="xtyle-color-picker__swatch" part="swatch" aria-hidden="true"></div><div class="xtyle-color-picker__sliders"><div class="xtyle-color-picker__hue" part="hue"><div class="xtyle-color-picker__hue-handle" part="hue-handle" role="slider" tabindex="${tabindex}" aria-label="Hue" aria-valuemin="0" aria-valuemax="360" aria-valuenow="0"></div></div>${alphaTrack}<div class="xtyle-color-picker__field" part="field"><button class="xtyle-color-picker__format" part="format" type="button" aria-label="Cycle color format"${disabledAttr}>${props.format.toUpperCase()}</button><input class="xtyle-color-picker__value" part="value" type="text" inputmode="text" spellcheck="false" autocomplete="off" aria-label="Color value"${disabledAttr} />${eyedropper}</div></div></div>${channelRows}${snapsRow}${presets}${harmonyRow}${contrastPanel}`;
	const triggerBadge =
		props.triggerEnabled && props.contrastAgainst && parseColor(props.contrastAgainst)
			? `<span class="xtyle-color-picker__trigger-badge" part="trigger-badge" data-level="" aria-hidden="true"></span>`
			: "";
	const shell = props.triggerEnabled
		? `<button class="xtyle-color-picker__trigger" part="trigger" type="button" popovertarget="${props.elementId}-popover" aria-label="Open color picker"${disabledAttr}><svg class="xtyle-color-picker__trigger-caret" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 5l3 3 3-3" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>${triggerBadge}</button><div class="xtyle-color-picker__popover" part="popover" id="${props.elementId}-popover" popover>${body}</div>`
		: body;
	return `<div class="xtyle-color-picker${disabledClass}${props.triggerEnabled ? " xtyle-color-picker--trigger" : ""}" part="picker" role="group"${groupName}>${label}${shell}</div>`;
}

/** The host-layout rule for a color picker — the one `:host` rule, shared by the element's `styles()` and the SSR declarative shadow root. */
export const colorPickerHostCss = ":host { display: inline-block; }";
