import type { ComponentManifest } from "./types.js";

const htmlExample = `<xtyle-select label="Theme" name="theme" value="auto">
	<option value="auto">Match system</option>
	<option value="light">Light</option>
	<option value="dark">Dark</option>
</xtyle-select>

<xtyle-select label="Plan" size="lg">
	<optgroup label="Personal">
		<option value="free">Free</option>
		<option value="pro">Pro</option>
	</optgroup>
	<optgroup label="Teams">
		<option value="team">Team</option>
		<option value="org">Organization</option>
	</optgroup>
</xtyle-select>

<xtyle-select label="Country" invalid error="Select a country to continue." required>
	<option value="" disabled selected>Choose…</option>
	<option value="us">United States</option>
	<option value="ca">Canada</option>
</xtyle-select>`;

const svelteExample = `<script lang="ts">
	import { Select } from "@xtyle/svelte";
	let theme = $state("auto");
</script>

<Select label="Theme" name="theme" bind:value={theme}>
	<option value="auto">Match system</option>
	<option value="light">Light</option>
	<option value="dark">Dark</option>
</Select>

<Select label="Plan" size="lg">
	<optgroup label="Personal">
		<option value="free">Free</option>
		<option value="pro">Pro</option>
	</optgroup>
	<optgroup label="Teams">
		<option value="team">Team</option>
		<option value="org">Organization</option>
	</optgroup>
</Select>

<Select label="Country" invalid error="Select a country to continue." required>
	<option value="" disabled selected>Choose…</option>
	<option value="us">United States</option>
	<option value="ca">Canada</option>
</Select>`;

const astroExample = `---
import { Select } from "@xtyle/astro";
---

<Select label="Theme" name="theme" value="auto">
	<option value="auto">Match system</option>
	<option value="light">Light</option>
	<option value="dark">Dark</option>
</Select>

<Select label="Plan" size="lg">
	<optgroup label="Personal">
		<option value="free">Free</option>
		<option value="pro">Pro</option>
	</optgroup>
	<optgroup label="Teams">
		<option value="team">Team</option>
		<option value="org">Organization</option>
	</optgroup>
</Select>

<Select label="Country" invalid error="Select a country to continue." required>
	<option value="" disabled selected>Choose…</option>
	<option value="us">United States</option>
	<option value="ca">Canada</option>
</Select>`;

export const selectManifest: ComponentManifest = {
	id: "select",
	name: "Select",
	category: "form",
	since: "0.1.0",
	keywords: ["dropdown", "combobox", "picker", "options"],
	seeAlso: ["menu", "field", "segmented"],
	summary: "A styled native dropdown: `.xtyle-control` chrome, a custom chevron, and a label, with valid and invalid states across three sizes.",
	description:
		"Select is a thin, accessible skin over the native `<select>`. It inherits the shared `.xtyle-control` chrome (the same fill, border, radius, and focus ring as Field) so it sits flush beside other form controls, then hides the platform arrow and paints its own chevron, colored by focus, invalid, and disabled state. Options are plain `<option>` / `<optgroup>` children passed straight through to the native element, so keyboard navigation, type-ahead, and the OS picker all come for free. A `label` wires an accessible name, `invalid` plus `error` surface validation, and `sm` / `md` / `lg` tune the density.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "root",
			description: "The vertical stack holding the label, control, and error message.",
			selector: ".xtyle-select",
			tokens: ["--space-1", "--font-sans"],
		},
		{
			name: "label",
			description: "The control's visible label, hidden when no `label` is set.",
			selector: ".xtyle-select__label",
			tokens: ["--text-sm", "--weight-medium", "--fg-1", "--leading-normal"],
		},
		{
			name: "control",
			description: "The positioning wrapper that overlays the chevron on the native select.",
			selector: ".xtyle-select__control",
		},
		{
			name: "select",
			description: "The native `<select>` carrying the shared `.xtyle-control` chrome with the platform arrow suppressed.",
			selector: ".xtyle-select__field",
			tokens: ["--space-7"],
		},
		{
			name: "chevron",
			description: "The custom dropdown indicator, decorative and pointer-transparent, recolored by state.",
			selector: ".xtyle-select__chevron",
			tokens: ["--space-3", "--fg-2", "--accent", "--duration-fast", "--ease-standard"],
		},
		{
			name: "error",
			description: "The validation message shown when `invalid` and an `error` string are set.",
			selector: ".xtyle-select__error",
			tokens: ["--text-sm", "--leading-normal", "--danger"],
		},
	],
	props: [
		{
			name: "label",
			type: "string",
			description: "Visible label and accessible name. When empty, falls back to `aria-label`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "value",
			type: "string",
			description: "The selected option's value. Two-way bindable in Svelte.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "size",
			type: "Size",
			default: "md",
			description: "Control density.",
			bindings: ["html", "svelte", "astro"],
			options: ["sm", "md", "lg"],
		},
		{
			name: "name",
			type: "string",
			description: "Form field name, forwarded to the native select for submission.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "invalid",
			type: "boolean",
			default: "false",
			description: "Marks the field invalid: danger border, danger chevron, and `aria-invalid`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "error",
			type: "string",
			description: "Validation message shown beneath the control; wired via `aria-describedby` when invalid.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "disabled",
			type: "boolean",
			default: "false",
			description: "Disables the native select and mutes the chevron.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "required",
			type: "boolean",
			default: "false",
			description: "Marks the field required, reflecting `required` and `aria-required` onto the native select.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [
		{
			name: "default",
			description: "The standard control: `.xtyle-control` chrome with the accent focus ring.",
			className: "xtyle-select",
		},
		{
			name: "invalid",
			description: "Validation-failed treatment: danger border and chevron, danger-tinted focus ring.",
			className: "xtyle-select--invalid",
			tokens: ["--danger", "--danger-bg", "--border-normal"],
		},
	],
	sizes: [
		{ name: "sm", description: "Compact.", className: "xtyle-select--sm" },
		{ name: "md", description: "Default.", className: "xtyle-select", isDefault: true },
		{ name: "lg", description: "Large.", className: "xtyle-select--lg" },
	],
	states: [
		{
			name: "focus-visible",
			description: "Keyboard focus: the `.xtyle-control` accent ring, with the chevron tinted to match.",
			selector: ".xtyle-select__field:focus-visible + .xtyle-select__chevron",
			tokens: ["--accent"],
		},
		{
			name: "invalid-focus",
			description: "Focus while invalid: the danger border holds and the ring shifts to the danger tint.",
			selector: ".xtyle-select--invalid .xtyle-select__field:focus-visible",
			tokens: ["--danger", "--danger-bg", "--border-normal"],
		},
		{
			name: "disabled",
			description: "Non-interactive: the native control mutes and the chevron drops to the disabled ink.",
			selector: ".xtyle-select__field:disabled + .xtyle-select__chevron",
			tokens: ["--fg-disabled"],
		},
	],
	slots: [
		{
			name: "default",
			description: "The `<option>` and `<optgroup>` elements, passed straight through to the native select.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	consumedTokens: [
		"--font-sans",
		"--text-sm",
		"--text-lg",
		"--weight-medium",
		"--leading-normal",
		"--border-normal",
		"--space-1",
		"--space-3",
		"--space-7",
		"--duration-fast",
		"--ease-standard",
		"--fg-1",
		"--fg-2",
		"--fg-disabled",
		"--accent",
		"--danger",
		"--danger-text",
		"--danger-bg",
	],
	composition: [
		"Inherits `.xtyle-control` chrome from the base layer, so it lines up pixel-for-pixel with Field and Textarea.",
		"Pair with Field for text inputs and Button for the submit action to build a complete form row.",
		"Options are native `<option>` / `<optgroup>` elements. No custom item component required.",
	],
	a11y: [
		"Renders a native `<select>`, so keyboard navigation, type-ahead, and the OS picker work without any custom scripting.",
		"`label` provides the accessible name via a `for`-linked `<label>`; when absent, an `aria-label` is required and the html binding warns at runtime when neither is present.",
		"`invalid` sets `aria-invalid=\"true\"`; when an `error` string is present it is linked with `aria-describedby`.",
		"`required` reflects both the native `required` attribute and `aria-required` for assistive tech.",
		"The chevron is decorative (`aria-hidden`); selection state lives in the native control, not the visual.",
		"Focus is shown with the shared `.xtyle-control` ring plus a transparent outline that the forced-colors base rule promotes to a real system outline.",
	],
	examples: [
		{
			id: "labels-groups-and-validation",
			title: "Labels, groups, and validation",
			description: "A plain labelled select, a grouped large select, and an invalid required select with an error message.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
	],
};
