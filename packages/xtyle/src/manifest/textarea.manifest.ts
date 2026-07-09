import type { ComponentManifest } from "./types.js";

const htmlExample = `<xtyle-textarea label="Bio" name="bio" rows="4" placeholder="Tell us about yourself…"></xtyle-textarea>

<xtyle-textarea label="Notes" rows="6" resize="none"></xtyle-textarea>

<xtyle-textarea
	label="Summary"
	size="lg"
	invalid
	error="A summary is required."
	required
></xtyle-textarea>`;

const svelteExample = `<script lang="ts">
	import { Textarea } from "@xtyle/svelte";
	let bio = $state("");
</script>

<Textarea label="Bio" name="bio" rows={4} bind:value={bio} placeholder="Tell us about yourself…" />

<Textarea label="Notes" rows={6} resize="none" />

<Textarea label="Summary" size="lg" invalid error="A summary is required." required />`;

const astroExample = `---
import { Textarea } from "@xtyle/astro";
---

<Textarea label="Bio" name="bio" rows={4} placeholder="Tell us about yourself…" />

<Textarea label="Notes" rows={6} resize="none" />

<Textarea label="Summary" size="lg" invalid error="A summary is required." required />`;

export const textareaManifest: ComponentManifest = {
	id: "textarea",
	name: "Textarea",
	category: "form",
	keywords: ["multiline", "text area", "text input", "comment box"],
	seeAlso: ["field", "form-group"],
	summary: "A multi-line text input: styled, labelled, and resizable, in three sizes with an invalid state.",
	description:
		"Textarea is a styled multi-line text control. It renders a native `<textarea>` that inherits the shared `.xtyle-control` chrome, wrapped with an optional label and an error message slot. The `rows` attribute sets the initial visible height and `resize` controls the user's drag handle (vertical by default, or none / horizontal / both). It exposes the same `invalid` / `disabled` / `required` and `sm` / `md` / `lg` size surface as the rest of the form family, and the custom element is form-associated so its value participates in native form submission and reset.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "root",
			description: "The wrapper carrying the size, invalid, and resize classes; lays out label, control, and error.",
			selector: ".xtyle-textarea",
			tokens: ["--space-1", "--font-sans"],
		},
		{
			name: "label",
			description: "The field label, hidden when no `label` text is provided.",
			selector: ".xtyle-textarea__label",
			tokens: ["--text-sm", "--weight-medium", "--fg-1", "--leading-normal"],
		},
		{
			name: "control",
			description: "The native `<textarea>` inheriting `.xtyle-control`, with size, resize, and min-height applied.",
			selector: ".xtyle-textarea__control",
			tokens: ["--space-7", "--leading-normal"],
		},
		{
			name: "error",
			description: "The validation message shown beneath the control while invalid.",
			selector: ".xtyle-textarea__error",
			tokens: ["--text-sm", "--leading-normal", "--danger"],
		},
	],
	props: [
		{
			name: "label",
			type: "string",
			description: "The visible field label. When empty, the binding falls back to `aria-label` and warns if neither is set.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "value",
			type: "string",
			default: "",
			description: "The textarea's text content. Two-way bindable in Svelte.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "rows",
			type: "number",
			default: "3",
			description: "Initial visible height of the control, in text rows.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "resize",
			type: "TextareaResize",
			default: "vertical",
			description: "Which axes the user can drag to resize the control.",
			bindings: ["html", "svelte", "astro"],
			options: ["none", "vertical", "horizontal", "both"],
		},
		{
			name: "placeholder",
			type: "string",
			description: "Placeholder text shown while the control is empty.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "mono",
			type: "boolean",
			default: "false",
			description:
				"Renders the control in the monospace stack (`--font-mono`) for code-shaped text: expressions, snippets, config, structured input. A presentational swap on an existing token, so it bakes into the zero-JS Astro markup too.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "size",
			type: "Size",
			default: "md",
			description: "Control size.",
			bindings: ["html", "svelte", "astro"],
			options: ["sm", "md", "lg"],
		},
		{
			name: "name",
			type: "string",
			description: "Form field name; submitted with the control's value.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "disabled",
			type: "boolean",
			default: "false",
			description: "Disables interaction and excludes the value from form submission.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "invalid",
			type: "boolean",
			default: "false",
			description: "Marks the control invalid: danger border and `aria-invalid`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "required",
			type: "boolean",
			default: "false",
			description: "Marks the field required; reflected as `aria-required` on the control.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "error",
			type: "string",
			description: "Validation message rendered beneath the control and wired up via `aria-describedby` while invalid.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [
		{
			name: "default",
			description: "The standard control, neutral field chrome from `.xtyle-control`.",
			className: "xtyle-textarea",
		},
		{
			name: "invalid",
			description: "Error treatment: danger-colored border, label, and focus ring.",
			className: "xtyle-textarea--invalid",
			tokens: ["--danger", "--danger-bg", "--border-normal"],
		},
	],
	sizes: [
		{ name: "sm", description: "Compact.", className: "xtyle-textarea--sm" },
		{ name: "md", description: "Default.", className: "xtyle-textarea", isDefault: true },
		{ name: "lg", description: "Large.", className: "xtyle-textarea--lg" },
	],
	states: [
		{
			name: "focus-visible",
			description: "Keyboard focus: the shared `.xtyle-control` ring, recolored to danger while invalid.",
			selector: ".xtyle-textarea__control:focus-visible",
			tokens: ["--border-normal"],
		},
		{
			name: "invalid",
			description: "Failing validation: danger border on the control and a danger label.",
			selector: ".xtyle-textarea--invalid .xtyle-textarea__control",
			tokens: ["--danger", "--danger-bg"],
		},
		{
			name: "disabled",
			description: "Non-interactive: muted chrome inherited from `.xtyle-control`, no-drop cursor.",
			selector: ".xtyle-textarea__control:disabled",
		},
	],
	slots: [
		{
			name: "default",
			description: "Initial textarea content, projected into the native control's value.",
			bindings: ["html", "astro"],
		},
	],
	consumedTokens: [
		"--font-sans",
		"--font-mono",
		"--text-sm",
		"--text-lg",
		"--weight-medium",
		"--leading-normal",
		"--fg-1",
		"--border-normal",
		"--danger",
		"--danger-text",
		"--danger-bg",
		"--space-1",
		"--space-2",
		"--space-3",
		"--space-4",
		"--space-6",
		"--space-7",
		"--space-8",
	],
	composition: [
		"Pair with Button (`type=\"submit\"` / `type=\"reset\"`) inside a `<form>`; the form-associated element submits and resets natively.",
		"Mirror the `label` / `invalid` / `error` surface of Field and Select so a form reads consistently across single-line and multi-line inputs.",
		"For code-shaped content (expressions, snippets, config), set `mono`; native input attributes (`spellcheck`, `inputmode`, `autocomplete`, `autocapitalize`, `autocorrect`, `enterkeyhint`) set on the host are forwarded to the inner control, so `spellcheck=\"false\"` on an expression field works.",
	],
	a11y: [
		"Renders a native `<textarea>`, so editing, selection, and screen-reader semantics come for free.",
		"The `label` is wired to the control via `for` / `id`; with no `label`, the binding falls back to `aria-label` and warns when neither is present.",
		"`invalid` sets `aria-invalid=\"true\"`; when an `error` is present it is linked through `aria-describedby`.",
		"`required` is reflected as `aria-required` on the control.",
		"Focus is shown with the shared control ring plus a transparent outline that the forced-colors base rule promotes to a real system outline.",
	],
	examples: [
		{
			id: "labelled-and-invalid",
			title: "Labelled, resizable, and invalid",
			description: "A labelled control with custom rows, a fixed-height variant, and an invalid state with an error message.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
	],
};
