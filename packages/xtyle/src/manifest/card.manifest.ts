import type { ComponentManifest } from "./types.js";
import { FULL_TONES } from "../vocab.js";

const htmlExample = `<xtyle-card>
	<h3 slot="header">Monthly report</h3>
	<p>Revenue is up 12% over last month, driven by the new onboarding flow.</p>
	<div slot="footer">Updated 2 hours ago</div>
</xtyle-card>

<xtyle-card overlay compact>
	<p>A compact card on a translucent overlay surface.</p>
</xtyle-card>

<xtyle-card interactive>
	<h3 slot="header">Pricing</h3>
	<p>See every plan and what is included.</p>
	<a slot="footer" href="/pricing">View plans</a>
</xtyle-card>`;

const htmlActionExample = `<xtyle-card action onclick="openProject('atlas')">
	<h3 slot="header">Atlas</h3>
	<p>Last edited 2 hours ago.</p>
</xtyle-card>`;

const svelteActionExample = `<script lang="ts">
	import { Card } from "@xtyle/svelte";
	let { openProject }: { openProject: (id: string) => void } = $props();
</script>

<Card action onclick={() => openProject("atlas")}>
	{#snippet header()}<h3>Atlas</h3>{/snippet}
	<p>Last edited 2 hours ago.</p>
</Card>`;

const astroActionExample = `---
import { Card } from "@xtyle/astro";
---

<Card action onclick="openProject('atlas')">
	<h3 slot="header">Atlas</h3>
	<p>Last edited 2 hours ago.</p>
</Card>`;

const svelteExample = `<script lang="ts">
	import { Card } from "@xtyle/svelte";
</script>

<Card>
	{#snippet header()}<h3>Monthly report</h3>{/snippet}
	<p>Revenue is up 12% over last month, driven by the new onboarding flow.</p>
	{#snippet footer()}Updated 2 hours ago{/snippet}
</Card>

<Card overlay compact>
	<p>A compact card on a translucent overlay surface.</p>
</Card>

<Card interactive>
	{#snippet header()}<h3>Pricing</h3>{/snippet}
	<p>See every plan and what is included.</p>
	{#snippet footer()}<a href="/pricing">View plans</a>{/snippet}
</Card>`;

const astroExample = `---
import { Card } from "@xtyle/astro";
---

<Card>
	<h3 slot="header">Monthly report</h3>
	<p>Revenue is up 12% over last month, driven by the new onboarding flow.</p>
	<div slot="footer">Updated 2 hours ago</div>
</Card>

<Card overlay compact>
	<p>A compact card on a translucent overlay surface.</p>
</Card>

<Card interactive>
	<h3 slot="header">Pricing</h3>
	<p>See every plan and what is included.</p>
	<a slot="footer" href="/pricing">View plans</a>
</Card>`;

export const cardManifest: ComponentManifest = {
	id: "card",
	name: "Card",
	category: "layout",
	keywords: ["surface", "container", "tile", "box", "panel"],
	seeAlso: ["card-link", "panel", "section"],
	summary: "A surface container that groups related content, with optional header and footer regions.",
	description:
		"Card is the workhorse surface: a bordered, elevated panel that frames related content as one unit. It lays its three regions (header, body, footer) out in a column with consistent spacing; the header and footer are real light-DOM parts (`.xtyle-card__header` / `.xtyle-card__footer`), so the same structure renders identically across every binding. An `overlay` variant swaps the surface for the translucent treatment used inside popovers and menus; a `compact` size tightens the padding; an `interactive` variant adds a hover elevation lift plus a focus-within ring for cards that act as a single clickable target. That last one is presentational only: it styles the surface but adds no behavior, so the consumer wraps the clickable content in a real `<button>` or `<a>` for keyboard and screen-reader semantics.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "card",
			description: "The surface container carrying the variant and size classes.",
			selector: ".xtyle-card",
			tokens: [
				"--font-sans",
				"--text-body",
				"--leading-normal",
				"--fg-0",
				"--bg-1",
				"--border-thin",
				"--line",
				"--radius-lg",
				"--elevation-1",
				"--space-5",
				"--space-4",
			],
		},
		{
			name: "header",
			description: "The top region, a heading-weight title for the card.",
			selector: ".xtyle-card__header",
			tokens: ["--text-lg", "--weight-semibold", "--leading-tight", "--fg-0"],
		},
		{
			name: "body",
			description: "The main content region.",
			selector: ".xtyle-card__body",
			tokens: ["--fg-1"],
		},
		{
			name: "footer",
			description: "The bottom region: separated by a top border, drawn in muted ink.",
			selector: ".xtyle-card__footer",
			tokens: ["--space-3", "--border-thin", "--line", "--fg-2"],
		},
	],
	props: [
		{
			name: "overlay",
			type: "boolean",
			default: "false",
			description: "The translucent overlay surface, for cards floating over content (popovers, menus).",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "interactive",
			type: "boolean",
			default: "false",
			description:
				"Adds a hover elevation lift and a focus-within ring for cards that act as a single clickable target. Presentational only: it adds no role or tab stop, so wrap the clickable content in a real button or link (or use `action` when the card itself is the button).",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "action",
			type: "boolean",
			default: "false",
			description:
				"Makes the card itself the button: it takes `role=\"button\"`, a tab stop, and Enter/Space activation, so a JS `onclick` on the card is keyboard-reachable with no inner control. Implies the interactive hover lift, and its focus ring shows on keyboard entry only. Use it for a card that runs an action (open this item, select this row); for a card that navigates, use a link inside or `CardLink`. Do not put another interactive element inside an `action` card.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "compact",
			type: "boolean",
			default: "false",
			description: "Tightens the padding and inner spacing for dense layouts.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "tone",
			type: "FullTone",
			description:
				"Adds a leading-edge accent bar in the chosen tone (any semantic role, accent variant, or named hue). Omit it for the plain neutral surface.",
			bindings: ["html", "svelte", "astro"],
			options: [...FULL_TONES],
		},
		{
			name: "depthStrength",
			type: '"sm" | "md" | "lg"',
			default: "md",
			description:
				"How far the surface lifts off the page: `sm` is a whisper, `md` (the default) an eased shadow, `lg` a pronounced lift. An interactive card bumps one step heavier on hover.",
			bindings: ["html", "svelte", "astro"],
			options: ["sm", "md", "lg"],
		},
	],
	variants: [
		{
			name: "default",
			description: "The standard elevated surface on the raised background.",
			className: "xtyle-card",
			tokens: ["--bg-1", "--line", "--elevation-1"],
		},
		{
			name: "overlay",
			description: "The translucent overlay surface, for cards floating over other content.",
			className: "xtyle-card--overlay",
			tokens: ["--surface-overlay", "--surface-overlay-border"],
		},
		{
			name: "interactive",
			description: "Hover elevation lift plus a focus-within ring for a clickable card.",
			className: "xtyle-card--interactive",
			tokens: ["--elevation-2", "--line-2", "--state-hover", "--state-press", "--ring"],
		},
	],
	sizes: [
		{ name: "default", description: "Standard padding.", className: "xtyle-card", isDefault: true },
		{ name: "compact", description: "Tightened padding and spacing.", className: "xtyle-card--compact" },
	],
	states: [
		{
			name: "hover",
			description: "Pointer over an interactive card; the surface lifts and the overlay paints the hover tint.",
			selector: ".xtyle-card--interactive:hover",
			tokens: ["--elevation-2", "--line-2", "--state-hover"],
		},
		{
			name: "active",
			description: "Interactive card pressed; the lift drops and the overlay paints the press tint.",
			selector: ".xtyle-card--interactive:active",
			tokens: ["--state-press"],
		},
		{
			name: "focus-within",
			description:
				"Keyboard focus lands inside an interactive card: a token-colored ring, plus a transparent outline that becomes real in forced-colors mode.",
			selector: ".xtyle-card--interactive:focus-within",
			tokens: ["--border-normal", "--border-thick", "--ring"],
		},
	],
	slots: [
		{
			name: "default",
			description: "The card body content.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "header",
			description: "The card title region, rendered above the body.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "footer",
			description: "The card footer region, rendered below the body with a top border.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	consumedTokens: [
		"--font-sans",
		"--text-body",
		"--text-lg",
		"--weight-semibold",
		"--leading-normal",
		"--leading-tight",
		"--border-thin",
		"--border-normal",
		"--border-thick",
		"--radius-lg",
		...FULL_TONES.map((t) => `--${t}`),
		"--space-1",
		"--space-2",
		"--space-3",
		"--space-4",
		"--space-5",
		"--duration-fast",
		"--ease-standard",
		"--ring",
		"--state-hover",
		"--state-press",
		"--fg-0",
		"--fg-1",
		"--fg-2",
		"--bg-1",
		"--line",
		"--line-2",
		"--elevation-0",
		"--elevation-1",
		"--elevation-2",
		"--elevation-3",
		"--surface-overlay",
		"--surface-overlay-border",
	],
	composition: [
		"Use Card as the frame for any grouped content: forms, media, summaries, list items.",
		"For a card whose content carries its own control, set `interactive` and wrap that content in a real `<button>` or `<a>`; the variant supplies the hover/focus affordance but no behavior.",
		"For a card that is itself one clickable target running a JS action, set `action` instead: the card becomes a keyboard-operable button (`role=\"button\"`, tab stop, Enter/Space), so an `onclick` on it works for the keyboard with nothing to wrap.",
		"Pair the `overlay` variant with floating surfaces (popovers, menus, toasts) so the card matches their translucent treatment.",
	],
	a11y: [
		"Card is a plain surface container with no implicit role; put semantic elements (headings, lists, buttons) inside it.",
		"The `interactive` variant is presentational only: it adds no role or tab stop. Wrap the clickable target in a native `<button>` or `<a>` so keyboard and screen-reader semantics come for free.",
		"The `action` variant makes the card itself the button: it reflects `role=\"button\"`, takes a `tabindex` tab stop, and maps Enter/Space to the same activation a click fires. Do not nest another interactive element inside an `action` card; a button must not contain a button or link.",
		"An `interactive` card rings on `:focus-within` (the real control inside it takes focus); an `action` card rings on `:focus-visible`, so a pointer click never paints the ring but keyboard entry does.",
		"Focus is shown with a token ring and a transparent outline that the forced-colors base rule promotes to a real system outline.",
	],
	examples: [
		{
			id: "regions-and-variants",
			title: "Regions and variants",
			description: "Header, body, and footer regions; the overlay, compact, and interactive variants.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
		{
			id: "action-card",
			title: "Action card",
			description:
				"An `action` card is itself a keyboard-operable button: it focuses, Enter and Space fire its `onclick`, and the ring shows on keyboard entry only.",
			source: { html: htmlActionExample, svelte: svelteActionExample, astro: astroActionExample },
		},
	],
};
