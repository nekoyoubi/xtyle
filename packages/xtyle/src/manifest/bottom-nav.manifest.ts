import type { ComponentManifest } from "./types.js";

const htmlExample = `<xtyle-bottom-nav
	value="inbox"
	label="Sections"
	tabs='[{"value":"inbox","label":"Inbox","icon":"folder","badge":3},
	       {"value":"threads","label":"Threads","icon":"menu"},
	       {"value":"you","label":"You","icon":"gear"}]'
></xtyle-bottom-nav>

<script>
	document.querySelector("xtyle-bottom-nav")
		.addEventListener("change", (e) => show(e.target.value));
</script>`;

const svelteExample = `<script lang="ts">
	import { BottomNav } from "@xtyle/svelte";

	let section = $state("inbox");
	const tabs = [
		{ value: "inbox", label: "Inbox", icon: "folder", badge: 3 },
		{ value: "threads", label: "Threads", icon: "menu" },
		{ value: "you", label: "You", icon: "gear" },
	];
</script>

<BottomNav {tabs} bind:value={section} label="Sections" />`;

const astroExample = `---
import BottomNav from "@xtyle/astro/BottomNav.astro";
---

<BottomNav
	value="inbox"
	label="Sections"
	tabs={[
		{ value: "inbox", label: "Inbox", icon: "folder", badge: 3 },
		{ value: "threads", label: "Threads", icon: "menu" },
		{ value: "you", label: "You", icon: "gear" },
	]}
/>`;

export const bottomNavManifest: ComponentManifest = {
	id: "bottom-nav",
	name: "BottomNav",
	since: "0.7.0",
	category: "navigation",
	keywords: ["bottom nav", "tab bar", "mobile", "phone", "touch", "tabs", "sections"],
	seeAlso: ["mobile-shell", "tabs", "segmented"],
	summary: "A thumb-reachable bottom tab bar: a real tablist with roving focus and an accent indicator.",
	description:
		"BottomNav is the tab bar that pairs with `MobileShell` the way `Statusbar` pairs with `AppShell`: the app's top-level sections, sitting where a thumb actually reaches.\n\nIt renders the tablist from its `tabs` through its own fragment, like `Tabs` and `Segmented`, so a mod can reshape a tab the same way it can reshape any other control.\n\nThe runtime adds what markup can't: a *roving tabindex*, so the whole bar is a single tab stop in the page with the arrow keys (plus Home / End) moving between sections inside it, rather than every tab being its own stop to tab past.\n\nEach tab takes an optional icon and a badge. The selected one is marked by an accent bar as well as by color, so which section you're in never rests on hue alone.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "bar",
			description: "The tab bar itself: an equal-column grid, so any number of sections divide the width evenly. Absorbs the bottom safe-area inset so nothing sits under a home indicator.",
			selector: ".xtyle-bottom-nav",
			tokens: ["--bg-1", "--line", "--border-thin"],
		},
		{
			name: "item",
			description: "A tab: an icon over a label, with the whole cell as the touch target rather than just the glyph.",
			selector: ".xtyle-bottom-nav__item",
			tokens: ["--fg-3", "--accent-text", "--text-xs", "--space-8"],
		},
		{
			name: "indicator",
			description: "The accent bar over the selected tab: the non-color cue that says which section is current.",
			selector: ".xtyle-bottom-nav__item[aria-selected=\"true\"]::before",
			tokens: ["--accent", "--border-thick", "--radius-sm"],
		},
		{
			name: "badge",
			description: "The optional count on a tab, for an unread or pending total.",
			selector: ".xtyle-bottom-nav__badge",
			tokens: ["--accent", "--accent-fg", "--radius-full"],
		},
	],
	props: [
		{
			name: "value",
			type: "string",
			description: "The selected tab's `data-value`. Reflected, and updated on select; listen for `change` to read it back.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "label",
			type: "string",
			default: "Sections",
			description: "The accessible name of the tablist, e.g. \"Sections\".",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "tabs",
			type: "BottomNavTab[]",
			description: "The tabs, in the bindings: `{ value, label, icon?, badge? }`. Pass an array from the bindings, or JSON on the attribute for a static page.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [],
	sizes: [],
	states: [
		{
			name: "selected",
			description: "The current section: accent-colored, and marked by the accent bar above it.",
			selector: ".xtyle-bottom-nav__item[aria-selected=\"true\"]",
		},
	],
	slots: [],
	consumedTokens: [
		"--bg-1",
		"--line",
		"--fg-3",
		"--accent",
		"--accent-fg",
		"--accent-text",
		"--ring",
		"--radius-sm",
		"--radius-full",
		"--border-thin",
		"--border-thick",
		"--text-xs",
		"--weight-medium",
		"--weight-semibold",
		"--space-1",
		"--space-2",
		"--space-4",
		"--space-6",
		"--space-8",
		"--duration-fast",
		"--ease-standard",
	],
	composition: [
		"Drop it in a `MobileShell`'s `nav` slot; the two are designed as a pair.",
		"Keep it to three to five sections. A bottom bar is a thumb surface, not a menu, and past five the targets get too narrow to hit.",
		"It carries top-level sections, not actions. A destructive or one-off action belongs in the app bar or a sheet, where an accidental thumb-brush can't fire it.",
	],
	a11y: [
		"It is a real `role=\"tablist\"` of `role=\"tab\"` buttons carrying `aria-selected`, so a screen reader announces the section count and which one is current.",
		"A roving tabindex makes the whole bar one tab stop: the arrow keys (and Home / End) move between sections, so a keyboard user doesn't have to tab past every tab to leave the bar.",
		"The selected tab is marked by an accent bar as well as by color, so the current section reads for a color-deficient user (WCAG 1.4.1).",
		"The tabs are real `<button>`s carrying `role=\"tab\"`, rendered through the same SSR path as every other component, so the bar paints and every label is reachable before the runtime hydrates it; the runtime adds the roving tabindex and the key handling.",
		"The bar absorbs the bottom safe-area inset, so no tab sits under a home indicator where it can't be tapped.",
	],
	examples: [
		{
			id: "sections",
			title: "Sections",
			description: "A tab bar over the app's top-level sections. Arrow keys move between them; `change` reports the new `value`.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
	],
};
