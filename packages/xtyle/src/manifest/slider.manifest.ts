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

export const sliderManifest: ComponentManifest = {
	id: "slider",
	name: "Slider",
	category: "control",
	summary: "A draggable range control for choosing a single value between a min and max, with full keyboard support.",
	description:
		"Slider picks one number across a range. It renders a rail with a fill showing the chosen portion and a `role=\"slider\"` thumb carrying `aria-valuemin`/`aria-valuemax`/`aria-valuenow`, so pointer drag, click-to-position, and the full arrow/Page/Home/End keyboard set all move it. Values snap to `step` and clamp to `[min, max]`. It is form-associated: give it a `name` and it contributes its current value to form data. Three sizes (`sm`, the default `md`, and `lg`) vary the thumb and rail thickness. It is the primitive the hue and alpha tracks of a color picker compose from.",
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
			description: "The interactive track the thumb travels along; its `::before` paints the unfilled groove.",
			selector: ".xtyle-slider__rail",
			tokens: ["--space-5", "--space-2", "--radius-full", "--neutral-bg", "--border-thin", "--line-2"],
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
			description: "The granularity values snap to; arrow keys move by one step, Page keys by ten.",
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
			description: "Renders the current value inline beside the label. The readout is `aria-hidden` since the thumb's `aria-valuenow` already announces it. Format it with the `format` property.",
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
		"It is the building block for a color picker's hue and alpha tracks: same rail, fill, and thumb mechanics with a gradient rail.",
	],
	a11y: [
		"The thumb is `role=\"slider\"` with `aria-valuemin`, `aria-valuemax`, and `aria-valuenow` kept in sync, never conveying value by position alone.",
		"Full keyboard support: arrows move by `step`, PageUp/PageDown by ten steps, Home/End jump to min/max; the keys' default scroll is prevented.",
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
	],
};
