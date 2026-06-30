import type { ComponentManifest } from "./types.js";
import { FULL_TONES } from "../vocab.js";

/** The four-token family every tone exposes: the exact set a tone-driven component consumes. */
const toneTokens = FULL_TONES.flatMap((t) => [`--${t}`, `--${t}-bg`, `--${t}-fg`, `--${t}-text`]);

const htmlExample = `<xoji-button variant="solid" tone="accent">Save changes</xoji-button>

<xoji-button variant="outline" tone="neutral">Cancel</xoji-button>

<xoji-button variant="subtle" tone="danger" icon-only aria-label="Delete">
	<svg slot="icon-start" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
		<path fill="currentColor" d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-3 6h12l-1 12H7L6 9Z" />
	</svg>
</xoji-button>

<xoji-button variant="solid" tone="success" loading>Saving…</xoji-button>

<xoji-button variant="link" tone="info" href="/docs">Read the docs</xoji-button>`;

const svelteExample = `<script lang="ts">
	import { Button } from "@xoji/svelte";
</script>

<Button variant="solid" tone="accent" onclick={() => save()}>Save changes</Button>

<Button variant="outline" tone="neutral">Cancel</Button>

<Button variant="subtle" tone="danger" iconOnly ariaLabel="Delete">
	{#snippet iconStart()}
		<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
			<path fill="currentColor" d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-3 6h12l-1 12H7L6 9Z" />
		</svg>
	{/snippet}
</Button>

<Button variant="solid" tone="success" loading>Saving…</Button>

<Button variant="link" tone="info" href="/docs">Read the docs</Button>`;

const astroExample = `---
import { Button } from "@xoji/astro";
---

<Button variant="solid" tone="accent">Save changes</Button>

<Button variant="outline" tone="neutral">Cancel</Button>

<Button variant="subtle" tone="danger" iconOnly aria-label="Delete">
	<svg slot="icon-start" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
		<path fill="currentColor" d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-3 6h12l-1 12H7L6 9Z" />
	</svg>
</Button>

<Button variant="link" tone="info" href="/docs">Read the docs</Button>`;

export const buttonManifest: ComponentManifest = {
	id: "button",
	name: "Button",
	category: "control",
	summary: "A clickable action: five variants across six semantic tones.",
	description:
		"Button triggers an action or navigates. Visual treatment (`variant`) and semantic color (`tone`) are independent axes: any of the five variants (solid, outline, ghost, subtle, link) can carry any of the six tones (accent, neutral, danger, success, warn, info). It renders a native `<button>` by default and an `<a>` when given an `href`, so the same component covers both actions and links. Icon slots, an icon-only square form, a loading state with an inline accessible spinner, and a full-width block mode round out the surface.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "root",
			description: "The button or anchor element carrying the variant, tone, and size classes.",
			selector: ".xoji-button",
			tokens: [
				"--font-sans",
				"--text-body",
				"--weight-medium",
				"--leading-tight",
				"--border-thin",
				"--radius-md",
				"--space-2",
				"--space-4",
				"--duration-fast",
				"--ease-standard",
			],
		},
		{
			name: "overlay",
			description: "The pseudo-element behind the content that paints hover and active state tints.",
			selector: ".xoji-button::after",
			tokens: ["--state-hover", "--state-press"],
		},
		{
			name: "icon",
			description: "An icon slot rendered before or after the label (icon-start / icon-end).",
			selector: ".xoji-button__icon",
		},
		{
			name: "label",
			description: "The text content wrapper, hidden while loading so the spinner takes its place.",
			selector: ".xoji-button__label",
		},
		{
			name: "spinner",
			description: "The inline accessible spinner shown while loading, drawn in currentColor.",
			selector: ".xoji-button__spinner",
			tokens: ["--border-normal", "--radius-full", "--duration-slow"],
		},
	],
	props: [
		{
			name: "variant",
			type: "ButtonVariant",
			default: "solid",
			description: "Visual treatment. Independent of tone.",
			bindings: ["html", "svelte", "astro"],
			options: ["solid", "outline", "ghost", "subtle", "link"],
		},
		{
			name: "tone",
			type: "FullTone",
			default: "accent",
			description: "Color tone driving fill, text, and border per variant: any semantic role, accent variant, or named hue.",
			bindings: ["html", "svelte", "astro"],
			options: [...FULL_TONES],
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
			name: "type",
			type: '"button" | "submit" | "reset"',
			default: "button",
			description: "Native button type. Ignored when `href` is set.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "href",
			type: "string",
			description: "When set, the button renders as an `<a>`. Dropped (with `aria-disabled`) when also disabled.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "disabled",
			type: "boolean",
			default: "false",
			description: "Disables interaction. On an anchor, applies `aria-disabled` and removes `href`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "loading",
			type: "boolean",
			default: "false",
			description: "Shows the spinner, sets `aria-busy`, and blocks interaction.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "block",
			type: "boolean",
			default: "false",
			description: "Stretches the button to fill its container's width.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "iconOnly",
			type: "boolean",
			default: "false",
			description: "Square, equal-padding form for a single icon. Requires an accessible name (aria-label).",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "pressed",
			type: "boolean",
			description:
				"Turns the button into a toggle and reflects its state to `aria-pressed`. Set it (`pressed` / `pressed=\"true\"`) for on, `pressed=\"false\"` for off, and omit it entirely for a plain button. Controlled: flip it in your own click handler; the button reflects state, it does not self-toggle.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "selected",
			type: "boolean",
			description:
				"Marks the button as selected within a set and reflects its state to `aria-selected`; distinct from `pressed`'s on/off toggle. Set it (`selected` / `selected=\"true\"`) for selected, `selected=\"false\"` for not, and omit it entirely for a button with no selection semantics. Controlled: flip it in your own click handler; the button reflects state, it does not self-toggle.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [
		{
			name: "solid",
			description: "Filled with the tone color; the primary, highest-emphasis treatment.",
			className: "xoji-button--solid",
			tokens: ["--accent", "--accent-fg"],
		},
		{
			name: "outline",
			description: "Transparent fill with a tone-colored border and text.",
			className: "xoji-button--outline",
			tokens: ["--accent", "--accent-text"],
		},
		{
			name: "ghost",
			description: "No chrome until hover, then a neutral state tint; tone-colored text.",
			className: "xoji-button--ghost",
			tokens: ["--accent-text", "--state-hover"],
		},
		{
			name: "subtle",
			description: "A soft tone-tinted background with tone-colored text.",
			className: "xoji-button--subtle",
			tokens: ["--accent-bg", "--accent-text"],
		},
		{
			name: "link",
			description: "Looks like a link: no box, no padding, underline on hover.",
			className: "xoji-button--link",
			tokens: ["--accent-text", "--radius-sm"],
		},
	],
	sizes: [
		{ name: "xs", description: "Densest, for compact toolbar pills.", className: "xoji-button--xs" },
		{ name: "sm", description: "Compact.", className: "xoji-button--sm" },
		{ name: "md", description: "Default.", className: "xoji-button", isDefault: true },
		{ name: "lg", description: "Large.", className: "xoji-button--lg" },
	],
	states: [
		{
			name: "hover",
			description: "Pointer over the button: overlay paints the hover tint.",
			selector: ".xoji-button:hover::after",
			tokens: ["--state-hover"],
		},
		{
			name: "active",
			description: "Button pressed: overlay paints the press tint.",
			selector: ".xoji-button:active::after",
			tokens: ["--state-press"],
		},
		{
			name: "pressed",
			description: "Toggle engaged: `aria-pressed=\"true\"` paints the press overlay persistently, so an on toggle reads as sunken across every variant.",
			selector: '.xoji-button[aria-pressed="true"]',
			tokens: ["--state-press"],
		},
		{
			name: "selected",
			description: "Selected within a set: `aria-selected=\"true\"` paints the selected overlay persistently, so a chosen pill reads as active across every variant.",
			selector: '.xoji-button[aria-selected="true"]',
			tokens: ["--state-selected"],
		},
		{
			name: "focus-visible",
			description: "Keyboard focus: a token-colored ring, plus a transparent outline that becomes real in forced-colors mode.",
			selector: ".xoji-button:focus-visible",
			tokens: ["--border-normal", "--border-thick", "--ring"],
		},
		{
			name: "disabled",
			description: "Non-interactive: muted fill and ink, overlay suppressed.",
			selector: '.xoji-button:disabled, .xoji-button[aria-disabled="true"]',
			tokens: ["--fg-disabled", "--state-disabled"],
		},
		{
			name: "loading",
			description: "Busy: content hidden behind the centered spinner, pointer set to progress.",
			selector: ".xoji-button--loading",
		},
	],
	slots: [
		{
			name: "default",
			description: "The button label.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "icon-start",
			description: "An icon rendered before the label.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "icon-end",
			description: "An icon rendered after the label.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	consumedTokens: [
		"--font-sans",
		"--text-body",
		"--text-xs",
		"--text-sm",
		"--text-lg",
		"--weight-medium",
		"--leading-tight",
		"--border-thin",
		"--border-normal",
		"--border-thick",
		"--radius-md",
		"--radius-sm",
		"--radius-full",
		"--space-0",
		"--space-1",
		"--space-2",
		"--space-3",
		"--space-4",
		"--space-5",
		"--duration-fast",
		"--duration-slow",
		"--ease-standard",
		"--ring",
		"--state-hover",
		"--state-press",
		"--state-selected",
		"--state-disabled",
		"--fg-disabled",
		...toneTokens,
	],
	composition: [
		"Pair with Field for form submit/reset actions; bind the button `type` accordingly.",
		"Use the `icon-start` / `icon-end` slots with an Icon component once it lands; for now any inline SVG works.",
		"The icon-only form is the seed of a future IconButton convenience wrapper.",
	],
	a11y: [
		"Renders a native `<button>` (or `<a>` with `href`) so keyboard and screen-reader semantics come for free.",
		"`disabled` blocks interaction; on an anchor it applies `aria-disabled` and drops `href` (anchors cannot be natively disabled).",
		"`loading` sets `aria-busy=\"true\"` and prevents activation.",
		"`pressed` makes it a toggle via `aria-pressed`; it is controlled, so the consumer flips the state on click. The button reflects, it does not self-toggle.",
		"`selected` marks membership in a set via `aria-selected` (distinct from `pressed`); it is controlled the same way. The consumer flips it, the button reflects.",
		"The icon-only form has no visible text, so it REQUIRES an `aria-label`; the binding warns at runtime when one is missing.",
		"Focus is shown with a token ring and a transparent outline that the forced-colors base rule promotes to a real system outline.",
		"The spinner is decorative (`aria-hidden`); busy state is conveyed by `aria-busy`, not the spinner.",
	],
	examples: [
		{
			id: "variants-and-tones",
			title: "Variants and tones",
			description: "The five variants and the six tones are independent. Mix freely.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
	],
};
