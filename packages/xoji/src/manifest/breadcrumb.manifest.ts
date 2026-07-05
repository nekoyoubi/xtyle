import type { ComponentManifest } from "./types.js";
import { FULL_TONES } from "../vocab.js";

const htmlExample = `<xoji-breadcrumb
	items='[
		{"label":"Home","href":"/"},
		{"label":"Library","href":"/library"},
		{"label":"Themes"}
	]'
></xoji-breadcrumb>

<xoji-breadcrumb tone="neutral" separator="›" items='[
	{"label":"Docs","href":"/docs"},
	{"label":"Components","href":"/docs/components"},
	{"label":"Breadcrumb"}
]'></xoji-breadcrumb>

<xoji-breadcrumb label="You are here">
	<li class="xoji-breadcrumb__item"><a class="xoji-breadcrumb__link" href="/">Home</a></li>
	<li class="xoji-breadcrumb__separator" aria-hidden="true">/</li>
	<li class="xoji-breadcrumb__item"><span class="xoji-breadcrumb__current" aria-current="page">Settings</span></li>
</xoji-breadcrumb>`;

const svelteExample = `<script lang="ts">
	import { Breadcrumb } from "@xoji/svelte";

	const trail = [
		{ label: "Home", href: "/" },
		{ label: "Library", href: "/library" },
		{ label: "Themes" },
	];
</script>

<Breadcrumb items={trail} />

<Breadcrumb tone="neutral" separator="›" items={trail} />`;

const astroExample = `---
import { Breadcrumb } from "@xoji/astro";

const trail = [
	{ label: "Home", href: "/" },
	{ label: "Library", href: "/library" },
	{ label: "Themes" },
];
---

<Breadcrumb items={trail} />

<Breadcrumb tone="neutral" separator="›" items={trail} />`;

const interactiveHtmlExample = `<xoji-breadcrumb id="tree-trail" label="Node ancestry" items='[
	{"label":"root","value":"0"},
	{"label":"window","value":"1"},
	{"label":"toolbar"}
]'></xoji-breadcrumb>
<script>
	// a valued crumb drives app state instead of navigating
	document.querySelector("#tree-trail").addEventListener("select", (e) => {
		selectNode(e.detail.value); // { value, index }
	});
</script>`;

const interactiveSvelteExample = `<script lang="ts">
	import { Breadcrumb } from "@xoji/svelte";

	const ancestry = [
		{ label: "root", value: "0" },
		{ label: "window", value: "1" },
		{ label: "toolbar" }, // the current node: no value, not clickable
	];
</script>

<Breadcrumb label="Node ancestry" items={ancestry} onselect={(e) => selectNode(e.detail.value)} />`;

const interactiveAstroExample = `---
import { Breadcrumb } from "@xoji/astro";

const ancestry = [
	{ label: "root", value: "0" },
	{ label: "window", value: "1" },
	{ label: "toolbar" },
];
---

<Breadcrumb label="Node ancestry" items={ancestry} />
<script>
	document.querySelector("xoji-breadcrumb").addEventListener("select", (e) => {
		selectNode(e.detail.value);
	});
</script>`;

const titleHtmlExample = `<!-- a title reveals the full value behind a shortened crumb -->
<xoji-breadcrumb items='[
	{"label":"~","href":"/","title":"/home/ada"},
	{"label":"…","href":"/p","title":"projects/2026/q3"},
	{"label":"report.md","title":"projects/2026/q3/report.md"}
]'></xoji-breadcrumb>`;

const titleSvelteExample = `<script lang="ts">
	import { Breadcrumb } from "@xoji/svelte";

	const path = [
		{ label: "~", href: "/", title: "/home/ada" },
		{ label: "…", href: "/p", title: "projects/2026/q3" }, // middle-truncated, full path on hover
		{ label: "report.md", title: "projects/2026/q3/report.md" },
	];
</script>

<Breadcrumb items={path} />`;

const titleAstroExample = `---
import { Breadcrumb } from "@xoji/astro";

const path = [
	{ label: "~", href: "/", title: "/home/ada" },
	{ label: "…", href: "/p", title: "projects/2026/q3" },
	{ label: "report.md", title: "projects/2026/q3/report.md" },
];
---

<Breadcrumb items={path} />`;

export const breadcrumbManifest: ComponentManifest = {
	id: "breadcrumb",
	name: "Breadcrumb",
	category: "navigation",
	summary: "A hierarchy trail showing where a page sits, with linked ancestors and a marked current location.",
	description:
		"Breadcrumb renders a location trail: an ordered list of ancestor links ending in the current page, with a separator glyph between each step. It is a `<nav>` landmark labeled \"Breadcrumb\" wrapping an `<ol>`; ancestors render as anchors and the final crumb renders as plain text carrying `aria-current=\"page\"`. Pass the trail declaratively via the `items` array (each entry is `{ label, href?, value?, title?, current? }`) and the engine builds the list, injects the separators, and marks the last item current. For an in-app trail where a crumb drives state instead of navigating (selecting an ancestor node, not following a URL), give the item a `value` and no `href`: it renders as a real button and fires a `select` event carrying `{ value, index }` on click or Enter/Space, so interactive crumbs never have to drop to the slot. `href` wins when both are set. The separator glyph defaults to `/` and is purely decorative. A `tone` tints the ancestor links and three `size`s scale the type. For fully custom crumbs, omit `items` and provide your own `<li>` markup in the default slot.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "breadcrumb",
			description: "The `<nav>` landmark wrapping the trail, carrying the tone and size classes.",
			selector: ".xoji-breadcrumb",
			tokens: ["--font-sans", "--text-sm", "--leading-normal", "--fg-2"],
		},
		{
			name: "list",
			description: "The ordered list laying the crumbs and separators out in a wrapping row.",
			selector: ".xoji-breadcrumb__list",
			tokens: ["--space-1"],
		},
		{
			name: "item",
			description: "An ancestor link (anchor) or the current crumb (text). Links tint with the tone; the current crumb is bold neutral ink.",
			selector: ".xoji-breadcrumb__link, .xoji-breadcrumb__current",
			tokens: ["--accent-vivid", "--fg-0", "--weight-medium", "--radius-sm", "--space-0", "--space-1"],
		},
		{
			name: "separator",
			description: "The decorative glyph between crumbs, hidden from assistive tech.",
			selector: ".xoji-breadcrumb__separator",
			tokens: ["--fg-3"],
		},
	],
	props: [
		{
			name: "items",
			type: "BreadcrumbItem[]",
			description:
				"The trail, ordered root → current. Each item is `{ label, href?, value?, title?, current? }`. Items with an `href` (and not current) render as links; a non-current item with a `value` and no `href` renders as a button that fires `select`; the last item, or any item with `current: true`, renders as the current page. An optional `title` becomes the crumb's hover tooltip (and its accessible description), for an abbreviated or truncated label whose full value should still be reachable. In the HTML binding this is a JSON-string attribute.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "separator",
			type: "string",
			default: "/",
			description: "The glyph drawn between crumbs; decorative and hidden from assistive technology.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "tone",
			type: "FullTone",
			default: "accent",
			description: "Color tinting the ancestor links, from any tone in the roster: a semantic role, an accent variant, or a named hue.",
			bindings: ["html", "svelte", "astro"],
			options: [...FULL_TONES],
		},
		{
			name: "size",
			type: "Size",
			default: "md",
			description: "Type scale of the trail.",
			bindings: ["html", "svelte", "astro"],
			options: ["sm", "md", "lg"],
		},
		{
			name: "label",
			type: "string",
			default: "Breadcrumb",
			description: "The accessible name of the `<nav>` landmark.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [
		{
			name: "accent",
			description: "Ancestor links tinted with the accent tone (the default).",
			className: "xoji-breadcrumb--accent",
			tokens: ["--accent-vivid"],
		},
		{
			name: "neutral",
			description: "Ancestor links in neutral ink for a quieter trail.",
			className: "xoji-breadcrumb--neutral",
			tokens: ["--neutral-vivid"],
		},
	],
	sizes: [
		{ name: "sm", description: "Compact.", className: "xoji-breadcrumb--sm" },
		{ name: "md", description: "Default.", className: "xoji-breadcrumb", isDefault: true },
		{ name: "lg", description: "Large.", className: "xoji-breadcrumb--lg" },
	],
	states: [
		{
			name: "hover",
			description: "Pointer over an ancestor link; it underlines.",
			selector: ".xoji-breadcrumb__link:hover",
		},
		{
			name: "focus-visible",
			description: "Keyboard focus on a link: a token-colored ring, plus a transparent outline promoted to a real one in forced-colors mode.",
			selector: ".xoji-breadcrumb__link:focus-visible",
			tokens: ["--border-normal", "--border-thick", "--ring"],
		},
	],
	slots: [
		{
			name: "default",
			description: "Custom crumb markup (`<li>` items and separators) used when `items` is omitted.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	consumedTokens: [
		"--font-sans",
		"--text-sm",
		"--text-xs",
		"--text-body",
		"--leading-normal",
		"--weight-medium",
		"--fg-0",
		"--fg-2",
		"--fg-3",
		"--radius-sm",
		"--space-0",
		"--space-1",
		"--duration-fast",
		"--ease-standard",
		"--border-normal",
		"--border-thick",
		"--ring",
		...FULL_TONES.map((t) => `--${t}-vivid`),
	],
	composition: [
		"Place at the top of a page or panel, above the Heading, to anchor where the user is.",
		"Pair with a Link or Button `home` action for the root crumb when you need richer affordances than a plain anchor.",
		"For app chrome, sits naturally inside a Toolbar's start group.",
		"For an in-app trail (a crumb selects a node rather than navigating), give items a `value` instead of an `href` and listen for `select` (`detail: { value, index }`); the valued crumb is a keyboard-accessible button, so interactive breadcrumbs never need the slot.",
		"Slotted crumbs (the `items`-less default slot) are styled by the component in light-DOM mode, but in shadow mode `::slotted()` reaches only the top-level `<li>` (its layout), not the `<a>`/`<span>` inside; carry the trail in `items` when you want the component's link and current styling to reach every crumb.",
	],
	a11y: [
		"Renders a `<nav>` landmark with an accessible name (`aria-label`, default \"Breadcrumb\") so screen readers can jump to and announce the trail.",
		"The trail is an ordered list (`<ol>`), conveying sequence and position to assistive technology.",
		"The current page is plain text marked `aria-current=\"page\"`, not a link. It is the destination, not a navigation target.",
		"Separators are decorative and `aria-hidden`, so they are never read aloud between crumbs.",
		"Link focus is shown with a token ring plus a transparent outline that the forced-colors base rule promotes to a real system outline.",
		"An interactive crumb (an item with a `value`) is a real `<button>`, so it is a keyboard tab stop and activates on Enter and Space, not a `<span>` with a mouse-only handler.",
		"An item's `title` is a hover tooltip and the crumb's accessible description, so a shortened or glyph label keeps its full value reachable without changing the crumb's accessible name.",
	],
	examples: [
		{
			id: "trail",
			title: "A location trail",
			description: "An ordered trail of linked ancestors ending in the current page; tone and separator are adjustable.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
		{
			id: "interactive",
			title: "In-app crumbs (select, not navigate)",
			description: "Give a crumb a `value` instead of an `href` and it becomes a keyboard-accessible button that fires `select` with `{ value, index }`, so clicking an ancestor drives app state rather than following a URL.",
			source: { html: interactiveHtmlExample, svelte: interactiveSvelteExample, astro: interactiveAstroExample },
		},
		{
			id: "titles",
			title: "Shortened crumbs with hover detail",
			description: "A `title` on an item reveals the full value behind an abbreviated, truncated, or glyph label on hover, and carries it to assistive tech as the crumb's accessible description.",
			source: { html: titleHtmlExample, svelte: titleSvelteExample, astro: titleAstroExample },
		},
	],
};
