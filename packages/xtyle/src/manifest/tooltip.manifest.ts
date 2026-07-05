import type { ComponentManifest } from "./types.js";
import { FULL_TONES } from "../vocab.js";

const htmlExample = `<xtyle-tooltip text="Save your changes" placement="top">
	<button class="xtyle-button xtyle-button--solid xtyle-button--accent">Save</button>
</xtyle-tooltip>

<xtyle-tooltip placement="right">
	<button class="xtyle-button xtyle-button--outline xtyle-button--neutral" aria-label="Settings">
		<svg slot="icon-start" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
			<path fill="currentColor" d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
		</svg>
	</button>
	<span slot="content">Open <strong>settings</strong></span>
</xtyle-tooltip>`;

const svelteExample = `<script lang="ts">
	import { Tooltip, Button } from "@xtyle/svelte";
</script>

<Tooltip text="Save your changes" placement="top">
	<Button variant="solid" tone="accent">Save</Button>
</Tooltip>

<Tooltip placement="right">
	<Button variant="outline" tone="neutral" iconOnly ariaLabel="Settings">
		{#snippet iconStart()}
			<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
				<path fill="currentColor" d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
			</svg>
		{/snippet}
	</Button>
	{#snippet content()}Open <strong>settings</strong>{/snippet}
</Tooltip>`;

const astroExample = `---
import { Tooltip, Button } from "@xtyle/astro";
---

<Tooltip text="Save your changes" placement="top">
	<Button variant="solid" tone="accent">Save</Button>
</Tooltip>

<Tooltip placement="right">
	<Button variant="outline" tone="neutral" iconOnly aria-label="Settings">
		<svg slot="icon-start" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
			<path fill="currentColor" d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
		</svg>
	</Button>
	<span slot="content">Open <strong>settings</strong></span>
</Tooltip>`;

export const tooltipManifest: ComponentManifest = {
	id: "tooltip",
	name: "Tooltip",
	category: "overlay",
	summary: "A hover/focus hint that floats a short description beside its trigger, on any of four sides.",
	description:
		"Tooltip wraps an interactive trigger and surfaces a short, supplementary hint on hover and on keyboard focus. The hint is linked to the trigger with `aria-describedby` so assistive tech announces it as the element's description, and it floats to one of four `placement` sides (top, bottom, left, right) over an elevated overlay surface with a pointing arrow. It satisfies WCAG 1.4.13 Content on Hover or Focus: the hint is dismissible with Escape, hoverable (the pointer can travel onto the tooltip without it vanishing), and persistent (it stays until focus leaves or the pointer departs both trigger and tooltip). Tip text comes from the `text` prop, or richer markup from the `content` slot. The hint scales past a one-line label: a `mode` of `rich` opens it into a roomier, left-aligned panel that wraps multi-line text and holds structured content (a detail card, a stat or progress readout); `size` dials the padding, and a `tone` colors it, as a leading edge over the neutral overlay by default or as a fully `soft`/`solid` toned surface.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "tooltip",
			description: "The inline wrapper around the trigger; carries the placement class and anchors the floating content.",
			selector: ".xtyle-tooltip",
		},
		{
			name: "content",
			description: "The floating hint surface: an elevated overlay panel holding the tip text or content slot.",
			selector: ".xtyle-tooltip__content",
			tokens: [
				"--font-sans",
				"--text-sm",
				"--weight-normal",
				"--leading-tight",
				"--fg-0",
				"--surface-overlay",
				"--surface-overlay-border",
				"--border-thin",
				"--radius-sm",
				"--elevation-2",
				"--space-1",
				"--space-2",
				"--space-8",
				"--duration-fast",
				"--ease-standard",
			],
		},
		{
			name: "arrow",
			description: "The rotated square nub pointing from the content back toward the trigger.",
			selector: ".xtyle-tooltip__arrow",
			tokens: ["--space-1", "--space-2", "--surface-overlay", "--surface-overlay-border", "--border-thin"],
		},
		{
			name: "edge",
			description:
				"The leading tone bar shown along the content's start edge when a `tone` is set without `soft`/`solid`; zero-width otherwise.",
			selector: ".xtyle-tooltip__content::before",
			tokens: ["--space-1", "--radius-sm"],
		},
	],
	props: [
		{
			name: "text",
			type: "string",
			description: "The tip text. Use the `content` slot instead for richer markup.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "placement",
			type: "Placement",
			default: "top",
			description: "Which side of the trigger the hint floats on.",
			bindings: ["html", "svelte", "astro"],
			options: ["top", "bottom", "left", "right"],
		},
		{
			name: "open",
			type: "boolean",
			default: "false",
			description: "Reflects/controls visibility. Normally driven by hover and focus; settable to force the hint open.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "tone",
			type: "Tone",
			description:
				"Colors the hint with one of the register's tones. By default the surface stays a neutral overlay and the tone shows as a leading edge bar; pair with `variant` for a fully toned surface.",
			bindings: ["html", "svelte", "astro"],
			options: [...FULL_TONES],
		},
		{
			name: "variant",
			type: "'soft' | 'solid'",
			description:
				"How a `tone` fills the surface. Omit for the neutral surface with a leading tone edge; `soft` washes the whole hint in the tone's soft tint; `solid` fills it with the tone. Both color the arrow to match. No effect without a `tone`.",
			bindings: ["html", "svelte", "astro"],
			options: ["soft", "solid"],
		},
		{
			name: "mode",
			type: "'hint' | 'rich'",
			default: "hint",
			description:
				"Content density. `hint` is the tight, single-line bubble for short text; `rich` is a roomier, left-aligned panel that wraps multi-line text and holds structured content (detail cards, stat or progress readouts).",
			bindings: ["html", "svelte", "astro"],
			options: ["hint", "rich"],
		},
		{
			name: "size",
			type: "'sm' | 'md'",
			default: "sm",
			description: "Padding scale. `sm` is the compact default; `md` is roomier. Independent of `mode`.",
			bindings: ["html", "svelte", "astro"],
			options: ["sm", "md"],
		},
	],
	variants: [
		{
			name: "soft",
			description: "With a tone, washes the whole hint in the tone's soft tint with a matching border and arrow.",
			className: "xtyle-tooltip--soft",
			tokens: ["--info-bg", "--info-text", "--info"],
		},
		{
			name: "solid",
			description: "With a tone, fills the hint with the solid tone and its on-tone text and arrow.",
			className: "xtyle-tooltip--solid",
			tokens: ["--info", "--info-fg"],
		},
	],
	sizes: [
		{ name: "sm", description: "Compact padding (the default).", className: "", isDefault: true },
		{ name: "md", description: "Roomier padding.", className: "xtyle-tooltip--md" },
	],
	states: [
		{
			name: "open",
			description: "Hint visible: fades in via the content's data-open flag while pointer or focus is on trigger or tooltip.",
			selector: '.xtyle-tooltip__content[data-open="true"]',
		},
		{
			name: "top",
			description: "Hint floats above the trigger; arrow points down.",
			selector: ".xtyle-tooltip--top .xtyle-tooltip__content",
		},
		{
			name: "bottom",
			description: "Hint floats below the trigger; arrow points up.",
			selector: ".xtyle-tooltip--bottom .xtyle-tooltip__content",
		},
		{
			name: "left",
			description: "Hint floats to the left of the trigger; arrow points right.",
			selector: ".xtyle-tooltip--left .xtyle-tooltip__content",
		},
		{
			name: "right",
			description: "Hint floats to the right of the trigger; arrow points left.",
			selector: ".xtyle-tooltip--right .xtyle-tooltip__content",
		},
	],
	slots: [
		{
			name: "default",
			description: "The trigger element the tooltip describes.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "content",
			description: "Rich hint markup, used in place of the `text` prop.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	consumedTokens: [
		"--font-sans",
		"--text-sm",
		"--weight-normal",
		"--leading-tight",
		"--leading-normal",
		"--fg-0",
		"--surface-overlay",
		"--surface-overlay-border",
		"--border-thin",
		"--radius-sm",
		"--elevation-2",
		"--space-1",
		"--space-2",
		"--space-3",
		"--space-8",
		"--duration-fast",
		"--ease-standard",
		...FULL_TONES.flatMap((t) => [`--${t}`, `--${t}-bg`, `--${t}-fg`, `--${t}-text`]),
	],
	composition: [
		"Wrap a Button (or any focusable control) as the trigger; icon-only buttons benefit most from a tooltip.",
		"Keep the hint short and supplementary; never put essential or interactive content only in a tooltip.",
		"For a label that must always be readable, use a visible caption instead; tooltips are progressive enhancement.",
	],
	a11y: [
		"The hint carries `role=\"tooltip\"` and is linked to the trigger via `aria-describedby`, so it is announced as the trigger's description.",
		"Shows on BOTH pointer hover and keyboard focus, so the hint is reachable without a mouse.",
		"WCAG 1.4.13 dismissible: Escape hides the hint while the trigger keeps focus.",
		"WCAG 1.4.13 hoverable: the pointer can move onto the tooltip itself without it disappearing.",
		"WCAG 1.4.13 persistent: the hint stays until focus leaves or the pointer departs both trigger and tooltip.",
		"The arrow is decorative (`aria-hidden`); the binding warns at runtime when neither `text` nor a `content` slot is supplied.",
	],
	examples: [
		{
			id: "placement-and-content",
			title: "Placement and rich content",
			description: "A plain-text hint above a button, and a rich-markup hint to the right of an icon button.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
	],
};
