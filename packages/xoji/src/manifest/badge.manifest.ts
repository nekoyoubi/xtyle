import type { ComponentManifest } from "./types.js";
import { FULL_TONES } from "../vocab.js";

const htmlExample = `<xoji-badge variant="soft" tone="accent">New</xoji-badge>

<xoji-badge variant="solid" tone="success" dot>Online</xoji-badge>

<xoji-badge variant="outline" tone="danger">Failed</xoji-badge>

<xoji-badge tone="info" count="12">Notifications</xoji-badge>

<xoji-badge variant="soft" tone="purple" removable remove-label="Remove tag">design</xoji-badge>

<span class="xoji-dot xoji-dot--success" role="img" aria-label="Online"></span>`;

const svelteExample = `<script lang="ts">
	import { Badge } from "@xoji/svelte";
</script>

<Badge variant="soft" tone="accent">New</Badge>

<Badge variant="solid" tone="success" dot>Online</Badge>

<Badge variant="outline" tone="danger">Failed</Badge>

<Badge tone="info" count={12}>Notifications</Badge>

<Badge variant="soft" tone="purple" removable removeLabel="Remove tag" onremove={() => drop("design")}>design</Badge>`;

const astroExample = `---
import { Badge } from "@xoji/astro";
---

<Badge variant="soft" tone="accent">New</Badge>

<Badge variant="solid" tone="success" dot>Online</Badge>

<Badge variant="outline" tone="danger">Failed</Badge>

<Badge tone="info" count={12}>Notifications</Badge>

<Badge variant="soft" tone="purple" removable removeLabel="Remove tag">design</Badge>

<span class="xoji-dot xoji-dot--success" role="img" aria-label="Online"></span>`;

const pulseHtmlExample = `<xoji-badge variant="soft" tone="success" dot pulse>Live</xoji-badge>
<xoji-badge variant="soft" tone="danger" dot pulse="fast">Alert</xoji-badge>`;

const pulseSvelteExample = `<script lang="ts">
	import { Badge } from "@xoji/svelte";
</script>

<Badge variant="soft" tone="success" dot pulse>Live</Badge>
<Badge variant="soft" tone="danger" dot pulse="fast">Alert</Badge>`;

const pulseAstroExample = `---
import { Badge } from "@xoji/astro";
---

<Badge variant="soft" tone="success" dot pulse>Live</Badge>
<Badge variant="soft" tone="danger" dot pulse="fast">Alert</Badge>`;

export const badgeManifest: ComponentManifest = {
	id: "badge",
	name: "Badge",
	category: "data-display",
	summary: "A compact label, tag, or status chip: three fills across six semantic tones and twelve named hues, optionally removable.",
	description:
		"Badge labels, tags, counts, and statuses inline. Fill treatment (`variant`) and color (`tone`) are independent axes: each of the three fills (solid, soft, outline) can carry any of the six semantic tones (accent, neutral, danger, success, warn, info) or any of the twelve named hues (red … black). It adds a leading status dot (which can `pulse` to read as live), a tabular count affordance, and a `removable` form whose `×` is a real focusable `<button>` that emits a `remove` event. That's the removable tag you build a filter row or token input from. A standalone `.xoji-dot` indicator covers the bare-dot case. Status tones (success, warn, danger, info) emit a screen-reader-only tone word so meaning never rides on color alone.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "badge",
			description: "The chip root carrying the variant, tone, and size classes.",
			selector: ".xoji-badge",
			tokens: [
				"--font-sans",
				"--text-xs",
				"--weight-medium",
				"--leading-tight",
				"--neutral-bg",
				"--neutral-text",
				"--border-thin",
				"--radius-full",
				"--space-0",
				"--space-2",
			],
		},
		{
			name: "dot",
			description: "The optional leading status dot, painted in the badge's current text color; breathes on a soft opacity loop when `pulse` is set.",
			selector: ".xoji-badge__dot",
			tokens: ["--space-2", "--space-3", "--radius-full", "--ease-standard"],
		},
		{
			name: "label",
			description: "The text content wrapper.",
			selector: ".xoji-badge__label",
		},
		{
			name: "count",
			description: "A tabular-numeric count affordance rendered after the label.",
			selector: ".xoji-badge__count",
			tokens: ["--weight-semibold"],
		},
		{
			name: "remove",
			description: "A real `<button>` dismiss control with an accessible name, its own focus ring, and a state overlay.",
			selector: ".xoji-badge__remove",
			tokens: ["--space-1", "--radius-full", "--duration-fast", "--ease-standard", "--state-hover", "--state-press", "--border-normal", "--border-thick", "--ring"],
		},
		{
			name: "indicator",
			description: "A standalone dot indicator independent of any chip, tonable and sizable on its own.",
			selector: ".xoji-dot",
			tokens: ["--space-1", "--space-2", "--space-3", "--radius-full", "--neutral"],
		},
	],
	props: [
		{
			name: "variant",
			type: "BadgeVariant",
			default: "soft",
			description: "Fill treatment. Independent of tone.",
			bindings: ["html", "svelte", "astro"],
			options: ["solid", "soft", "outline"],
		},
		{
			name: "tone",
			type: "FullTone",
			default: "neutral",
			description: "Any color tone: a semantic role, an accent variant (accent-2/3/4), or a named hue (red … black).",
			bindings: ["html", "svelte", "astro"],
			options: [...FULL_TONES],
		},
		{
			name: "size",
			type: "Size",
			default: "md",
			description: "Chip size; the scale tops out smaller than the controls (no `xl`).",
			bindings: ["html", "svelte", "astro"],
			options: ["sm", "md", "lg"],
		},
		{
			name: "dot",
			type: "boolean",
			default: "false",
			description: "Shows a leading status dot in the current text color.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "pulse",
			type: `boolean | "slow" | "fast"`,
			description:
				"Breathes the `dot` on a soft opacity loop so the chip reads as live (streaming, connected, active), reusing Progress's pulse cadence: a bare `pulse` (or `slow`) runs at 1.8s, `fast` at 0.9s. No-op without `dot`, and held still under `prefers-reduced-motion`.",
			bindings: ["html", "svelte", "astro"],
			options: ["slow", "fast"],
		},
		{
			name: "count",
			type: "string | number",
			description: "A numeric count rendered after the label in tabular figures.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "removable",
			type: "boolean",
			default: "false",
			description: "Adds a dismiss `×` button. html/svelte wire it to fire `onremove`; Astro emits static markup you wire yourself.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "removeLabel",
			type: "string",
			default: "Remove",
			description: "Accessible name for the dismiss button (kebab `remove-label` on the custom element).",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "onremove",
			type: "(event: MouseEvent) => void",
			description: "Handler invoked when the dismiss button is activated.",
			bindings: ["svelte"],
		},
	],
	variants: [
		{
			name: "solid",
			description: "Filled with the tone color. The highest-emphasis treatment.",
			className: "xoji-badge--solid",
			tokens: ["--accent", "--accent-fg", "--color-blue-base", "--color-blue-contrast"],
		},
		{
			name: "soft",
			description: "A soft tone-tinted background with tone-colored text. The default.",
			className: "xoji-badge--soft",
			tokens: ["--accent-bg", "--accent-text", "--color-blue-subtle", "--color-blue-contrast", "--color-blue-muted"],
		},
		{
			name: "outline",
			description: "Transparent fill with a tone-colored border and text.",
			className: "xoji-badge--outline",
			tokens: ["--accent", "--accent-text", "--color-blue-strong", "--color-blue-muted"],
		},
	],
	sizes: [
		{ name: "sm", description: "Compact.", className: "xoji-badge--sm" },
		{ name: "md", description: "Default.", className: "xoji-badge", isDefault: true },
		{ name: "lg", description: "Large.", className: "xoji-badge--lg" },
	],
	states: [
		{
			name: "pulse",
			description: "With `pulse` and a `dot`, the dot breathes on a soft opacity loop at Progress's own two speeds (`slow` 1.8s, `fast` 0.9s); held still under `prefers-reduced-motion`.",
			selector: ".xoji-badge--pulse-slow .xoji-badge__dot, .xoji-badge--pulse-fast .xoji-badge__dot",
			tokens: ["--ease-standard"],
		},
		{
			name: "remove-hover",
			description: "Pointer over the dismiss button. Its overlay paints the hover tint.",
			selector: ".xoji-badge__remove:hover::after",
			tokens: ["--state-hover"],
		},
		{
			name: "remove-active",
			description: "Dismiss button pressed. Its overlay paints the press tint.",
			selector: ".xoji-badge__remove:active::after",
			tokens: ["--state-press"],
		},
		{
			name: "remove-focus-visible",
			description: "Keyboard focus on the dismiss button: a token ring plus a transparent outline that becomes real in forced-colors mode.",
			selector: ".xoji-badge__remove:focus-visible",
			tokens: ["--border-normal", "--border-thick", "--ring"],
		},
	],
	slots: [
		{
			name: "default",
			description: "The badge label.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	consumedTokens: [
		"--font-sans",
		"--text-xs",
		"--text-sm",
		"--weight-medium",
		"--weight-semibold",
		"--leading-tight",
		"--border-thin",
		"--border-normal",
		"--border-thick",
		"--radius-full",
		"--space-0",
		"--space-1",
		"--space-2",
		"--space-3",
		"--duration-fast",
		"--ease-standard",
		"--ring",
		"--state-hover",
		"--state-press",
		...FULL_TONES.flatMap((t) => [`--${t}`, `--${t}-bg`, `--${t}-fg`, `--${t}-text`]),
	],
	composition: [
		"Pair with a list or tag input as removable chips; wire `onremove` (svelte) or the `.xoji-badge__remove` click (html/astro) to drop the item.",
		"Use the standalone `.xoji-dot` indicator next to avatars or rows for presence without a full chip.",
		"The `count` affordance pairs with nav items and tabs for unread counts.",
	],
	a11y: [
		"Status tones (success, warn, danger, info) emit a screen-reader-only tone word, so meaning is conveyed without relying on color (WCAG 1.4.1).",
		"The leading dot is decorative (`aria-hidden`); the standalone `.xoji-dot` should carry `role=\"img\"` and an `aria-label` when it conveys meaning on its own.",
			"The `pulse` animation is purely decorative and is disabled under `prefers-reduced-motion`; the live meaning should also be carried by the label text, never by the motion alone.",
		"The dismiss control is a native `<button>` with an `aria-label`; the html/svelte bindings warn at runtime when you omit `remove-label`.",
		"The dismiss button shows focus with a token ring plus a transparent outline that the forced-colors base rule promotes to a real system outline.",
		"The `×` glyph is drawn as a decorative `aria-hidden` SVG; the button's accessible name comes from its label, not the icon.",
	],
	examples: [
		{
			id: "fills-tones-and-affordances",
			title: "Fills, tones, and affordances",
			description: "The three fills cross all tones and hues; dot, count, and the removable form layer on top, with a standalone dot for the bare case.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
		{
			id: "live-pulse",
			title: "Live status",
			description: "`pulse` breathes the dot so a chip reads as live, streaming, or connected, at Progress's two speeds (`slow` and `fast`); it holds still under reduced-motion.",
			source: { html: pulseHtmlExample, svelte: pulseSvelteExample, astro: pulseAstroExample },
		},
	],
};
