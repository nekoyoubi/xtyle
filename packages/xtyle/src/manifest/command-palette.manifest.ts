import type { ComponentManifest } from "./types.js";

const htmlExample = `<xtyle-command-palette id="palette" hotkey="mod+k" label="Command palette"></xtyle-command-palette>

<script>
	const palette = document.querySelector("#palette");

	// hand it the WHOLE command list — the palette does the filtering
	palette.items = [
		{ id: "file.new", label: "New file", group: "File", shortcut: "Ctrl+N" },
		{ id: "file.open", label: "Open file…", group: "File", shortcut: "Ctrl+O", keywords: ["browse"] },
		{ id: "file.save", label: "Save", group: "File", shortcut: "Ctrl+S" },
		{ id: "view.theme", label: "Toggle theme", group: "View", hint: "light / dark" },
		{ id: "view.zen", label: "Zen mode", group: "View", disabled: true },
	];

	palette.addEventListener("select", (event) => {
		const { id, item } = event.detail;
		console.log("run", id, item.label);
	});

	// or open it yourself, from a button
	document.querySelector("#launch").addEventListener("click", () => palette.show());
<\/script>`;

const svelteExample = `<script lang="ts">
	import { CommandPalette, Button, type CommandItem } from "@xtyle/svelte";

	let open = $state(false);

	const commands: CommandItem[] = [
		{ id: "file.new", label: "New file", group: "File", shortcut: "Ctrl+N" },
		{ id: "file.open", label: "Open file…", group: "File", shortcut: "Ctrl+O", keywords: ["browse"] },
		{ id: "view.theme", label: "Toggle theme", group: "View", hint: "light / dark" },
	];
</script>

<Button onclick={() => (open = true)}>Commands</Button>

<CommandPalette
	bind:open
	items={commands}
	hotkey="mod+k"
	storageKey="demo.palette.recent"
	onselect={(event) => console.log("run", event.detail.id)}
/>`;

const astroExample = `---
import CommandPalette from "@xtyle/astro/CommandPalette.astro";

const commands = [
	{ id: "file.new", label: "New file", group: "File", shortcut: "Ctrl+N" },
	{ id: "file.open", label: "Open file…", group: "File", shortcut: "Ctrl+O" },
	{ id: "view.theme", label: "Toggle theme", group: "View", hint: "light / dark" },
];
---

<CommandPalette id="palette" items={commands} hotkey="mod+k" />

<script>
	document.querySelector("#palette").addEventListener("select", (event) => {
		console.log("run", event.detail.id);
	});
<\/script>`;

const scorerHtmlExample = `<xtyle-command-palette id="ranked"></xtyle-command-palette>

<script>
	const palette = document.querySelector("#ranked");
	palette.items = commands;

	// the override hook: return null to drop an item, or { score, indices } to keep it.
	// higher scores rank earlier; \`indices\` are the label characters to highlight.
	palette.scorer = (query, item) => {
		if (query === "") return { score: item.pinned ? 100 : 0 };
		const at = item.label.toLowerCase().indexOf(query.toLowerCase());
		if (at === -1) return null;
		return {
			score: 100 - at,
			indices: Array.from({ length: query.length }, (_, i) => at + i),
		};
	};
<\/script>`;

const scorerSvelteExample = `<script lang="ts">
	import { CommandPalette, type CommandScorer } from "@xtyle/svelte";
	import { rank } from "./my-fuzzy-lib";

	// bring your own ranking: a real fuzzy library, a usage-weighted model, anything
	const scorer: CommandScorer = (query, item) => {
		const hit = rank(query, item.label);
		return hit ? { score: hit.score, indices: hit.positions } : null;
	};
</script>

<CommandPalette {items} {scorer} hotkey="mod+k" />`;

const scorerAstroExample = `---
import CommandPalette from "@xtyle/astro/CommandPalette.astro";
---

<CommandPalette id="ranked" items={commands} />

<script>
	import { rank } from "../lib/my-fuzzy-lib";

	// the palette always filters — it just doesn't insist on filtering *its* way
	document.querySelector("#ranked").scorer = (query, item) => {
		const hit = rank(query, item.label);
		return hit ? { score: hit.score, indices: hit.positions } : null;
	};
<\/script>`;

const lineHtmlExample = `<xtyle-command-palette id="line" complete-first label="Command line"></xtyle-command-palette>

<script type="module">
	import "@xtyle/core/elements";

	const palette = document.querySelector("#line");
	palette.items = [
		{ id: "rect", label: "rect <x,y> <w,h> [color]", hint: "draw a rectangle" },
		{ id: "goto", label: "goto <line>", hint: "jump to a line" },
		{ id: "clear", label: "clear", hint: "wipe the layer" },
	];

	// recents are whole lines, so history keeps the rectangle and not just "rect"
	let history = ["rect 10,10 40,40 azul", "goto 214"];
	palette.recent = history;

	palette.addEventListener("select", (event) => {
		const { id, query } = event.detail;
		const line = query.trim().split(/\\s+/)[0] === id ? query.trim() : id;
		run(line);
		if (line !== id) palette.recent = history = [line, ...history.filter((seen) => seen !== line)].slice(0, 8);
	});
<\/script>`;

const lineSvelteExample = `<script lang="ts">
	import { CommandPalette } from "@xtyle/svelte";

	const items = [
		{ id: "rect", label: "rect <x,y> <w,h> [color]", hint: "draw a rectangle" },
		{ id: "goto", label: "goto <line>", hint: "jump to a line" },
		{ id: "clear", label: "clear", hint: "wipe the layer" },
	];

	let history = $state(["rect 10,10 40,40 azul", "goto 214"]);

	function onselect(event: CustomEvent) {
		const { id, query } = event.detail;
		const line = query.trim().split(/\\s+/)[0] === id ? query.trim() : id;
		run(line);
		if (line !== id) history = [line, ...history.filter((seen) => seen !== line)].slice(0, 8);
	}
<\/script>

<!-- Enter on a half-typed name completes it; Enter on a finished name runs the line -->
<CommandPalette {items} completeFirst recent={history} {onselect} />`;

const lineAstroExample = `---
import CommandPalette from "@xtyle/astro/CommandPalette.astro";

const items = [
	{ id: "rect", label: "rect <x,y> <w,h> [color]", hint: "draw a rectangle" },
	{ id: "goto", label: "goto <line>", hint: "jump to a line" },
	{ id: "clear", label: "clear", hint: "wipe the layer" },
];
---

<CommandPalette id="line" {items} completeFirst label="Command line" />

<script>
	const palette = document.querySelector("#line");
	palette.recent = ["rect 10,10 40,40 azul", "goto 214"];
<\/script>`;

export const commandPaletteManifest: ComponentManifest = {
	id: "command-palette",
	name: "Command Palette",
	category: "overlay",
	since: "0.8.0",
	keywords: ["command bar", "ctrl-k", "cmd-k", "quick open", "launcher", "fuzzy search", "action search", "spotlight"],
	seeAlso: ["dialog", "menu", "kbd", "popover"],
	summary: "A modal, filterable, keyboard-first index of everything an app can do.",
	description:
		"CommandPalette is the surface behind Ctrl-K. It takes the whole list of things an app can do, filters it as the user types, groups what survives, spells out each command's own shortcut in keycaps, and runs the one they land on.\n\nIt filters *itself*. A palette handed a pre-filtered list is just a list, so the component ships a working ranker: a subsequence matcher, which is why `of` finds \"Open File\" and `gcm` finds \"Git: Commit Message\". It scores runs, word starts, and camelCase humps, docks late and long matches, and falls back to an item's `group`, `hint`, and `keywords` so a command surfaces on a synonym it never displays. The matched characters come back marked in the label. Nothing about that is load-bearing: assign a `scorer` and the palette ranks with yours instead — a real fuzzy library, a usage-weighted model, a server-side search — and renders whatever you return, in the order you score it. That is the whole extension point, and it is one function.\n\nThe surface is a native `<dialog>`, so the scrim, the focus trap, and Escape are the platform's rather than a re-derived imitation. Focus stays in the input the entire time: the list is a `listbox` under *virtual* focus (`aria-activedescendant`), so ↑/↓ walk the commands while the caret keeps typing. Enter runs the active command, Escape dismisses, and focus goes back to whatever had it when the palette opened — a button, a menu item, a text caret mid-document. Home and End are deliberately left alone; they belong to the caret in an editable combobox, and stealing them is the classic palette bug.\n\nRecently-run commands lift to the top of the unfiltered list under their own heading — free, and the affordance every real palette grows within a week. Point `storage-key` at a `localStorage` key and they survive the reload. Give it a `hotkey` (`mod+k`, ⌘ on Apple and Ctrl elsewhere) and it binds itself to the document; the docs site you are reading uses exactly that.",
	bindings: ["html", "svelte", "astro"],
	exposedParts: ["dialog", "empty", "footer", "glyph", "group", "heading", "hint", "input", "key", "keys", "label", "legend", "list", "match", "option", "palette", "results", "search"],
	anatomy: [
		{
			name: "palette",
			description: "The host wrapper. `display: contents` — the palette puts nothing in flow until it opens.",
			selector: ".xtyle-command-palette",
		},
		{
			name: "dialog",
			description:
				"The modal surface: a native `<dialog>` in the top layer, so the scrim, the focus trap, and Escape come from the platform. Sits high in the viewport, where a palette belongs.",
			selector: ".xtyle-command-palette__dialog",
			tokens: [
				"--surface-overlay",
				"--surface-overlay-border",
				"--border-thin",
				"--radius-lg",
				"--elevation-5",
				"--scrim",
				"--font-sans",
				"--text-body",
				"--leading-normal",
				"--fg-0",
				"--space-6",
				"--space-8",
			],
		},
		{
			name: "search",
			description: "The filter row: the search glyph and the combobox input that owns focus the whole time.",
			selector: ".xtyle-command-palette__search",
			tokens: ["--space-3", "--space-4", "--line", "--border-thin", "--fg-2", "--fg-3"],
		},
		{
			name: "list",
			description: "The `listbox` of surviving commands, under virtual focus. Scrolls on its own; the input never moves.",
			selector: ".xtyle-command-palette__list",
			tokens: ["--space-2"],
		},
		{
			name: "heading",
			description: "A group's heading — a command's `group`, or the recents label over the commands last run.",
			selector: ".xtyle-command-palette__heading",
			tokens: ["--text-xs", "--weight-semibold", "--fg-2", "--space-1", "--space-3"],
		},
		{
			name: "option",
			description:
				"One command: its label (with the matched characters marked), its hint, and its shortcut. The active row is marked `data-active`, not focused — the caret stays in the input.",
			selector: ".xtyle-command-palette__option",
			tokens: [
				"--fg-1",
				"--accent-bg",
				"--fg-0",
				"--fg-disabled",
				"--radius-sm",
				"--space-2",
				"--space-3",
				"--duration-fast",
				"--ease-standard",
			],
		},
		{
			name: "match",
			description: "The characters the query matched, marked inside the label — a real `<mark>`, so a mod can restyle or drop it.",
			selector: ".xtyle-command-palette__match",
			tokens: ["--accent", "--weight-semibold"],
		},
		{
			name: "keys",
			description: "A command's own shortcut, spelled out as Kbd keycaps: `Ctrl+Shift+P` becomes three caps.",
			selector: ".xtyle-command-palette__keys",
			tokens: ["--space-1"],
		},
		{
			name: "empty",
			description: "What stands where the list would be when nothing matches.",
			selector: ".xtyle-command-palette__empty",
			tokens: ["--text-sm", "--fg-2", "--space-4", "--space-6"],
		},
		{
			name: "footer",
			description: "The keyboard legend along the bottom edge — ↑↓ to navigate, ↵ to run, Esc to dismiss.",
			selector: ".xtyle-command-palette__footer",
			tokens: ["--text-xs", "--fg-2", "--line", "--border-thin", "--space-2", "--space-4"],
		},
	],
	props: [
		{
			name: "items",
			type: "CommandItem[]",
			description:
				"Every command the palette can run, unfiltered — `{ id, label, group?, hint?, shortcut?, keywords?, disabled? }`. Set it as a property, or as a JSON string on the attribute.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "open",
			type: "boolean",
			default: "false",
			description: "Reflects (and controls) whether the palette is open. Every open starts with a fresh query.",
			bindings: ["html", "svelte"],
		},
		{
			name: "scorer",
			type: "CommandScorer",
			description:
				"The ranking override: `(query, item) => CommandMatch | null`. Return `null` to drop an item, or `{ score, indices? }` to keep it — higher scores rank earlier, and `indices` are the label characters to highlight. Defaults to the built-in subsequence matcher. Property only; it is a function.",
			bindings: ["html", "svelte"],
			propertyOnly: true,
		},
		{
			name: "query",
			type: "string",
			default: '""',
			description: "The live filter text. Setting it re-filters and re-ranks, exactly as typing does.",
			bindings: ["html", "svelte"],
			propertyOnly: true,
		},
		{
			name: "hotkey",
			type: "string",
			description:
				"A document-wide chord that opens the palette: `mod+k`, `ctrl+shift+p`. `mod` is ⌘ on Apple and Ctrl everywhere else. Omit it and the palette only opens through `show()` / `open`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "label",
			type: "string",
			default: '"Command palette"',
			description: "The accessible name, carried by the dialog, the input, and the listbox.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "placeholder",
			type: "string",
			default: '"Type a command or search…"',
			description: "The filter input's placeholder.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "emptyText",
			type: "string",
			default: '"No matching commands"',
			description: "What stands in for the list when the query matches nothing.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "recent",
			type: "string[]",
			description:
				"What was run recently, most recent first. Read it to persist them yourself; assign it to seed them from your own store. An entry naming a command in `items` renders that command; one that names nothing renders as itself, so a palette whose query carries arguments can remember whole lines — `rect 10,10 40,40 azul` rather than the fact that you once ran `rect`. Selecting a line reports it as the `select` event's `id`.",
			bindings: ["html", "svelte"],
			propertyOnly: true,
		},
		{
			name: "recentLabel",
			type: "string",
			default: '"Recent"',
			description: "The heading over the recents group.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "recentLimit",
			type: "number",
			default: "5",
			description: "How many recently-run commands lead the unfiltered list. `0` shows none.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "noRecent",
			type: "boolean",
			default: "false",
			description: "Don't track or surface recently-run commands at all.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "storageKey",
			type: "string",
			description:
				"A `localStorage` key to persist recents under, so they survive a reload. Omit and recents live only as long as the page does.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "noFooter",
			type: "boolean",
			default: "false",
			description: "Drop the keyboard legend along the bottom edge.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "noCloseOnSelect",
			type: "boolean",
			default: "false",
			description:
				"Keep the palette open after a command runs — for a surface whose commands toggle state rather than navigate away.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "completeFirst",
			type: "boolean",
			default: "false",
			description:
				"Make Enter commit a command's name before it runs anything. Landing on a command the query's first word does not already name — half-typed, fuzzy-matched, or arrowed to — fills the name in and waits, so a second Enter runs it; `cl` cannot wipe a layer on one keystroke. Once the first word names the command, Enter runs it, arguments and all. Leave it off for an index of complete commands, where one Enter should run what you landed on; turn it on for a palette whose query carries a command's arguments. While it is on, a query whose first word is a command's id matches that command and leads the list, so a completed name never filters itself out.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "show()",
			type: "() => void",
			description: "Method: open the palette, remembering what had focus so closing can hand it back.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "close(reason?)",
			type: '(reason?: "escape" | "dismiss" | "select" | "api") => void',
			description: "Method: close the palette and return focus. The reason rides out on the `close` event.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "toggle()",
			type: "() => void",
			description: "Method: open if closed, close if open — what the hotkey does.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "run(id)",
			type: "(id: string) => void",
			description: "Method: run a command by id, exactly as selecting it would — the `select` event, the recents bump, the close.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "spellcheck",
			type: '"true" | "false"',
			description:
				"Forwarded to the search box, and defaulted to `\"false\"` because a spell-checker underlining command names helps nobody. Enumerated rather than boolean, so overriding needs an explicit value — a bare `spellcheck` is the HTML spelling of *on*.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "inputmode",
			type: '"text" | "numeric" | "decimal" | "tel" | "email" | "url" | "search" | "none"',
			description:
				"Forwarded to the inner control: which on-screen keyboard a touch device should raise. Purely a hint — it does not validate or restrict what can be typed.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "autocomplete",
			type: "string",
			description:
				"Forwarded to the search box, and defaulted to `off` — an autofill dropdown over the results list is never what you wanted.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "autocapitalize",
			type: '"off" | "none" | "on" | "sentences" | "words" | "characters"',
			description: "Forwarded to the inner control: whether a touch keyboard capitalizes as you type.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "autocorrect",
			type: '"on" | "off"',
			description:
				"Forwarded to the inner control: the browser's own autocorrect. Non-standard but widely honored, and worth turning off wherever `spellcheck` is.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "enterkeyhint",
			type: '"enter" | "done" | "go" | "next" | "previous" | "search" | "send"',
			description: "Forwarded to the search box, and defaulted to `go`, since Enter runs the highlighted command rather than inserting a newline.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	events: [
		{ name: "open", description: "The palette opened. The query is always empty at this point.", bindings: ["html", "svelte", "astro"] },
		{ name: "close", detail: "{ reason: \"escape\" | \"dismiss\" | \"select\" | \"api\" }", description: "The palette closed, however it closed.", bindings: ["html", "svelte", "astro"] },
		{ name: "query", detail: "{ query }", description: "The filter text changed. What a palette whose commands take arguments watches.", bindings: ["html", "svelte", "astro"] },
		{ name: "select", detail: "{ id, label, item, index, query }", description: "A command was run.", bindings: ["html", "svelte", "astro"] },
	],
	methods: [
		{
			name: "show",
			description: "Open the palette, remembering what had focus so closing can hand it back.",
			bindings: ["html", "svelte"],
		},
		{
			name: "close",
			params: "reason?: \"escape\" | \"dismiss\" | \"select\" | \"api\"",
			description: "Close the palette and return focus to wherever it came from. The reason rides along on the `close` event.",
			bindings: ["html", "svelte"],
		},
		{ name: "toggle", description: "Open if closed, close if open — what the hotkey does.", bindings: ["html", "svelte"] },
		{
			name: "run",
			params: "id: string",
			description:
				"Run a command by id, exactly as selecting it would: the `select` event, the recents bump, the close. Does nothing for an id that is missing or disabled.",
			bindings: ["html", "svelte"],
		},
	],
	variants: [],
	sizes: [],
	states: [
		{
			name: "active",
			description:
				"The command under virtual focus — what Enter runs. Marked `data-active` and `aria-selected`; it is never DOM-focused, because the caret must stay in the input.",
			selector: '.xtyle-command-palette__option[data-active="true"]',
			tokens: ["--accent-bg", "--fg-0"],
		},
		{
			name: "disabled",
			description: "A command listed but not runnable: still filterable, never active, never selected.",
			selector: '.xtyle-command-palette__option[aria-disabled="true"]',
			tokens: ["--fg-disabled"],
		},
		{
			name: "empty",
			description: "Nothing matched: the list is gone and the empty text stands in its place.",
			selector: ".xtyle-command-palette__empty",
			tokens: ["--fg-2", "--text-sm"],
		},
	],
	slots: [],
	consumedTokens: [
		"--accent",
		"--accent-bg",
		"--border-thin",
		"--duration-fast",
		"--ease-standard",
		"--elevation-5",
		"--fg-0",
		"--fg-1",
		"--fg-2",
		"--fg-3",
		"--fg-disabled",
		"--font-sans",
		"--leading-normal",
		"--line",
		"--radius-lg",
		"--radius-sm",
		"--scrim",
		"--space-1",
		"--space-2",
		"--space-3",
		"--space-4",
		"--space-6",
		"--space-8",
		"--surface-overlay",
		"--surface-overlay-border",
		"--text-body",
		"--text-sm",
		"--text-xs",
		"--weight-semibold",
	],
	composition: [
		"While open, the host relocates to `document.body` — a modal `<dialog>` anchors to the nearest ancestor that establishes a containing block, so one declared inside a transformed or filtered panel would center on that panel rather than the viewport. The consequence is that it stops being a descendant of whatever declared it, precisely while it is visible: a `bind:this` container query and a framework-scoped selector both go dead on open and come back on close. Reach it by `id` (`document.getElementById`, `:global(#that-id)`), which survives the move.",
		"An inherited property an app sets document-wide (`cursor`, `font-family`) reaches this component's internals only through its light-DOM host, so set it on the host rather than on the rendered `dialog`. A document-level rule cannot cross the shadow boundary, which is why an app that hides the OS cursor gets a cursorless overlay until the declaration moves onto the element itself.",
		"Give every command in your app an entry and bind `hotkey=\"mod+k\"`. That is the whole integration: one element, one list, one `select` handler.",
		"`group` is what the headings are made of. Group by surface (File, View, Git), not by rarity — the filter already handles rarity.",
		"Put the command's real shortcut in `shortcut` and the palette spells it in `Kbd` keycaps, so the palette teaches the shortcut that makes it unnecessary.",
		"`keywords` is where synonyms go: an old name, the word a newcomer would type, the thing a competitor calls it. They match but never render.",
		"Reach for `scorer` the moment your ranking is a product decision — usage-weighted, recency-weighted, server-side. The palette's own matcher is a good default, not a policy.",
		"Menu is for the commands that belong to *one thing* on screen. CommandPalette is for the commands that belong to the *app*.",
	],
	a11y: [
		"The surface is a native `<dialog>` opened with `showModal()`, so the scrim, the focus trap, the top layer, and Escape are the platform's — not an imitation of them.",
		"The input is a `combobox` (`aria-autocomplete=\"list\"`, `aria-controls`, `aria-expanded`) and the results are a `listbox` of `option`s grouped by `group`. Focus never leaves the input: the active command is tracked with `aria-activedescendant`, which is what lets ↑/↓ walk the list while the caret keeps typing.",
		"Full keyboard operation: type to filter, ↑/↓ to move (wrapping at the ends), PageUp/PageDown to jump, Enter to run, Escape to dismiss. Home and End are left to the caret, where an editable combobox owes them.",
		"Closing hands focus back to whatever had it when the palette opened, however it closed — Enter, Escape, a click on the scrim, or `close()`.",
		"A command's shortcut is announced through `aria-keyshortcuts` on its option, not left as decorative keycaps.",
		"A `disabled` command carries `aria-disabled` and is skipped by the keyboard entirely — it can be read, but never landed on or run.",
		"The active row is *marked*, never focused, so the browser's own focus ring can't fight the virtual cursor. The search glyph is `aria-hidden`: it is decoration.",
	],
	examples: [
		{
			id: "command-palette",
			title: "The whole list, filtered",
			description:
				"Hand it every command, bind a hotkey, and listen for `select`. The palette does the filtering, the grouping, the keycaps, and the keyboard.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
		{
			id: "custom-scorer",
			title: "Your ranking, not ours",
			description:
				"The override hook: one function. Return `null` to drop an item, `{ score, indices }` to keep it. The palette renders whatever you return, in the order you score it.",
			source: { html: scorerHtmlExample, svelte: scorerSvelteExample, astro: scorerAstroExample },
		},
		{
			id: "command-line",
			title: "A command line, where the query carries the arguments",
			description:
				"`completeFirst` makes Enter commit a name before it runs anything, so `cl` fills in `clear` and waits rather than wiping the layer on one keystroke. Recents are whole lines rather than command ids, because an id can only remember that you ran `rect`, never the rectangle.",
			source: { html: lineHtmlExample, svelte: lineSvelteExample, astro: lineAstroExample },
		},
	],
};
