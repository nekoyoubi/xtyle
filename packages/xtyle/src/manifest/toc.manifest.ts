import type { ComponentManifest } from "./types.js";

const htmlExample = `<xtyle-toc
	label="On this page"
	sticky
	items='[{"id":"intro","label":"Intro"},{"id":"usage","label":"Usage"},{"id":"api","label":"API"}]'
></xtyle-toc>`;

const svelteExample = `<script lang="ts">
	import { Toc } from "@xtyle/svelte";

	const items = [
		{ id: "intro", label: "Intro" },
		{ id: "usage", label: "Usage" },
		{ id: "api", label: "API" },
	];
</script>

<Toc {items} label="On this page" sticky />`;

const astroExample = `---
import { Toc } from "@xtyle/astro";

const items = [
	{ id: "intro", label: "Intro" },
	{ id: "usage", label: "Usage" },
	{ id: "api", label: "API" },
];
---

<Toc items={items} label="On this page" sticky />`;

export const tocManifest: ComponentManifest = {
	id: "toc",
	name: "Toc",
	category: "navigation",
	keywords: ["table of contents", "on this page", "outline", "anchor nav", "jump links"],
	seeAlso: ["tree", "breadcrumb", "tabs"],
	summary: "An on-this-page table of contents that highlights the section currently in view.",
	description:
		"Toc lists the sections of a page as in-page links and tracks which one the reader is looking at. Give it `items`: each is an `id` matching a section's element id plus a `label`, and it renders a labelled `nav` of anchor links. An `IntersectionObserver` then marks the active link as you scroll, setting `aria-current` and the accent rail. The links work as plain anchor jumps with no script, so the scrollspy is pure progressive enhancement. It reads as a vertical rail beside the content and folds into a wrapped row of chips on narrow screens. Pass `sticky` to keep it in view as the page scrolls.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "toc",
			description: "The `nav` root carrying the rail border and (optional) sticky positioning.",
			selector: ".xtyle-toc",
			tokens: ["--space-3", "--space-2", "--space-5", "--border-thin", "--line", "--radius-md", "--bg-1"],
		},
		{
			name: "label",
			description: "The small uppercase heading above the list.",
			selector: ".xtyle-toc__label",
			tokens: ["--font-sans", "--text-xs", "--weight-semibold", "--fg-2", "--space-2"],
		},
		{
			name: "link",
			description: "A section link with its accent rail when active and a focus ring.",
			selector: ".xtyle-toc__link",
			tokens: ["--font-sans", "--text-sm", "--fg-2", "--fg-0", "--border-thick", "--accent-text", "--accent", "--weight-medium", "--duration-fast", "--ease-standard", "--border-normal", "--ring", "--radius-sm", "--accent-bg"],
		},
	],
	props: [
		{
			name: "items",
			type: "TocItem[]",
			description: "The sections, each `{ id, label }`; `id` matches the target element's id, `label` is the link text. On the custom element, a JSON string.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "label",
			type: "string",
			default: "On this page",
			description: "The heading above the list.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "sticky",
			type: "boolean",
			default: "false",
			description: "Pins the nav with `position: sticky` so it stays in view while the page scrolls.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [],
	sizes: [],
	states: [
		{
			name: "active",
			description: "The link for the section currently in view: accent ink and rail, set alongside `aria-current`.",
			selector: ".xtyle-toc__link.is-active",
			tokens: ["--accent-text", "--accent", "--weight-medium", "--accent-bg"],
		},
		{
			name: "focus-visible",
			description: "Keyboard focus on a link: a token ring plus a transparent outline that becomes real in forced-colors mode.",
			selector: ".xtyle-toc__link:focus-visible",
			tokens: ["--border-normal", "--border-thick", "--ring", "--radius-sm"],
		},
	],
	slots: [],
	consumedTokens: [
		"--space-1",
		"--space-2",
		"--space-3",
		"--space-5",
		"--border-thin",
		"--border-thick",
		"--border-normal",
		"--line",
		"--font-sans",
		"--text-xs",
		"--text-sm",
		"--weight-semibold",
		"--weight-medium",
		"--fg-0",
		"--fg-2",
		"--accent",
		"--accent-text",
		"--accent-bg",
		"--ring",
		"--bg-1",
		"--radius-sm",
		"--radius-md",
		"--duration-fast",
		"--ease-standard",
	],
	composition: [
		"Place it in a sidebar column beside the content; pass `sticky` so it follows the scroll.",
		"Point each `item.id` at a section's element id so the in-page anchor and the scrollspy target line up.",
		"Pair with `Heading` sections that carry matching ids; the Toc is the map, the headings are the territory.",
	],
	a11y: [
		"The nav names itself (`aria-label`) and the active link carries `aria-current`, so assistive tech announces which section is in view.",
		"Every entry is a real in-page anchor link, so the table of contents works fully without JavaScript; the scrollspy only decorates it.",
		"Links show keyboard focus with a `focus-visible` ring plus a transparent outline the forced-colors base rule promotes to a real system outline.",
	],
	examples: [
		{
			id: "a-scrollspy-table-of-contents",
			title: "A scrollspy table of contents",
			description: "A sticky rail of section links that tracks the section in view; on narrow screens it folds into a wrapped row.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
	],
};
