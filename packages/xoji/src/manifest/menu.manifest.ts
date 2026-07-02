import type { ComponentManifest } from "./types.js";

const htmlExample = `<xoji-menu label="File"></xoji-menu>

<script>
	const menu = document.querySelector("xoji-menu");
	menu.items = [
		{ heading: "File" },
		{ label: "New", value: "new", hint: "Ctrl+N" },
		{ label: "Open…", value: "open", hint: "Ctrl+O" },
		{ label: "Save", value: "save", hint: "Ctrl+S" },
		{ label: "Save As…", value: "save-as", disabled: true },
		{ heading: "Help" },
		{ label: "Shortcuts", value: "shortcuts", hint: "?" },
		{ separator: true },
		{ label: "Close", value: "close", intent: "danger" },
	];
	menu.addEventListener("select", (e) => console.log(e.detail));
</script>`;

const svelteExample = `<script lang="ts">
	import { Menu } from "@xoji/svelte";

	const items = [
		{ heading: "File" },
		{ label: "New", value: "new", hint: "Ctrl+N" },
		{ label: "Open…", value: "open", hint: "Ctrl+O" },
		{ label: "Save", value: "save", hint: "Ctrl+S" },
		{ label: "Save As…", value: "save-as", disabled: true },
		{ heading: "Help" },
		{ label: "Shortcuts", value: "shortcuts", hint: "?" },
		{ separator: true },
		{ label: "Close", value: "close", intent: "danger" },
	];
</script>

<Menu label="File" {items} onselect={(e) => console.log(e.detail)} />`;

const astroExample = `---
import { Menu } from "@xoji/astro";

const items = [
	{ heading: "File" },
	{ label: "New", value: "new", hint: "Ctrl+N" },
	{ label: "Open…", value: "open", hint: "Ctrl+O" },
	{ label: "Save", value: "save", hint: "Ctrl+S" },
	{ label: "Save As…", value: "save-as", disabled: true },
	{ heading: "Help" },
	{ label: "Shortcuts", value: "shortcuts", hint: "?" },
	{ separator: true },
	{ label: "Close", value: "close", intent: "danger" },
];
---

<Menu label="File" items={items} />`;

export const menuManifest: ComponentManifest = {
	id: "menu",
	name: "Menu",
	category: "overlay",
	summary: "A menu button: a trigger that opens an anchored popup list of actions.",
	description:
		"Menu is the app-menu shape: a labeled trigger (a File button, a kebab, a profile name) that opens a floating list of actions under it. It builds the WAI-ARIA menu button pattern: the trigger carries `aria-haspopup=\"menu\"` and `aria-expanded`, and the popup is a `role=\"menu\"` of `role=\"menuitem\"` actions with a single roving focus, so the keyboard walks it like a native menu. Like Tree, it is data-driven: an `items` array drives the markup. An action carries a `label` plus optional `value`, `disabled`, and a `hint` (a trailing muted/mono accelerator like `Ctrl+S`); a `{ separator: true }` entry renders a `role=\"separator\"` divider; and a `{ heading: string }` entry opens a labeled `role=\"group\"` the following actions sit under, so a real app menu can group its commands under \"File\" and \"Help\" headers. The popup uses the native Popover API, so it renders in the top layer and escapes any clipping or stacking context an ancestor would otherwise impose, positioned under the trigger (and flipped up when there is no room below). Choosing an action fires a `select` event with the item's `value`, `label`, and `index` and closes the menu; the engine never navigates, the consumer decides what an action does. Its chrome (the overlay surface, the elevation, the accent-tinted active row) is derived, so a menu frames its actions in the theme's own voice.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "menu",
			description: "The wrapper holding the trigger and its popover.",
			selector: ".xoji-menu",
		},
		{
			name: "trigger",
			description:
				"The menu button: carries `aria-haspopup`, `aria-expanded`, and the `popovertarget` that opens the popup.",
			selector: ".xoji-menu__trigger",
			tokens: [
				"--space-1",
				"--space-3",
				"--font-sans",
				"--text-sm",
				"--fg-1",
				"--fg-0",
				"--bg-1",
				"--border-thin",
				"--line",
				"--radius-md",
				"--state-hover",
				"--state-selected",
				"--ring",
				"--border-normal",
				"--border-thick",
				"--duration-fast",
				"--ease-standard",
			],
		},
		{
			name: "popup",
			description:
				"The `role=\"menu\"` floating surface, rendered in the top layer via the Popover API so it escapes ancestor clipping.",
			selector: ".xoji-menu__popup",
			tokens: [
				"--space-1",
				"--font-sans",
				"--text-sm",
				"--surface-overlay",
				"--surface-overlay-border",
				"--border-thin",
				"--radius-md",
				"--elevation-3",
			],
		},
		{
			name: "item",
			description: "An action: a `role=\"menuitem\"` button. Takes the accent tint on hover/focus.",
			selector: ".xoji-menu__item",
			tokens: [
				"--space-1",
				"--space-3",
				"--fg-1",
				"--fg-disabled",
				"--accent-bg",
				"--accent-text",
				"--radius-sm",
				"--duration-fast",
				"--ease-standard",
			],
		},
		{
			name: "item-hint",
			description: "A row's trailing accelerator hint (e.g. `Ctrl+S`): a muted, monospaced span at the end of the action, exposed so a consumer can restyle the keycap text.",
			selector: ".xoji-menu__item-hint",
			tokens: ["--font-mono", "--text-xs"],
		},
		{
			name: "heading",
			description: "A group label for a `heading` item: the muted, uppercase title a labeled section of actions sits under.",
			selector: ".xoji-menu__heading",
			tokens: ["--space-1", "--space-3", "--text-xs", "--fg-2"],
		},
		{
			name: "separator",
			description: "A `role=\"separator\"` divider rendered for a `separator` item.",
			selector: ".xoji-menu__separator",
			tokens: ["--border-thin", "--line", "--space-1", "--space-2"],
		},
	],
	props: [
		{
			name: "items",
			type: "MenuItem[]",
			description:
				"The action list. An action is `{ label, value?, disabled?, hint?, intent? }`, where `hint` is a trailing muted/mono accelerator like `Ctrl+S` and `intent: \"danger\"` tints a destructive row (a delete / discard / close). A `{ separator: true }` entry renders a divider, and a `{ heading: string }` entry opens a labeled group the following actions sit under (a `role=\"group\"` named by the heading). Passed as a property in the bindings (serialized to JSON for the element).",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "label",
			type: "string",
			description: "The trigger text, also the popup's accessible name (e.g. \"File\").",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "open",
			type: "boolean",
			default: "false",
			description: "Reflects (and controls) whether the menu is open.",
			bindings: ["html", "svelte"],
		},
	],
	variants: [],
	sizes: [],
	states: [
		{
			name: "expanded",
			description: "The trigger while its menu is open. Takes the selected tint.",
			selector: '.xoji-menu__trigger[aria-expanded="true"]',
			tokens: ["--state-selected", "--fg-0"],
		},
		{
			name: "item-active",
			description: "The hovered or keyboard-focused action: the accent-tinted row.",
			selector: ".xoji-menu__item:hover, .xoji-menu__item:focus-visible",
			tokens: ["--accent-bg", "--accent-text"],
		},
		{
			name: "item-danger",
			description: "A destructive action (`intent: \"danger\"`): the row reads in the danger ink, and its hover/focus takes the danger tint instead of the accent one, so the one irreversible item stands apart.",
			selector: '.xoji-menu__item[data-intent="danger"]',
			tokens: ["--danger-text", "--danger-bg"],
		},
		{
			name: "item-disabled",
			description: "A locked action: muted and non-interactive, skipped by arrow navigation.",
			selector: '.xoji-menu__item[aria-disabled="true"]',
			tokens: ["--fg-disabled"],
		},
	],
	slots: [],
	consumedTokens: [
		"--space-1",
		"--space-2",
		"--space-3",
		"--font-sans",
		"--font-mono",
		"--text-sm",
		"--text-xs",
		"--leading-normal",
		"--fg-0",
		"--fg-1",
		"--fg-2",
		"--fg-disabled",
		"--bg-1",
		"--surface-overlay",
		"--surface-overlay-border",
		"--accent-bg",
		"--accent-text",
		"--danger-bg",
		"--danger-text",
		"--line",
		"--state-hover",
		"--state-selected",
		"--ring",
		"--border-thin",
		"--border-normal",
		"--border-thick",
		"--radius-sm",
		"--radius-md",
		"--elevation-3",
		"--duration-fast",
		"--ease-standard",
	],
	composition: [
		"Drop one in a Toolbar to build a classic app menu bar: a File, Edit, View row of menu buttons.",
		"Use a kebab or gear `label` for a row-level or panel-level actions menu.",
		"Listen for `select` and switch on `detail.value` to run the chosen action; the menu closes itself.",
	],
	a11y: [
		"Builds the WAI-ARIA menu button pattern: the trigger carries `aria-haspopup=\"menu\"`, `aria-expanded`, and `aria-controls`; the popup is a `role=\"menu\"` of `role=\"menuitem\"` actions named by the trigger label.",
		"From the trigger, Enter / Space / Down open the menu and focus the first action; Up opens and focuses the last.",
		"In the menu, Up/Down move between enabled actions (wrapping), Home/End jump to the first/last, Enter/Space activates the focused action, Tab closes the menu, and Escape closes it and returns focus to the trigger.",
		"Disabled actions carry `aria-disabled` and are skipped by arrow navigation and not activatable.",
		"A `heading` item opens a `role=\"group\"` named by the heading text, so assistive tech announces which section an action belongs to; the visible heading is `aria-hidden` to avoid a double read, and headings are not focus targets, so arrow navigation walks only the actions.",
		"A `hint` (the accelerator keycap) is `aria-hidden`, so it shows visually without padding the action's accessible name; the name stays the bare label.",
		"A single roving focus keeps the menu a coherent keyboard surface. Clicking outside closes it (the Popover API's light-dismiss); clicking an action activates it.",
	],
	examples: [
		{
			id: "file-menu",
			title: "A File menu",
			description: "A menu button opening a list with a disabled action and separators between groups.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
	],
};
