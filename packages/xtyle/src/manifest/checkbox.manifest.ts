import type { ComponentManifest } from "./types.js";
import { FULL_TONES } from "../vocab.js";

const htmlExample = `<xtyle-checkbox name="terms" value="accepted">I accept the terms</xtyle-checkbox>

<xtyle-checkbox checked>Subscribe to the newsletter</xtyle-checkbox>

<xtyle-checkbox indeterminate>Select all</xtyle-checkbox>

<xtyle-checkbox size="sm" disabled>Unavailable option</xtyle-checkbox>`;

const svelteExample = `<script lang="ts">
	import { Checkbox } from "@xtyle/svelte";

	let accepted = $state(false);
	let all = $state(false);
	let partial = $state(true);
</script>

<Checkbox bind:checked={accepted} name="terms" value="accepted">I accept the terms</Checkbox>

<Checkbox bind:checked={all} bind:indeterminate={partial}>Select all</Checkbox>

<Checkbox size="sm" disabled>Unavailable option</Checkbox>`;

const astroExample = `---
import { Checkbox } from "@xtyle/astro";
---

<Checkbox name="terms" value="accepted">I accept the terms</Checkbox>

<Checkbox checked>Subscribe to the newsletter</Checkbox>

<Checkbox indeterminate>Select all</Checkbox>

<Checkbox size="sm" disabled>Unavailable option</Checkbox>`;

const groupHtmlExample = `<xtyle-checkbox-group label="Notifications">
  <xtyle-checkbox checked>Mentions</xtyle-checkbox>
  <xtyle-checkbox>Replies</xtyle-checkbox>
  <xtyle-checkbox checked>Direct messages</xtyle-checkbox>
</xtyle-checkbox-group>`;

const groupSvelteExample = `<script lang="ts">
	import { CheckboxGroup, Checkbox } from "@xtyle/svelte";
</script>

<CheckboxGroup label="Notifications">
	<Checkbox checked>Mentions</Checkbox>
	<Checkbox>Replies</Checkbox>
	<Checkbox checked>Direct messages</Checkbox>
</CheckboxGroup>`;

const groupAstroExample = `---
import { CheckboxGroup, Checkbox } from "@xtyle/astro";
---

<CheckboxGroup label="Notifications">
	<Checkbox checked>Mentions</Checkbox>
	<Checkbox>Replies</Checkbox>
	<Checkbox checked>Direct messages</Checkbox>
</CheckboxGroup>`;

export const checkboxManifest: ComponentManifest = {
	id: "checkbox",
	name: "Checkbox",
	category: "control",
	keywords: ["tick", "check", "boolean", "indeterminate", "multi-select"],
	seeAlso: ["radio", "switch"],
	summary: "A styled native checkbox: checked, indeterminate, and disabled states.",
	description:
		"Checkbox stages a single boolean value: unlike a switch it doesn't apply on toggle, contributing its `value` to an enclosing form only on submit. It styles a native `<input type=\"checkbox\">` with `appearance: none` and overlays a custom indicator, so it keeps every native affordance (keyboard activation, form participation, label association) while looking the part. Beyond the on/off pair it carries a third visual state, `indeterminate`, for the classic select-all / partial-selection pattern; the indicator switches from a check mark to a dash, and any user interaction clears it. Two sizes, `sm` and `md`, cover compact and default density.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "checkbox",
			description: "The label root wrapping the control and text, so a click anywhere toggles the box.",
			selector: ".xtyle-checkbox",
			tokens: ["--font-sans", "--text-body", "--leading-normal", "--fg-0", "--space-2", "--space-5"],
		},
		{
			name: "control",
			description: "The native checkbox input, stripped of its default look and redrawn as the box.",
			selector: ".xtyle-checkbox__control",
			tokens: [
				"--field-bg",
				"--field-border",
				"--border-thin",
				"--radius-sm",
				"--accent",
				"--duration-fast",
				"--ease-standard",
			],
		},
		{
			name: "indicator",
			description: "The overlaid check / dash glyph, drawn in the fill's foreground ink.",
			selector: ".xtyle-checkbox__indicator",
			tokens: ["--accent-fg"],
		},
		{
			name: "label",
			description: "The text content wrapper beside the box.",
			selector: ".xtyle-checkbox__label",
		},
	],
	props: [
		{
			name: "checked",
			type: "boolean",
			default: "false",
			description: "Whether the box is checked. Two-way bindable in Svelte.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "indeterminate",
			type: "boolean",
			default: "false",
			description: "Third visual state (a dash) for partial selection. Cleared on any user toggle.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "disabled",
			type: "boolean",
			default: "false",
			description: "Disables interaction and dims the control.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "size",
			type: "Size",
			default: "md",
			description: "Control size. Only `sm` and `md` are meaningful for a checkbox.",
			bindings: ["html", "svelte", "astro"],
			options: ["sm", "md"],
		},
		{
			name: "tone",
			type: "FullTone",
			default: "accent",
			description: "Color of the checked and indeterminate fill. Any semantic role, accent variant, or named hue.",
			bindings: ["html", "svelte", "astro"],
			options: [...FULL_TONES],
		},
		{
			name: "name",
			type: "string",
			description: "Form field name submitted with the enclosing form when checked.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "value",
			type: "string",
			default: "on",
			description: "Value contributed to the form when checked.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "label",
			type: "string",
			description: "Accessible name when no visible label text is slotted.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "labelledby",
			type: "string",
			description: "ID of an external element naming the checkbox (sets `aria-labelledby`).",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [],
	sizes: [
		{ name: "sm", description: "Compact.", className: "xtyle-checkbox--sm" },
		{ name: "md", description: "Default.", className: "xtyle-checkbox", isDefault: true },
	],
	states: [
		{
			name: "checked",
			description: "Box filled with the chosen tone (accent by default), check mark shown.",
			selector: ".xtyle-checkbox__control:checked",
			tokens: ["--accent", "--accent-fg"],
		},
		{
			name: "indeterminate",
			description: "Box filled, dash shown instead of the check mark.",
			selector: ".xtyle-checkbox--indeterminate .xtyle-checkbox__control",
			tokens: ["--accent"],
		},
		{
			name: "focus-visible",
			description: "Keyboard focus: a token-colored ring, plus a transparent outline that becomes real in forced-colors mode.",
			selector: ".xtyle-checkbox__control:focus-visible",
			tokens: ["--border-normal", "--ring"],
		},
		{
			name: "disabled",
			description: "Non-interactive: muted fill, border, and ink.",
			selector: '.xtyle-checkbox__control:disabled, .xtyle-checkbox__control[aria-disabled="true"]',
			tokens: ["--state-disabled", "--field-border", "--fg-disabled"],
		},
	],
	slots: [
		{
			name: "default",
			description: "The visible label text beside the box.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	consumedTokens: [
		"--font-sans",
		"--text-body",
		"--text-sm",
		"--leading-normal",
		"--fg-0",
		"--fg-disabled",
		"--space-1",
		"--space-2",
		"--space-4",
		"--space-5",
		"--space-6",
		"--weight-semibold",
		"--field-bg",
		"--field-border",
		"--border-thin",
		"--border-normal",
		"--radius-sm",
		...FULL_TONES.flatMap((t) => [`--${t}`, `--${t}-fg`]),
		"--duration-fast",
		"--ease-standard",
		"--ring",
		"--state-disabled",
	],
	composition: [
		"Pair with Field to give a checkbox a description, hint, or error message in a form layout.",
		"Wrap items in a `CheckboxGroup` for a select-all heading that tri-states over them automatically (all → checked, some → indeterminate, none → off); pass `manual` to keep the heading but drive its state yourself.",
		"For a one-of-many choice use a radio group instead; checkbox is for independent booleans.",
	],
	a11y: [
		"Wraps a native `<input type=\"checkbox\">` inside a `<label>`, so keyboard toggling, focus, and label association come for free.",
		"`indeterminate` is a presentation-only state on the native input; the box reports checked/unchecked to assistive tech, never a mixed value.",
		"With no slotted text the checkbox REQUIRES a `label` or `labelledby`; the binding warns at runtime when no accessible name is found.",
		"Focus is shown with a token ring and a transparent outline that the forced-colors base rule promotes to a real system outline.",
		"The check / dash glyph is decorative (`aria-hidden`); state is conveyed by the native input, not the SVG.",
	],
	examples: [
		{
			id: "states",
			title: "States",
			description: "Unchecked, checked, indeterminate, and a disabled compact checkbox.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
		{
			id: "group",
			title: "Group selection",
			description: "A CheckboxGroup with a tri-state select-all heading that rolls up its items automatically.",
			source: { html: groupHtmlExample, svelte: groupSvelteExample, astro: groupAstroExample },
		},
	],
};
