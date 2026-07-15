import type { ComponentManifest } from "./types.js";

const htmlExample = `<xtyle-color-picker label="Brand color" value="#5b8cff"></xtyle-color-picker>

<!-- reads out and submits in OKLCH; still accepts any CSS color typed in -->
<xtyle-color-picker label="Perceptual" value="oklch(0.72 0.15 250)" format="oklch"></xtyle-color-picker>

<!-- per-channel sliders for the chosen model -->
<xtyle-color-picker label="RGB channels" value="#5b8cff" channels="rgb"></xtyle-color-picker>

<xtyle-color-picker label="Palette snap" value="#5b8cff" snap="web-safe,named"></xtyle-color-picker>

<xtyle-color-picker label="Perceptual plane" value="oklch(0.72 0.15 250)" format="oklch" plane></xtyle-color-picker>

<xtyle-color-picker label="Brand color" value="#5b8cff" trigger></xtyle-color-picker>

<xtyle-color-picker label="Locked" value="#e25b99" disabled></xtyle-color-picker>`;

const svelteExample = `<script lang="ts">
	import { ColorPicker } from "@xtyle/svelte";

	let brand = $state("#5b8cff");
</script>

<ColorPicker label="Brand color" bind:value={brand} />

<ColorPicker label="Perceptual" value="oklch(0.72 0.15 250)" format="oklch" />

<ColorPicker label="RGB channels" value="#5b8cff" channels="rgb" />

<ColorPicker label="Palette snap" value="#5b8cff" snap="web-safe,named" />

<ColorPicker label="Perceptual plane" value="oklch(0.72 0.15 250)" format="oklch" plane />

<ColorPicker label="Brand color" value="#5b8cff" trigger />

<ColorPicker label="Locked" value="#e25b99" disabled />`;

const astroExample = `---
import { ColorPicker } from "@xtyle/astro";
---

<ColorPicker label="Brand color" value="#5b8cff" />

<ColorPicker label="Perceptual" value="oklch(0.72 0.15 250)" format="oklch" />

<ColorPicker label="RGB channels" value="#5b8cff" channels="rgb" />

<ColorPicker label="Palette snap" value="#5b8cff" snap="web-safe,named" />

<ColorPicker label="Perceptual plane" value="oklch(0.72 0.15 250)" format="oklch" plane />

<ColorPicker label="Brand color" value="#5b8cff" trigger />

<ColorPicker label="Locked" value="#e25b99" disabled />`;

export const colorPickerManifest: ComponentManifest = {
	id: "color-picker",
	name: "Color Picker",
	category: "form",
	since: "0.1.0",
	keywords: ["color input", "hsv", "hsl", "eyedropper", "palette", "swatch picker"],
	seeAlso: ["swatch", "slider"],
	summary: "An inline HSV color picker: a saturation/brightness field, a hue track with an opt-in alpha track, optional per-channel sliders for any model, and a switchable multi-format value field.",
	description:
		"Color Picker chooses a color by hue, saturation, brightness, and opacity. A saturation/brightness field (the hue painted under white→transparent and transparent→black gradients) carries a draggable `role=\"slider\"` handle moved by pointer or arrow keys; a rainbow hue track sets the field's hue; an opt-in alpha track (off by default) sets opacity over a checkerboard; and a value field reflects the color in a switchable format (`hex`, `rgb`, `hsl`, `oklch`, `lab`, `lch`, `oklab`, or `cmyk`) while accepting any CSS Color 4 string (named, `#rrggbb`/`#rrggbbaa`, `rgb()`, `hsl()`, `oklch()`, …) plus profile-free `cmyk()`, and reformatting on commit. A `format` button cycles the readout, and a `modes` knob narrows which spaces it offers. Set `channels` to a model (`rgb`, `hsl`, `hsv`, `oklch`, `lab`, `lch`, `oklab`, or `cmyk`) and a stack of native range sliders appears, one per channel of that model, each with a live numeric readout and editable directly; every edit round-trips through the same engine math and re-threads the rest of the picker. Set `plane` and an OKLCH perceptual plane appears: a lightness × chroma `<canvas>` field at the current hue (its chroma axis sized to the hue's reach), with colors outside the sRGB gamut desaturated and edged with a contour so the boundary reads rather than clamping flat, a draggable handle, and a live `L · C` readout. The color math lives in `@xtyle/core` (culori-backed), so parsing, formatting, and channel decomposition belong to the engine, not the component. Where the browser supports it, an eyedropper button samples a color from anywhere on screen, a `swatches` list adds a row of preset chips below the picker, a `harmony` scheme generates a live row of related colors (complementary, triadic, analogous, and more) each clickable to adopt, `contrastAgainst` adds a live WCAG panel grading the current color against a reference, and a `snap` set adds palette-snap buttons: quantize to the 216-color web-safe cube, or jump to the perceptually nearest CSS named color (shown live on the button). It is form-associated. Give it a `name` and it submits the current value. It renders inline by default, or set `trigger` to collapse it to a swatch button that opens the full UI in an anchored, light-dismissable popover. It composes the same rail-and-handle mechanics as Slider.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "picker",
			description: "The `role=\"group\"` wrapper stacking the optional label, the field, and the controls row.",
			selector: ".xtyle-color-picker",
			tokens: ["--font-sans", "--fg-0", "--space-2"],
		},
		{
			name: "area",
			description: "The saturation (x) / brightness (y) field, painted with the current hue under two gradients.",
			selector: ".xtyle-color-picker__area",
			tokens: ["--radius-md", "--border-thin", "--line-2"],
		},
		{
			name: "sv-handle",
			description: "The draggable `role=\"slider\"` handle marking the chosen saturation and brightness; filled with the current color.",
			selector: ".xtyle-color-picker__sv-handle",
			tokens: ["--space-4", "--radius-full", "--border-thick", "--bg-0", "--elevation-1"],
		},
		{
			name: "plane",
			description: "The optional OKLCH perceptual plane (shown when `plane` is set): a `<canvas>` painting lightness (y) × chroma (x) at the current hue, with out-of-gamut samples desaturated and a contour at the gamut boundary.",
			selector: ".xtyle-color-picker__plane",
			tokens: ["--radius-md", "--border-thin", "--line-2"],
		},
		{
			name: "plane-handle",
			description: "The draggable `role=\"slider\"` handle on the OKLCH plane, marking the current lightness and chroma; filled with the current color.",
			selector: ".xtyle-color-picker__plane-handle",
			tokens: ["--space-4", "--radius-full", "--border-thick", "--bg-0", "--elevation-1", "--ring", "--border-normal"],
		},
		{
			name: "plane-readout",
			description: "The live `L · C` caption under the OKLCH plane, naming its axes and distinguishing it from the HSV field.",
			selector: ".xtyle-color-picker__plane-readout",
			tokens: ["--font-mono", "--text-xs", "--fg-1"],
		},
		{
			name: "swatch",
			description: "A static preview of the current color.",
			selector: ".xtyle-color-picker__swatch",
			tokens: ["--space-6", "--radius-sm", "--border-thin", "--line-2"],
		},
		{
			name: "hue",
			description: "The rainbow hue track with its own `role=\"slider\"` handle.",
			selector: ".xtyle-color-picker__hue",
			tokens: ["--space-2", "--radius-full", "--border-thin", "--line-2"],
		},
		{
			name: "alpha",
			description: "The opt-in opacity track: the current color faded to transparent over a checkerboard, with its own `role=\"slider\"` handle. Present only when `alpha` is set.",
			selector: ".xtyle-color-picker__alpha",
			tokens: ["--space-2", "--radius-full", "--border-thin", "--line-2", "--space-4", "--border-thick", "--bg-0", "--elevation-1"],
		},
		{
			name: "format",
			description: "The button that cycles the readout format (`HEX` → `RGB` → `HSL` → `OKLCH`).",
			selector: ".xtyle-color-picker__format",
			tokens: ["--font-mono", "--text-xs", "--weight-medium", "--fg-1", "--bg-2", "--state-hover", "--border-thin", "--line-2", "--radius-sm", "--space-1", "--space-2", "--duration-fast", "--ease-standard"],
		},
		{
			name: "value",
			description: "The monospace input that reflects the color in the active format and parses any CSS Color 4 string.",
			selector: ".xtyle-color-picker__value",
			tokens: ["--font-mono", "--text-sm", "--fg-0", "--bg-0", "--border-thin", "--line-2", "--radius-sm", "--space-1", "--space-2"],
		},
		{
			name: "eyedropper",
			description: "The screen-sampling button; present only where the browser exposes the `EyeDropper` API (Chromium today).",
			selector: ".xtyle-color-picker__eyedropper",
			tokens: ["--space-6", "--fg-0", "--fg-1", "--bg-2", "--state-hover", "--border-thin", "--line-2", "--radius-sm", "--border-normal", "--border-thick", "--ring", "--duration-fast", "--ease-standard"],
		},
		{
			name: "presets",
			description: "The optional row of preset color chips from `swatches`, over a checkerboard for alpha; the active color's chip is pressed.",
			selector: ".xtyle-color-picker__preset",
			tokens: ["--space-1", "--space-4", "--border-thin", "--line-2", "--radius-sm", "--border-normal", "--border-thick", "--ring"],
		},
		{
			name: "harmony",
			description: "The optional row of related-color chips from `harmony`. The scheme fixes how many chips there are, so they are built once and only recolored as the color changes; each reuses the preset chip styling.",
			selector: ".xtyle-color-picker__harmony",
		},
		{
			name: "channels",
			description: "The optional per-channel slider stack (shown when `channels` names a model): one labeled native range input per channel, each with a live numeric readout.",
			selector: ".xtyle-color-picker__channels",
			tokens: ["--space-1", "--space-2", "--font-mono", "--text-xs", "--fg-1", "--accent", "--border-normal", "--border-thick", "--ring"],
		},
		{
			name: "snaps",
			description: "The optional palette-snap buttons (from `snap`): a `web-safe` quantizer and a `named` button that reads out and adopts the nearest CSS named color.",
			selector: ".xtyle-color-picker__snaps",
			tokens: ["--space-1", "--space-2", "--font-mono", "--text-xs", "--weight-medium", "--fg-0", "--fg-1", "--bg-2", "--state-hover", "--border-thin", "--line-2", "--radius-sm", "--border-normal", "--border-thick", "--ring", "--duration-fast", "--ease-standard"],
		},
		{
			name: "contrast",
			description: "The optional WCAG panel (shown when `contrastAgainst` is set): a sample swatch, the ratio, and AA/AAA grades that go green on pass, red on fail.",
			selector: ".xtyle-color-picker__contrast",
			tokens: ["--space-1", "--space-2", "--space-6", "--radius-sm", "--border-thin", "--line-2", "--fg-0", "--fg-1", "--bg-0", "--font-mono", "--text-sm", "--text-xs", "--weight-medium", "--success-text", "--danger-text"],
		},
		{
			name: "trigger",
			description: "The swatch button (shown when `trigger` is set) that opens the picker popover; reflects the current color over a checkerboard, with a corner caret marking it as openable and a hover lift.",
			selector: ".xtyle-color-picker__trigger",
			tokens: ["--space-6", "--border-thin", "--line-2", "--radius-sm", "--border-normal", "--border-thick", "--ring", "--elevation-1", "--duration-fast", "--ease-standard"],
		},
		{
			name: "trigger-badge",
			description: "The WCAG rating chip overlaid on the trigger swatch (shown when `trigger` and `contrastAgainst` are both set): AAA reads `success`, AA reads `info`, A (large-text floor) reads `warn`, and a sub-AA hazard reads `danger`, so the safety of the current color against its reference is legible without opening the picker.",
			selector: ".xtyle-color-picker__trigger-badge",
			tokens: ["--radius-sm", "--weight-bold", "--neutral", "--neutral-fg", "--success", "--success-fg", "--info", "--info-fg", "--warn", "--warn-fg", "--danger", "--danger-fg"],
		},
		{
			name: "popover",
			description: "The anchored panel (shown when `trigger` is set) holding the picker UI in the top layer; native light-dismiss and `Esc` close it.",
			selector: ".xtyle-color-picker__popover",
			tokens: ["--space-2", "--bg-0", "--border-thin", "--line-2", "--radius-md", "--elevation-3"],
		},
		{
			name: "label",
			description: "The optional visible label, referenced as the group's accessible name.",
			selector: ".xtyle-color-picker__label",
			tokens: ["--fg-1", "--text-sm"],
		},
	],
	props: [
		{
			name: "value",
			type: "string",
			default: "#5b8cff",
			description: "The current color. Accepts any CSS Color 4 string on the way in; reflects to `.value` and submits to a form in the active `format`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "format",
			type: "ColorFormat",
			default: "hex",
			description: "The readout format for the value field and the submitted value. The `format` button cycles it live, through the `modes` set.",
			bindings: ["html", "svelte", "astro"],
			options: ["hex", "rgb", "hsl", "oklch", "lab", "lch", "oklab", "cmyk"],
		},
		{
			name: "modes",
			type: "string",
			description: "A comma-separated subset of the formats the `format` button cycles, in order (e.g. `hex,oklch,lab`). Defaults to all eight; unknown names are ignored. Lets an author offer exactly the color spaces they want.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "channels",
			type: "ChannelModel",
			description: "When set to a model name, shows a stack of per-channel range sliders for that model: `rgb`, `hsl`, `hsv`, `oklch`, `lab`, `lch`, `oklab`, or `cmyk`. A bare or unknown value falls back to `rgb`. Each slider edits one channel and re-derives the color through the engine.",
			bindings: ["html", "svelte", "astro"],
			options: ["rgb", "hsl", "hsv", "oklch", "lab", "lch", "oklab", "cmyk"],
		},
		{
			name: "snap",
			type: "string",
			description: "A comma-separated set of palette-snap buttons: `web-safe` quantizes each channel to the 216-color web cube, and `named` snaps to the perceptually nearest CSS named color (its name shown live on the button). A bare or unknown value offers both.",
			bindings: ["html", "svelte", "astro"],
			options: ["web-safe", "named"],
		},
		{
			name: "plane",
			type: "boolean",
			default: "false",
			description: "Adds the OKLCH perceptual plane: a lightness × chroma field at the current hue, painted per-pixel on a `<canvas>` with colors outside the sRGB gamut desaturated and a contour drawn at the boundary so the gamut edge reads rather than clamping flat. The chroma axis is sized to the hue's in-gamut reach. Drag or arrow the handle to set lightness and chroma; a live `L · C` readout sits below.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "trigger",
			type: "boolean",
			default: "false",
			description: "Collapses the picker to a swatch button that opens the full UI in an anchored popover (native top-layer, light-dismiss, `Esc`) instead of rendering inline. The button reflects the current color and sits where the picker would; the panel opens below it.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "swatches",
			type: "string",
			description: "A comma-separated list of preset colors (any CSS Color 4 string). Renders a row of clickable chips below the picker; the chip matching the current color shows pressed.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "harmony",
			type: "HarmonyScheme",
			description: "When set, renders a row of related colors generated from the current one and updated live: `complementary`, `triadic`, `analogous`, `split-complementary`, `tetradic`, `monochromatic`, `shades`, or `tints`. Each chip is clickable to adopt that color.",
			bindings: ["html", "svelte", "astro"],
			options: ["complementary", "triadic", "analogous", "split-complementary", "tetradic", "monochromatic", "shades", "tints"],
		},
		{
			name: "contrastAgainst",
			type: "string",
			description: "A reference color (any CSS Color 4 string). When set, a panel shows the WCAG contrast ratio of the current color against it with AA/AAA pass-fail grades; in `trigger` mode a rating chip (AAA/AA/A/hazard) is also overlaid on the swatch so the grade reads without opening the picker.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "alpha",
			type: "boolean",
			default: "false",
			description: "Opt-in opacity. Off by default. No alpha track and no alpha channel in the value; set it to add the opacity track and carry alpha through the value.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "disabled",
			type: "boolean",
			default: "false",
			description: "Disables interaction; mutes the control and blocks pointer and keyboard input.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "label",
			type: "string",
			description: "Visible label, also wired as the group's accessible name via `aria-labelledby`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "labelledby",
			type: "string",
			description: "ID of an external element that names the picker. Takes precedence over `label`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "name",
			type: "string",
			description: "Form field name; the picker contributes its hex value to submitted form data.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [],
	sizes: [],
	states: [
		{
			name: "focus-visible",
			description: "Keyboard focus on a handle, the value input, or the format button: a token-colored ring plus a transparent outline that becomes real in forced-colors mode.",
			selector: ".xtyle-color-picker__sv-handle:focus-visible, .xtyle-color-picker__hue-handle:focus-visible, .xtyle-color-picker__value:focus-visible",
			tokens: ["--border-normal", "--border-thick", "--ring"],
		},
		{
			name: "disabled",
			description: "Non-interactive: muted and pointer-events suppressed.",
			selector: ".xtyle-color-picker--disabled",
			tokens: ["--fg-disabled"],
		},
	],
	slots: [],
	consumedTokens: [
		"--font-sans",
		"--font-mono",
		"--text-sm",
		"--text-xs",
		"--weight-medium",
		"--fg-0",
		"--fg-1",
		"--fg-disabled",
		"--accent",
		"--bg-0",
		"--bg-2",
		"--line-2",
		"--border-thin",
		"--border-normal",
		"--border-thick",
		"--radius-md",
		"--radius-sm",
		"--radius-full",
		"--elevation-1",
		"--elevation-3",
		"--ring",
		"--state-hover",
		"--space-1",
		"--space-2",
		"--space-4",
		"--space-6",
		"--duration-fast",
		"--ease-standard",
		"--weight-bold",
		"--neutral",
		"--neutral-fg",
		"--success",
		"--success-fg",
		"--success-text",
		"--info",
		"--info-fg",
		"--warn",
		"--warn-fg",
		"--danger",
		"--danger-fg",
		"--danger-text",
	],
	composition: [
		"Pair with Field or a form to capture the color; give it a `name` so its hex value contributes to submitted data.",
		"The hue and alpha tracks are Slider mechanics with a gradient rail; the same primitive, specialized.",
		"Set `format` to the model you want authors to read and submit: `oklch` for a perceptual workflow, `hex` for the familiar default.",
		"For a compact entry point, set `trigger`: the picker collapses to a swatch button and opens the full UI in an anchored, light-dismissable popover.",
	],
	a11y: [
		"The saturation/brightness handle is `role=\"slider\"` with a descriptive `aria-valuetext` (\"saturation N%, brightness N%\") updated as it moves; arrow keys nudge, Shift+arrow jumps.",
		"The hue handle is `role=\"slider\"` over 0-360 with `aria-valuenow`; arrows step, Home/End jump to the ends.",
		"The opacity handle is `role=\"slider\"` over 0-100 with `aria-valuenow`; arrows step, Home/End jump to clear and opaque.",
		"The wrapper is `role=\"group\"` and requires an accessible name (`labelledby` wins, then `label`); the binding warns at runtime when neither is present.",
		"Pointer drags use pointer capture so a handle keeps tracking when the cursor leaves its field.",
		"The value input accepts any CSS Color 4 string, commits on Enter or blur, reformats to the active format, and reverts to the current value on invalid input; the `format` button cycles `hex` → `rgb` → `hsl` → `oklch`.",
		"Where the browser exposes the `EyeDropper` API (Chromium today), an eyedropper button samples any pixel on screen and feeds it back through the same parser; it is omitted entirely where the API is absent, so it never presents a dead control.",
		"The OKLCH plane handle (from `plane`) is `role=\"slider\"` with a descriptive `aria-valuetext` (\"lightness N%, chroma N\"); arrow keys nudge lightness and chroma, Shift+arrow jumps.",
		"The per-channel sliders (from `channels`) are native range inputs grouped under the model name, each named by its channel and unit with a live `aria-valuetext`, so they are keyboard-operable and announced out of the box.",
		"The palette-snap buttons (from `snap`) are a `role=\"group\"` of buttons; the `named` button's accessible name carries the nearest color's name and updates live as the color changes.",
		"Preset swatches (from `swatches`) are a `role=\"group\"` of toggle buttons each labeled with its color; the chip matching the current color carries `aria-pressed`.",
		"With `contrastAgainst` set, the WCAG panel shows the live ratio and labels each AA/AAA grade as passing or failing at that ratio for screen readers.",
		"With `trigger` set, the swatch button uses the native popover API (`popovertarget`): the panel opens in the top layer, closes on outside click or `Esc`, and returns focus to the button, all without script.",
		"`disabled` blocks pointer and keyboard interaction and drops the handles out of the tab order.",
	],
	examples: [
		{
			id: "inline-pickers",
			title: "Inline pickers",
			description: "A brand color, a perceptual OKLCH picker, and a disabled one: each an always-open HSV field with a hue track and a switchable value field; opacity is opt-in.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
	],
};
