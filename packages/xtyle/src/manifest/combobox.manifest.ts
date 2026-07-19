import type { ComponentManifest } from "./types.js";

const htmlExample = `<xtyle-combobox
	id="tz"
	label="Time zone"
	placeholder="Start typing…"
	clearable
></xtyle-combobox>

<script>
	const combo = document.querySelector("#tz");

	// the same option contract Field and Select speak: a string[] or a { value, label }[]
	combo.options = [
		{ value: "Europe/London", label: "London" },
		{ value: "Europe/Berlin", label: "Berlin" },
		{ value: "America/New_York", label: "New York" },
		{ value: "Asia/Tokyo", label: "Tokyo" },
	];

	combo.addEventListener("change", () => console.log("picked:", combo.value));
</script>`;

const svelteExample = `<script lang="ts">
	import { Combobox } from "@xtyle/svelte";

	const zones = [
		{ value: "Europe/London", label: "London" },
		{ value: "Europe/Berlin", label: "Berlin" },
		{ value: "America/New_York", label: "New York" },
	];

	let zone = $state("");
</script>

<Combobox label="Time zone" placeholder="Start typing…" options={zones} bind:value={zone} clearable />

<p>Picked: {zone || "nothing yet"}</p>`;

const astroExample = `---
import Combobox from "@xtyle/astro/Combobox.astro";

const zones = [
	{ value: "Europe/London", label: "London" },
	{ value: "Europe/Berlin", label: "Berlin" },
	{ value: "America/New_York", label: "New York" },
];
---

<Combobox label="Time zone" placeholder="Start typing…" options={zones} clearable />`;

const htmlMultiExample = `<!-- multi-select: the picks become chips, Backspace on an empty query takes the last one back -->
<xtyle-combobox
	id="labels"
	label="Labels"
	name="labels"
	multiple
	clearable
	placeholder="Add a label…"
	options='["bug", "docs", "enhancement", "good first issue"]'
	values='["bug"]'
></xtyle-combobox>

<script>
	const labels = document.querySelector("#labels");
	labels.addEventListener("change", () => console.log(labels.values));
</script>`;

const svelteMultiExample = `<script lang="ts">
	import { Combobox } from "@xtyle/svelte";

	let labels = $state(["bug"]);
</script>

<Combobox
	label="Labels"
	name="labels"
	multiple
	clearable
	placeholder="Add a label…"
	options={["bug", "docs", "enhancement", "good first issue"]}
	bind:values={labels}
/>

<p>{labels.length} selected</p>`;

const astroMultiExample = `---
import Combobox from "@xtyle/astro/Combobox.astro";
---

<form method="post">
	<!-- one hidden input per selection, so the form posts \`labels\` twice -->
	<Combobox
		label="Labels"
		name="labels"
		multiple
		clearable
		options={["bug", "docs", "enhancement"]}
		values={["bug"]}
	/>
	<button type="submit">Save</button>
</form>`;

const htmlAsyncExample = `<!-- \`filter="none"\` hands the filtering to the server: the component shows exactly
     what it is given, and \`allow-custom\` lets a value the list never offered through -->
<xtyle-combobox id="search" label="Repository" filter="none" allow-custom placeholder="Search…"></xtyle-combobox>

<script>
	const search = document.querySelector("#search");

	search.addEventListener("input", async () => {
		const query = search.query; // what was typed, not what was picked
		const res = await fetch(\`/api/repos?q=\${encodeURIComponent(query)}\`);
		search.options = await res.json();
	});

	search.addEventListener("select", (event) => console.log(event.detail.value));
</script>`;

const svelteAsyncExample = `<script lang="ts">
	import { Combobox } from "@xtyle/svelte";

	let repos = $state<{ value: string; label?: string }[]>([]);

	async function search(event: Event) {
		const query = (event.currentTarget as HTMLElement & { query: string }).query;
		repos = await (await fetch(\`/api/repos?q=\${encodeURIComponent(query)}\`)).json();
	}
</script>

<Combobox label="Repository" filter="none" allowCustom options={repos} oninput={search} />`;

const astroAsyncExample = `---
import Combobox from "@xtyle/astro/Combobox.astro";
---

<Combobox id="search" label="Repository" filter="none" allowCustom placeholder="Search…" />

<script>
	const search = document.querySelector("#search");
	search.addEventListener("input", async () => {
		const res = await fetch(\`/api/repos?q=\${encodeURIComponent(search.query)}\`);
		search.options = await res.json();
	});
</script>`;

export const comboboxManifest: ComponentManifest = {
	id: "combobox",
	name: "Combobox",
	category: "form",
	since: "0.8.0",
	keywords: ["autocomplete", "typeahead", "tag input", "chips", "multi-select", "token input", "search input"],
	seeAlso: ["field", "select", "popover", "menu"],
	summary: "A text input that filters a themable listbox — autocomplete, single- or multi-select, with chips.",
	description:
		"Field hands its suggestions to a native `<datalist>` and Select to a native `<select>`. Both are right for the common case — the platform's own control is accessible, familiar, and free. Both are also drawn by the browser, which means a theming engine's tokens stop at their edge: the popup a `<datalist>` renders is the one surface in the set no algorithm can reach. Combobox is the answer to that. It draws the whole surface — the control, the caret, the floating listbox, the option rows, the chips — out of the register, so a theme actually reaches the thing the user is looking at.\n\nIt speaks the option contract Field and Select already speak (a `string[]`, a `{ value, label }[]`, or a JSON `options` attribute), so moving a control across is a tag change rather than a rewrite. Typing filters the list (`contains` by default, `starts` for a prefix match, `none` when the server already filtered and a second pass here would fight it). `allow-custom` lets a value the list never offered through, which is what a search box or a free-tag field needs.\n\n`multiple` turns it into the tag input: every pick becomes a removable chip in the control, Backspace on an empty query takes the last one back, the clear action empties the lot, and the listbox becomes `aria-multiselectable` with a check on each chosen row. In a `<form>` it posts one hidden input per selection under its `name`, the way a native multi-`<select>` does — plumbing that never renders.\n\nThe listbox floats in a `<xtyle-popover>`, so the anchoring, the flip near a viewport edge, the top-layer stacking, and the light-dismiss are the overlay family's and are not re-derived. Keyboard is the full WAI-ARIA combobox pattern: DOM focus never leaves the text input, and `aria-activedescendant` carries the cursor through the list.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "combobox",
			description: "The wrapper: label, control, listbox, and the description / error lines under it.",
			selector: ".xtyle-combobox",
			tokens: ["--space-1", "--font-sans"],
		},
		{
			name: "label",
			description: "The control's label, wired to the input by `for`. Hidden entirely when no `label` is given (name the control with `aria-label` instead).",
			selector: ".xtyle-combobox__label",
			tokens: ["--text-sm", "--weight-medium", "--fg-1", "--leading-normal", "--space-1"],
		},
		{
			name: "control",
			description:
				"The box the user types into: the chips, the input, the clear action, and the caret. It is also the rect the listbox anchors to, so the panel is always exactly as wide as the control.",
			selector: ".xtyle-combobox__control",
			tokens: [
				"--field-bg",
				"--field-border",
				"--border-thin",
				"--border-normal",
				"--radius-md",
				"--accent",
				"--ring",
				"--fg-0",
				"--space-1",
				"--space-2",
				"--duration-fast",
				"--ease-standard",
			],
		},
		{
			name: "chip",
			description:
				"One selected value in multi-select, with its own remove button. This is the tag input: the chips are real nodes in the fragment, so a mod can reshape them into avatars, colored labels, or anything else.",
			selector: ".xtyle-combobox__chip",
			tokens: ["--accent-bg", "--accent-text", "--radius-sm", "--text-sm", "--leading-tight", "--space-1", "--space-2"],
		},
		{
			name: "input",
			description: "The text box. It carries `role=\"combobox\"`, `aria-expanded`, `aria-controls`, and `aria-activedescendant`, and it never gives up focus while the list is open.",
			selector: ".xtyle-combobox__input",
			tokens: ["--text-sm", "--text-lg", "--fg-0", "--placeholder", "--radius-sm", "--leading-normal", "--space-1"],
		},
		{
			name: "action",
			description: "The clear and caret buttons. Both are `tabindex=\"-1\"`: they are pointer affordances for what the keyboard can already do (Escape clears, ArrowDown opens).",
			selector: ".xtyle-combobox__action",
			tokens: ["--fg-2", "--fg-0", "--state-hover", "--state-press", "--ring", "--radius-sm", "--border-thin", "--border-normal"],
		},
		{
			name: "list",
			description:
				"The listbox itself, floated in a popover panel and sized to the control. A real `<ul role=\"listbox\">` in the fragment — not a stylesheet's furniture — so a mod can rebuild the rows.",
			selector: ".xtyle-combobox__list",
			tokens: ["--space-1", "--font-sans"],
		},
		{
			name: "option",
			description:
				"One row: its label, and the check that marks it selected. The keyboard cursor lands on it as `data-active`, which is a different thing from being chosen (`aria-selected`) — a multi-select shows both at once.",
			selector: ".xtyle-combobox__option",
			tokens: ["--fg-1", "--fg-0", "--accent-bg", "--state-selected", "--radius-sm", "--text-sm", "--space-1", "--space-2"],
		},
		{
			name: "empty",
			description: "What the panel says when the query matched nothing. Its text is `empty-text`.",
			selector: ".xtyle-combobox__empty",
			tokens: ["--fg-2", "--text-sm", "--space-2", "--space-3", "--leading-normal"],
		},
	],
	props: [
		{
			name: "options",
			type: "string[] | { value: string; label?: string }[]",
			description:
				"The option list — the same contract Field's type-ahead and Select's `<option>`s speak. Set the JS property with an array, or pass the attribute as a JSON array (the declarative / SSR path).",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "value",
			type: "string",
			default: '""',
			description: "The selected value in the single-select posture (the first one in multi-select). Setting it replaces the selection.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "values",
			type: "string[]",
			default: "[]",
			description: "Every selected value — the multi-select surface. Reflects to the `values` attribute as a JSON array.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "query",
			type: "string",
			default: '""',
			description:
				"The live text in the input: what the user typed, not what they picked. Read it on `input` to drive an async fetch; it is a property, not an attribute.",
			bindings: ["html", "svelte"],
		},
		{
			name: "multiple",
			type: "boolean",
			default: "false",
			description:
				"Pick many. Each selection becomes a removable chip, Backspace on an empty query takes the last one back, and the listbox becomes `aria-multiselectable`. This is the tag input.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "filter",
			type: '"contains" | "starts" | "none"',
			default: '"contains"',
			description:
				"How the typed query narrows the list. Matching is case-insensitive across both the label and the value. `none` shows the list untouched — the async path, where the consumer swaps `options` on every `input`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "allowCustom",
			type: "boolean",
			default: "false",
			description: "Accept a value the option list never offered: Enter commits whatever was typed, and a blur keeps it.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "clearable",
			type: "boolean",
			default: "false",
			description: "Show the clear action once anything is selected or typed. In multi-select it is the clear-all.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "open",
			type: "boolean",
			default: "false",
			description: "Whether the listbox is open. It reflects the popup's real state, so a light-dismiss or an Escape clears it back out.",
			bindings: ["html", "svelte"],
		},
		{
			name: "name",
			type: "string",
			description:
				"The form field name. The value rides into the `<form>` on a hidden input the element owns — one per selection, so a multi-select posts the array the way a native multi-`<select>` does.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "label",
			type: "string",
			description: "The control's label. Without one, name the input with `aria-label` or at least a `placeholder`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "placeholder",
			type: "string",
			description: "The input's placeholder.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "emptyText",
			type: "string",
			default: '"No matches"',
			description: "What the panel says when the query matched nothing.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "size",
			type: '"sm" | "md" | "lg"',
			default: '"md"',
			description: "The control's size, matching Field and Select so a form stays on one rhythm.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "disabled",
			type: "boolean",
			default: "false",
			description: "Take the control out of play: no typing, no opening, no clearing.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "readonly",
			type: "boolean",
			default: "false",
			description: "Show the selection but refuse to change it. The list never opens.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "invalid",
			type: "boolean",
			default: "false",
			description: "Mark the control invalid and show its `error` line.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "required",
			type: "boolean",
			default: "false",
			description: "Mark the control required, for the label's star and the form's validity.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "description",
			type: "string",
			description: "A hint under the control, wired to the input with `aria-describedby`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "error",
			type: "string",
			description: "The message shown (and announced) when `invalid` is set.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "visibleOptions",
			type: "{ value: string; label?: string }[]",
			description: "Read-only: the options left after the current query — exactly what the listbox is showing.",
			bindings: ["html", "svelte"],
		},
		{
			name: "static",
			type: "boolean",
			default: "false",
			description:
				"Astro only: keep the server-rendered control, its resolved label, and any chips, but never load the runtime to hydrate them. The listbox is a runtime surface and never opens, so reach for `Select` when a zero-JS page still has to take a choice. The Svelte and raw-element paths always upgrade, so they carry no equivalent.",
			bindings: ["astro"],
		},
	],
	variants: [
		{
			name: "multiple",
			className: "xtyle-combobox--multiple",
			description: "The multi-select posture: the control grows a row of chips and the listbox marks every chosen option.",
			tokens: ["--accent-bg", "--accent-text"],
		},
	],
	sizes: [
		{ name: "sm", className: "xtyle-combobox--sm", description: "Compact — a toolbar filter, a dense table header." },
		{ name: "md", className: "xtyle-combobox", description: "The default, matching Field and Select.", isDefault: true },
		{ name: "lg", className: "xtyle-combobox--lg", description: "Roomy — a landing-page search, a primary picker." },
	],
	states: [
		{
			name: "open",
			description: "The listbox is showing. The caret flips, and the input's `aria-expanded` says so.",
			selector: ".xtyle-combobox--open .xtyle-combobox__caret",
			tokens: ["--duration-fast", "--ease-standard"],
		},
		{
			name: "active option",
			description:
				"The keyboard cursor: the row `aria-activedescendant` points at. It is not a selection — an unpicked row can be active, and in multi-select a picked row can be passed over.",
			selector: '.xtyle-combobox__option[data-active="true"]',
			tokens: ["--accent-bg", "--fg-0"],
		},
		{
			name: "selected option",
			description: "A chosen row, marked with a check. In multi-select, several are.",
			selector: '.xtyle-combobox__option[aria-selected="true"]',
			tokens: ["--state-selected", "--fg-0"],
		},
		{
			name: "invalid",
			description: "The control is invalid: the border takes the danger tone and the error line is announced.",
			selector: ".xtyle-combobox--invalid .xtyle-combobox__control",
			tokens: ["--danger", "--danger-bg", "--danger-text"],
		},
		{
			name: "disabled",
			description: "Out of play — no typing, no opening, no clearing.",
			selector: ".xtyle-combobox--disabled .xtyle-combobox__control",
			tokens: ["--state-disabled", "--fg-disabled"],
		},
		{
			name: "readonly",
			description: "Shown but frozen: the selection reads, the list never opens.",
			selector: ".xtyle-combobox--readonly .xtyle-combobox__control",
			tokens: ["--bg-1"],
		},
	],
	slots: [],
	consumedTokens: [
		"--accent",
		"--accent-bg",
		"--accent-text",
		"--bg-1",
		"--border-normal",
		"--border-thin",
		"--danger",
		"--danger-bg",
		"--danger-text",
		"--duration-fast",
		"--ease-standard",
		"--fg-0",
		"--fg-1",
		"--fg-2",
		"--fg-disabled",
		"--field-bg",
		"--field-border",
		"--font-sans",
		"--leading-normal",
		"--leading-tight",
		"--placeholder",
		"--radius-md",
		"--radius-sm",
		"--ring",
		"--space-1",
		"--space-2",
		"--space-3",
		"--state-disabled",
		"--state-hover",
		"--state-press",
		"--state-selected",
		"--text-lg",
		"--text-sm",
		"--weight-medium",
		"--weight-semibold",
	],
	composition: [
		"Reach for Field when a plain text box with optional suggestions is enough, and for Select when the choice is short, fixed, and the native control is fine. Reach for Combobox when the list is long enough to need filtering, when the popup has to carry the theme, or when the answer is more than one value.",
		"`multiple` is the tag input: chips, Backspace to take one back, and a clear-all. There is no separate component for it, and there does not need to be.",
		"The listbox floats in a `Popover`, so it stacks in the top layer, flips at a viewport edge, and light-dismisses — none of which Combobox re-derives.",
		"For an async / server-filtered list, set `filter=\"none\"`, read `query` on the `input` event, and assign the answer back to `options`. Add `allow-custom` when a value that never appeared in the list is still a legitimate answer.",
		"The option contract is Field's and Select's, so a control can move between the three without its data changing shape.",
	],
	a11y: [
		"The input carries `role=\"combobox\"`, `aria-autocomplete=\"list\"`, `aria-expanded`, and `aria-controls` pointing at the listbox — the full WAI-ARIA combobox-with-listbox pattern.",
		"DOM focus never leaves the input while the list is open. The keyboard cursor is carried by `aria-activedescendant`, and the row it names is marked `data-active` — which is why a pointer landing on the list is prevented from stealing focus.",
		"ArrowDown / ArrowUp open the list and move the cursor (wrapping at either end); Home / End jump to the first and last match; Enter commits the active option (or, under `allow-custom`, the raw text); Escape closes the list, and closes nothing a second time — it clears the query instead; Tab closes and moves on; Backspace on an empty multi-select query removes the last chip.",
		"Typing *is* the type-ahead: the list narrows on every keystroke, the first match becomes the active option, and the panel re-places itself as the list resizes.",
		"The listbox is a real `<ul role=\"listbox\">` whose rows are `role=\"option\"` with a truthful `aria-selected`, and it is `aria-multiselectable` in the multi-select posture. Chosen rows also carry a visible check, so selection is never conveyed by color alone.",
		"The clear and caret buttons are `tabindex=\"-1\"`: they duplicate what the keyboard can already do, and a tab stop for each would only add noise between the input and the next field.",
		"In a `<form>`, the value rides on a hidden input the element owns (one per selection). The control announces itself as required and invalid through `ElementInternals`, and its `error` line is wired to the input with `aria-describedby`.",
		"Without a `label`, the input has no accessible name: give it one, or an `aria-label`, or at least a `placeholder` (which is a weaker answer, and the element will say so in the console).",
	],
	examples: [
		{
			id: "single-combobox",
			title: "Autocomplete a single value",
			description: "The common shape: type to filter, Arrow keys to move, Enter to commit. The popup is drawn from the register, so the theme reaches it.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
		{
			id: "multi-combobox",
			title: "Multi-select, with chips",
			description:
				"`multiple` makes it the tag input: every pick becomes a removable chip, Backspace on an empty query takes the last one back, and the form posts one entry per selection.",
			source: { html: htmlMultiExample, svelte: svelteMultiExample, astro: astroMultiExample },
		},
		{
			id: "async-combobox",
			title: "Server-filtered, with free text",
			description:
				"`filter=\"none\"` hands the filtering to the server: read `query` on `input`, fetch, and assign `options` back. `allow-custom` lets an answer the list never offered through.",
			source: { html: htmlAsyncExample, svelte: svelteAsyncExample, astro: astroAsyncExample },
		},
	],
};
