import type { ComponentManifest } from "./types.js";

const htmlExample = `<xtyle-form-group label="Theme" description="Applies across the whole workspace." for="theme">
	<xtyle-select id="theme" name="theme">
		<option value="auto">Match system</option>
		<option value="light">Light</option>
		<option value="dark">Dark</option>
	</xtyle-select>
</xtyle-form-group>

<xtyle-form-group label="Bio" description="A short line shown on your profile.">
	<textarea rows="3"></textarea>
</xtyle-form-group>

<xtyle-form-group label="Email" required invalid error="That address is already in use." for="email">
	<input type="email" id="email" name="email" />
</xtyle-form-group>`;

const svelteExample = `<script lang="ts">
	import { FormGroup, Select } from "@xtyle/svelte";
	let theme = $state("auto");
</script>

<FormGroup label="Theme" description="Applies across the whole workspace." for="theme">
	<Select id="theme" name="theme" bind:value={theme}>
		<option value="auto">Match system</option>
		<option value="light">Light</option>
		<option value="dark">Dark</option>
	</Select>
</FormGroup>

<FormGroup label="Email" required invalid error="That address is already in use." for="email">
	<input type="email" id="email" name="email" />
</FormGroup>`;

const astroExample = `---
import { FormGroup, Select } from "@xtyle/astro";
---

<FormGroup label="Theme" description="Applies across the whole workspace." for="theme">
	<Select id="theme" name="theme">
		<option value="auto">Match system</option>
		<option value="light">Light</option>
		<option value="dark">Dark</option>
	</Select>
</FormGroup>

<FormGroup label="Email" required invalid error="That address is already in use." for="email">
	<input type="email" id="email" name="email" />
</FormGroup>`;

export const formGroupManifest: ComponentManifest = {
	id: "form-group",
	name: "FormGroup",
	category: "form",
	keywords: ["label", "field wrapper", "form field", "helper text", "error text", "validation"],
	seeAlso: ["field", "textarea", "checkbox", "radio"],
	summary: "A label / description / error scaffold that wraps any slotted control and wires the accessibility plumbing.",
	description:
		"FormGroup is the presentational scaffolding around a form control you bring yourself: a Select, Textarea, Checkbox, Radio, or a bare native input. It renders the `label`, an optional `description`, and an `error` region, and wires the accessibility plumbing: it associates the label with the slotted control, builds `aria-describedby` from whichever of the description and error are showing, and reflects `invalid` / `required` onto the control as `aria-invalid` / `aria-required`. Unlike Field, it owns no input of its own; it is the reusable wrapper that gives every other control the same labelled, described, error-aware shell. Two variants (default, invalid) and the shared three-step size scale keep it in lockstep with the rest of the form family.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "group",
			description: "The vertical stack wrapping the label, description, control, and error.",
			selector: ".xtyle-form-group",
			tokens: ["--font-sans", "--space-1"],
		},
		{
			name: "label",
			description: "The control's label, associated with the slotted control via `for` / `aria-labelledby`.",
			selector: ".xtyle-form-group__label",
			tokens: ["--text-sm", "--weight-medium", "--fg-1", "--leading-normal", "--space-1"],
		},
		{
			name: "required-indicator",
			description: "The asterisk appended to the label when the group is required.",
			selector: ".xtyle-form-group__required",
			tokens: ["--danger", "--weight-semibold"],
		},
		{
			name: "description",
			description: "Optional helper text below the label, referenced by the control's `aria-describedby`.",
			selector: ".xtyle-form-group__description",
			tokens: ["--text-sm", "--leading-normal", "--fg-2"],
		},
		{
			name: "control",
			description: "The slot region that holds whatever control the author drops in.",
			selector: ".xtyle-form-group__control",
			tokens: ["--space-1"],
		},
		{
			name: "error",
			description: "The validation message shown when invalid, also referenced by `aria-describedby`.",
			selector: ".xtyle-form-group__error",
			tokens: ["--text-sm", "--leading-normal", "--danger", "--space-1"],
		},
	],
	props: [
		{
			name: "label",
			type: "string",
			description: "The control's label. When absent, the binding warns and falls back to labelling the control via `aria-labelledby`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "description",
			type: "string",
			description: "Helper text rendered below the label and linked into the control's `aria-describedby`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "error",
			type: "string",
			description: "Validation message shown only while `invalid`; linked into the control's `aria-describedby`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "size",
			type: "Size",
			default: "md",
			description: "Tightens or relaxes the stack spacing and label / helper text size.",
			bindings: ["html", "svelte", "astro"],
			options: ["sm", "md", "lg"],
		},
		{
			name: "invalid",
			type: "boolean",
			default: "false",
			description: "Marks the group invalid: reveals the error, tints the label, and sets `aria-invalid` on the control.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "required",
			type: "boolean",
			default: "false",
			description: "Appends the required indicator and sets `aria-required` on the control.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "for",
			type: "string",
			description: "The id of the slotted control to associate. When omitted, the group assigns the control an id automatically.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [
		{
			name: "default",
			description: "The resting scaffold: label, optional description, control, no error.",
			className: "xtyle-form-group",
		},
		{
			name: "invalid",
			description: "The error message is shown, the label takes the danger ink, and the control is marked `aria-invalid`.",
			className: "xtyle-form-group--invalid",
			tokens: ["--danger-text", "--danger"],
		},
	],
	sizes: [
		{ name: "sm", description: "Compact stack and smaller helper text.", className: "xtyle-form-group--sm" },
		{ name: "md", description: "Default.", className: "xtyle-form-group", isDefault: true },
		{ name: "lg", description: "Roomier stack and larger helper text.", className: "xtyle-form-group--lg" },
	],
	states: [
		{
			name: "invalid",
			description: "Error region revealed, label tinted danger, control flagged `aria-invalid`.",
			selector: ".xtyle-form-group--invalid",
			tokens: ["--danger-text"],
		},
		{
			name: "required",
			description: "Required indicator appended to the label, control flagged `aria-required`.",
			selector: ".xtyle-form-group__required",
			tokens: ["--danger", "--weight-semibold"],
		},
	],
	slots: [
		{
			name: "default",
			description: "The form control to scaffold: a Select, Textarea, Checkbox, Radio, or native input.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	consumedTokens: [
		"--font-sans",
		"--text-body",
		"--text-sm",
		"--text-xs",
		"--weight-medium",
		"--weight-semibold",
		"--leading-normal",
		"--space-0",
		"--space-1",
		"--space-2",
		"--fg-1",
		"--fg-2",
		"--danger",
		"--danger-text",
	],
	composition: [
		"Wrap a Select, Textarea, Checkbox, or Radio to give it the same labelled, described, error-aware shell; FormGroup owns no input itself.",
		"For a single-line text input that wants prefix/suffix adornments and a clear button, reach for Field instead; FormGroup is the generic wrapper for everything else.",
		"Pass `for` with the slotted control's id for explicit wiring, or omit it and let the group assign an id automatically.",
		"Drive `invalid` / `error` from your form library's per-field validation state.",
	],
	a11y: [
		"Associates the rendered `<label>` with the slotted control via `for` (or `aria-labelledby` when the control has no id of its own).",
		"Builds the control's `aria-describedby` from whichever of the description and error are currently showing.",
		"Reflects `invalid` as `aria-invalid` and `required` as `aria-required` onto the slotted control.",
		"The error region is an `role=\"alert\"` live region so a newly-shown validation message is announced.",
		"Warns at runtime when no `label` is provided, since the slotted control may then lack an accessible name.",
		"Purely presentational chrome; all semantics live on the native control you slot in, never on the wrapper.",
	],
	examples: [
		{
			id: "scaffolding-controls",
			title: "Scaffolding controls",
			description: "FormGroup wraps a Select, a textarea, and a native input, labelling, describing, and error-wiring each.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
	],
};
