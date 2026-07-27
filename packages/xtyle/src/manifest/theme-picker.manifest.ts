import type { ComponentManifest } from "./types.js";

const htmlExample = `<!-- A gallery of invocations to choose from -->
<xtyle-theme-picker
	label="Theme"
	value="Quiet"
	themes='[
		{"name":"Default","algorithm":"xtyle-default"},
		{"name":"Quiet","algorithm":"xtyle-quiet"},
		{"name":"Grape","constraints":{"--accent":"#7c5cff"}},
		{"name":"Grape light","scheme":"light","constraints":{"--accent":"#7c5cff"}}
	]'
></xtyle-theme-picker>

<!-- Picking one hands the whole invocation to a scope -->
<script type="module">
	const picker = document.querySelector("xtyle-theme-picker");
	const scope = document.querySelector("xtyle-theme-scope");
	picker.addEventListener("xtyle:theme-pick", (event) => {
		const { algorithm, scheme, constraints } = event.detail.theme;
		if (algorithm) scope.setAttribute("algorithm", algorithm);
		if (scheme) scope.setAttribute("scheme", scheme);
		scope.setAttribute("constraints", JSON.stringify(constraints ?? {}));
	});
</script>`;

const svelteExample = `<script lang="ts">
	import { ThemePicker, ThemeScope } from "@xtyle/svelte";

	const themes = [
		{ name: "Default", algorithm: "xtyle-default" },
		{ name: "Quiet", algorithm: "xtyle-quiet" },
		{ name: "Grape", constraints: { "--accent": "#7c5cff" } },
	];

	let chosen = $state(themes[0]);
</script>

<ThemePicker {themes} label="Theme" value={chosen.name} onpick={(d) => (chosen = d.theme)} swatches />

<ThemeScope algorithm={chosen.algorithm} constraints={chosen.constraints}>
	<p>Everything here wears the chosen theme.</p>
</ThemeScope>`;

const astroExample = `---
import ThemePicker from "@xtyle/astro/ThemePicker.astro";

const themes = [
	{ name: "Default", algorithm: "xtyle-default" },
	{ name: "Quiet", algorithm: "xtyle-quiet" },
	{ name: "Grape", constraints: { "--accent": "#7c5cff" } },
];
---

<ThemePicker {themes} label="Theme" value="Quiet" swatches minColWidth="14rem" />

<!-- the same picker as a toolbar dropdown -->
<ThemePicker {themes} label="Theme" value="Quiet" layout="menu" />`;

export const themePickerManifest: ComponentManifest = {
	id: "theme-picker",
	name: "Theme Picker",
	since: "0.10.0",
	category: "form",
	keywords: ["theme", "picker", "gallery", "chooser", "algorithm", "invocation", "select", "switcher"],
	seeAlso: ["theme-card", "theme-swatch", "theme-scope"],
	summary: "A gallery of themes to choose from, each previewed as it will look.",
	description:
		"Theme Picker is the choosing surface for a set of invocations. Every option is an `<xtyle-theme-card>`, so the preview, the button semantics, the accessible name, and the selected state all come from that component; the picker owns the grid, which card is current, and reporting the choice. Turn on `swatches` and each card gets an `<xtyle-theme-swatch>` beneath it, pairing the picture with the parts list. It adds **no cursor of its own** — every card is already a real button, so focus moves through them the way it moves through any group of controls, and there is no bespoke roving tab stop to get wrong. Picking one fires `xtyle:theme-pick` carrying the *whole invocation*, not just a name, which is exactly what an `<xtyle-theme-scope>` needs to apply it: the two compose into a working theme switcher with no glue in between. With no `themes` it says so rather than rendering an empty grid.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "grid",
			description: "The gallery. A responsive `auto-fill` grid whose column floor is `min-col-width`.",
			selector: ".xtyle-theme-picker__grid",
		},
		{
			name: "item",
			description: "One choice: its card, and its swatch row when `swatches` is on.",
			selector: ".xtyle-theme-picker__item",
		},
		{
			name: "empty",
			description: "Shown instead of the grid when there is nothing to choose from.",
			selector: ".xtyle-theme-picker__empty",
		},
		{
			name: "menu",
			description: "The `layout=\"menu\"` shell: an `<xtyle-popover>` holding the same gallery, with a trigger naming the current choice.",
			selector: ".xtyle-theme-picker__menu",
		},
	],
	props: [
		{
			name: "themes",
			type: "PickerTheme[]",
			description: "The invocations on offer — each `{ name?, algorithm?, scheme?, knobs?, constraints? }` — as an array in the framework bindings and JSON in the HTML attribute.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "value",
			type: "string",
			description: "The chosen theme's key: its `name`, or its `algorithm` when unnamed.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "label",
			type: "string",
			description: "Accessible name for the group of choices.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "layout",
			type: "\"gallery\" | \"menu\"",
			default: "gallery",
			description: "`gallery` lays the choices out in place; `menu` puts the same gallery behind a trigger showing the current one, for a toolbar with no room to show it outright.",
			bindings: ["html", "svelte", "astro"],
			options: ["gallery", "menu"],
		},
		{
			name: "open",
			type: "boolean",
			default: "false",
			description: "Start the `menu` layout's panel open. The gallery ignores it, being open by definition.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "swatches",
			type: "boolean",
			default: "false",
			description: "Show a `<xtyle-theme-swatch>` under each card, so a choice reads as both a picture and its values.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "min-col-width",
			type: "string",
			default: "13rem",
			description: "The grid's column floor; the gallery fits as many columns as that allows.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "empty",
			type: "string",
			default: "No themes to choose from.",
			description: "What to say when `themes` is empty.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [],
	sizes: [],
	states: [
		{
			name: "selected",
			description: "The current choice, carried by the card's own selected state.",
			selector: ".xtyle-theme-picker__item .xtyle-theme-card--selected",
		},
	],
	slots: [],
	consumedTokens: [
		"--fg-2",
		"--font-sans",
		"--leading-tight",
		"--space-2",
		"--space-3",
		"--text-xs",
	],
	composition: [
		"Reach for `layout=\"menu\"` in a toolbar: the trigger names the current theme and the same gallery opens beneath it, so a switcher is one element rather than a hand-rolled dropdown.",
		"Wire `xtyle:theme-pick` straight into an `<xtyle-theme-scope>`: the event carries the whole invocation, so the scope needs no lookup table.",
		"Turn on `swatches` when the exact colors matter as much as the impression.",
		"Offer the blessed algorithms as the starting set, then append whatever a person has built.",
		"Override the `component.theme-picker` fill to lay the gallery out differently without touching the cards inside it.",
	],
	a11y: [
		"Under `layout=\"menu\"` the panel is an `<xtyle-popover>`, so placement, light dismiss, Escape, and focus return are the overlay component's job rather than a bespoke reimplementation.",
		"The gallery is a labelled group of real buttons, so it is reachable and announced without a bespoke cursor.",
		"Each card carries `aria-pressed` and an accessible name naming its theme, algorithm, and scheme.",
		"Choosing does not move focus, so a keyboard user stays where they were and can keep comparing.",
		"With nothing on offer the picker says so, rather than presenting an empty group.",
	],
	examples: [
		{
			id: "gallery-and-scope",
			title: "A gallery wired to a scope",
			description: "A set of invocations to choose from, with the pick handed straight to a theme scope.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
	],
};
