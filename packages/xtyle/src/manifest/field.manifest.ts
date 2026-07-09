import type { ComponentManifest } from "./types.js";

const htmlExample = `<xtyle-field label="Email" name="email" type="email" placeholder="you@example.com" required></xtyle-field>

<xtyle-field
	label="Password"
	name="password"
	type="password"
	description="At least 12 characters."
	required
></xtyle-field>

<xtyle-field
	label="Search"
	name="q"
	placeholder="Search…"
	clearable
>
	<svg slot="prefix" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
		<path fill="currentColor" d="M10 4a6 6 0 1 0 3.5 10.9l4.3 4.3 1.4-1.4-4.3-4.3A6 6 0 0 0 10 4Zm0 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z" />
	</svg>
</xtyle-field>

<xtyle-field label="Amount" name="amount" type="number" invalid error="Must be greater than zero.">
	<span slot="prefix">$</span>
</xtyle-field>`;

const htmlOptionsExample = `<xtyle-field id="branch" label="Branch" name="branch" placeholder="Type to filter…"></xtyle-field>
<script>
	document.getElementById("branch").options = ["main", "develop", "release/1.0", "hotfix"];
</script>`;

const svelteOptionsExample = `<script lang="ts">
	import { Field } from "@xtyle/svelte";
	const branches = ["main", "develop", "release/1.0", "hotfix"];
</script>

<Field label="Branch" name="branch" placeholder="Type to filter…" options={branches} />`;

const astroOptionsExample = `---
import { Field } from "@xtyle/astro";
const branches = ["main", "develop", "release/1.0", "hotfix"];
---

<Field label="Branch" name="branch" placeholder="Type to filter…" options={branches} />`;

const svelteExample = `<script lang="ts">
	import { Field } from "@xtyle/svelte";
	let email = $state("");
</script>

<Field label="Email" name="email" type="email" placeholder="you@example.com" required bind:value={email} />

<Field
	label="Password"
	name="password"
	type="password"
	description="At least 12 characters."
	required
/>

<Field label="Search" name="q" placeholder="Search…" clearable>
	{#snippet prefix()}
		<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
			<path fill="currentColor" d="M10 4a6 6 0 1 0 3.5 10.9l4.3 4.3 1.4-1.4-4.3-4.3A6 6 0 0 0 10 4Zm0 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z" />
		</svg>
	{/snippet}
</Field>

<Field label="Amount" name="amount" type="number" invalid error="Must be greater than zero.">
	{#snippet prefix()}<span>$</span>{/snippet}
</Field>`;

const astroExample = `---
import { Field } from "@xtyle/astro";
---

<Field label="Email" name="email" type="email" placeholder="you@example.com" required />

<Field
	label="Password"
	name="password"
	type="password"
	description="At least 12 characters."
	required
/>

<Field label="Search" name="q" placeholder="Search…">
	<svg slot="prefix" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
		<path fill="currentColor" d="M10 4a6 6 0 1 0 3.5 10.9l4.3 4.3 1.4-1.4-4.3-4.3A6 6 0 0 0 10 4Zm0 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z" />
	</svg>
</Field>

<Field label="Amount" name="amount" type="number" invalid error="Must be greater than zero.">
	<span slot="prefix">$</span>
</Field>`;

export const fieldManifest: ComponentManifest = {
	id: "field",
	name: "Field",
	category: "form",
	keywords: ["input", "text input", "text field", "search box", "textbox", "form input"],
	seeAlso: ["textarea", "number-input", "form-group", "select"],
	summary: "A labelled text input with helper text, validation, adornments, and built-in clear and reveal actions.",
	description:
		"Field is the complete single-line text input: a label, an input, a persistent description, and an error message wired together with the right accessibility relationships out of the box. The input inherits the shared `.xtyle-control` chrome and adds field-specific layout: a unified control box that holds leading and trailing adornment slots (icons, currency prefixes, unit suffixes) alongside the input. It generates a stable `id` and links it to the label, builds `aria-describedby` from both the description and the error, and ships two optional built-in actions: a clear button and a password reveal toggle. In the HTML and Svelte bindings the element is form-associated, participating in native form submission and constraint validation. Sizes (sm / md / lg) match the Button padding scale, and `readonly`, `required`, `disabled`, and `invalid` are all first-class.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "field",
			description: "The outer column wrapper carrying the size and state modifiers.",
			selector: ".xtyle-field",
			tokens: ["--font-sans", "--space-1"],
		},
		{
			name: "label",
			description: "The field label, linked to the input via `for`; carries the required indicator.",
			selector: ".xtyle-field__label",
			tokens: ["--text-sm", "--weight-medium", "--fg-1", "--leading-normal", "--space-1"],
		},
		{
			name: "control",
			description: "The bordered box that wraps the input and its adornments; paints the focus-within ring.",
			selector: ".xtyle-field__control",
			tokens: ["--field-bg", "--field-border", "--border-thin", "--radius-md", "--accent", "--ring", "--border-normal"],
		},
		{
			name: "input",
			description: "The native input, styled by `.xtyle-control` with its own chrome neutralized so the control box owns the border.",
			selector: ".xtyle-field__input",
		},
		{
			name: "adornment",
			description: "A leading (prefix) or trailing (suffix) slot for icons, currency symbols, or units.",
			selector: ".xtyle-field__adornment",
			tokens: ["--space-3", "--fg-2", "--text-sm", "--leading-tight"],
		},
		{
			name: "description",
			description: "Persistent helper text below the control, linked via `aria-describedby`.",
			selector: ".xtyle-field__description",
			tokens: ["--text-sm", "--leading-normal", "--fg-2"],
		},
		{
			name: "error",
			description: "The validation message shown when invalid, linked via `aria-describedby`.",
			selector: ".xtyle-field__error",
			tokens: ["--text-sm", "--leading-normal", "--danger"],
		},
	],
	props: [
		{
			name: "label",
			type: "string",
			description: "The visible label text, linked to the input. When omitted, falls back to an `aria-label` from the placeholder.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "name",
			type: "string",
			description: "The form field name. Drives form submission and the form-associated value.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "value",
			type: "string",
			default: "",
			description: "The input value. Two-way bindable in Svelte (`bind:value`).",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "type",
			type: "string",
			default: "text",
			description: "The native input type (text, email, password, number, …). `password` enables the reveal toggle.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "placeholder",
			type: "string",
			description: "Placeholder text shown when empty.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "size",
			type: "Size",
			default: "md",
			description: "Control size; matches the Button padding scale.",
			bindings: ["html", "svelte", "astro"],
			options: ["sm", "md", "lg"],
		},
		{
			name: "description",
			type: "string",
			description: "Persistent helper text below the control, linked via `aria-describedby`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "error",
			type: "string",
			description: "Validation message; shown (and linked via `aria-describedby`) only while `invalid`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "invalid",
			type: "boolean",
			default: "false",
			description: "Marks the field invalid: danger border, error message, `aria-invalid`, and a custom validity in form-associated mode.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "required",
			type: "boolean",
			default: "false",
			description: "Marks the field required: a `*` indicator, `required` + `aria-required`, and a valueMissing validity.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "readonly",
			type: "boolean",
			default: "false",
			description: "Renders the input read-only with a muted background; the value still submits.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "disabled",
			type: "boolean",
			default: "false",
			description: "Disables the input and dims the field.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "clearable",
			type: "boolean",
			default: "false",
			description: "Shows a built-in clear button when the field has a value. (html / svelte: needs JS.)",
			bindings: ["html", "svelte"],
		},
		{
			name: "options",
			type: "string[] | { value: string; label?: string }[]",
			description:
				"Type-ahead suggestions. Field renders them into a `<datalist>` it owns inside the input's own root and wires the input's `list` to it, so suggestions work even though the input lives in a shadow root (where a page-level `<datalist>` could never reach it). Set the JS property in html / svelte; the Astro binding takes a JSON array attribute. Needs the runtime. (html / svelte / astro on hydrate.)",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "mono",
			type: "boolean",
			default: "false",
			description:
				"Renders the input in the monospace stack (`--font-mono`) for code-shaped values: identifiers, paths, hex colors, expressions, env values. A presentational swap on an existing token, so it bakes into the zero-JS Astro markup too.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [
		{
			name: "default",
			description: "The standard field: neutral border, accent focus ring.",
			className: "xtyle-field",
			tokens: ["--field-border", "--accent"],
		},
		{
			name: "invalid",
			description: "Error treatment: danger border, a danger-tinted focus ring, and the error message shown.",
			className: "xtyle-field--invalid",
			tokens: ["--danger", "--danger-bg"],
		},
	],
	sizes: [
		{ name: "sm", description: "Compact.", className: "xtyle-field--sm" },
		{ name: "md", description: "Default.", className: "xtyle-field", isDefault: true },
		{ name: "lg", description: "Large.", className: "xtyle-field--lg" },
	],
	states: [
		{
			name: "focus-visible",
			description: "Keyboard focus inside the control: accent border and a token-colored ring via `:focus-within`.",
			selector: ".xtyle-field__control:focus-within",
			tokens: ["--accent", "--ring", "--border-normal"],
		},
		{
			name: "invalid",
			description: "Invalid: danger border; the focus-within ring shifts to a danger tint.",
			selector: ".xtyle-field--invalid .xtyle-field__control",
			tokens: ["--danger", "--danger-bg"],
		},
		{
			name: "disabled",
			description: "Non-interactive: muted ink and a disabled-tinted control.",
			selector: ".xtyle-field--disabled .xtyle-field__control",
			tokens: ["--fg-disabled", "--state-disabled"],
		},
		{
			name: "readonly",
			description: "Read-only: a subtly recessed background; the value still submits.",
			selector: ".xtyle-field--readonly .xtyle-field__control",
			tokens: ["--bg-1"],
		},
		{
			name: "required",
			description: "Required: a danger-colored `*` indicator on the label.",
			selector: ".xtyle-field__required",
			tokens: ["--danger", "--weight-semibold"],
		},
	],
	slots: [
		{
			name: "prefix",
			description: "A leading adornment: icon, currency symbol, or unit.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "suffix",
			description: "A trailing adornment: icon, unit, or status marker.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "clear-icon",
			description: "Overrides the built-in clear-button glyph.",
			bindings: ["html"],
		},
		{
			name: "reveal-icon",
			description: "Overrides the built-in password-reveal glyph.",
			bindings: ["html"],
		},
	],
	consumedTokens: [
		"--font-sans",
		"--font-mono",
		"--text-sm",
		"--text-lg",
		"--weight-medium",
		"--weight-semibold",
		"--leading-normal",
		"--leading-tight",
		"--border-thin",
		"--border-normal",
		"--radius-md",
		"--radius-sm",
		"--space-1",
		"--space-2",
		"--space-3",
		"--space-4",
		"--duration-fast",
		"--ease-standard",
		"--ring",
		"--state-hover",
		"--state-press",
		"--state-disabled",
		"--fg-0",
		"--fg-1",
		"--fg-2",
		"--fg-disabled",
		"--field-bg",
		"--field-border",
		"--bg-1",
		"--accent",
		"--danger",
		"--danger-text",
		"--danger-bg",
	],
	composition: [
		"Pair with Button (`type=\"submit\"`) inside a native `<form>`; the form-associated element submits its value by `name`.",
		"Use the `prefix` / `suffix` slots with any inline SVG or text node; they'll take an Icon component directly when one ships.",
		"The clear button and password reveal are JS-driven, so they appear in the html and svelte bindings; the Astro binding is zero-JS and omits them.",
		"For type-ahead, pass `options` rather than a hand-authored `<datalist>`; a page-level datalist can't reach the input across the shadow boundary, so Field owns the list itself.",
		"Native input attributes (`spellcheck`, `inputmode`, `autocomplete`, `autocapitalize`, `autocorrect`, `enterkeyhint`) set on the host are forwarded to the inner input, so `spellcheck=\"false\"` on a code field works without reaching through `::part`.",
	],
	a11y: [
		"Always generates a stable input `id` and links the label with `for`, so clicking the label focuses the input.",
		"`aria-describedby` is built from both the description and the error, so assistive tech announces helper text and validation together.",
		"`invalid` sets `aria-invalid`; `required` sets `aria-required` and a non-color `*` indicator so requirement is not conveyed by color alone.",
		"When no label is given, the placeholder (or an explicit `aria-label`) becomes the accessible name; the binding warns when none of the three is present.",
		"Focus is shown on the control via `:focus-within` with a token ring plus the transparent-outline pattern that forced-colors mode promotes to a real outline.",
		"Form-associated (html / svelte): participates in native submission and constraint validation via `setFormValue` and `setValidity`.",
	],
	examples: [
		{
			id: "labels-validation-adornments",
			title: "Labels, validation, and adornments",
			description: "A required email, a password with helper text, a clearable search with a leading icon, and an invalid amount with a currency prefix.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
		{
			id: "type-ahead",
			title: "Type-ahead suggestions",
			description:
				"Pass `options` and Field renders a `<datalist>` in the input's own root, so suggestions work across the shadow boundary where a page-level datalist can't reach.",
			source: { html: htmlOptionsExample, svelte: svelteOptionsExample, astro: astroOptionsExample },
		},
	],
};
