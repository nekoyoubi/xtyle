import { escapeAttr, escapeHtml } from "../escape.js";

interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
	addClass(selector: string, className: string): void;
	removeClass(selector: string, className: string): void;
}

interface Swatch {
	entry: string;
	hex: string;
	pressed: boolean;
}

interface Channel {
	label: string;
	name: string;
	min: number;
	max: number;
	step: number;
	value: number;
	formatted: string;
}

interface NamedSnap {
	text: string;
	aria: string;
}

/** One related color from the active harmony scheme. The scheme fixes how many there are, so the
 * chips are built once here and the host only repaints their color as the base color moves. */
interface HarmonyChip {
	hex: string;
}

/** The color-math-derived inputs the host computes (the sandbox can't run color conversion);
 * the mod assembles the structure from them, mirroring `colorPickerMarkup`. */
interface ColorPickerBindings {
	disabled?: boolean;
	label?: string | null;
	labelledby?: string | null;
	elementId?: string;
	formatLabel?: string;
	planeEnabled?: boolean;
	triggerEnabled?: boolean;
	alphaEnabled?: boolean;
	channelModelLabel?: string | null;
	harmonyScheme?: string | null;
	hasContrast?: boolean;
	hasEyeDropper?: boolean;
	planeWidth?: number;
	planeHeight?: number;
	swatches?: Swatch[];
	channels?: Channel[];
	snapTargets?: string[];
	namedSnap?: NamedSnap | null;
	harmonyChips?: HarmonyChip[];
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: ColorPickerBindings, ops: OpsBuilder) => void) => void };
};

const EYEDROPPER_ICON =
	'<svg viewBox="0 0 24 24" aria-hidden="true">' +
	'<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="m18 3 3 3-9 9-4 1 1-4 9-9ZM5 21l3-3" /></svg>';

const TRIGGER_CARET =
	'<svg class="xtyle-color-picker__trigger-caret" viewBox="0 0 12 12" aria-hidden="true">' +
	'<path d="M3 5l3 3 3-3" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>';

function rootClass(b: ColorPickerBindings): string {
	const parts = ["xtyle-color-picker"];
	if (b.disabled) parts.push("xtyle-color-picker--disabled");
	if (b.triggerEnabled) parts.push("xtyle-color-picker--trigger");
	return parts.join(" ");
}

function tabindex(b: ColorPickerBindings): string {
	return b.disabled ? "-1" : "0";
}

function labelSpan(b: ColorPickerBindings): string {
	const labelId = `${b.elementId ?? "xtyle-color-picker"}-label`;
	return b.label ? `<span class="xtyle-color-picker__label" part="label" id="${escapeAttr(labelId)}">${escapeHtml(b.label)}</span>` : "";
}

function rootLabelledby(b: ColorPickerBindings): string | null {
	if (b.labelledby) return b.labelledby;
	if (b.label) return `${b.elementId ?? "xtyle-color-picker"}-label`;
	return null;
}

function presets(b: ColorPickerBindings): string {
	const swatches = b.swatches ?? [];
	if (!swatches.length) return "";
	const disabledAttr = b.disabled ? " disabled" : "";
	const chips = swatches
		.map(
			(s) =>
				`<button class="xtyle-color-picker__preset" part="preset" type="button" data-color="${escapeAttr(s.entry)}" data-hex="${escapeAttr(s.hex)}" style="--cp-chip: ${escapeAttr(s.hex)}" aria-label="${escapeAttr(s.entry)}" aria-pressed="${String(s.pressed)}"${disabledAttr}></button>`,
		)
		.join("");
	return `<div class="xtyle-color-picker__presets" part="presets" role="group" aria-label="Preset colors">${chips}</div>`;
}

function contrastPanel(b: ColorPickerBindings): string {
	if (!b.hasContrast) return "";
	return (
		`<div class="xtyle-color-picker__contrast" part="contrast">` +
		`<div class="xtyle-color-picker__contrast-sample" aria-hidden="true">Aa</div>` +
		`<div class="xtyle-color-picker__contrast-readout">` +
		`<span class="xtyle-color-picker__contrast-ratio">1.00</span>` +
		`<span class="xtyle-color-picker__contrast-badges">` +
		`<span class="xtyle-color-picker__contrast-badge" data-level="aa">AA</span>` +
		`<span class="xtyle-color-picker__contrast-badge" data-level="aaa">AAA</span>` +
		`</span></div></div>`
	);
}

function alphaTrack(b: ColorPickerBindings): string {
	if (!b.alphaEnabled) return "";
	return (
		`<div class="xtyle-color-picker__alpha" part="alpha">` +
		`<div class="xtyle-color-picker__alpha-handle" part="alpha-handle" role="slider" tabindex="${tabindex(b)}" aria-label="Opacity" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100"></div></div>`
	);
}

function harmonyRow(b: ColorPickerBindings): string {
	if (!b.harmonyScheme) return "";
	const disabledAttr = b.disabled ? " disabled" : "";
	const chips = (b.harmonyChips ?? [])
		.map(
			(c) =>
				`<button class="xtyle-color-picker__preset xtyle-color-picker__harmony-chip" part="harmony-chip" type="button" data-color="${escapeAttr(c.hex)}" data-hex="${escapeAttr(c.hex)}" style="--cp-chip: ${escapeAttr(c.hex)}" aria-label="${escapeAttr(c.hex)}" aria-pressed="false"${disabledAttr}></button>`,
		)
		.join("");
	return `<div class="xtyle-color-picker__presets xtyle-color-picker__harmony" part="harmony" role="group" aria-label="${escapeAttr(b.harmonyScheme)} harmony">${chips}</div>`;
}

function channelRows(b: ColorPickerBindings): string {
	const model = b.channelModelLabel;
	if (!model) return "";
	const disabledAttr = b.disabled ? " disabled" : "";
	const sliders = (b.channels ?? [])
		.map(
			(c) =>
				`<label class="xtyle-color-picker__channel" part="channel">` +
				`<span class="xtyle-color-picker__channel-label" aria-hidden="true">${escapeHtml(c.label)}</span>` +
				`<input class="xtyle-color-picker__channel-input" part="channel-input" type="range" min="${c.min}" max="${c.max}" step="${c.step}" value="${c.value}" aria-label="${escapeAttr(c.name)}" aria-valuetext="${escapeAttr(c.formatted)}"${disabledAttr} />` +
				`<span class="xtyle-color-picker__channel-value" part="channel-value" aria-hidden="true">${escapeHtml(c.formatted)}</span></label>`,
		)
		.join("");
	return `<div class="xtyle-color-picker__channels" part="channels" role="group" aria-label="${escapeAttr(model)} channels">${sliders}</div>`;
}

function planeBlock(b: ColorPickerBindings): string {
	if (!b.planeEnabled) return "";
	const w = b.planeWidth ?? 160;
	const h = b.planeHeight ?? 120;
	return (
		`<div class="xtyle-color-picker__plane-field" part="plane-field">` +
		`<div class="xtyle-color-picker__plane-wrap" part="plane-wrap">` +
		`<canvas class="xtyle-color-picker__plane" part="plane" width="${w}" height="${h}"></canvas>` +
		`<div class="xtyle-color-picker__plane-handle" part="plane-handle" role="slider" tabindex="${tabindex(b)}" aria-label="OKLCH lightness and chroma" aria-valuetext="" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>` +
		`</div><div class="xtyle-color-picker__plane-readout" part="plane-readout" aria-hidden="true"></div></div>`
	);
}

function snapsRow(b: ColorPickerBindings): string {
	const targets = b.snapTargets ?? [];
	if (!targets.length) return "";
	const disabledAttr = b.disabled ? " disabled" : "";
	const buttons = targets
		.map((target) => {
			if (target === "named") {
				const labels = b.namedSnap ?? { text: "", aria: "Snap to the nearest named color" };
				return `<button class="xtyle-color-picker__snap xtyle-color-picker__snap--named" part="snap" type="button" data-snap="named" aria-label="${labels.aria}"${disabledAttr}>${labels.text}</button>`;
			}
			return `<button class="xtyle-color-picker__snap" part="snap" type="button" data-snap="web-safe" aria-label="Snap to the nearest web-safe color"${disabledAttr}>Web-safe</button>`;
		})
		.join("");
	return `<div class="xtyle-color-picker__snaps" part="snaps" role="group" aria-label="Snap to palette">${buttons}</div>`;
}

function field(b: ColorPickerBindings): string {
	const disabledAttr = b.disabled ? " disabled" : "";
	const formatLabel = b.formatLabel ?? "HEX";
	const eyedropper = b.hasEyeDropper
		? `<button class="xtyle-color-picker__eyedropper" part="eyedropper" type="button" aria-label="Pick a color from the screen"${disabledAttr}>${EYEDROPPER_ICON}</button>`
		: "";
	return (
		`<div class="xtyle-color-picker__field" part="field">` +
		`<button class="xtyle-color-picker__format" part="format" type="button" aria-label="Cycle color format"${disabledAttr}>${escapeHtml(formatLabel)}</button>` +
		`<input class="xtyle-color-picker__value" part="value" type="text" inputmode="text" spellcheck="false" autocomplete="off" aria-label="Color value"${disabledAttr} />` +
		`${eyedropper}</div>`
	);
}

function body(b: ColorPickerBindings): string {
	return (
		`<div class="xtyle-color-picker__area" part="area">` +
		`<div class="xtyle-color-picker__sv-handle" part="sv-handle" role="slider" tabindex="${tabindex(b)}" aria-label="Saturation and brightness" aria-valuetext="" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div></div>` +
		planeBlock(b) +
		`<div class="xtyle-color-picker__controls" part="controls">` +
		`<div class="xtyle-color-picker__swatch" part="swatch" aria-hidden="true"></div>` +
		`<div class="xtyle-color-picker__sliders">` +
		`<div class="xtyle-color-picker__hue" part="hue">` +
		`<div class="xtyle-color-picker__hue-handle" part="hue-handle" role="slider" tabindex="${tabindex(b)}" aria-label="Hue" aria-valuemin="0" aria-valuemax="360" aria-valuenow="0"></div></div>` +
		alphaTrack(b) +
		field(b) +
		`</div></div>` +
		channelRows(b) +
		snapsRow(b) +
		presets(b) +
		harmonyRow(b) +
		contrastPanel(b)
	);
}

function shell(b: ColorPickerBindings): string {
	if (!b.triggerEnabled) return body(b);
	const disabledAttr = b.disabled ? " disabled" : "";
	const popoverId = `${b.elementId ?? "xtyle-color-picker"}-popover`;
	return (
		`<button class="xtyle-color-picker__trigger" part="trigger" type="button" popovertarget="${escapeAttr(popoverId)}" aria-haspopup="dialog" aria-expanded="false" aria-label="Open color picker"${disabledAttr}>${TRIGGER_CARET}</button>` +
		`<div class="xtyle-color-picker__popover" part="popover" id="${escapeAttr(popoverId)}" popover>${body(b)}</div>`
	);
}

function inner(b: ColorPickerBindings): string {
	return labelSpan(b) + shell(b);
}

hooks.fragment.mount("color-picker", (bindings, ops) => {
	ops.setAttr(".xtyle-color-picker", "class", rootClass(bindings));
	ops.setAttr("[data-root]", "role", "group");
	const labelledby = rootLabelledby(bindings);
	if (labelledby) ops.setAttr("[data-root]", "aria-labelledby", labelledby);
	ops.replaceChildren("[data-root]", inner(bindings));
});

/** A cheap, focus-preserving patch: only the root class (the disabled toggle). Everything visual is
 * painted in place by the host; any change ops can't express (presets, plane, channels, trigger,
 * accessible-name shape) triggers a host `remount()` rather than a rebuild here. */
hooks.fragment.update("color-picker", (bindings, ops) => {
	ops.setAttr(".xtyle-color-picker", "class", rootClass(bindings));
});
