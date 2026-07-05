import type { ComponentManifest } from "./types.js";

const htmlExample = `<xtyle-card-link href="/components/button" interactive>
	<strong slot="header">Button</strong>
	The thing people click: variants, tones, and sizes.
	<span slot="footer">View component →</span>
</xtyle-card-link>`;

const svelteExample = `<script lang="ts">
	import { CardLink } from "@xtyle/svelte";
</script>

<CardLink href="/components/button" interactive>
	{#snippet header()}<strong>Button</strong>{/snippet}
	The thing people click: variants, tones, and sizes.
	{#snippet footer()}<span>View component →</span>{/snippet}
</CardLink>`;

const astroExample = `---
import { CardLink } from "@xtyle/astro";
---

<CardLink href="/components/button" interactive>
	<strong slot="header">Button</strong>
	The thing people click: variants, tones, and sizes.
	<span slot="footer">View component →</span>
</CardLink>`;

export const cardLinkManifest: ComponentManifest = {
	id: "card-link",
	name: "Card Link",
	category: "layout",
	summary: "A whole card that is a single link: the click target is the card, not a button inside it.",
	description:
		"Card Link is a `Card` that navigates. It renders one `<a>` carrying the card's surface, padding, and slots, so the entire card is the click target instead of a link buried in it. It composes the same `interactive`, `overlay`, and `compact` looks as `Card`, defaults to `interactive` (a link card invites the click), and resets the underline and ink so the card reads as a card, not a hyperlink. Pass `href` (plus optional `target`/`rel`); a keyboard `focus-visible` ring lands on the card itself. Reach for it wherever a card *is* a destination: a pager, a nav grid, a list of entries.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "card-link",
			description: "The anchor root carrying the card classes plus the link reset.",
			selector: ".xtyle-card-link",
			tokens: [],
		},
		{
			name: "focus",
			description: "The keyboard focus ring on the card itself.",
			selector: ".xtyle-card-link:focus-visible",
			tokens: ["--border-normal", "--border-thick", "--ring"],
		},
	],
	props: [
		{
			name: "href",
			type: "string",
			description: "The destination. Renders as the anchor's `href`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "target",
			type: "string",
			description: "The anchor `target` (e.g. `_blank`).",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "rel",
			type: "string",
			description: "The anchor `rel` (e.g. `noreferrer`).",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "interactive",
			type: "boolean",
			default: "true",
			description: "The lift-and-highlight hover treatment. On by default, since a link card invites the click; set `false` for a flat link card.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "overlay",
			type: "boolean",
			default: "false",
			description: "The overlay surface: a translucent fill over whatever sits behind it.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "compact",
			type: "boolean",
			default: "false",
			description: "Tighter padding and gap for dense lists of link cards.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [],
	sizes: [],
	states: [
		{
			name: "focus-visible",
			description: "Keyboard focus on the card: a token ring plus a transparent outline that becomes real in forced-colors mode.",
			selector: ".xtyle-card-link:focus-visible",
			tokens: ["--border-normal", "--border-thick", "--ring"],
		},
	],
	slots: [
		{
			name: "default",
			description: "The card body.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "header",
			description: "An optional header row, set off from the body.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "footer",
			description: "An optional footer row, ruled off below the body.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	consumedTokens: ["--border-normal", "--border-thick", "--ring"],
	composition: [
		"Use it for a prev/next pager: one `CardLink` per direction, the whole card a navigation target.",
		"Lay a grid of `CardLink`s for an index: each card a destination, no nested anchors to trip a screen reader.",
		"It composes `Card`'s surface; reach for plain `Card` when the click target is a `Button` *inside* the card, not the card itself.",
	],
	a11y: [
		"The card is a single `<a>`, so there is exactly one tab stop and one announced link. Never nest another link or button inside it.",
		"Focus shows on the card with a `focus-visible` ring plus a transparent outline the forced-colors base rule promotes to a real system outline.",
		"Give the link a clear accessible name through its content (a heading or label), since the whole card is the link text.",
	],
	examples: [
		{
			id: "a-card-that-navigates",
			title: "A card that navigates",
			description: "The whole card is one link, with the interactive lift on hover and a header and footer.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
	],
};
