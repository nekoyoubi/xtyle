import type { ComponentManifest } from "./types.js";
import { FULL_TONES } from "../vocab.js";

const htmlExample = `<xtyle-radio-group label="Plan" orientation="vertical">
	<xtyle-radio name="plan" value="free" label="Free" checked></xtyle-radio>
	<xtyle-radio name="plan" value="pro" label="Pro" tone="accent"></xtyle-radio>
	<xtyle-radio name="plan" value="team" label="Team"></xtyle-radio>
</xtyle-radio-group>

<xtyle-radio name="confirm" value="yes" tone="success">I agree to the terms</xtyle-radio>

<xtyle-radio name="confirm" value="no" tone="danger" invalid label="Decline"></xtyle-radio>`;

const svelteExample = `<script lang="ts">
	import { Radio, RadioGroup } from "@xtyle/svelte";
	let plan = $state("free");
</script>

<RadioGroup label="Plan" orientation="vertical" onchange={(e) => (plan = (e.target as HTMLInputElement).value)}>
	<Radio name="plan" value="free" label="Free" checked={plan === "free"} />
	<Radio name="plan" value="pro" label="Pro" tone="accent" checked={plan === "pro"} />
	<Radio name="plan" value="team" label="Team" checked={plan === "team"} />
</RadioGroup>

<Radio name="confirm" value="yes" tone="success">I agree to the terms</Radio>`;

const cardHtmlExample = `<xtyle-radio-group label="Sync mode">
	<xtyle-radio card name="sync" value="linked" label="Linked" checked
		description="Changes sync both ways automatically, the moment either side updates."></xtyle-radio>
	<xtyle-radio card name="sync" value="confirm" label="Confirm each"
		description="Review and approve every change before it is applied to the other side."></xtyle-radio>
</xtyle-radio-group>`;

const cardSvelteExample = `<script lang="ts">
	import { Radio, RadioGroup } from "@xtyle/svelte";
	let mode = $state("linked");
</script>

<RadioGroup label="Sync mode" onchange={(e) => (mode = (e.target as HTMLInputElement).value)}>
	<Radio card name="sync" value="linked" label="Linked" checked={mode === "linked"}
		description="Changes sync both ways automatically, the moment either side updates." />
	<Radio card name="sync" value="confirm" label="Confirm each" checked={mode === "confirm"}
		description="Review and approve every change before it is applied to the other side." />
</RadioGroup>`;

const astroExample = `---
import { Radio, RadioGroup } from "@xtyle/astro";
---

<RadioGroup label="Plan" orientation="vertical">
	<Radio name="plan" value="free" label="Free" checked />
	<Radio name="plan" value="pro" label="Pro" tone="accent" />
	<Radio name="plan" value="team" label="Team" />
</RadioGroup>

<Radio name="confirm" value="yes" tone="success">I agree to the terms</Radio>`;

export const radioManifest: ComponentManifest = {
	id: "radio",
	name: "Radio",
	category: "control",
	since: "0.1.0",
	keywords: ["radio group", "single choice", "option", "choice"],
	seeAlso: ["checkbox", "segmented", "select"],
	summary: "A single-choice input: a styled native radio plus a group that manages roving focus and arrow-key navigation.",
	description:
		"Radio is a styled native `<input type=\"radio\">`: the real input drives state and keyboard semantics while a custom indicator paints the selected dot in any of the six semantic tones. RadioGroup wraps a set of radios in a `role=\"radiogroup\"`, lays them out vertically or horizontally, and owns the WAI-ARIA roving-tabindex pattern: the group is a single Tab stop and arrow keys move selection between options, wrapping at the ends. Each radio carries its own label (via the `label` attribute or default-slot text), an optional `description` (a secondary explanation line wired to `aria-describedby`), an invalid state, and a disabled state; the group can disable as a whole. Add `card` to render a radio as a full-width option card that takes an accent ring and tint when selected: `card` plus `description` is the title-and-explanation option-card pattern, selection and a11y owned by the component instead of hand-rolled. State lives on the native input, so form participation and submission come for free.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "radio",
			description: "The `<label>` wrapper for a single option, carrying the tone, size, and invalid classes.",
			selector: ".xtyle-radio",
			tokens: [
				"--font-sans",
				"--text-body",
				"--leading-normal",
				"--fg-0",
				"--space-2",
			],
		},
		{
			name: "control",
			description: "The native `<input type=\"radio\">`, visually hidden but present for state, focus, and form submission.",
			selector: ".xtyle-radio__control",
		},
		{
			name: "indicator",
			description: "The painted circle that fills with the tone color when checked; it holds the selection glyph.",
			selector: ".xtyle-radio__indicator",
			tokens: [
				"--border-normal",
				"--field-border",
				"--field-bg",
				"--radius-full",
				"--duration-fast",
				"--ease-standard",
			],
		},
		{
			name: "dot",
			description: "The selection glyph inside the indicator: a node in the fill's markup, not a pseudo-element, so a mod can restructure it (swap the dot for a checkmark or an icon) rather than only recolor it.",
			selector: ".xtyle-radio__dot",
			tokens: ["--radius-full", "--accent-fg", "--duration-fast", "--ease-emphasized", "--ease-standard"],
		},
		{
			name: "label",
			description: "The text content for the option, taken from the `label` attribute or the default slot.",
			selector: ".xtyle-radio__label",
		},
		{
			name: "description",
			description: "The optional secondary explanation line under the label; hidden when empty.",
			selector: ".xtyle-radio__description",
			tokens: ["--text-sm", "--fg-2", "--leading-normal"],
		},
		{
			name: "group",
			description: "The `role=\"radiogroup\"` container plus its optional label, laid out by orientation.",
			selector: ".xtyle-radio-group",
			tokens: ["--font-sans", "--space-2", "--space-4", "--text-sm", "--weight-medium", "--fg-1", "--leading-normal"],
		},
	],
	props: [
		{
			name: "tone",
			type: "FullTone",
			default: "accent",
			description: "Semantic color of the checked indicator. Radio only.",
			bindings: ["html", "svelte", "astro"],
			options: [...FULL_TONES],
		},
		{
			name: "size",
			type: "Size",
			default: "md",
			description: "Control size. Radio only.",
			bindings: ["html", "svelte", "astro"],
			options: ["sm", "md", "lg"],
		},
		{
			name: "name",
			type: "string",
			description: "The shared form name that groups native radios into one choice. Radio only.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "value",
			type: "string",
			default: "on",
			description: "The submitted value when this radio is checked. Radio only.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "checked",
			type: "boolean",
			default: "false",
			description: "Whether this radio is selected. Two-way bindable in Svelte. Radio only.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "invalid",
			type: "boolean",
			default: "false",
			description: "Marks the radio invalid, danger-colored ring plus `aria-invalid`. Radio only.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "label",
			type: "string",
			description: "Accessible label text. On a Radio it is the option label; on a RadioGroup it names the whole group.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "labelledby",
			type: "string",
			description: "ID of an external element labelling the radio or group, when `label` is not used.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "description",
			type: "string",
			description: "A secondary line of explanation under the label, wired to the input's `aria-describedby`. Radio only.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "card",
			type: "boolean",
			default: "false",
			description: "Renders the radio as a full-width option card: a bordered box that takes an accent ring and tint when selected. Pairs with `description` for the title-plus-explanation option-card pattern. Radio only.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "orientation",
			type: '"vertical" | "horizontal"',
			default: "vertical",
			description: "Layout direction and `aria-orientation` of the group. RadioGroup only.",
			bindings: ["html", "svelte", "astro"],
			options: ["vertical", "horizontal"],
		},
		{
			name: "disabled",
			type: "boolean",
			default: "false",
			description: "Disables interaction. On a Radio it disables that option; on a RadioGroup it marks the whole group `aria-disabled`.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [
		{
			name: "card",
			description: "A full-width option card: a bordered box that takes an accent ring and tint when selected. Pairs with `description` for the option-card pattern.",
			className: "xtyle-radio--card",
			tokens: ["--line", "--line-2", "--bg-1", "--radius-md", "--border-thin", "--accent", "--accent-bg", "--ring"],
		},
		{
			name: "accent",
			description: "The checked indicator fills with the accent tone (the default).",
			className: "xtyle-radio--accent",
			tokens: ["--accent", "--accent-fg"],
		},
		{
			name: "neutral",
			description: "Neutral-toned checked indicator.",
			className: "xtyle-radio--neutral",
			tokens: ["--neutral", "--neutral-fg"],
		},
		{
			name: "danger",
			description: "Danger-toned checked indicator.",
			className: "xtyle-radio--danger",
			tokens: ["--danger", "--danger-fg"],
		},
		{
			name: "success",
			description: "Success-toned checked indicator.",
			className: "xtyle-radio--success",
			tokens: ["--success", "--success-fg"],
		},
		{
			name: "warn",
			description: "Warn-toned checked indicator.",
			className: "xtyle-radio--warn",
			tokens: ["--warn", "--warn-fg"],
		},
		{
			name: "info",
			description: "Info-toned checked indicator.",
			className: "xtyle-radio--info",
			tokens: ["--info", "--info-fg"],
		},
		{
			name: "horizontal",
			description: "Lays the group's options in a wrapping row instead of a column.",
			className: "xtyle-radio-group--horizontal",
		},
	],
	sizes: [
		{ name: "sm", description: "Compact.", className: "xtyle-radio--sm" },
		{ name: "md", description: "Default.", className: "xtyle-radio", isDefault: true },
		{ name: "lg", description: "Large.", className: "xtyle-radio--lg" },
	],
	states: [
		{
			name: "hover",
			description: "Pointer over the radio: the indicator border and fill shift toward the hover tint.",
			selector: ".xtyle-radio:hover .xtyle-radio__indicator",
			tokens: ["--line-2", "--state-hover"],
		},
		{
			name: "checked",
			description: "Selected: the indicator fills with the tone color and the dot scales in.",
			selector: ".xtyle-radio__control:checked ~ .xtyle-radio__indicator",
			tokens: ["--accent", "--accent-fg"],
		},
		{
			name: "focus-visible",
			description: "Keyboard focus: a token-colored ring on the indicator plus a transparent outline promoted in forced-colors mode.",
			selector: ".xtyle-radio__control:focus-visible ~ .xtyle-radio__indicator",
			tokens: ["--border-normal", "--border-thick", "--ring"],
		},
		{
			name: "invalid",
			description: "Marked invalid: the indicator border turns danger-colored.",
			selector: ".xtyle-radio--invalid .xtyle-radio__indicator",
			tokens: ["--danger"],
		},
		{
			name: "disabled",
			description: "Non-interactive: muted fill and ink, no pointer.",
			selector: '.xtyle-radio__control:disabled ~ .xtyle-radio__indicator, .xtyle-radio[aria-disabled="true"]',
			tokens: ["--state-disabled", "--line", "--fg-disabled"],
		},
	],
	slots: [
		{
			name: "default",
			description: "On a Radio, the option's label text. On a RadioGroup, the radio options.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	consumedTokens: [
		"--font-sans",
		"--text-body",
		"--text-sm",
		"--text-lg",
		"--weight-medium",
		"--leading-normal",
		"--fg-0",
		"--fg-1",
		"--fg-2",
		"--fg-disabled",
		"--bg-1",
		"--accent-bg",
		"--border-normal",
		"--border-thin",
		"--border-thick",
		"--radius-full",
		"--radius-md",
		"--space-1",
		"--space-2",
		"--space-3",
		"--space-4",
		"--duration-fast",
		"--ease-standard",
		"--ease-emphasized",
		"--field-bg",
		"--field-border",
		"--line",
		"--line-2",
		"--ring",
		"--state-hover",
		"--state-disabled",
		...FULL_TONES.flatMap((t) => [`--${t}`, `--${t}-fg`]),
	],
	composition: [
		"Wrap radios in a RadioGroup so arrow keys move selection and the set is a single Tab stop.",
		"Pair with Field to attach a shared label, help text, and error to the whole group.",
		"Give every radio in a set the same `name` so native form submission yields one value.",
	],
	a11y: [
		"Each Radio is a native `<input type=\"radio\">`, so selection, keyboard, and form semantics come for free.",
		"RadioGroup is a `role=\"radiogroup\"` with `aria-orientation`; it implements the roving-tabindex pattern: one Tab stop, arrows move selection and wrap.",
		"A radio needs an accessible name from `label`, default-slot text, `labelledby`, or `aria-label`; the binding warns at runtime when none is present.",
		"The group needs a name from `label`, `labelledby`, or `aria-label`; the binding warns when it is missing.",
		"`invalid` sets `aria-invalid` on the input alongside the danger-colored ring.",
		"The indicator is decorative (`aria-hidden`); state is conveyed by the native input's checked state.",
		"Focus shows a token ring on the indicator plus a transparent outline the forced-colors base rule promotes to a real system outline.",
	],
	examples: [
		{
			id: "group-and-tones",
			title: "Grouped choice and tones",
			description: "A labelled vertical group with roving focus, plus standalone toned radios.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
		{
			id: "option-cards",
			title: "Option cards",
			description: "`card` + `description` renders each choice as a full-width card with a title and a line of explanation, taking an accent ring when selected — the option-card pattern with selection and a11y owned by the component.",
			source: { html: cardHtmlExample, svelte: cardSvelteExample },
		},
	],
};
