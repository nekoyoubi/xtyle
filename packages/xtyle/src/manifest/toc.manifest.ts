import type { ComponentManifest } from "./types.js";

const htmlExample = `<xtyle-toc
	label="On this page"
	sticky
	items='[{"id":"intro","label":"Intro"},{"id":"usage","label":"Usage"},{"id":"options","label":"Options","level":2},{"id":"api","label":"API"}]'
></xtyle-toc>`;

const svelteExample = `<script lang="ts">
	import { Toc } from "@xtyle/svelte";

	const items = [
		{ id: "intro", label: "Intro" },
		{ id: "usage", label: "Usage" },
		{ id: "options", label: "Options", level: 2 },
		{ id: "api", label: "API" },
	];
</script>

<Toc {items} label="On this page" sticky />`;

const astroExample = `---
import { Toc } from "@xtyle/astro";

// getHeadings() returns { depth, slug, text } per heading, which maps straight across
const items = Astro.props.headings.map((h) => ({ id: h.slug, label: h.text, level: h.depth - 1 }));
---

<Toc items={items} label="On this page" sticky />`;

export const tocManifest: ComponentManifest = {
	id: "toc",
	name: "Toc",
	category: "navigation",
	since: "0.1.0",
	keywords: ["table of contents", "on this page", "outline", "anchor nav", "jump links"],
	seeAlso: ["tree", "breadcrumb", "tabs"],
	summary: "An on-this-page table of contents that highlights the section currently in view.",
	description:
		"Toc lists the sections of a page as in-page links and tracks which one the reader is looking at. Give it `items`: each is an `id` matching a section's element id, a `label`, and an optional 1-based `level`, and it renders a labelled `nav` of anchor links. Entries deeper than the one before them nest inside it as a real sublist, so a two-level outline is structural rather than an indent an assistive reader can't see; a `level` that skips a depth is treated as one step down, which is what heading sources actually emit. An `IntersectionObserver` then marks the active link as you scroll, setting `aria-current` and the accent rail. The links work as plain anchor jumps with no script, and a clicked section still lights its entry without one, so the scrollspy is pure progressive enhancement. It reads as a vertical rail beside the content and folds into a wrapped row of chips on narrow screens. Pass `sticky` to keep it in view as the page scrolls.",
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
			name: "nested list",
			description: "A sublist of deeper entries, nested inside the `li` of the section it belongs to.",
			selector: ".xtyle-toc__list--nested",
			tokens: ["--space-4", "--fg-3", "--text-xs"],
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
			description: "The sections, each `{ id, label, level? }`; `id` matches the target element's id, `label` is the link text, and `level` is the 1-based outline depth (default 1) that decides nesting. On the custom element, a JSON string.",
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
			tokens: ["--accent-text", "--accent", "--weight-medium", "--accent-bg", "--fg-0"],
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
		"--space-4",
		"--space-5",
		"--fg-3",
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
		"`level` nests the list markup rather than indenting it, so a screen reader reports a subsection as a child of its section instead of a sibling.",
		"Every entry is a real in-page anchor link, so the table of contents works fully without JavaScript; the scrollspy only decorates it.",
		"With no script, the clicked section still highlights its own entry: a generated `:target` rule stands in for the scrollspy, and stands down as soon as the observer takes over.",
		"Links show keyboard focus with a `focus-visible` ring plus a transparent outline the forced-colors base rule promotes to a real system outline.",
	],
	examples: [
		{
			id: "a-scrollspy-table-of-contents",
			title: "A scrollspy table of contents",
			description: "A sticky rail of section links that tracks the section in view; entries carrying a deeper `level` nest under the one above them, and on narrow screens the whole thing folds into a wrapped row.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
	],
};
