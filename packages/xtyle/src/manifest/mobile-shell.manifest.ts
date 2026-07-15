import type { ComponentManifest } from "./types.js";

const htmlExample = `<xtyle-mobile-shell heading="Inbox">
	<xtyle-button slot="actions" variant="ghost" size="sm">Filter</xtyle-button>

	<!-- the one scrolling column -->
	<p>Whatever the section renders.</p>

	<xtyle-bottom-nav
		slot="nav"
		value="inbox"
		label="Sections"
		tabs='[{"value":"inbox","label":"Inbox","icon":"folder","badge":3},
		       {"value":"threads","label":"Threads","icon":"menu"},
		       {"value":"you","label":"You","icon":"gear"}]'
	></xtyle-bottom-nav>
</xtyle-mobile-shell>`;

const svelteExample = `<script lang="ts">
	import { MobileShell, BottomNav } from "@xtyle/svelte";

	let section = $state("inbox");
	const tabs = [
		{ value: "inbox", label: "Inbox", icon: "folder", badge: 3 },
		{ value: "threads", label: "Threads", icon: "menu" },
		{ value: "you", label: "You", icon: "gear" },
	];
</script>

<MobileShell heading="Inbox">
	{#snippet actions()}<button>Filter</button>{/snippet}

	<p>Whatever the section renders.</p>

	{#snippet nav()}
		<BottomNav {tabs} bind:value={section} label="Sections" />
	{/snippet}
</MobileShell>`;

const astroExample = `---
import MobileShell from "@xtyle/astro/MobileShell.astro";
import BottomNav from "@xtyle/astro/BottomNav.astro";
---

<MobileShell heading="Inbox">
	<Fragment slot="actions">…</Fragment>

	<p>Whatever the section renders.</p>

	<BottomNav
		slot="nav"
		value="inbox"
		label="Sections"
		tabs={[
			{ value: "inbox", label: "Inbox", icon: "folder", badge: 3 },
			{ value: "threads", label: "Threads", icon: "menu" },
			{ value: "you", label: "You", icon: "gear" },
		]}
	/>
</MobileShell>`;

export const mobileShellManifest: ComponentManifest = {
	id: "mobile-shell",
	name: "Mobile Shell",
	since: "0.7.0",
	category: "shell",
	keywords: ["mobile", "phone", "touch", "app bar", "frame", "layout", "shell"],
	seeAlso: ["bottom-nav", "app-shell", "toolbar"],
	summary: "The touch-app frame: a sticky app bar, one scrolling column, and a bottom nav in thumb reach.",
	description:
		"MobileShell is the phone counterpart to `AppShell`, and deliberately a *separate* frame rather than `AppShell` made responsive. `AppShell` is desktop chrome by construction: a three-row grid whose body is a left/main/right split with px-width resizable rails. On a phone that model doesn't degrade so much as stop being the right shape, and bending one frame into both would make each worse. Desktop-IDE chrome and touch-app chrome are different interaction models, not one layout at two widths — so they are two components, and an app picks one at its entry.\n\nThe frame is three regions and nothing else: a sticky app bar (a `heading`, an optional `brand`, and an `actions` slot), a single scrollable `<main>` column, and a `nav` slot for the bottom nav, pinned within thumb reach. The shell renders that chrome itself through its fragment, exactly as `AppShell` does, so a mod can reshape the frame the same way it can reshape any other component.\n\nThe bar and the nav absorb the safe-area insets (`env(safe-area-inset-*)`), so on a notched phone the chrome takes the hardware and the content column between them is never the thing sliding underneath it. The column scrolls itself rather than the page, so the bar and the nav stay put while it moves.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "bar",
			description: "The sticky app bar. Absorbs the top safe-area inset, so nothing sits under a notch.",
			selector: ".xtyle-mshell__bar",
			tokens: ["--bg-1", "--line", "--border-thin", "--space-3", "--space-4"],
		},
		{
			name: "title",
			description: "The bar's heading, truncated rather than wrapped so a long one can't grow the bar.",
			selector: ".xtyle-mshell__title",
			tokens: ["--fg-0", "--text-lg", "--weight-semibold"],
		},
		{
			name: "actions",
			description: "The trailing controls in the bar; the heading is pushed to the start, so actions collect at the end.",
			selector: ".xtyle-mshell__actions",
			tokens: ["--space-2"],
		},
		{
			name: "content",
			description: "The one scrolling column, rendered as a real `<main>`. It scrolls itself, not the page, so the bar and the nav hold their place.",
			selector: ".xtyle-mshell__content",
			tokens: ["--space-4", "--space-6", "--ring", "--border-thick"],
		},
		{
			name: "nav",
			description: "The bottom nav region, usually a `BottomNav`. Its own bar absorbs the bottom safe-area inset.",
			selector: ".xtyle-mshell__nav",
			tokens: [],
		},
	],
	props: [
		{
			name: "heading",
			type: "string",
			description: "The app bar's title. Named `heading` rather than `title`, which `HTMLElement` already owns (the native tooltip), so setting one can never quietly mean the other.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "main-id",
			type: "string",
			default: "main",
			description: "The `id` of the `<main>` column, so a skip link can target it. Override when more than one shell renders on a page.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [],
	sizes: [],
	states: [],
	slots: [
		{
			name: "brand",
			description: "A mark rendered before the heading, e.g. a logo.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "actions",
			description: "The bar's trailing controls.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "default",
			description: "The scrolling content column, rendered into `<main>`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "nav",
			description: "The bottom nav, usually a `BottomNav`.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	consumedTokens: [
		"--body-bg",
		"--bg-1",
		"--fg-0",
		"--line",
		"--font-sans",
		"--text-body",
		"--text-lg",
		"--weight-semibold",
		"--leading-normal",
		"--border-thin",
		"--border-normal",
		"--border-thick",
		"--ring",
		"--space-2",
		"--space-3",
		"--space-4",
		"--space-6",
	],
	composition: [
		"Pair it with `BottomNav` in the `nav` slot; the two go together the way `AppShell` goes with `Toolbar` and `Statusbar`.",
		"Reach for `AppShell` on the desktop and MobileShell on a phone, and choose between them at the app's entry rather than trying to morph one into the other at a breakpoint.",
		"The column scrolls itself, so a long list belongs in the default slot and not in a nested scroller; a second scroll region inside it is the usual cause of a page that scrolls in two places at once.",
	],
	a11y: [
		"The content column is a real `<main>` landmark carrying the `main-id` a skip link targets, and it takes `tabindex=\"-1\"` so focus can be moved into it without making it a tab stop of its own.",
		"The bar and the nav absorb `env(safe-area-inset-*)`, so no control ends up under a notch or a home indicator where a thumb can't reach it.",
		"The chrome is the component's own fragment, so it renders through the same SSR path as every other component: the shell lays out and scrolls before (and without) the runtime.",
	],
	examples: [
		{
			id: "frame",
			title: "The frame",
			description: "A sticky bar, one scrolling column, and a bottom nav. The shell renders the chrome; the slots take the app's content.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
	],
};
