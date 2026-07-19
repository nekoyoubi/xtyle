import type { ComponentManifest } from "./types.js";

const htmlExample = `<xtyle-empty>
	<div class="xtyle-empty__media"><xtyle-icon name="search"></xtyle-icon></div>
	<h3>No results found</h3>
	<p>Try adjusting your filters or search term.</p>
	<div class="xtyle-empty__actions">
		<xtyle-button variant="subtle">Clear filters</xtyle-button>
	</div>
</xtyle-empty>`;

const svelteExample = `<script lang="ts">
	import { Empty, Icon, Button } from "@xtyle/svelte";
</script>

<Empty>
	<div class="xtyle-empty__media"><Icon name="search" /></div>
	<h3>No results found</h3>
	<p>Try adjusting your filters or search term.</p>
	<div class="xtyle-empty__actions">
		<Button variant="subtle">Clear filters</Button>
	</div>
</Empty>`;

const astroExample = `---
import Empty from "@xtyle/astro/Empty.astro";
import Icon from "@xtyle/astro/Icon.astro";
import Button from "@xtyle/astro/Button.astro";
---

<Empty>
	<div class="xtyle-empty__media"><Icon name="search" /></div>
	<h3>No results found</h3>
	<p>Try adjusting your filters or search term.</p>
	<div class="xtyle-empty__actions">
		<Button variant="subtle">Clear filters</Button>
	</div>
</Empty>`;

export const emptyManifest: ComponentManifest = {
	id: "empty",
	name: "Empty",
	since: "0.6.0",
	category: "feedback",
	keywords: ["empty state", "no data", "placeholder", "zero state", "blank slate"],
	seeAlso: ["skeleton", "alert"],
	summary: "A centered placeholder for a no-data state: an icon, a message, and an action.",
	description:
		"Empty is the placeholder a surface shows when it has nothing to show: no search results, an empty inbox, a list before its first item. It is a centered column that styles whatever you put in it, so it renders no markup of its own: an icon in `.xtyle-empty__media` sits muted and enlarged at the top, the first heading reads as the title, a `<p>` as the muted body, and buttons in `.xtyle-empty__actions` line up beneath. Everything draws from the derived register, and because it only frames content it carries no semantics of its own, so the heading and the action keep theirs. Standalone like `Stack`, it needs no runtime to render.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "media",
			description: "The optional icon or illustration at the top, enlarged and muted. Wrap it in `.xtyle-empty__media` (a bare `<xtyle-icon>` also works).",
			selector: ".xtyle-empty__media",
			tokens: ["--text-4xl", "--fg-3"],
		},
		{
			name: "title",
			description: "The headline: the first heading (or `.xtyle-empty__title`).",
			selector: ".xtyle-empty :is(h1,h2,h3,h4,h5,h6)",
			tokens: ["--text-lg", "--weight-semibold", "--fg-0"],
		},
		{
			name: "text",
			description: "The supporting line: a `<p>` (or `.xtyle-empty__text`), width-capped for readability.",
			selector: ".xtyle-empty p",
			tokens: ["--text-sm", "--fg-2"],
		},
		{
			name: "actions",
			description: "The button row beneath, wrapped in `.xtyle-empty__actions`.",
			selector: ".xtyle-empty__actions",
			tokens: ["--space-2"],
		},
	],
	props: [
		{
			name: "static",
			type: "boolean",
			default: "false",
			description:
				"Astro only: emit the placeholder's markup but never load the runtime to hydrate it. The element only classes itself and the CSS does the rest, so a static empty state is byte-for-byte the hydrated one minus the script. The Svelte and raw-element paths always upgrade, so they carry no equivalent.",
			bindings: ["astro"],
		},
	],
	variants: [],
	sizes: [],
	states: [],
	slots: [
		{
			name: "default",
			description: "The placeholder content: a media element, a heading, a paragraph, and an `.xtyle-empty__actions` row, in that order.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	consumedTokens: [
		"--font-sans",
		"--space-2",
		"--space-3",
		"--space-4",
		"--space-8",
		"--text-4xl",
		"--text-lg",
		"--text-sm",
		"--weight-semibold",
		"--fg-0",
		"--fg-2",
		"--fg-3",
	],
	composition: [
		"Drop it into a table body, a search panel, or a card when the data set is empty, so the surface never renders blank.",
		"Pair the `Icon` that matches the context (a `search` for no results, an `inbox` for a clean queue) with a one-line next step.",
		"Give the primary action a solid `Button` and any secondary a `subtle` one; both sit in `.xtyle-empty__actions`.",
	],
	a11y: [
		"It is a presentational frame and adds no roles of its own, so the heading, paragraph, and buttons keep their native semantics and reading order.",
		"The state is carried by the message, not by the muted icon, so it reads the same to a screen-reader or color-deficient user.",
		"Give the media icon no accessible name (it is decorative); the heading already names the state.",
	],
	examples: [
		{
			id: "no-results",
			title: "No results",
			description: "A search empty state: an icon, a headline, a hint, and a reset action.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
	],
};
