import type { ComponentManifest } from "./types.js";
import { FULL_TONES } from "../vocab.js";

const htmlExample = `<xtyle-slider label="Volume" value="60"></xtyle-slider>

<xtyle-slider label="Brightness" min="0" max="100" step="5" value="40"></xtyle-slider>

<xtyle-slider size="sm" label="Compact" value="25"></xtyle-slider>

<xtyle-slider label="Opacity" name="opacity" value="80"></xtyle-slider>

<xtyle-slider label="Volume" value="60" show-value></xtyle-slider>

<xtyle-slider id="pct" label="Opacity" value="80" show-value></xtyle-slider>
<script>
	document.getElementById("pct").format = (v) => v + "%";
</script>

<xtyle-slider label="Volume" value="60" hide-label></xtyle-slider>

<xtyle-slider label="Locked" value="50" disabled></xtyle-slider>`;

const svelteExample = `<script lang="ts">
	import { Slider } from "@xtyle/svelte";

	let volume = $state(60);
</script>

<Slider label="Volume" bind:value={volume} />

<Slider label="Brightness" min={0} max={100} step={5} value={40} />

<Slider size="sm" label="Compact" value={25} />

<Slider label="Opacity" name="opacity" value={80} />

<Slider label="Volume" value={60} showValue />

<Slider label="Opacity" value={80} showValue format={(v) => \`\${v}%\`} />

<Slider label="Volume" value={60} hideLabel />

<Slider label="Locked" value={50} disabled />`;

const astroExample = `---
import { Slider } from "@xtyle/astro";
---

<Slider label="Volume" value={60} />

<Slider label="Brightness" min={0} max={100} step={5} value={40} />

<Slider size="sm" label="Compact" value={25} />

<Slider label="Opacity" name="opacity" value={80} />

<Slider label="Volume" value={60} showValue />

<Slider label="Volume" value={60} hideLabel />

<Slider label="Locked" value={50} disabled />`;

const steppingHtmlExample = `<!-- Coarse 15° steps; hold Shift while dragging or arrowing for 1° fine-tuning. -->
<xtyle-slider label="Angle" min="-180" max="180" step="15" alt-step="1" value="45" show-value></xtyle-slider>

<!-- overflow: type a scale past 200 in the readout; the thumb pins at the rail edge. -->
<xtyle-slider label="Scale" min="10" max="200" step="5" alt-step="1" value="100" show-value overflow></xtyle-slider>`;

const steppingSvelteExample = `<script lang="ts">
	import { Slider } from "@xtyle/svelte";
</script>

<!-- Coarse 15° steps; hold Shift while dragging or arrowing for 1° fine-tuning. -->
<Slider label="Angle" min={-180} max={180} step={15} altStep={1} value={45} showValue format={(v) => \`\${v}°\`} />

<!-- overflow: type a scale past 200 in the readout; the thumb pins at the rail edge. -->
<Slider label="Scale" min={10} max={200} step={5} altStep={1} value={100} showValue overflow format={(v) => \`\${v}%\`} />`;

const steppingAstroExample = `---
import { Slider } from "@xtyle/astro";
---

<Slider label="Angle" min={-180} max={180} step={15} altStep={1} value={45} showValue />

<Slider label="Scale" min={10} max={200} step={5} altStep={1} value={100} showValue overflow />`;

export const sliderManifest: ComponentManifest = {
	id: "slider",
	name: "Slider",
	category: "control",
	since: "0.1.0",
	keywords: ["range", "range input", "track", "value picker", "volume", "brightness"],
	seeAlso: ["number-input", "progress", "color-picker"],
	summary: "A draggable range control for choosing a single value between a min and max, with full keyboard support.",
	description:
		"Slider picks one number across a range. It renders a rail with a fill showing the chosen portion and a `role=\"slider\"` thumb carrying `aria-valuemin`/`aria-valuemax`/`aria-valuenow`, so pointer drag, click-to-position, and the full arrow/Page/Home/End keyboard set all move it. Values snap to `step` and clamp to `[min, max]`. Holding the `modifier` (Shift by default) while stepping or dragging swaps in `alt-step` for a coarser or finer jump, the same fine-tune contract the number field carries. With `show-value`, the readout is a click-to-edit numeric field that steps on the same keys; add `overflow` and a typed value may pass the rail while the thumb pins at the edge. It is form-associated: give it a `name` and it contributes its current value to form data. Three sizes (`sm`, the default `md`, and `lg`) vary the thumb and rail thickness. It is the primitive the hue and alpha tracks of a color picker compose from.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "slider",
			description: "The column wrapper carrying the size and disabled classes and stacking the optional label above the rail.",
			selector: ".xtyle-slider",
			tokens: ["--font-sans", "--text-body", "--leading-tight", "--fg-0", "--space-2"],
		},
		{
			name: "rail",
			description: "The interactive track the thumb travels along; it sizes the groove and thumb and takes the pointer.",
			selector: ".xtyle-slider__rail",
			tokens: ["--space-5", "--space-2"],
		},
		{
			name: "groove",
			description: "The unfilled channel the fill runs through: a node in the fill's markup, not a pseudo-element, so a mod can restructure it (tick marks, segments, a gradient track) rather than only recolor it.",
			selector: ".xtyle-slider__groove",
			tokens: ["--radius-full", "--neutral-bg", "--border-thin", "--line-2"],
		},
		{
			name: "fill",
			description: "The accent-colored portion of the rail from the minimum to the current value.",
			selector: ".xtyle-slider__fill",
			tokens: ["--accent", "--radius-full"],
		},
		{
			name: "thumb",
			description: "The draggable `role=\"slider\"` knob positioned at the current value.",
			selector: ".xtyle-slider__thumb",
			tokens: ["--space-5", "--radius-full", "--bg-0", "--border-normal", "--accent", "--elevation-1"],
		},
		{
			name: "header",
			description: "The row above the rail that lays out the label and value readout on opposite ends when either is shown.",
			selector: ".xtyle-slider__header",
			tokens: ["--space-2"],
		},
		{
			name: "label",
			description: "The optional visible label that names the slider and is referenced as its accessible name.",
			selector: ".xtyle-slider__label",
			tokens: ["--fg-1", "--text-sm"],
		},
		{
			name: "value",
			description: "The optional inline readout of the current value, shown when `show-value` is set and formatted by the `format` property.",
			selector: ".xtyle-slider__value",
			tokens: ["--fg-1", "--text-sm"],
		},
		{
			name: "value-text",
			description: "The text node inside the readout that carries the formatted number. The value patch lands here rather than on the readout itself, so a mod is free to put its own markup (a unit, a richer display) beside it without a value move clearing it.",
			selector: ".xtyle-slider__value-text",
			tokens: [],
		},
		{
			name: "value-input",
			description: "The inline numeric field the readout becomes while it is being edited: a node in the fill's markup (drawn whenever the slider reports it is editing), not one the element conjures, so a mod that reshapes the value display keeps its own markup through an edit.",
			selector: ".xtyle-slider__value-input",
			tokens: ["--field-bg", "--field-border", "--border-thin", "--radius-sm", "--space-1", "--ring"],
		},
		{
			name: "overlay",
			description: "The pseudo-element on the thumb that paints hover and active state tints.",
			selector: ".xtyle-slider__thumb::after",
			tokens: ["--state-hover", "--state-press"],
		},
	],
	props: [
		{
			name: "value",
			type: "number",
			default: "min",
			description: "The current value, snapped to `step` and clamped to `[min, max]`. Two-way bindable in Svelte; reflected to `aria-valuenow`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "min",
			type: "number",
			default: "0",
			description: "The lower bound of the range.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "max",
			type: "number",
			default: "100",
			description: "The upper bound of the range.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "step",
			type: "number",
			default: "1",
			description: "The base granularity: an arrow key and a drag snap to `step`. The finest grid the slider lands on is the smaller of `step` and `alt-step`, so a typed or fine-modifier value can sit between coarse steps.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "alt-step",
			type: "number",
			default: "step * 10",
			description: "The step taken while the modifier is held during an arrow press or a drag (and by Page keys): set it larger than `step` for a broad jump or smaller for fine-tuning. Mirrors the number field's alt step.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "alt-default",
			type: "boolean",
			default: "false",
			description: "Inverts the modifier: `alt-step` becomes the unmodified default and the base `step` needs the modifier held.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "modifier",
			type: "\"shift\" | \"alt\" | \"ctrl\" | \"meta\"",
			default: "shift",
			description: "Which key swaps `step` for `alt-step` on a keyboard press or a drag. Same contract as the number field, so a form's slider and stepper fine-tune on the same key.",
			bindings: ["html", "svelte", "astro"],
			options: ["shift", "alt", "ctrl", "meta"],
		},
		{
			name: "overflow",
			type: "boolean",
			default: "false",
			description: "Lets a typed value in the inline editor pass `min`/`max`: the thumb pins at the rail edge while the true value is kept, emitted, and announced (the reported range widens to include it). Drag and arrow-stepping still stay on the rail.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "disabled",
			type: "boolean",
			default: "false",
			description: "Disables interaction; mutes the fill and thumb, drops the thumb out of the tab order, and sets `aria-disabled`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "size",
			type: "Size",
			default: "md",
			description: "Control size (`sm`, `md`, or `lg`) varying the thumb and rail thickness.",
			bindings: ["html", "svelte", "astro"],
			options: ["sm", "md", "lg"],
		},
		{
			name: "tone",
			type: "FullTone",
			default: "accent",
			description: "Color of the rail fill and thumb. Any of the semantic roles, accent variants, or named hues.",
			bindings: ["html", "svelte", "astro"],
			options: [...FULL_TONES],
		},
		{
			name: "label",
			type: "string",
			description: "Visible label, also wired as the accessible name via `aria-labelledby`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "labelledby",
			type: "string",
			description: "ID of an external element that names the slider. Takes precedence over `label`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "name",
			type: "string",
			description: "Form field name; the slider contributes its current value to submitted form data.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "show-value",
			type: "boolean",
			default: "false",
			description: "Renders the current value inline beside the label. Clicking it opens an inline numeric editor that types an exact value and steps on the arrow/Page keys (honoring `modifier` and `alt-step`). The readout is `aria-hidden` since the thumb's `aria-valuenow` already announces it. Format it with the `format` property.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "hide-label",
			type: "boolean",
			default: "false",
			description: "Visually hides the `label` text while still using it to name the control for assistive tech. Use it when the host already renders its own visible label but the slider still needs an accessible name.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "format",
			type: "(value: number) => string",
			description: "A JS property (not an attribute) on the element: a function that formats the `show-value` readout. Defaults to the raw number. Settable in the HTML binding and via `bind:format` in Svelte; not available in the static Astro binding.",
			bindings: ["html", "svelte"],
		},
	],
	variants: [],
	sizes: [
		{ name: "sm", description: "Compact: thin rail, small thumb.", className: "xtyle-slider--sm" },
		{ name: "md", description: "Default.", className: "xtyle-slider", isDefault: true },
		{ name: "lg", description: "Large: thicker rail, bigger thumb for touch.", className: "xtyle-slider--lg" },
	],
	states: [
		{
			name: "hover",
			description: "Pointer over the thumb. Overlay paints the hover tint.",
			selector: ".xtyle-slider__thumb:hover::after",
			tokens: ["--state-hover"],
		},
		{
			name: "active",
			description: "Thumb pressed or dragging. Overlay paints the press tint.",
			selector: ".xtyle-slider__thumb:active::after",
			tokens: ["--state-press"],
		},
		{
			name: "focus-visible",
			description: "Keyboard focus on the thumb: a token-colored ring, plus a transparent outline that becomes real in forced-colors mode.",
			selector: ".xtyle-slider__thumb:focus-visible",
			tokens: ["--border-normal", "--border-thick", "--ring"],
		},
		{
			name: "disabled",
			description: "Non-interactive: muted fill and thumb, thumb removed from the tab order.",
			selector: ".xtyle-slider--disabled",
			tokens: ["--state-disabled", "--fg-disabled", "--line-2"],
		},
	],
	slots: [],
	consumedTokens: [
		"--font-sans",
		"--text-body",
		"--text-sm",
		"--leading-tight",
		"--fg-0",
		"--fg-1",
		"--fg-disabled",
		"--border-thin",
		"--border-normal",
		"--border-thick",
		"--radius-full",
		"--radius-sm",
		"--space-1",
		"--space-2",
		"--space-4",
		"--space-5",
		"--space-6",
		"--neutral-bg",
		"--field-bg",
		"--field-border",
		"--line-2",
		"--bg-0",
		...FULL_TONES.map((t) => `--${t}`),
		"--elevation-1",
		"--duration-fast",
		"--ease-standard",
		"--ring",
		"--state-hover",
		"--state-press",
		"--state-disabled",
	],
	composition: [
		"Pair with Field or a form to capture the value; give it a `name` so it contributes to submitted data.",
		"Use a tight `step` for coarse adjustments (a 0–10 rating) or `step=\"1\"` over a wide range for fine ones.",
		"Give a coarse `step` a fine `alt-step` (e.g. `step=\"15\"` `alt-step=\"1\"`) so a drag snaps to big increments but the modifier unlocks precision; pair with `overflow` on a bounded rail whose value should occasionally exceed the slider (a scale past 200%).",
		"It is the building block for a color picker's hue and alpha tracks: same rail, fill, and thumb mechanics with a gradient rail.",
	],
	a11y: [
		"The thumb is `role=\"slider\"` with `aria-valuemin`, `aria-valuemax`, and `aria-valuenow` kept in sync, never conveying value by position alone.",
		"Full keyboard support: arrows move by `step` (by `alt-step` with the `modifier` held), PageUp/PageDown by `alt-step`, Home/End jump to min/max; the keys' default scroll is prevented.",
		"Under `overflow`, a typed value past the rail keeps `aria-valuenow` valid by widening the announced `aria-valuemin`/`aria-valuemax` to include it, rather than misreporting a pinned value.",
		"Requires an accessible name: `labelledby` wins, then `label`; the binding warns at runtime when neither is present. `hide-label` keeps the `label` as the accessible name while visually hiding its text, so a host that renders its own label avoids announcing the name twice.",
		"The `show-value` readout is `aria-hidden` so screen readers hear the value once via the thumb's `aria-valuenow`, not twice.",
		"Pointer drag uses pointer capture so the thumb keeps tracking even when the cursor leaves the rail.",
		"Focus is shown with a token ring and a transparent outline the forced-colors base rule promotes to a real system outline.",
		"`disabled` blocks interaction, mutes the visuals, and pulls the thumb out of the tab order with `aria-disabled`.",
	],
	examples: [
		{
			id: "ranges-sizes-and-form",
			title: "Ranges, sizes, and form association",
			description: "A labeled slider, a stepped range, the compact size, a form-bound slider, and a disabled one.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
		{
			id: "fine-tuning-and-overflow",
			title: "Fine-tuning and overflow",
			description: "A coarse-step angle that fine-tunes to 1° while Shift is held, and a scale whose editable readout accepts a value past the rail's max.",
			source: { html: steppingHtmlExample, svelte: steppingSvelteExample, astro: steppingAstroExample },
		},
	],
};
