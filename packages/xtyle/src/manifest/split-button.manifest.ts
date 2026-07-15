import type { ComponentManifest } from "./types.js";

const htmlExample = `<xtyle-split-button
	variant="solid"
	tone="accent"
	menu-label="More save actions"
	items='[
		{ "label": "Save and close", "value": "save-close" },
		{ "label": "Save as draft", "value": "save-draft", "hint": "Ctrl+D" },
		{ "separator": true },
		{ "label": "Discard changes", "value": "discard", "intent": "danger" }
	]'
>
	Save
</xtyle-split-button>

<script>
	const split = document.querySelector("xtyle-split-button");
	split.addEventListener("click", () => save());
	split.addEventListener("select", (event) => run(event.detail.value));
</script>`;

const svelteExample = `<script lang="ts">
	import { SplitButton } from "@xtyle/svelte";

	const actions = [
		{ label: "Save and close", value: "save-close" },
		{ label: "Save as draft", value: "save-draft", hint: "Ctrl+D" },
		{ separator: true },
		{ label: "Discard changes", value: "discard", intent: "danger" },
	];
</script>

<SplitButton
	tone="accent"
	items={actions}
	menuLabel="More save actions"
	onclick={() => save()}
	onselect={(event) => run(event.detail.value)}
>
	Save
</SplitButton>`;

const astroExample = `---
import { SplitButton } from "@xtyle/astro";

const actions = [
	{ label: "Deploy to staging", value: "staging" },
	{ label: "Deploy to preview", value: "preview" },
	{ separator: true },
	{ label: "Roll back", value: "rollback", intent: "danger" },
];
---

<SplitButton id="deploy" tone="accent" items={actions} menuLabel="Other deploy targets">
	Deploy
</SplitButton>

<script>
	const split = document.getElementById("deploy")!;
	split.addEventListener("click", () => deployProduction());
	split.addEventListener("select", (event) => deployTo((event as CustomEvent).detail.value));
</script>`;

export const splitButtonManifest: ComponentManifest = {
	id: "split-button",
	name: "Split Button",
	category: "control",
	since: "0.8.0",
	keywords: ["split", "dropdown button", "menu button", "primary action", "caret", "default action", "actions"],
	seeAlso: ["button", "menu", "toolbar", "popover"],
	summary:
		"A primary action with its variations behind a caret: one press for the thing you meant, a menu for the things you nearly meant.",
	description:
		"SplitButton is the control for an action that has a *default* and a *family*: Save, and also Save-and-close; Deploy, and also Deploy-to-staging; Export, and also Export-as-CSV. The press is one click away and the alternatives are two, which is the whole point — a plain Menu makes the common case cost an extra press, and a row of Buttons makes the rare case cost the same as the common one. It is a composition rather than a re-implementation: both halves carry Button's own classes, so every variant, tone, and size the button set speaks is the split button's too, and the dropdown is a real `<xtyle-menu>`, so the roving focus, the typeahead, the separators, the headings, the `hint` accelerators, the danger rows, and the `select` event all come from Menu instead of a second copy of them living here. What the element adds is the group: one shared shape with a square seam, the divider, the caret, and the menu keys answering from *either* half — ArrowDown on the primary drops the menu the way it does on the caret. The primary fires a plain `click`; the menu fires `select` with the chosen row's value, and the caret's own click never reaches a `click` listener, so the two paths never blur together.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "split-button",
			description: "The `role=\"group\"` wrapper holding the two halves as one shape.",
			selector: ".xtyle-split-button",
		},
		{
			name: "primary",
			description: "The default action: a real Button, square on its trailing edge where it meets the caret.",
			selector: ".xtyle-split-button__primary",
			tokens: ["--radius-md"],
		},
		{
			name: "toggle",
			description: "The caret half: a menu button (`aria-haspopup=\"menu\"`, `aria-expanded`) that opens the dropdown.",
			selector: ".xtyle-split-button__toggle",
			tokens: ["--space-1", "--state-hover", "--state-press", "--ring"],
		},
		{
			name: "divider",
			description: "The hairline seam between the halves, drawn in `currentColor` inside the toggle so it reads on a solid fill and a ghost alike.",
			selector: ".xtyle-split-button__divider",
			tokens: ["--border-thin", "--radius-full", "--space-1"],
		},
		{
			name: "caret",
			description: "The chevron, rotated 180° while the menu is open.",
			selector: ".xtyle-split-button__caret",
			tokens: ["--duration-fast", "--ease-standard"],
		},
		{
			name: "menu",
			description: "The composed `<xtyle-menu>` in its cursor-anchored posture, opened against the caret. It renders through `component.menu`, so the dropdown's own chrome stays a mod surface.",
			selector: ".xtyle-split-button__menu",
		},
	],
	props: [
		{
			name: "items",
			type: "MenuItem[]",
			default: "[]",
			description:
				"The dropdown's rows — the same contract Menu speaks: `{ label, value, hint, disabled, intent }` actions, `{ separator: true }` dividers, and `{ heading }` group labels. Accepts a JSON string on the attribute.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "variant",
			type: "ButtonVariant",
			default: "solid",
			description: "The button treatment, applied to both halves so they read as one control.",
			bindings: ["html", "svelte", "astro"],
			options: ["solid", "outline", "subtle", "ghost"],
		},
		{
			name: "tone",
			type: "FullTone",
			default: "accent",
			description: "The semantic or hue tone, applied to both halves.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "size",
			type: "SplitButtonSize",
			default: "md",
			description: "The control's size, matching Button's steps so the two can share a row.",
			bindings: ["html", "svelte", "astro"],
			options: ["xs", "sm", "md", "lg"],
		},
		{
			name: "open",
			type: "boolean",
			default: "false",
			description: "Whether the dropdown is showing. Set it to open or close the menu; it follows the menu's own state, so a light dismiss clears it.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "disabled",
			type: "boolean",
			default: "false",
			description: "Disables both halves.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "loading",
			type: "boolean",
			default: "false",
			description:
				"Puts the primary in flight: a spinner replaces its label and the press is blocked, the way Button's is. The caret stays live, so the menu is still reachable while the default action runs.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "menuLabel",
			type: "string",
			default: "More actions",
			description: "Accessible name for the caret half. Name it for what the menu holds (\"More save actions\"), since \"More actions\" says nothing on a page with three split buttons.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "block",
			type: "boolean",
			default: "false",
			description: "Fills the inline axis: the primary grows and the caret stays its own width.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "type",
			type: "string",
			default: "button",
			description: "The primary's native button `type` — set it to `submit` to make the default action submit the surrounding form.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [
		{ name: "solid", description: "Filled: the default, for the one primary action on a surface.", className: "xtyle-button--solid" },
		{ name: "outline", description: "Bordered: a secondary action that still needs an edge.", className: "xtyle-button--outline" },
		{ name: "subtle", description: "Tinted: a quiet action inside a dense toolbar.", className: "xtyle-button--subtle" },
		{ name: "ghost", description: "Bare: chrome only on hover, for a row of actions.", className: "xtyle-button--ghost" },
	],
	sizes: [
		{ name: "xs", description: "The dense toolbar step.", className: "xtyle-button--xs" },
		{ name: "sm", description: "Compact.", className: "xtyle-button--sm" },
		{ name: "md", description: "The default.", className: "xtyle-split-button", isDefault: true },
		{ name: "lg", description: "The prominent step, for a page's main action.", className: "xtyle-button--lg" },
	],
	states: [
		{
			name: "open",
			description: "The dropdown is showing; the caret is flipped and `aria-expanded` is true.",
			selector: ".xtyle-split-button--open",
			tokens: ["--duration-fast", "--ease-standard"],
		},
		{
			name: "disabled",
			description: "Both halves are inert and the seam fades with them.",
			selector: ".xtyle-split-button--disabled",
		},
	],
	slots: [
		{
			name: "default",
			description: "The primary action's label. Everything else about the control is a prop; this is the word on the button.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	consumedTokens: [
		"--border-thin",
		"--duration-fast",
		"--ease-standard",
		"--radius-full",
		"--space-1",
	],
	composition: [
		"Reach for SplitButton when one action in a family is the obvious default and the rest are real but rare. If every option is equally likely, that is a Menu; if there is only one, that is a Button.",
		"Name the caret for what it holds (`menuLabel=\"More save actions\"`), not for what it is. A screen reader on a page of three split buttons hears \"More actions\" three times otherwise.",
		"Put the destructive sibling in the menu with `intent: \"danger\"` — never as the primary. The press that costs one click should never be the one you cannot take back.",
		"Listen for `click` for the default action and `select` for the menu. The caret's own click is stopped inside the group, so a `click` listener only ever hears the primary.",
		"`loading` blocks the primary but leaves the caret live: an export that is running can still be cancelled from its own menu.",
	],
	a11y: [
		"The group is a `role=\"group\"` of two real `<button>`s — the primary and a menu button carrying `aria-haspopup=\"menu\"` and an `aria-expanded` that tracks the dropdown, including when the menu closes on a path the group never saw (a light dismiss, an Escape inside the popup, a chosen row).",
		"The menu keys answer from either half: ArrowDown opens it focused on the first row, ArrowUp on the last, from the primary as well as the caret — so the alternatives are reachable without ever leaving the default action's focus.",
		"Escape closes the dropdown and focus returns to the caret that opened it, on every path — including a pointer press, which does not focus a button on every platform.",
		"The dropdown *is* Menu, so its roving tab stop, its `role=\"menu\"` / `role=\"menuitem\"` semantics, its typeahead, and its dismissal behavior are the ones already proven there, not a second implementation.",
		"The divider and the caret are `aria-hidden` and take no tab stop; the caret's accessible name comes from `menuLabel`.",
		"The caret's rotation honors `prefers-reduced-motion`.",
	],
	examples: [
		{
			id: "save-actions",
			title: "Save, and the other saves",
			description: "The canonical shape: the default action on the button, its variations behind the caret, and the destructive one marked as such.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
	],
};
