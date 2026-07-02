import type { ComponentManifest } from "./types.js";

const htmlExample = `<xoji-textarea label="Bio" name="bio" rows="4" placeholder="Tell us about yourself…"></xoji-textarea>

<xoji-textarea label="Notes" rows="6" resize="none"></xoji-textarea>

<xoji-textarea
	label="Summary"
	size="lg"
	invalid
	error="A summary is required."
	required
></xoji-textarea>`;

const svelteExample = `<script lang="ts">
	import { Textarea } from "@xoji/svelte";
	let bio = $state("");
</script>

<Textarea label="Bio" name="bio" rows={4} bind:value={bio} placeholder="Tell us about yourself…" />

<Textarea label="Notes" rows={6} resize="none" />

<Textarea label="Summary" size="lg" invalid error="A summary is required." required />`;

const astroExample = `---
import { Textarea } from "@xoji/astro";
---

<Textarea label="Bio" name="bio" rows={4} placeholder="Tell us about yourself…" />

<Textarea label="Notes" rows={6} resize="none" />

<Textarea label="Summary" size="lg" invalid error="A summary is required." required />`;

export const textareaManifest: ComponentManifest = {
	id: "textarea",
	name: "Textarea",
	category: "form",
	summary: "A multi-line text input: styled, labelled, and resizable, in three sizes with an invalid state.",
	description:
		"Textarea is a styled multi-line text control. It renders a native `<textarea>` that inherits the shared `.xoji-control` chrome, wrapped with an optional label and an error message slot. The `rows` attribute sets the initial visible height and `resize` controls the user's drag handle (vertical by default, or none / horizontal / both). It exposes the same `invalid` / `disabled` / `required` and `sm` / `md` / `lg` size surface as the rest of the form family, and the custom element is form-associated so its value participates in native form submission and reset.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "root",
			description: "The wrapper carrying the size, invalid, and resize classes; lays out label, control, and error.",
			selector: ".xoji-textarea",
			tokens: ["--space-1", "--font-sans"],
		},
		{
			name: "label",
			description: "The field label, hidden when no `label` text is provided.",
			selector: ".xoji-textarea__label",
			tokens: ["--text-sm", "--weight-medium", "--fg-1", "--leading-normal"],
		},
		{
			name: "control",
			description: "The native `<textarea>` inheriting `.xoji-control`, with size, resize, and min-height applied.",
			selector: ".xoji-textarea__control",
			tokens: ["--space-7", "--leading-normal"],
		},
		{
			name: "error",
			description: "The validation message shown beneath the control while invalid.",
			selector: ".xoji-textarea__error",
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
			description: "The standard control, neutral field chrome from `.xoji-control`.",
			className: "xoji-textarea",
		},
		{
			name: "invalid",
			description: "Error treatment: danger-colored border, label, and focus ring.",
			className: "xoji-textarea--invalid",
			tokens: ["--danger", "--danger-bg", "--border-normal"],
		},
	],
	sizes: [
		{ name: "sm", description: "Compact.", className: "xoji-textarea--sm" },
		{ name: "md", description: "Default.", className: "xoji-textarea", isDefault: true },
		{ name: "lg", description: "Large.", className: "xoji-textarea--lg" },
	],
	states: [
		{
			name: "focus-visible",
			description: "Keyboard focus: the shared `.xoji-control` ring, recolored to danger while invalid.",
			selector: ".xoji-textarea__control:focus-visible",
			tokens: ["--border-normal"],
		},
		{
			name: "invalid",
			description: "Failing validation: danger border on the control and a danger label.",
			selector: ".xoji-textarea--invalid .xoji-textarea__control",
			tokens: ["--danger", "--danger-bg"],
		},
		{
			name: "disabled",
			description: "Non-interactive: muted chrome inherited from `.xoji-control`, no-drop cursor.",
			selector: ".xoji-textarea__control:disabled",
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
