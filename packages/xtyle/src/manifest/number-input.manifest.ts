import type { ComponentManifest } from "./types.js";

const htmlExample = `<xtyle-number-input label="Quantity" value="1" min="0" max="99"></xtyle-number-input>

<xtyle-number-input label="Step by 5" value="20" min="0" max="100" step="5"></xtyle-number-input>

<xtyle-number-input label="Price" value="9.99" min="0" step="0.01"></xtyle-number-input>

<xtyle-number-input label="Locked" value="42" disabled></xtyle-number-input>`;

const svelteExample = `<script lang="ts">
	import { NumberInput } from "@xtyle/svelte";

	let qty = $state(1);
</script>

<NumberInput label="Quantity" bind:value={qty} min={0} max={99} />

<NumberInput label="Step by 5" value={20} min={0} max={100} step={5} />

<NumberInput label="Price" value={9.99} min={0} step={0.01} />

<NumberInput label="Locked" value={42} disabled />`;

const astroExample = `---
import { NumberInput } from "@xtyle/astro";
---

<NumberInput label="Quantity" value={1} min={0} max={99} />

<NumberInput label="Step by 5" value={20} min={0} max={100} step={5} />

<NumberInput label="Price" value={9.99} min={0} step={0.01} />

<NumberInput label="Locked" value={42} disabled />`;

const altHtmlExample = `<xtyle-number-input label="Volume" value="50" min="0" max="100" alt-step="10"></xtyle-number-input>

<xtyle-number-input label="Fine tune" value="1" step="1" alt-step="0.1" alt-default></xtyle-number-input>`;

const altSvelteExample = `<NumberInput label="Volume" value={50} min={0} max={100} altStep={10} />

<NumberInput label="Fine tune" value={1} step={1} altStep={0.1} altDefault />`;

const altAstroExample = `<NumberInput label="Volume" value={50} min={0} max={100} altStep={10} />

<NumberInput label="Fine tune" value={1} step={1} altStep={0.1} altDefault />`;

const freeHtmlExample = `<xtyle-number-input label="Graph parameter" value="3.14159" step="any"></xtyle-number-input>`;

const freeSvelteExample = `<NumberInput label="Graph parameter" value={3.14159} step="any" />`;

const freeAstroExample = `<NumberInput label="Graph parameter" value={3.14159} step="any" />`;

export const numberInputManifest: ComponentManifest = {
	id: "number-input",
	name: "Number Input",
	category: "form",
	since: "0.1.0",
	keywords: ["stepper", "spinner input", "numeric field", "quantity", "increment", "counter"],
	seeAlso: ["field", "slider"],
	summary: "A numeric field with stepper buttons, bounds, and step snapping, driven by pointer or keyboard.",
	description:
		"Number Input edits a single number. A `role=\"spinbutton\"` text field sits between decrease and increase buttons; the buttons, the up/down arrow keys, and direct typing all change the value, which snaps to `step` and clamps to `[min, max]` on commit. It is form-associated; give it a `name` and its value submits with the form. It accepts decimals (e.g. a `0.01` step for currency). Set `step=\"any\"` for a free-form field: typed values commit verbatim with no grid snap and no precision cap (a graph literal, a coordinate, a scientific value), while the steppers fall back to a whole-number nudge; with no `min`/`max` the value is unbounded, exactly the native `<input type=\"number\" step=\"any\">` contract. A second granularity rides alongside `step`: holding the `modifier` (Shift by default) on a click or arrow applies `altStep`, ten times `step` out of the box, while `PageUp`/`PageDown` always jump by it, and `altDefault` flips which one is primary. Out-of-range typing reverts on commit, and the stepper buttons disable at the bounds. Three sizes: `sm`, the default `md`, and `lg`.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "number",
			description: "The wrapper carrying the size and disabled classes and stacking the optional label over the control.",
			selector: ".xtyle-number",
			tokens: ["--font-sans", "--fg-0", "--space-2"],
		},
		{
			name: "control",
			description: "The bordered row grouping the stepper buttons and the input; shows the focus ring when the input is focused.",
			selector: ".xtyle-number__control",
			tokens: ["--border-thin", "--line-2", "--radius-md", "--bg-0", "--accent", "--border-thick", "--ring"],
		},
		{
			name: "input",
			description: "The `role=\"spinbutton\"` text field, centered, accepting typed numbers.",
			selector: ".xtyle-number__input",
			tokens: ["--fg-0", "--text-body", "--space-1", "--space-2"],
		},
		{
			name: "step",
			description: "The decrease and increase buttons; out of the tab order (the input is the focus stop), disabled at the bounds.",
			selector: ".xtyle-number__step",
			tokens: ["--space-6", "--neutral-bg", "--fg-1", "--text-body", "--state-hover", "--state-press", "--fg-disabled", "--state-disabled"],
		},
		{
			name: "label",
			description: "The optional visible label, referenced as the field's accessible name.",
			selector: ".xtyle-number__label",
			tokens: ["--fg-1", "--text-sm"],
		},
	],
	props: [
		{ name: "value", type: "number", description: "The current value, snapped to `step` and clamped to the bounds on commit. Empty is allowed. Reflected and form-submitted.", bindings: ["html", "svelte", "astro"] },
		{ name: "min", type: "number", description: "Lower bound; the decrease button disables here.", bindings: ["html", "svelte", "astro"] },
		{ name: "max", type: "number", description: "Upper bound; the increase button disables here.", bindings: ["html", "svelte", "astro"] },
		{ name: "step", type: "number | \"any\"", default: "1", description: "Granularity for the buttons and arrow keys; values snap to it. Use `0.01` for currency, or `\"any\"` for a free-form field that commits typed values verbatim (no snap, no precision cap) with the steppers nudging by 1.", bindings: ["html", "svelte", "astro"] },
		{ name: "altStep", type: "number", default: "step × 10", description: "The alternate granularity, applied when the modifier is held on a click or arrow (and by `PageUp`/`PageDown` always). Defaults to ten times `step`; set it to anything, including a finer value below `step`.", bindings: ["html", "svelte", "astro"] },
		{ name: "altDefault", type: "boolean", default: "false", description: "Swaps which step is primary: when set, plain clicks and arrows use `altStep`, and the modifier falls back to `step`; coarse-by-default with a fine modifier is as easy as the reverse.", bindings: ["html", "svelte", "astro"] },
		{ name: "modifier", type: "\"shift\" | \"alt\" | \"ctrl\" | \"meta\"", default: "shift", description: "The key that swaps to the alternate step on a click or arrow press.", bindings: ["html", "svelte", "astro"], options: ["shift", "alt", "ctrl", "meta"] },
		{ name: "disabled", type: "boolean", default: "false", description: "Disables typing and the steppers; mutes the control.", bindings: ["html", "svelte", "astro"] },
		{ name: "size", type: "Size", default: "md", description: "Control size: `sm`, `md`, or `lg`.", bindings: ["html", "svelte", "astro"], options: ["sm", "md", "lg"] },
		{ name: "label", type: "string", description: "Visible label, also the accessible name via `aria-labelledby`.", bindings: ["html", "svelte", "astro"] },
		{ name: "labelledby", type: "string", description: "ID of an external element that names the field. Takes precedence over `label`.", bindings: ["html", "svelte", "astro"] },
		{ name: "name", type: "string", description: "Form field name; the value submits with the form.", bindings: ["html", "svelte", "astro"] },
		{ name: "placeholder", type: "string", description: "Placeholder shown when the field is empty.", bindings: ["html", "svelte", "astro"] },
	],
	variants: [],
	sizes: [
		{ name: "sm", description: "Compact.", className: "xtyle-number--sm" },
		{ name: "md", description: "Default.", className: "xtyle-number", isDefault: true },
		{ name: "lg", description: "Large.", className: "xtyle-number--lg" },
	],
	states: [
		{
			name: "focus-within",
			description: "The input is focused. The control border takes the accent and a token ring appears.",
			selector: ".xtyle-number__control:focus-within",
			tokens: ["--accent", "--border-thick", "--ring"],
		},
		{
			name: "step-hover",
			description: "Pointer over a stepper button: the hover tint.",
			selector: ".xtyle-number__step:hover",
			tokens: ["--state-hover"],
		},
		{
			name: "step-disabled",
			description: "A stepper button at its bound: muted and non-interactive.",
			selector: ".xtyle-number__step:disabled",
			tokens: ["--fg-disabled", "--state-disabled"],
		},
		{
			name: "disabled",
			description: "The whole field disabled: muted control, no typing or stepping.",
			selector: ".xtyle-number--disabled",
			tokens: ["--fg-disabled", "--state-disabled"],
		},
	],
	slots: [],
	consumedTokens: [
		"--font-sans",
		"--text-body",
		"--text-sm",
		"--fg-0",
		"--fg-1",
		"--fg-disabled",
		"--bg-0",
		"--line-2",
		"--border-thin",
		"--border-thick",
		"--radius-md",
		"--accent",
		"--ring",
		"--neutral-bg",
		"--space-1",
		"--space-2",
		"--space-3",
		"--space-5",
		"--space-6",
		"--space-7",
		"--state-hover",
		"--state-press",
		"--state-disabled",
		"--duration-fast",
		"--ease-standard",
	],
	composition: [
		"Pair with Field or a form to capture the value; give it a `name` so it submits.",
		"Use `step=\"0.01\"` with `min=\"0\"` for currency, or a wide range with `step=\"1\"` for counts.",
		"Reach for `step=\"any\"` (and no `min`/`max`) when the field holds a free-form literal (a graph parameter, a coordinate, a scientific value) that must not snap to a grid or clamp.",
		"For an unbounded continuous range with a visible track, reach for Slider instead.",
	],
	a11y: [
		"The field is `role=\"spinbutton\"` with `aria-valuenow` (and `aria-valuemin`/`aria-valuemax` when bounds are set) kept in sync.",
		"Up and down arrow keys nudge by `step`, or `altStep` while the `modifier` is held; `PageUp`/`PageDown` always jump by `altStep`; Enter commits typed input; the keys' default behavior is handled so the value stays in range.",
		"The stepper buttons are out of the tab order (the input is the single focus stop) and are labeled Decrease / Increase; they disable at the bounds.",
		"Requires an accessible name: `labelledby` wins, then `label`; the binding warns at runtime when neither is present.",
		"Focus is shown on the control via `:focus-within`. The input's own outline is suppressed in favor of the grouped ring.",
		"`disabled` blocks typing and stepping and mutes the control.",
	],
	examples: [
		{
			id: "bounds-steps-and-form",
			title: "Bounds, steps, and form association",
			description: "A bounded quantity, a stepped range, a currency field, and a disabled one.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
		{
			id: "alternate-step",
			title: "Alternate step and modifier",
			description: "A volume that jumps by ten on Shift (or PageUp/PageDown), and a fine-tuner that steps by `0.1` plainly with Shift falling back to whole units via `altDefault`.",
			source: { html: altHtmlExample, svelte: altSvelteExample, astro: altAstroExample },
		},
		{
			id: "free-form",
			title: "Free-form (step=\"any\")",
			description: "An unstepped, unbounded field for an arbitrary literal: typing `3.14159` commits it verbatim with no snap and no clamp, while the steppers still nudge by 1.",
			source: { html: freeHtmlExample, svelte: freeSvelteExample, astro: freeAstroExample },
		},
	],
};
