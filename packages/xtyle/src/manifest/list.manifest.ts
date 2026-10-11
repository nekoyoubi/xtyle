import type { ComponentManifest } from "./types.js";
import { FULL_TONES } from "../vocab.js";

const toneVividTokens = FULL_TONES.map((t) => `--${t}-vivid`);
const toneVariantTokens = FULL_TONES.flatMap((t) => [`--${t}`, `--${t}-fg`, `--${t}-bg`, `--${t}-text`]);

const pauseItems = `[
  {"value":"resume","label":"Resume","accelerator":"r"},
  {"value":"break","label":"","separator":true},
  {"value":"retire","label":"Retire","accelerator":"t","variant":"subtle"},
  {"value":"quit","label":"Quit","accelerator":"q","variant":"outline","tone":"danger"},
  {"value":"map","label":"Old map","trail":"250g","trailTone":"danger"}
]`;

const richItems = `[
  {"value":"slot-1","label":"Slot 1","description":"Harbor district, day 12","trail":["3h 40m","Lv 14"],"badge":{"text":"latest","tone":"success"}},
  {"value":"slot-2","label":"Slot 2","description":"Northern pass, day 9","trail":["2h 05m","Lv 9"],"badge":[{"text":"locked","tone":"warn"}]}
]`;

const sectionedItems = `[
  {"value":"play","label":"Play","heading":true},
  {"value":"speed","label":"Text speed","trail":"Fast"},
  {"value":"music","label":"Music","checked":true},
  {"value":"danger","label":"Danger zone","heading":true,"tone":"danger"},
  {"value":"wipe","label":"Erase all data"}
]`;

export const listManifest: ComponentManifest = {
	id: "list",
	name: "List",
	category: "content",
	since: "0.9.0",
	summary: "A navigable, optionally-selectable collection of items — the reference skin over the shared collection substrate.",
	description:
		"The plainest collection: a list of items you move a keyboard cursor across and optionally choose among. It is the reference skin over xtyle's shared collection core (roving navigation + the none/single/multi/range selection model + the item anatomy), the same core the specialized list-like components build on. Reach for it when you want a general list and none of the specialized identities (menu, tree, tabs, combobox).",
	keywords: ["listbox", "options", "select", "multiselect", "collection", "roving", "menu"],
	seeAlso: ["menu", "tree", "combobox", "segmented", "tabs"],
	bindings: ["html", "svelte", "astro"],
	render: "auto",
	exposedParts: ["accelerator", "actions", "badge", "check", "content", "description", "group", "group-items", "heading", "item", "item-action", "label", "lead", "list", "root", "separator", "state", "title", "trail", "trail-1", "trail-2", "trail-3"],
	anatomy: [
		{ name: "root", description: "The host container.", selector: ".xtyle-list-shell" },
		{ name: "list", description: "The list/listbox element holding the items.", selector: ".xtyle-list", tokens: ["--space-1", "--font-sans", "--text-body", "--fg-1"] },
		{ name: "item", description: "One row: lead, content, trail, and (when actionable) actions.", selector: ".xtyle-list__item", tokens: ["--space-2", "--space-3", "--radius-sm", "--state-hover", "--accent-bg", "--fg-0", "--fg-disabled"] },
		{ name: "lead", description: "A leading icon.", selector: ".xtyle-list__lead", tokens: ["--fg-2"] },
		{ name: "label", description: "The item's primary text.", selector: ".xtyle-list__label" },
		{ name: "trail", description: "Trailing text: a shortcut or count. With several fields, the first three are also `trail-1` to `trail-3`, so a consumer can size each column to line up across rows.", selector: ".xtyle-list__trail", tokens: ["--fg-2", "--text-sm"] },
		{ name: "content", description: "The label and its description stacked, present only on an item carrying a description.", selector: ".xtyle-list__content" },
		{ name: "description", description: "A second line under the label, the row's aria-describedby.", selector: ".xtyle-list__description", tokens: ["--fg-2", "--text-sm"] },
		{ name: "badge", description: "A chip beside the label, optionally toned. Announced with the row.", selector: ".xtyle-list__badge", tokens: ["--space-1", "--border-thin", "--radius-sm", "--fg-2", "--text-xs"] },
		{ name: "actions", description: "The per-item action cluster (actionable posture); each button emits a list-action event.", selector: ".xtyle-list__actions" },
		{ name: "group", description: "A section: a heading item and the items after it, up to the next heading, labelled by that heading.", selector: ".xtyle-list__group", tokens: ["--space-1", "--space-2"] },
		{ name: "group-items", description: "A section's rows, after its heading. Give it `display: grid; grid-template-columns: subgrid` alongside `group` to keep a sectioned list's columns aligned across sections.", selector: ".xtyle-list__group-items" },
		{ name: "heading", description: "A section's heading text. Never focused, selected, or activated.", selector: ".xtyle-list__heading", tokens: ["--text-sm", "--weight-semibold", "--fg-2"] },
		{ name: "accelerator", description: "The first letter of the label matching the item's `accelerator`, underlined.", selector: ".xtyle-list__accelerator" },
		{ name: "separator", description: "A break between rows with no text of its own, from an item carrying `separator`.", selector: ".xtyle-list__separator", tokens: ["--border-thin", "--line", "--space-1"] },
		{ name: "check", description: "A toggle row's check mark, drawn for any item carrying `checked`.", selector: ".xtyle-list__check", tokens: ["--fg-2", "--accent"] },
		{ name: "state", description: "A toggle row's state word for assistive technology, visually hidden; a listbox announces through aria-checked instead.", selector: ".xtyle-list__state" },
	],
	props: [
		{ name: "items", type: "string | (string | ListItem)[]", description: "The items, as a comma-string shorthand (label:value pairs or bare labels) or a structured array carrying lead/trail/actions. `description` adds a second line, `badge` a chip beside the label, and `trail` may be a list of fields; `trailTone` inks the trail alone. `variant` (`solid`, `outline`, `subtle`) fills or rings a row in its tone, `accelerator` underlines the key that takes it, and `separator: true` is a break with no text. An item with `checked` is a toggle row that leads with a check mark and announces its state. An item with `heading: true` opens a labelled section; `tone` paints a row, or a heading's whole section, in that tone's on-surface ink. Also accepts a JSON string on the attribute.", bindings: ["html", "svelte", "astro"], aliases: ["options"] },
		{ name: "interaction", type: "\"static\" | \"navigational\" | \"selectable\" | \"actionable\"", default: "navigational", description: "The interaction posture: presentational, keyboard-navigable, selectable, or navigable with per-item actions.", bindings: ["html", "svelte", "astro"], options: ["static", "navigational", "selectable", "actionable"] },
		{ name: "selection", type: "\"none\" | \"single\" | \"multi\" | \"range\"", default: "none", description: "The selection model (only meaningful under interaction=\"selectable\"). Ctrl/Cmd-click toggles, Shift-click extends a range.", bindings: ["html", "svelte", "astro"], options: ["none", "single", "multi", "range"] },
		{ name: "orientation", type: "\"vertical\" | \"horizontal\"", default: "vertical", description: "The list flow and the roving arrow-key axis.", bindings: ["html", "svelte", "astro"], options: ["vertical", "horizontal"] },
		{ name: "size", type: "\"sm\" | \"md\" | \"lg\"", default: "md", description: "The item type scale.", bindings: ["html", "svelte", "astro"], options: ["sm", "md", "lg"] },
		{ name: "label", type: "string", description: "A visible group label; use labelledby or aria-label instead where a visible label would be noise.", bindings: ["html", "svelte", "astro"] },
		{ name: "labelledby", type: "string", description: "The `id` of an element elsewhere on the page that names the list, for a heading the list already sits under.", bindings: ["html", "svelte", "astro"] },
		{ name: "checkedLabel", type: "string", default: "checked", description: "The state word announced after a checked toggle row's label, for a list in another language.", bindings: ["html", "svelte", "astro"] },
		{ name: "uncheckedLabel", type: "string", default: "not checked", description: "The state word announced after an unchecked toggle row's label.", bindings: ["html", "svelte", "astro"] },
	],
	events: [
		{ name: "select", detail: "{ value, index }", description: "An item was activated.", bindings: ["html", "svelte", "astro"] },
		{ name: "change", detail: "{ value, values }", description: "The selection changed.", bindings: ["html", "svelte", "astro"] },
		{ name: "list-action", detail: "{ value, action }", description: "An item's trailing action button was activated.", bindings: ["html", "svelte", "astro"], handler: "onlistaction" },
	],
	variants: [
		{ name: "solid", description: "A row filled with its tone (accent when it names none), set per item through `variant`.", className: "xtyle-list__item--solid", tokens: ["--accent", "--accent-fg"] },
		{ name: "outline", description: "A row ringed and inked in its tone.", className: "xtyle-list__item--outline", tokens: ["--accent-text"] },
		{ name: "subtle", description: "A row on its tone's soft background.", className: "xtyle-list__item--subtle", tokens: ["--accent-bg", "--accent-text"] },
	],
	sizes: [
		{ name: "sm", description: "Compact rows.", className: "xtyle-list--sm" },
		{ name: "md", description: "Default rows.", className: "xtyle-list--md", isDefault: true },
		{ name: "lg", description: "Roomy rows.", className: "xtyle-list--lg" },
	],
	states: [
		{ name: "active", description: "The item under the roving keyboard cursor (focus), distinct from selection.", selector: ".xtyle-list__item:focus-visible", tokens: ["--accent", "--border-normal"] },
		{ name: "selected", description: "A chosen item, marked with an accent fill and, under --selection-cue: marker, a redundant check.", selector: ".xtyle-list__item[aria-selected=\"true\"]", tokens: ["--accent-bg", "--fg-0", "--selection-cue"] },
		{ name: "disabled", description: "A non-interactive item, skipped by roving.", selector: ".xtyle-list__item[aria-disabled=\"true\"]", tokens: ["--fg-disabled"] },
		{ name: "checked", description: "A toggle row that is on: its check mark fills and takes the accent ink.", selector: ".xtyle-list__item[data-checked=\"true\"]", tokens: ["--accent"] },
		{ name: "toned", description: "A row, or every row in a section, painted in a tone's on-surface ink. A disabled row keeps its disabled ink.", selector: ".xtyle-list__item[class*=\"xtyle-list__item--\"]", tokens: toneVividTokens },
	],
	slots: [],
	consumedTokens: [
		"--accent",
		"--accent-bg",
		"--border-normal",
		"--border-thin",
		"--fg-0",
		"--fg-1",
		"--fg-2",
		"--fg-disabled",
		...toneVividTokens,
		...toneVariantTokens,
		"--line",
		"--font-sans",
		"--radius-sm",
		"--selection-cue",
		"--space-1",
		"--space-2",
		"--space-3",
		"--state-hover",
		"--text-body",
		"--text-lg",
		"--text-sm",
		"--text-xs",
		"--weight-medium",
		"--weight-semibold",
	],
	composition: [
		"A badge is the list's own chip rather than a nested `<xtyle-badge>`, so a row stays one fill a mod can reshape, and its tones read the same `--{tone}-vivid` ink as a toned row.",
		"Built on the collection substrate: the roving navigation, selection model, and item anatomy are the same core the menu, tree, tabs, segmented, combobox, command-palette, and pagination components share.",
	],
	a11y: [
		"A selectable list is a role=listbox of role=option items with aria-selected; multi and range add aria-multiselectable. A non-selectable list is role=list of role=listitem.",
		"Roving tabindex: exactly one item is in the tab order; arrow keys move the cursor, Home/End jump to the ends. Focus (the roving cursor) is kept distinct from selection.",
		"Selection is never color-only: under --selection-cue: marker the selected item gains a redundant check.",
		"Provide a label, labelledby, or aria-label so the list is announced.",
		"A heading opens a section labelled by it (role=group inside a listbox, a nested list otherwise), so a screen reader announces the section a row belongs to. The heading itself is never in the tab order or the selection.",
		"A toggle row (an item carrying `checked`) is announced with its state: `aria-checked` on an option, a visually hidden \", checked\" / \", not checked\" after the label on a listitem, which cannot carry aria-checked; `checkedLabel` and `uncheckedLabel` translate those words. The check mark itself is aria-hidden.",
		"An accelerator is carried as aria-keyshortcuts on its row; the underline is decoration. A separator is role=none and aria-hidden, since a list cannot own a separator role, so a break that means something to a listener is a heading instead.",
		"A description is the row's aria-describedby, so it is read after the label rather than as part of the name. A badge is text in the row and is read with it; put status a row must announce there, not in a lead icon.",
	],
	examples: [
		{
			id: "selectable-single",
			title: "Single-select",
			description: "A listbox where one item is chosen at a time.",
			source: {
				html: '<xtyle-list label="Plan" interaction="selectable" selection="single" items="Starter,Pro,Team"></xtyle-list>',
				astro: '<List label="Plan" interaction="selectable" selection="single" items="Starter,Pro,Team" />',
				svelte: '<List label="Plan" interaction="selectable" selection="single" items="Starter,Pro,Team" />',
			},
		},
		{
			id: "selectable-multi",
			title: "Multi-select",
			description: "Ctrl/Cmd-click toggles items; Shift-click (with selection=\"range\") extends a span.",
			source: {
				html: '<xtyle-list label="Toppings" interaction="selectable" selection="multi" items="Cheese,Basil,Chili,Olives"></xtyle-list>',
				astro: '<List label="Toppings" interaction="selectable" selection="multi" items="Cheese,Basil,Chili,Olives" />',
				svelte: '<List label="Toppings" interaction="selectable" selection="multi" items="Cheese,Basil,Chili,Olives" />',
			},
		},
		{
			id: "sections",
			title: "Sections, toggles and tones",
			description: "Headings split one list into labelled sections that the cursor passes over; a `checked` row is a toggle, announced in the words `checkedLabel` and `uncheckedLabel` give it; a toned heading paints its whole section.",
			source: {
				html: `<xtyle-list label="Settings" checked-label="on" unchecked-label="off" items='${sectionedItems}'></xtyle-list>`,
				astro: `<List label="Settings" checkedLabel="on" uncheckedLabel="off" items={${sectionedItems}} />`,
				svelte: `<List label="Settings" checkedLabel="on" uncheckedLabel="off" items={${sectionedItems}} />`,
			},
		},
		{
			id: "variants-and-accelerators",
			title: "Variants, accelerators, separators and trail tones",
			description: "A pause menu with underlined keys, a break before its weighty choices, rows filled or ringed in a tone, and a price inked on its own.",
			source: {
				html: `<xtyle-list label="Paused" items='${pauseItems}'></xtyle-list>`,
				astro: `<List label="Paused" items={${pauseItems}} />`,
				svelte: `<List label="Paused" items={${pauseItems}} />`,
			},
		},
		{
			id: "rich-rows",
			title: "Descriptions, badges and trailing fields",
			description: "A save-slot list: a second line under each label, a toned chip, and two trailing columns sized through `trail-1` and `trail-2` so they line up across rows.",
			source: {
				html: `<xtyle-list label="Saves" interaction="selectable" selection="single" items='${richItems}'></xtyle-list>\n<style>xtyle-list::part(trail-1) { min-width: 4.5rem; } xtyle-list::part(trail-2) { min-width: 3rem; }</style>`,
				astro: `<List label="Saves" interaction="selectable" selection="single" items={${richItems}} />`,
				svelte: `<List label="Saves" interaction="selectable" selection="single" items={${richItems}} />`,
			},
		},
		{
			id: "section-columns",
			title: "Sections in columns",
			description: "A sectioned list laid out two to a row. `list` becomes a grid, and `group` and `group-items` become subgrids, so every section's rows share one set of columns and one cursor.",
			source: {
				html: `<xtyle-list class="columns" label="Settings" items='${sectionedItems}'></xtyle-list>\n<style>\n  .columns::part(list) { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }\n  .columns::part(group), .columns::part(group-items) { grid-column: 1 / -1; display: grid; grid-template-columns: subgrid; }\n  .columns::part(heading) { grid-column: 1 / -1; }\n</style>`,
				astro: `<List class="columns" label="Settings" items={${sectionedItems}} />`,
				svelte: `<List class="columns" label="Settings" items={${sectionedItems}} />`,
			},
		},
	],
};
